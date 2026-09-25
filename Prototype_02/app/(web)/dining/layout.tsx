"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBase } from "@/lib/surface";

export default function DiningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = useBase();
  return (
    <div>
      {pathname !== `${base}/dining` ? (
        <Link
          href={`${base}/dining`}
          className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-teal-700 hover:text-teal-900"
        >
          <i className="fas fa-arrow-left" aria-hidden />
          Back to dining
        </Link>
      ) : null}
      {children}
    </div>
  );
}
