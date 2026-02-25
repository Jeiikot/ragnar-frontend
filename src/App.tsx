import { useEffect, useState } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { IndexForm } from "./components/IndexForm";
import { checkHealth } from "./api/client";

interface ChatSession {
  id: string;
  name: string;
}

function createSession(index: number): ChatSession {
  return { id: crypto.randomUUID(), name: `Chat ${index}` };
}

function App() {
  const [health, setHealth] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>(() => [createSession(1)]);
  const [activeId, setActiveId] = useState<string>(() => sessions[0].id);

  useEffect(() => {
    checkHealth()
      .then((h) => setHealth(`v${h.version}`))
      .catch(() => setHealth("offline"));
  }, []);

  const addSession = () => {
    const session = createSession(sessions.length + 1);
    setSessions((prev) => [...prev, session]);
    setActiveId(session.id);
  };

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0];

  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-100">
      {/* Sidebar */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-zinc-800">
        {/* Brand */}
        <div className="border-b border-zinc-800 px-4 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Ragnar</h1>
            {health && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                  health === "offline"
                    ? "bg-red-900/40 text-red-400"
                    : "bg-emerald-900/40 text-emerald-400"
                }`}
              >
                {health}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Indexa código o documentos y haz preguntas
          </p>
        </div>

        {/* Session list */}
        <div className="border-b border-zinc-800 px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
              Chats
            </span>
            <button
              onClick={addSession}
              className="rounded-md px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              + Nuevo
            </button>
          </div>
          <div className="space-y-0.5">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveId(session.id)}
                className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                  session.id === activeId
                    ? "bg-indigo-600/20 text-indigo-300"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {session.name}
              </button>
            ))}
          </div>
        </div>

        {/* Index form for active session */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <IndexForm sessionId={activeSession.id} />
        </div>
      </aside>

      {/* Main chat area — key forces remount on session change */}
      <main className="flex-1">
        <ChatWindow key={activeSession.id} sessionId={activeSession.id} name={activeSession.name} />
      </main>
    </div>
  );
}

export default App;
