import { AppShell } from "@/components/app-shell";

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
