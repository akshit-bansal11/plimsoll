import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Lato } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE, SOCIAL_IMAGE } from "@/lib/nav";
import "./globals.css";

/*
  Lato in three weights: 400 for reading, 700 for labels and buttons, 900 for titles.
  JetBrains Mono for what really is code or terminal output: commands, the band
  mock-up, file paths.
*/
const sans = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-sans-family",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-family",
  display: "swap",
});

const TITLE = "Plimsoll — a usage HUD for Claude Code";
const DESCRIPTION =
  "Plimsoll draws a heads-up display above the Claude Code prompt: context window, rate limits, estimated cost, usage statistics and git status. Read from your own machine; only gh talks to GitHub. MIT.";

export const metadata: Metadata = {
  // Every relative URL in metadata (Open Graph, canonical) resolves against this.
  metadataBase: new URL(SITE),
  // The landing page's title is the default; app/docs/page.tsx overrides it. The
  // canonical link is each page's own, so a future page never inherits "/" by accident.
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Plimsoll",
  authors: [{ name: "akshit-bansal11" }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/",
    siteName: "Plimsoll",
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [SOCIAL_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Without JavaScript, motion never animates the blocks in: show them as they are. */}
      <head>
        <noscript>
          <style>
            {
              ".blur-fade{opacity:1!important;filter:none!important;transform:none!important}"
            }
          </style>
        </noscript>
      </head>
      <body className={`${mono.variable} ${sans.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
