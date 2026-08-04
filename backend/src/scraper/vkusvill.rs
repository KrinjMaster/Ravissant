use futures::{stream, StreamExt};
use rand::RngExt;
use regex::Regex;
use reqwest::{Client, Result};
use scraper::{Html, Selector};
use std::{collections::HashSet, path::Path, sync::LazyLock, time::Duration};
use tokio::fs;

use crate::scraper::models::{Nutrients, NutritionBasis, ParsedProduct, Serving, ServingSource};

fn is_product_url(url: &str) -> bool {
    Regex::new(r"/goods/.+-\d+/$").unwrap().is_match(url)
}

fn extract_urls(xml: &str) -> Vec<String> {
    let re = Regex::new(r"<loc>(.*?)</loc>").unwrap();

    re.captures_iter(xml)
        .filter_map(|cap| cap.get(1))
        .map(|m| m.as_str().to_string())
        .collect()
}

async fn collect_product_urls(client: &Client) -> Result<Vec<String>> {
    let sitemaps = vec![
        (
            "https://vkusvill.ru/upload/sitemap/msk/sitemap_goods.xml",
            "data/raw/vkusvill/sitemap_goods.xml",
        ),
        (
            "https://vkusvill.ru/upload/sitemap/msk/sitemap_goods_2.xml",
            "data/raw/vkusvill/sitemap_goods_2.xml",
        ),
    ];

    let mut products: HashSet<String> = HashSet::new();

    fs::create_dir_all("data/raw/vkusvill").await.unwrap();

    for (url, file_path) in sitemaps {
        let xml = if Path::new(file_path).exists() {
            println!("Using cached sitemap: {}", file_path);

            fs::read_to_string(file_path)
                .await
                .expect(&format!("Failed to read file: {}", file_path))
        } else {
            println!("Fetching sitemap: {}", url);

            let xml = client.get(url).send().await?.text().await?;

            fs::write(file_path, &xml)
                .await
                .expect(&format!("Failed to write file: {}", file_path));

            println!("Saved sitemap: {}", file_path);

            tokio::time::sleep(Duration::from_millis(500)).await;

            xml
        };

        let urls = extract_urls(&xml);

        let mut count = 0;

        for url in urls {
            if is_product_url(&url) {
                products.insert(url);
                count += 1;
            }
        }

        println!("Added {} products", count);
    }

    println!("Total unique products: {}", products.len());

    Ok(products.into_iter().collect())
}

pub async fn fetch_vkusvill_products() -> Vec<ParsedProduct> {
    let client = Client::builder()
        .user_agent("RavissantNutritionBot/0.1 (personal nutrition database project)")
        .timeout(Duration::from_secs(20))
        .build()
        .unwrap();

    let product_urls = collect_product_urls(&client).await.unwrap();
    println!("Collected {} product URLs", product_urls.len());

    fs::create_dir_all("data/raw/vkusvill/pages").await.unwrap();

    let total = product_urls.len();

    let products: Vec<ParsedProduct> = stream::iter(product_urls.into_iter().enumerate())
        .map(|(i, url)| {
            let client = client.clone();

            async move {
                println!("[{}/{}] {}", i + 1, total, url);

                let html = get_html(&client, &url).await?;

                scrape_data_from_html(&html)
            }
        })
        .buffer_unordered(4)
        .filter_map(async move |product| product)
        .collect()
        .await;

    println!("Collected {} products", products.len());

    products
}

fn scrape_data_from_html(html: &str) -> Option<ParsedProduct> {
    let document = Html::parse_document(html);

    let name = extract_name(&document)?;

    let weight = extract_weight(&document).unwrap_or("100 г".into());
    let brand = extract_brand(&document).unwrap_or_else(|| "ВкусВилл".to_string());
    let category = extract_category(&document).unwrap_or_else(|| "unknown".to_string());
    let macros = extract_macros(&document);
    let (w, unit) = parse_weight(&weight.as_str())?;

    let servings = extract_servings(&document, &name);
    let ingredients = extract_ingredients(&document).unwrap_or_default();
    let allergens = extract_allergens(&document);

    Some(ParsedProduct {
        name: name.clone(),
        brand,
        category,
        barcodes: vec![],
        nutrition_basis: NutritionBasis {
            weight: w,
            unit: unit,
            ingredients,
            allergens,
            nutrients: macros,
        },
        servings,
    })
}

fn extract_servings(document: &Html, name: &str) -> Vec<Serving> {
    let weight_selector = Selector::parse(
        "[class='ProductCard__weight nobr rtext _desktop-md _tablet-sm _mobile-sm js-product-weight-for-log']"
    )
    .unwrap();

    let Some(element) = document.select(&weight_selector).next() else {
        return vec![];
    };

    let text = element
        .text()
        .collect::<String>()
        .replace('\u{a0}', " ")
        .trim()
        .to_lowercase();

    parse_serving_text(&text, name)
}

fn extract_ingredients(document: &Html) -> Option<String> {
    let item_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem").unwrap();

    let title_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem__Title").unwrap();

    let desc_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem__Desc").unwrap();

    for item in document.select(&item_selector) {
        let title = item
            .select(&title_selector)
            .next()
            .map(|el| el.text().collect::<String>())
            .unwrap_or_default();

        if title.contains("Состав") {
            let text = item
                .select(&desc_selector)
                .next()
                .map(|el| {
                    el.text()
                        .collect::<String>()
                        .replace('\u{a0}', " ")
                        .split_whitespace()
                        .collect::<Vec<_>>()
                        .join(" ")
                })
                .unwrap_or_default();

            return if text.is_empty() { None } else { Some(text) };
        }
    }

    None
}

fn extract_allergens(document: &Html) -> Option<String> {
    let item_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem").unwrap();

    let title_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem__Title").unwrap();

    let desc_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem__Desc").unwrap();

    for item in document.select(&item_selector) {
        let title = item
            .select(&title_selector)
            .next()
            .map(|el| el.text().collect::<String>())
            .unwrap_or_default();

        if title.contains("Аллергены по производителям") {
            let text = item
                .select(&desc_selector)
                .next()
                .map(|el| {
                    el.text()
                        .collect::<String>()
                        .replace('\u{a0}', " ")
                        .split_whitespace()
                        .collect::<Vec<_>>()
                        .join(" ")
                })
                .unwrap_or_default();

            return if text.is_empty() { None } else { Some(text) };
        }
    }

    None
}

fn parse_serving_text(text: &str, name: &str) -> Vec<Serving> {
    let mut result = Vec::new();

    let parts: Vec<&str> = text.split_whitespace().collect();

    if parts.len() < 2 {
        return result;
    }

    let amount = match parts[0].replace(',', ".").parse::<f64>() {
        Ok(v) => v,
        Err(_) => return result,
    };

    let unit = parts[1];

    let re = Regex::new(r"(\d+)\s*(шт|штук)").unwrap();

    if let Some(caps) = re.captures(name) {
        let count = caps.get(1).unwrap().as_str().parse::<i64>().unwrap();

        result.push(Serving {
            name: "Упаковка".to_string(),
            amount: 1.0,
            unit: "package".to_string(),
            pieces: count,
            weight: None,
            source: ServingSource::Explicit,
        });

        result.push(Serving {
            name: "Штука".to_string(),
            amount: 1.0,
            unit: "piece".to_string(),
            pieces: 1,
            weight: None,
            source: ServingSource::Explicit,
        });
    } else {
        match unit {
            "г" | "гр" | "g" | "мл" => {
                result.push(Serving {
                    name: "Упаковка".to_string(),
                    amount: 1.0,
                    unit: "package".to_string(),
                    pieces: 1,
                    weight: Some(amount as i64),
                    source: ServingSource::Explicit,
                });
            }
            "кг" | "л" => {
                result.push(Serving {
                    name: "Упаковка".to_string(),
                    amount: 1.0,
                    unit: "package".to_string(),
                    pieces: 1,
                    weight: Some((amount * 1000.0) as i64),
                    source: ServingSource::Explicit,
                });
            }

            _ => {}
        }
    }

    result
}

fn extract_name(document: &Html) -> Option<String> {
    let name_selector =
        Selector::parse("[class='Product__title js-datalayer-catalog-list-name']").unwrap();

    Some(
        document
            .select(&name_selector)
            .next()?
            .text()
            .collect::<String>()
            .trim()
            .to_string()
            .replace("\u{a0}", " "),
    )
}

fn parse_weight(weight: &str) -> Option<(i64, String)> {
    let weight = weight.replace(',', ".");

    let mut parts = weight.split_whitespace();

    let value = parts.next()?.parse::<i64>().ok()?;
    let unit = parts.next()?.to_string();

    match unit.as_str() {
        "л" => Some((value * 1000, "мл".into())),
        "кг" => Some((value * 1000, "г".into())),
        _ => Some((value, unit)),
    }
}

fn extract_weight(document: &Html) -> Option<String> {
    let item_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem").unwrap();

    let title_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem__Title").unwrap();

    let desc_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem__Desc").unwrap();

    for item in document.select(&item_selector) {
        let title = item
            .select(&title_selector)
            .next()?
            .text()
            .collect::<String>()
            .trim()
            .to_string();

        if title.contains("Вес/объем") {
            return item
                .select(&desc_selector)
                .next()
                .map(|el| el.text().collect::<String>().trim().replace('\u{a0}', " "));
        }
    }

    None
}

fn extract_brand(document: &Html) -> Option<String> {
    let item_selector = Selector::parse(".VV_ResetStyleBtn VV23_DetailProdPageInfoDescItem__Title _link subtitle _desktop-lg b600 js-accordion__toggler").unwrap();

    let title_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem__Title").unwrap();

    let desc_selector = Selector::parse(".VV23_DetailProdPageInfoDescItem__Desc").unwrap();

    for item in document.select(&item_selector) {
        let title = item
            .select(&title_selector)
            .next()?
            .text()
            .collect::<String>()
            .trim()
            .to_string();

        if title.starts_with("Бренд") {
            return item
                .select(&desc_selector)
                .next()
                .map(|el| el.text().collect::<String>().trim().replace('\u{a0}', " "));
        }
    }

    None
}

fn extract_category(document: &Html) -> Option<String> {
    let name_selector =
        Selector::parse("[class='js-datalayer-catalog-list-category hidden']").unwrap();

    Some(
        document
            .select(&name_selector)
            .next()?
            .text()
            .collect::<String>()
            .trim()
            .to_string()
            .replace("\u{a0}", " ")
            .replace("&nbsp;", " "),
    )
}

fn extract_macros(document: &Html) -> Nutrients {
    let macros = extract_structured_macros(document);

    if macros.is_some() {
        return macros.unwrap();
    }

    extract_text_macros(document).unwrap_or(Nutrients {
        calories: 0,
        proteins: 0,
        fats: 0,
        carbohydrates: 0,
    })
}

fn extract_structured_macros(document: &Html) -> Option<Nutrients> {
    let item_selector = Selector::parse(".VV23_DetailProdPageAccordion__EnergyItem").unwrap();

    let value_selector = Selector::parse(".VV23_DetailProdPageAccordion__EnergyValue").unwrap();

    let label_selector = Selector::parse(".VV23_DetailProdPageAccordion__EnergyDesc").unwrap();

    let mut macros = Nutrients {
        calories: 0,
        proteins: 0,
        fats: 0,
        carbohydrates: 0,
    };

    let mut found = false;

    for item in document.select(&item_selector) {
        let value = item.select(&value_selector).next().and_then(|el| {
            el.text()
                .collect::<String>()
                .trim()
                .replace(',', ".")
                .replace("\u{a0}", " ")
                .parse::<f64>()
                .ok()
        });

        let label = item
            .select(&label_selector)
            .next()
            .map(|el| el.text().collect::<String>().trim().to_string());

        let (Some(value), Some(label)) = (value, label) else {
            continue;
        };

        found = true;

        match label.as_str() {
            "Ккал" => macros.calories = (value * 10.0) as i64,
            "Белки, г" => macros.proteins = (value * 10.0) as i64,
            "Жиры, г" => macros.fats = (value * 10.0) as i64,
            "Углеводы, г" => macros.carbohydrates = (value * 10.0) as i64,
            _ => {}
        }
    }

    if found {
        Some(macros)
    } else {
        None
    }
}

fn extract_text_macros(document: &Html) -> Option<Nutrients> {
    let text = document.root_element().text().collect::<String>();

    let normalize = text.replace('\u{a0}', " ").replace(',', ".");

    let proteins = Regex::new(r"белки\s*[-:]\s*([\d.]+)")
        .unwrap()
        .captures(&normalize)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse::<f64>().ok());

    let fats = Regex::new(r"жиры\s*[-:]\s*([\d.]+)")
        .unwrap()
        .captures(&normalize)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse::<f64>().ok());

    let carbs = Regex::new(r"углеводы\s*[-:]\s*([\d.]+)")
        .unwrap()
        .captures(&normalize)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse::<f64>().ok());

    let calories = Regex::new(r"(\d+(?:\.\d+)?)\s*ккал")
        .unwrap()
        .captures(&normalize)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse::<f64>().ok());

    Some(Nutrients {
        proteins: proteins.map(|v| (v * 10.0) as i64).unwrap_or(0),
        fats: fats.map(|v| (v * 10.0) as i64).unwrap_or(0),
        carbohydrates: carbs.map(|v| (v * 10.0) as i64).unwrap_or(0),
        calories: calories.map(|v| (v * 10.0) as i64).unwrap_or(0),
    })
}

async fn polite_delay() {
    let ms = rand::rng().random_range(300..900);
    tokio::time::sleep(Duration::from_millis(ms)).await;
}

async fn fetch_page(client: &Client, url: &str) -> Option<String> {
    let mut delay = 1;

    for _ in 0..5 {
        match client.get(url).send().await {
            Ok(resp) if resp.status().is_success() => {
                if let Ok(text) = resp.text().await {
                    return Some(text);
                }
            }
            _ => {}
        }

        tokio::time::sleep(Duration::from_secs(delay)).await;
        delay *= 2;
    }

    None
}

fn page_path(url: &str) -> String {
    let slug = url.trim_end_matches('/').split('/').last().unwrap();

    format!("data/raw/vkusvill/pages/{slug}.html")
}

async fn get_html(client: &Client, url: &str) -> Option<String> {
    let path = page_path(url);

    if Path::new(&path).exists() {
        return fs::read_to_string(&path).await.ok();
    }

    println!("Downloading {}", url);

    polite_delay().await;

    let html = fetch_page(client, url).await?;

    fs::write(&path, &html).await.ok()?;

    Some(html)
}
