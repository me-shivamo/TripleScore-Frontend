import { apiFetch } from "@/lib/api-client";
import {
  PracticeQuestionsResponse,
  ChaptersResponse,
  PracticeAttempt,
  PracticeSubmitResponse,
} from "@/types/api";

export async function getChaptersBySubject(subject: string): Promise<ChaptersResponse> {
  const res = await apiFetch(`/practice/chapters?subject=${encodeURIComponent(subject)}`);
  if (!res.ok) throw new Error("Failed to load chapters");
  return res.json();
}

export async function getPracticeQuestions(
  subject: string,
  chapter: string,
  count: number = 10
): Promise<PracticeQuestionsResponse> {
  const res = await apiFetch("/practice/questions", {
    method: "POST",
    body: JSON.stringify({ subject, chapter, count }),
  });
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json();
}

export async function submitPracticeAttempts(
  sessionId: string,
  attempts: PracticeAttempt[]
): Promise<PracticeSubmitResponse> {
  const res = await apiFetch("/practice/submit", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, attempts }),
  });
  if (!res.ok) throw new Error("Failed to submit practice session");
  return res.json();
}
