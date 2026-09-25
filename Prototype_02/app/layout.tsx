import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Homestead — Operations",
  description: "Manager website and staff phone app. Room numbers only. No names.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} h-full bg-cream antialiased`}>
      <body className="min-h-full bg-cream font-sans text-slate-800">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
