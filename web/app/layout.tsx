import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Care Center — Demo",
  description: "Simple check-in and room board demo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <StoreProvider>
          <header className="border-b border-stone-300/70 bg-[#fbf8f1]">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
              <Link href="/" className="text-sm font-medium tracking-tight">
                Care Center
              </Link>
              <nav className="flex gap-4 text-sm text-stone-600">
                <Link href="/check-in" className="hover:text-stone-900">
                  Check in
                </Link>
                <Link href="/board" className="hover:text-stone-900">
                  Room board
                </Link>
                <Link href="/calendar" className="hover:text-stone-900">
                  Calendar
                </Link>
              </nav>
            </div>
          </header>
          <p className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-950">
            Demo only. Fake names. Nothing is stored on a real server — this is
            to see if the idea fits.
          </p>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            {children}
          </main>
        </StoreProvider>
      </body>
    </html>
  );
}
