import { useState } from "react";
import type { Message } from "../hooks/useChat";

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const hasSources = Boolean(message.sources && message.sources.length > 0);
  const sourcesCount = message.sources?.length ?? 0;
  const sourcesLabel = `${sourcesCount} ${
    sourcesCount === 1 ? "fuente" : "fuentes"
  }`;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>

        {hasSources && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setSourcesOpen((prev) => !prev)}
              aria-label={sourcesOpen ? `Ocultar fuentes (${sourcesCount})` : `Ver fuentes (${sourcesCount})`}
              aria-expanded={sourcesOpen}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300 font-medium"
            >
              <span>{sourcesLabel}</span>
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className={`h-3 w-3 transition-transform ${
                  sourcesOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M5.5 7.5 10 12l4.5-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {sourcesOpen && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {message.sources?.map((source) => (
                  <span
                    key={source}
                    className="inline-block rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300 font-mono"
                  >
                    {source}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
