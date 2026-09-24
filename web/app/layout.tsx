import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Homestead — Operations demo",
  description:
    "Housekeeping and dining prototype. Room numbers only. No names.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full bg-slate-50 antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 pb-28 font-sans text-slate-800 md:pb-12">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
