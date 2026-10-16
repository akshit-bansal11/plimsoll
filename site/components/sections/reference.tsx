import { CodeBlock } from "@/components/code-block";
import { C, ExternalLink, P, Section, Sub } from "@/components/section";
import { REPO } from "@/lib/nav";

const LIMITS: string[] = [
  "A transcript that was forked or copied is counted twice for the rows it shares.",
  "Dollars are an estimate at API list prices, not a bill. A model missing from the price table counts as $0 until the table is updated.",
  "Rate-limit windows are only reported on a subscription.",
  "A mod cannot draw over the transcript or register its own key chord, so the HUD takes rows of its own and uses Claude Code's band shortcuts.",
  "Below 48 columns the band is not drawn.",
  "The mod API is early access and may change between Claude Code releases.",
  "A clean filter that the inspected repository's config defines still runs when git status rereads a changed file, as it does for any git prompt; git has no switch for that.",
];

const CHECKS = `node scripts/check.mjs              # price table check
claude plugin validate --strict .   # manifest + hooks check
claude plugin test .                # UI and logic tests`;

const SITE_CHECKS = `cd site
npm ci
npm run check:ci   # Biome, ESLint, tsc; non-mutating
npm run build      # static export to site/out`;

const LAYOUT = `hooks/register.tsx    the band, the /hud command and the status line
hooks/mascot.ts       the kitten's frames
scripts/scan.mjs      sums the transcripts
scripts/cache.mjs     names the scan cache, carries the old one over
scripts/prices.mjs    the price table
scripts/git.mjs       reads git and gh
tests/                the mod's tests
site/                 this site`;

/** Known limits, privacy, uninstall, and the developer's half. */
export function ReferenceSections({ version }: { version: string }) {
  return (
    <>
      <Section
        id="limits"
        eyebrow="Reference"
        title="Known limits"
        lede="What it does not do, or does imperfectly. Each one is in the README or a comment in the code."
      >
        <ul className="bg-card shadow-card divide-line max-w-[72ch] divide-y rounded-[var(--radius-panel)] px-5">
          {LIMITS.map((limit) => (
            <li key={limit} className="py-4 text-[0.9375rem] leading-relaxed">
              {limit}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="privacy"
        title="Privacy and security"
        lede="Nothing leaves your machine except through gh, and the repository you are in is treated as untrusted."
      >
        <ul className="max-w-[68ch] list-disc space-y-2 pl-5 text-base leading-relaxed">
          <li>
            Token totals and statistics are summed locally. The only file the plugin
            writes is its scan cache.
          </li>
          <li>
            The one network call is gh, to GitHub, with your own sign-in, for the
            repository you are in. No server, no account, no telemetry.
          </li>
          <li>
            git and gh are found on <C>PATH</C> by absolute folder and run by full path,
            so a <C>git.exe</C> or <C>gh.exe</C> planted in the repository is never run
            on Windows.
          </li>
          <li>
            The repository&apos;s <C>core.fsmonitor</C> and <C>log.showSignature</C>{" "}
            settings are overridden, since each names a program for git to run, and
            optional index locks and terminal prompts are switched off.
          </li>
          <li>
            Branch names, commit subjects, pull request titles and workflow names have
            control characters replaced before they are drawn, so an escape sequence
            cannot reach your terminal.
          </li>
        </ul>
        <P>
          Report a hole privately through a{" "}
          <ExternalLink href={`${REPO}/security/advisories/new`}>
            security advisory
          </ExternalLink>
          , as{" "}
          <ExternalLink href={`${REPO}/blob/main/SECURITY.md`}>
            SECURITY.md
          </ExternalLink>{" "}
          describes.
        </P>
      </Section>

      <Section id="uninstall" title="Uninstall">
        <CodeBlock
          title="Uninstall Plimsoll"
          code={
            "/plugin uninstall plimsoll@plimsoll\n/plugin marketplace remove plimsoll"
          }
        />
        <P>
          Then delete <C>&lt;config dir&gt;/plimsoll/</C> (<C>~/.claude/plimsoll/</C> by
          default) to remove the scan cache. A <C>usage-board/</C> folder beside it is
          the cache of a version before 0.3.0 and can go too.
        </P>
      </Section>

      <Section
        id="develop"
        eyebrow="Developing"
        title="Develop"
        lede="Node.js and the Claude Code CLI. There is no package.json and nothing to install outside the site."
      >
        <P>
          The hooks run inside Claude Code and import only <C>claude-code</C>; the
          scripts use only Node&apos;s standard library. Run the plugin from a clone
          with <C>claude --plugin-dir /path/to/plimsoll</C>.
        </P>
        <Sub>Checks</Sub>
        <CodeBlock
          title="The checks"
          code={CHECKS}
          caption="CI runs the same three on every push and pull request, with the Claude Code CLI pinned to one version."
        />
        <P>
          The mod tests cannot import <C>node:</C> modules, so script logic that needs a
          test takes its file system functions as arguments; <C>scripts/cache.mjs</C> is
          the example.
        </P>
        <Sub>The site</Sub>
        <CodeBlock title="The site's checks" code={SITE_CHECKS} />
        <P>
          The site reads the plugin&apos;s version, price table and band mock-up from
          the repository at build time, so it must be built from inside it. It deploys
          to Vercel from the repository root.
        </P>
        <Sub>Layout</Sub>
        <CodeBlock title="Repository layout" code={LAYOUT} />
        <P>
          Changes follow{" "}
          <ExternalLink href={`${REPO}/blob/main/CONTRIBUTING.md`}>
            CONTRIBUTING.md
          </ExternalLink>
          : Conventional Commits, a line under Unreleased in the changelog, and no lint
          suppressions.
        </P>
      </Section>

      <Section
        id="releases"
        title="Releases"
        lede={`This site was built from version ${version}.`}
      >
        <P>
          A <C>v*</C> tag that matches plugin.json&apos;s version runs the checks, zips
          the plugin&apos;s runtime files under a <C>plimsoll/</C> folder into{" "}
          <C>Plimsoll-&lt;version&gt;.zip</C>, writes <C>SHA256SUMS.txt</C>, attests
          where the zip was built, and publishes a GitHub Release with that
          version&apos;s changelog section as its notes.
        </P>
        <P>
          The marketplace install does not need the zip; it is for a pinned or offline
          install with <C>claude --plugin-dir</C>. Check one with:
        </P>
        <CodeBlock
          title="Verify a release"
          code="gh attestation verify Plimsoll-<version>.zip --repo akshit-bansal11/plimsoll"
        />
        <P>
          See the{" "}
          <ExternalLink href={`${REPO}/blob/main/CHANGELOG.md`}>changelog</ExternalLink>{" "}
          for what changed in each version.
        </P>
      </Section>
    </>
  );
}
