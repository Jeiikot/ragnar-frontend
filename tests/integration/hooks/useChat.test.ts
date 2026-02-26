import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useChat } from "../../../src/hooks/useChat";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("useChat", () => {
  const sessionId = "test-session";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with empty messages", () => {
    const { result } = renderHook(() => useChat(sessionId));
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sends a message and receives a response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            answer: "The auth module uses JWT",
            sources: ["auth.py:15"],
          },
        }),
    });

    const { result } = renderHook(() => useChat(sessionId));

    await act(async () => {
      await result.current.sendMessage("how does auth work?");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("how does auth work?");
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].content).toBe("The auth module uses JWT");
    expect(result.current.messages[1].sources).toEqual(["auth.py:15"]);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/chat"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "how does auth work?", session_id: sessionId }),
      })
    );
  });

  it("sets error on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () =>
        Promise.resolve({
          detail: "LLM down",
          error_code: "CHAT_FAILED",
          details: null,
        }),
    });

    const { result } = renderHook(() => useChat(sessionId));

    await act(async () => {
      await result.current.sendMessage("test");
    });

    expect(result.current.error).toContain("API error");
    expect(result.current.messages).toHaveLength(1); // only user message
  });

  it("clears chat messages and resets error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { answer: "test", sources: [] } }),
    });

    const { result } = renderHook(() => useChat(sessionId));

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it("ignores empty messages", async () => {
    const { result } = renderHook(() => useChat(sessionId));

    await act(async () => {
      await result.current.sendMessage("   ");
    });

    expect(result.current.messages).toHaveLength(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
