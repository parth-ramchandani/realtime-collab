import { Schema, model } from "mongoose";

interface ActivityDocument {
  sessionId: string;
  activityId: string;
  type: "user_joined" | "user_left" | "message_sent" | "editor_updated";
  userId: string;
  username: string;
  content: string;
  timestamp: number;
}

const activitySchema = new Schema<ActivityDocument>(
  {
    sessionId: { type: String, required: true, index: true },
    activityId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Number, required: true, index: true }
  },
  { versionKey: false }
);

export const ActivityModel = model<ActivityDocument>("Activity", activitySchema);
