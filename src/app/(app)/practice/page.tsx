"use client";

import { useRouter } from "next/navigation";
import { PracticeSession } from "@/components/practice/PracticeSession";

export default function PracticePage() {
  const router = useRouter();

  return (
    <PracticeSession
      onPause={() => router.push("/dashboard")}
    />
  );
}
