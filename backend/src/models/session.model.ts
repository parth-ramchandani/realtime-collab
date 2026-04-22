import { Schema, model } from "mongoose";

interface SessionDocument {
  sessionId: string;
  createdAt: Date;
  editorContent: string;
}

const sessionSchema = new Schema<SessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    createdAt: { type: Date, required: true },
    editorContent: { type: String, default: "" }
  },
  { versionKey: false }
);

export const SessionModel = model<SessionDocument>("Session", sessionSchema);
