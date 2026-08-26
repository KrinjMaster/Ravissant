use sha2::{Digest, Sha256};

pub fn generate_product_id(name: &str, brand: &str, serving_size: &i32) -> String {
    let input = format!(
        "{}:{}:{}",
        name.to_lowercase(),
        brand.to_lowercase(),
        serving_size
    );

    let mut hasher = Sha256::new();
    hasher.update(input);

    let result = hasher.finalize();

    hex::encode(result)[0..16].to_string()
}

pub fn generate_store_id(name: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(name.to_string());

    let result = hasher.finalize();

    hex::encode(result)[0..16].to_string()
}
