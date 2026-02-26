import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { IndexForm } from "../../../src/components/IndexForm";

// Mock the API client
vi.mock("../../../src/api/client", () => ({
  indexCodebaseZip: vi.fn(),
  indexDocuments: vi.fn(),
  getIndexStatus: vi.fn(),
  clearIndex: vi.fn(),
}));

import {
  clearIndex,
  getIndexStatus,
  indexCodebaseZip,
  indexDocuments,
} from "../../../src/api/client";

const mockIndexCodebaseZip = vi.mocked(indexCodebaseZip);
const mockIndexDocuments = vi.mocked(indexDocuments);
const mockGetIndexStatus = vi.mocked(getIndexStatus);
const mockClearIndex = vi.mocked(clearIndex);

describe("IndexForm", () => {
  const sessionId = "test-session";

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIndexStatus.mockResolvedValue({ sources: [], total_chunks: 0 });
    mockClearIndex.mockResolvedValue(undefined);
  });

  it("renders code mode by default", async () => {
    render(<IndexForm sessionId={sessionId} />);
    expect(screen.getByLabelText(/archivo zip del proyecto/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Código" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Documentos" })).toBeInTheDocument();
    await waitFor(() => expect(mockGetIndexStatus).toHaveBeenCalledWith(sessionId));
  });

  it("submits code indexing with selected zip", async () => {
    mockIndexCodebaseZip.mockResolvedValue({
      documents_indexed: 42,
    });

    const user = userEvent.setup();
    render(<IndexForm sessionId={sessionId} />);
    const zipFile = new File(["zip"], "repo.zip", { type: "application/zip" });

    await user.upload(screen.getByLabelText(/archivo zip/i), zipFile);
    await user.click(screen.getByRole("button", { name: /indexar proyecto/i }));

    expect(mockIndexCodebaseZip).toHaveBeenCalledWith(zipFile, sessionId);
  });

  it("shows success message with chunk count", async () => {
    mockIndexCodebaseZip.mockResolvedValue({
      documents_indexed: 42,
    });

    const user = userEvent.setup();
    render(<IndexForm sessionId={sessionId} />);
    const zipFile = new File(["zip"], "repo.zip", { type: "application/zip" });

    await user.upload(screen.getByLabelText(/archivo zip/i), zipFile);
    await user.click(screen.getByRole("button", { name: /indexar proyecto/i }));

    expect(await screen.findByText("42 fragmentos indexados")).toBeInTheDocument();
  });

  it("shows error message on failure", async () => {
    mockIndexCodebaseZip.mockRejectedValue(new Error("Invalid zip file"));

    const user = userEvent.setup();
    render(<IndexForm sessionId={sessionId} />);
    const zipFile = new File(["zip"], "repo.zip", { type: "application/zip" });

    await user.upload(screen.getByLabelText(/archivo zip/i), zipFile);
    await user.click(screen.getByRole("button", { name: /indexar proyecto/i }));

    expect(await screen.findByText("Invalid zip file")).toBeInTheDocument();
  });

  it("disables submit when zip is missing", async () => {
    render(<IndexForm sessionId={sessionId} />);
    const button = screen.getByRole("button", { name: /indexar proyecto/i });
    expect(button).toBeDisabled();
    await waitFor(() => expect(mockGetIndexStatus).toHaveBeenCalledWith(sessionId));
  });

  it("switches to documents mode and submits with document file", async () => {
    mockIndexDocuments.mockResolvedValue({
      documents_indexed: 7,
    });

    const user = userEvent.setup();
    render(<IndexForm sessionId={sessionId} />);

    await user.click(screen.getByRole("button", { name: "Documentos" }));

    const pdfFile = new File(["pdf"], "manual.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(/pdf o zip de pdfs/i), pdfFile);
    await user.click(screen.getByRole("button", { name: /indexar documentos/i }));

    expect(mockIndexDocuments).toHaveBeenCalledWith(pdfFile, sessionId);
    expect(await screen.findByText("7 fragmentos indexados")).toBeInTheDocument();
  });
});
