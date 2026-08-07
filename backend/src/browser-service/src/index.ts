import { fetchLentaProducts } from "./lenta.js";
import { BrowserManager } from "./manager.js";
import { fetchPerekrestokProducts } from "./perekrestok.js";

async function main() {
  await fetchPerekrestokProducts().catch(Error);
}

main();
