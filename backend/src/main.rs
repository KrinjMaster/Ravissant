mod scraper;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // let _ = scraper::build_dataset::fetch_all_products().await;
    let _ = match scraper::build_dataset::parse_products_final().await {
        Ok(_) => println!("Parsed all products!"),
        Err(err) => eprintln!("Error: {err}"),
    };
    // let _ = scraper::build_dataset::build_database();

    Ok(())
}
