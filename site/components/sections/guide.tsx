import { CodeBlock } from "@/components/code-block";
import { C, Note, P, Section, Sub } from "@/components/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INSTALL_COMMANDS } from "@/lib/nav";

const ACTIONS: { action: string; how: string }[] = [
  { action: "Hide or show the HUD", how: "/hud (or /hud hide, /hud show)" },
  { action: "Switch tab", how: "/hud usage, /hud stats, /hud git" },
  { action: "Pause or restart the kitten", how: "/hud still" },
  {
    action: "Collapse the band",
    how: "ctrl+x ctrl+a (Claude Code's own shortcut for the band)",
  },
  { action: "Switch tab by key", how: "ctrl+x tab to focus the band, then 1, 2 or 3" },
];

/** Install and Use: what someone needs before reading anything else. */
export function GuideSections() {
  return (
    <>
      <Section
        id="install"
        eyebrow="Start here"
        title="Install"
        lede="In a Claude Code terminal session, add the marketplace and install the plugin from it."
      >
        <CodeBlock title="Install Plimsoll" code={INSTALL_COMMANDS} />
        <P>Pick a scope when asked. User scope loads it in every session.</P>

        <Sub>Requirements</Sub>
        <ul className="max-w-[68ch] list-disc space-y-2 pl-5 text-base leading-relaxed">
          <li>
            <strong>Claude Code</strong> with plugin mods. CI tests against 2.1.301; the
            mod API is early access, so a much newer or older release may not load it.
          </li>
          <li>
            <strong>Node.js 20.1 or later</strong> on your <C>PATH</C>. The plugin
            starts it to read the transcripts and to run git.
          </li>
          <li>
            <strong>git</strong>, for the git tab.
          </li>
          <li>
            <strong>GitHub CLI (gh)</strong>, signed in. Optional, and only for pull
            request and CI status. Without it the git tab says so and still shows local
            git state.
          </li>
        </ul>

        <Sub>Coming from usage-board</Sub>
        <P>
          The plugin was called usage-board before 0.3.0. Remove the old plugin and its
          marketplace first, so only one copy runs:
        </P>
        <CodeBlock
          title="Remove usage-board"
          code={
            "/plugin uninstall usage-board@usage-board\n/plugin marketplace remove usage-board"
          }
        />
        <P>
          The first scan reads every transcript once. Whether the HUD was hidden is
          stored under the plugin&apos;s name, so it resets once: run <C>/hud hide</C>{" "}
          again if it was.
        </P>
      </Section>

      <Section
        id="use"
        title="Use"
        lede="One command, and the band's own two shortcuts."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>How</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ACTIONS.map((row) => (
              <TableRow key={row.action}>
                <TableCell className="font-bold">{row.action}</TableCell>
                <TableCell>
                  <C>{row.how}</C>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <P>
          <C>/hud</C> alone toggles between hidden and shown. A tab name shows the HUD
          if it was hidden. Anything else answers with the usage line,{" "}
          <C>/hud [usage|stats|git|hide|show|still]</C>.
        </P>
        <P>
          While hidden, a one-line summary stays in the status line: each rate-limit
          window&apos;s percentage, today&apos;s tokens and estimated cost, and a
          reminder of <C>/hud</C>. The hidden state is remembered across sessions.
        </P>
        <Note label="Width">
          The band needs about 110 columns to lay its two content columns side by side.
          Narrower than that they stack, and below 48 columns it is not drawn at all,
          rather than drawn broken. It also steps aside while Claude Code shows a survey
          in the band.
        </Note>
      </Section>
    </>
  );
}
