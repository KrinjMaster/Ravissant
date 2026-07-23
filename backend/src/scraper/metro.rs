use reqwest::Client;

use crate::scraper::models::*;
use crate::scraper::parser::parse_product;

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
        let parsed_product = parse_product(product.name, &product.attributes, category_name);

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
