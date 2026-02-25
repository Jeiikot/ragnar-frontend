import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChatWindow } from "../../../src/components/ChatWindow";

// Mock useChat hook
const mockSendMessage = vi.fn();
const mockClearChat = vi.fn();

vi.mock("../../../src/hooks/useChat", () => ({
  useChat: () => ({
    messages: [],
    isLoading: false,
    error: null,
    sendMessage: mockSendMessage,
    clearChat: mockClearChat,
  }),
}));

describe("ChatWindow", () => {
  it("renders empty state message", () => {
    render(<ChatWindow sessionId="test-session" />);
    expect(screen.getByText(/indexa un proyecto/i)).toBeInTheDocument();
  });

  it("renders the input and submit button", () => {
    render(<ChatWindow sessionId="test-session" />);
    expect(screen.getByPlaceholderText(/haz una pregunta/i)).toBeInTheDocument();
    expect(screen.getByText("Enviar")).toBeInTheDocument();
  });

  it("renders clear chat button", () => {
    render(<ChatWindow sessionId="test-session" />);
    expect(screen.getByText(/limpiar chat/i)).toBeInTheDocument();
  });
});
