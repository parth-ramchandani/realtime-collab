export interface ActivityItem {
  id: string;
  type: "user_joined" | "user_left" | "message_sent" | "editor_updated";
  userId: string;
  username: string;
  content: string;
  timestamp: number;
}

export interface SessionUser {
  userId: string;
  username: string;
  socketId: string;
  status: "online" | "offline";
}

export interface SessionState {
  id: string;
  createdAt: number;
  users: Map<string, SessionUser>;
  activity: ActivityItem[];
  editorContent: string;
}
