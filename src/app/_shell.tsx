"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { getOnboardingStatus } from "@/services/nova";

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getOnboardingStatus()
      .then((data) => setOnboardingCompleted(data.onboarding_completed ?? false))
      .catch(() => setOnboardingCompleted(false));
  }, [user]);

  // No shell on public/onboarding routes
  const isShellless =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/diagnostic" ||
    (pathname === "/chat" && onboardingCompleted === false);

  if (isShellless || loading || onboardingCompleted === null) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
