export const parseProduct = (product: any) => {
  const servings = [];

  const match = product.title.match(
    /(\d+)\s*[xх×]\s*(\d+(?:[.,]\d+)?)\s*(г|кг|мл|л)/i,
  );

  if (match) {
    const count = Number(match[1]);
    const amount = Number(match[2].replace(",", "."));
    const unit = match[3].toLowerCase();

    servings.push({
      name: "Упаковка",
      amount: 1,
      unit: "package",
      grams: product.masterData.weight ?? null,
      pieces: count,
      source: "Explicit",
    });
    servings.push({
      name: "Штука",
      amount: 1,
      unit: "piece",
      grams:
        unit === "г"
          ? amount
          : unit === "кг"
            ? amount * 1000
            : unit === "мл"
              ? amount
              : unit === "л"
                ? amount * 1000
                : null,
      pieces: 1,
      source: "Explicit",
    });
  } else if (product.masterData.weight) {
    servings.push({
      name: "Упаковка",
      amount: 1,
      unit: "package",
      grams: product.masterData.weight,
      pieces: 1,
      source: "Explicit",
    });
  }

  const nutrients = {
    calories: 0,
    protein: 0,
    fats: 0,
    carbohydrates: 0,
  };

  const finalProduct = {
    name: product.title,
    brand: "Перекрёсток",
    category: product.primaryCategory.title,
    nutrition_basis: {
      serving: product.masterData.weight ?? 100,
      unit: detectUnitFromName(product.title),
      nutrients,
      ingredients: "",
      allergens: null,
    },
    servings,
  };

  product.features.forEach((val: any) => {
    switch (val.title) {
      case "Пищевая ценность на 100г":
        val.items.forEach((val: any) => {
          switch (val.title) {
            case "Ккал":
              nutrients.calories = Number(val.values[0]) / 100;
              break;
            case "Белки":
              nutrients.protein = Number(val.values[0]) / 100;
              break;
            case "Жиры":
              nutrients.fats = Number(val.values[0]) / 100;
              break;
            case "Углеводы":
              nutrients.carbohydrates = Number(val.values[0]) / 100;
              break;
            default:
              break;
          }
        });
        break;
      case "Информация":
        val.items.forEach((val: any) => {
          switch (val.title) {
            case "Бренд":
              finalProduct.brand = val.displayValues[0];
              break;
            default:
              break;
          }
        });
        break;
      case "Состав":
        val.items.forEach((val: any) => {
          switch (val.title) {
            case "Состав":
              finalProduct.nutrition_basis.ingredients = val.displayValues[0];
              break;
            default:
              break;
          }
        });
        break;
      default:
        break;
    }
  });

  return finalProduct;
};

function detectUnitFromName(name: string): "г" | "мл" {
  const matches = [...name.matchAll(/(\d+(?:[.,]\d+)?)\s*(г|кг|мл|л)/gi)];

  if (matches.length === 0) {
    return "г"; // default
  }

  const unit = matches[matches.length - 1][2].toLowerCase();

  switch (unit) {
    case "л":
    case "мл":
      return "мл";

    case "кг":
    case "г":
    default:
      return "г";
  }
}
