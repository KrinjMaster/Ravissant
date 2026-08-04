use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct ApiResponse {
    pub data: Data,
}

#[derive(Deserialize)]
pub struct Data {
    pub category: Category,
}

#[derive(Deserialize)]
pub struct Category {
    pub name: String,
    pub products: Vec<Product>,
}

#[derive(Deserialize, Debug)]
pub struct Product {
    pub name: Option<String>,
    pub attributes: Vec<Attribute>,
    pub barcodes: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct Attribute {
    pub name: Option<String>,
    pub text: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ParsedProduct {
    pub name: String,
    pub brand: String,
    pub category: String,
    pub barcodes: Vec<i64>,
    pub nutrition_basis: NutritionBasis,
    pub servings: Vec<Serving>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NutritionBasis {
    pub weight: i64,  // product weight to display
    pub unit: String, // product unit
    pub ingredients: String,
    pub allergens: Option<String>,
    pub nutrients: Nutrients,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Serving {
    pub name: String,
    pub amount: f64,
    pub unit: String, // piece, package
    pub weight: Option<i64>,
    pub pieces: i64,           // how many pieces in a serving
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
    pub calories: i64,
    pub proteins: i64,
    pub fats: i64,
    pub carbohydrates: i64,
}

#[derive(Serialize, Deserialize, Default)]
pub struct Supermarket {
    pub supermarket_name: String,
    pub products: Vec<ParsedProduct>,
}
