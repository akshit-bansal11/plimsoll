// Where scan.mjs keeps its cache, and the one-time carry-over from the folder
// the plugin used before it was renamed from usage-board to Plimsoll. Imports
// nothing: scan.mjs passes in node's path and fs functions, so the test can
// run it against an in-memory folder.
const CACHE_FILE = 'scan-cache-2.json'

export const cachePaths = (configDir, join) => {
  const dir = join(configDir, 'plimsoll')

  return { dir, file: join(dir, CACHE_FILE), old: join(configDir, 'usage-board', CACHE_FILE) }
}

// Copies the old cache to the new path when only the old one exists, so the
// first scan after the rename does not read every transcript again. Copied,
// not moved, so an install still on the old name keeps its own. True when it
// copied. COPYFILE_EXCL: a session that got there first is never overwritten.
export const adoptOldCache = (paths, fs) => {
  if (fs.existsSync(paths.file) || !fs.existsSync(paths.old)) return false
  fs.mkdirSync(paths.dir, { recursive: true })
  fs.copyFileSync(paths.old, paths.file, fs.constants.COPYFILE_EXCL)

  return true
}
