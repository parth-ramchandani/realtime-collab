import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { joinSession, suggestNextSentence, summarizeSession } from "../services/api";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { socket } from "../services/socket";

interface RoomUser {
  userId: string;
  username: string;
  status: "online" | "offline";
}

interface Activity {
  id: string;
  type: string;
  username: string;
  content: string;
  timestamp: number;
}

export function RoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId = "" } = useParams();
  const username: string = location.state?.username ?? "";
  const [userId, setUserId] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState<"" | "summary" | "suggestion">("");
  const [aiNotice, setAiNotice] = useState("");
  const [aiSummarySource, setAiSummarySource] = useState<"openai" | "fallback" | "">("");
  const [aiSuggestionSource, setAiSuggestionSource] = useState<"openai" | "fallback" | "">("");
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sessionId || !username) {
      navigate("/");
      return;
    }

    let currentUserId = "";
    (async () => {
      const data = await joinSession(sessionId, username);
      currentUserId = data.userId;
      setUserId(data.userId);
      setEditorContent(data.editorContent);
      setUsers(data.users);
      setActivity(data.activity);

      if (!socket.connected) socket.connect();
      socket.emit("join_session", { sessionId, userId: data.userId, username });
    })().catch(() =>
      navigate("/", {
        state: {
          error: "Session not found. Please check the ID and try again.",
          username,
          sessionId
        }
      })
    );

    const onPresenceUpdated = (incomingUsers: RoomUser[]) => setUsers(incomingUsers);
    const onActivityUpdated = (incomingActivity: Activity[]) => setActivity(incomingActivity);
    const onEditorState = (payload: { content: string }) => setEditorContent(payload.content);

    socket.on("presence_updated", onPresenceUpdated);
    socket.on("activity_updated", onActivityUpdated);
    socket.on("editor_state", onEditorState);

    return () => {
      if (currentUserId) {
        socket.emit("leave_session", { sessionId, userId: currentUserId, username });
      }
      socket.off("presence_updated", onPresenceUpdated);
      socket.off("activity_updated", onActivityUpdated);
      socket.off("editor_state", onEditorState);
    };
  }, [sessionId, username, navigate]);

  const debouncedEditorSync = useDebouncedCallback((content: string) => {
    if (!userId) return;
    socket.emit("editor_update", { sessionId, userId, username, content });
  }, 200);

  const onEditorChange = (next: string) => {
    setEditorContent(next);
    debouncedEditorSync(next);
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !userId) return;
    socket.emit("send_message", { sessionId, userId, username, message: chatInput.trim() });
    setChatInput("");
  };

  const onlineCount = useMemo(() => users.filter((user) => user.status === "online").length, [users]);

  const handleSummarize = async () => {
    if (!sessionId) return;
    setAiLoading("summary");
    try {
      const result = await summarizeSession(sessionId);
      setAiSummary(result.summary);
      setAiSummarySource(result.source);
      setAiNotice(result.source === "fallback" ? "AI provider unavailable, showing fallback response." : "");
    } finally {
      setAiLoading("");
    }
  };

  const handleSuggest = async () => {
    if (!sessionId) return;
    setAiLoading("suggestion");
    try {
      const result = await suggestNextSentence(sessionId);
      setAiSuggestion(result.suggestion);
      setAiSuggestionSource(result.source);
      setAiNotice(result.source === "fallback" ? "AI provider unavailable, showing fallback response." : "");
    } finally {
      setAiLoading("");
    }
  };

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [activity]);

  return (
    <main className="room">
      <header className="roomHeader">
        <div>
          <h2>Session: {sessionId}</h2>
          <p className="muted">You are collaborating as {username}</p>
        </div>
        <p className="pill">{onlineCount} online</p>
      </header>
      <section className="grid">
        <article className="panel">
          <h3>Shared Editor</h3>
          <textarea
            value={editorContent}
            onChange={(e) => onEditorChange(e.target.value)}
            placeholder="Type together here..."
            rows={18}
          />
          <div className="row editorActions">
            <button type="button" className="ghost" onClick={handleSuggest} disabled={aiLoading !== ""}>
              {aiLoading === "suggestion" ? "Thinking..." : "Suggest next sentence"}
            </button>
          </div>
          {aiSuggestionSource ? (
            <p className={`aiBadge ${aiSuggestionSource === "fallback" ? "fallback" : "openai"}`}>
              {aiSuggestionSource === "fallback" ? "Fallback" : "OpenAI"}
            </p>
          ) : null}
          {aiSuggestion ? <p className="muted">{aiSuggestion}</p> : null}
        </article>
        <aside className="panel">
          <h3>Active Users</h3>
          <ul className="userList">
            {users.map((user) => (
              <li key={user.userId} className="userItem">
                <span>{user.username}</span> <span className="muted">({user.status})</span>
              </li>
            ))}
          </ul>
        </aside>
        <article className="panel fullWidth">
          <h3>Activity Feed</h3>
          {aiNotice ? <p className="muted">{aiNotice}</p> : null}
          <div className="feed" ref={feedRef}>
            {activity.slice(-20).map((item) => (
              <p key={item.id}>
                <strong>{item.username}</strong> {item.content}{" "}
                <span className="muted">{new Date(item.timestamp).toLocaleTimeString()}</span>
              </p>
            ))}
          </div>
          <div className="row">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? sendMessage() : null)}
              placeholder="Send a quick message..."
            />
            <button onClick={sendMessage}>Send</button>
            <button type="button" className="ghost" onClick={handleSummarize} disabled={aiLoading !== ""}>
              {aiLoading === "summary" ? "Summarizing..." : "Summarize session"}
            </button>
          </div>
          {aiSummarySource ? (
            <p className={`aiBadge ${aiSummarySource === "fallback" ? "fallback" : "openai"}`}>
              {aiSummarySource === "fallback" ? "Fallback" : "OpenAI"}
            </p>
          ) : null}
          {aiSummary ? <p>{aiSummary}</p> : null}
        </article>
      </section>
    </main>
  );
}
