import {
  ArrowRight,
  Cat,
  ChartColumn,
  Coins,
  Database,
  Gauge,
  GitBranch,
  type LucideIcon,
  Timer,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { HudFigure } from "@/components/hud-figure";
import { GithubMark } from "@/components/icons/github";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GridPattern } from "@/components/ui/grid-pattern";
import { MagicCard } from "@/components/ui/magic-card";
import { INSTALL_COMMANDS, REPO } from "@/lib/nav";
import { loadPrices, loadVersion } from "@/lib/repo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const TABS: { title: string; Icon: LucideIcon; body: string }[] = [
  {
    title: "Usage",
    Icon: Gauge,
    body: "How full the context window is, in tokens used and left. Your 5-hour and weekly rate-limit windows, with the time to each reset. Input and output tokens and estimated cost for today, this week and this month, with cache tokens beside them.",
  },
  {
    title: "Stats",
    Icon: ChartColumn,
    body: "Your peak hour and busiest weekday, the last 30 days and the last 12 months as sparklines, and your most active day, week and month.",
  },
  {
    title: "Git",
    Icon: GitBranch,
    body: "Repository, branch, ahead and behind, staged, modified, untracked, conflict and stash counts, and the last commit. With gh signed in, the branch's pull request, its review state and check counts, and the latest CI run.",
  },
  {
    title: "The kitten",
    Icon: Cat,
    body: "A small ASCII kitten beside the gauges. It idles, types while Claude works, sleeps once five minutes pass without a turn, and panics when the context or 5-hour gauge reaches 90%. /hud still stops it moving.",
  },
];

const LIMITS: string[] = [
  "Dollars are an estimate at API list prices, shown as ~$… API. They are not a bill: a subscription is not charged per token.",
  "A model missing from the price table counts as $0 until the table is updated.",
  "Rate-limit windows are only reported on a subscription.",
  "A transcript that was forked or copied is counted twice for the rows it shares.",
  "A mod cannot draw over the transcript or register its own key chord, so the HUD takes rows of its own and uses Claude Code's band shortcuts.",
  "The band needs about 110 columns for its two columns side by side; narrower, they stack, and below 48 columns it is not drawn.",
  "The mod API is early access and may change between Claude Code releases.",
];

/** A section's heading block: a short accent eyebrow, a 900 title, a dim lede. */
function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <BlurFade>
      <p className="text-primary text-[0.9375rem] font-bold">{eyebrow}</p>
      <h2 className="mt-2 max-w-[22ch] text-[2rem] leading-[1.08] font-black tracking-[-0.02em] md:text-5xl">
        {title}
      </h2>
      {children ? (
        <p className="text-dim mt-4 max-w-[64ch] text-base leading-relaxed md:text-lg">
          {children}
        </p>
      ) : null}
    </BlurFade>
  );
}

/** An inline "go deeper" link: accent, bold, with an arrow. */
function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-primary inline-flex min-h-11 items-center gap-1.5 rounded-lg text-[0.9375rem] font-bold hover:underline hover:underline-offset-4"
    >
      {children}
      <ArrowRight aria-hidden className="size-4" />
    </Link>
  );
}

const SECTION = "mx-auto max-w-[80rem] scroll-mt-20 px-4 py-14 md:px-6 md:py-20";

export default function Page() {
  // Read at build time from the plugin's own files, so the version and the price date
  // on this page are the ones the plugin ships.
  const version = loadVersion();
  const prices = loadPrices();

  const facts: { term: string; value: string }[] = [
    { term: "Runs in", value: "Claude Code, above the prompt" },
    { term: "Reads", value: "Transcripts already on disk" },
    { term: "Needs", value: "Node.js 20.1+; git; gh optional" },
    { term: "Version", value: `${version}, MIT` },
  ];

  const sources: { title: string; Icon: LucideIcon; body: string }[] = [
    {
      title: "Context and rate limits",
      Icon: Timer,
      body: "Measured by Claude Code itself and handed to the plugin. Plimsoll does not estimate them.",
    },
    {
      title: "Tokens and statistics",
      Icon: Database,
      body: "Summed from the transcripts under your Claude config folder, in local time, weeks from Monday, when a session starts and after every turn. A cache means later scans read only the files that changed.",
    },
    {
      title: "Estimated cost",
      Icon: Coins,
      body: `Each response's tokens, cache writes and reads included, priced at Anthropic API list prices as of ${prices.asOf}. An estimate, never a bill.`,
    },
    {
      title: "Git and CI",
      Icon: GitBranch,
      body: "git status, stash and log for the folder you are in; gh for the pull request and the latest run. gh is the only part that touches the network, and only GitHub.",
    },
  ];

  return (
    <div id="top" className="min-h-dvh">
      <SiteHeader />

      <main id="main" className="scroll-mt-16">
        {/* Hero, on a faint grid that fades out towards the edges */}
        <section className="relative overflow-hidden">
          <GridPattern
            width={35}
            height={35}
            className="fill-transparent stroke-line [mask-image:radial-gradient(ellipse_70%_60%_at_60%_30%,black,transparent)]"
          />
          <div className="relative mx-auto grid max-w-[80rem] gap-12 px-4 pt-12 pb-16 md:px-6 md:pt-20 md:pb-24">
            {/* No entrance on the headline: it is the largest paint on the page, and a
                fade would leave it invisible until the JavaScript arrives. */}
            <div>
              <p className="bg-card shadow-card inline-flex rounded-full px-4 py-1.5 text-sm font-bold">
                <AnimatedShinyText>A mod for Claude Code</AnimatedShinyText>
              </p>
              <h1 className="mt-6 max-w-[16ch] text-[2.75rem] leading-[1.02] font-black tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                Know how close you are to the line.
              </h1>
              <p className="text-dim mt-6 max-w-[60ch] text-lg leading-relaxed md:text-xl">
                Plimsoll draws a heads-up display in the band above the Claude Code
                prompt: the context window, your rate limits, what the tokens would have
                cost, and the repository you are in. A ship&apos;s Plimsoll line shows
                how deep it may safely sit; this one shows how close a session is to its
                limits.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild>
                  <a href="#get">Install</a>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/docs">
                    Read the docs
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <a href={REPO} target="_blank" rel="noreferrer noopener">
                    <GithubMark className="size-4" />
                    Source
                  </a>
                </Button>
              </div>

              <ul
                aria-label="What it does not need"
                className="mt-8 flex flex-wrap gap-2"
              >
                {["No account", "No server", "No telemetry", "MIT licensed"].map(
                  (item) => (
                    <li key={item}>
                      <Badge variant="outline">{item}</Badge>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <BlurFade delay={0.1} className="min-w-0">
              <HudFigure />
            </BlurFade>
          </div>
        </section>

        {/* The facts, stated rather than claimed */}
        <div className="mx-auto max-w-[80rem] px-4 md:px-6">
          <BlurFade>
            <dl className="bg-line shadow-card grid gap-px overflow-hidden rounded-[var(--radius-panel)] sm:grid-cols-2 lg:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.term} className="bg-card px-5 py-4">
                  <dt className="label">{fact.term}</dt>
                  <dd className="mt-1 text-base font-bold">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </BlurFade>
        </div>

        {/* What each tab shows */}
        <section id="tabs" className={SECTION}>
          <Heading eyebrow="What it shows" title="Three tabs and a kitten.">
            Switch with /hud usage, /hud stats and /hud git, or focus the band with
            ctrl+x tab and press 1, 2 or 3. Gauges are green below 50%, yellow from 50%,
            orange from 75% and red from 90%.
          </Heading>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {TABS.map(({ title, Icon, body }, index) => (
              <li key={title}>
                <BlurFade delay={(index % 2) * 0.05} className="h-full">
                  <MagicCard className="shadow-card h-full rounded-[var(--radius-panel)]">
                    <div className="p-6">
                      <span className="bg-accent-soft text-primary grid size-11 place-items-center rounded-xl">
                        <Icon aria-hidden className="size-5" />
                      </span>
                      <h3 className="mt-4 text-lg font-bold">{title}</h3>
                      <p className="text-dim mt-2 text-[0.9375rem] leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </MagicCard>
                </BlurFade>
              </li>
            ))}
          </ul>
        </section>

        {/* How the numbers are produced */}
        <section id="numbers" className={SECTION}>
          <Heading
            eyebrow="How the numbers are produced"
            title="Measured where it can be, summed where it cannot."
          >
            Nothing on the band is made up. Each figure is either reported by Claude
            Code or added up from files already on your machine. The one estimate, the
            cost, is marked as one, and a model missing from the price table counts as
            $0.
          </Heading>

          <ol className="mt-10 grid gap-4 md:grid-cols-2">
            {sources.map(({ title, Icon, body }, index) => (
              <li key={title}>
                <BlurFade delay={(index % 2) * 0.05} className="h-full">
                  <Card className="h-full px-6 py-6">
                    <span className="bg-accent-soft text-primary grid size-11 place-items-center rounded-xl">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-lg leading-snug font-bold">{title}</h3>
                      <p className="text-dim mt-2 text-[0.9375rem] leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </Card>
                </BlurFade>
              </li>
            ))}
          </ol>

          <BlurFade>
            <p className="mt-4">
              <MoreLink href="/docs#context">How each number is computed</MoreLink>
            </p>
          </BlurFade>
        </section>

        {/* What it will not do */}
        <section className={SECTION}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
            <Heading eyebrow="The limits" title="What it will not do.">
              Everything here is in the README too. Nothing is left out because it is
              inconvenient.
            </Heading>

            <BlurFade delay={0.05}>
              <ul className="bg-card shadow-card divide-line divide-y rounded-[var(--radius-panel)] px-5">
                {LIMITS.map((limit) => (
                  <li key={limit} className="py-4 text-[0.9375rem] leading-relaxed">
                    {limit}
                  </li>
                ))}
              </ul>
              <p className="mt-3 px-1">
                <MoreLink href="/docs#limits">Every known limit</MoreLink>
              </p>
            </BlurFade>
          </div>
        </section>

        {/* Install */}
        <section id="get" className={SECTION}>
          <Heading eyebrow="Install" title="Two lines in a Claude Code session.">
            Pick a scope when asked: user scope loads it in every session. Node.js must
            be on your PATH, git is needed for the git tab, and a signed-in gh adds pull
            requests and CI.
          </Heading>

          <BlurFade className="mt-10 max-w-[44rem]">
            <CodeBlock
              title="Install Plimsoll"
              code={INSTALL_COMMANDS}
            />
          </BlurFade>

          <BlurFade>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/docs#install">
                  Full install guide
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </Button>
            </div>
            <p className="text-dim mt-4 max-w-[68ch] text-[0.9375rem] leading-relaxed">
              Free and MIT licensed. There is no account to make, no server to reach and
              nothing reported back: the plugin is the repository, and the marketplace
              installs it from there.
            </p>
          </BlurFade>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
