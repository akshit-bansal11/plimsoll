import { loadMockup } from "@/lib/repo";
import { cn } from "@/lib/utils";

/**
 * The band, drawn in text, in a terminal-coloured card. The text is the README's own
 * mock-up, read at build time, and it is labelled as an illustration because that is
 * what it is: the figures in it are made up to show the layout. A real screenshot
 * replaces this once one exists.
 */
export function HudFigure({ className }: { className?: string }) {
  return (
    <figure className={cn("min-w-0", className)}>
      <div className="shadow-lift overflow-hidden rounded-[var(--radius-panel)] bg-[#0e0f12] text-[#f2f3f5]">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
          <span aria-hidden className="size-2.5 rounded-full bg-white/20" />
          <span aria-hidden className="size-2.5 rounded-full bg-white/20" />
          <span aria-hidden className="size-2.5 rounded-full bg-white/20" />
          <span className="ml-2 text-[0.8125rem] font-bold text-white/70">
            claude — the band above the prompt
          </span>
        </div>
        {/* ASCII art reads as noise letter by letter, so a screen reader gets the label. */}
        <pre
          role="img"
          aria-label="A text drawing of the Plimsoll band: context, five-hour and weekly gauges beside today's, this week's and this month's tokens and estimated cost, with a kitten on the left"
          className="overflow-x-auto p-4 font-mono text-[0.6875rem] leading-snug sm:text-[0.8125rem]"
        >
          {loadMockup()}
        </pre>
        <div className="border-t border-white/10 px-4 py-3 font-mono text-[0.8125rem] text-white/70">
          {">"} <span className="text-white">/hud stats</span>
        </div>
      </div>
      <figcaption className="text-dim mt-3 text-center text-sm">
        An illustration of the layout, not real output.
      </figcaption>
    </figure>
  );
}
