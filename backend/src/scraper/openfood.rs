use crate::scraper::{
    models::{
        CompleteNutrients, CompleteNutritionBasis, FinalProduct, OpenFoodProduct, ParsedProduct,
        Serving, ServingSource, Supermarket,
    },
    scraper::Scraper,
};
use arrow::array::{Array, ArrayRef, Float32Array, ListArray, StringArray, StructArray};
use arrow::record_batch::RecordBatch;
use parquet::arrow::arrow_reader::ParquetRecordBatchReaderBuilder;
use redb::ReadableTable;
use redb::{Database, ReadableDatabase, TableDefinition};
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File},
    path::Path,
};

#[derive(Default)]
struct ParsedNutrients {
    calories: Option<f32>,
    protein: Option<f32>,
    fat: Option<f32>,
    carbs: Option<f32>,
    saturated_fat: Option<f32>,
    unsaturated_fat: Option<f32>,
    omega3: Option<f32>,
    omega6: Option<f32>,
    trans_fat: Option<f32>,
    cholesterol: Option<f32>,
    sugars: Option<f32>,
    fiber: Option<f32>,
    salt: Option<f32>,
    sodium: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
struct StoredOpenFoodProduct {
    barcode: String,
    name: String,
    brand: Option<String>,
    category: Option<String>,
    quantity: Option<f32>,
    quantity_unit: Option<String>,
    ingredients: Option<String>,
    allergens: Option<String>,
    calories: f32,
    protein: Option<f32>,
    fat: Option<f32>,
    carbs: Option<f32>,
    saturated_fat: Option<f32>,
    unsaturated_fat: Option<f32>,
    omega3: Option<f32>,
    omega6: Option<f32>,
    trans_fat: Option<f32>,
    cholesterol: Option<f32>,
    sugars: Option<f32>,
    fiber: Option<f32>,
    salt: Option<f32>,
    sodium: Option<f32>,
}

impl From<StoredOpenFoodProduct> for OpenFoodProduct {
    fn from(p: StoredOpenFoodProduct) -> Self {
        Self {
            barcode: Some(p.barcode),
            product_name: Some(p.name),
            brands: p.brand,
            categories: p.category,
            quantity: p.quantity,
            quantity_unit: p.quantity_unit,
            ingredients: p.ingredients,
            allergens: p.allergens,
            calories: Some(p.calories),
            protein: p.protein,
            fat: p.fat,
            carbs: p.carbs,
            saturaged_fat: p.saturated_fat,
            unsaturaged_fat: p.unsaturated_fat,
            omega3_fat: p.omega3,
            omega6_fat: p.omega6,
            trans_fat: p.trans_fat,
            cholesterol: p.cholesterol,
            sugars: p.sugars,
            fiber: p.fiber,
            salt: p.salt,
            sodium: p.sodium,
            completeness: 0.0,
            countries: None,
            countries_tag: None,
            languages_tags: None,
        }
    }
}

const OPENFOOD_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("openfood");

fn parse_nutrients(array: &ArrayRef, row: usize) -> ParsedNutrients {
    let mut result = ParsedNutrients::default();

    let Some(list) = array.as_any().downcast_ref::<ListArray>() else {
        return result;
    };

    if list.is_null(row) {
        return result;
    }

    let values = list.value(row);

    let Some(structs) = values.as_any().downcast_ref::<StructArray>() else {
        return result;
    };

    let Some(names) = structs
        .column_by_name("name")
        .and_then(|x| x.as_any().downcast_ref::<StringArray>())
    else {
        return result;
    };

    let Some(values) = structs
        .column_by_name("100g")
        .and_then(|x| x.as_any().downcast_ref::<Float32Array>())
    else {
        return result;
    };

    for i in 0..names.len() {
        if names.is_null(i) || values.is_null(i) {
            continue;
        }

        let value = values.value(i);

        match names.value(i) {
            "energy-kcal" => result.calories = Some(value),
            "proteins" => result.protein = Some(value),
            "fat" => result.fat = Some(value),
            "carbohydrates" => result.carbs = Some(value),
            "saturated-fat" => result.saturated_fat = Some(value),
            "unsaturated-fat" => result.unsaturated_fat = Some(value),
            "omega-3-fat" => result.omega3 = Some(value),
            "omega-6-fat" => result.omega6 = Some(value),
            "trans-fat" => result.trans_fat = Some(value),
            "cholesterol" => result.cholesterol = Some(value),
            "sugars" => result.sugars = Some(value),
            "fiber" => result.fiber = Some(value),
            "salt" => result.salt = Some(value),
            "sodium" => result.sodium = Some(value),
            _ => {}
        }
    }

    result
}

fn qualifies_openfood_product(
    barcode: &Option<String>,
    name: &Option<String>,
    completeness: f32,
    calories: Option<f32>,
    protein: Option<f32>,
    fat: Option<f32>,
    carbs: Option<f32>,
) -> bool {
    let Some(barcode) = barcode else {
        return false;
    };

    let Some(name) = name else {
        return false;
    };

    let Some(calories) = calories else {
        return false;
    };

    let (Some(protein), Some(fat), Some(carbs)) =
        (protein, fat, carbs)
    else {
        return false;
    };

    if barcode.len() < 8 || name.trim().is_empty() {
        return false;
    }

    if completeness < 0.7 {
        return false;
    }

    if !(0.0..=1000.0).contains(&calories) {
        return false;
    }

    if !(0.0..=100.0).contains(&protein)
        || !(0.0..=100.0).contains(&fat)
        || !(0.0..=100.0).contains(&carbs)
    {
        return false;
    }

    let macro_calories = protein * 4.0 + carbs * 4.0 + fat * 9.0;

    let diff = (macro_calories - calories).abs();

    diff < calories * 0.3
}

fn parse_macro(val: Option<f32>) -> Option<i32> {
    val.map(|v| (v * 100.0) as i32)
}

fn merge_products(parsed_product: &ParsedProduct, op_product: &OpenFoodProduct) -> FinalProduct {
    let category = op_product
        .categories
        .clone()
        .unwrap_or(parsed_product.category.clone().unwrap_or("Uknown".into()));

    let ingredients = op_product
        .ingredients
        .clone()
        .or(parsed_product.nutrition_basis.ingredients.clone());

    let allergens = op_product
        .allergens
        .clone()
        .or(parsed_product.nutrition_basis.allergens.clone());

    let calories = op_product.calories.map(|v| (v * 100.0) as i32).unwrap_or(
        parsed_product
            .nutrition_basis
            .nutrients
            .calories
            .unwrap_or(0),
    );

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
            quantity: parsed_product.nutrition_basis.weight,
            quantity_unit: parsed_product.nutrition_basis.unit.clone(),
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

fn parse_openfood_product(product: &OpenFoodProduct) -> Option<FinalProduct> {
    let barcode = product.barcode.clone()?;
    let name = product.product_name.clone()?;

    let category = product
        .categories
        .clone()
        .unwrap_or_else(|| "Unknown".into());
    let brand = product.brands.clone().unwrap_or_else(|| "Unknown".into());

    let calories = product.calories.map(|v| (v * 100.0) as i32)?;

    Some(FinalProduct {
        name,
        brand,
        category,
        barcodes: vec![barcode],
        nutrition_basis: CompleteNutritionBasis {
            quantity: product.quantity.map(|v| v as i32).unwrap_or(100),
            quantity_unit: product.quantity_unit.clone().unwrap_or("г".into()),
            ingredients: product.ingredients.clone(),
            allergens: product.allergens.clone(),
            nutrients: CompleteNutrients {
                calories,
                carbs: parse_macro(product.carbs),
                protein: parse_macro(product.protein),
                fat: parse_macro(product.fat),
                saturaged_fat: parse_macro(product.saturaged_fat),
                unsaturaged_fat: parse_macro(product.unsaturaged_fat),
                omega3_fat: parse_macro(product.omega3_fat),
                omega6_fat: parse_macro(product.omega6_fat),
                trans_fat: parse_macro(product.trans_fat),
                cholesterol: parse_macro(product.cholesterol),
                fiber: parse_macro(product.fiber),
                salt: parse_macro(product.salt),
                sodium: parse_macro(product.sodium),
                sugars: parse_macro(product.sugars),
            },
        },
        servings: vec![Serving {
            name: "Упаковка".into(),
            amount: 1.0,
            unit: "package".into(),
            weight: product.quantity.map(|v| v as i32),
            pieces: 1,
            source: ServingSource::Explicit,
        }],
    })
}

fn format_parsed_product(parsed_product: &ParsedProduct) -> FinalProduct {
    FinalProduct {
        name: parsed_product.name.clone(),
        brand: parsed_product.brand.clone(),
        category: parsed_product.category.clone().unwrap_or("Uknown".into()),
        barcodes: parsed_product.barcodes.clone(),
        nutrition_basis: CompleteNutritionBasis {
            quantity: parsed_product.nutrition_basis.weight,
            quantity_unit: parsed_product.nutrition_basis.unit.clone(),
            ingredients: parsed_product.nutrition_basis.ingredients.clone(),
            allergens: parsed_product.nutrition_basis.allergens.clone(),
            nutrients: CompleteNutrients {
                calories: parsed_product
                    .nutrition_basis
                    .nutrients
                    .calories
                    .unwrap_or(0),
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

fn get_col(batch: &RecordBatch, name: &str) -> Option<ArrayRef> {
    batch.column_by_name(name).cloned()
}

fn opt_string(array: &ArrayRef, row: usize) -> Option<String> {
    let array = array.as_any().downcast_ref::<StringArray>()?;

    if array.is_null(row) {
        return None;
    }

    Some(array.value(row).to_string())
}

fn opt_multilang_string(array: &ArrayRef, row: usize) -> Option<String> {
    let list = array.as_any().downcast_ref::<ListArray>()?;

    if list.is_null(row) {
        return None;
    }

    let values = list.value(row);

    let structs = values.as_any().downcast_ref::<StructArray>()?;

    if structs.len() == 0 {
        return None;
    }

    let text_col = structs.column_by_name("text")?;

    let texts = text_col.as_any().downcast_ref::<StringArray>()?;

    for i in 0..texts.len() {
        if !texts.is_null(i) {
            return Some(texts.value(i).to_string());
        }
    }

    None
}

fn opt_f32(array: &ArrayRef, row: usize) -> Option<f32> {
    if let Some(arr) = array.as_any().downcast_ref::<Float32Array>() {
        if arr.is_null(row) {
            None
        } else {
            Some(arr.value(row))
        }
    } else {
        None
    }
}

pub fn build_openfood_db(
    parquet_path: &str,
    db_path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    if Path::new(db_path).exists() {
        fs::remove_file(db_path)?;
    }

    let db = Database::create(db_path)?;

    let file = File::open(parquet_path)?;
    let builder = ParquetRecordBatchReaderBuilder::try_new(file)?;
    let reader = builder.with_batch_size(8192).build()?;

    let mut saved = 0usize;
    let mut processed = 0usize;

    let start = std::time::Instant::now();

    let mut write_txn = db.begin_write()?;
    let mut table = write_txn.open_table(OPENFOOD_TABLE)?;

    for batch in reader {
        let batch = batch?;

        let barcode_col = get_col(&batch, "code").ok_or("missing code")?;
        let name_col = get_col(&batch, "product_name").ok_or("missing name")?;
        let nutriments_col = get_col(&batch, "nutriments").ok_or("missing nutrients")?;

        let brands_col = get_col(&batch, "brands");
        let categories_col = get_col(&batch, "categories");
        let quantity_col = get_col(&batch, "product_quantity");
        let quantity_unit_col = get_col(&batch, "product_quantity_unit");
        let ingredients_col = get_col(&batch, "ingredients_text");
        let allergens_col = get_col(&batch, "allergens");
        let completeness_col = get_col(&batch, "completeness");

        for row in 0..batch.num_rows() {
            processed += 1;

            let barcode = match opt_string(&barcode_col, row) {
                Some(v) if v.len() >= 8 => v,
                _ => continue,
            };

            let name = match opt_multilang_string(&name_col, row) {
                Some(v) if !v.trim().is_empty() => v,
                _ => continue,
            };

            let completeness = completeness_col
                .as_ref()
                .and_then(|c| opt_f32(c, row))
                .unwrap_or(0.0);

            if completeness < 0.7 {
                continue;
            }

            let nutrients = parse_nutrients(&nutriments_col, row);

            if !qualifies_openfood_product(
                &Some(barcode.clone()),
                &Some(name.clone()),
                completeness,
                nutrients.calories,
                nutrients.protein,
                nutrients.fat,
                nutrients.carbs,
            ) {
                continue;
            }

            let product = StoredOpenFoodProduct {
                barcode: barcode.clone(),
                name,
                brand: brands_col.as_ref().and_then(|c| opt_string(c, row)),
                category: categories_col.as_ref().and_then(|c| opt_string(c, row)),
                quantity: quantity_col
                    .as_ref()
                    .and_then(|c| opt_string(c, row))
                    .and_then(|v| v.parse().ok()),
                quantity_unit: quantity_unit_col.as_ref().and_then(|c| opt_string(c, row)),
                ingredients: ingredients_col
                    .as_ref()
                    .and_then(|c| opt_multilang_string(c, row)),
                allergens: allergens_col.as_ref().and_then(|c| opt_string(c, row)),
                calories: nutrients.calories.unwrap(),
                protein: nutrients.protein,
                fat: nutrients.fat,
                carbs: nutrients.carbs,
                saturated_fat: nutrients.saturated_fat,
                unsaturated_fat: nutrients.unsaturated_fat,
                omega3: nutrients.omega3,
                omega6: nutrients.omega6,
                trans_fat: nutrients.trans_fat,
                cholesterol: nutrients.cholesterol,
                sugars: nutrients.sugars,
                fiber: nutrients.fiber,
                salt: nutrients.salt,
                sodium: nutrients.sodium,
            };

            let encoded = bincode::serialize(&product)?;

            table.insert(barcode.as_str(), encoded.as_slice())?;

            saved += 1;

            if saved % 50_000 == 0 {
                println!(
                    "{} processed | {} saved | {:.2}% | {:.1}s",
                    processed,
                    saved,
                    saved as f64 / processed as f64 * 100.0,
                    start.elapsed().as_secs_f64()
                );

                drop(table);
                write_txn.commit()?;

                write_txn = db.begin_write()?;
                table = write_txn.open_table(OPENFOOD_TABLE)?;
            }
        }
    }

    drop(table);
    write_txn.commit()?;

    println!(
        "created redb with {} products in {:.1}s",
        saved,
        start.elapsed().as_secs_f64()
    );

    Ok(())
}

pub fn process_open_food() -> Result<Vec<FinalProduct>, Box<dyn std::error::Error>> {
    let openfood_path = "./data/raw/openfood/openfood.redb";

    if !Path::new(openfood_path).exists() {
        println!("OpenFood DB missing, creating...");
        build_openfood_db("./data/raw/openfood/food.parquet", openfood_path)?;
    } else {
        println!("Using existing OpenFood DB");
    }

    let db = redb::Database::open(openfood_path)?;

    let mut final_products = Vec::new();

    let mut matched_barcodes = std::collections::HashSet::<String>::new();

    let sources: [Scraper; 1] = [Scraper::Kuper];

    for source in sources {
        let file = fs::read_to_string(format!("./data/raw/{}/{}.json", source.id(), source.id()))?;

        let parsed: Supermarket = serde_json::from_str(&file)?;

        println!(
            "processing {} ({} products)...",
            source.id(),
            parsed.products.len()
        );

        let mut matched_count = 0;
        let mut unmatched_count = 0;

        for parsed_product in parsed.products {
            let mut matched = false;

            for barcode in &parsed_product.barcodes {
                let barcode_string = barcode.to_string();
                let read_txn = db.begin_read()?;
                let table = read_txn.open_table(OPENFOOD_TABLE)?;

                if let Some(value) = table.get(barcode_string.as_str())? {
                    let stored: StoredOpenFoodProduct = bincode::deserialize(value.value())?;
                    let openfood: OpenFoodProduct = stored.into();

                    final_products.push(merge_products(&parsed_product, &openfood));

                    matched_barcodes.insert(barcode_string);
                    matched = true;
                    matched_count += 1;
                    break;
                }
            }

            if !matched {
                unmatched_count += 1;
                final_products.push(format_parsed_product(&parsed_product));
            }
        }

        println!(
            "{} results: {} matched with OpenFood ({:.2}%), {} without match",
            source.id(),
            matched_count,
            matched_count as f32 / (matched_count + unmatched_count) as f32 * 100.0,
            unmatched_count
        );
    }
    println!("adding remaining OpenFood products...");

    let read_txn = db.begin_read()?;
    let table = read_txn.open_table(OPENFOOD_TABLE)?;
    let mut openfood_count = 0;

    for item in table.iter()? {
        let (barcode, value) = item?;
        let barcode = barcode.value().to_string();

        if matched_barcodes.contains(&barcode) {
            continue;
        }

        let stored: StoredOpenFoodProduct = bincode::deserialize(value.value())?;
        let product: OpenFoodProduct = stored.into();

        if let Some(product) = parse_openfood_product(&product) {
            final_products.push(product);
            openfood_count += 1;
        }
    }

    println!("Created {} open food products.", openfood_count);
    println!("Created {} final products.", final_products.len());

    Ok(final_products)
}
