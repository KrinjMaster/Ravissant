import { BrowserManager } from "./manager";
import { parseProduct } from "./utils.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";

const limit = pLimit(1);

interface Category {
  id: number;
  slug: string;
  title: string;
}

interface Plu {
  cat: number;
  slug: string;
  plu: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(
  __dirname,
  "../scraper/results/perekrestok.json",
);

const plusPath = path.resolve(
  __dirname,
  "../../../data/raw/perekrestok/plus.json",
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchPerekrestokProducts() {
  const browser = new BrowserManager();

  await browser.connect();

  console.log("Connected");

  await browser.goto("https://www.perekrestok.ru");
  await browser.waitForAuth();

  await browser.goto("https://www.perekrestok.ru/cat");

  const categories: Category[] = await browser.getCategories();

  let productPlus = await loadProductPlus();

  if (productPlus) {
    console.log(`Loaded ${productPlus.length} cached PLUs.`);
  } else {
    productPlus = [];
  }

  const finalProducts: any[] = [];

  if (productPlus.length === 0) {
    await Promise.all(
      categories.map((category) =>
        limit(async () => {
          const result = await browser.browserFetch(
            "https://www.perekrestok.ru/api/customer/1.4.1.0/catalog/product/grouped-feed",
            {
              method: "POST",
              body: {
                page: 1,
                perPage: 100,
                filter: {
                  category: category.id,
                  onlyWithProductReviews: false,
                },
                withBestProductReviews: false,
              },
            },
          );

          const plus: Plu[] = result.json.content.items.flatMap((group: any) =>
            group.products.map((p: any) => {
              return {
                slug: p.masterData.slug,
                cat: category.id,
                plu: p.masterData.plu,
              };
            }),
          );

          productPlus.push(...plus);

          console.log(`Category ${category.title} done`);

          await sleep(1500 + Math.random() * 1000);
        }),
      ),
    );

    productPlus = Array.from(
      new Map(productPlus.map((p) => [p.plu, p])).values(),
    );

    await saveProductPlus(productPlus);

    console.log(`Saved ${productPlus.length} PLUs to cache.`);
  }
  console.log(`Saved ${productPlus.length} product plus!`);

  const WORKERS = 6;

  let index = 0;

  async function worker(id: number) {
    const page = await browser.createPage();

    while (true) {
      const current = index++;

      if (current >= productPlus.length) break;

      const plu = productPlus[current];

      if (!plu) {
        break;
      }

      try {
        await page.goto(
          `https://www.perekrestok.ru/cat/${plu.cat}/p/${plu.slug}-${plu.plu}`,
          {
            waitUntil: "domcontentloaded",
          },
        );

        const html = await page.content();

        const product = await browser.getInitialState(html);

        const data = product.catalog.productData[`${plu.slug}-${plu.plu}`];

        finalProducts.push(parseProduct(data));

        console.log(
          `[${current + 1}/${productPlus.length}] worker ${id}: ${plu.slug}`,
        );

        if (index % 100 === 0) {
          await fs.writeFile(
            outputPath,
            JSON.stringify(
              {
                supermarket_name: "Perekrestok",
                products: finalProducts,
              },
              null,
              2,
            ),
            "utf8",
          );
        }
      } catch (err) {
        console.log(`worker ${id} failed ${plu.slug}`);
      }

      await sleep(500 + Math.random() * 500);
    }

    await browser.closePage(page);
  }

  await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i + 1)));

  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        supermarket_name: "Perekrestok",
        products: finalProducts,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`Saved ${finalProducts.length} products.`);
}

main().catch(console.error);

async function loadProductPlus(): Promise<Plu[] | null> {
  try {
    const file = await fs.readFile(plusPath, "utf8");
    return [...new Set(JSON.parse(file) as Plu[])];
  } catch {
    return null;
  }
}

async function saveProductPlus(plus: Plu[]) {
  await fs.mkdir(path.dirname(plusPath), { recursive: true });

  await fs.writeFile(
    plusPath,
    JSON.stringify([...new Set(plus)], null, 2),
    "utf8",
  );
}
