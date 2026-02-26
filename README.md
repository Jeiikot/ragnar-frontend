# Ragnar Frontend

React SPA for the Ragnar document analysis tool. Upload source code or PDF documents and ask natural-language questions about them.

## Stack

- **React 19** + **TypeScript 5.9**
- **Vite 7** — dev server and build
- **Tailwind CSS 4** — utility-first styling
- **Vitest** — unit and integration tests
- **Playwright** — e2e tests

## Setup

```bash
npm install
```

## Development

```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # typecheck + production build
npm run preview    # preview production build
```

Requires the backend running at `http://localhost:8765`. See [../backend/README.md](../backend/README.md).

## Testing

```bash
npm test              # unit + integration tests (vitest)
npm run test:e2e      # e2e tests (playwright)
npm run lint          # eslint
```

## Project Structure

```
src/
├── api/          # API client and TypeScript types
├── components/   # React components
├── hooks/        # Custom hooks
└── main.tsx      # Entry point
tests/
├── unit/
├── integration/
└── e2e/
```
