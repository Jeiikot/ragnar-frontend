const BASE_URL = import.meta.env.VITE_API_URL ?? "";

// -- Envelope types --

export interface ApiResponse<T> {
  data: T;
}

export interface IndexStatusMeta {
  total_items: number;
  total_chunks: number;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: IndexStatusMeta;
}

export interface ApiErrorResponse {
  detail: string;
  error_code: string;
  details: Record<string, unknown> | null;
}

// -- Domain types (mirror backend schemas) --

export interface IndexResponse {
  documents_indexed: number;
}

export interface ClearResponse {
  cleared: boolean;
}

export interface IndexSourceInfo {
  name: string;
  chunks: number;
}

export interface IndexStatusResponse {
  sources: IndexSourceInfo[];
  total_chunks: number;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
}

export interface HealthResponse {
  status: string;
  version: string;
}

// -- Helpers --

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  return parseJsonResponse<T>(response);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail ?? response.statusText;
    throw new Error(`API error (${response.status}): ${detail}`);
  }

  return response.json() as Promise<T>;
}

// -- API functions --

export async function indexCodebaseZip(
  file: File,
  sessionId: string
): Promise<IndexResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);

  const response = await fetch(`${BASE_URL}/api/v1/index/code`, {
    method: "POST",
    body: formData,
  });

  const envelope = await parseJsonResponse<ApiResponse<IndexResponse>>(response);
  return envelope.data;
}

export async function indexDocuments(
  file: File,
  sessionId: string
): Promise<IndexResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);

  const response = await fetch(`${BASE_URL}/api/v1/index/documents`, {
    method: "POST",
    body: formData,
  });

  const envelope = await parseJsonResponse<ApiResponse<IndexResponse>>(response);
  return envelope.data;
}

export async function getIndexStatus(
  sessionId: string
): Promise<IndexStatusResponse> {
  const envelope = await request<ApiListResponse<IndexSourceInfo>>(
    `/api/v1/index/status?session_id=${encodeURIComponent(sessionId)}`
  );
  return {
    sources: envelope.data,
    total_chunks: envelope.meta.total_chunks,
  };
}

export async function clearIndex(sessionId: string): Promise<void> {
  const formData = new FormData();
  formData.append("session_id", sessionId);

  const response = await fetch(`${BASE_URL}/api/v1/index/clear`, {
    method: "POST",
    body: formData,
  });

  await parseJsonResponse<ApiResponse<ClearResponse>>(response);
}

export async function sendMessage(req: ChatRequest): Promise<ChatResponse> {
  const envelope = await request<ApiResponse<ChatResponse>>("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return envelope.data;
}

export function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/v1/health");
}
