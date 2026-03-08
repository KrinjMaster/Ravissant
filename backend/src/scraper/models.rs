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

#[derive(Deserialize)]
pub struct Product {
    pub name: Option<String>,
    pub attributes: Vec<Attribute>,
}

#[derive(Deserialize)]
pub struct Attribute {
    pub name: Option<String>,
    pub text: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Nutrients {
    pub proteins: Option<f32>,
    pub fats: Option<f32>,
    pub carbohydrates: Option<f32>,
    pub calories: Option<f32>,
}

#[derive(Serialize, Deserialize)]
pub struct ParsedProduct {
    pub name: String,
    pub brand: Option<String>,
    pub weight: Option<f32>,
    pub category: String,
    pub nutrients: Nutrients,
}

#[derive(Serialize, Deserialize)]
pub struct Supermarket {
    pub supermarket_name: String,
    pub products: Vec<ParsedProduct>,
}
