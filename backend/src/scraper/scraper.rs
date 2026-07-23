use crate::scraper::{metro::fetch_metro_products, models::ParsedProduct};

pub enum Scraper {
    Metro,
}

impl Scraper {
    pub fn id(&self) -> &'static str {
        match self {
            Scraper::Metro => "metro",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            Scraper::Metro => "Metro",
        }
    }

    pub async fn fetch(&self) -> Vec<ParsedProduct> {
        match self {
            Scraper::Metro => fetch_metro_products().await,
        }
    }
}
