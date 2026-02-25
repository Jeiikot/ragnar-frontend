# Ragnar Frontend

React SPA for RAG-based code analysis. Communicates with FastAPI backend via REST API.

## Build & Run

```bash
# Install dependencies
npm install

# Dev server (port 6173, proxies /api to backend on :8765)
npm run dev

# Build for production
npm run build

# Run tests
npm test                   # unit + integration (vitest)
npm run test:watch         # vitest in watch mode
npm run test:e2e           # e2e (playwright)

# Lint
npm run lint
```

## Stack

React 19 | TypeScript 5.9 | Vite 7 | Tailwind CSS 4 (`@tailwindcss/vite` plugin) | vitest + @testing-library/react | Playwright

## Project Structure

```
src/
├── main.tsx              # React DOM root render
├── index.css             # Tailwind imports (@import "tailwindcss")
├── App.tsx               # Root: sidebar (sessions + IndexForm) + ChatWindow
├── api/
│   └── client.ts         # API client: all backend calls + TypeScript interfaces
├── components/
│   ├── ChatWindow.tsx    # Chat UI with useChat hook, auto-scroll, elapsed timer
│   ├── IndexForm.tsx     # File upload (code ZIP / PDF toggle), index status
│   └── MessageBubble.tsx # Message bubble with source citation badges
└── hooks/
    └── useChat.ts        # Chat state: messages, sendMessage, clearChat, loading/error
```

## Coding Conventions

### Components
- **Function components only** — no class components
- **Named exports:** `export function ChatWindow(...)` (exception: App.tsx uses default export)
- **Props as inline interfaces** or nearby type definitions
- **`import type`** for type-only imports
- **State:** React built-in hooks only (useState, useCallback, useEffect, useRef). No Redux/Zustand/Context.

### Styling (Tailwind CSS 4)
- Utility classes directly in JSX `className` — no CSS modules
- Dark theme: `bg-zinc-900`, `text-zinc-100`, borders `border-zinc-800`/`border-zinc-700`
- Accent: `indigo-600` (primary), `indigo-500` (hover)
- Status: `emerald` (success), `red` (errors)
- Typography: `text-sm` base, `text-xs` labels, `font-mono` for code/sources
- Corners: `rounded-lg` containers, `rounded-xl` inputs, `rounded-2xl` bubbles, `rounded-full` badges
- Interactive: `transition-colors`, `hover:bg-zinc-800`, `disabled:opacity-40 disabled:cursor-not-allowed`

### UI Language
All user-facing text is in **Spanish** (e.g., "Enviar", "Nueva conversacion", "Indexar proyecto", "Pensando...")

### API Client (`src/api/client.ts`)
- Base URL from `import.meta.env.VITE_API_URL ?? ""`
- Generic `request<T>(path, options)` helper for JSON endpoints
- File uploads use `FormData` directly
- **Interfaces mirror backend schemas exactly** — update client.ts when backend schemas change

## Testing Conventions

### Unit tests (vitest + @testing-library/react)
- Location: `tests/unit/components/`
- Imports: `import { describe, it, expect, vi } from "vitest"`
- Mock hooks: `vi.mock("../../../src/hooks/useChat", () => ({ useChat: () => ({...}) }))`
- Use `render()`, `screen.getByText()`, `screen.getByPlaceholderText()`
- Setup in `tests/setup.ts` provides jest-dom matchers + DOM stubs

### Integration tests
- Location: `tests/integration/hooks/`

### E2E tests (Playwright)
- Location: `tests/e2e/`
- Config: `playwright.config.ts` targeting `http://localhost:6173`

## Backend API Contract

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/v1/health` | — | `{ status, version }` |
| POST | `/api/v1/chat` | `{ message, session_id }` JSON | `{ answer, sources[] }` |
| POST | `/api/v1/index/code` | FormData: `file` + `session_id` | `{ status, documents_indexed }` |
| POST | `/api/v1/index/documents` | FormData: `file` + `session_id` | `{ status, documents_indexed }` |
| GET | `/api/v1/index/status?session_id=X` | query param | `{ sources[], total_chunks }` |
| POST | `/api/v1/index/clear` | FormData: `session_id` | `{ status: "ok" }` |

Vite proxies `/api` to `http://localhost:8765` in dev (configured in `vite.config.ts`).

## Key Patterns

- `App.tsx` manages sessions (`ChatSession[]`) with `crypto.randomUUID()`
- `ChatWindow` remounts on session change via `key={activeSession.id}`
- `IndexForm` uses discriminated union status: `{ kind: "idle" | "loading" | "success" | "error" }`
- `useChat` appends user message optimistically, then appends assistant response
- `useElapsedSeconds(active)` custom hook for loading timer display
