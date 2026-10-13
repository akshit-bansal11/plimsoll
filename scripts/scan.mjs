// Sums the token usage in Claude Code's transcripts for today, this week
// (from Monday) and this month, in local time, and also reports activity
// stats (by hour, weekday, day, month and the peaks) over all transcripts,
// printed as JSON. Also estimates dollars from the tokens at API list prices
// (prices.mjs); a subscription is not billed this way.
// Run by hooks/register.tsx through node: a hooks module cannot read files
// over 4 MiB itself, and transcripts run to tens of megabytes.
import { createReadStream, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline'
import { costOf } from './prices.mjs'

const configDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
const root = join(configDir, 'projects')
const cachePath = join(configDir, 'usage-board', 'scan-cache-2.json')

const dayOf = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const hourOf = date => `${dayOf(date)}T${String(date.getHours()).padStart(2, '0')}`

const now = new Date()
const today = dayOf(now)
const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
const first = new Date(now.getFullYear(), now.getMonth(), 1)
const weekStart = dayOf(monday)
const monthStart = dayOf(first)

// One file's usage by local hour (YYYY-MM-DDTHH), each [input, output, cacheWrite, cacheRead, usd].
// A response is written once per content block under one message id, its
// usage final on the last, so the last row of each id is the one counted.
// ponytail: ids are deduplicated per file only; a forked or copied transcript
// counts its shared rows twice. A global id set fixes that if it ever shows.
const sumFile = async path => {
  const byId = new Map()
  const lines = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  for await (const line of lines) {
    if (!line.includes('"usage"')) continue
    let row
    try {
      row = JSON.parse(line)
    } catch {
      continue
    }
    const usage = row.message?.usage
    if (row.type !== 'assistant' || !usage || row.message.model === '<synthetic>') continue
    if (Number.isNaN(Date.parse(row.timestamp))) continue // would bucket under NaN-NaN-NaN
    byId.set(row.message.id ?? row.uuid, [
      hourOf(new Date(row.timestamp)),
      usage.input_tokens ?? 0,
      usage.output_tokens ?? 0,
      usage.cache_creation_input_tokens ?? 0,
      usage.cache_read_input_tokens ?? 0,
      costOf(row.message.model, usage),
    ])
  }
  const hours = {}
  for (const [hour, ...counts] of byId.values()) {
    const sum = (hours[hour] ??= [0, 0, 0, 0, 0])
    counts.forEach((count, i) => (sum[i] += count))
  }
  return hours
}

let cache = {}
try {
  cache = JSON.parse(readFileSync(cachePath, 'utf8'))
} catch {
  // no cache yet, or an unreadable one: every file is summed again
}

const kept = {}
// the fifth number of each total is the estimated dollars
const totals = { today: [0, 0, 0, 0, 0], week: [0, 0, 0, 0, 0], month: [0, 0, 0, 0, 0] }
const add = (sum, counts) => counts.forEach((count, i) => (sum[i] += count))

let names = []
try {
  names = readdirSync(root, { recursive: true })
} catch {
  // no projects folder: nothing has been used, the totals stay zero
}

// ponytail: the first run reads every transcript once; later runs only the changed files
const stats = { hours: Array(24).fill(0), weekdays: Array(7).fill(0) }
const byDay = new Map()
for (const name of names) {
  if (!name.endsWith('.jsonl')) continue
  const path = join(root, name)
  let mtimeMs, size, hours
  try {
    ;({ mtimeMs, size } = statSync(path))
    const hit = cache[path]
    hours = hit && hit.mtimeMs === mtimeMs && hit.size === size ? hit.hours : await sumFile(path)
  } catch {
    continue // a file removed mid-scan is skipped
  }
  kept[path] = { mtimeMs, size, hours }
  for (const [key, counts] of Object.entries(hours)) {
    const day = key.slice(0, 10)
    if (day === today) add(totals.today, counts)
    if (day >= weekStart) add(totals.week, counts)
    if (day >= monthStart) add(totals.month, counts)
    const tokens = counts.slice(0, 4).reduce((a, b) => a + b, 0) // not the dollars
    stats.hours[Number(key.slice(11))] += tokens
    byDay.set(day, (byDay.get(day) ?? 0) + tokens)
  }
}

const byWeek = new Map()
const byMonth = new Map()
for (const [day, tokens] of byDay) {
  const [y, m, d] = day.split('-').map(Number)
  const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7
  stats.weekdays[weekday] += tokens
  const week = dayOf(new Date(y, m - 1, d - weekday))
  byWeek.set(week, (byWeek.get(week) ?? 0) + tokens)
  byMonth.set(day.slice(0, 7), (byMonth.get(day.slice(0, 7)) ?? 0) + tokens)
}

const peak = map => {
  let best = null
  for (const [key, tokens] of map) if (!best || tokens > best.tokens) best = { key, tokens }
  return best
}
const last = (count, keyOf, map) =>
  Array.from({ length: count }, (_, i) => {
    const key = keyOf(count - 1 - i)
    return { key, tokens: map.get(key) ?? 0 }
  })
stats.days = last(30, back => dayOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() - back)), byDay)
stats.months = last(
  12,
  back => dayOf(new Date(now.getFullYear(), now.getMonth() - back, 1)).slice(0, 7),
  byMonth,
)
stats.peakDay = peak(byDay)
stats.peakWeek = peak(byWeek)
stats.peakMonth = peak(byMonth)

try {
  mkdirSync(dirname(cachePath), { recursive: true })
  // write then rename: a concurrent session never reads a half-written cache
  const tmp = `${cachePath}.${process.pid}`
  writeFileSync(tmp, JSON.stringify(kept))
  renameSync(tmp, cachePath)
} catch {
  // the cache only saves time: the totals are right without it
}

const cents = x => Math.round(x * 100) / 100
const named = ([input, output, cacheWrite, cacheRead]) => ({ input, output, cacheWrite, cacheRead })
console.log(
  JSON.stringify({
    tzOffset: now.getTimezoneOffset(),
    today: named(totals.today),
    week: named(totals.week),
    month: named(totals.month),
    usd: { today: cents(totals.today[4]), week: cents(totals.week[4]), month: cents(totals.month[4]) },
    stats,
  }),
)
