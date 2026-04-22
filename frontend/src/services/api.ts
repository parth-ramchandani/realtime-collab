export interface JoinResponse {
  sessionId: string;
  userId: string;
  username: string;
  editorContent: string;
  users: Array<{ userId: string; username: string; status: "online" | "offline" }>;
  activity: Array<{ id: string; type: string; username: string; content: string; timestamp: number }>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
type AiSource = "openai" | "fallback";
type AiReason = "insufficient_quota" | "rate_limit" | "timeout" | "upstream_error" | "config_error";

export async function createSession(): Promise<{ sessionId: string }> {
  const response = await fetch(`${API_BASE}/session/create`, { method: "POST" });
  if (!response.ok) throw new Error("Could not create session");
  return response.json();
}

export async function joinSession(sessionId: string, username: string): Promise<JoinResponse> {
  const response = await fetch(`${API_BASE}/session/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, username })
  });
  if (!response.ok) throw new Error("Session not found or invalid details.");
  return response.json();
}

export async function validateSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/session/${sessionId}`);
  if (!response.ok) {
    throw new Error("Session not found.");
  }
}

export async function summarizeSession(
  sessionId: string
): Promise<{ summary: string; source: AiSource; reason?: AiReason }> {
  const response = await fetch(`${API_BASE}/ai/session/${sessionId}/summarize`, { method: "POST" });
  if (!response.ok) throw new Error("Summary unavailable");
  return (await response.json()) as { summary: string; source: AiSource; reason?: AiReason };
}

export async function suggestNextSentence(
  sessionId: string
): Promise<{ suggestion: string; source: AiSource; reason?: AiReason }> {
  const response = await fetch(`${API_BASE}/ai/session/${sessionId}/suggest`, { method: "POST" });
  if (!response.ok) throw new Error("Suggestion unavailable");
  return (await response.json()) as { suggestion: string; source: AiSource; reason?: AiReason };
}
