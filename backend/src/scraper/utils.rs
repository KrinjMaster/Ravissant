use sha2::{Digest, Sha256};

pub fn generate_product_id(source: &str, name: &str, brand: &str, serving_size: &f64) -> String {
    let input = format!(
        "{}:{}:{}:{}",
        source.to_lowercase(),
        name.to_lowercase(),
        brand.to_lowercase(),
        serving_size
    );

    let mut hasher = Sha256::new();
    hasher.update(input);

    let result = hasher.finalize();

    hex::encode(result)[0..16].to_string()
}

pub fn generate_supermarket_id(name: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(name.to_string());

    let result = hasher.finalize();

    hex::encode(result)[0..16].to_string()
}
