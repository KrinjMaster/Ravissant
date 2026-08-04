import { fetchLentaProducts } from "./lenta.js";
import { BrowserManager } from "./manager.js";

async function main() {
  const browser = new BrowserManager();

  await browser.connect();

  console.log("Connected");

  await browser.goto("https://vkusvill.ru/");
}

main();
