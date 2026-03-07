mod scraper;

use reqwest::Client;
use scraper::metro::{fetch_category_products, fetch_metro_products};
use std::fs::{create_dir_all, File};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let metro_products = fetch_metro_products().await;
    create_dir_all("src/scraper/results")?;
    let metro_file = File::create("src/scraper/results/metro.json")?;
    serde_json::to_writer_pretty(metro_file, &metro_products)?;

    println!("Saved {} products from metro", metro_products.len());

    Ok(())
}
