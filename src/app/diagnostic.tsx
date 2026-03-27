"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SummaryCard } from "@/components/diagnostic/SummaryCard";
import { ChapterSelector } from "@/components/diagnostic/ChapterSelector";
import { QuizScreen, QuestionResult, DiagnosticQuestion } from "@/components/diagnostic/QuizScreen";
import { TestResults } from "@/components/diagnostic/TestResults";
import { FinalSummary } from "@/components/diagnostic/FinalSummary";
import {
  startDiagnostic,
  getQuestions,
  submitDiagnostic,
  skipDiagnostic,
} from "@/services/diagnostic";
import { DiagnosticStartResponse, SubmitResult } from "@/types/api";

// Map API snake_case question to component camelCase shape
function toComponentQuestion(q: import("@/types/api").DiagnosticQuestion): DiagnosticQuestion {
  return {
    id: q.id,
    subject: q.subject,
    chapter: q.chapter,
    topic: q.topic,
    content: q.content,
    questionType: q.question_type as "MCQ" | "INTEGER",
    options: q.options,
    difficulty: q.difficulty as "EASY" | "MEDIUM" | "HARD",
  };
}

// Map component QuestionResult (camelCase) to API SubmitAttempt (snake_case)
function toSubmitAttempts(results: QuestionResult[]) {
  return results.map((r) => ({
    question_id: r.questionId,
    selected_option: r.selectedOption,
    time_taken_secs: r.timeTakenSecs,
  }));
}

// Map API ProfileInfo (snake_case) to SummaryCard's ProfileData (camelCase)
function toProfileData(p: import("@/types/api").ProfileInfo | null) {
  if (!p) return {};
  return {
    name: p.name,
    examAttemptDate: p.exam_attempt_date,
    strongSubjects: p.strong_subjects,
    weakSubjects: p.weak_subjects,
    previousScore: p.previous_score,
    dailyStudyHours: p.daily_study_hours,
  };
}

type Screen =
  | "loading"
  | "summary"
  | "test1-select"
  | "test1-quiz"
  | "test1-results"
  | "test2-select"
  | "test2-quiz"
  | "final-results";

export default function DiagnosticPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("loading");
  const [startData, setStartData] = useState<DiagnosticStartResponse | null>(null);

  // Test 1 state
  const [test1Subject, setTest1Subject] = useState("");
  const [test1Chapter, setTest1Chapter] = useState("");
  const [test1Questions, setTest1Questions] = useState<DiagnosticQuestion[]>([]);
  const [test1Result, setTest1Result] = useState<SubmitResult | null>(null);

  // Test 2 state
  const [test2Subject, setTest2Subject] = useState("");
  const [test2Chapter, setTest2Chapter] = useState("");
  const [test2Questions, setTest2Questions] = useState<DiagnosticQuestion[]>([]);
  const [test2Result, setTest2Result] = useState<SubmitResult | null>(null);

  const [isSkipping, setIsSkipping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load diagnostic session on mount
  useEffect(() => {
    startDiagnostic()
      .then((data) => {
        if (data.already_done) {
          router.replace("/dashboard");
          return;
        }
        setStartData(data);
        setScreen("summary");

        if (data.strong_suggestion) {
          setTest1Subject(data.strong_suggestion.subject);
          setTest1Chapter(data.strong_suggestion.chapter);
        }
        if (data.weak_suggestion) {
          setTest2Subject(data.weak_suggestion.subject);
          setTest2Chapter(data.weak_suggestion.chapter);
        }
      })
      .catch(() => router.replace("/dashboard"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkip = async () => {
    setIsSkipping(true);
    await skipDiagnostic();
    router.push("/dashboard");
  };

  const loadQuestions = async (subject: string, chapter: string) => {
    const data = await getQuestions(subject, chapter, 12);
    return data.questions.map(toComponentQuestion);
  };

  // ── Test 1 ──────────────────────────────────────────────────────────────────

  const handleTest1ChapterConfirm = async (subject: string, chapter: string) => {
    setTest1Subject(subject);
    setTest1Chapter(chapter);
    const qs = await loadQuestions(subject, chapter);
    setTest1Questions(qs);
    setScreen("test1-quiz");
  };

  const handleTest1Complete = async (results: QuestionResult[]) => {
    setIsSubmitting(true);
    const data = await submitDiagnostic(1, test1Subject, test1Chapter, toSubmitAttempts(results));
    setTest1Result(data);
    setIsSubmitting(false);
    setScreen("test1-results");
  };

  // ── Test 2 ──────────────────────────────────────────────────────────────────

  const handleTest2ChapterConfirm = async (subject: string, chapter: string) => {
    setTest2Subject(subject);
    setTest2Chapter(chapter);
    const qs = await loadQuestions(subject, chapter);
    setTest2Questions(qs);
    setScreen("test2-quiz");
  };

  const handleTest2Complete = async (results: QuestionResult[]) => {
    setIsSubmitting(true);
    const data = await submitDiagnostic(2, test2Subject, test2Chapter, toSubmitAttempts(results));
    setTest2Result(data);
    setIsSubmitting(false);
    setScreen("final-results");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (screen === "loading" || !startData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Setting up your diagnostic...</p>
        </div>
      </div>
    );
  }

  if (screen === "summary") {
    return (
      <SummaryCard
        profile={toProfileData(startData.profile)}
        onStart={() => setScreen("test1-select")}
        onSkip={handleSkip}
        isSkipping={isSkipping}
      />
    );
  }

  if (screen === "test1-select") {
    if (!startData.strong_suggestion) {
      setScreen("test2-select");
      return null;
    }
    return (
      <ChapterSelector
        testNumber={1}
        suggestedSubject={startData.strong_suggestion.subject}
        suggestedChapter={startData.strong_suggestion.chapter}
        availableChapters={
          (startData.chapters_by_subject ?? {})[startData.strong_suggestion.subject] ?? []
        }
        onConfirm={handleTest1ChapterConfirm}
      />
    );
  }

  if (screen === "test1-quiz") {
    return (
      <QuizScreen
        questions={test1Questions}
        subject={test1Subject}
        chapter={test1Chapter}
        onComplete={handleTest1Complete}
      />
    );
  }

  if (screen === "test1-results" && test1Result) {
    return (
      <TestResults
        testNumber={1}
        subject={test1Subject}
        chapter={test1Chapter}
        correctCount={test1Result.score.correct}
        totalCount={test1Result.score.total}
        masteryScore={test1Result.mastery_score}
        onContinue={() =>
          startData.weak_suggestion
            ? setScreen("test2-select")
            : setScreen("final-results")
        }
        onSkip={handleSkip}
        continueLabel={
          startData.weak_suggestion
            ? "Test My Weak Area"
            : "Go to Dashboard"
        }
        isLoading={isSubmitting}
      />
    );
  }

  if (screen === "test2-select") {
    if (!startData.weak_suggestion) {
      router.push("/dashboard");
      return null;
    }
    return (
      <ChapterSelector
        testNumber={2}
        suggestedSubject={startData.weak_suggestion.subject}
        suggestedChapter={startData.weak_suggestion.chapter}
        availableChapters={
          (startData.chapters_by_subject ?? {})[startData.weak_suggestion.subject] ?? []
        }
        onConfirm={handleTest2ChapterConfirm}
      />
    );
  }

  if (screen === "test2-quiz") {
    return (
      <QuizScreen
        questions={test2Questions}
        subject={test2Subject}
        chapter={test2Chapter}
        onComplete={handleTest2Complete}
      />
    );
  }

  if (screen === "final-results" && test1Result) {
    return (
      <FinalSummary
        test1={{
          subject: test1Subject,
          chapter: test1Chapter,
          masteryScore: test1Result.mastery_score,
          correctCount: test1Result.score.correct,
          totalCount: test1Result.score.total,
        }}
        test2={
          test2Result
            ? {
                subject: test2Subject,
                chapter: test2Chapter,
                masteryScore: test2Result.mastery_score,
                correctCount: test2Result.score.correct,
                totalCount: test2Result.score.total,
              }
            : {
                subject: test1Subject,
                chapter: test1Chapter,
                masteryScore: test1Result.mastery_score,
                correctCount: test1Result.score.correct,
                totalCount: test1Result.score.total,
              }
        }
        onDashboard={() => router.push("/dashboard")}
      />
    );
  }

  router.push("/dashboard");
  return null;
}
