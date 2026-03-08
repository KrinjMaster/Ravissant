mod scraper;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let _ = scraper::build_dataset::fetch_all_products().await;
    let _ = scraper::build_dataset::build_database()?;

    Ok(())
}
