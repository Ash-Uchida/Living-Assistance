"use client";

import { use } from "react";
import { ResidentLens } from "@/components/resident-lens";

export default function ResidentRoomPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);
  return <ResidentLens room={number} />;
}
