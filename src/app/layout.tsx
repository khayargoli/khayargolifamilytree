import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Khayargoli Family Tree",
    template: "%s | Khayargoli Family Tree",
  },
  description:
    "Explore the publicly shared history and relationships of the Khayargoli family.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50">
        <header className="border-b border-stone-200 bg-stone-50">
          <nav
            aria-label="Main navigation"
            className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-10"
          >
            <Link className="font-semibold tracking-tight text-stone-900" href="/">
              Khayargoli Family Tree
            </Link>
            <div className="flex gap-5 text-sm text-stone-600">
              <Link className="hover:text-stone-950" href="/tree">
                Tree
              </Link>
              <Link className="hover:text-stone-950" href="/people">
                People
              </Link>
              <Link className="hover:text-stone-950" href="/privacy">
                Privacy
              </Link>
              <Link className="font-medium text-stone-900" href="/login">
                Sign in
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
