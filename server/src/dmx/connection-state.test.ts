import { describe, it, expect } from "vitest";
import { createInitialStatus } from "./connection-state.js";

describe("createInitialStatus", () => {
  it("initializes each state with correct state, lastConnectedAt, and null error fields", () => {
    for (const state of ["connected", "disconnected", "reconnecting"] as const) {
      const status = createInitialStatus(state);

      expect(status.state).toBe(state);
      expect(status.lastConnectedAt).toEqual(state === "connected" ? expect.any(Number) : null);
      expect(status.reconnectAttempts).toBe(0);
      expect(status.lastDisconnectedAt).toBeNull();
      expect(status.lastError).toBeNull();
      expect(status.lastErrorTitle).toBeNull();
      expect(status.lastErrorSuggestion).toBeNull();
    }
  });

  it("returns a fresh object each time (no shared references)", () => {
    const a = createInitialStatus("connected");
    const b = createInitialStatus("connected");

    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
