import { useCallback, useEffect, useRef, useState } from "react";
import type { IndexStatusResponse } from "../api/client";
import {
  clearIndex,
  getIndexStatus,
  indexCodebaseZip,
  indexDocuments,
} from "../api/client";

type Mode = "code" | "documents";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; count: number }
  | { kind: "error"; message: string };

function useElapsedSeconds(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(id);
      setElapsed(0);
    };
  }, [active]);
  return elapsed;
}

function loadingLabel(elapsed: number, mode: Mode): string {
  if (mode === "documents") {
    if (elapsed < 5) return "Extrayendo texto del PDF...";
    return "Generando embeddings...";
  }
  if (elapsed < 5) return "Subiendo y procesando archivos...";
  if (elapsed < 15) return "Dividiendo en chunks...";
  return "Generando embeddings...";
}

interface IndexFormProps {
  sessionId: string;
}

export function IndexForm({ sessionId }: IndexFormProps) {
  const [mode, setMode] = useState<Mode>("code");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [indexStatus, setIndexStatus] = useState<IndexStatusResponse>({
    sources: [],
    total_chunks: 0,
  });
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const elapsed = useElapsedSeconds(status.kind === "loading");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshIndexStatus = useCallback(async () => {
    setIsStatusLoading(true);
    setStatusError(null);

    try {
      const nextStatus = await getIndexStatus(sessionId);
      setIndexStatus(nextStatus);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setStatusError(msg);
    } finally {
      setIsStatusLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refreshIndexStatus();
  }, [refreshIndexStatus]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setFile(null);
    setStatus({ kind: "idle" });
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!file) return;

    setStatus({ kind: "loading" });

    try {
      const result =
        mode === "code"
          ? await indexCodebaseZip(file, sessionId)
          : await indexDocuments(file, sessionId);
      setStatus({ kind: "success", count: result.documents_indexed });
      await refreshIndexStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setStatus({ kind: "error", message: msg });
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    setStatusError(null);

    try {
      await clearIndex(sessionId);
      await refreshIndexStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setStatusError(msg);
    } finally {
      setIsClearing(false);
    }
  };

  const accept =
    mode === "code"
      ? ".zip,application/zip"
      : ".pdf,.zip,application/pdf,application/zip";

  const fileInputLabel =
    mode === "code" ? "Archivo ZIP del proyecto" : "PDF o ZIP de PDFs";

  const fileInputHint =
    mode === "code" ? "Formato: .zip" : "Formato: .pdf o .zip";

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div
        role="group"
        aria-label="Tipo de contenido a indexar"
        className="flex rounded-lg border border-zinc-700 p-0.5 bg-zinc-800/50"
      >
        <button
          type="button"
          onClick={() => handleModeChange("code")}
          aria-pressed={mode === "code"}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            mode === "code"
              ? "bg-indigo-600 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Código
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("documents")}
          aria-pressed={mode === "documents"}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            mode === "documents"
              ? "bg-indigo-600 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Documentos
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* File picker */}
        <div>
          <label
            htmlFor="file-input"
            className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wide"
          >
            {fileInputLabel}
          </label>

          {/* Hidden native input — triggered by the "Examinar" button */}
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setStatus({ kind: "idle" });
            }}
          />

          {/* Styled file picker row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-zinc-900"
            >
              Examinar
            </button>
            <span
              className={`min-w-0 flex-1 truncate rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2 text-xs ${
                file ? "text-zinc-200" : "text-zinc-500"
              }`}
              title={file?.name}
            >
              {file ? file.name : fileInputHint}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status.kind === "loading" || !file}
          className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-zinc-900"
        >
          {status.kind === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Indexando...{elapsed > 0 ? ` ${elapsed}s` : ""}
            </span>
          ) : mode === "code" ? (
            "Indexar proyecto"
          ) : (
            "Indexar documentos"
          )}
        </button>

        {/* Loading progress hint */}
        {status.kind === "loading" && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg bg-zinc-800/60 border border-zinc-700 px-3 py-2 text-xs text-zinc-400 flex items-center gap-2"
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"
              aria-hidden="true"
            />
            {loadingLabel(elapsed, mode)}
          </div>
        )}

        {/* Success feedback */}
        {status.kind === "success" && (
          <div
            role="status"
            className="rounded-lg bg-emerald-900/30 border border-emerald-800 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {status.count} fragmentos indexados
          </div>
        )}

        {/* Error feedback */}
        {status.kind === "error" && (
          <div
            role="alert"
            className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-xs text-red-300 flex items-center gap-2"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {status.message}
          </div>
        )}

        {/* Indexed sources panel */}
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Fuentes indexadas
            </p>
            <button
              type="button"
              onClick={handleClear}
              disabled={
                isClearing || isStatusLoading || indexStatus.total_chunks === 0
              }
              aria-label="Limpiar todas las fuentes indexadas"
              className="rounded-md border border-zinc-600 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-zinc-900"
            >
              {isClearing ? "Limpiando..." : "Limpiar"}
            </button>
          </div>

          {isStatusLoading ? (
            <p className="text-xs text-zinc-400">Actualizando...</p>
          ) : indexStatus.sources.length === 0 ? (
            <p className="text-xs text-zinc-500">Sin fuentes indexadas.</p>
          ) : (
            <ul className="space-y-2" aria-label="Lista de fuentes indexadas">
              {indexStatus.sources.map((source) => (
                <li
                  key={source.name}
                  className="flex items-center justify-between gap-3 rounded-md border border-zinc-700 bg-zinc-900/30 px-2.5 py-2 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2 text-zinc-200">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 shrink-0 text-zinc-400"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 3h7l5 5v13a1 1 0 01-1 1H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 3v5h5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="truncate" title={source.name}>
                      {source.name}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-zinc-400">
                    {source.chunks} {source.chunks === 1 ? "fragmento" : "fragmentos"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 border-t border-zinc-700 pt-2 text-xs font-medium text-zinc-300">
            Total: {indexStatus.total_chunks}{" "}
            {indexStatus.total_chunks === 1 ? "fragmento" : "fragmentos"}
          </div>

          {statusError && (
            <p role="alert" className="mt-2 text-xs text-red-300">
              {statusError}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
