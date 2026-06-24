use rusqlite::{params, Connection};
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

    let metro = Supermarket {
        supermarket_name: "Metro".to_string(),
        products: metro_products,
    };

    serde_json::to_writer_pretty(metro_file, &metro)?;

    println!("Saved {} products from metro", metro.products.len());

    Ok(())
}

pub fn build_database() -> Result<(), Box<dyn std::error::Error>> {
    let supermarkets = vec!["metro"];

    let mut conn = Connection::open("main.db")?;

    conn.execute("PRAGMA foreign_keys = ON;", [])?;

    //
    // Static tables
    //

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

            source TEXT NOT NULL,

            brand TEXT,

            source_category TEXT,

            serving_size REAL,

            proteins_per_100g REAL,

            fats_per_100g REAL,

            carbs_per_100g REAL,

            calories_per_100g REAL,

            version INTEGER NOT NULL DEFAULT 1,

            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (source)
                REFERENCES supermarkets(id)
        )
        ",
        [],
    )?;

    //
    // User tables
    //

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS food_entries (
            id TEXT PRIMARY KEY,

            logged_at TEXT NOT NULL,

            logged_day TEXT NOT NULL,

            meal_type TEXT NOT NULL,

            product_id TEXT NOT NULL,

            grams REAL NOT NULL,

            FOREIGN KEY (product_id)
                REFERENCES products(id)
        )
        ",
        [],
    )?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS weight_entries (
            id TEXT PRIMARY KEY,

            logged_at TEXT NOT NULL,

            weight REAL NOT NULL
        )
        ",
        [],
    )?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS favorite_products (
            product_id TEXT PRIMARY KEY,

            FOREIGN KEY (product_id)
                REFERENCES products(id)
        )
        ",
        [],
    )?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS meal_templates (
            id TEXT PRIMARY KEY,

            name TEXT NOT NULL
        )
        ",
        [],
    )?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS meal_template_items (
            meal_template_id TEXT NOT NULL,

            product_id TEXT NOT NULL,

            grams REAL NOT NULL,

            PRIMARY KEY (
                meal_template_id,
                product_id
            ),

            FOREIGN KEY (meal_template_id)
                REFERENCES meal_templates(id),

            FOREIGN KEY (product_id)
                REFERENCES products(id)
        )
        ",
        [],
    )?;

    let tx = conn.transaction()?;

    let mut stmt_supermarket = tx.prepare(
        "
        INSERT OR IGNORE INTO supermarkets (
            id,
            name
        )
        VALUES (?1, ?2)
        ",
    )?;

    let mut stmt_product = tx.prepare(
        "
        INSERT OR IGNORE INTO products (
            id,
            name,
            source,
            brand,
            source_category,
            serving_size,
            proteins_per_100g,
            fats_per_100g,
            carbs_per_100g,
            calories_per_100g
        )
        VALUES (
            ?1,
            ?2,
            ?3,
            ?4,
            ?5,
            ?6,
            ?7,
            ?8,
            ?9,
            ?10
        )
        ",
    )?;

    for supermarket in supermarkets {
        let data = fs::read_to_string(format!("src/scraper/results/{}.json", supermarket))?;

        let supermarket_struct: Supermarket = serde_json::from_str(&data)?;

        let products: Vec<ParsedProduct> = supermarket_struct.products;

        let supermarket_id = generate_supermarket_id(&supermarket_struct.supermarket_name);

        stmt_supermarket.execute(params![supermarket_id, supermarket_struct.supermarket_name])?;

        for product in products {
            let product_id = generate_product_id(
                &supermarket_id,
                &product.name,
                &product.brand.clone().unwrap_or_default(),
                &product.serving_size.unwrap_or(0.0),
            );

            stmt_product.execute(params![
                product_id,
                product.name,
                supermarket_id,
                product.brand.unwrap_or_default(),
                product.category,
                product.serving_size.unwrap_or(0.0),
                product.nutrients.proteins.unwrap_or(0.0),
                product.nutrients.fats.unwrap_or(0.0),
                product.nutrients.carbohydrates.unwrap_or(0.0),
                product.nutrients.calories.unwrap_or(0.0),
            ])?;
        }
    }

    drop(stmt_product);
    drop(stmt_supermarket);

    tx.commit()?;

    println!("Database initiated from json files!");

    Ok(())
}
