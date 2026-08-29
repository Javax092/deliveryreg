import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const baseURL = process.env.PERF_BASE_URL ?? "http://127.0.0.1:3100";
const output = process.argv[2] ?? "perf-results.json";
const password = "senha-e2e-local-2026";

const publicCartItem = {
  productId: "e2e_product_unit",
  productName: "E2E Produto unitario",
  sourceCode: "qr-e2e-a1",
  measurementType: "UNIT",
  requestedQuantity: 1,
  estimatedAmountCents: 1200
};

function round(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
}

async function installVitals(page) {
  await page.addInitScript(() => {
    window.__deliveryregVitals = {
      cls: 0,
      lcp: null,
      inp: null
    };

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__deliveryregVitals.cls += entry.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries.at(-1);
      window.__deliveryregVitals.lcp = lastEntry?.startTime ?? null;
    }).observe({ type: "largest-contentful-paint", buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const latency = entry.processingStart - entry.startTime;
        window.__deliveryregVitals.inp =
          window.__deliveryregVitals.inp == null
            ? latency
            : Math.max(window.__deliveryregVitals.inp, latency);
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  });
}

async function pageMetrics(page) {
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    const scriptResources = resources.filter((resource) => {
      return resource.initiatorType === "script" || resource.name.includes("/_next/static/chunks/");
    });

    return {
      ttfb: navigation ? navigation.responseStart - navigation.requestStart : null,
      domContentLoaded: navigation
        ? navigation.domContentLoadedEventEnd - navigation.startTime
        : null,
      load: navigation ? navigation.loadEventEnd - navigation.startTime : null,
      requests: resources.length + (navigation ? 1 : 0),
      transferBytes:
        resources.reduce((total, resource) => total + resource.transferSize, 0) +
        (navigation?.transferSize ?? 0),
      jsBytes: scriptResources.reduce((total, resource) => total + resource.transferSize, 0),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      vitals: window.__deliveryregVitals ?? null
    };
  });
}

async function measureGoto(context, label, path, viewport = { width: 390, height: 780 }) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  await installVitals(page);
  const startedAt = performance.now();
  const response = await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const metrics = await pageMetrics(page);
  const result = {
    label,
    path,
    status: response?.status() ?? null,
    wallMs: round(performance.now() - startedAt),
    ttfbMs: round(metrics.ttfb),
    dclMs: round(metrics.domContentLoaded),
    loadMs: round(metrics.load),
    lcpMs: round(metrics.vitals?.lcp),
    cls: metrics.vitals?.cls == null ? null : Number(metrics.vitals.cls.toFixed(4)),
    inpMs: round(metrics.vitals?.inp),
    requests: metrics.requests,
    transferKb: Number((metrics.transferBytes / 1024).toFixed(1)),
    jsKb: Number((metrics.jsBytes / 1024).toFixed(1)),
    overflowX: metrics.overflowX
  };
  await page.close();
  return result;
}

async function login(context, email) {
  const page = await context.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/painel");
  await page.close();
}

async function measureCart(context) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 780 });
  await installVitals(page);
  await page.goto(baseURL);
  await page.evaluate((item) => {
    window.localStorage.setItem("deliveryreg_cart", JSON.stringify([item]));
  }, publicCartItem);
  const startedAt = performance.now();
  const response = await page.goto(`${baseURL}/carrinho`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const metrics = await pageMetrics(page);
  const result = {
    label: "carrinho",
    path: "/carrinho",
    status: response?.status() ?? null,
    wallMs: round(performance.now() - startedAt),
    ttfbMs: round(metrics.ttfb),
    dclMs: round(metrics.domContentLoaded),
    loadMs: round(metrics.load),
    lcpMs: round(metrics.vitals?.lcp),
    cls: metrics.vitals?.cls == null ? null : Number(metrics.vitals.cls.toFixed(4)),
    inpMs: round(metrics.vitals?.inp),
    requests: metrics.requests,
    transferKb: Number((metrics.transferBytes / 1024).toFixed(1)),
    jsKb: Number((metrics.jsBytes / 1024).toFixed(1)),
    overflowX: metrics.overflowX
  };
  await page.close();
  return result;
}

async function measureCheckout(context) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto(baseURL);
  await page.evaluate((item) => {
    window.localStorage.setItem("deliveryreg_cart", JSON.stringify([item]));
  }, publicCartItem);
  await page.goto(`${baseURL}/carrinho`, { waitUntil: "networkidle" });
  await page.getByLabel("Seu nome").fill(`Perf Checkout ${Date.now()}`);
  await page.getByLabel("WhatsApp").fill("92955550000");
  const apiPromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/orders") && response.request().method() === "POST"
  );
  const startedAt = performance.now();
  await page.getByRole("button", { name: /Fazer pedido/ }).click();
  const apiResponse = await apiPromise;
  const apiMs = performance.now() - startedAt;
  await page.waitForURL("**/pedido/**");
  await page.waitForLoadState("networkidle");
  const orderUrl = new URL(page.url());
  const result = {
    label: "checkout",
    path: "/carrinho -> /api/orders -> /pedido/[id]",
    status: apiResponse.status(),
    wallMs: round(performance.now() - startedAt),
    apiMs: round(apiMs),
    orderPath: `${orderUrl.pathname}`,
    overflowX: await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
  };
  await page.close();
  return result;
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  const results = [];
  results.push(await measureGoto(context, "home", "/"));
  results.push(await measureGoto(context, "catalogo", "/catalogo?origem=qr-e2e-a1"));
  results.push(await measureGoto(context, "produto", "/produto/e2e-produto-unitario?origem=qr-e2e-a1"));
  results.push(await measureCart(context));
  results.push(await measureCheckout(context));

  const lastOrder = results.find((result) => result.label === "checkout")?.orderPath;
  if (lastOrder) {
    results.push(await measureGoto(context, "pedido", lastOrder));
  }

  results.push(await measureGoto(context, "login", "/login"));

  await login(context, "owner.a@e2e.local");
  results.push(await measureGoto(context, "gestao", "/gestao", { width: 1366, height: 900 }));

  await context.clearCookies();
  await login(context, "attendant.a1@e2e.local");
  results.push(await measureGoto(context, "operacao", "/operacao", { width: 1366, height: 900 }));
  results.push(await measureGoto(context, "pdv", "/pdv", { width: 1366, height: 900 }));
  results.push(await measureGoto(context, "estoque", "/estoque", { width: 1366, height: 900 }));

  await context.clearCookies();
  await login(context, "manager.a@e2e.local");
  results.push(await measureGoto(context, "delivery", "/entregas", { width: 390, height: 780 }));

  const mobileOverflow = [];
  for (const width of [360, 390, 430]) {
    mobileOverflow.push(
      await measureGoto(context, `catalogo-mobile-${width}`, "/catalogo?origem=qr-e2e-a1", {
        width,
        height: 780
      })
    );
  }

  await browser.close();

  const payload = {
    measuredAt: new Date().toISOString(),
    baseURL,
    results,
    mobileOverflow
  };

  await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
