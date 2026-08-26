use crate::scraper::{
    models::{
        CompleteNutrients, CompleteNutritionBasis, FinalProduct, OpenFoodProduct, ParsedProduct,
    },
    scraper::Scraper,
    utils::generate_product_id,
};
use arrow::array::{Array, ArrayRef, Float32Array, ListArray, StringArray, StructArray};
use arrow::record_batch::RecordBatch;
use parquet::arrow::arrow_reader::ParquetRecordBatchReaderBuilder;
use redb::{Database, ReadableDatabase, TableDefinition};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet},
    fs::{self, File},
    path::Path,
};

const NON_FOOD_CATEGORIES: &[&str] = &[
    "Корма для кошек",
    "Корма для собак",
    "Наполнитель",
    "Комплектация",
];

#[derive(Debug, Serialize, Deserialize)]
struct StoredOpenFoodProduct {
    barcode: String,
    name: String,
    brand: Option<String>,
    category: Option<String>,
    countries_tags: Option<String>,
    quantity: f32,
    quantity_unit: Option<String>,
    ingredients: Option<String>,
    allergens: Option<String>,
    completeness: f32,
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
            countries_tag: p.countries_tags,
            categories: p.category,
            quantity: Some(p.quantity),
            quantity_unit: p.quantity_unit,
            ingredients: p.ingredients,
            allergens: p.allergens,
            completeness: p.completeness,
            calories: Some(p.calories),
            protein: p.protein,
            fat: p.fat,
            carbs: p.carbs,
            saturated_fat: p.saturated_fat,
            unsaturated_fat: p.unsaturated_fat,
            omega3_fat: p.omega3,
            omega6_fat: p.omega6,
            trans_fat: p.trans_fat,
            cholesterol: p.cholesterol,
            sugars: p.sugars,
            fiber: p.fiber,
            salt: p.salt,
            sodium: p.sodium,
            countries: None,
            languages_tags: None,
        }
    }
}

#[derive(Default, Debug)]
struct EnrichedNutrients {
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

impl EnrichedNutrients {
    fn from_product(product: &OpenFoodProduct) -> Self {
        Self {
            calories: product.calories,
            protein: product.protein,
            fat: product.fat,
            carbs: product.carbs,
            saturated_fat: product.saturated_fat,
            unsaturated_fat: product.unsaturated_fat,
            omega3: product.omega3_fat,
            omega6: product.omega6_fat,
            trans_fat: product.trans_fat,
            cholesterol: product.cholesterol,
            sugars: product.sugars,
            fiber: product.fiber,
            salt: product.salt,
            sodium: product.sodium,
        }
    }
    fn enrich_from(&mut self, product: &OpenFoodProduct) {
        self.calories = self.calories.or(product.calories);
        self.protein = self.protein.or(product.protein);
        self.fat = self.fat.or(product.fat);
        self.carbs = self.carbs.or(product.carbs);
        self.saturated_fat = self.saturated_fat.or(product.saturated_fat);
        self.unsaturated_fat = self.unsaturated_fat.or(product.unsaturated_fat);
        self.omega3 = self.omega3.or(product.omega3_fat);
        self.omega6 = self.omega6.or(product.omega6_fat);
        self.trans_fat = self.trans_fat.or(product.trans_fat);
        self.cholesterol = self.cholesterol.or(product.cholesterol);
        self.sugars = self.sugars.or(product.sugars);
        self.fiber = self.fiber.or(product.fiber);
        self.salt = self.salt.or(product.salt);
        self.sodium = self.sodium.or(product.sodium);
    }
}

const OPENFOOD_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("openfood");

fn parse_nutrients(array: &ArrayRef, row: usize) -> EnrichedNutrients {
    let mut result = EnrichedNutrients::default();

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

fn openfood_match_score(product: &OpenFoodProduct) -> f32 {
    let mut score = product.completeness;

    if product.saturated_fat.is_some() {
        score += 0.05;
    }

    if product.unsaturated_fat.is_some() {
        score += 0.05;
    }
    if product.sugars.is_some() {
        score += 0.05;
    }
    if product.fiber.is_some() {
        score += 0.05;
    }
    if product.salt.is_some() {
        score += 0.05;
    }
    if product.sodium.is_some() {
        score += 0.05;
    }
    if product.ingredients.is_some() {
        score += 0.05;
    }
    score
}

fn qualifies_openfood_product(
    barcode: &Option<String>,
    name: &Option<String>,
    completeness: f32,
    calories: Option<f32>,
    protein: Option<f32>,
    fat: Option<f32>,
    carbs: Option<f32>,
    countries_tags: Option<String>,
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

    if let Some(tags) = countries_tags {
        if !tags.to_lowercase().contains("russia") {
            return false;
        }
    }

    if completeness < 0.5 {
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

fn clean_text(text: Option<String>) -> Option<String> {
    text.map(|text| {
        text
            // Actual CRLF / CR characters
            .replace("\r\n", "\n")
            .replace('\r', "\n")
            // Literal escaped sequences
            .replace("\\r\\n", "\n")
            .replace("\\n", "\n")
            .replace("\\r", "\n")
            // HTML whitespace/entities if they appear in scraped data
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&quot;", "\"")
            .replace("&#39;", "'")
            // Clean excessive whitespace around lines
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join("\n")
    })
}

fn merge_products(parsed_product: &ParsedProduct, nutrients: &EnrichedNutrients) -> FinalProduct {
    FinalProduct {
        name: parsed_product.name.clone(),
        brand: parsed_product.brand.clone(),
        category: parsed_product.category.clone().unwrap_or("Другое".into()),
        sources: parsed_product.sources.clone(),
        barcodes: parsed_product.barcodes.clone(),
        nutrition_basis: CompleteNutritionBasis {
            weight: parsed_product.nutrition_basis.weight,
            unit: parsed_product.nutrition_basis.unit.clone(),
            ingredients: clean_text(parsed_product.nutrition_basis.ingredients.clone()),
            allergens: clean_text(parsed_product.nutrition_basis.allergens.clone()),
            nutrients: CompleteNutrients {
                calories: parse_macro(nutrients.calories)
                    .or(parsed_product.nutrition_basis.nutrients.calories),
                protein: parse_macro(nutrients.protein).unwrap_or(
                    parsed_product
                        .nutrition_basis
                        .nutrients
                        .proteins
                        .unwrap_or(0),
                ),
                fat: parse_macro(nutrients.fat)
                    .unwrap_or(parsed_product.nutrition_basis.nutrients.fats.unwrap_or(0)),
                carbs: parse_macro(nutrients.carbs).unwrap_or(
                    parsed_product
                        .nutrition_basis
                        .nutrients
                        .carbohydrates
                        .unwrap_or(0),
                ),
                saturated_fat: parse_macro(nutrients.saturated_fat),
                unsaturated_fat: parse_macro(nutrients.unsaturated_fat),
                omega3_fat: parse_macro(nutrients.omega3),
                omega6_fat: parse_macro(nutrients.omega6),
                trans_fat: parse_macro(nutrients.trans_fat),
                cholesterol: parse_macro(nutrients.cholesterol),
                sugars: parse_macro(nutrients.sugars),
                fiber: parse_macro(nutrients.fiber),
                salt: parse_macro(nutrients.salt),
                sodium: parse_macro(nutrients.sodium),
            },
        },
        servings: parsed_product.servings.clone(),
    }
}

// fn parse_openfood_product(product: &OpenFoodProduct) -> Option<FinalProduct> {
//     let barcode = product.barcode.clone()?;
//     let name = product.product_name.clone()?;
//
//     let category = product
//         .categories
//         .clone()
//         .unwrap_or_else(|| "Unknown".into());
//     let brand = product.brands.clone().unwrap_or_else(|| "Unknown".into());
//
//     let calories = product.calories.map(|v| (v * 100.0) as i32)?;
//
//     Some(FinalProduct {
//         name,
//         brand,
//         category,
//         barcodes: vec![barcode],
//         sources: vec!["OpenFoodProducts".into()],
//         nutrition_basis: CompleteNutritionBasis {
//             weight: product.quantity.map(|v| v as i32).unwrap_or(100),
//             unit: product.quantity_unit.clone().unwrap_or("г".into()),
//             ingredients: product.ingredients.clone(),
//             allergens: product.allergens.clone(),
//             nutrients: CompleteNutrients {
//                 calories: Some(calories),
//                 carbs: parse_macro(product.carbs).unwrap_or(0),
//                 protein: parse_macro(product.protein).unwrap_or(0),
//                 fat: parse_macro(product.fat).unwrap_or(0),
//                 saturated_fat: parse_macro(product.saturated_fat),
//                 unsaturated_fat: parse_macro(product.unsaturated_fat),
//                 omega3_fat: parse_macro(product.omega3_fat),
//                 omega6_fat: parse_macro(product.omega6_fat),
//                 trans_fat: parse_macro(product.trans_fat),
//                 cholesterol: parse_macro(product.cholesterol),
//                 fiber: parse_macro(product.fiber),
//                 salt: parse_macro(product.salt),
//                 sodium: parse_macro(product.sodium),
//                 sugars: parse_macro(product.sugars),
//             },
//         },
//         servings: vec![Serving {
//             name: "Упаковка".into(),
//             amount: 1.0,
//             unit: "package".into(),
//             weight: product.quantity.map(|v| v as i32),
//             pieces: 1,
//             source: ServingSource::Explicit,
//         }],
//     })
// }

fn format_parsed_product(parsed_product: &ParsedProduct) -> FinalProduct {
    FinalProduct {
        name: parsed_product.name.clone(),
        brand: parsed_product.brand.clone(),
        category: parsed_product.category.clone().unwrap_or("Uknown".into()),
        sources: parsed_product.sources.clone(),
        barcodes: parsed_product.barcodes.clone(),
        nutrition_basis: CompleteNutritionBasis {
            weight: parsed_product.nutrition_basis.weight,
            unit: parsed_product.nutrition_basis.unit.clone(),
            ingredients: parsed_product.nutrition_basis.ingredients.clone(),
            allergens: parsed_product.nutrition_basis.allergens.clone(),
            nutrients: CompleteNutrients {
                calories: parsed_product.nutrition_basis.nutrients.calories,
                protein: parsed_product
                    .nutrition_basis
                    .nutrients
                    .proteins
                    .unwrap_or(0),
                fat: parsed_product.nutrition_basis.nutrients.fats.unwrap_or(0),
                carbs: parsed_product
                    .nutrition_basis
                    .nutrients
                    .carbohydrates
                    .unwrap_or(0),
                saturated_fat: None,
                unsaturated_fat: None,
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

fn opt_list_string(array: &ArrayRef, row: usize) -> Option<String> {
    let list = array.as_any().downcast_ref::<ListArray>()?;

    if list.is_null(row) {
        return None;
    }

    let values = list.value(row);
    let strings = values.as_any().downcast_ref::<StringArray>()?;

    let values = (0..strings.len())
        .filter(|&i| !strings.is_null(i))
        .map(|i| strings.value(i))
        .filter(|v| !v.trim().is_empty())
        .collect::<Vec<_>>();

    if values.is_empty() {
        None
    } else {
        Some(values.join(","))
    }
}

fn decode_html(value: String) -> String {
    html_escape::decode_html_entities(&value).to_string()
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
        let countries_tags_col = get_col(&batch, "countries_tags").ok_or("missing countries")?;

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
                Some(v) if !v.trim().is_empty() => decode_html(v),
                _ => continue,
            };

            let brand = brands_col
                .as_ref()
                .and_then(|c| opt_string(c, row))
                .map(decode_html);

            let category = categories_col
                .as_ref()
                .and_then(|c| opt_string(c, row))
                .map(decode_html);

            let ingredients = ingredients_col
                .as_ref()
                .and_then(|c| opt_multilang_string(c, row))
                .map(decode_html);

            let allergens = allergens_col
                .as_ref()
                .and_then(|c| opt_string(c, row))
                .map(decode_html);

            let countries = opt_list_string(&countries_tags_col, row);

            let quantity = quantity_col
                .as_ref()
                .and_then(|c| opt_string(c, row))
                .and_then(|v| v.parse::<f32>().ok())
                .filter(|v| *v > 0.0)
                .unwrap_or(100.0);

            let completeness = completeness_col
                .as_ref()
                .and_then(|c| opt_f32(c, row))
                .unwrap_or(0.0);

            if completeness < 0.3 {
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
                Some("russia".into()),
            ) {
                continue;
            }

            let product = StoredOpenFoodProduct {
                barcode: barcode.clone(),
                name,
                brand,
                category,
                countries_tags: countries,
                quantity,
                quantity_unit: quantity_unit_col.as_ref().and_then(|c| opt_string(c, row)),
                ingredients,
                allergens,
                completeness,
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

// fn qualifies_standalone_openfood_product(product: &OpenFoodProduct) -> bool {
//     let Some(name) = &product.product_name else { return false; };
//
//     let Some(_) = &product.barcode else { return false; };
//
//     let (Some(calories), Some(protein), Some(fat), Some(carbs)) = ( product.calories, product.protein, product.fat, product.carbs, ) else { return false; };
//
//     if name.trim().is_empty() {
//         return false;
//     }
//
//     if let Some(tags) = product.countries_tag.clone() {
//         if !tags.to_lowercase().contains("russia") {
//             return false;
//         }
//     }
//
//     if !(0.0..=1000.0).contains(&calories) {
//         return false;
//     }
//
//     if !(0.0..=100.0).contains(&protein)
//         || !(0.0..=100.0).contains(&fat)
//         || !(0.0..=100.0).contains(&carbs)
//     {
//         return false;
//     }
//
//     true
// }

fn enrich_nutrients(existing: &mut CompleteNutrients, incoming: &CompleteNutrients) {
    if existing.calories.is_none() {
        existing.calories = incoming.calories;
    }

    if existing.saturated_fat.is_none() {
        existing.saturated_fat = incoming.saturated_fat;
    }

    if existing.unsaturated_fat.is_none() {
        existing.unsaturated_fat = incoming.unsaturated_fat;
    }

    if existing.omega3_fat.is_none() {
        existing.omega3_fat = incoming.omega3_fat;
    }

    if existing.omega6_fat.is_none() {
        existing.omega6_fat = incoming.omega6_fat;
    }

    if existing.trans_fat.is_none() {
        existing.trans_fat = incoming.trans_fat;
    }

    if existing.cholesterol.is_none() {
        existing.cholesterol = incoming.cholesterol;
    }

    if existing.sugars.is_none() {
        existing.sugars = incoming.sugars;
    }

    if existing.fiber.is_none() {
        existing.fiber = incoming.fiber;
    }

    if existing.salt.is_none() {
        existing.salt = incoming.salt;
    }

    if existing.sodium.is_none() {
        existing.sodium = incoming.sodium;
    }
}

fn enrich_final_product(existing: &mut FinalProduct, incoming: &FinalProduct) {
    // Add new sources.
    for source in &incoming.sources {
        if !existing.sources.contains(source) {
            existing.sources.push(source.clone());
        }
    }

    // Add new barcodes.
    for barcode in &incoming.barcodes {
        if !existing.barcodes.contains(barcode) {
            existing.barcodes.push(barcode.clone());
        }
    }

    // Fill missing basic information.
    if existing.brand.trim().is_empty() && !incoming.brand.trim().is_empty() {
        existing.brand = incoming.brand.clone();
    }

    if existing.category.trim().is_empty() && !incoming.category.trim().is_empty() {
        existing.category = incoming.category.clone();
    }

    // Fill missing ingredients.
    if existing
        .nutrition_basis
        .ingredients
        .clone()
        .map(|v| v.trim().is_empty())
        .is_some_and(|v| v == true)
        && !incoming
            .nutrition_basis
            .ingredients
            .clone()
            .map(|v| v.trim().is_empty())
            .is_some_and(|v| v == true)
    {
        existing.nutrition_basis.ingredients = incoming.nutrition_basis.ingredients.clone();
    }

    // Fill missing allergens.
    if existing.nutrition_basis.allergens.is_none() && incoming.nutrition_basis.allergens.is_some()
    {
        existing.nutrition_basis.allergens = incoming.nutrition_basis.allergens.clone();
    }

    enrich_nutrients(
        &mut existing.nutrition_basis.nutrients,
        &incoming.nutrition_basis.nutrients,
    );
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

    let mut final_products: HashMap<String, FinalProduct> = HashMap::new();

    let mut matched_barcodes = HashSet::<String>::new();

    let sources: [Scraper; 1] = [Scraper::Kuper];

    for source in sources {
        let file = fs::read_to_string(format!("./data/raw/{}/{}.json", source.id(), source.id()))?;

        let parsed: Vec<ParsedProduct> = serde_json::from_str(&file)?;

        println!("processing {} ({} products)...", source.id(), parsed.len());

        let mut matched_count = 0;
        let mut unmatched_count = 0;
        let mut duplicate_count = 0;

        for parsed_product in parsed {
            if parsed_product.nutrition_basis.nutrients.calories.is_none()
                || NON_FOOD_CATEGORIES.contains(
                    &parsed_product
                        .category
                        .clone()
                        .unwrap_or("blablabla".into())
                        .as_str(),
                )
            {
                continue;
            }

            let mut matches: Vec<OpenFoodProduct> = Vec::new();

            let read_txn = db.begin_read()?;
            let table = read_txn.open_table(OPENFOOD_TABLE)?;

            for barcode in &parsed_product.barcodes {
                if let Some(value) = table.get(barcode.as_str())? {
                    let stored: StoredOpenFoodProduct = bincode::deserialize(value.value())?;

                    let openfood: OpenFoodProduct = stored.into();

                    matches.push(openfood);
                }
            }

            let final_product;

            if matches.is_empty() {
                unmatched_count += 1;

                final_product = format_parsed_product(&parsed_product);
            } else {
                matches.sort_by(|a, b| {
                    openfood_match_score(b)
                        .partial_cmp(&openfood_match_score(a))
                        .unwrap_or(std::cmp::Ordering::Equal)
                });

                let primary = &matches[0];

                let mut enriched = EnrichedNutrients::from_product(primary);

                for other in &matches[1..] {
                    enriched.enrich_from(other);
                }

                final_product = merge_products(&parsed_product, &enriched);

                for matched in &matches {
                    if let Some(barcode) = &matched.barcode {
                        matched_barcodes.insert(barcode.clone());
                    }
                }

                matched_count += 1;
            }

            // Generate canonical ID AFTER enrichment.
            let product_id = generate_product_id(
                &final_product.name,
                &final_product.brand,
                &final_product.nutrition_basis.weight,
            );

            if let Some(existing) = final_products.get_mut(&product_id) {
                duplicate_count += 1;

                enrich_final_product(existing, &final_product);
            } else {
                final_products.insert(product_id, final_product);
            }
        }

        let processed_count = matched_count + unmatched_count;

        println!(
            "{} results: {} matched with OpenFood ({:.2}%), {} without match, {} duplicates",
            source.id(),
            matched_count,
            if processed_count > 0 {
                matched_count as f32 / processed_count as f32 * 100.0
            } else {
                0.0
            },
            unmatched_count,
            duplicate_count
        );
    }

    let final_products: Vec<FinalProduct> = final_products.into_values().collect();

    println!("Created {} unique final products.", final_products.len());

    Ok(final_products)
}
