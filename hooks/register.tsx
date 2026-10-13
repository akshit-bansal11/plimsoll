import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderNode } from 'claude-code'

import type { Context, Git, Limit, Tab, Tokens, Totals } from '../types'
import { MASCOT_TICK_MS, MASCOT_WIDTH, mascot } from './mascot'
import type { Mood } from './mascot'

const SLEEP_MS = 5 * 60_000
// git.mjs has internal timeouts that add up to 41 s.
const GIT_TIMEOUT_MS = 45_000
const PANEL_MIN = 48
// At or above this the two content columns sit side by side; below, they stack.
const WIDE = 110
const GAP = 2
const LEFT_SHARE = 0.58
const MASCOT_COL = MASCOT_WIDTH + GAP
const LABEL = 7
const NO_NODE = 'Node.js not found on PATH'

const ARC = '#00E5FF'
const OK = '#22C55E'
const WARM = '#EAB308'
const HOT = '#F97316'
const CRIT = '#EF4444'
const FUR = '#FFB3D1'

const totals = atom({ plugin: 'usage-board', key: 'totals' } as const, null)
const limits = atom({ plugin: 'usage-board', key: 'limits' } as const, [])
const problem = atom({ plugin: 'usage-board', key: 'problem' } as const, null)
const context = atom({ plugin: 'usage-board', key: 'context' } as const, null)
const git = atom({ plugin: 'usage-board', key: 'git' } as const, null)
const tab = atom({ plugin: 'usage-board', key: 'tab' } as const, 'usage')
const isHidden = atom({ plugin: 'usage-board', key: 'isHidden' } as const, false)
const frame = atom({ plugin: 'usage-board', key: 'frame' } as const, 0)
const activeAt = atom({ plugin: 'usage-board', key: 'activeAt' } as const, 0)

const WINDOWS: Record<string, string> = {
  five_hour: '5H',
  seven_day: 'WEEK',
  spend_limit: 'SPEND',
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** A node only while `isShown`: a render tree holds no booleans or nulls. */
const when = (isShown: boolean, node: RenderNode): RenderNode =>
  isShown ? node : ''

const sumOf = (t: Tokens) => t.input + t.output + t.cacheWrite + t.cacheRead

export const compact = (n: number) => {
  if (n < 1000) return String(n)
  // Bounds sit where rounding to one decimal would otherwise print 1000.0K.
  if (n < 999_950) return `${(n / 1e3).toFixed(1)}K`
  if (n < 999_950_000) return `${(n / 1e6).toFixed(1)}M`

  return `${(n / 1e9).toFixed(2)}B`
}

const dollars = (usd: number) => `~$${usd.toFixed(2)}`

export const untilReset = (resetsAt: string | undefined, now: number) => {
  const left = resetsAt === undefined ? NaN : Date.parse(resetsAt) - now
  if (Number.isNaN(left)) return ''
  if (left <= 0) return 'now'
  const minutes = Math.floor(left / 60_000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)

  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes % 60}m`
}

export const level = (percent: number) =>
  percent >= 90 ? CRIT : percent >= 75 ? HOT : percent >= 50 ? WARM : OK

export const meter = (percent: number, width: number) => {
  const n = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width)

  return { filled: '▰'.repeat(n), empty: '▱'.repeat(Math.max(0, width - n)) }
}

export const spark = (values: number[]) => {
  const max = Math.max(...values)

  return values
    .map(v => '▁▂▃▄▅▆▇█'[max === 0 ? 0 : Math.round((v / max) * 7)])
    .join('')
}

export const moodOf = (
  percents: number[],
  isWorking: boolean,
  idleMs: number,
): Mood => {
  if (percents.some(percent => level(percent) === CRIT)) return 'alarm'
  if (isWorking) return 'working'

  return idleMs > SLEEP_MS ? 'sleeping' : 'idle'
}

let isScanning = false
let isScanQueued = false
let isReadingGit = false
let isGitQueued = false

// A failed background refresh must not take the hooks worker down.
const quietly = (job: () => Promise<unknown>) => job().catch(() => undefined)

/** One spelling for "node could not even start", whatever the OS called it. */
const problemFrom = (text: string, other: string) =>
  /ENOENT|not found|not recognized/i.test(text) ? NO_NODE : other

const runNode = async (
  $: EngineInterface,
  script: string,
  args: string[],
  timeoutMs: number,
) => {
  try {
    return await $.process.run(
      ['node', `${$.plugin.root}/scripts/${script}`, ...args],
      { timeoutMs },
    )
  } catch {
    throw new Error(NO_NODE)
  }
}

const showStatus = async ($: EngineInterface) => {
  if (!(await read($, isHidden))) {
    $.ui.status(undefined)

    return
  }
  const parts = (await read($, limits)).map(
    limit =>
      `${WINDOWS[limit.kind] ?? limit.kind} ${Math.round(limit.percentUsed)}%`,
  )
  const scanned = await read($, totals)
  if (scanned) {
    parts.push(`today ${compact(sumOf(scanned.today))} tok`)
    parts.push(dollars(scanned.usd.today))
  }
  parts.push('/hud')
  $.ui.status(parts.join(' · '))
}

const scan = ($: EngineInterface): Promise<unknown> =>
  quietly(async () => {
    if (isScanning) {
      isScanQueued = true

      return
    }
    isScanning = true
    try {
      const ran = await runNode($, 'scan.mjs', [], 120_000)
      if (ran.exitCode !== 0) throw new Error(ran.stderr.trim().slice(0, 200))
      const scanned = JSON.parse(ran.stdout) as Totals
      await update($, totals, () => scanned)
      await update($, problem, () => null)
      await showStatus($)
    } catch (error) {
      const why = error instanceof Error ? error.message : String(error)
      await update($, problem, () => problemFrom(why, why))
      await showStatus($)
    } finally {
      isScanning = false
    }
    // Asked again mid-scan: run once more so the totals never miss a turn.
    if (isScanQueued) {
      isScanQueued = false
      await scan($)
    }
  })

const refreshGit = ($: EngineInterface): Promise<unknown> =>
  quietly(async () => {
    if (isReadingGit) {
      isGitQueued = true

      return
    }
    isReadingGit = true
    try {
      const ran = await runNode(
        $,
        'git.mjs',
        [await $.session.cwd()],
        GIT_TIMEOUT_MS,
      )
      if (ran.exitCode !== 0) throw new Error(ran.stderr)
      const seen = JSON.parse(ran.stdout) as Git
      await update($, git, () => seen)
    } catch (error) {
      const why = error instanceof Error ? error.message : String(error)
      const unread: Git = {
        isRepo: false,
        problem: problemFrom(why, 'git status unavailable'),
      }
      await update($, git, () => unread)
    } finally {
      isReadingGit = false
    }
    if (isGitQueued) {
      isGitQueued = false
      await refreshGit($)
    }
  })

const measure = async (
  $: EngineInterface,
  seen: { rateLimits: Limit[]; context: Context },
) => {
  await update($, limits, () => seen.rateLimits)
  await update($, context, () => seen.context)
  await showStatus($)
}

const tick = ($: EngineInterface) =>
  quietly(async () => {
    if (!(await read($, isHidden))) await update($, frame, n => n + 1)
  })

const readUsage = ($: EngineInterface) =>
  quietly(async () => measure($, await $.session.usage()))

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'hud',
      description: 'Show or hide the usage HUD, or switch its tab',
      argumentHint: '[usage|stats|git|hide|show]',
    })
    if ((await $.store.get('isHidden')) === true) {
      await update($, isHidden, () => true)
    }
    const now = await $.clock.now()
    await update($, activeAt, () => now)
    $.clock.every(MASCOT_TICK_MS, () => {
      void tick($)
    })
    void scan($)
    void refreshGit($)
    void readUsage($)

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await measure($, e)

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, activeAt, () => now)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, activeAt, () => now)
    void scan($)
    if (!(await read($, isHidden)) && (await read($, tab)) === 'git') {
      void refreshGit($)
    }

    return next(e)
  })

  on('command.run', { command: 'hud' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    let hidden = await read($, isHidden)
    let text = ''
    if (arg === '' || arg === 'hide' || arg === 'show') {
      hidden = arg === '' ? !hidden : arg === 'hide'
      text = hidden ? 'HUD hidden. /hud shows it again.' : 'HUD shown.'
    } else if (arg === 'usage' || arg === 'stats' || arg === 'git') {
      hidden = false
      await update($, tab, () => arg)
      if (arg === 'git') void refreshGit($)
      text = `HUD: ${arg}`
    } else {
      return { text: 'Usage: /hud [usage|stats|git|hide|show]' }
    }
    await update($, isHidden, () => hidden)
    await $.store.set('isHidden', hidden)
    await showStatus($)

    return { text }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) return next(e)

    // A band too narrow for the panel draws nothing rather than a broken one.
    if (e.props.bodyColumns < PANEL_MIN) return next(e)

    const { Box, Text, Button } = $.ui.resolve(e)
    const windows = await read($, limits)
    const scanned = await read($, totals)
    const failed = await read($, problem)
    const window = await read($, context)
    const repo = await read($, git)
    const active = await read($, tab)
    const beat = await read($, frame)
    const lastActive = await read($, activeAt)
    const now = await $.clock.now()

    const columns = e.props.bodyColumns
    const isWide = columns >= WIDE
    const area = columns - MASCOT_COL
    const leftW = isWide ? Math.floor((area - GAP) * LEFT_SHARE) : area
    const rightW = isWide ? area - GAP - leftW : area
    const pose = mascot(
      moodOf(
        [window?.percent ?? 0, ...windows.map(l => l.percentUsed)],
        e.props.isWorking,
        now - lastActive,
      ),
      beat,
    )

    const tabButton = (id: Tab, hotkey: string, label: string) => (
      <Button
        key={`tab-${id}`}
        plain
        hotkey={hotkey}
        onPress={() => {
          void update($, tab, () => id)
          if (id === 'git') void refreshGit($)
        }}
      >
        <Text bold={active === id} color={active === id ? ARC : undefined} dimColor={active !== id}>
          {label}
        </Text>
      </Button>
    )

    // A coloured label, then whatever the row says.
    const labelled = (label: string, ...children: RenderNode[]) => (
      <Box>
        <Text color={ARC}>{label.padEnd(LABEL)}</Text>
        {children}
      </Box>
    )

    const gauge = (label: string, percent: number, detail: string) => {
      const c = level(percent)
      const { filled, empty } = meter(
        percent,
        Math.max(6, Math.min(16, leftW - 36)),
      )

      return (
        <Box key={label}>
          <Text color={ARC}>{label.padEnd(LABEL)}</Text>
          <Text color={c}>{filled}</Text>
          <Text dimColor>{empty}</Text>
          <Text bold color={c}>
            {`${Math.round(percent)}%`.padStart(5)}
          </Text>
          <Text dimColor wrap="truncate-end">
            {'  ' + detail}
          </Text>
        </Box>
      )
    }

    // Dollars are an estimate at API list prices (scripts/prices.mjs), not a bill.
    const total = (label: string, tokens: Tokens, usd: number) => (
      <Text wrap="truncate-end">
        <Text color={ARC}>{label.padEnd(LABEL)}</Text>
        {`${compact(sumOf(tokens))} tok`.padStart(11)}
        {'  '}
        {dollars(usd)}
      </Text>
    )

    const pending = (
      <Text dimColor wrap="truncate-end">
        Reading transcripts...
      </Text>
    )

    const usageRows = {
      left: (
        <>
          {gauge(
            'CTX',
            window?.percent ?? 0,
            window?.tokens === undefined
              ? 'awaiting first response'
              : `${compact(window.tokens)} used · ${compact(Math.max(0, window.window - window.tokens))} left`,
          )}
          <Box flexDirection="column">
            {windows.map(limit => {
              const left = untilReset(limit.resetsAt, now)

              return gauge(
                WINDOWS[limit.kind] ?? limit.kind.toUpperCase().slice(0, 5),
                limit.percentUsed,
                left === '' ? '' : `resets ${left}`,
              )
            })}
          </Box>
          {when(windows.length === 0, <Text dimColor wrap="truncate-end">No rate limits reported for this account</Text>)}
        </>
      ),
      right: (
        <>
          {failed === null ? (
            ''
          ) : (
            <Text color={CRIT} wrap="truncate-end">
              scan failed: {failed}
            </Text>
          )}
          {when(scanned === null && failed === null, pending)}
          {scanned === null ? (
            ''
          ) : (
            <>
              {total('TODAY', scanned.today, scanned.usd.today)}
              {total('WEEK', scanned.week, scanned.usd.week)}
              {total('MONTH', scanned.month, scanned.usd.month)}
            </>
          )}
        </>
      ),
    }

    const statsRows = (() => {
      if (scanned === null) return { left: pending, right: <></> }
      const { hours, weekdays, days, months, peakDay, peakWeek, peakMonth } =
        scanned.stats
      const hasHours = hours.some(h => h > 0)
      const peaks: string[] = []
      if (peakDay) peaks.push(`day ${peakDay.key} ${compact(peakDay.tokens)}`)
      if (peakWeek) peaks.push(`week of ${peakWeek.key} ${compact(peakWeek.tokens)}`)
      if (peakMonth) peaks.push(`month ${peakMonth.key} ${compact(peakMonth.tokens)}`)

      return {
        left: (
        <>
          {labelled(
            'HOURS',
            <Text color={ARC}>{spark(hours)}</Text>,
            when(
              hasHours,
              <Text dimColor wrap="truncate-end">
                {`  peak ${String(hours.indexOf(Math.max(...hours))).padStart(2, '0')}:00`}
              </Text>,
            ),
          )}
          <Text dimColor wrap="truncate-end">{`${' '.repeat(LABEL)}0     6     12    18    `}</Text>
          {labelled(
            'DAYS',
            <Text color={ARC}>{spark(weekdays)}</Text>,
            <Text dimColor wrap="truncate-end">
              {hasHours
                ? `  Mon→Sun · busiest ${DAYS[weekdays.indexOf(Math.max(...weekdays))]}`
                : '  Mon→Sun'}
            </Text>,
          )}
          {labelled('30D', <Text color={ARC}>{spark(days.map(d => d.tokens))}</Text>)}
          {labelled('12MO', <Text color={ARC}>{spark(months.map(m => m.tokens))}</Text>)}
        </>
        ),
        right: (
        <>
          {when(peaks.length === 0, <Text dimColor wrap="truncate-end">No usage recorded yet</Text>)}
          <Box flexDirection="column">
          {peaks.map((peak, i) => (
            <Box key={peak}>
              {labelled(
                i === 0 ? 'TOP' : '',
                <Text dimColor wrap="truncate-end">
                  {peak}
                </Text>,
              )}
            </Box>
          ))}
          </Box>
        </>
        ),
      }
    })()

    const gitRows = (() => {
      if (repo === null) {
        return { left: <Text dimColor wrap="truncate-end">Reading git status...</Text>, right: <></> }
      }
      if (!repo.isRepo) {
        return {
          left: repo.problem ? (
            <Text color={WARM} wrap="truncate-end">
              {repo.problem}
            </Text>
          ) : (
            <Text dimColor wrap="truncate-end">
              Not a git repository
            </Text>
          ),
          right: <></>,
        }
      }
      const { pr, ci, lastCommit } = repo
      const counts = [
        { n: repo.staged, text: `+${repo.staged} staged`, color: OK },
        { n: repo.modified, text: `!${repo.modified} modified`, color: WARM },
        { n: repo.untracked, text: `?${repo.untracked} untracked`, color: ARC },
        { n: repo.conflicted, text: `✖${repo.conflicted} conflicts`, color: CRIT },
        { n: repo.stashes, text: `≡${repo.stashes} stash`, color: ARC },
      ]
      const ciColor =
        ci?.conclusion === 'success'
          ? OK
          : ci?.conclusion === 'failure'
            ? CRIT
            : WARM

      return {
        left: (
        <>
          <Text wrap="truncate-end">
            <Text bold color={ARC}>
              {repo.repo}
            </Text>
            <Text bold>{`   ${repo.branch}`}</Text>
            {when(repo.ahead > 0, <Text color={OK}>{` ⇡${repo.ahead}`}</Text>)}
            {when(repo.behind > 0, <Text color={HOT}>{` ⇣${repo.behind}`}</Text>)}
            <Text dimColor>
              {repo.upstream === '' ? ' (no upstream)' : ` → ${repo.upstream}`}
            </Text>
          </Text>
          {counts.every(c => c.n === 0) ? (
            <Text color={OK} wrap="truncate-end">✔ working tree clean</Text>
          ) : (
            <Text wrap="truncate-end">
              {counts.map((c, i) => (
                <Text key={c.text} color={c.n > 0 ? c.color : undefined} dimColor={c.n === 0}>
                  {(i > 0 ? '  ' : '') + c.text}
                </Text>
              ))}
            </Text>
          )}
          {labelled(
            'LAST',
            lastCommit ? (
              <Text wrap="truncate-end">
                {`${lastCommit.hash} ${lastCommit.subject}`}
                <Text dimColor>{` (${lastCommit.age})`}</Text>
              </Text>
            ) : (
              <Text dimColor wrap="truncate-end">No commits yet</Text>
            ),
          )}
        </>
        ),
        right: (
        <Box flexDirection="column">
          {repo.ghProblem !== '' ? (
            <Text dimColor wrap="truncate-end">
              GitHub: {repo.ghProblem}
            </Text>
          ) : (
            <>
              {labelled(
                'PR',
                pr ? (
                  <Text wrap="truncate-end">{`#${pr.number} ${pr.title}`}</Text>
                ) : (
                  <Text dimColor wrap="truncate-end">none for this branch</Text>
                ),
              )}
              {pr === null ? (
                ''
              ) : (
                <Text wrap="truncate-end">
                  {' '.repeat(LABEL)}
                  {`${pr.state}${pr.isDraft ? ' · DRAFT' : ''}${pr.review === '' ? '' : ` · ${pr.review}`} `}
                  <Text color={OK}>{`✔${pr.checks.passed}`}</Text>
                  <Text color={pr.checks.failed > 0 ? CRIT : undefined} dimColor={pr.checks.failed === 0}>
                    {` ✖${pr.checks.failed}`}
                  </Text>
                  <Text color={pr.checks.pending > 0 ? WARM : undefined} dimColor={pr.checks.pending === 0}>
                    {` ●${pr.checks.pending}`}
                  </Text>
                </Text>
              )}
              {labelled(
                'CI',
                ci ? (
                  <Text color={ciColor} wrap="truncate-end">
                    {`${ci.name} · ${ci.status}${ci.conclusion === '' ? '' : ` · ${ci.conclusion}`}`}
                  </Text>
                ) : (
                  <Text dimColor wrap="truncate-end">no workflow runs</Text>
                ),
              )}
            </>
          )}
        </Box>
        ),
      }
    })()

    const rows = { usage: usageRows, stats: statsRows, git: gitRows }[active]

    return (
      <Box flexDirection="column" width={columns}>
        <Box width={columns}>
          <Text color={ARC} dimColor>── </Text>
          <Text bold color={ARC}>◢ USAGE-BOARD</Text>
          {when(pose.caption !== '', <Text dimColor>{` · ${pose.caption}`}</Text>)}
          <Box flexGrow={1} flexShrink={1}>
            <Text color={ARC} dimColor wrap="truncate-end">{' ' + '─'.repeat(columns)}</Text>
          </Box>
          {tabButton('usage', '1', 'USAGE')}
          <Text> </Text>
          {tabButton('stats', '2', 'STATS')}
          <Text> </Text>
          {tabButton('git', '3', 'GIT')}
          <Text color={ARC} dimColor> ──</Text>
        </Box>
        <Box>
          <Box flexDirection="column" width={MASCOT_COL} flexShrink={0}>
            {pose.lines.map(line => (
              <Text color={FUR} wrap="truncate-end">{line}</Text>
            ))}
          </Box>
          <Box flexDirection={isWide ? 'row' : 'column'} columnGap={GAP} width={area}>
            <Box flexDirection="column" width={leftW} flexShrink={0}>
              {rows.left}
            </Box>
            <Box flexDirection="column" width={rightW}>
              {rows.right}
            </Box>
          </Box>
        </Box>
      </Box>
    )
  })
}
