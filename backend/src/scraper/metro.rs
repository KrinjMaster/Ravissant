use once_cell::sync::Lazy;
use regex::Regex;
use reqwest::Client;

use crate::scraper::models::*;

pub async fn fetch_category_products(
    client: &Client,
    category_name: &str,
) -> Result<Vec<ParsedProduct>, Box<dyn std::error::Error>> {
    let query = r#"
        query Query($storeId: Int!, $slug: String!, $from: Int!, $size: Int!) {
          category(storeId: $storeId, slug: $slug) {
            name
            products(from: $from, size: $size) {
              name
              barcodes
              attributes {
                name
                text
              }
            }
          }
        }
    "#;

    let payload = serde_json::json!({
        "query": query,
        "variables": {
            "storeId": 10,
            "slug": category_name,
            "from": 0,
            "size": 10000
        }
    });

    let res = client
        .post("https://online.metro-cc.ru/graphql")
        .json(&payload)
        .send()
        .await?;

    let text = res.text().await?;

    let v: serde_json::Value = serde_json::from_str(&text)?;

    if v.get("data").is_none() {
        println!("Skipping slug {}: no data field", category_name);
        return Ok(vec![]);
    }

    let parsed: ApiResponse = serde_json::from_value(v)?;

    let mut results = Vec::new();

    for product in parsed.data.category.products {
        let parsed_product = parse_product(product.name, &product.attributes, product.barcodes);

        results.push(parsed_product);
    }

    Ok(results)
}

pub async fn fetch_metro_products() -> Vec<ParsedProduct> {
    let client = Client::new();

    let categories = [
        "alkogolnaya-produkciya",
        "myasnye",
        "rybnye",
        "ovoshchi-i-frukty",
        "molochnye-prodkuty-syry-i-yayca",
        "siry",
        "zamorozhennye-produkty",
        "myasnye-delikatesy",
        "sladosti_",
        "hleb-vypechka-torty",
        "bezalkogolnye-napitki",
        "aziya",
        "brendy-metro",
        "bakaleya",
        "chipsy-sneki-orehi",
        "chaj-kofe-kakao",
        "gotovye-bljuda-polufabrikaty",
    ];

    let mut all_products = Vec::new();

    for slug in categories {
        match fetch_category_products(&client, &slug).await {
            Ok(products) => {
                println!("{} -> {}", slug, products.len());
                all_products.extend(products);
            }

            Err(e) => {
                println!("Failed {}: {}", slug, e);
            }
        }
    }

    all_products
}

fn parse_macro(value: &str) -> Option<i32> {
    value.parse::<f32>().ok().map(|v| (v * 100.0) as i32)
}

pub fn parse_product(
    name: Option<String>,
    attributes: &[Attribute],
    barcodes: Vec<String>,
) -> ParsedProduct {
    let name = name.unwrap_or_default();

    let mut brand = None;
    let mut category = None;
    let mut ingredients = None;

    let mut package_size = None;
    let mut package_unit = "g".to_string();

    let mut pieces: i32 = 1;
    let mut barcodes_res = vec![];

    let mut nutrients = Nutrients {
        proteins: None,
        fats: None,
        carbohydrates: None,
        calories: None,
    };

    for attr in attributes {
        let Some(attr_name) = &attr.name else { continue };
        let Some(value) = &attr.text else { continue };

        let value = value.replace(',', ".");

        match attr_name.as_str() {
            "Бренд" => brand = Some(value),

            "Тип" => category = Some(value),

            "Вес, объем" => {
                package_size = value.parse().ok();
            }

            "Количество штук в упаковке" => {
                pieces = value.parse().ok().unwrap_or(1);
            }

            "Белки, г" => nutrients.proteins = parse_macro(&value),
            "Жиры, г" => nutrients.fats = parse_macro(&value),
            "Углеводы, г" => nutrients.carbohydrates = parse_macro(&value),

            "Энергетическая ценность, ккал/100 г" => {
                nutrients.calories = parse_macro(&value)
            }

            "Состав" => ingredients = Some(value),

            _ => {}
        }
    }

    if let Some(unit) = detect_unit_from_name(&name) {
        package_unit = unit;
    }

    for barcode in &barcodes {
        match barcode.parse::<i32>() {
            Ok(barc) => barcodes_res.push(barc),
            Err(_) => {}
        }
    }

    ParsedProduct {
        name: name.clone(),
        brand: brand.unwrap_or("Метро".into()),
        category,
        barcodes: barcodes_res,
        nutrition_basis: NutritionBasis {
            weight: package_size.unwrap_or(100),
            unit: package_unit.to_string(),
            ingredients,
            allergens: None,
            nutrients,
        },

        servings: build_servings(package_size.unwrap_or(100), &package_unit, pieces),
    }
}

static VOLUME_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\d+(?:[.,]\d+)?\s*(мл|л)\b").unwrap());

static WEIGHT_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\d+(?:[.,]\d+)?\s*(г|кг)\b").unwrap());

static PIECES_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\d+\s*шт\b").unwrap());

fn detect_unit_from_name(name: &str) -> Option<String> {
    let name = name.to_lowercase();

    if VOLUME_RE.is_match(&name) {
        Some("мл".into())
    } else if WEIGHT_RE.is_match(&name) {
        Some("г".into())
    } else if PIECES_RE.is_match(&name) {
        Some("шт".into())
    } else {
        None
    }
}

fn build_servings(size: i32, unit: &str, pieces: i32) -> Vec<Serving> {
    let mut servings = Vec::new();

    match unit {
        "г" | "мл" | "кг" | "л" => {
            servings.push(Serving {
                name: "Упаковка".into(),
                amount: 1.0,
                unit: "package".into(),
                weight: Some(size),
                pieces,
                source: ServingSource::Explicit,
            });

            if pieces > 1 {
                servings.push(Serving {
                    name: "Штука".into(),
                    amount: 1.0,
                    unit: "piece".into(),
                    weight: Some(size / pieces),
                    pieces: 1,
                    source: ServingSource::Explicit,
                });
            }
        }

        "шт" => {
            servings.push(Serving {
                name: "Упаковка".into(),
                amount: 1.0,
                unit: "package".into(),
                weight: Some(size),
                pieces,
                source: ServingSource::Explicit,
            });

            servings.push(Serving {
                name: "Штука".into(),
                amount: 1.0,
                unit: "piece".into(),
                weight: Some(size / pieces),
                pieces: 1,
                source: ServingSource::Explicit,
            });
        }

        _ => {}
    }

    servings
}
