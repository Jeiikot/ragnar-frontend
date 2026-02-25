import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MessageBubble } from "../../../src/components/MessageBubble";
import type { Message } from "../../../src/hooks/useChat";

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "test-1",
    role: "assistant",
    content: "Hello world",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("MessageBubble", () => {
  it("renders message content", () => {
    render(<MessageBubble message={makeMessage({ content: "Test answer" })} />);
    expect(screen.getByText("Test answer")).toBeInTheDocument();
  });

  it("renders source badges when sources exist", () => {
    render(
      <MessageBubble
        message={makeMessage({ sources: ["auth.py:15", "main.py:3"] })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /fuentes/i }));

    expect(screen.getByText("auth.py:15")).toBeInTheDocument();
    expect(screen.getByText("main.py:3")).toBeInTheDocument();
  });

  it("does not render sources section when no sources", () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ sources: [] })} />,
    );
    expect(container.querySelectorAll(".rounded-full")).toHaveLength(0);
  });

  it("aligns user messages to the right", () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ role: "user" })} />,
    );
    expect(container.firstChild).toHaveClass("justify-end");
  });

  it("aligns assistant messages to the left", () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ role: "assistant" })} />,
    );
    expect(container.firstChild).toHaveClass("justify-start");
  });
});
