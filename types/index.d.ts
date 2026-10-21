export type Tokens = {
  input: number
  output: number
  cacheWrite: number
  cacheRead: number
}

/** A labelled token total: `key` is a day (YYYY-MM-DD) or a month (YYYY-MM). */
export type Bucket = { key: string; tokens: number }

/** Activity over every transcript on disk, local time, tokens summed over all four kinds. */
export type Stats = {
  /** 24 totals, index = local hour of day. */
  hours: number[]
  /** 7 totals, index 0 = Monday. */
  weekdays: number[]
  /** The last 30 local days, oldest first, today last, zero-filled. */
  days: Bucket[]
  /** The last 12 local months, oldest first, this month last, zero-filled. */
  months: Bucket[]
  /** The busiest single day, week (keyed by its Monday) and month; null with no usage. */
  peakDay: Bucket | null
  peakWeek: Bucket | null
  peakMonth: Bucket | null
}

/** What scripts/scan.mjs prints. */
export type Totals = {
  today: Tokens
  week: Tokens
  month: Tokens
  /**
   * Dollars for the same three periods, estimated from the tokens at API list
   * prices (scripts/prices.mjs); a model the table does not know adds nothing.
   */
  usd: { today: number; week: number; month: number }
  stats: Stats
}

export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

/** The live context window: `tokens` and `percent` are absent before the first response. */
export type Context = { tokens?: number; window: number; percent?: number }

export type PullRequest = {
  number: number
  title: string
  /** OPEN, CLOSED or MERGED. */
  state: string
  isDraft: boolean
  /** APPROVED, CHANGES_REQUESTED, REVIEW_REQUIRED, or '' when none is asked. */
  review: string
  checks: { passed: number; failed: number; pending: number }
}

/** What scripts/git.mjs prints for a directory. */
export type Git =
  /** `problem` says why the state could not be read at all ('Node.js not found on PATH'). */
  | { isRepo: false; problem?: string }
  | {
      isRepo: true
      /** The work tree's folder name. */
      repo: string
      /** The branch, or the short hash in parentheses when HEAD is detached. */
      branch: string
      /** The upstream's name, '' when the branch tracks none. */
      upstream: string
      ahead: number
      behind: number
      staged: number
      modified: number
      untracked: number
      conflicted: number
      stashes: number
      /** null in a repository with no commit yet. */
      lastCommit: { hash: string; subject: string; age: string } | null
      /** The branch's pull request; null when there is none or `gh` could not say. */
      pr: PullRequest | null
      /** The branch's newest workflow run; null when there is none or `gh` could not say. */
      ci: { name: string; status: string; conclusion: string } | null
      /** Why `pr` and `ci` could not be read ('gh is not installed'), '' when they were. */
      ghProblem: string
    }

export type Tab = 'usage' | 'stats' | 'git'

declare module 'claude-code' {
  interface PluginState {
    plimsoll: {
      totals: Totals | null
      limits: Limit[]
      problem: string | null
      context: Context | null
      git: Git | null
      tab: Tab
      isHidden: boolean
      /** The mascot's animation is paused (`/hud still`). */
      isStill: boolean
      /** When a turn last started or ended, epoch ms: a new value wakes the mascot. */
      activeAt: number
    }
  }
}
