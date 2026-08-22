use serde::{Deserialize, Serialize};

// #[derive(Deserialize)]
// pub struct ApiResponse {
//     pub data: Data,
// }
//
// #[derive(Deserialize)]
// pub struct Data {
//     pub category: Category,
// }
//
// #[derive(Deserialize)]
// pub struct Category {
//     pub name: String,
//     pub products: Vec<Product>,
// }
//
// #[derive(Deserialize, Debug)]
// pub struct Product {
//     pub name: Option<String>,
//     pub attributes: Vec<Attribute>,
//     pub barcodes: Vec<String>,
// }
//
// #[derive(Deserialize, Debug)]
// pub struct Attribute {
//     pub name: Option<String>,
//     pub text: Option<String>,
// }

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ParsedProduct {
    pub name: String,
    pub brand: String,
    pub sources: Vec<String>,
    pub category: Option<String>,
    pub barcodes: Vec<String>,
    pub nutrition_basis: NutritionBasis,
    pub servings: Vec<Serving>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NutritionBasis {
    pub weight: i32,  // product weight to display
    pub unit: String, // product unit
    pub ingredients: Option<String>,
    pub allergens: Option<String>,
    pub nutrients: Nutrients,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Serving {
    pub name: String,
    pub amount: f64,
    pub unit: String, // piece, package
    pub weight: Option<i32>,
    pub pieces: i32,           // how many pieces in a serving
    pub source: ServingSource, // how reliable is this conversion?
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum ServingSource {
    Explicit,   // scraped from label/site
    Calculated, // derived from package size
    Estimated,  // AI/user guess
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Nutrients {
    pub calories: Option<i32>,
    pub proteins: Option<i32>,
    pub fats: Option<i32>,
    pub carbohydrates: Option<i32>,
}

#[derive(Serialize, Deserialize, Default)]
pub struct Supermarket {
    pub source: String,
    pub products: Vec<ParsedProduct>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FinalProduct {
    pub name: String,
    pub brand: String,
    pub category: String,
    pub barcodes: Vec<String>,
    pub nutrition_basis: CompleteNutritionBasis,
    pub servings: Vec<Serving>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CompleteNutritionBasis {
    pub quantity: i32,         // product weight to display
    pub quantity_unit: String, // product unit
    pub ingredients: Option<String>,
    pub allergens: Option<String>,
    pub nutrients: CompleteNutrients,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CompleteNutrients {
    pub calories: i32,
    pub protein: Option<i32>,
    pub fat: Option<i32>,
    pub carbs: Option<i32>,
    pub saturaged_fat: Option<i32>,
    pub unsaturaged_fat: Option<i32>,
    pub omega3_fat: Option<i32>,
    pub omega6_fat: Option<i32>,
    pub trans_fat: Option<i32>,
    pub cholesterol: Option<i32>,
    pub sugars: Option<i32>,
    pub fiber: Option<i32>,
    pub salt: Option<i32>,
    pub sodium: Option<i32>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct OpenFoodProduct {
    #[serde(rename = "code")]
    pub barcode: Option<String>,
    pub product_name: Option<String>,
    pub brands: Option<String>,
    pub categories: Option<String>,
    #[serde(rename = "product_quantity")]
    pub quantity: Option<f32>,
    #[serde(rename = "product_quantity_unit")]
    pub quantity_unit: Option<String>,
    pub countries: Option<String>,
    pub languages_tags: Option<String>,
    pub completeness: f32,
    pub countries_tag: Option<String>,
    #[serde(rename = "ingredients_text")]
    pub ingredients: Option<String>,
    pub allergens: Option<String>,
    #[serde(rename = "energy-kcal_100g")]
    pub calories: Option<f32>,
    #[serde(rename = "proteins_100g")]
    pub protein: Option<f32>,
    #[serde(rename = "fat_100g")]
    pub fat: Option<f32>,
    #[serde(rename = "carbohydrates_100g")]
    pub carbs: Option<f32>,

    // additional nutrients
    #[serde(rename = "saturated-fat_100g")]
    pub saturaged_fat: Option<f32>,
    #[serde(rename = "unsaturated-fat_100g")]
    pub unsaturaged_fat: Option<f32>,
    #[serde(rename = "omega-3-fat_100g")]
    pub omega3_fat: Option<f32>,
    #[serde(rename = "omega-6-fat_100g")]
    pub omega6_fat: Option<f32>,
    #[serde(rename = "trans-fat_100g")]
    pub trans_fat: Option<f32>,

    #[serde(rename = "cholesterol_100g")]
    pub cholesterol: Option<f32>,

    #[serde(rename = "sugars_100g")]
    pub sugars: Option<f32>,

    #[serde(rename = "fiber_100g")]
    pub fiber: Option<f32>,

    #[serde(rename = "salt_100g")]
    pub salt: Option<f32>,

    #[serde(rename = "sodium_100g")]
    pub sodium: Option<f32>,
}
