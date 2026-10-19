// Prints one line of JSON describing the git state of a directory (argv[2], or
// the current one): branch, working tree counts, last commit, and the branch's
// pull request and newest workflow run through `gh`.
// Run by hooks/register.tsx through node: a hooks module cannot run git itself
// with parsing this cheap.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { basename, delimiter, isAbsolute, join } from 'node:path'

const dir = process.argv[2] || process.cwd()
const GIT_TIMEOUT_MS = 5000
const GH_TIMEOUT_MS = 8000

// git and gh are found on PATH here, by absolute folder, and run by full path:
// on Windows a bare name is looked up in the working directory first, and that
// directory is the repository being inspected, which could hold a planted git.exe.
// Windows PATH entries may be quoted; the quotes are not part of the folder.
const find = name => {
  const file = process.platform === 'win32' ? `${name}.exe` : name
  for (const entry of (process.env.PATH || '').split(delimiter)) {
    const folder = entry.replace(/^"(.*)"$/, '$1')
    if (isAbsolute(folder) && existsSync(join(folder, file))) return join(folder, file)
  }
  throw Object.assign(new Error(`${name} is not on PATH`), { code: 'ENOENT' })
}

// The repository's own config is untrusted too. These override it for every git
// this script starts, the ones gh starts included: no fsmonitor hook and no
// signature check (each runs a program the config names), no optional index lock
// (this runs after every turn and must not collide with the user's own git), no prompt.
// ponytail: a clean filter the repository's config defines still runs when status
// re-reads a changed file, as it does for any git prompt; git has no switch for that.
const env = {
  ...process.env,
  GIT_OPTIONAL_LOCKS: '0',
  GIT_TERMINAL_PROMPT: '0',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'core.fsmonitor',
  GIT_CONFIG_VALUE_0: 'false',
  GIT_CONFIG_KEY_1: 'log.showSignature',
  GIT_CONFIG_VALUE_1: 'false',
}

const run = (name, args, timeout) =>
  execFileSync(find(name), args, { cwd: dir, env, encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
const git = (...args) => run('git', args, GIT_TIMEOUT_MS)
const gh = args => run('gh', args, GH_TIMEOUT_MS)
// Repository and GitHub text is untrusted: no escape sequence, bidi override or zero-width character reaches the terminal.
const clean = text => String(text).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, ' ').trim()

let top
try {
  top = git('rev-parse', '--show-toplevel').trim()
} catch (error) {
  console.log(JSON.stringify(error.code === 'ENOENT' ? { isRepo: false, problem: 'git is not installed' } : { isRepo: false }))
  process.exit(0)
}

let branch = ''
let oid = ''
let detached = false
let upstream = ''
let ahead = 0
let behind = 0
let staged = 0
let modified = 0
let untracked = 0
let conflicted = 0
try {
  for (const line of git('status', '--porcelain=v2', '--branch').split('\n')) {
    if (line.startsWith('# branch.oid ')) oid = line.slice(13).trim()
    else if (line.startsWith('# branch.head ')) {
      branch = line.slice(14).trim()
      detached = branch === '(detached)'
    } else if (line.startsWith('# branch.upstream ')) upstream = line.slice(18).trim()
    else if (line.startsWith('# branch.ab ')) {
      const [a, b] = line.slice(12).trim().split(' ')
      ahead = Number(a.slice(1)) || 0
      behind = Number(b.slice(1)) || 0
    } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
      const xy = line.split(' ')[1]
      if (xy[0] !== '.') staged++
      if (xy[1] !== '.') modified++
    } else if (line.startsWith('u ')) conflicted++
    else if (line.startsWith('? ')) untracked++
  }
} catch (error) {
  console.warn(`git status failed: ${error.message}`)
}
if (detached) branch = `(${oid.slice(0, 7)})`

let stashes = 0
try {
  stashes = git('stash', 'list').split('\n').filter(Boolean).length
} catch {}

let lastCommit = null
try {
  const [hash, subject, age] = git('log', '-1', '--format=%h%x1f%s%x1f%cr').trim().split('\x1f')
  lastCommit = { hash: clean(hash), subject: clean(subject), age: clean(age) }
} catch {}

const passedStates = ['SUCCESS', 'NEUTRAL', 'SKIPPED']
const failedStates = ['FAILURE', 'ERROR', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE']

let pr = null
let ci = null
let ghProblem = ''
let hasRemote = false
try {
  hasRemote = git('remote').trim() !== ''
} catch {}

if (detached) ghProblem = 'detached HEAD'
else if (!hasRemote) ghProblem = 'no remote'
else {
  try {
    const view = JSON.parse(
      gh(['pr', 'view', '--json', 'number,title,state,isDraft,reviewDecision,statusCheckRollup']),
    )
    const checks = { passed: 0, failed: 0, pending: 0 }
    for (const item of view.statusCheckRollup ?? []) {
      const r = (item.conclusion || item.state || '').toUpperCase()
      if (passedStates.includes(r)) checks.passed++
      else if (failedStates.includes(r)) checks.failed++
      else checks.pending++
    }
    pr = {
      number: view.number,
      title: clean(view.title),
      state: clean(view.state),
      isDraft: view.isDraft,
      review: clean(view.reviewDecision ?? ''),
      checks,
    }
  } catch (error) {
    const stderr = String(error.stderr)
    if (error.code === 'ENOENT') ghProblem = 'gh is not installed'
    else if (error.code === 'ETIMEDOUT' || error.killed) ghProblem = 'gh timed out'
    else if (/not logged in|gh auth login|authentication/i.test(stderr)) ghProblem = 'gh is not signed in'
    else if (/none of the git remotes|not a github|no known github host/i.test(stderr)) ghProblem = 'remote is not on GitHub'
    else if (/could not resolve|no such host|dial tcp|connection refused|network is unreachable|i\/o timeout|error connecting/i.test(stderr)) ghProblem = 'GitHub unreachable (offline?)'
    // any other failure is "no pull request for this branch": pr stays null
  }

  if (!ghProblem) {
    try {
      const [run0] = JSON.parse(gh(['run', 'list', '--branch', branch, '--limit', '1', '--json', 'workflowName,status,conclusion']))
      if (run0) ci = { name: clean(run0.workflowName), status: clean(run0.status), conclusion: clean(run0.conclusion ?? '') }
    } catch {}
  }
}

console.log(
  JSON.stringify({
    isRepo: true,
    repo: clean(basename(top)),
    branch: clean(branch),
    upstream: clean(upstream),
    ahead,
    behind,
    staged,
    modified,
    untracked,
    conflicted,
    stashes,
    lastCommit,
    pr,
    ci,
    ghProblem,
  }),
)
