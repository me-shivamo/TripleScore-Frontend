"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { login } from "@/services/auth";
import { getOnboardingStatus } from "@/services/nova";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  // Redirect if already authenticated — fetch onboarding status from backend
  useEffect(() => {
    if (loading || !user) return;
    getOnboardingStatus()
      .then((data) => {
        if (data.onboarding_completed) {
          router.push("/dashboard");
        } else {
          router.push("/chat");
        }
      })
      .catch(() => router.push("/dashboard"));
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      // Ensure backend creates/updates the user record
      await login();

      toast.success("Welcome to TripleScore!");
      // Redirect handled by the useEffect above (user state changes)
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message ?? "Sign in failed. Please try again.");
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-row items-stretch overflow-hidden relative">
      {/* Background blob — decorative upper-right */}
      <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full bg-blue-50 blur-3xl opacity-60 pointer-events-none z-0" />

      {/* LEFT COLUMN */}
      <div className="flex flex-col justify-center pl-12 sm:pl-16 pr-8 py-16 w-full lg:w-[55%] relative z-10 gap-6">
        {/* Wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="text-sm font-semibold tracking-wide text-foreground">TripleScore</span>
        </div>

        {/* Badge */}
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          AI-Powered JEE Prep
        </span>

        {/* Headline */}
        <h1
          style={{ fontFamily: "'Projekt Blackbird', sans-serif" }}
          className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight tracking-tight text-black text-left animate-fade-in"
        >
          Most Students Study.{" "}
          <span className="block">Few Learn to Perform.</span>
          <span className="block">Be the Few.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base text-muted-foreground max-w-sm leading-relaxed">
          Less guessing, more preparing. Built for students who want real results.
        </p>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3">
          <div className="glass classic-shadow rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-amber-500 text-sm">★</span>
            <span className="text-xs font-medium text-foreground">XP-based learning</span>
          </div>
          <div className="glass classic-shadow rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-emerald-500 text-sm">↑</span>
            <span className="text-xs font-medium text-foreground">Score tracking</span>
          </div>
          <div className="glass classic-shadow rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-blue-500 text-sm">⚡</span>
            <span className="text-xs font-medium text-foreground">Daily missions</span>
          </div>
        </div>

        {/* Google Sign-in Button */}
        <Button
          variant="gradient"
          size="lg"
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="rounded-full animate-pulse-glow w-fit"
        >
          {signingIn ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Get started
            </>
          )}
        </Button>
      </div>

      {/* RIGHT COLUMN — desktop only */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center">
        {/* Soft background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full gradient-blue opacity-[0.06] blur-[80px]" />
        </div>

        {/* Card 1 — Readiness Score */}
        <div className="glass classic-shadow-md rounded-2xl p-5 w-64 absolute top-[20%] right-[15%] rotate-2 animate-fade-in-delay-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Readiness Score</p>
          <p className="text-4xl font-bold text-foreground">
            74<span className="text-lg text-muted-foreground">/100</span>
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full gradient-blue w-[74%]" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Physics needs attention</p>
        </div>

        {/* Card 2 — Streak */}
        <div className="glass classic-shadow-md rounded-2xl p-4 w-48 absolute top-[42%] right-[30%] -rotate-1 animate-fade-in-delay-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-lg font-bold text-foreground">12 days</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Current streak</p>
            </div>
          </div>
        </div>

        {/* Card 3 — XP */}
        <div className="glass classic-shadow rounded-2xl p-3 w-40 absolute top-[60%] right-[18%] rotate-1 animate-fade-in-delay-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <span className="text-amber-600 text-xs font-bold">XP</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">+340 today</p>
              <p className="text-[10px] text-muted-foreground">Keep going!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
