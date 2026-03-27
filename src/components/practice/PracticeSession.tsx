"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Pause, SkipForward, ChevronRight, Loader2 } from "lucide-react";
import { PracticeQuestion } from "@/types/api";
import { getChaptersBySubject, getPracticeQuestions } from "@/services/practice";
import Image from "next/image";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics"];

const DIFFICULTY_STYLE = {
  EASY: "text-emerald-600 bg-emerald-50",
  MEDIUM: "text-amber-600 bg-amber-50",
  HARD: "text-red-600 bg-red-50",
};

type AnswerState = "idle" | "selected" | "confirmed";

interface PracticeSessionProps {
  onPause: () => void;
}

export function PracticeSession({ onPause }: PracticeSessionProps) {
  // Subject / chapter selection
  const [subject, setSubject] = useState("Physics");
  const [chapter, setChapter] = useState<string | null>(null);
  const [chapters, setChapters] = useState<string[]>([]);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [chapterOpen, setChapterOpen] = useState(false);

  // Question state
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [loadingQ, setLoadingQ] = useState(false);

  // Answer state
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [integerInput, setIntegerInput] = useState("");

  // Timer per question
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dropdown refs for click-outside
  const subjectRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLDivElement>(null);

  // ── Load chapters when subject changes ──────────────────────────────────────
  useEffect(() => {
    setChapter(null);
    setChapters([]);
    setQuestions([]);
    setQIndex(0);
    getChaptersBySubject(subject)
      .then((data) => setChapters(data.chapters))
      .catch(() => setChapters([]));
  }, [subject]);

  // ── Load questions when chapter is selected ──────────────────────────────────
  const loadQuestions = useCallback(async (subj: string, chap: string) => {
    setLoadingQ(true);
    try {
      const data = await getPracticeQuestions(subj, chap, 20);
      setQuestions(data.questions);
      setQIndex(0);
    } finally {
      setLoadingQ(false);
    }
  }, []);

  useEffect(() => {
    if (chapter) loadQuestions(subject, chapter);
  }, [chapter, subject, loadQuestions]);

  // ── Timer: reset on each new question ───────────────────────────────────────
  useEffect(() => {
    setElapsed(0);
    startRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qIndex, questions]);

  // ── Reset answer state on question change ───────────────────────────────────
  useEffect(() => {
    setAnswerState("idle");
    setSelectedOption(null);
    setIntegerInput("");
  }, [qIndex]);

  // ── Click outside to close dropdowns ────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (subjectRef.current && !subjectRef.current.contains(e.target as Node)) {
        setSubjectOpen(false);
      }
      if (chapterRef.current && !chapterRef.current.contains(e.target as Node)) {
        setChapterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Advance to next question (loads more if near end) ───────────────────────
  const advance = useCallback(() => {
    if (!chapter) return;
    if (qIndex + 1 >= questions.length) {
      // Load fresh batch and restart
      loadQuestions(subject, chapter);
    } else {
      setQIndex((i) => i + 1);
    }
  }, [qIndex, questions.length, subject, chapter, loadQuestions]);

  const handleSelect = (label: string) => {
    if (answerState !== "idle") return;
    setSelectedOption(label);
    setAnswerState("selected");
  };

  const handleNext = () => {
    if (answerState !== "selected" && answerState !== "idle") return;
    if (answerState === "idle" && current?.questionType !== "INTEGER") return;
    setAnswerState("confirmed");
    setTimeout(() => advance(), 250);
  };

  const handleSkip = () => {
    advance();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  const current = questions[qIndex];
  const isIntegerReady = current?.question_type === "INTEGER" && integerInput.trim() !== "";
  const canConfirm = answerState === "selected" || isIntegerReady;

  // ── Empty / loading states ───────────────────────────────────────────────────
  const showEmpty = !chapter;
  const showLoading = loadingQ;

  return (
    <div className="min-h-screen flex flex-col bg-[#fefefe]">

      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E5EA]">

        {/* Left: Subject + Chapter dropdowns */}
        <div className="flex items-center gap-2">

          {/* Subject dropdown */}
          <div ref={subjectRef} className="relative">
            <button
              onClick={() => { setSubjectOpen((v) => !v); setChapterOpen(false); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E2E5EA] bg-white text-sm font-medium text-[#1A1A1A] hover:border-[#2B7EFF] hover:text-[#2B7EFF] transition-colors"
            >
              {subject}
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", subjectOpen && "rotate-180")} />
            </button>
            {subjectOpen && (
              <div className="absolute top-full left-0 mt-1.5 bg-white border border-[#E2E5EA] rounded-2xl shadow-lg py-1.5 z-50 min-w-[140px]">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSubject(s); setSubjectOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors",
                      s === subject
                        ? "text-[#2B7EFF] font-medium bg-blue-50"
                        : "text-[#1A1A1A] hover:bg-[#f5f5f5]"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chapter dropdown */}
          <div ref={chapterRef} className="relative">
            <button
              onClick={() => { if (chapters.length) { setChapterOpen((v) => !v); setSubjectOpen(false); } }}
              disabled={chapters.length === 0}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-colors",
                chapters.length === 0
                  ? "border-[#E2E5EA] text-[#9CA3AF] cursor-not-allowed bg-white"
                  : chapter
                    ? "border-[#2B7EFF] text-[#2B7EFF] bg-blue-50 hover:bg-blue-100"
                    : "border-[#E2E5EA] bg-white text-[#6B7280] hover:border-[#2B7EFF] hover:text-[#2B7EFF]"
              )}
            >
              {chapter ?? "Select Chapter"}
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", chapterOpen && "rotate-180")} />
            </button>
            {chapterOpen && chapters.length > 0 && (
              <div className="absolute top-full left-0 mt-1.5 bg-white border border-[#E2E5EA] rounded-2xl shadow-lg py-1.5 z-50 min-w-[220px] max-h-64 overflow-y-auto">
                {chapters.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setChapter(c); setChapterOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors",
                      c === chapter
                        ? "text-[#2B7EFF] font-medium bg-blue-50"
                        : "text-[#1A1A1A] hover:bg-[#f5f5f5]"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Timer + Pause */}
        <div className="flex items-center gap-3">
          {current && (
            <span className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              DIFFICULTY_STYLE[current.difficulty]
            )}>
              {current.difficulty}
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E2E5EA] bg-white">
            <span className="text-sm font-mono text-[#1A1A1A] tabular-nums min-w-[32px] text-right">
              {formatTime(elapsed)}
            </span>
          </div>
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E2E5EA] bg-white text-sm font-medium text-[#6B7280] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">

        {/* No chapter selected */}
        {showEmpty && (
          <div className="text-center max-w-sm">
            <p className="text-2xl font-serif text-[#1A1A1A] mb-2">Pick a chapter to start</p>
            <p className="text-sm text-[#9CA3AF]">Select your subject and chapter above to begin solving questions.</p>
          </div>
        )}

        {/* Loading questions */}
        {showLoading && !showEmpty && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#2B7EFF]" />
            <p className="text-sm text-[#9CA3AF]">Loading questions...</p>
          </div>
        )}

        {/* Question */}
        {!showEmpty && !showLoading && current && (
          <div className="w-full max-w-2xl">

            {/* Topic label */}
            <p className="text-xs text-[#9CA3AF] mb-4 uppercase tracking-wide font-medium">
              {current.subject} · {current.chapter} · {current.topic}
            </p>

            {/* Question text */}
            <p className="text-[1.1rem] leading-relaxed text-[#1A1A1A] font-medium mb-6">
              {current.content}
            </p>

            {/* Optional question image */}
            {current.image_url && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-[#E2E5EA]">
                <Image
                  src={current.image_url}
                  alt="Question diagram"
                  width={640}
                  height={320}
                  className="w-full object-contain max-h-72"
                />
              </div>
            )}

            {/* MCQ options */}
            {current.question_type === "MCQ" && (
              <div className="space-y-3">
                {current.options.map((opt) => {
                  const isSelected = selectedOption === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSelect(opt.label)}
                      disabled={answerState === "confirmed"}
                      className={cn(
                        "w-full text-left flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all duration-150 text-sm",
                        answerState === "confirmed"
                          ? isSelected
                            ? "border-[#2B7EFF] bg-blue-50 opacity-60"
                            : "border-[#E2E5EA] bg-white opacity-40"
                          : isSelected
                            ? "border-[#2B7EFF] bg-blue-50 shadow-sm"
                            : "border-[#E2E5EA] bg-white hover:border-[#2B7EFF]/50 hover:bg-[#fafbff]"
                      )}
                    >
                      <span className={cn(
                        "shrink-0 w-7 h-7 rounded-full border text-xs font-semibold flex items-center justify-center mt-0.5",
                        isSelected
                          ? "border-[#2B7EFF] bg-[#2B7EFF] text-white"
                          : "border-[#E2E5EA] text-[#9CA3AF]"
                      )}>
                        {opt.label}
                      </span>
                      <span className="leading-relaxed text-[#1A1A1A]">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Integer input */}
            {current.question_type === "INTEGER" && (
              <div className="space-y-2">
                <label className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium">
                  Enter integer answer
                </label>
                <input
                  type="number"
                  value={integerInput}
                  onChange={(e) => {
                    setIntegerInput(e.target.value);
                    if (e.target.value.trim()) setAnswerState("selected");
                    else setAnswerState("idle");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" && isIntegerReady) handleNext(); }}
                  placeholder="Type your answer..."
                  className="w-full border border-[#E2E5EA] rounded-2xl px-5 py-4 text-lg font-mono text-[#1A1A1A] bg-white focus:outline-none focus:border-[#2B7EFF] transition-colors placeholder:text-[#9CA3AF]"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Actions ────────────────────────────────────────────────────── */}
      {!showEmpty && !showLoading && current && (
        <div className="px-6 pb-8 pt-4 border-t border-[#E2E5EA]">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={handleSkip}
              disabled={answerState === "confirmed"}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-[#E2E5EA] text-sm font-medium text-[#6B7280] hover:border-[#1A1A1A] hover:text-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={!canConfirm || answerState === "confirmed"}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-150",
                canConfirm && answerState !== "confirmed"
                  ? "bg-[#1A1A1A] text-white hover:bg-[#2B7EFF] shadow-sm active:scale-95"
                  : "bg-[#E2E5EA] text-[#9CA3AF] cursor-not-allowed"
              )}
            >
              {answerState === "confirmed" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
