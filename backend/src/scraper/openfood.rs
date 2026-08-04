use csv::{self, Reader};
use serde::{de::value::Error, Deserialize, Serialize};
use serde_json::json;
use std::{
    collections::HashMap,
    fs::{self, File},
    hash::Hash,
    io,
    path::Path,
    process::exit,
};

use crate::scraper::models::Supermarket;

#[derive(Debug, Deserialize, Serialize)]
struct Product {
    #[serde(rename = "code")]
    barcode: Option<String>,
    product_name: Option<String>,
    brands: Option<String>,
    categories: Option<String>,
    serving_size: Option<String>,
    countries: Option<String>,
    countries_tag: Option<String>,
    #[serde(rename = "ingredients_text")]
    ingredients: Option<String>,
    allergens: Option<String>,
    #[serde(rename = "energy-kcal_100g")]
    calories: Option<f32>,
    #[serde(rename = "proteins_100g")]
    protein: Option<f32>,
    #[serde(rename = "fat_100g")]
    fat: Option<f32>,
    #[serde(rename = "carbohydrates_100g:")]
    carbs: Option<f32>,

    // additional nutrients
    #[serde(rename = "saturated-fat_100g")]
    saturaged_fat: Option<f32>,
    #[serde(rename = "unsaturated-fat_100g")]
    unsaturaged_fat: Option<f32>,
    #[serde(rename = "omega-3-fat_100g")]
    omega3_fat: Option<f32>,
    #[serde(rename = "omega-6-fat_100g")]
    omega6_fat: Option<f32>,
    #[serde(rename = "trans-fat_100g")]
    trans_fat: Option<f32>,

    #[serde(rename = "cholesterol_100g")]
    cholesterol: Option<f32>,

    #[serde(rename = "sugars_100g")]
    sugars: Option<f32>,

    #[serde(rename = "fiber_100g")]
    fiber: Option<f32>,

    #[serde(rename = "salt_100g")]
    salt: Option<f32>,

    #[serde(rename = "sodium_100g")]
    sodium: Option<f32>,
}

pub fn parse_open_food() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let filepath = "./data/raw/openfood/openfoodfacts.json";

    if !Path::new(filepath).exists() {
        let mut rdr = csv::ReaderBuilder::new()
            .delimiter(b'\t')
            .from_path(filepath)?;

        create_openfood_barcode_map(&mut rdr);
    }

    let file = fs::read_to_string("./src/scraper/results/metro.json")?;
    let hashmap_file = fs::read_to_string(&filepath)?;

    let metro_products: Supermarket = serde_json::from_str(&file)?;
    println!("Loading openfood hashmap...");
    let openfood_map: HashMap<String, Product> = serde_json::from_str(&hashmap_file)?;

    println!("Comparing metro products to open food...");
    for product in &metro_products.products {
        for barcode in &product.barcodes {
            if let Some(op_product) = openfood_map.get(&barcode.to_string()) {
                println!(
                    "Found match, metro: {}, open food: {}",
                    &product.name,
                    &op_product
                        .product_name
                        .clone()
                        .unwrap_or("uknown".to_string())
                );
                exit(0);
            }
        }
    }

    // at first match products from metro one to one with barcodes

    Ok(vec![])
}

fn create_openfood_barcode_map(file: &mut Reader<File>) -> Option<()> {
    println!("Creating open food facts hasm map file!");
    let mut barcodes: HashMap<String, Product> = HashMap::new();
    let mut i = 0;

    for result in file.deserialize() {
        match result {
            Ok(record) => {
                let record: Product = record;

                if let Some(barcode) = &record.barcode {
                    i += 1;
                    barcodes.insert(barcode.clone(), record);

                    if i % 100_000 == 0 {
                        println!("[{}/4535554] products done", i + 1);
                    }
                }
            }
            Err(err) => {
                eprintln!("{err}");
            }
        }
    }

    if barcodes.len() > 0 {
        match fs::write(
            "./data/raw/openfood/openfoodfacts.json",
            serde_json::to_string_pretty(&barcodes).ok()?,
        ) {
            Ok(_) => {
                println!("Saved open food as hash map!");
            }
            Err(err) => {
                eprintln!("Failed to save open food hash map: {err}");
                return None;
            }
        };
    };

    Some(())
}
