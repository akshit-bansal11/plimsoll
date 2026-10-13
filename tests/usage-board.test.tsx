import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { MASCOT_ROWS, MASCOT_WIDTH, mascot } from '../hooks/mascot'
import {
  compact,
  level,
  meter,
  moodOf,
  spark,
  untilReset,
} from '../hooks/register'
import type { Git, Totals } from '../types'

const NOW = Date.parse('2026-10-11T10:00:00Z')
const day = (key: string, tokens: number) => ({ key, tokens })
const SCAN: Totals = {
  tzOffset: 0,
  today: { input: 1000, output: 500, cacheWrite: 0, cacheRead: 0 },
  week: { input: 0, output: 0, cacheWrite: 0, cacheRead: 2_500_000 },
  month: { input: 0, output: 0, cacheWrite: 0, cacheRead: 3_000_000_000 },
  usd: { today: 3.25, week: 12.5, month: 48.75 },
  stats: {
    hours: Array.from({ length: 24 }, (_, i) => (i === 14 ? 100 : 0)),
    weekdays: Array.from({ length: 7 }, (_, i) => (i === 2 ? 50 : 0)),
    days: Array.from({ length: 30 }, (_, i) => day(`d${i}`, i)),
    months: Array.from({ length: 12 }, (_, i) => day(`m${i}`, i)),
    peakDay: day('2026-10-02', 41_000_000),
    peakWeek: day('2026-09-28', 180_000_000),
    peakMonth: day('2026-09', 600_000_000),
  },
}
const GIT: Git = {
  isRepo: true,
  repo: 'repo',
  branch: 'main',
  upstream: 'origin/main',
  ahead: 2,
  behind: 1,
  staged: 3,
  modified: 2,
  untracked: 4,
  conflicted: 0,
  stashes: 1,
  lastCommit: { hash: 'a1b2c3d', subject: 'fix: thing', age: '2 hours ago' },
  pr: {
    number: 42,
    title: 'Add thing',
    state: 'OPEN',
    isDraft: false,
    review: 'APPROVED',
    checks: { passed: 5, failed: 0, pending: 1 },
  },
  ci: { name: 'build', status: 'completed', conclusion: 'success' },
  ghProblem: '',
}

test('numbers, resets, levels and meters read as the band prints them', () => {
  expect(compact(999)).toBe('999')
  expect(compact(1500)).toBe('1.5K')
  expect(compact(2_500_000)).toBe('2.5M')
  expect(compact(999_999)).toBe('1.0M')
  expect(compact(999_999_999)).toBe('1.00B')
  expect(untilReset('2026-10-11T12:14:00Z', NOW)).toBe('2h 14m')
  expect(untilReset('2026-10-14T14:00:00Z', NOW)).toBe('3d 4h')
  expect(untilReset(undefined, NOW)).toBe('')

  const [ok, warm, hot, crit] = [10, 50, 75, 90].map(level)
  expect(new Set([ok, warm, hot, crit]).size).toBe(4)
  expect(level(49)).toBe(ok)
  expect(level(74)).toBe(warm)
  expect(level(89)).toBe(hot)
  expect(level(100)).toBe(crit)

  const half = meter(50, 10)
  expect([half.filled.length, half.empty.length]).toEqual([5, 5])
  const over = meter(150, 10)
  expect([over.filled.length, over.empty.length]).toEqual([10, 0])

  expect(spark([0, 0])).toBe('▁▁')
  const s = spark([0, 5, 10])
  expect(s.length).toBe(3)
  expect(s.endsWith('█')).toBe(true)
})

test('moods follow load', () => {
  expect(moodOf([95], true, 0)).toBe('alarm')
  expect(moodOf([10], true, 0)).toBe('working')
  expect(moodOf([10], false, 6 * 60_000)).toBe('sleeping')
  expect(moodOf([10], false, 0)).toBe('idle')
})

test('every mascot frame fits its box', () => {
  for (const mood of ['idle', 'working', 'sleeping', 'alarm'] as const) {
    for (let frame = 0; frame < 300; frame++) {
      const pose = mascot(mood, frame)
      expect(pose.lines.length).toBe(MASCOT_ROWS)
      for (const line of pose.lines) expect(line.length).toBe(MASCOT_WIDTH)
      expect(pose.caption.length <= MASCOT_WIDTH).toBe(true)
      for (const ch of [...pose.lines, pose.caption].join('')) {
        expect(/[ -~♥♪·]/.test(ch), `${mood} ${frame} char ${ch}`).toBe(true)
      }
    }
  }
})

const ran = (stdout: unknown) => ({
  value: {
    exitCode: 0,
    stdout: JSON.stringify(stdout),
    stderr: '',
    isStdoutTruncated: false,
    isStderrTruncated: false,
  },
})

const boot = async ($: Engine, on: On, gitReply: unknown = GIT) => {
  mock.clock(on, { now: NOW })
  mock.store(on, {})
  on('session.cwd', () => ({ value: '/work/repo' }))
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('ui.status', () => ({ value: undefined }))
  on('session.usage', () => ({
    value: { startedAt: NOW, context: { window: 200_000 }, rateLimits: [] },
  }))
  on('ui.render', ($$, e) => {
    const { Text } = $$.ui.resolve(e)

    return <Text>bare</Text>
  })
  on('process.run', (_$, e) => {
    const script = e.argv.find(a => /(scan|git)\.mjs$/.test(a)) ?? ''

    return ran(script.endsWith('scan.mjs') ? SCAN : gitReply)
  })

  await $.session.start({ cwd: '/work/repo', surface: 'terminal', isInteractive: true })
  const cmd = (args: string) =>
    $.command.run({
      command: 'hud',
      args,
      origin: { kind: 'composer' },
      presentation: { isFullscreen: true, columns: 160 },
    })
  await cmd('usage')
  await $.session.measure({
    context: { window: 200_000, tokens: 96_000, percent: 48 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 41, resetsAt: '2026-10-11T12:14:00Z' },
      { kind: 'seven_day', percentUsed: 92.5 },
    ],
    cost: { usd: 1.25 },
    changed: ['context', 'rateLimits', 'cost'],
  })
  const mountBand = (surface: 'terminal' | 'desktop', bodyColumns: number) =>
    $.ui.mount({
      plugin: 'usage-board',
      surface,
      component: 'AbovePrompt',
      props: {
        hasSurvey: false,
        isWorking: false,
        maxRows: 20,
        bodyColumns,
        scroll: { offset: 0, bodyRows: 20 },
        view: {},
      },
    })

  return { cmd, mountBand }
}

test('the band shows usage, stats and git, and hides on command', async ($, on) => {
  const { cmd, mountBand } = await boot($, on)

  for (const surface of ['terminal', 'desktop'] as const) {
    await cmd('usage')
    const ui = await mountBand(surface, 140)
    for (const re of [
      /48%/, /96\.0K used/, /104\.0K left/, /41%/, /resets 2h 14m/, /93%/,
      /1\.5K tok/, /~\$3\.25/, /~\$12\.50/, /~\$48\.75/,
    ]) {
      expect(await ui.find({ text: re }), `${surface} usage ${re}`).toBeDefined()
    }
    await ui.press({ key: 'tab-stats' })
    for (const re of [/peak 14:00/, /busiest Wed/, /2026-10-02/]) {
      expect(await ui.find({ text: re }), `${surface} stats ${re}`).toBeDefined()
    }
    await ui.press({ key: 'tab-git' })
    // Anchored: the repo name and the branch are their own Text nodes, so these
    // cannot match "origin/main" or the "/work/repo" cwd.
    for (const re of [
      /^repo$/, /^\s*main$/, /⇡2/, /⇣1/, /\+3 staged/, /a1b2c3d fix: thing/,
      /#42 Add thing/, /APPROVED/, /build · completed · success/,
    ]) {
      expect(await ui.find({ text: re }), `${surface} git ${re}`).toBeDefined()
    }
    await ui.unmount()

    await cmd('hide')
    const hidden = await mountBand(surface, 140)
    expect(await hidden.find({ text: /USAGE-BOARD/ })).toBeUndefined()
    await hidden.unmount()
    await cmd('show')
    const shown = await mountBand(surface, 140)
    expect(await shown.find({ text: /USAGE-BOARD/ })).toBeDefined()
    await shown.unmount()
  }
})

test('the columns stack below 110 and keep every figure', async ($, on) => {
  const { cmd, mountBand } = await boot($, on)
  await cmd('usage')
  const ui = await mountBand('terminal', 100)
  for (const re of [/48%/, /~\$3\.25/]) {
    expect(await ui.find({ text: re }), `stacked ${re}`).toBeDefined()
  }
  await ui.unmount()
})

test('a band narrower than the panel draws nothing', async ($, on) => {
  const { mountBand } = await boot($, on)
  const ui = await mountBand('terminal', 40)
  expect(await ui.find({ text: /USAGE-BOARD/ })).toBeUndefined()
  await ui.unmount()
})

test('git that cannot be read says why, or says it is not a repository', async ($, on) => {
  const { cmd, mountBand } = await boot($, on, { isRepo: false, problem: 'git is not installed' })
  await cmd('git')
  const ui = await mountBand('terminal', 140)
  expect(await ui.find({ text: /git is not installed/ })).toBeDefined()
  await ui.unmount()
})

test('a directory outside any repository says so', async ($, on) => {
  const { cmd, mountBand } = await boot($, on, { isRepo: false })
  await cmd('git')
  const ui = await mountBand('terminal', 140)
  expect(await ui.find({ text: /Not a git repository/ })).toBeDefined()
  await ui.unmount()
})
