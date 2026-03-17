"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Square } from "lucide-react";
import { NovaAvatar } from "./NovaAvatar";
import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/useNovaChat";

interface OnboardingChatProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
}

export function OnboardingChat({
  messages,
  isLoading,
  onSend,
  onStop,
}: OnboardingChatProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lastNovaMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  const currentStep = messages.filter((m) => m.role === "user").length;

  // Welcome state: no messages yet, or first assistant message still empty/streaming
  const isWelcome =
    messages.length === 0 ||
    (messages.length === 1 &&
      messages[0].role === "assistant" &&
      !messages[0].content);

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between px-6 py-12 overflow-hidden">
      {/* TOP SECTION — Nova's message or welcome */}
      <div className="flex flex-col items-center gap-8 max-w-lg w-full text-center mt-[8vh]">
        {isWelcome ? (
          /* Welcome state */
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <NovaAvatar size="lg" isThinking />
            <div>
              <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                Welcome to TripleScore
              </h1>
              <p className="text-muted-foreground mt-2 text-base">
                Nova is getting ready for you...
              </p>
            </div>
            <div className="flex gap-1.5">
              <span
                className="w-2 h-2 rounded-full bg-primary animate-typing-dot"
                style={{ animationDelay: "0s" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-primary animate-typing-dot"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-primary animate-typing-dot"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          </div>
        ) : (
          /* Nova's current question */
          <>
            <NovaAvatar size="lg" isThinking={isLoading} />

            <div
              key={lastNovaMessage?.id}
              className="animate-fade-in"
            >
              <p className="text-2xl font-medium text-foreground leading-relaxed tracking-tight">
                {lastNovaMessage?.isStreaming && !lastNovaMessage?.content ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-typing-dot" style={{ animationDelay: "0s" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-typing-dot" style={{ animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-typing-dot" style={{ animationDelay: "0.4s" }} />
                  </span>
                ) : (
                  lastNovaMessage?.content
                )}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    step <= currentStep
                      ? "bg-primary w-4"
                      : "bg-secondary w-2"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* BOTTOM SECTION — Input */}
      {!isWelcome && (
        <div className="w-full max-w-lg mb-[6vh]">
          {/* Echo of user's last reply */}
          {lastUserMessage && (
            <p
              key={lastUserMessage.id}
              className="text-sm text-muted-foreground text-center mb-4 animate-fade-in"
            >
              You: {lastUserMessage.content}
            </p>
          )}

          {/* Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="Type your answer..."
              disabled={isLoading}
              rows={1}
              className={cn(
                "w-full rounded-2xl border border-input bg-white px-5 py-4 text-base",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                "resize-none min-h-[60px] max-h-40 classic-shadow-md pr-16 transition-colors",
                isLoading && "opacity-60 cursor-not-allowed"
              )}
            />
            {isLoading ? (
              <Button
                onClick={onStop}
                variant="outline"
                size="icon"
                className="absolute right-3 bottom-3 rounded-xl h-10 w-10"
              >
                <Square className="w-4 h-4 fill-current" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!value.trim()}
                variant="gradient"
                size="icon"
                className="absolute right-3 bottom-3 rounded-xl h-10 w-10"
              >
                <SendHorizonal className="w-4 h-4" />
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-3">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
