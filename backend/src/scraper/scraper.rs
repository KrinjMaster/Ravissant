use crate::scraper::{kuper::fetch_kuper_products, models::ParsedProduct};

pub enum Scraper {
    // Metro,
    // Perekrestok,
    // Vkusvill,
    // Lenta,
    Kuper,
}

impl Scraper {
    pub fn id(&self) -> &'static str {
        match self {
            // Scraper::Metro => "metro",
            // Scraper::Perekrestok => "perekrestok",
            // Scraper::Vkusvill => "vkusvill",
            // Scraper::Lenta => "lenta",
            Scraper::Kuper => "kuper",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            // Scraper::Metro => "Metro",
            // Scraper::Perekrestok => "Perekrestok",
            // Scraper::Vkusvill => "Vkusvill",
            // Scraper::Lenta => "Lenta",
            Scraper::Kuper => "Kuper",
        }
    }

    pub async fn fetch(&self) -> Vec<ParsedProduct> {
        match self {
            // Scraper::Metro => fetch_metro_products().await,
            // Scraper::Perekrestok => fetch_perekrestok_products().await,
            // Scraper::Vkusvill => fetch_vkusvill_products().await,
            // Scraper::Lenta => fetch_lenta_products().await,
            Scraper::Kuper => fetch_kuper_products().await,
        }
    }
}
