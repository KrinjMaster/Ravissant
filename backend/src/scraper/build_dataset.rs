use rusqlite::{params, Connection};
use std::{
    collections::HashSet,
    fs::{self, create_dir_all, File},
};

use crate::scraper::{
    models::FinalProduct,
    openfood,
    scraper::Scraper,
    utils::{generate_product_id, generate_store_id},
};

pub async fn fetch_all_products() -> Result<(), Box<dyn std::error::Error>> {
    create_dir_all("data/raw")?;

    let scrapers = [Scraper::Kuper];

    let mut result_info: Vec<(usize, &str)> = vec![];

    for scraper in scrapers {
        println!("Now fetching {}!", scraper.display_name());

        let products = scraper.fetch().await;

        result_info.push((products.len(), scraper.display_name()));

        create_dir_all(format!("data/raw/{}/", scraper.id()))?;

        let file = File::create(format!("data/raw/{}/{}.json", scraper.id(), scraper.id()))?;

        serde_json::to_writer_pretty(file, &products)?;
    }

    for (len, name) in result_info {
        println!("Saved {} products from {}", len, name);
    }

    Ok(())
}

pub async fn parse_products_final() -> Result<(), Box<dyn std::error::Error>> {
    let openfood = openfood::process_open_food()?;

    create_dir_all("src/result/")?;
    let file = File::create("src/result/final.json")?;
    serde_json::to_writer_pretty(file, &openfood)?;
    println!("Created final products json!");

    Ok(())
}

pub fn build_database() -> Result<(), Box<dyn std::error::Error>> {
    let mut conn = Connection::open("main.db")?;

    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        DROP TABLE IF EXISTS meal_template_items;
        DROP TABLE IF EXISTS meal_templates;
        DROP TABLE IF EXISTS favorite_products;
        DROP TABLE IF EXISTS food_entries;
        DROP TABLE IF EXISTS weight_entries;

        DROP TABLE IF EXISTS product_servings;
        DROP TABLE IF EXISTS product_barcodes;
        DROP TABLE IF EXISTS product_sources;
        DROP TABLE IF EXISTS products;
        DROP TABLE IF EXISTS stores;

        CREATE TABLE stores (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE products (
            id TEXT PRIMARY KEY,

            name TEXT NOT NULL,
            search_text TEXT NOT NULL,

            brand TEXT,
            category TEXT,

            weight INTEGER NOT NULL,
            unit TEXT NOT NULL,

            ingredients TEXT,
            allergens TEXT,

            proteins_per_100g INTEGER,
            fats_per_100g INTEGER,
            carbs_per_100g INTEGER,
            calories_per_100g INTEGER,

            saturated_fat_per_100g INTEGER,
            unsaturated_fat_per_100g INTEGER,
            omega3_fat_per_100g INTEGER,
            omega6_fat_per_100g INTEGER,
            trans_fat_per_100g INTEGER,
            cholesterol_per_100g INTEGER,
            sugars_per_100g INTEGER,
            fiber_per_100g INTEGER,
            salt_per_100g INTEGER,
            sodium_per_100g INTEGER,

            version INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE product_sources (
            product_id TEXT NOT NULL,
            store_id TEXT NOT NULL,

            PRIMARY KEY (
                product_id,
                store_id
            ),

            FOREIGN KEY (product_id)
                REFERENCES products(id)
                ON DELETE CASCADE,

            FOREIGN KEY (store_id)
                REFERENCES stores(id)
                ON DELETE CASCADE
        );

        CREATE TABLE product_barcodes (
            product_id TEXT NOT NULL,
            barcode TEXT NOT NULL,

            PRIMARY KEY (
                product_id,
                barcode
            ),

            FOREIGN KEY (product_id)
                REFERENCES products(id)
                ON DELETE CASCADE
        );

        CREATE TABLE product_servings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            product_id TEXT NOT NULL,

            name TEXT NOT NULL,
            amount REAL NOT NULL,
            unit TEXT NOT NULL,
            weight INTEGER,
            pieces INTEGER,
            source TEXT NOT NULL,

            FOREIGN KEY (product_id)
                REFERENCES products(id)
                ON DELETE CASCADE
        );

        CREATE TABLE food_entries (
            id TEXT PRIMARY KEY,

            logged_at TEXT NOT NULL,
            logged_day TEXT NOT NULL,
            meal_type TEXT NOT NULL,

            product_id TEXT NOT NULL,
            grams REAL NOT NULL,

            FOREIGN KEY (product_id)
                REFERENCES products(id)
        );

        CREATE TABLE weight_entries (
            id TEXT PRIMARY KEY,

            logged_at TEXT NOT NULL,
            weight INTEGER NOT NULL
        );

        CREATE TABLE favorite_products (
            product_id TEXT PRIMARY KEY,

            FOREIGN KEY (product_id)
                REFERENCES products(id)
                ON DELETE CASCADE
        );

        CREATE TABLE meal_templates (
            id TEXT PRIMARY KEY,

            name TEXT NOT NULL,
            search_text TEXT NOT NULL
        );

        CREATE TABLE meal_template_items (
            meal_template_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            grams REAL NOT NULL,

            PRIMARY KEY (
                meal_template_id,
                product_id
            ),

            FOREIGN KEY (meal_template_id)
                REFERENCES meal_templates(id)
                ON DELETE CASCADE,

            FOREIGN KEY (product_id)
                REFERENCES products(id)
        );
        ",
    )?;

    // Load final products JSON

    let data = fs::read_to_string("src/result/final.json")?;

    let products: Vec<FinalProduct> = serde_json::from_str(&data)?;

    println!("Loaded {} products from final.json", products.len());

    // Prepared statements

    let tx = conn.transaction()?;

    let mut stmt_store = tx.prepare(
        "
        INSERT OR IGNORE INTO stores (
            id,
            name
        )
        VALUES (?1, ?2)
        ",
    )?;

    let mut stmt_product = tx.prepare(
        "
        INSERT INTO products (
            id,
            name,
            search_text,
            brand,
            category,
            weight,
            unit,
            ingredients,
            allergens,

            proteins_per_100g,
            fats_per_100g,
            carbs_per_100g,
            calories_per_100g,

            saturated_fat_per_100g,
            unsaturated_fat_per_100g,
            omega3_fat_per_100g,
            omega6_fat_per_100g,
            trans_fat_per_100g,
            cholesterol_per_100g,
            sugars_per_100g,
            fiber_per_100g,
            salt_per_100g,
            sodium_per_100g
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
            ?11,
            ?12,
            ?13,

            ?14,
            ?15,
            ?16,
            ?17,
            ?18,
            ?19,
            ?20,
            ?21,
            ?22,
            ?23
        )
        ",
    )?;

    let mut stmt_source = tx.prepare(
        "
        INSERT OR IGNORE INTO product_sources (
            product_id,
            store_id
        )
        VALUES (?1, ?2)
        ",
    )?;

    let mut stmt_barcode = tx.prepare(
        "
        INSERT OR IGNORE INTO product_barcodes (
            product_id,
            barcode
        )
        VALUES (?1, ?2)
        ",
    )?;

    let mut stmt_serving = tx.prepare(
        "
        INSERT INTO product_servings (
            product_id,
            name,
            amount,
            unit,
            weight,
            pieces,
            source
        )
        VALUES (
            ?1,
            ?2,
            ?3,
            ?4,
            ?5,
            ?6,
            ?7
        )
        ",
    )?;

    // Insert products
    let mut inserted_ids = HashSet::new();
    let mut categories = HashSet::new();

    for product in products {
        categories.insert(product.category.clone());

        let product_id = generate_product_id(
            &product.name,
            &product.brand,
            &product.nutrition_basis.weight,
        );

        if !inserted_ids.insert(product_id.clone()) {
            eprintln!(
                "Duplicate product: id={} name={:?} brand={:?} weight={}",
                product_id, product.name, product.brand, product.nutrition_basis.weight
            );

            continue;
        }

        let brand = product.brand.clone();

        let search_text = format!("{} {}", brand.to_lowercase(), product.name.to_lowercase());

        let nutrition = &product.nutrition_basis;
        let nutrients = &nutrition.nutrients;

        stmt_product.execute(params![
            product_id,
            product.name,
            search_text,
            brand,
            product.category,
            nutrition.weight,
            nutrition.unit,
            nutrition.ingredients,
            nutrition.allergens,
            nutrients.protein,
            nutrients.fat,
            nutrients.carbs,
            nutrients.calories,
            nutrients.saturated_fat,
            nutrients.unsaturated_fat,
            nutrients.omega3_fat,
            nutrients.omega6_fat,
            nutrients.trans_fat,
            nutrients.cholesterol,
            nutrients.sugars,
            nutrients.fiber,
            nutrients.salt,
            nutrients.sodium,
        ])?;

        // Sources

        for source in &product.sources {
            let store_id = generate_store_id(source);

            stmt_store.execute(params![store_id, source])?;

            stmt_source.execute(params![product_id, store_id])?;
        }

        // Barcodes

        for barcode in &product.barcodes {
            stmt_barcode.execute(params![product_id, barcode])?;
        }

        // Servings

        for serving in &product.servings {
            stmt_serving.execute(params![
                product_id,
                serving.name,
                serving.amount,
                serving.unit,
                serving.weight,
                serving.pieces,
                format!("{:?}", serving.source),
            ])?;
        }
    }

    println!(
        "All of categories: {}",
        categories
            .iter()
            .map(|v| v.to_string())
            .collect::<Vec<String>>()
            .join("; ")
    );

    drop(stmt_serving);
    drop(stmt_barcode);
    drop(stmt_source);
    drop(stmt_store);
    drop(stmt_product);

    tx.commit()?;

    // Statistics

    let product_count: i64 =
        conn.query_row("SELECT COUNT(*) FROM products", [], |row| row.get(0))?;

    let barcode_count: i64 =
        conn.query_row("SELECT COUNT(*) FROM product_barcodes", [], |row| {
            row.get(0)
        })?;

    let source_count: i64 =
        conn.query_row("SELECT COUNT(*) FROM product_sources", [], |row| row.get(0))?;

    let serving_count: i64 =
        conn.query_row("SELECT COUNT(*) FROM product_servings", [], |row| {
            row.get(0)
        })?;

    let store_count: i64 = conn.query_row("SELECT COUNT(*) FROM stores", [], |row| row.get(0))?;

    println!();
    println!("Database initialized successfully!");
    println!("Products:       {}", product_count);
    println!("Stores:   {}", store_count);
    println!("Product sources:{}", source_count);
    println!("Barcodes:       {}", barcode_count);
    println!("Servings:       {}", serving_count);

    Ok(())
}
