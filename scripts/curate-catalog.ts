import fs from "fs";
import path from "path";
import {
  buildCreatorIndex,
  creatorCatalogPath,
  curateCreatorCatalog,
  loadCuratedCreatorCatalog,
  loadCreatorRegistry,
  resolveCreatorSources,
  writeRawCreatorCatalog,
} from "../src/lib/creator-catalog";

interface CliOptions {
  username?: string;
  bootstrap: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const username = argv.find((arg) => !arg.startsWith("--"));
  return {
    username,
    bootstrap: argv.includes("--bootstrap"),
  };
}

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const registry = loadCreatorRegistry();
  const targets = options.username
    ? registry.filter((entry) => entry.username === options.username)
    : registry;

  if (targets.length === 0) {
    throw new Error(options.username ? `Unknown creator: ${options.username}` : "No creators found in registry");
  }

  const catalogs = [];
  for (const entry of targets) {
    const sources = resolveCreatorSources(entry, process.cwd(), { allowLegacyFallback: options.bootstrap });
    if (sources.length === 0) {
      throw new Error(
        options.bootstrap
          ? `No raw or legacy source found for ${entry.username}`
          : `No raw source found for ${entry.username}. Re-run with --bootstrap to allow legacy import.`,
      );
    }

    if (options.bootstrap) {
      for (const source of sources) {
        writeRawCreatorCatalog(entry, source, process.cwd());
      }
    }

    const catalog = curateCreatorCatalog(entry, sources);
    const filePath = creatorCatalogPath(entry.username);
    ensureDir(filePath);
    fs.writeFileSync(filePath, `${JSON.stringify(catalog, null, 2)}\n`);
    catalogs.push(catalog);
    console.error(`Curated ${entry.username} (${catalog.products.length} products, incomplete=${catalog.incomplete})`);
  }

  const catalogsForIndex = options.username
    ? registry
        .map((entry) => loadCuratedCreatorCatalog(entry.username))
        .filter((catalog): catalog is NonNullable<typeof catalog> => catalog !== null)
    : catalogs;

  const indexPath = path.join(process.cwd(), "data/creators/_index.json");
  fs.writeFileSync(indexPath, `${JSON.stringify(buildCreatorIndex(catalogsForIndex), null, 2)}\n`);
  console.error(`Wrote ${catalogs.length} curated catalog(s) and refreshed _index.json`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
