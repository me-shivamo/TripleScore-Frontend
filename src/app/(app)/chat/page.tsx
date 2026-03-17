"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatWindow } from "@/components/nova/ChatWindow";
import { OnboardingChat } from "@/components/nova/OnboardingChat";
import { useNovaChat } from "@/hooks/useNovaChat";
import { useQueryClient } from "@tanstack/react-query";

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const onboardingCompleted = session?.user.onboardingCompleted ?? false;
  const mode = onboardingCompleted ? "COMPANION" : "ONBOARDING";

  const { messages, isLoading, sendMessage, stopStreaming } = useNovaChat(mode);

  // Start with Nova's greeting for onboarding
  useEffect(() => {
    if (messages.length === 0 && !onboardingCompleted) {
      // Auto-trigger Nova's opening message
      const timer = setTimeout(() => {
        sendMessage("__NOVA_INIT__");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSend = async (message: string) => {
    await sendMessage(message);

    // After each message during onboarding, check if completed
    if (!onboardingCompleted) {
      queryClient.invalidateQueries({ queryKey: ["session"] });

      // Check if onboarding is now complete
      const res = await fetch("/api/nova/onboarding-status");
      if (res.ok) {
        const { completed } = await res.json();
        if (completed) {
          // Give time for final message to render, then redirect
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            router.push("/dashboard");
          }, 3000);
        }
      }
    }
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
