use crate::scraper::models::{Attribute, Nutrients, ParsedProduct};

pub fn parse_product(
    name: Option<String>,
    attributes: &[Attribute],
    category: &str,
) -> ParsedProduct {
    let mut brand = None;
    let mut serving_size = None;

    let mut nutrients = Nutrients {
        proteins: None,
        fats: None,
        carbohydrates: None,
        calories: None,
    };

    for attr in attributes {
        let name_attr = match &attr.name {
            Some(n) => n,
            None => continue,
        };

        let value = match &attr.text {
            Some(v) => v.replace(",", "."),
            None => continue,
        };

        match name_attr.as_str() {
            "Бренд" => brand = Some(value),
            "Вес, объем" => serving_size = value.parse().ok(),
            "Белки, г" => nutrients.proteins = value.parse().ok(),
            "Жиры, г" => nutrients.fats = value.parse().ok(),
            "Углеводы, г" => nutrients.carbohydrates = value.parse().ok(),
            "Энергетическая ценность, ккал/100 г" => {
                nutrients.calories = value.parse().ok()
            }
            _ => {}
        }
    }

    ParsedProduct {
        name: name.unwrap_or_else(|| "unknown".to_string()),
        brand,
        serving_size,
        category: category.to_string(),
        nutrients,
    }
}
