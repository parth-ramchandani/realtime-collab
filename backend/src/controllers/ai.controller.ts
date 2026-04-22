import { Request, Response } from "express";
import { SessionService } from "../services/session.service";
import { AiConfigurationError, AiService } from "../services/ai.service";

type AiFallbackReason = "insufficient_quota" | "rate_limit" | "timeout" | "upstream_error" | "config_error";

function inferFallbackReason(error: unknown): AiFallbackReason {
  const errorLike = error as { status?: number; code?: string; type?: string; message?: string };
  const status = errorLike?.status;
  const code = errorLike?.code ?? "";
  const type = errorLike?.type ?? "";
  const message = (errorLike?.message ?? "").toLowerCase();

  if (type === "insufficient_quota" || code === "insufficient_quota") return "insufficient_quota";
  if (status === 429 || type === "rate_limit_exceeded") return "rate_limit";
  if (message.includes("timeout") || code === "ETIMEDOUT") return "timeout";
  if (error instanceof AiConfigurationError) return "config_error";
  return "upstream_error";
}

export class AiController {
  static async summarizeSession(req: Request<{ id: string }>, res: Response): Promise<void> {
    const session = await SessionService.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ message: "Session not found." });
      return;
    }

    const messages = session.activity
      .filter((item) => item.type === "message_sent")
      .slice(-20)
      .map((item) => `${item.username}: ${item.content}`);

    try {
      const summary = await AiService.summarizeSession(session.editorContent, messages);
      res.status(200).json({ summary, source: "openai" });
    } catch (error) {
      const fallbackSummary = `Session snapshot: ${session.users.size} active users, ${messages.length} recent messages, and ${session.editorContent.length} editor characters.`;
      res.status(200).json({
        summary: fallbackSummary,
        source: "fallback",
        reason: inferFallbackReason(error)
      });
    }
  }

  static async suggestNextSentence(req: Request<{ id: string }>, res: Response): Promise<void> {
    const session = await SessionService.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ message: "Session not found." });
      return;
    }

    try {
      const suggestion = await AiService.suggestNextSentence(session.editorContent);
      res.status(200).json({ suggestion, source: "openai" });
    } catch (error) {
      const lastLine = session.editorContent.split("\n").filter(Boolean).pop() ?? "Let's wrap up the key discussion points";
      res.status(200).json({
        suggestion: `${lastLine}. Next, let's finalize owners and timelines.`,
        source: "fallback",
        reason: inferFallbackReason(error)
      });
    }
  }
}
