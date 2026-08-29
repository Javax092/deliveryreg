import { describe, expect, it } from "vitest";

import { normalizeBrazilianPhone } from "@/modules/leads/phone";
import { normalizeSourceCode, resolvePublicSourceCode } from "@/modules/leads/source";

describe("leads and QR sources", () => {
  it("normalizes Brazilian WhatsApp numbers to country-code format", () => {
    expect(normalizeBrazilianPhone("(92) 99123-4567")).toBe("5592991234567");
    expect(normalizeBrazilianPhone("+55 92 99123-4567")).toBe("5592991234567");
  });

  it("rejects invalid phone numbers", () => {
    expect(() => normalizeBrazilianPhone("123")).toThrow("Invalid Brazilian phone number.");
  });

  it("normalizes safe QR and campaign sources", () => {
    expect(normalizeSourceCode("QR Centro 01")).toBe("qr-centro-01");
    expect(normalizeSourceCode("instagram")).toBe("instagram");
    expect(normalizeSourceCode("../segredo")).toBe("segredo");
  });

  it("drops unusable source values", () => {
    expect(normalizeSourceCode("----")).toBeNull();
    expect(normalizeSourceCode("a".repeat(81))).toBeNull();
  });

  it("keeps origem as canonical public source while accepting source alias", () => {
    expect(resolvePublicSourceCode({ origem: "qr-centro-01", source: "instagram" })).toBe(
      "qr-centro-01"
    );
    expect(resolvePublicSourceCode({ source: "qr-ponta-negra-01" })).toBe("qr-ponta-negra-01");
    expect(resolvePublicSourceCode({ origem: "   ", source: "qr-centro-02" })).toBe(
      "qr-centro-02"
    );
  });
});
