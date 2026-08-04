import { chromium } from "playwright";
import type { Browser, BrowserContext, Page } from "playwright";

type BrowserFetchOptions = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
};

export class BrowserManager {
  private browser!: Browser;
  private context!: BrowserContext;
  private page!: Page;

  private authHeaders: Record<string, string> = {};

  private authReady!: Promise<void>;
  private resolveAuth!: () => void;

  async connect() {
    this.browser = await chromium.connectOverCDP("http://127.0.0.1:9222");

    const context = this.browser.contexts()[0];

    if (!context) {
      throw new Error("No browser context");
    }

    this.context = context;
    this.page = context.pages()[0] ?? (await context.newPage());

    this.setupNetworkLogging();
  }

  private setupNetworkLogging() {
    this.authReady = new Promise((resolve) => {
      this.resolveAuth = resolve;
    });

    this.page.on("request", async (request) => {
      if (!request.url().includes("vkusvill.ru")) return;

      // console.log("REQUEST", request.url(), request.method());
      // if (request.url().includes("/grouped-feed")) {
      //   console.log("REQUEST", request.method(), request.url());
      //   console.log(await request.postDataJSON());
      // }

      const headers = request.headers();

      console.log(request.url(), "\n\n");

      if (headers.auth && Object.keys(this.authHeaders).length === 0) {
        this.authHeaders = headers;

        console.log("Captured auth header");

        this.resolveAuth();
      }
    });

    this.page.on("response", async (response) => {
      if (!response.url().includes("/api/customer")) return;

      if (response.url().includes("/grouped-feed")) {
        // console.log("FEED", response.headers());
        // const json = await response.json();
        // const products = json.content.items.flatMap((item: any) =>
        //   item.products.map((val: any) => val.masterData.plu),
        // );
        // console.log(products);
        // console.log("refer", response.frame().url());
      }

      // console.log(response.status(), response.url());
    });
  }

  async goto(url: string) {
    await this.page.goto(url, {
      waitUntil: "networkidle",
    });

    await this.page.waitForSelector("#app");
  }

  async waitForAuth() {
    await this.authReady;
  }

  getPage() {
    return this.page;
  }

  getAuthHeaders() {
    return this.authHeaders;
  }

  async getInitialState(html: string) {
    const match = html.match(
      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/,
    );

    if (!match) {
      throw new Error("Could not find window.__INITIAL_STATE__");
    }

    return JSON.parse(match[1]);
  }

  async getCategories() {
    const keyword = `
      Всё для хранения 
      Лампочки и батарейки 
      Всё для дачи и сада 
      Галантерейные аксессуары 
      Одежда, обувь, аксессуары 
      Домашний текстиль 
      Декор и интерьер 
      Техника и аксессуары 
      Мелочи для дома 
      Автоаксессуары 
      Спорт и туризм 
      Товары для бани и сауны 
      Канцелярия 
      Для кошек 
      Для собак 
      Для грызунов 
      Для птиц 
      Мыло 
      Гели для душа 
      Стайлинг волос 
      Уход за телом 
      Уход за полостью рта 
      Уход за лицом 
      Уход для волос 
      Дезодоранты 
      Уход за руками 
      Средства личной гигиены 
      Косметические наборы 
      Средства для бритья 
      Бумажная и ватная продукция 
      Губки, мочалки для душа 
      Презервативы, смазки 
      Посуда для приготовления 
      Кружки, стаканы, бокалы 
      Одноразовая посуда 
      Сервировка 
      Гигиена и уход 
      Игрушки 
      Детская посуда 
      Детская одежда и аксессуары 
      Ароматизаторы для дома 
      Для стирки и ухода за вещами 
      Уход за одеждой и обувью 
      Предметы для уборки 
      Стики 
      Для мытья посуды 
      Для посудомоечных и стиральных машин 
      Для сантехники 
      Для устранения засоров 
      Универсальные средства 
      Для плит и духовок 
      Для мебели и ковров 
      Для стёкол и зеркал 
      Для полов 
      Экодом 
      Аптека 
    `;

    const page = this.getPage();
    const html = await page.content();

    const categories = await this.getInitialState(html);

    const data = categories.catalog.category.data;

    const list = Object.values(data)
      .filter((val: any) => val.category.parentId !== null)
      .map((val: any) => {
        return {
          id: val.category.id,
          title: val.category.title,
          slug: val.category.slug,
        };
      });

    return list.filter((val) => !keyword.includes(val.title));
  }

  async getCookies() {
    return await this.context.cookies(["https://www.perekrestok.ru"]);
  }

  async createPage(): Promise<Page> {
    const page = await this.context.newPage();

    await page.setExtraHTTPHeaders(this.authHeaders);

    return page;
  }

  async closePage(page: Page) {
    await page.close();
  }

  async browserFetch(url: string, options: BrowserFetchOptions = {}) {
    const authHeaders = this.getAuthHeaders();

    return await this.page.evaluate(
      async ({ url, options, authHeaders }) => {
        const headers = {
          ...(options.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
          Accept: "application/json, text/plain, */*",
          ...authHeaders,
          ...(options.headers ?? {}),
        };

        const body =
          options.body !== undefined ? JSON.stringify(options.body) : undefined;

        const response = await fetch(url, {
          credentials: "include",
          method: options.method ?? "GET",
          headers,
          body,
        });

        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          json: await response.json(),
        };
      },
      {
        url,
        options,
        authHeaders,
      },
    );
  }
}
