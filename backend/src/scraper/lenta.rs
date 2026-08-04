use crate::scraper::models::{Nutrients, NutritionBasis, ParsedProduct, Serving, ServingSource};

use futures::{stream, StreamExt};
use quick_xml::de::from_str;
use regex::Regex;
use reqwest::{
    header::{
        HeaderMap, HeaderValue, ACCEPT, ACCEPT_LANGUAGE, COOKIE, ORIGIN, REFERER, USER_AGENT,
    },
    Client, Url,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, sync::Arc, time::Duration};
use tokio::sync::Semaphore;

#[derive(Debug, Clone)]
pub enum PackageUnit {
    Grams,
    Milliliter,
}

impl PackageUnit {
    fn to_string(self) -> String {
        match self {
            PackageUnit::Grams => "г".into(),
            PackageUnit::Milliliter => "мл".into(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct PackageInfo {
    pub amount: i64,
    pub unit: PackageUnit,
}

#[derive(Debug, Deserialize)]
struct SitemapIndex {
    #[serde(rename = "sitemap")]
    sitemaps: Vec<Sitemap>,
}

#[derive(Debug, Deserialize)]
struct Sitemap {
    loc: String,
}

#[derive(Debug, Deserialize)]
struct ProductUrlSet {
    #[serde(rename = "url")]
    urls: Vec<ProductUrl>,
}

#[derive(Debug, Deserialize)]
struct ProductUrl {
    loc: String,
}

#[derive(Debug, Deserialize)]
struct ProductCategory {
    name: String,
}

#[derive(Debug, Deserialize, Clone)]
struct ProductAttribute {
    name: String,
    value: String,
}

#[derive(Debug, Deserialize)]
struct ProductDisplay {
    package: String,
}

#[derive(Debug, Deserialize)]
struct ProductResponse {
    attributes: Vec<ProductAttribute>,
    name: String,
    display: ProductDisplay,
    categories: Vec<ProductCategory>,
}

pub async fn fetch_lenta_products() -> Vec<ParsedProduct> {
    let client = build_client();
    let ids = get_product_ids(&client).await;

    let total = ids.len();
    let semaphore = Arc::new(Semaphore::new(3));

    let products = stream::iter(ids)
        .map(|id| {
            let client = client.clone();
            let semaphore = semaphore.clone();

            async move {
                tokio::time::sleep(Duration::from_millis(1500)).await;
                let _permit = semaphore.acquire().await.unwrap();

                match get_product(&client, id).await {
                    Some(product) => {
                        println!("Total: {} Fetched id: {}", total, id);
                        Some(product)
                    }
                    None => {
                        println!("Failed id: {}", id);
                        None
                    }
                }
            }
        })
        .buffer_unordered(10)
        .filter_map(|x| async move { x })
        .collect::<Vec<_>>()
        .await;

    println!("Fetched {}/{} products", products.len(), total);

    products
}

async fn get_product(client: &Client, product_id: i64) -> Option<ParsedProduct> {
    let response = client
        .get(
            format!(
                "https://lenta.com/api-gateway/v1/catalog/items/{}?timestamp=1785765201556",
                product_id
            )
            .as_str(),
        )
        .send()
        .await
        .ok()?;

    let text = response.text().await.ok()?;

    let product: ProductResponse = serde_json::from_str(&text).ok()?;

    let package_info = parse_package(product.display.package.as_str());
    let mut brand: String = "Лента".to_string();
    let mut ingredients: String = "".to_string();
    let mut protein = 0;
    let mut carbs = 0;
    let mut fat = 0;
    let mut calories = 0;

    let category: String = match product.categories.is_empty() {
        true => "Без категории".to_string(),
        false => product.categories[0].name.clone(),
    };

    for attribute in product.attributes.clone() {
        match attribute.name.as_str() {
            "Бренд" => brand = attribute.value,
            "Состав" => ingredients = attribute.value,
            "Пищевая ценность" => {
                let (p, f, c) = parse_macros(attribute.value.as_str());

                carbs = c;
                protein = p;
                fat = f;
            }
            "Энергетическая ценность" => {
                calories = parse_calories(attribute.value.as_str())
            }
            _ => {}
        }
    }

    Some(ParsedProduct {
        name: product.name.clone(),
        category,
        brand,
        barcodes: vec![],
        nutrition_basis: NutritionBasis {
            weight: package_info.amount,
            unit: package_info.unit.to_string(),
            ingredients,
            allergens: None,
            nutrients: Nutrients {
                calories,
                proteins: protein,
                fats: fat,
                carbohydrates: carbs,
            },
        },
        servings: vec![Serving {
            name: "Упаковка".into(),
            amount: 1.0,
            unit: "package".into(),
            weight: Some(package_info.amount),
            pieces: 1,
            source: ServingSource::Explicit,
        }],
    })
}

async fn get_product_ids(client: &Client) -> Vec<i64> {
    let sitemaps = get_product_sitemaps(&client).await;
    let mut ids: Vec<i64> = vec![];

    for sitemap in sitemaps {
        let urls = get_sitemap_ids(&client, sitemap.as_str()).await;
        ids.extend(urls);
    }

    let ids_set: HashSet<i64> = ids.into_iter().collect();
    ids_set.into_iter().collect()
}

async fn get_product_sitemaps(client: &Client) -> Vec<String> {
    let response = match client
        .get("https://lenta.com/sitemap/sitemap_index.xml")
        .send()
        .await
    {
        Ok(response) => response,
        Err(err) => {
            eprintln!("Failed to fetch sitemap index: {err}");
            return vec![];
        }
    };

    let xml = match response.text().await {
        Ok(text) => text,
        Err(err) => {
            eprintln!("Failed to read sitemap index: {err}");
            return vec![];
        }
    };

    let index: SitemapIndex = match from_str(&xml) {
        Ok(index) => index,
        Err(err) => {
            eprintln!("Failed to parse sitemap index: {err}");
            return vec![];
        }
    };

    index
        .sitemaps
        .into_iter()
        .filter_map(|s| Some(s.loc))
        .filter(|url| url.contains("sitemap_item_"))
        .collect()
}

async fn get_sitemap_ids(client: &Client, url: &str) -> Vec<i64> {
    let response = match client.get(url).send().await {
        Ok(res) => res,
        Err(err) => {
            eprintln!("Failed to fetch sitemap: {err}");
            return vec![];
        }
    };

    let xml = match response.text().await {
        Ok(text) => text,
        Err(err) => {
            eprintln!("Failed to read sitemap: {err}");
            return vec![];
        }
    };

    let sitemap: ProductUrlSet = match from_str(&xml) {
        Ok(data) => data,
        Err(err) => {
            eprintln!("Failed to parse sitemap: {err}");
            return vec![];
        }
    };

    sitemap
        .urls
        .into_iter()
        .map(|item| item.loc)
        .filter(|url| url.contains("https://lenta.com/product/"))
        .map(|url| product_id(url.as_str()).unwrap_or(-1))
        .collect()
}

pub fn parse_package(package: &str) -> PackageInfo {
    let package = package.trim().to_lowercase();

    if package.is_empty() {
        return PackageInfo {
            amount: 100,
            unit: PackageUnit::Grams,
        };
    }

    let normalized = package.replace(',', ".");

    let mut parts = normalized.split_whitespace();

    let value = match parts.next().and_then(|s| s.parse::<f64>().ok()) {
        Some(v) => v,
        None => {
            return PackageInfo {
                amount: 100,
                unit: PackageUnit::Grams,
            };
        }
    };

    let unit = parts.next().unwrap_or("");

    match unit {
        "г" | "гр" | "g" => PackageInfo {
            amount: value.round() as i64,
            unit: PackageUnit::Grams,
        },

        "кг" | "kg" => PackageInfo {
            amount: (value * 1000.0).round() as i64,
            unit: PackageUnit::Grams,
        },

        "мл" | "ml" => PackageInfo {
            amount: value.round() as i64,
            unit: PackageUnit::Milliliter,
        },

        "л" | "l" => PackageInfo {
            amount: (value * 1000.0).round() as i64,
            unit: PackageUnit::Milliliter,
        },

        _ => PackageInfo {
            amount: 100,
            unit: PackageUnit::Grams,
        },
    }
}

fn parse_macros(text: &str) -> (i64, i64, i64) {
    let re = Regex::new(
        r"Белки\s*[–-]\s*([\d.,]+)г,\s*жиры\s*[–-]\s*([\d.,]+)г,\s*углеводы\s*[–-]\s*([\d.,]+)г",
    )
    .unwrap();

    if let Some(caps) = re.captures(text) {
        let parse =
            |s: &str| -> i64 { s.replace(',', ".").parse::<f64>().unwrap_or(0.0).round() as i64 };

        return (
            parse(&caps[1]) * 10, // proteins
            parse(&caps[2]) * 10, // fats
            parse(&caps[3]) * 10, // carbs
        );
    }

    (0, 0, 0)
}

fn parse_calories(text: &str) -> i64 {
    let re = Regex::new(r"([\d.,]+)\s*кКал").unwrap();

    if let Some(caps) = re.captures(text) {
        return caps[1]
            .replace(',', ".")
            .parse::<f64>()
            .unwrap_or(0.0)
            .round() as i64;
    }

    0
}

fn build_client() -> Client {
    let url = Url::parse("https://lenta.com").unwrap();

    let mut headers = HeaderMap::new();

    // manually insert headers here

    let client = reqwest::Client::builder()
        .default_headers(headers)
        .build()
        .unwrap();

    client
}

fn product_id(url: &str) -> Option<i64> {
    let slug = url.trim_end_matches('/').rsplit('/').next()?;

    slug.rsplit('-').next()?.parse().ok()
}
