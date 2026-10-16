/**
 * The documentation page's table of contents. One list, used three times: by the
 * sidebar, by the mobile menu, and by the scroll-spy. Every `id` here must exist as a
 * section anchor on the page, which is why the sections take their heading from this
 * list rather than repeating it.
 */
export type NavItem = { id: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    label: "Start here",
    items: [
      { id: "install", label: "Install" },
      { id: "use", label: "Use" },
    ],
  },
  {
    label: "How the numbers are computed",
    items: [
      { id: "context", label: "Context window" },
      { id: "rate-limits", label: "Rate limits" },
      { id: "tokens", label: "Tokens and statistics" },
      { id: "cost", label: "Estimated cost" },
      { id: "git", label: "Git, pull requests and CI" },
      { id: "colours", label: "Colours and the mascot" },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "limits", label: "Known limits" },
      { id: "privacy", label: "Privacy and security" },
      { id: "uninstall", label: "Uninstall" },
    ],
  },
  {
    label: "Developing",
    items: [
      { id: "develop", label: "Develop" },
      { id: "releases", label: "Releases" },
    ],
  },
];

export const ALL_NAV_IDS: string[] = NAV.flatMap((group) =>
  group.items.map((item) => item.id),
);

export const REPO = "https://github.com/akshit-bansal11/plimsoll";
export const LATEST_RELEASE = `${REPO}/releases/latest`;

/** The site's one origin. Canonical links, the sitemap and robots.txt all resolve against it. */
export const SITE = "https://plimsoll.akshitbansal.dev";

/** The two lines that install it, exactly as the README gives them. */
export const INSTALL_COMMANDS =
  "/plugin marketplace add akshit-bansal11/plimsoll\n/plugin install plimsoll@plimsoll";

/** The card a shared link unfurls into: assets/social-preview.png, 1280×640. */
export const SOCIAL_IMAGE = {
  url: "/social-preview.png",
  width: 1280,
  height: 640,
  alt: "Plimsoll: know how close you are to the line. A usage HUD for Claude Code: context, rate limits, estimated cost, stats and git, right above the prompt.",
};
