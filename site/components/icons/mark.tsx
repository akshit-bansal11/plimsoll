/**
 * Plimsoll's mark: the load line painted on a ship's hull, a ring with a bar through
 * it, with the hull below the line filled in, the way a gauge fills. Inline, so the
 * ring and bar take the text colour and the fill takes the accent, in either theme.
 * The same drawing, with fixed colours, is in assets/ for the README and in app/ as
 * the favicon.
 */
export function PlimsollMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false" className={className}>
      <path d="M19 48a29 29 0 0 0 58 0z" fill="var(--primary)" />
      <circle
        cx="48"
        cy="48"
        r="32"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
      />
      <rect x="2" y="44.5" width="92" height="7" rx="3.5" fill="currentColor" />
    </svg>
  );
}
