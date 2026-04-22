import { nanoid } from "nanoid";
import { ActivityItem, SessionState, SessionUser } from "../types/session";
import { SessionModel } from "../models/session.model";
import { ActivityModel } from "../models/activity.model";
import mongoose from "mongoose";

const sessions = new Map<string, SessionState>();

const MAX_ACTIVITY_ITEMS = 200;

export class SessionService {
  static async createSession(): Promise<SessionState> {
    const session: SessionState = {
      id: nanoid(8),
      createdAt: Date.now(),
      users: new Map(),
      activity: [],
      editorContent: ""
    };

    sessions.set(session.id, session);
    if (mongoose.connection.readyState === 1) {
      await SessionModel.create({
        sessionId: session.id,
        createdAt: new Date(session.createdAt),
        editorContent: ""
      });
    }
    return session;
  }

  static async getSession(sessionId: string): Promise<SessionState | undefined> {
    const memorySession = sessions.get(sessionId);
    if (memorySession) return memorySession;

    if (mongoose.connection.readyState !== 1) return undefined;

    const storedSession = await SessionModel.findOne({ sessionId }).lean();
    if (!storedSession) return undefined;

    const storedActivity = await ActivityModel.find({ sessionId }).sort({ timestamp: 1 }).limit(MAX_ACTIVITY_ITEMS).lean();

    const hydrated: SessionState = {
      id: storedSession.sessionId,
      createdAt: storedSession.createdAt.getTime(),
      users: new Map(),
      editorContent: storedSession.editorContent,
      activity: storedActivity.map((item) => ({
        id: item.activityId,
        type: item.type,
        userId: item.userId,
        username: item.username,
        content: item.content,
        timestamp: item.timestamp
      }))
    };

    sessions.set(sessionId, hydrated);
    return hydrated;
  }

  static async addUser(sessionId: string, user: SessionUser): Promise<SessionState | undefined> {
    const session = sessions.get(sessionId);
    if (!session) return undefined;
    session.users.set(user.userId, user);
    return session;
  }

  static async removeUser(sessionId: string, userId: string): Promise<SessionState | undefined> {
    const session = sessions.get(sessionId);
    if (!session) return undefined;
    const existing = session.users.get(userId);
    if (existing) {
      session.users.set(userId, { ...existing, status: "offline" });
      session.users.delete(userId);
    }
    return session;
  }

  static async removeUserBySocketId(
    socketId: string
  ): Promise<{ sessionId: string; user: SessionUser } | undefined> {
    for (const [sessionId, session] of sessions.entries()) {
      for (const user of session.users.values()) {
        if (user.socketId === socketId) {
          session.users.delete(user.userId);
          return { sessionId, user };
        }
      }
    }
    return undefined;
  }

  static async updateEditorContent(sessionId: string, content: string): Promise<SessionState | undefined> {
    const session = sessions.get(sessionId);
    if (!session) return undefined;
    session.editorContent = content;
    if (mongoose.connection.readyState === 1) {
      await SessionModel.updateOne({ sessionId }, { $set: { editorContent: content } });
    }
    return session;
  }

  static async addActivity(sessionId: string, item: ActivityItem): Promise<SessionState | undefined> {
    const session = sessions.get(sessionId);
    if (!session) return undefined;
    session.activity.push(item);
    if (session.activity.length > MAX_ACTIVITY_ITEMS) {
      session.activity.splice(0, session.activity.length - MAX_ACTIVITY_ITEMS);
    }
    if (mongoose.connection.readyState === 1) {
      await ActivityModel.create({
        sessionId,
        activityId: item.id,
        type: item.type,
        userId: item.userId,
        username: item.username,
        content: item.content,
        timestamp: item.timestamp
      });
    }
    return session;
  }
}
