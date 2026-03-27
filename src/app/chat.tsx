"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatWindow } from "@/components/nova/ChatWindow";
import { OnboardingChat } from "@/components/nova/OnboardingChat";
import { useNovaChat, NovaMode } from "@/hooks/useNovaChat";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getOnboardingStatus } from "@/services/nova";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Fetch onboarding status from backend
  useEffect(() => {
    if (!user) return;
    getOnboardingStatus()
      .then((data) => setOnboardingCompleted(data.onboarding_completed ?? false))
      .catch(() => setOnboardingCompleted(false));
  }, [user]);

  const mode: NovaMode =
    loading || onboardingCompleted === null
      ? "ONBOARDING"
      : onboardingCompleted
      ? "COMPANION"
      : "ONBOARDING";

  const { messages, isLoading, isHistoryLoading, sendMessage, stopStreaming } =
    useNovaChat(mode);

  const redirectPendingRef = useRef(false);
  const pollingStartedRef = useRef(false);

  // Fire Nova's greeting only after auth + history both loaded and no prior messages
  useEffect(() => {
    if (loading || isHistoryLoading || onboardingCompleted === null) return;
    if (messages.length === 0 && !onboardingCompleted) {
      const timer = setTimeout(() => {
        sendMessage("__NOVA_INIT__");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, isHistoryLoading, onboardingCompleted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for onboarding completion every 5s
  useEffect(() => {
    if (loading || onboardingCompleted === null) return;
    if (onboardingCompleted || redirectPendingRef.current) return;
    if (pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    const interval = setInterval(async () => {
      try {
        const data = await getOnboardingStatus();
        if (data.onboarding_completed && !redirectPendingRef.current) {
          redirectPendingRef.current = true;
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          setTimeout(() => {
            router.push("/diagnostic");
          }, 3000);
        }
      } catch {
        // ignore poll errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loading, onboardingCompleted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (message: string) => {
    await sendMessage(message);
  };

  if (mode === "ONBOARDING") {
    return (
      <OnboardingChat
        messages={messages}
        isLoading={isLoading}
        onSend={handleSend}
        onStop={stopStreaming}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Nova</h1>
          <p className="text-xs text-muted-foreground">Your study companion</p>
        </div>
      </div>

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        mode={mode}
        onSend={handleSend}
        onStop={stopStreaming}
        showWelcome={messages.length === 0}
      />
    </div>
  );
}
