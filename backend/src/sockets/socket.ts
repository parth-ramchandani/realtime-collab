import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { SessionService } from "../services/session.service";
import { env } from "../utils/env";

interface JoinSessionPayload {
  sessionId: string;
  userId: string;
  username: string;
}

interface MessagePayload {
  sessionId: string;
  userId: string;
  username: string;
  message: string;
}

interface EditorUpdatePayload {
  sessionId: string;
  userId: string;
  username: string;
  content: string;
}

export function registerSocketHandlers(io: Server): void {
  const lastEditorActivityAt = new Map<string, number>();
  const lastEditorContent = new Map<string, string>();

  io.on("connection", (socket) => {
    socket.on("join_session", async (payload: JoinSessionPayload) => {
      const session = await SessionService.getSession(payload.sessionId);
      if (!session) {
        socket.emit("error_event", { message: "Session not found." });
        return;
      }

      socket.join(payload.sessionId);
      await SessionService.addUser(payload.sessionId, {
        userId: payload.userId,
        username: payload.username,
        socketId: socket.id,
        status: "online"
      });

      await SessionService.addActivity(payload.sessionId, {
        id: nanoid(),
        type: "user_joined",
        userId: payload.userId,
        username: payload.username,
        content: `${payload.username} joined the room`,
        timestamp: Date.now()
      });

      const updated = await SessionService.getSession(payload.sessionId);
      io.to(payload.sessionId).emit("presence_updated", [...(updated?.users.values() ?? [])]);
      io.to(payload.sessionId).emit("activity_updated", updated?.activity ?? []);
      socket.emit("editor_state", { content: updated?.editorContent ?? "" });
    });

    socket.on("send_message", async (payload: MessagePayload) => {
      await SessionService.addActivity(payload.sessionId, {
        id: nanoid(),
        type: "message_sent",
        userId: payload.userId,
        username: payload.username,
        content: payload.message,
        timestamp: Date.now()
      });
      const session = await SessionService.getSession(payload.sessionId);
      io.to(payload.sessionId).emit("activity_updated", session?.activity ?? []);
    });

    socket.on("editor_update", async (payload: EditorUpdatePayload) => {
      const previousContent = lastEditorContent.get(payload.sessionId);
      if (previousContent === payload.content) {
        return;
      }

      await SessionService.updateEditorContent(payload.sessionId, payload.content);
      lastEditorContent.set(payload.sessionId, payload.content);

      const now = Date.now();
      const lastLogAt = lastEditorActivityAt.get(payload.sessionId) ?? 0;
      if (now - lastLogAt >= env.editorActivityMinIntervalMs) {
        await SessionService.addActivity(payload.sessionId, {
          id: nanoid(),
          type: "editor_updated",
          userId: payload.userId,
          username: payload.username,
          content: "updated the shared editor",
          timestamp: now
        });
        lastEditorActivityAt.set(payload.sessionId, now);
      }
      socket.to(payload.sessionId).emit("editor_state", { content: payload.content });
    });

    socket.on("leave_session", async (payload: JoinSessionPayload) => {
      socket.leave(payload.sessionId);
      await SessionService.removeUser(payload.sessionId, payload.userId);
      await SessionService.addActivity(payload.sessionId, {
        id: nanoid(),
        type: "user_left",
        userId: payload.userId,
        username: payload.username,
        content: `${payload.username} left the room`,
        timestamp: Date.now()
      });
      const updated = await SessionService.getSession(payload.sessionId);
      io.to(payload.sessionId).emit("presence_updated", [...(updated?.users.values() ?? [])]);
      io.to(payload.sessionId).emit("activity_updated", updated?.activity ?? []);
    });

    socket.on("disconnect", async () => {
      const removed = await SessionService.removeUserBySocketId(socket.id);
      if (!removed) return;

      await SessionService.addActivity(removed.sessionId, {
        id: nanoid(),
        type: "user_left",
        userId: removed.user.userId,
        username: removed.user.username,
        content: `${removed.user.username} left the room`,
        timestamp: Date.now()
      });

      const updated = await SessionService.getSession(removed.sessionId);
      io.to(removed.sessionId).emit("presence_updated", [...(updated?.users.values() ?? [])]);
      io.to(removed.sessionId).emit("activity_updated", updated?.activity ?? []);
    });
  });
}
