import type { Metadata, Viewport } from "next";
import { PhoneShell } from "@/components/phone-shell";

export const metadata: Metadata = {
  title: "Homestead — Staff app",
  appleWebApp: { capable: true, title: "Homestead", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#1a3221",
};

export default function PhoneLayout({ children }: { children: React.ReactNode }) {
  return <PhoneShell>{children}</PhoneShell>;
}
