import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Facts the site reads from the plugin itself at build time, rather than typing them
 * again: the version in plugin.json, the price table in scripts/prices.mjs, and the
 * band mock-up in README.md. A copy typed into a page is one more place to forget
 * when the code changes; read from the source, the page follows it.
 *
 * Paths resolve from the working directory, which is site/ for every npm script, so
 * the site must be built from inside the repository. If a source cannot be parsed the
 * build fails, rather than shipping a page with an empty price table on it.
 */
const ROOT = path.resolve(process.cwd(), "..");

const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

export type Price = {
  /** A model id prefix: the first prefix a response's model starts with is its price. */
  prefix: string;
  /** US dollars per million tokens. */
  input: number;
  output: number;
  /** A cache read costs this fraction of the input price. */
  readMultiplier: number;
};

export type PriceTable = {
  /** The date the prices were taken, as the table's header comment gives it. */
  asOf: string;
  prices: Price[];
  /** A cache write costs this many times the input price, by the cache's lifetime. */
  write5m: number;
  write1h: number;
};

function fail(what: string): never {
  throw new Error(
    `Could not read ${what}. The site is built from the plugin's own files; update lib/repo.ts if their shape changed.`,
  );
}

export function loadVersion(): string {
  const manifest: unknown = JSON.parse(read(".claude-plugin/plugin.json"));
  if (
    typeof manifest === "object" &&
    manifest !== null &&
    "version" in manifest &&
    typeof manifest.version === "string"
  ) {
    return manifest.version;
  }
  return fail("the version in .claude-plugin/plugin.json");
}

export function loadPrices(): PriceTable {
  const source = read("scripts/prices.mjs");
  const asOf = /as of (\d{4}-\d{2}-\d{2})/.exec(source)?.[1] ?? fail("the price date");
  const prices = [
    ...source.matchAll(/\['([\w.-]+)', ([\d.]+), ([\d.]+), ([\d.]+)\]/g),
  ].map(([, prefix = "", input = "", output = "", readMultiplier = ""]) => ({
    prefix,
    input: Number(input),
    output: Number(output),
    readMultiplier: Number(readMultiplier),
  }));
  if (prices.length === 0) fail("the price rows in scripts/prices.mjs");
  const multiplier = (name: string) => {
    const value = new RegExp(`const ${name} = ([\\d.]+)`).exec(source)?.[1];
    return value === undefined ? fail(name) : Number(value);
  };
  return {
    asOf,
    prices,
    write5m: multiplier("WRITE_5M"),
    write1h: multiplier("WRITE_1H"),
  };
}

/** The README's first code block: the band's layout, drawn in text. */
export function loadMockup(): string {
  return (
    /```\n([\s\S]*?)\n```/.exec(read("README.md"))?.[1] ?? fail("the README mock-up")
  );
}
