// Runs scripts/git.mjs and scripts/scan.mjs for real against a throwaway repository and a throwaway transcript, so CI proves them on every OS it runs on: node scripts/selftest.mjs
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const tmp = mkdtempSync(join(tmpdir(), 'plimsoll-'))

const run = (script, args, env = {}) =>
  JSON.parse(execFileSync(process.execPath, [join(here, script), ...args], { encoding: 'utf8', env: { ...process.env, ...env } }))

// git.mjs: one commit, then a modified, a staged and an untracked file.
const repo = join(tmp, 'repo')
mkdirSync(repo)
const git = (...args) =>
  execFileSync('git', ['-c', 'user.name=selftest', '-c', 'user.email=selftest@example.com', '-c', 'commit.gpgsign=false', ...args], { cwd: repo, stdio: 'ignore' })
git('init', '-q')
writeFileSync(join(repo, 'a.txt'), 'a\n')
writeFileSync(join(repo, 'b.txt'), 'b\n')
git('add', '.')
git('commit', '-q', '-m', 'first')
writeFileSync(join(repo, 'a.txt'), 'a2\n')
writeFileSync(join(repo, 'c.txt'), 'c\n')
git('add', 'c.txt')
writeFileSync(join(repo, 'd.txt'), 'd\n')

const seen = run('git.mjs', [repo])
assert.equal(seen.isRepo, true)
assert.equal(seen.staged, 1)
assert.equal(seen.modified, 1)
assert.equal(seen.untracked, 1)
assert.equal(seen.conflicted, 0)
assert.equal(seen.lastCommit.subject, 'first')
assert.equal(seen.ghProblem, 'no remote')

// scan.mjs: a transcript whose rows exercise the dedupe and the synthetic-model skip.
const config = join(tmp, 'config')
mkdirSync(join(config, 'projects', 'p'), { recursive: true })
// ponytail: a run that straddles local midnight can fail the "today" check; acceptable for CI.
const at = new Date().toISOString()
const rows = [
  // A partial row of m1: superseded by the final row below, so it must not be counted.
  { type: 'assistant', timestamp: at, message: { id: 'm1', model: 'claude-sonnet-4-6', usage: { input_tokens: 10, output_tokens: 1 } } },
  // The final row of m1: the one that is counted.
  { type: 'assistant', timestamp: at, message: { id: 'm1', model: 'claude-sonnet-4-6', usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 1000 } } },
  // A synthetic message: never counted.
  { type: 'assistant', timestamp: at, message: { id: 'm2', model: '<synthetic>', usage: { input_tokens: 999 } } },
  // A second real message, counted alongside m1.
  { type: 'assistant', timestamp: at, message: { id: 'm3', model: 'claude-sonnet-4-6', usage: { input_tokens: 5, output_tokens: 5 } } },
]
writeFileSync(join(config, 'projects', 'p', 's.jsonl'), rows.map((row) => JSON.stringify(row)).join('\n') + '\n')

// The second pass reads the cache the first one wrote.
for (const pass of ['first', 'cached']) {
  const totals = run('scan.mjs', [], { CLAUDE_CONFIG_DIR: config })
  assert.deepEqual(totals.today, { input: 105, output: 55, cacheWrite: 0, cacheRead: 1000 }, pass)
}
assert.ok(existsSync(join(config, 'plimsoll', 'scan-cache-3.json')), 'the scan writes its cache')

console.log('selftest ok')
