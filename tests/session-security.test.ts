import { describe, expect, it } from "vitest";

import { hashSessionToken } from "@/modules/identity/session";

describe("session security", () => {
  it("stores and compares session tokens by hash", () => {
    const token = "sessao-real-nao-deve-ir-para-o-banco";

    expect(hashSessionToken(token)).toHaveLength(64);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
  });
});
