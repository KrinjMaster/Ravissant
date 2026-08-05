use csv::{self, Reader};
use std::{
    collections::HashMap,
    fs::{self, File},
    path::Path,
};

use crate::scraper::{
    models::{
        CompleteNutrients, CompleteNutritionBasis, FinalProduct, OpenFoodProduct, ParsedProduct,
        Supermarket,
    },
    scraper::Scraper,
};

fn parse_macro(val: Option<f32>) -> Option<i32> {
    val.map(|v| (v * 100.0) as i32).or(None)
}

fn merge_products(parsed_product: &ParsedProduct, op_product: &OpenFoodProduct) -> FinalProduct {
    let category = op_product
        .categories
        .clone()
        .or(parsed_product.category.clone());

    let ingredients = op_product
        .ingredients
        .clone()
        .or(parsed_product.nutrition_basis.ingredients.clone());

    let allergens = op_product
        .allergens
        .clone()
        .or(parsed_product.nutrition_basis.allergens.clone());

    let calories = op_product
        .calories
        .map(|v| (v * 100.0) as i32)
        .or(parsed_product.nutrition_basis.nutrients.calories);

    let fat = op_product
        .fat
        .map(|v| (v * 100.0) as i32)
        .or(parsed_product.nutrition_basis.nutrients.calories);

    let carbs = op_product
        .carbs
        .map(|v| (v * 100.0) as i32)
        .or(parsed_product.nutrition_basis.nutrients.calories);

    let protein = op_product
        .protein
        .map(|v| (v * 100.0) as i32)
        .or(parsed_product.nutrition_basis.nutrients.calories);

    FinalProduct {
        name: parsed_product.name.clone(),
        brand: parsed_product.brand.clone(),
        category,
        barcodes: parsed_product.barcodes.clone(),
        nutrition_basis: CompleteNutritionBasis {
            weight: parsed_product.nutrition_basis.weight,
            unit: parsed_product.nutrition_basis.unit.clone(),
            ingredients,
            allergens,
            nutrients: CompleteNutrients {
                calories,
                protein,
                fat,
                carbs,
                saturaged_fat: parse_macro(op_product.saturaged_fat),
                unsaturaged_fat: parse_macro(op_product.unsaturaged_fat),
                omega3_fat: parse_macro(op_product.omega3_fat),
                omega6_fat: parse_macro(op_product.omega6_fat),
                trans_fat: parse_macro(op_product.trans_fat),
                cholesterol: parse_macro(op_product.cholesterol),
                sugars: parse_macro(op_product.sugars),
                fiber: parse_macro(op_product.fiber),
                salt: parse_macro(op_product.salt),
                sodium: parse_macro(op_product.sodium),
            },
        },
        servings: parsed_product.servings.clone(),
    }
}

fn format_parsed_product(parsed_product: &ParsedProduct) -> FinalProduct {
    FinalProduct {
        name: parsed_product.name.clone(),
        brand: parsed_product.brand.clone(),
        category: parsed_product.category.clone(),
        barcodes: parsed_product.barcodes.clone(),
        nutrition_basis: CompleteNutritionBasis {
            weight: parsed_product.nutrition_basis.weight,
            unit: parsed_product.nutrition_basis.unit.clone(),
            ingredients: parsed_product.nutrition_basis.ingredients.clone(),
            allergens: parsed_product.nutrition_basis.allergens.clone(),
            nutrients: CompleteNutrients {
                calories: parsed_product.nutrition_basis.nutrients.calories,
                protein: parsed_product.nutrition_basis.nutrients.proteins,
                fat: parsed_product.nutrition_basis.nutrients.fats,
                carbs: parsed_product.nutrition_basis.nutrients.carbohydrates,
                saturaged_fat: None,
                unsaturaged_fat: None,
                omega3_fat: None,
                omega6_fat: None,
                trans_fat: None,
                cholesterol: None,
                sugars: None,
                fiber: None,
                salt: None,
                sodium: None,
            },
        },
        servings: parsed_product.servings.clone(),
    }
}

fn create_openfood_barcode_map(file: &mut Reader<File>) -> Option<()> {
    println!("Creating open food facts hasm map file!");
    let mut barcodes: HashMap<String, OpenFoodProduct> = HashMap::new();
    let mut i = 0;

    for result in file.deserialize() {
        match result {
            Ok(record) => {
                let record: OpenFoodProduct = record;

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

pub fn proccess_open_food() -> Result<Vec<FinalProduct>, Box<dyn std::error::Error>> {
    let filepath = "./data/raw/openfood/openfoodfacts.json";

    if !Path::new(filepath).exists() {
        let mut rdr = csv::ReaderBuilder::new()
            .delimiter(b'\t')
            .from_path(filepath)?;

        create_openfood_barcode_map(&mut rdr);
    }

    println!("Loading openfood hashmap...");
    let hashmap_file = fs::read_to_string(&filepath)?;
    let openfood_map: HashMap<String, OpenFoodProduct> = serde_json::from_str(&hashmap_file)?;

    let scrapers = [Scraper::Metro, Scraper::Vkusvill];

    let mut final_products: Vec<FinalProduct> = vec![];

    for scraper in &scrapers {
        if let Ok(file) =
            fs::read_to_string(format!("./data/raw/{}/{}.json", scraper.id(), scraper.id()))
        {
            let parsed_products: Supermarket = serde_json::from_str(&file)?;

            println!("Proccessing {} products...", scraper.id());
            // at first match products from self parsed sources one to one with barcodes
            for product in &parsed_products.products {
                let mut flag = false;

                for barcode in &product.barcodes {
                    if let Some(op_product) = openfood_map.get(&barcode.to_string()) {
                        final_products.push(merge_products(product, &op_product));
                        flag = true;
                        break;
                    }
                }

                if !flag {
                    final_products.push(format_parsed_product(product));
                }
            }
        } else {
            eprint!("Could not read {}.json", scraper.id());
        }
    }

    Ok(final_products)
}
