import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createSession, validateSession } from "../services/api";

interface HomeLocationState {
  error?: string;
  username?: string;
  sessionId?: string;
}

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as HomeLocationState | null) ?? null;
  const [username, setUsername] = useState(locationState?.username ?? "");
  const [sessionId, setSessionId] = useState(locationState?.sessionId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(locationState?.error ?? "");

  const onCreate = async () => {
    if (!username.trim()) return setError("Please add your name before creating a room.");
    setLoading(true);
    setError("");
    try {
      const { sessionId: createdSessionId } = await createSession();
      navigate(`/room/${createdSessionId}`, { state: { username } });
    } catch {
      setError("Could not create a session right now.");
    } finally {
      setLoading(false);
    }
  };

  const onJoin = async (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !sessionId.trim()) {
      setError("Please provide both your name and a session ID.");
      return;
    }
    const nextSessionId = sessionId.trim();
    const nextUsername = username.trim();
    setLoading(true);
    setError("");
    try {
      await validateSession(nextSessionId);
      navigate(`/room/${nextSessionId}`, { state: { username: nextUsername } });
    } catch {
      setError("Session not found. Please check the ID and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="card">
        <h1 className="heroTitle">Real-Time Collaboration Tool</h1>
        <p className="muted heroSubtitle">Start a room with teammates or join with an existing session ID.</p>
        <form onSubmit={onJoin} className="stack">
          <label>
            Your name
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. Priya" />
          </label>
          <label>
            Session ID
            <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Paste session id" />
          </label>
          <div className="row">
            <button type="submit" disabled={loading}>
              {loading ? "Checking..." : "Join Session"}
            </button>
            <button type="button" className="ghost" onClick={onCreate} disabled={loading}>
              Create Session
            </button>
          </div>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
