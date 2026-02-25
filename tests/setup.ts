import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.stubGlobal("scrollTo", vi.fn());
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});
