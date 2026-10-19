import { C, ExternalLink, Note, P, Section, Sub } from "@/components/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { REPO } from "@/lib/nav";
import type { PriceTable } from "@/lib/repo";

const WINDOWS: { kind: string; label: string }[] = [
  { kind: "five_hour", label: "5H" },
  { kind: "seven_day", label: "WEEK" },
  { kind: "spend_limit", label: "SPEND" },
];

const CHECKS: { bucket: string; states: string }[] = [
  { bucket: "Passed", states: "SUCCESS, NEUTRAL, SKIPPED" },
  {
    bucket: "Failed",
    states: "FAILURE, ERROR, TIMED_OUT, CANCELLED, ACTION_REQUIRED, STARTUP_FAILURE",
  },
  { bucket: "Pending", states: "anything else" },
];

const LEVELS: { range: string; colour: string }[] = [
  { range: "below 50%", colour: "Green" },
  { range: "50% to 74%", colour: "Yellow" },
  { range: "75% to 89%", colour: "Orange" },
  { range: "90% and over", colour: "Red" },
];

const dollars = (n: number) => `$${n}`;

/** How each figure on the band is produced, read from hooks/ and scripts/. */
export function NumbersSections({ prices }: { prices: PriceTable }) {
  return (
    <>
      <Section
        id="context"
        eyebrow="How the numbers are computed"
        title="Context window"
        lede="Measured by Claude Code and passed to the plugin. Plimsoll does not count it."
      >
        <P>
          Claude Code reports the window&apos;s size, the tokens in it and the
          percentage used, when a session starts and each time it measures again. The{" "}
          <C>CTX</C> gauge draws the percentage, and the detail beside it reads{" "}
          <C>used · left</C>, where left is the window&apos;s size minus the tokens in
          it, never below zero. Before the first response there is nothing to measure,
          and the detail says <C>awaiting first response</C>.
        </P>
      </Section>

      <Section
        id="rate-limits"
        title="Rate limits"
        lede="Also reported by Claude Code, one gauge per window it reports."
      >
        <P>
          Each window comes with the percentage used and, usually, when it resets. The
          gauge&apos;s label comes from the window&apos;s kind; a kind not in this table
          is shown by its own name, upper-cased and cut to five letters.
        </P>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Window kind</TableHead>
              <TableHead>Label</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {WINDOWS.map((row) => (
              <TableRow key={row.kind}>
                <TableCell>
                  <C>{row.kind}</C>
                </TableCell>
                <TableCell>
                  <C>{row.label}</C>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <P>
          The time to reset is the reset time minus now: days and hours from a day out,
          hours and minutes inside one, and <C>now</C> once it has passed. With no
          windows reported the band says <C>No rate limits reported for this account</C>
          . Rate-limit windows are only reported on a subscription.
        </P>
      </Section>

      <Section
        id="tokens"
        title="Tokens and statistics"
        lede="Summed by scripts/scan.mjs from the transcripts already on your disk."
      >
        <P>
          The scan reads every <C>.jsonl</C> transcript under{" "}
          <C>&lt;config dir&gt;/projects</C>, where the config dir is{" "}
          <C>CLAUDE_CONFIG_DIR</C> or <C>~/.claude</C>. It runs when a session starts
          and after every turn, and nothing it reads leaves your machine.
        </P>
        <Sub>What counts</Sub>
        <ul className="max-w-[68ch] list-disc space-y-2 pl-5 text-base leading-relaxed">
          <li>
            Only assistant responses with a usage block, from a real model (not{" "}
            <C>&lt;synthetic&gt;</C>), with a readable timestamp.
          </li>
          <li>
            A response is written once per content block under one message id, its usage
            final on the last, so the last row of each id is the one counted.
          </li>
          <li>
            The band&apos;s totals count input and output tokens; cache writes and reads
            are shown beside them as <C>+N cache</C>, because cache reads re-bill the
            same prompt every turn. The statistics add all four kinds together.
          </li>
        </ul>
        <Sub>Periods</Sub>
        <P>
          Every response is filed under its local hour. Today is the local date, the
          week starts on Monday, and the month on the 1st. The statistics run over every
          transcript on disk: tokens by hour of day and by weekday, the last 30 days and
          12 months (zero-filled, the current one last), and the busiest single day,
          week (named by its Monday) and month.
        </P>
        <Sub>The cache</Sub>
        <P>
          Each transcript&apos;s per-hour sums are kept in{" "}
          <C>&lt;config dir&gt;/plimsoll/scan-cache-3.json</C>, keyed by path. A file
          whose modification time and size have not changed is not read again, so only
          the first scan reads everything. The cache is written to a temporary file and
          renamed into place, so a second session never reads half of one. A long first
          scan saves its progress every 10 seconds, so if it is stopped, the next scan
          carries on from there.
        </P>
        <Note label="Counted twice">
          Message ids are de-duplicated within a file, not across files, so a transcript
          that was forked or copied counts the rows it shares twice.
        </Note>
      </Section>

      <Section
        id="cost"
        title="Estimated cost"
        lede="An estimate at Anthropic API list prices, shown as ~$… API. Not a bill: a subscription is not charged per token."
      >
        <P>
          Each response is priced by the first row below whose prefix its model id
          starts with, so a longer prefix is listed before a shorter one it begins with.
          A model with no row adds $0 rather than a guessed price. Model ids from Amazon
          Bedrock and Google Vertex are matched from their <C>claude-</C> part, and
          Claude Haiku 5.5 charges 5 times every price for a request whose prompt is
          over 100,000 tokens.
        </P>
        <Formula code={formula(prices)} />
        <P>
          Claude Code splits a cache write by lifetime when it records one; without the
          split every written token is priced as a 5-minute write. The three totals are
          rounded to the cent.
        </P>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model id prefix</TableHead>
              <TableHead className="text-right">Input / MTok</TableHead>
              <TableHead className="text-right">Output / MTok</TableHead>
              <TableHead className="text-right">Cache read</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.prices.map((row) => (
              <TableRow key={row.prefix}>
                <TableCell>
                  <C>{row.prefix}</C>
                </TableCell>
                <TableCell className="text-right">{dollars(row.input)}</TableCell>
                <TableCell className="text-right">{dollars(row.output)}</TableCell>
                <TableCell className="text-right">× {row.readMultiplier}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <P>
          Prices as of {prices.asOf}, read from{" "}
          <ExternalLink href={`${REPO}/blob/main/scripts/prices.mjs`}>
            scripts/prices.mjs
          </ExternalLink>{" "}
          when this site was built. Cache reads are a fraction of the input price; cache
          writes cost × {prices.write5m} of it for 5 minutes and × {prices.write1h} for
          1 hour.
        </P>
      </Section>

      <Section
        id="git"
        title="Git, pull requests and CI"
        lede="Read by scripts/git.mjs in the folder the session is in."
      >
        <P>
          It runs when a session starts, after each turn while the git tab is showing,
          and when you switch to the git tab. git gets 5 seconds a command, gh 8, and
          the whole read 45.
        </P>
        <Sub>From git</Sub>
        <ul className="max-w-[68ch] list-disc space-y-2 pl-5 text-base leading-relaxed">
          <li>
            <C>git rev-parse --show-toplevel</C> finds the repository. Outside one the
            tab says <C>Not a git repository</C>; without git,{" "}
            <C>git is not installed</C>.
          </li>
          <li>
            <C>git status --porcelain=v2 --branch</C> gives the branch, its upstream,
            ahead and behind, and the counts: staged from the index column, modified
            from the work-tree column, conflicts and untracked files. A detached HEAD
            shows its short hash in parentheses.
          </li>
          <li>
            <C>git stash list</C> is counted, and <C>git log -1</C> gives the last
            commit&apos;s hash, subject and age.
          </li>
        </ul>
        <Sub>From gh</Sub>
        <P>
          Skipped on a detached HEAD or a repository with no remote. Otherwise{" "}
          <C>gh pr view</C> gives the branch&apos;s pull request: number, title, state,
          draft, review decision and its checks, sorted into three counts.
        </P>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Count</TableHead>
              <TableHead>Check states</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CHECKS.map((row) => (
              <TableRow key={row.bucket}>
                <TableCell className="font-bold">{row.bucket}</TableCell>
                <TableCell>{row.states}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <P>
          <C>gh run list --branch &lt;branch&gt; --limit 1</C> gives the newest workflow
          run&apos;s name, status and conclusion. When gh cannot answer the tab says
          why: <C>gh is not installed</C>, <C>gh is not signed in</C>,{" "}
          <C>gh timed out</C>, <C>GitHub unreachable (offline?)</C> or{" "}
          <C>remote is not on GitHub</C>. Any other failure reads as no pull request for
          the branch.
        </P>
      </Section>

      <Section
        id="colours"
        title="Colours and the mascot"
        lede="One scale for every gauge, and a kitten that reads it."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Percentage</TableHead>
              <TableHead>Gauge colour</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LEVELS.map((row) => (
              <TableRow key={row.range}>
                <TableCell>{row.range}</TableCell>
                <TableCell className="font-bold">{row.colour}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <P>
          The colours come from your Claude Code theme, so they stay readable on light
          and dark terminals; only orange is fixed. The kitten panics when the context
          gauge or the 5-hour gauge is red. Short of that it types while Claude is
          working, sleeps once five minutes have passed since a turn last started or
          ended, and otherwise idles. It moves a frame every 300 milliseconds while the
          HUD is shown, and not at all while it is hidden or paused with{" "}
          <C>/hud still</C>.
        </P>
      </Section>
    </>
  );
}

function formula({ write5m, write1h }: PriceTable) {
  return [
    "cost = ( input       × input price",
    "       + output      × output price",
    "       + cache read  × input price × cache-read multiplier",
    `       + 5m write    × input price × ${write5m}`,
    `       + 1h write    × input price × ${write1h} ) / 1,000,000`,
  ].join("\n");
}

function Formula({ code }: { code: string }) {
  return (
    <pre className="bg-card shadow-card max-w-[72ch] overflow-x-auto rounded-[var(--radius-card)] p-4 font-mono text-[0.8125rem] leading-relaxed">
      <code>{code}</code>
    </pre>
  );
}
