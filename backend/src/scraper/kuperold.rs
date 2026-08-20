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
const SAVED_STORES: [KuperStore; 13] = [
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
}

impl KuperStore {
    pub fn id(&self) -> u64 {
        match self {
            KuperStore::Pyatorochka => 26238,
            KuperStore::Globus => 122409,
            KuperStore::Ashan => 983,
            KuperStore::Perekrestok => 239791,
            KuperStore::Lenta => 135381,
            KuperStore::AzbukaVkusa => 188252,
            KuperStore::Spar => 241132,
            KuperStore::Vkusvill => 196326,
            KuperStore::Magnoliya => 132942,
            KuperStore::Dobrininskii => 148757,
            KuperStore::UPalicha => 2439,
            KuperStore::Magnit => 3658,
            KuperStore::Okey => 12924,
            KuperStore::Metro => 122409,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            KuperStore::Pyatorochka => "Pyatorochka",
            KuperStore::Globus => "Globus",
            KuperStore::Ashan => "Ashan",
            KuperStore::Perekrestok => "Perekrestok",
            KuperStore::Lenta => "Lenta",
            KuperStore::AzbukaVkusa => "Azbuka Vkusa",
            KuperStore::Spar => "Spar",
            KuperStore::Vkusvill => "Vkusvill",
            KuperStore::Magnoliya => "Magnoliya",
            KuperStore::Dobrininskii => "Dobrininskii",
            KuperStore::UPalicha => "UPalicha",
            KuperStore::Magnit => "Magnit",
            KuperStore::Okey => "Okey",
            KuperStore::Metro => "Metro",
        }
    }
}

impl KuperClient {
    fn common_curl_args(&self) -> Vec<String> {
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
        let mut args = self.common_curl_args();

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
        let mut args = self.common_curl_args();

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

const REQUEST_DELAY: Duration = Duration::from_millis(250);

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
    products_count: u64,
    children: Vec<KuperCatalogueTaxon>,
}

#[derive(Debug, Clone)]
struct KuperCategory {
    pub id: u64,
    pub name: String,
    pub parent_name: String,
    pub products_count: u64,
}

#[derive(Debug, Deserialize)]
pub struct ProductResponse {
    pub product: KuperProduct,
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
    retailer_sku: String,
    name: String,
}

#[derive(Debug, Deserialize)]
struct ProductsMeta {
    products_offset: u64,
    limit: u64,
    products_total_count: u64,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct KuperIntermediateProduct {
    product: ParsedProduct,
    sku: String,
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
    pub id: String,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct KuperProperty {
    // pub name: String,
    pub presentation: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductWithEans {
    pub store_id: u64,
    pub eans: Vec<String>,
    pub id: String,
    pub sku: String,
    pub retailer_sku: String,
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
struct RecsBlock {
    block_id: u32,
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

struct KuperClient {
    anonymous_id: String,
    store: KuperStore,
}

fn parse_nutrient(nutrient_str: String) -> Option<i32> {
    nutrient_str
        .split_whitespace()
        .next()
        .and_then(|v| v.parse::<f64>().ok())
        .map(|v| (v * 100.0) as i32)
}

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
                    products_count: taxon.products_count,
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

fn save_intermediate_products(store_id: u64, products: &[KuperIntermediateProduct]) {
    let path = format!("{}{}/intermediate.json", OUTPUT_PATH, store_id);
    let path = Path::new(&path);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("failed to create Kuper intermediate output directory");
    }

    let json = serde_json::to_string_pretty(products)
        .expect("failed to serialize KuperIntermediateProduct");

    fs::write(path, json).expect("failed to write intermediate.json");
}

fn merge_products_by_sku() -> HashMap<String, ParsedProduct> {
    let mut merged: HashMap<String, ParsedProduct> = HashMap::new();
    let mut init_len = 0;

    for store in SAVED_STORES {
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

fn parse_fetched_product(
    product: ProductResponse,
    eans: Vec<String>,
    store_id: u64,
) -> Option<KuperIntermediateProduct> {
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

    Some(KuperIntermediateProduct {
        product: ParsedProduct {
            name: product.product.name,
            brand,
            category,
            sources: vec![store_id],
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
    })
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

fn save_parsed_products(store_id: u64, products: &[KuperIntermediateProduct]) {
    let path = format!("{}{}/intermediate.json", OUTPUT_PATH, store_id);
    let path = Path::new(&path);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("failed to create Kuper output directory");
    }

    let json = serde_json::to_string_pretty(products).expect("failed to serialize ParsedProducts");

    fs::write(path, json).expect("failed to write intermediate.json");
}

pub async fn fetch_kuper_products() -> Vec<ParsedProduct> {
    // Product details tolerate considerably more concurrency.
    const PRODUCT_CONCURRENT_REQUESTS: usize = 7;

    // Recommendations are sensitive. Keep this at 1.
    const EAN_CONCURRENT_REQUESTS: usize = 1;

    let product_limiter = Arc::new(Semaphore::new(PRODUCT_CONCURRENT_REQUESTS));
    let ean_limiter = Arc::new(Semaphore::new(EAN_CONCURRENT_REQUESTS));

    for store in SAVED_STORES {
        let name = store.display_name();
        let store_id = store.id();

        let intermediate_path = format!("{}{}/intermediate.json", OUTPUT_PATH, store_id);

        if Path::new(&intermediate_path).exists() {
            println!(
                "[{}] intermediate.json already exists, skipping fetch",
                name
            );
            continue;
        }

        println!("\n========== Fetching {} ==========", name);

        let client = Arc::new(KuperClient {
            anonymous_id: Uuid::new_v4().to_string(),
            store,
        });

        // Fetch categories

        let categories = match fetch_store_categories(&client).await {
            Ok(categories) => categories,

            Err(error) => {
                eprintln!("[{}] Failed to fetch categories: {}", name, error);
                continue;
            }
        };

        println!("[{}] Found {} categories", name, categories.len());

        // Fetch all category products and deduplicate by SKU

        let mut unique_products: HashMap<String, KuperCategoryProduct> = HashMap::new();

        for category in categories {
            let products = match fetch_category_products(&client, &category).await {
                Ok(products) => products,

                Err(error) => {
                    eprintln!(
                        "[{}] Failed to fetch products from category {}: {}",
                        name, category.name, error
                    );
                    continue;
                }
            };

            println!(
                "[{}] Fetched {} products from {}, {}",
                name,
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
            name, total_products
        );

        if total_products == 0 {
            println!("[{}] No products found, skipping", name);
            continue;
        }

        // Progress

        let started_at = Instant::now();

        let product_done = Arc::new(AtomicUsize::new(0));
        let product_failed = Arc::new(AtomicUsize::new(0));

        let eans_done = Arc::new(AtomicUsize::new(0));
        let eans_failed = Arc::new(AtomicUsize::new(0));

        // These count completed logical operations:
        //
        // 1 product details operation
        // 1 recommendation crawl operation
        //
        // A recommendation crawl may internally make several requests.
        let total_operations = total_products * 2;

        // Fetch product details + recommendation graph concurrently

        let mut tasks = JoinSet::new();

        for product in category_products.iter() {
            let client = Arc::clone(&client);

            let product_limiter = Arc::clone(&product_limiter);
            let ean_limiter = Arc::clone(&ean_limiter);

            let product_done = Arc::clone(&product_done);
            let product_failed = Arc::clone(&product_failed);

            let eans_done = Arc::clone(&eans_done);
            let eans_failed = Arc::clone(&eans_failed);

            let sku = product.sku.clone();
            let product_id = product.id.to_string();

            tasks.spawn(async move {
                // Product details

                let product_client = Arc::clone(&client);
                let product_limiter = Arc::clone(&product_limiter);

                let product_sku = sku.clone();
                let product_id_for_request = product_id.clone();

                let product_future = async move {
                    let _permit = product_limiter
                        .acquire_owned()
                        .await
                        .expect("product limiter semaphore closed");

                    let response = fetch_product(&product_client, &product_id_for_request).await;

                    match &response {
                        Ok(_) => {
                            product_done.fetch_add(1, Ordering::Relaxed);
                        }

                        Err(error) => {
                            product_failed.fetch_add(1, Ordering::Relaxed);

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

                // Recommendation/EAN crawl

                let ean_client = Arc::clone(&client);
                let ean_limiter = Arc::clone(&ean_limiter);

                let ean_sku = sku.clone();

                let eans_future = async move {
                    let _permit = ean_limiter
                        .acquire_owned()
                        .await
                        .expect("EAN limiter semaphore closed");

                    let response = fetch_product_eans_for_sku(&ean_client, &ean_sku).await;

                    match &response {
                        Ok(_) => {
                            eans_done.fetch_add(1, Ordering::Relaxed);
                        }

                        Err(error) => {
                            eans_failed.fetch_add(1, Ordering::Relaxed);

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

                // These two operations happen at the same time.
                let (product_result, eans_result) = tokio::join!(product_future, eans_future);

                Some((sku, product_result, eans_result))
            });
        }

        // Collect everything into maps

        let mut fetched_products: HashMap<String, ProductResponse> = HashMap::new();

        // Global recommendation discovery:
        let mut discovered_eans: HashMap<String, ProductWithEans> = HashMap::new();

        let mut completed_tasks = 0usize;
        let mut last_reported_operations = 0usize;
        const PROGRESS_STEP: usize = 50;

        while let Some(task) = tasks.join_next().await {
            completed_tasks += 1;

            match task {
                Ok(Some((original_sku, product_result, eans_result))) => {
                    // Store product details

                    if let Ok(product) = product_result {
                        fetched_products.insert(original_sku, product);
                    }

                    // Merge ALL recommendation products into the
                    // global SKU -> EAN map.

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

                            // The same product can appear in many
                            // recommendation requests/pages, so merge
                            // its EANs instead of creating a duplicate
                            // product entry.
                            entry.eans.extend(recommended.eans);
                        }
                    }
                }

                Ok(None) => {}

                Err(error) => {
                    eprintln!("[{}] Product task crashed: {}", name, error);
                }
            }

            // Deduplicate EANs periodically + progress

            let operations_done =
                product_done.load(Ordering::Relaxed) + eans_done.load(Ordering::Relaxed);

            let should_report = operations_done >= last_reported_operations + PROGRESS_STEP
                || completed_tasks == total_products;

            if should_report {
                last_reported_operations = operations_done;

                let elapsed = started_at.elapsed().as_secs_f64();

                let operations_per_sec = if elapsed > 0.0 {
                    operations_done as f64 / elapsed
                } else {
                    0.0
                };

                let percent = if total_operations > 0 {
                    operations_done as f64 / total_operations as f64 * 100.0
                } else {
                    100.0
                };

                let remaining_operations = total_operations.saturating_sub(operations_done);

                let eta_seconds = if operations_per_sec > 0.0 {
                    remaining_operations as f64 / operations_per_sec
                } else {
                    0.0
                };

                println!(
                    "[{}] ops={}/{} ({:.1}%) \
                     | products={}/{} \
                     | eans={}/{} \
                     | discovered_skus={} \
                     | {:.2} ops/s \
                     | ETA={:.0}s",
                    name,
                    operations_done,
                    total_operations,
                    percent,
                    product_done.load(Ordering::Relaxed),
                    total_products,
                    eans_done.load(Ordering::Relaxed),
                    total_products,
                    discovered_eans.len(),
                    operations_per_sec,
                    eta_seconds,
                );
            }
        }

        println!(
            "[{}] Finished discovery: {} product responses, {} discovered SKUs with EANs",
            name,
            fetched_products.len(),
            discovered_eans.len()
        );

        // Deduplicate all discovered EAN lists

        for product in discovered_eans.values_mut() {
            let unique_eans: HashSet<String> =
                std::mem::take(&mut product.eans).into_iter().collect();

            product.eans = unique_eans.into_iter().collect();
        }

        // Parse ORIGINAL catalogue products

        let mut store_result = Vec::with_capacity(total_products);

        for product in &category_products {
            let fetched_product = match fetched_products.remove(&product.sku) {
                Some(product) => product,

                None => {
                    eprintln!(
                        "[{}] No fetched product response for SKU {}",
                        name, product.sku
                    );
                    continue;
                }
            };

            // EANs belong ONLY to this exact SKU.
            let eans = discovered_eans
                .get(&product.sku)
                .map(|product| product.eans.clone())
                .unwrap_or_default();

            if let Some(parsed_product) = parse_fetched_product(fetched_product, eans, store_id) {
                store_result.push(parsed_product);
            }
        }

        // Save one JSON array for this store

        save_parsed_products(store_id, &store_result);

        let elapsed = started_at.elapsed().as_secs_f64();

        let products_done_final = product_done.load(Ordering::Relaxed);
        let products_failed_final = product_failed.load(Ordering::Relaxed);

        let eans_done_final = eans_done.load(Ordering::Relaxed);
        let eans_failed_final = eans_failed.load(Ordering::Relaxed);

        let operations_done = products_done_final + eans_done_final;

        let operations_per_sec = if elapsed > 0.0 {
            operations_done as f64 / elapsed
        } else {
            0.0
        };

        println!("\n[{}] Finished", name);

        println!(
            "[{}] Product requests: {}/{} successful, {} failed",
            name, products_done_final, total_products, products_failed_final
        );

        println!(
            "[{}] EAN crawls: {}/{} successful, {} failed",
            name, eans_done_final, total_products, eans_failed_final
        );

        println!(
            "[{}] Fetched product details: {}/{}",
            name,
            fetched_products.len(),
            total_products
        );

        println!(
            "[{}] Discovered SKUs with EANs: {}",
            name,
            discovered_eans.len()
        );

        println!(
            "[{}] Operations: {}/{} | {:.2} ops/s | {:.1}s elapsed",
            name, operations_done, total_operations, operations_per_sec, elapsed
        );
    }

    println!("\n========== Kuper finished ==========",);

    let result = merge_products_by_sku();

    result.values().cloned().collect()
}

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
