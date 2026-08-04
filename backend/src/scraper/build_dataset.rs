use rusqlite::{params, Connection};
use std::fs::{self, create_dir_all, File};

use crate::scraper::{
    models::{ParsedProduct, Supermarket},
    scraper::Scraper,
    utils::{generate_product_id, generate_supermarket_id},
};

pub async fn fetch_all_products() -> Result<(), Box<dyn std::error::Error>> {
    create_dir_all("src/scraper/results")?;

    let scrapers = [
        Scraper::Metro,
        Scraper::Vkusvill,
        // Scraper::Perekrestok,
        // Scraper::Lenta,
    ];

    let mut result_info: Vec<(usize, &str)> = vec![];

    for scraper in scrapers {
        println!("Now fetching {}!", scraper.display_name());
        let products = scraper.fetch().await;

        result_info.push((products.len(), scraper.display_name()));

        let supermarket = Supermarket {
            supermarket_name: scraper.display_name().to_string(),
            products,
        };

        let file = File::create(format!("src/scraper/results/{}.json", scraper.id()))?;

        serde_json::to_writer_pretty(file, &supermarket)?;
    }

    for (len, name) in result_info {
        println!("Saved {} products from {}", len, name);
    }

    Ok(())
}

pub fn build_database() -> Result<(), Box<dyn std::error::Error>> {
    let supermarkets = vec!["metro"];

    let mut conn = Connection::open("main.db")?;

    conn.execute("PRAGMA foreign_keys = ON;", [])?;

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

            search_text TEXT NOT NULL,

            source TEXT NOT NULL,

            brand TEXT,

            source_category TEXT,

            serving_size INTEGER,

            proteins_per_100g INTEGER,

            fats_per_100g INTEGER,

            carbs_per_100g INTEGER,

            calories_per_100g INTEGER,

            version INTEGER NOT NULL DEFAULT 1,

            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (source)
                REFERENCES supermarkets(id)
        )
        ",
        [],
    )?;

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

            weight INTEGER NOT NULL
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

            name TEXT NOT NULL,

            search_text TEXT NOT NULL
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
            search_text,
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
            ?10,
            ?11
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
                &product.brand.clone(),
                &product.nutrition_basis.weight,
            );
            let brand = product.brand;

            let search_text = format!("{} {}", brand.to_lowercase(), product.name.to_lowercase(),);

            stmt_product.execute(params![
                product_id,
                product.name,
                search_text,
                supermarket_id,
                brand,
                product.category,
                product.nutrition_basis.weight,
                product.nutrition_basis.nutrients.proteins,
                product.nutrition_basis.nutrients.fats,
                product.nutrition_basis.nutrients.carbohydrates,
                product.nutrition_basis.nutrients.calories,
            ])?;
        }
    }

    drop(stmt_product);
    drop(stmt_supermarket);

    tx.commit()?;

    println!("Database initiated from json files!");

    Ok(())
}
