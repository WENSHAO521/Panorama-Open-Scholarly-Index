import localFont from "next/font/local";
import "@/app/globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TRANSLATION_GUARD_SCRIPT } from "@/lib/translation-guard";
import { THEME_SCRIPT } from "@/lib/theme";
import { HTML_LANG, type Locale } from "@/i18n/config";
import { clientMessages, getMessages } from "@/i18n";
import { LocaleProvider } from "@/i18n/LocaleProvider";

// Self-hosted (not next/font/google) -- that mechanism fetches font files
// from Google Fonts live at build time, and Cloudflare Pages' build
// environment hit a real, deterministic 404 on IBM Plex Sans's pinned URL.
// Vendoring the woff2 files removes the live-network dependency.
const ibmPlexSans = localFont({
  variable: "--font-ibm",
  display: "swap",
  src: [
    { path: "../fonts/ibm-plex-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-sans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ibm-plex-sans-700.woff2", weight: "700", style: "normal" },
  ],
});

const geistMono = localFont({
  variable: "--font-geist-mono",
  display: "swap",
  src: [{ path: "../fonts/geist-mono.woff2", weight: "400 700", style: "normal" }],
});

/**
 * The <html> document shared by every root layout (one per language) and by the global 404 page.
 * `locale` is the language of the interface text; it sets the `lang` attribute, the strings and the address prefix of the links.
 */
export function RootShell({ locale, children }: Readonly<{ locale: Locale; children: React.ReactNode }>) {
  const messages = getMessages(locale);
  return (
    <html lang={HTML_LANG[locale]} className={`${ibmPlexSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element -- the document head of a root layout, as before the move into this component */}
      <head>
        {/* Before React loads: survive browser page translation (see lib/translation-guard). */}
        <script dangerouslySetInnerHTML={{ __html: TRANSLATION_GUARD_SCRIPT }} />
        {/* Applies a pinned Light/Dark choice before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
          style={{ background: 'var(--posi-brand)', color: 'var(--posi-on-brand)' }}
        >
          {messages.common.skipToContent}
        </a>
        <LocaleProvider locale={locale} messages={clientMessages(messages)}>
          <SiteHeader />
          <main id="main-content" className="flex-1">{children}</main>
          <SiteFooter locale={locale} />
        </LocaleProvider>
      </body>
    </html>
  );
}
