import { chromium, type Page, type BrowserContext } from "playwright";
import fs from "node:fs/promises";
import { BrowserManager } from "./manager.js";

type PackageUnit = "г" | "мл";

interface PackageInfo {
  amount: number;
  unit: PackageUnit;
}

interface ParsedProduct {
  name: string;
  category: string;
  brand: string;
  nutrition_basis: {
    serving: number;
    unit: string;
    ingredients: string;
    allergens?: string;
    nutrients: {
      calories: number;
      proteins: number;
      fats: number;
      carbohydrates: number;
    };
  };
}

export async function fetchLentaProducts() {
  const browser = new BrowserManager();

  await browser.connect();

  console.log("Connected");

  console.log("Opening Lenta");
  await browser.goto("https://lenta.com");
  await browser.waitForAuth();

  const ids = await getProductIds(browser);

  console.log(true);

  // console.log("Products:", ids.length);
  //
  // const products: ParsedProduct[] = [];
  //
  // for (let i = 0; i < ids.length; i++) {
  //   const product = await getProduct(ids[i]);
  //
  //   if (product) {
  //     products.push(product);
  //   }
  //
  //   console.log(`[${i + 1}/${ids.length}]`, ids[i]);
  //   console.log(product);
  // }

  // return products;
}

async function getProduct(id: number): Promise<ParsedProduct | null> {
  const response = await page.evaluate(async (id) => {
    const res = await fetch(`/api-gateway/v1/catalog/items/${id}`);

    return await res.json();
  }, id);

  if (!response) return null;

  let brand = "Лента";
  let ingredients = "";
  let proteins = 0;
  let fats = 0;
  let carbs = 0;
  let calories = 0;

  for (const attr of response.attributes ?? []) {
    switch (attr.name) {
      case "Бренд":
        brand = attr.value;
        break;
      case "Состав":
        ingredients = attr.value;
        break;
      case "Пищевая ценность":
        const macros = parseMacros(attr.value);
        proteins = macros.proteins;
        fats = macros.fats;
        carbs = macros.carbs;
        break;
      case "Энергетическая ценность":
        calories = parseCalories(attr.value);
        break;
    }
  }

  const pack = parsePackage(response.display?.package);

  return {
    name: response.name,
    category: response.categories?.[0]?.name ?? "Без категории",
    brand,
    nutrition_basis: {
      serving: pack.amount,
      unit: pack.unit,
      ingredients,
      nutrients: {
        calories,
        proteins,
        fats,
        carbohydrates: carbs,
      },
    },
  };
}

async function getProductIds(manager: BrowserManager): Promise<number[]> {
  const page = manager.getPage();
  const xml = await page.evaluate(async () => {
    const res = await fetch("/sitemap/sitemap_index.xml");

    return await res.text();
  });

  const sitemapUrls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((x) => x[1])
    .filter((x) => x.includes("sitemap_item_"));

  const ids: number[] = [];

  for (const sitemap of sitemapUrls) {
    const xml = await page.evaluate(async (url) => {
      const res = await fetch(url);

      return await res.text();
    }, sitemap);

    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
      .map((x) => x[1])
      .filter((x) => x.includes("/product/"));

    for (const url of urls) {
      const id = productId(url);

      if (id) ids.push(id);
    }
  }

  return ids;
}

function productId(url: string) {
  const slug = url.replace(/\/$/, "").split("/").pop();

  if (!slug) return null;

  const id = slug.split("-").pop();

  return Number(id) || null;
}

function parsePackage(packageText: string): PackageInfo {
  if (!packageText)
    return {
      amount: 100,
      unit: "г",
    };

  const normalized = packageText.trim().toLowerCase().replace(",", ".");

  const parts = normalized.split(/\s+/);

  const value = Number(parts[0]);

  if (Number.isNaN(value))
    return {
      amount: 100,
      unit: "г",
    };

  const unit = parts[1];

  switch (unit) {
    case "г":
    case "гр":
    case "g":
      return {
        amount: Math.round(value),
        unit: "г",
      };

    case "кг":
    case "kg":
      return {
        amount: Math.round(value * 1000),
        unit: "г",
      };

    case "мл":
    case "ml":
      return {
        amount: Math.round(value),
        unit: "мл",
      };

    case "л":
    case "l":
      return {
        amount: Math.round(value * 1000),
        unit: "мл",
      };

    default:
      return {
        amount: 100,
        unit: "г",
      };
  }
}

function parseMacros(text: string) {
  const regex =
    /Белки\s*[–-]\s*([\d.,]+)г,\s*жиры\s*[–-]\s*([\d.,]+)г,\s*углеводы\s*[–-]\s*([\d.,]+)г/;

  const match = text.match(regex);

  if (!match)
    return {
      proteins: 0,
      fats: 0,
      carbs: 0,
    };

  return {
    proteins: Math.round(Number(match[1].replace(",", "."))),

    fats: Math.round(Number(match[2].replace(",", "."))),

    carbs: Math.round(Number(match[3].replace(",", "."))),
  };
}

function parseCalories(text: string) {
  const match = text.match(/([\d.,]+)\s*кКал/);

  if (!match) return 0;

  return Math.round(Number(match[1].replace(",", ".")));
}
