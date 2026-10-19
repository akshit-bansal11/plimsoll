// Where scan.mjs keeps its cache. Imports nothing: scan.mjs passes in node's path.join, so the test can check the paths without a file system.
// The number moves when what the cache stores changes meaning: 3 was cut when prices changed (0.3.1), so old dollar figures are rebuilt.
const CACHE_FILE = 'scan-cache-3.json'

export const cachePaths = (configDir, join) => {
  const dir = join(configDir, 'plimsoll')

  return { dir, file: join(dir, CACHE_FILE) }
}
