use rusqlite::Connection;
use std::fs::{self, create_dir_all, File};

use crate::scraper::{
    metro::fetch_metro_products,
    models::{ParsedProduct, Supermarket},
    utils::{generate_product_id, generate_supermarket_id},
};

pub async fn fetch_all_products() -> Result<(), Box<dyn std::error::Error>> {
    create_dir_all("src/scraper/results")?;

    // Metro supermarket
    let metro_products = fetch_metro_products().await;
    let metro_file = File::create("src/scraper/results/metro.json")?;
    let Metro = Supermarket {
        supermarket_name: "Metro".to_string(),
        products: metro_products,
    };

    serde_json::to_writer_pretty(metro_file, &Metro)?;
    println!("Saved {} products from metro", Metro.products.len());

    Ok(())
}

pub fn build_database() -> Result<(), Box<dyn std::error::Error>> {
    let supermarkets = vec!["metro"];
    let conn = Connection::open("main.db")?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS supermarkets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
        )
    ",
        [],
    )?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        source INTEGER NOT NULL,
        brand TEXT,
        category TEXT,
        weight REAL,
        proteins REAL,
        fats REAL,
        carbs REAL,
        calories REAL,
        FOREIGN KEY (source) REFERENCES supermarkets (id)
        )
    ",
        [],
    )?;

    let mut stmt_supermarket = conn.prepare(
        "
        INSERT INTO supermarkets
        (id, name)
        VALUES (?1, ?2)
        ",
    )?;

    let mut stmt_product = conn.prepare(
        "
        INSERT OR IGNORE INTO products
        (id, name, source, brand, category, weight, proteins, fats, carbs, calories)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        ",
    )?;

    for supermarket in supermarkets {
        let data = fs::read_to_string(format!("src/scraper/results/{}.json", supermarket))?;

        let supermarket_struct: Supermarket = serde_json::from_str(&data)?;

        let products: Vec<ParsedProduct> = supermarket_struct.products;

        let supermarket_id = generate_supermarket_id(&supermarket_struct.supermarket_name);

        // first insert supermarket into it's table
        stmt_supermarket.execute([&supermarket_id, &supermarket_struct.supermarket_name])?;

        for product in products {
            // then product itself
            let product_id = generate_product_id(
                &supermarket_id,
                &product.name,
                &product.brand.clone().unwrap_or_default(),
                &product.weight.unwrap_or(0.0),
            );

            stmt_product.execute([
                &product_id,
                &product.name,
                &supermarket_id.to_string(),
                &product.brand.unwrap_or_default(),
                &product.category,
                &product.weight.unwrap_or(0.0).to_string(),
                &product.nutrients.proteins.unwrap_or(0.0).to_string(),
                &product.nutrients.fats.unwrap_or(0.0).to_string(),
                &product.nutrients.carbohydrates.unwrap_or(0.0).to_string(),
                &product.nutrients.calories.unwrap_or(0.0).to_string(),
            ])?;
        }
    }

    println!("Database initiated from json files!");

    Ok(())
}
