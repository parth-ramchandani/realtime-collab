import { Request, Response } from "express";
import { nanoid } from "nanoid";
import { SessionService } from "../services/session.service";

interface JoinSessionBody {
  sessionId?: string;
  username?: string;
}

export class SessionController {
  static async createSession(_req: Request, res: Response): Promise<void> {
    try {
      const session = await SessionService.createSession();
      res.status(201).json({
        sessionId: session.id,
        createdAt: session.createdAt
      });
    } catch {
      res.status(500).json({ message: "Failed to create session." });
    }
  }

  static async joinSession(req: Request<{}, {}, JoinSessionBody>, res: Response): Promise<void> {
    try {
      const { sessionId, username } = req.body;
      if (!sessionId || !username) {
        res.status(400).json({ message: "sessionId and username are required." });
        return;
      }

      const session = await SessionService.getSession(sessionId);
      if (!session) {
        res.status(404).json({ message: "Session not found." });
        return;
      }

      const userId = nanoid(10);
      res.status(200).json({
        sessionId: session.id,
        userId,
        username,
        editorContent: session.editorContent,
        activity: session.activity,
        users: [...session.users.values()]
      });
    } catch {
      res.status(500).json({ message: "Failed to join session." });
    }
  }

  static async getSession(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const session = await SessionService.getSession(req.params.id);
      if (!session) {
        res.status(404).json({ message: "Session not found." });
        return;
      }

      res.status(200).json({
        sessionId: session.id,
        createdAt: session.createdAt,
        editorContent: session.editorContent,
        users: [...session.users.values()],
        activity: session.activity
      });
    } catch {
      res.status(500).json({ message: "Failed to load session." });
    }
  }
}
