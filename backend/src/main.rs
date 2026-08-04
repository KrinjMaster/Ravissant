use crate::scraper::openfood;

mod scraper;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // let _ = scraper::build_dataset::fetch_all_products().await;
    let _ = match openfood::parse_open_food() {
        Ok(_) => {}
        Err(err) => eprintln!("Error: {err}"),
    };
    // let _ = scraper::build_dataset::build_database();

    Ok(())
}
