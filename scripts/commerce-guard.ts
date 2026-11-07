import fs from "node:fs";
import path from "node:path";

const EXACT_SDKS = new Set([
  "stripe", "@stripe/stripe-js", "@stripe/react-stripe-js", "braintree", "square",
  "@paypal/checkout-server-sdk", "@paypal/paypal-js", "@paypal/react-paypal-js",
  "@lemonsqueezy/lemonsqueezy.js", "@paddle/paddle-js", "@paddle/paddle-node-sdk",
  "@mollie/api-client",
]);
const NAME_PARTS = [
  "cardcom", "tranzila", "payplus", "meshulam", "pelecard", "hyp-pay",
  "icount", "greeninvoice", "morning-invoice", "paypal",
];

const TABLE_RE = /mysqlTable\(\s*["'`](orders|payments|purchases|invoices|subscriptions)["'`]/;
const SDK_RE = /new Stripe\(|loadStripe\(|createPaymentIntent|paypal\.Buttons/;
const ROUTE_ALLOWED = /["'`]\/(?:checkout|cart|payments?|api\/checkout|api\/pay)["'`]/;

const SKIP_DIRS = new Set(["node_modules", "dist"]);
const SCAN_ROOTS = ["server", "client/src", "shared"];
const SKIP_FILES = new Set(["shared/commerceReadiness.ts", "scripts/commerce-guard.ts"]);

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) yield p;
  }
}

export function findCommerceSignals(root: string): string[] {
  const hits: string[] = [];

  const pkgPath = path.join(root, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
    for (const n of names) {
      if (EXACT_SDKS.has(n) || NAME_PARTS.some((part) => n.includes(part))) {
        hits.push(`package.json: ${n}`);
      }
    }
  }

  const files = SCAN_ROOTS.flatMap((r) => [...walk(path.join(root, r))]);
  const schema = path.join(root, "drizzle", "schema.ts");
  if (fs.existsSync(schema)) files.push(schema);

  for (const file of files) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (SKIP_FILES.has(rel)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const where = `${rel}:${i + 1}`;
      const table = TABLE_RE.exec(line);
      if (table) hits.push(`${where}: mysqlTable("${table[1]}")`);
      const route = ROUTE_ALLOWED.exec(line);
      if (route) hits.push(`${where}: ${route[0]}`);
      const sdk = SDK_RE.exec(line);
      if (sdk) hits.push(`${where}: ${sdk[0]}`);
    });
  }
  return hits;
}
