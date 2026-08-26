use std::{
    collections::{HashMap, HashSet},
    fs,
    path::Path,
    process::Command,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
    time::{Duration, Instant},
};

use serde::{Deserialize, Serialize};
use tokio::{sync::Semaphore, task::JoinSet, time::sleep};
use uuid::Uuid;

use crate::scraper::models::{Nutrients, NutritionBasis, ParsedProduct, Serving, ServingSource};

type DynError = Box<dyn std::error::Error + Send + Sync>;

const OUTPUT_PATH: &str = "data/raw/kuper/";
const REQUEST_DELAY: Duration = Duration::from_millis(250);

const PRODUCT_CONCURRENT_REQUESTS: usize = 7;
const EAN_CONCURRENT_REQUESTS: usize = 1;

const RESTAURANT_PAGE_SIZE: usize = 15;
const RESTAURANT_CAP: usize = 75;

const NON_FOOD_CATEGORIES: &[&str] = &[
    "Снова в школу",
    "Сезон чистоты",
    "Здорово быть котом!",
    "Бытовая химия, уборка",
    "Косметика, гигиена",
    "Товары для животных",
    "Детские товары",
    "Дом, кухня",
    "Дача, сад",
    "Одежда, обувь, аксессуары",
    "Канцелярия, творчество, журналы",
    "Электроника, бытовая техника",
    "Товары для бани",
    "На дачу с питомцем",
    "Электроника, бытовая техника",
    "Зоотовары",
    "Кухня",
    "Дом, интерьер",
    "Бытовая техника, электроника",
    "Канцтовары, книги, творчество",
    "Одежда, аксессуары",
    "Спорт, туризм",
    "Ремонт, автотовары",
    "Мангалы, шампуры, уголь",
    "Семена, грунт, удобрения",
    "Сад, огород",
    "Отдых, игры, развлечения",
    "Электроника, бытовая техника",
    "Товары для бани",
    "На дачу с питомцем",
    "Канцелярия, творчество, книги",
    "Канцелярские товары",
    "Бумага, альбомы, конверты",
    "Офисные принадлежности",
    "Школьные принадлежности",
    "Книги, журналы",
    "Творчество, рукоделие",
    "Всё для ремонта",
    "Автотовары",
    "Масла, технические жидкости",
    "Автозапчасти, аксессуары",
    "Шины, диски",
    "Спорт, активный отдых",
    "Отдых на природе, туризм",
    "Плавание",
];

const SAVED_STORES: [KuperStore; 14] = [
    KuperStore::Pyatorochka,
    KuperStore::Globus,
    KuperStore::Ashan,
    KuperStore::Lenta,
    KuperStore::Perekrestok,
    KuperStore::AzbukaVkusa,
    KuperStore::Spar,
    KuperStore::Vkusvill,
    KuperStore::Magnoliya,
    KuperStore::Dobrininskii,
    KuperStore::UPalicha,
    KuperStore::Magnit,
    KuperStore::Okey,
    KuperStore::Metro,
];

pub enum KuperStore {
    Pyatorochka,
    Globus,
    Ashan,
    Lenta,
    Perekrestok,
    AzbukaVkusa,
    Spar,
    Vkusvill,
    Magnoliya,
    Dobrininskii,
    UPalicha,
    Magnit,
    Okey,
    Metro,
    Restaurant,
}

impl KuperStore {
    fn info(&self) -> (u64, &'static str) {
        match self {
            KuperStore::Pyatorochka => (26238, "Pyatorochka"),
            KuperStore::Globus => (122409, "Globus"),
            KuperStore::Ashan => (983, "Ashan"),
            KuperStore::Lenta => (135381, "Lenta"),
            KuperStore::Perekrestok => (239791, "Perekrestok"),
            KuperStore::AzbukaVkusa => (188252, "Azbuka Vkusa"),
            KuperStore::Spar => (241132, "Spar"),
            KuperStore::Vkusvill => (196326, "Vkusvill"),
            KuperStore::Magnoliya => (132942, "Magnoliya"),
            KuperStore::Dobrininskii => (148757, "Dobrininskii"),
            KuperStore::UPalicha => (2439, "UPalicha"),
            KuperStore::Magnit => (3658, "Magnit"),
            KuperStore::Okey => (12924, "Okey"),
            KuperStore::Metro => (12, "Metro"),
            KuperStore::Restaurant => (69, "Restaurants"),
        }
    }

    pub fn id(&self) -> u64 {
        self.info().0
    }

    pub fn display_name(&self) -> &'static str {
        self.info().1
    }
}

struct KuperClient {
    anonymous_id: String,
    store: KuperStore,
}

impl KuperClient {
    fn curl_args(&self) -> Vec<String> {
        let client_token = std::env::var("KUPER_CLIENT_TOKEN").expect("KUPER_CLIENT_TOKEN not set");
        let cookie = std::env::var("KUPER_COOKIE").expect("KUPER_COOKIE not set");
        let sentry_trace = std::env::var("KUPER_SENTRY_TRACE").expect("KUPER_SENTRY_TRACE not set");
        let baggage = std::env::var("KUPER_BAGGAGE").expect("KUPER_BAGGAGE not set");

        vec![
            "--http1.1".into(),
            "--compressed".into(),
            "-H".into(),
            "client-id: KuperAndroid".into(),
            "-H".into(),
            format!("client-token: {client_token}"),
            "-H".into(),
            "client-ver: 17.4.71".into(),
            "-H".into(),
            "user-agent: Storefront/17.4.71 (sdk_gphone64_arm64; Android 13)".into(),
            "-H".into(),
            "client-bundleid: ru.instamart".into(),
            "-H".into(),
            "cache-control: no-store".into(),
            "-H".into(),
            "anonymousid: ".to_owned() + &self.anonymous_id,
            "-H".into(),
            "client-buildtype: rustore".into(),
            "-H".into(),
            "client-nativever: 17.4.71".into(),
            "-H".into(),
            "x-trace-flags: 0".into(),
            "-H".into(),
            "api-version: 2.2".into(),
            "-H".into(),
            "backenduseruuid: ".into(),
            "-H".into(),
            "user-uuid: ".into(),
            "-H".into(),
            "show-ads: false".into(),
            "-H".into(),
            format!("sentry-trace: {sentry_trace}"),
            "-H".into(),
            format!("baggage: {baggage}"),
            "-H".into(),
            format!("cookie: {cookie}"),
        ]
    }

    async fn curl_get(&self, url: &str, extra_headers: &[&str]) -> Result<String, DynError> {
        let mut args = self.curl_args();

        for header in extra_headers {
            args.push("-H".into());
            args.push((*header).into());
        }

        args.push(url.into());

        let output = Command::new("curl").args(&args).output()?;

        if !output.status.success() {
            return Err(format!("curl failed with status {}", output.status).into());
        }

        Ok(String::from_utf8(output.stdout)?)
    }

    async fn curl_post(
        &self,
        url: &str,
        body: &str,
        extra_headers: &[&str],
    ) -> Result<String, DynError> {
        let mut args = self.curl_args();

        args.extend([
            "-X".into(),
            "POST".into(),
            "-H".into(),
            "content-type: application/json".into(),
        ]);

        for header in extra_headers {
            args.push("-H".into());
            args.push((*header).into());
        }

        args.extend(["-d".into(), body.into(), url.into()]);

        let output = Command::new("curl").args(&args).output()?;

        if !output.status.success() {
            return Err(format!(
                "curl failed with status {}: {}",
                output.status,
                String::from_utf8_lossy(&output.stderr)
            )
            .into());
        }

        Ok(String::from_utf8(output.stdout)?)
    }
}

// Progress tracking

#[derive(Clone)]
struct Progress {
    total_products: usize,
    total_operations: usize,
    started_at: Arc<Instant>,
    product_done: Arc<AtomicUsize>,
    product_failed: Arc<AtomicUsize>,
    eans_done: Arc<AtomicUsize>,
    eans_failed: Arc<AtomicUsize>,
    last_reported_operations: Arc<AtomicUsize>,
    progress_step: usize,
}

impl Progress {
    fn new(total_products: usize) -> Self {
        Self {
            total_products,
            total_operations: total_products * 2,
            started_at: Arc::new(Instant::now()),
            product_done: Arc::new(AtomicUsize::new(0)),
            product_failed: Arc::new(AtomicUsize::new(0)),
            eans_done: Arc::new(AtomicUsize::new(0)),
            eans_failed: Arc::new(AtomicUsize::new(0)),
            last_reported_operations: Arc::new(AtomicUsize::new(0)),
            progress_step: 50,
        }
    }

    fn product_succeeded(&self) {
        self.product_done.fetch_add(1, Ordering::Relaxed);
    }

    fn product_failed(&self) {
        self.product_failed.fetch_add(1, Ordering::Relaxed);
    }

    fn eans_succeeded(&self) {
        self.eans_done.fetch_add(1, Ordering::Relaxed);
    }

    fn eans_failed(&self) {
        self.eans_failed.fetch_add(1, Ordering::Relaxed);
    }

    fn product_done(&self) -> usize {
        self.product_done.load(Ordering::Relaxed)
    }

    fn product_failed_count(&self) -> usize {
        self.product_failed.load(Ordering::Relaxed)
    }

    fn eans_done(&self) -> usize {
        self.eans_done.load(Ordering::Relaxed)
    }

    fn eans_failed_count(&self) -> usize {
        self.eans_failed.load(Ordering::Relaxed)
    }

    fn operations_done(&self) -> usize {
        self.product_done() + self.eans_done()
    }

    fn operations_per_second(&self) -> f64 {
        let elapsed = self.started_at.elapsed().as_secs_f64();

        if elapsed > 0.0 {
            self.operations_done() as f64 / elapsed
        } else {
            0.0
        }
    }

    fn percent(&self) -> f64 {
        if self.total_operations == 0 {
            100.0
        } else {
            self.operations_done() as f64 / self.total_operations as f64 * 100.0
        }
    }

    fn remaining_operations(&self) -> usize {
        self.total_operations.saturating_sub(self.operations_done())
    }

    fn eta_seconds(&self) -> f64 {
        let operations_per_second = self.operations_per_second();

        if operations_per_second > 0.0 {
            self.remaining_operations() as f64 / operations_per_second
        } else {
            0.0
        }
    }

    fn should_report(&self, completed_tasks: usize) -> bool {
        let operations_done = self.operations_done();
        let last_reported = self.last_reported_operations.load(Ordering::Relaxed);

        operations_done >= last_reported + self.progress_step
            || completed_tasks >= self.total_products
    }

    fn report_if_needed(&self, store_name: &str, completed_tasks: usize) {
        if !self.should_report(completed_tasks) {
            return;
        }

        let operations_done = self.operations_done();

        self.last_reported_operations
            .store(operations_done, Ordering::Relaxed);

        println!(
            "[{}] ops={}/{} ({:.1}%) \
             | products={}/{} \
             | eans={}/{} \
             | failed_product={} \
             | failed_eans={} \
             | {:.2} ops/s \
             | ETA={:.0}s",
            store_name,
            operations_done,
            self.total_operations,
            self.percent(),
            self.product_done(),
            self.total_products,
            self.eans_done(),
            self.total_products,
            self.product_failed_count(),
            self.eans_failed_count(),
            self.operations_per_second(),
            self.eta_seconds(),
        );
    }

    fn elapsed_seconds(&self) -> f64 {
        self.started_at.elapsed().as_secs_f64()
    }

    fn print_final(&self, store_name: &str, fetched_products: usize, discovered_skus: usize) {
        let operations_done = self.operations_done();
        let elapsed = self.elapsed_seconds();
        let operations_per_second = self.operations_per_second();

        println!("\n[{}] Finished", store_name);

        println!(
            "[{}] Product requests: {}/{} successful, {} failed",
            store_name,
            self.product_done(),
            self.total_products,
            self.product_failed_count(),
        );

        println!(
            "[{}] EAN crawls: {}/{} successful, {} failed",
            store_name,
            self.eans_done(),
            self.total_products,
            self.eans_failed_count(),
        );

        println!(
            "[{}] Fetched product details: {}/{}",
            store_name, fetched_products, self.total_products,
        );

        println!(
            "[{}] Discovered SKUs with EANs: {}",
            store_name, discovered_skus,
        );

        println!(
            "[{}] Operations: {}/{} | {:.2} ops/s | {:.1}s elapsed",
            store_name, operations_done, self.total_operations, operations_per_second, elapsed,
        );
    }
}

// Kuper API models

#[derive(Debug, Deserialize)]
struct StoreCatalogueResponse {
    taxons: StoreCatalogueTaxons,
}

#[derive(Debug, Deserialize)]
struct StoreCatalogueTaxons {
    taxons: Vec<KuperCatalogueTaxon>,
}

#[derive(Debug, Deserialize)]
struct KuperCatalogueTaxon {
    id: u64,
    name: String,
    children: Vec<KuperCatalogueTaxon>,
}

#[derive(Debug, Deserialize)]
struct ProductsTaxonResponse {
    entities: Vec<KuperCategoryProduct>,
    meta: ProductsMeta,
}

#[derive(Debug, Deserialize)]
struct KuperCategoryProduct {
    id: u64,
    sku: String,
}

#[derive(Debug, Deserialize)]
struct ProductsMeta {
    products_total_count: u64,
}

#[derive(Debug, Deserialize)]
pub struct ProductResponse {
    pub product: KuperProduct,
}

#[derive(Debug, Deserialize)]
pub struct KuperProduct {
    pub brand: Option<KuperBrand>,
    pub items_per_pack: Option<i32>,
    pub main_taxon: Option<KuperTaxon>,
    pub name: String,
    pub properties: Vec<KuperProperty>,
    pub sku: u64,
    pub volume: Option<f64>,
    pub volume_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct KuperBrand {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct KuperTaxon {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct KuperProperty {
    pub presentation: String,
    pub value: String,
}

#[derive(Debug, Serialize)]
struct RecsRequest {
    req_id: String,
    context: RecsContext,
    ext: RecsExt,
}

#[derive(Debug, Serialize)]
struct RecsContext {
    user: RecsUser,
    app: RecsApp,
    device: RecsDevice,
}

#[derive(Debug, Serialize)]
struct RecsUser {
    geo: Geo,
    ext: UserExt,
}

#[derive(Debug, Serialize)]
struct Geo {
    lat: f64,
    lon: f64,
}

#[derive(Debug, Serialize)]
struct UserExt {
    anonymous_id: String,
}

#[derive(Debug, Deserialize)]
struct RecsBlock {
    ext: RecsBlockExt,
    media: Vec<RecommendedProduct>,
}

#[derive(Debug, Deserialize)]
struct RecsBlockExt {
    paging: PagingResponse,
}

#[derive(Debug, Deserialize)]
struct PagingResponse {
    current_page: u32,
    next_page: Option<u32>,
    per_page: u32,
    remaining_count: u32,
    total_count: u32,
    total_pages: u32,
}

#[derive(Debug, Deserialize)]
struct RecommendedProduct {
    id: u64,
    sku: String,
    retailer_sku: String,
    eans: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
struct PagingRequest {
    limit: u32,
    offset: u32,
}
#[derive(Debug, Serialize)]
struct RecsApp {
    domain: String,
    ext: AppExt,
}

#[derive(Debug, Serialize)]
struct AppExt {
    store_id: u64,
    tenant_id: u64,
    tenant_name: String,
    skus: Vec<String>,
}

#[derive(Debug, Serialize)]
struct RecsDevice {
    platform: String,
}

#[derive(Debug, Serialize)]
struct RecsExt {
    place: String,
    paging: PagingRequest,
}

#[derive(Debug, Deserialize)]
struct RestaurantsResponse {
    restaurants: Vec<KuperRestaurant>,
    meta: RestaurantsMeta,
}

#[derive(Debug, Deserialize)]
pub struct KuperRestaurantProduct {
    pub items_per_pack: Option<i32>,
    pub main_taxon: Option<KuperTaxon>,
    pub name: String,
    pub properties: Vec<KuperProperty>,
    pub sku: String,
    pub volume: Option<f64>,
    pub volume_type: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RestaurantsMeta {
    current_page: u32,
    next_page: Option<u32>,
    total_pages: u32,
    total_count: u32,
}

#[derive(Debug, Deserialize)]
pub struct KuperRestaurant {
    pub id: u64,
    pub retailer: KuperRestaurantRetailer,
}

#[derive(Debug, Deserialize)]
pub struct KuperRestaurantRetailer {
    pub name: String,
}

#[derive(Debug, Deserialize)]
struct RestaurantDepartmentsResponse {
    departments: Vec<RestaurantDepartment>,
}

#[derive(Debug, Deserialize)]
struct RestaurantDepartment {
    products: Vec<RestaurantProduct>,
}

#[derive(Debug, Deserialize)]
pub struct RestaurantResponse {
    pub product: KuperRestaurantProduct,
}

#[derive(Debug, Deserialize)]
struct RestaurantProduct {
    id: u64,
    sku: String,
    name: String,
    volume: Option<f64>,
    volume_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParsedRestaurantProduct {
    pub restaurant_id: u64,
    pub restaurant_name: String,
    pub sku: String,
    pub id: u64,
    pub name: String,
    pub weight: Option<f64>,
    pub unit: Option<String>,
}

// Aplication models

#[derive(Debug, Clone)]
struct KuperCategory {
    pub id: u64,
    pub name: String,
    pub parent_name: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct KuperIntermediateProduct {
    product: ParsedProduct,
    sku: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductWithEans {
    pub store_id: u64,
    pub eans: Vec<String>,
    pub id: String,
    pub sku: String,
    pub retailer_sku: String,
}

// Parsing utils

fn parse_nutrient(nutrient_str: String) -> Option<i32> {
    nutrient_str
        .split_whitespace()
        .next()
        .and_then(|v| v.parse::<f64>().ok())
        .map(|v| (v * 100.0) as i32)
}

fn parse_fetched_product(
    product: ProductResponse,
    eans: Vec<String>,
    store_name: String,
) -> KuperIntermediateProduct {
    let brand = product
        .product
        .brand
        .map(|brand| brand.name)
        .unwrap_or("Unknown".to_string());

    let category = product.product.main_taxon.map(|taxon| taxon.name);

    let binding = product.product.volume_type.unwrap_or("g".to_string());
    let product_unit = binding.as_str();

    let intermediate_unit: String = match product_unit {
        "g" => "гр".into(),
        "l" => "л".into(),
        "kg" => "кг".into(),
        "ml" => "мл".into(),
        _ => "гр".into(),
    };

    let product_weight = product.product.volume.unwrap_or(100.0);

    let weight: i32 = match intermediate_unit.as_str() {
        "л" | "кг" => (product_weight * 1000.0) as i32,
        _ => product_weight as i32,
    };

    let unit: String = match product_unit {
        "g" => "гр".into(),
        "l" => "мл".into(),
        "kg" => "гр".into(),
        "ml" => "мл".into(),
        _ => "гр".into(),
    };

    let mut ingredients = None;
    let mut nutrients = Nutrients {
        calories: None,
        fats: None,
        carbohydrates: None,
        proteins: None,
    };

    for property in product.product.properties {
        match property.presentation.as_str() {
            "Состав" => ingredients = Some(property.value),
            "Жиры" => nutrients.fats = parse_nutrient(property.value),
            "Белки" => nutrients.proteins = parse_nutrient(property.value),
            "Калорийность" => nutrients.calories = parse_nutrient(property.value),
            "Углеводы" => nutrients.carbohydrates = parse_nutrient(property.value),
            _ => {}
        }
    }

    let mut servings = vec![Serving {
        name: "Упаковка".into(),
        amount: 1.0,
        unit: "package".into(),
        weight: Some(weight),
        pieces: product.product.items_per_pack.unwrap_or(1),
        source: ServingSource::Explicit,
    }];

    if let Some(items) = product.product.items_per_pack {
        if items > 1 {
            servings.push(Serving {
                name: "Штука".into(),
                amount: 1.0,
                unit: "piece".into(),
                weight: Some(weight / items),
                pieces: 1,
                source: ServingSource::Explicit,
            })
        }
    }

    KuperIntermediateProduct {
        product: ParsedProduct {
            name: product.product.name,
            brand,
            category,
            sources: vec![store_name],
            barcodes: eans,
            nutrition_basis: NutritionBasis {
                weight,
                unit,
                ingredients,
                allergens: None,
                nutrients,
            },
            servings,
        },
        sku: product.product.sku.to_string(),
    }
}

// Catalogue

fn all_products_taxons(taxons: &[KuperCatalogueTaxon]) -> Vec<KuperCategory> {
    fn walk(
        taxon: &KuperCatalogueTaxon,
        root_name: &str,
        parent_name: Option<&str>,
        result: &mut Vec<KuperCategory>,
    ) {
        if NON_FOOD_CATEGORIES.contains(&root_name) {
            return;
        }

        if taxon.name == "Все товары категории" {
            if let Some(parent_name) = parent_name {
                result.push(KuperCategory {
                    id: taxon.id,
                    name: taxon.name.clone(),
                    parent_name: parent_name.to_string(),
                });
            }

            return;
        }

        for child in &taxon.children {
            walk(child, root_name, Some(&taxon.name), result);
        }
    }

    let mut result = Vec::new();

    for taxon in taxons {
        if !NON_FOOD_CATEGORIES.contains(&taxon.name.as_str()) {
            walk(taxon, &taxon.name, None, &mut result);
        }
    }

    result
}

async fn fetch_store_categories(client: &KuperClient) -> Result<Vec<KuperCategory>, DynError> {
    let url = format!(
        "https://api.kuper.ru/v2/store-catalogue?sid={}",
        client.store.id()
    );

    let text = client.curl_get(&url, &["screenname: HomeScreen"]).await?;

    let response: StoreCatalogueResponse = serde_json::from_str(&text)?;

    Ok(all_products_taxons(&response.taxons.taxons))
}

async fn fetch_category_products(
    client: &KuperClient,
    category: &KuperCategory,
) -> Result<Vec<KuperCategoryProduct>, DynError> {
    if NON_FOOD_CATEGORIES.contains(&category.parent_name.as_str()) {
        println!("Skipped {}", category.parent_name);
        return Ok(vec![]);
    }

    const PAGE_SIZE: u64 = 24;

    let mut products = Vec::new();
    let mut offset = 0u64;
    let mut page = 1u64;

    loop {
        let response = fetch_products_page(client, category.id, offset).await?;

        let entity_count = response.entities.len();

        for entity in response.entities {
            products.push(entity);
        }

        println!(
            "[{}] category={} | page={} | offset={} | fetched={} | total saved={:?}",
            client.store.display_name(),
            category.parent_name,
            page,
            offset,
            entity_count,
            &products.len(),
        );

        let next_offset = offset + PAGE_SIZE;

        if next_offset > response.meta.products_total_count {
            break;
        }

        offset = next_offset;
        page += 1;

        sleep(REQUEST_DELAY).await;
    }

    Ok(products)
}

async fn fetch_products_page(
    client: &KuperClient,
    taxon_id: u64,
    products_offset: u64,
) -> Result<ProductsTaxonResponse, DynError> {
    let url = format!(
        "https://api.kuper.ru/v2/catalog/entities\
?limit=24\
&products_offset={}\
&sort=popularity\
&ads_identity.ads_promo_identity.site_uid=cb63e6fgp3mv39a3aa6g\
&ads_identity.ads_promo_identity.placement_uid=cns3hnv11oascrif098g\
&ads_identity.ads_banner_identity.site_uid=cb63e6fgp3mv39a3aa6g\
&ads_identity.ads_banner_identity.placement_uid=cb63h53hekj4m7n3keqg\
&sid={}\
&tid={}",
        products_offset,
        client.store.id(),
        taxon_id,
    );

    let text = client
        .curl_get(&url, &["screenname: ProductsScreen"])
        .await?;

    Ok(serde_json::from_str(&text)?)
}

// Ean (barcode) discovery

async fn fetch_recommendation_page(
    client: &KuperClient,
    sku: &str,
    offset: u32,
) -> Result<RecsBlock, DynError> {
    let body = RecsRequest {
        req_id: Uuid::new_v4().to_string(),

        context: RecsContext {
            user: RecsUser {
                geo: Geo {
                    lat: 55.750889,
                    lon: 37.618362,
                },
                ext: UserExt {
                    anonymous_id: client.anonymous_id.clone(),
                },
            },

            app: RecsApp {
                domain: "ru.instamart".to_string(),

                ext: AppExt {
                    store_id: client.store.id(),
                    tenant_id: 0,
                    tenant_name: "sbermarket".to_string(),
                    skus: vec![sku.to_string()],
                },
            },

            device: RecsDevice {
                platform: "ANDROID".to_string(),
            },
        },

        ext: RecsExt {
            place: "product_card".to_string(),

            paging: PagingRequest { limit: 12, offset },
        },
    };

    let body = serde_json::to_string(&body)?;

    let text = client
        .curl_post(
            "https://api.kuper.ru/v2/simple-recs/v4/card/4/",
            &body,
            &["screenname: ProductScreen"],
        )
        .await?;

    if text.trim().is_empty() {
        return Err(format!(
            "Kuper returned empty response for SKU={} offset={}",
            sku, offset
        )
        .into());
    }

    Ok(serde_json::from_str(&text)?)
}

async fn fetch_product_eans_for_sku(
    client: &KuperClient,
    sku: &str,
) -> Result<Vec<ProductWithEans>, DynError> {
    let mut result = Vec::new();
    let mut offset = 0u32;

    loop {
        let response = fetch_recommendation_page(client, sku, offset).await?;

        let paging = &response.ext.paging;

        println!(
            "[{}] SKU={} | offset={} | page={}/{} | next={:?} | total={} | remaining={}",
            client.store.display_name(),
            sku,
            offset,
            paging.current_page,
            paging.total_pages,
            paging.next_page,
            paging.total_count,
            paging.remaining_count,
        );

        for product in response.media {
            result.push(ProductWithEans {
                store_id: client.store.id(),
                eans: product.eans.unwrap_or_default(),
                id: product.id.to_string(),
                sku: product.sku,
                retailer_sku: product.retailer_sku,
            });
        }

        if paging.next_page.is_none() {
            break;
        }

        if paging.per_page == 0 {
            return Err("Kuper returned per_page=0".into());
        }

        let next_offset = offset + paging.per_page;

        if next_offset <= offset {
            return Err("Kuper pagination offset did not advance".into());
        }

        offset = next_offset;

        sleep(REQUEST_DELAY).await;
    }

    Ok(result)
}

// Persistance, utils

fn convert_portion_to_per_100g(portion_value: Option<i32>, portion_weight: i32) -> Option<i32> {
    let portion_value = portion_value?;

    if portion_weight <= 0 {
        return None;
    }

    Some(((portion_value as f64 * 100.0) / portion_weight as f64) as i32)
}

fn parse_restaurant_product(
    product: KuperRestaurantProduct,
    restaurant_name: &str,
) -> KuperIntermediateProduct {
    let unit = product.volume_type.unwrap_or_else(|| "g".to_string());

    let weight = product
        .volume
        .map(|volume| match unit.as_str() {
            "kg" | "l" => (volume * 1000.0) as i32,
            _ => volume as i32,
        })
        .unwrap_or(100);

    let normalized_unit = match unit.as_str() {
        "g" | "kg" => "гр",
        "ml" | "l" => "мл",
        _ => "гр",
    }
    .to_string();

    let mut nutrients = Nutrients {
        calories: None,
        proteins: None,
        fats: None,
        carbohydrates: None,
    };

    let mut portion_nutrients = Nutrients {
        calories: None,
        proteins: None,
        fats: None,
        carbohydrates: None,
    };

    let mut ingredients = None;

    for property in product.properties {
        match property.presentation.as_str() {
            "Белки" => {
                nutrients.proteins = parse_nutrient(property.value);
            }

            "Жиры" => {
                nutrients.fats = parse_nutrient(property.value);
            }

            "Углеводы" => {
                nutrients.carbohydrates = parse_nutrient(property.value);
            }

            "Калорийность" => {
                nutrients.calories = parse_nutrient(property.value);
            }

            "Содержание белков на порцию" => {
                portion_nutrients.proteins = parse_nutrient(property.value);
            }

            "Содержание жиров на порцию" => {
                portion_nutrients.fats = parse_nutrient(property.value);
            }

            "Содержание углеводов на порцию" => {
                portion_nutrients.carbohydrates = parse_nutrient(property.value);
            }

            "Энергетическая ценность на порцию" => {
                portion_nutrients.calories = parse_nutrient(property.value);
            }

            "Состав" => {
                ingredients = Some(property.value);
            }

            _ => {}
        }
    }

    if nutrients.proteins.is_none() {
        nutrients.proteins = convert_portion_to_per_100g(portion_nutrients.proteins, weight);
    }

    if nutrients.fats.is_none() {
        nutrients.fats = convert_portion_to_per_100g(portion_nutrients.fats, weight);
    }

    if nutrients.carbohydrates.is_none() {
        nutrients.carbohydrates =
            convert_portion_to_per_100g(portion_nutrients.carbohydrates, weight);
    }

    if nutrients.calories.is_none() {
        nutrients.calories = convert_portion_to_per_100g(portion_nutrients.calories, weight);
    }

    KuperIntermediateProduct {
        sku: product.sku.clone(),

        product: ParsedProduct {
            name: product.name,
            brand: restaurant_name.to_string(),
            category: product.main_taxon.map(|taxon| taxon.name),
            sources: vec![restaurant_name.to_string()],
            barcodes: vec![],
            nutrition_basis: NutritionBasis {
                weight,
                unit: normalized_unit,
                ingredients,
                allergens: None,
                nutrients,
            },
            servings: vec![Serving {
                name: "Упаковка".into(),
                amount: 1.0,
                unit: "package".into(),
                weight: Some(weight),
                pieces: product.items_per_pack.unwrap_or(1),
                source: ServingSource::Explicit,
            }],
        },
    }
}

fn save_intermediate_products(store_id: u64, products: &[KuperIntermediateProduct]) {
    let path = format!("{}{}/intermediate.json", OUTPUT_PATH, store_id);
    let path = Path::new(&path);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("failed to create Kuper output directory");
    }

    let json = serde_json::to_string_pretty(products).expect("failed to serialize ParsedProducts");

    fs::write(path, json).expect("failed to write intermediate.json");
}

fn save_restaurant_products(products: &[KuperIntermediateProduct], store_id: u64) {
    let path = format!("{}/{}/intermediate.json", OUTPUT_PATH, store_id);
    let path = Path::new(&path);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("failed to create Kuper restaurants output directory");
    }

    let json = serde_json::to_string_pretty(products)
        .expect("failed to serialize restaurant intermediate products");

    fs::write(path, json).expect("failed to write restaurant intermediate.json");

    println!(
        "[Restaurants] Saved {} intermediate products to {}",
        products.len(),
        path.display()
    );
}

fn merge_products_by_name(products: Vec<ParsedProduct>) -> Vec<ParsedProduct> {
    let initial_len = products.len();

    let mut merged: HashMap<String, ParsedProduct> = HashMap::new();

    for incoming in products {
        let name = incoming.name.clone();

        match merged.entry(name) {
            std::collections::hash_map::Entry::Vacant(entry) => {
                entry.insert(incoming);
            }

            std::collections::hash_map::Entry::Occupied(mut entry) => {
                let existing = entry.get_mut();

                for source in incoming.sources {
                    if !existing.sources.contains(&source) {
                        existing.sources.push(source);
                    }
                }

                for barcode in incoming.barcodes {
                    if !existing.barcodes.contains(&barcode) {
                        existing.barcodes.push(barcode);
                    }
                }

                if existing.brand == "Unknown" && incoming.brand != "Unknown" {
                    existing.brand = incoming.brand;
                }

                if existing.category.is_none() {
                    existing.category = incoming.category;
                }

                if existing.nutrition_basis.ingredients.is_none() {
                    existing.nutrition_basis.ingredients = incoming.nutrition_basis.ingredients;
                }

                if existing.nutrition_basis.allergens.is_none() {
                    existing.nutrition_basis.allergens = incoming.nutrition_basis.allergens;
                }

                let existing_nutrients = &mut existing.nutrition_basis.nutrients;
                let incoming_nutrients = incoming.nutrition_basis.nutrients;

                if existing_nutrients.calories.is_none() {
                    existing_nutrients.calories = incoming_nutrients.calories;
                }

                if existing_nutrients.proteins.is_none() {
                    existing_nutrients.proteins = incoming_nutrients.proteins;
                }

                if existing_nutrients.fats.is_none() {
                    existing_nutrients.fats = incoming_nutrients.fats;
                }

                if existing_nutrients.carbohydrates.is_none() {
                    existing_nutrients.carbohydrates = incoming_nutrients.carbohydrates;
                }
            }
        }
    }

    println!(
        "length before name merge: {}, after name merge: {}",
        initial_len,
        merged.len()
    );

    merged.into_values().collect()
}

fn merge_products_by_sku() -> HashMap<String, ParsedProduct> {
    let mut merged: HashMap<String, ParsedProduct> = HashMap::new();
    let mut init_len = 0;

    let mut iter_stores: Vec<KuperStore> = SAVED_STORES.into();
    iter_stores.extend(vec![KuperStore::Restaurant]);

    for store in iter_stores {
        let store_id = store.id();
        let path = format!("{}{}/intermediate.json", OUTPUT_PATH, store_id);

        let data = match fs::read_to_string(&path) {
            Ok(data) => data,
            Err(error) => {
                eprintln!(
                    "[{}] Failed to read intermediate.json: {}",
                    store.display_name(),
                    error
                );
                continue;
            }
        };

        let products: Vec<KuperIntermediateProduct> = match serde_json::from_str(&data) {
            Ok(products) => products,
            Err(error) => {
                eprintln!(
                    "[{}] Failed to parse intermediate.json: {}",
                    store.display_name(),
                    error
                );
                continue;
            }
        };

        println!(
            "[{}] Loaded {} products from intermediate.json",
            store.display_name(),
            products.len()
        );

        init_len += products.len();

        for intermediate in products {
            let sku = intermediate.sku;
            let incoming = intermediate.product;

            match merged.entry(sku) {
                std::collections::hash_map::Entry::Vacant(entry) => {
                    entry.insert(incoming);
                }

                std::collections::hash_map::Entry::Occupied(mut entry) => {
                    let existing = entry.get_mut();

                    // Merge store sources.
                    for store_id in incoming.sources {
                        if !existing.sources.contains(&store_id) {
                            existing.sources.push(store_id);
                        }
                    }

                    // Merge barcodes.
                    for barcode in incoming.barcodes {
                        if !existing.barcodes.contains(&barcode) {
                            existing.barcodes.push(barcode);
                        }
                    }
                }
            }
        }
    }

    println!(
        "length before merge: {}, after merge: {:?}",
        init_len,
        merged.len()
    );
    merged
}

// main fetching fns

async fn fetch_product(
    client: &KuperClient,
    product_id: &str,
) -> Result<ProductResponse, DynError> {
    let url = format!("https://api.kuper.ru/v2/multicards/{product_id}");

    let text = client
        .curl_get(&url, &["screenname: PRODUCT_STACK"])
        .await?;

    Ok(serde_json::from_str(&text)?)
}

async fn fetch_product_and_eans(
    client: Arc<KuperClient>,
    sku: String,
    product_id: String,
    product_limiter: Arc<Semaphore>,
    ean_limiter: Arc<Semaphore>,
    progress: Progress,
) -> (
    String,
    Result<ProductResponse, DynError>,
    Result<Vec<ProductWithEans>, DynError>,
) {
    let product_client = Arc::clone(&client);
    let product_limiter = Arc::clone(&product_limiter);
    let product_progress = progress.clone();

    let product_sku = sku.clone();
    let product_id_for_request = product_id;

    let product_future = async move {
        let _permit = product_limiter
            .acquire_owned()
            .await
            .expect("product limiter semaphore closed");

        let response = fetch_product(&product_client, &product_id_for_request).await;

        match &response {
            Ok(_) => {
                product_progress.product_succeeded();
            }

            Err(error) => {
                product_progress.product_failed();

                eprintln!(
                    "[{}] Failed to fetch product {} (SKU {}): {}",
                    product_client.store.display_name(),
                    product_id_for_request,
                    product_sku,
                    error
                );
            }
        }

        response
    };

    // EAN crawl

    let ean_client = Arc::clone(&client);
    let ean_limiter = Arc::clone(&ean_limiter);
    let ean_progress = progress.clone();

    let ean_sku = sku.clone();

    let eans_future = async move {
        let _permit = ean_limiter
            .acquire_owned()
            .await
            .expect("EAN limiter semaphore closed");

        let response = fetch_product_eans_for_sku(&ean_client, &ean_sku).await;

        match &response {
            Ok(_) => {
                ean_progress.eans_succeeded();
            }

            Err(error) => {
                ean_progress.eans_failed();

                eprintln!(
                    "[{}] Failed to fetch EANs for SKU {}: {}",
                    ean_client.store.display_name(),
                    ean_sku,
                    error
                );
            }
        }

        response
    };

    let (product_result, eans_result) = tokio::join!(product_future, eans_future);

    (sku, product_result, eans_result)
}

// Restaurants discovery and crawling

async fn fetch_restaurants_page(
    client: &KuperClient,
    page: u32,
) -> Result<RestaurantsResponse, DynError> {
    let url = format!(
        "https://api.kuper.ru/v2/restaurants\
?lat=55.750889\
&lon=37.618362\
&page={}\
&per_page={}\
&include%5B%5D=latest_order",
        page, RESTAURANT_PAGE_SIZE,
    );

    let text = client
        .curl_get(&url, &["screenname: RESTAURANTS_LIST"])
        .await?;

    if text.trim().is_empty() {
        return Err(format!("Kuper returned empty restaurant response for page={}", page).into());
    }

    Ok(serde_json::from_str(&text)?)
}

async fn fetch_restaurants(client: &KuperClient) -> Result<Vec<KuperRestaurant>, DynError> {
    let mut restaurants = Vec::with_capacity(RESTAURANT_CAP);

    let mut page = 1u32;

    while restaurants.len() < RESTAURANT_CAP {
        let response = fetch_restaurants_page(client, page).await?;

        println!(
            "[{}] Restaurant page={}/{} | fetched={} | total={}",
            client.store.display_name(),
            response.meta.current_page,
            response.meta.total_pages,
            response.restaurants.len(),
            response.meta.total_count,
        );

        let remaining = RESTAURANT_CAP - restaurants.len();

        restaurants.extend(response.restaurants.into_iter().take(remaining));

        if restaurants.len() >= RESTAURANT_CAP {
            break;
        }

        match response.meta.next_page {
            Some(next_page) => {
                page = next_page;
            }

            None => {
                break;
            }
        }

        sleep(REQUEST_DELAY).await;
    }

    restaurants.truncate(RESTAURANT_CAP);

    println!(
        "[{}] Fetched {} restaurants out of {} available",
        client.store.display_name(),
        restaurants.len(),
        // This is only informational if we reached the end.
        restaurants.len()
    );

    Ok(restaurants)
}

async fn fetch_restaurant_products(
    client: &KuperClient,
    restaurant: &KuperRestaurant,
) -> Result<Vec<ParsedRestaurantProduct>, DynError> {
    let url = format!(
        "https://api.kuper.ru/v2/departments\
?sid={}\
&ad.site_id=cl5k7lajjau4p8dq1ugg\
&ad.placement_id=cl5ocq2jjau4p8dq1ui0",
        restaurant.id
    );

    let text = client
        .curl_get(&url, &["screenname: RESTAURANT_HOME_SCREEN"])
        .await?;

    let response: RestaurantDepartmentsResponse = serde_json::from_str(&text)?;

    let mut products_by_sku: HashMap<String, ParsedRestaurantProduct> = HashMap::new();

    for department in response.departments {
        for product in department.products {
            let sku = product.sku.clone();

            let parsed = ParsedRestaurantProduct {
                restaurant_id: restaurant.id,
                restaurant_name: restaurant.retailer.name.clone(),
                sku: product.sku,
                id: product.id,
                name: product.name,
                weight: product.volume,
                unit: product.volume_type,
            };

            products_by_sku.entry(sku).or_insert(parsed);
        }
    }

    let products: Vec<ParsedRestaurantProduct> = products_by_sku.into_values().collect();

    println!(
        "[{}] Restaurant {}: fetched {} unique products",
        client.store.display_name(),
        restaurant.retailer.name,
        products.len()
    );

    Ok(products)
}

async fn fetch_all_restaurant_products(
    client: &KuperClient,
) -> Result<Vec<KuperIntermediateProduct>, DynError> {
    let restaurants = fetch_restaurants(client).await?;

    let mut result = Vec::new();

    for restaurant in restaurants {
        println!("[Restaurants] Fetching {}", restaurant.retailer.name);

        let products = fetch_restaurant_products(client, &restaurant).await?;

        println!(
            "[Restaurants] {} has {} products",
            restaurant.retailer.name,
            products.len()
        );

        let parsed = fetch_restaurant_products_details(
            Arc::new(KuperClient {
                anonymous_id: client.anonymous_id.clone(),
                store: KuperStore::Restaurant,
            }),
            &restaurant,
            products,
        )
        .await?;

        result.extend(parsed);
    }

    Ok(result)
}

async fn fetch_restaurant_products_details(
    client: Arc<KuperClient>,
    restaurant: &KuperRestaurant,
    products: Vec<ParsedRestaurantProduct>,
) -> Result<Vec<KuperIntermediateProduct>, DynError> {
    let limiter = Arc::new(Semaphore::new(PRODUCT_CONCURRENT_REQUESTS));

    let mut tasks = JoinSet::new();

    for product in products {
        let client = Arc::clone(&client);
        let limiter = Arc::clone(&limiter);

        let restaurant_name = restaurant.retailer.name.clone();
        let product_id = product.id;

        tasks.spawn(async move {
            let _permit = limiter
                .acquire_owned()
                .await
                .expect("restaurant product semaphore closed");

            let response = fetch_restaurant_product(&client, product_id).await?;

            Ok::<KuperIntermediateProduct, DynError>(parse_restaurant_product(
                response.product,
                &restaurant_name,
            ))
        });
    }

    let mut result = Vec::new();

    while let Some(task) = tasks.join_next().await {
        match task {
            Ok(Ok(product)) => result.push(product),

            Ok(Err(error)) => {
                eprintln!(
                    "[{}] Failed to fetch restaurant product: {}",
                    restaurant.retailer.name, error
                );
            }

            Err(error) => {
                eprintln!(
                    "[{}] Restaurant product task crashed: {}",
                    restaurant.retailer.name, error
                );
            }
        }
    }

    Ok(result)
}

async fn fetch_restaurant_product(
    client: &KuperClient,
    product_id: u64,
) -> Result<RestaurantResponse, DynError> {
    let url = format!("https://api.kuper.ru/v2/products/{}", product_id);

    let text = client
        .curl_get(&url, &["screenname: RESTAURANT_PRODUCTS_DETAILS"])
        .await?;

    if text.trim().is_empty() {
        return Err(format!(
            "Kuper returned empty restaurant product response for id={}",
            product_id
        )
        .into());
    }

    Ok(serde_json::from_str(&text)?)
}

// Store fetching

async fn fetch_store(
    store: KuperStore,
    product_limiter: Arc<Semaphore>,
    ean_limiter: Arc<Semaphore>,
) -> Vec<KuperIntermediateProduct> {
    let store_id = store.id();
    let store_name = store.display_name();

    let intermediate_path = format!("{}{}/intermediate.json", OUTPUT_PATH, store_id);

    if Path::new(&intermediate_path).exists() {
        println!(
            "[{}] intermediate.json already exists, skipping fetch",
            store_name
        );
        return vec![];
    }

    println!("\n========== Fetching {} ==========", store_name);

    // Fetch categories

    let client = Arc::new(KuperClient {
        anonymous_id: Uuid::new_v4().to_string(),
        store,
    });

    let categories = match fetch_store_categories(&client).await {
        Ok(categories) => categories,

        Err(error) => {
            eprintln!("[{}] Failed to fetch categories: {}", store_name, error);
            return Vec::new();
        }
    };

    println!(
        "[{}] Found {} categories:\n{}",
        store_name,
        categories.len(),
        categories
            .iter()
            .map(|c| c.clone().parent_name)
            .collect::<Vec<String>>()
            .join("\n")
    );

    // Fetch all category products and deduplicate by SKU

    let mut unique_products: HashMap<String, KuperCategoryProduct> = HashMap::new();

    for category in categories {
        let products = match fetch_category_products(&client, &category).await {
            Ok(products) => products,

            Err(error) => {
                eprintln!(
                    "[{}] Failed to fetch category {}: {}",
                    store_name, category.name, error
                );
                continue;
            }
        };

        println!(
            "[{}] Fetched {} products from {}, {}",
            store_name,
            products.len(),
            category.name,
            category.parent_name
        );

        for product in products {
            unique_products
                .entry(product.sku.clone())
                .or_insert(product);
        }
    }

    let category_products: Vec<KuperCategoryProduct> = unique_products.into_values().collect();

    let total_products = category_products.len();

    println!(
        "[{}] {} unique products after category deduplication",
        store_name, total_products
    );

    if total_products == 0 {
        println!("[{}] No products found, skipping", store_name);
        return Vec::new();
    }

    // Progress

    let progress = Progress::new(total_products);

    // Fetch product details + recommendation graph

    let mut tasks = JoinSet::new();

    for product in &category_products {
        tasks.spawn(fetch_product_and_eans(
            Arc::clone(&client),
            product.sku.clone(),
            product.id.to_string(),
            Arc::clone(&product_limiter),
            Arc::clone(&ean_limiter),
            progress.clone(),
        ));
    }

    // Collect fetched product details + discovered EANs

    let mut fetched_products: HashMap<String, ProductResponse> = HashMap::new();

    let mut discovered_eans: HashMap<String, ProductWithEans> = HashMap::new();

    let mut completed_tasks = 0usize;

    while let Some(task) = tasks.join_next().await {
        completed_tasks += 1;

        match task {
            Ok((original_sku, product_result, eans_result)) => {
                // Product details for the original catalogue SKU.
                if let Ok(product) = product_result {
                    fetched_products.insert(original_sku, product);
                }

                // Every recommendation response may contain products
                // that we did not explicitly fetch as catalogue products.
                //
                // Store their EANs globally by THEIR SKU.
                if let Ok(recommended_products) = eans_result {
                    for recommended in recommended_products {
                        let entry = discovered_eans
                            .entry(recommended.sku.clone())
                            .or_insert_with(|| ProductWithEans {
                                store_id: recommended.store_id,
                                eans: Vec::new(),
                                id: recommended.id.clone(),
                                sku: recommended.sku.clone(),
                                retailer_sku: recommended.retailer_sku.clone(),
                            });

                        entry.eans.extend(recommended.eans);
                    }
                }
            }

            Err(error) => {
                eprintln!("[{}] Product task crashed: {}", store_name, error);
            }
        }

        progress.report_if_needed(store_name, completed_tasks);
    }

    println!(
        "[{}] Finished discovery: {} product responses, {} discovered SKUs",
        store_name,
        fetched_products.len(),
        discovered_eans.len()
    );

    // Deduplicate discovered EANs

    for product in discovered_eans.values_mut() {
        let unique_eans: HashSet<String> = std::mem::take(&mut product.eans).into_iter().collect();

        product.eans = unique_eans.into_iter().collect();
    }

    // Parse only the original catalogue products

    let mut result = Vec::with_capacity(total_products);

    for product in &category_products {
        let fetched_product = match fetched_products.remove(&product.sku) {
            Some(product) => product,

            None => {
                eprintln!(
                    "[{}] No fetched product response for SKU {}",
                    store_name, product.sku
                );
                continue;
            }
        };

        // The recommendation crawl may have discovered EANs for this SKU
        // even when the SKU was not itself returned by its own
        // recommendation request.
        let eans = discovered_eans
            .get(&product.sku)
            .map(|product| product.eans.clone())
            .unwrap_or_default();

        result.push(parse_fetched_product(
            fetched_product,
            eans,
            store_name.to_string(),
        ));
    }

    // Save intermediate store data

    save_intermediate_products(store_id, &result);

    // Final progress

    progress.print_final(store_name, fetched_products.len(), discovered_eans.len());

    println!(
        "[{}] Saved {} intermediate products",
        store_name,
        result.len()
    );

    result
}

pub async fn fetch_restaurants_products() {
    let client = KuperClient {
        anonymous_id: Uuid::new_v4().to_string(),
        store: KuperStore::Restaurant,
    };

    let intermediate_path = format!("{}{}/intermediate.json", OUTPUT_PATH, client.store.id());

    if Path::new(&intermediate_path).exists() {
        println!("[Restarurants] intermediate.json already exists, skipping fetch");
        return;
    }

    match fetch_all_restaurant_products(&client).await {
        Ok(products) => {
            save_restaurant_products(&products, client.store.id());

            println!("[Restaurants] Finished with {} products", products.len());
        }

        Err(error) => {
            eprintln!("[Restaurants] Failed: {}", error);
        }
    }
}

pub async fn fetch_kuper_products() -> Vec<ParsedProduct> {
    let product_limiter = Arc::new(Semaphore::new(PRODUCT_CONCURRENT_REQUESTS));

    let ean_limiter = Arc::new(Semaphore::new(EAN_CONCURRENT_REQUESTS));

    for store in SAVED_STORES {
        fetch_store(
            store,
            Arc::clone(&product_limiter),
            Arc::clone(&ean_limiter),
        )
        .await;
    }

    fetch_restaurants_products().await;

    let inter_products = merge_products_by_sku().into_values().collect();

    merge_products_by_name(inter_products)
}
