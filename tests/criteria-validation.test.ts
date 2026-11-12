import { describe, it, expect } from "vitest";
import { z } from "zod";

const criterionResultSchema = z.object({
  criterion: z.string().min(3),
  status: z.enum(["met", "partial", "missing"]),
  evidence: z.string(),
  reasoning: z.string(),
});

const verificationResponseSchema = z.object({
  criteria: z.array(criterionResultSchema).min(1),
  summary: z.string().min(10),
});

function calculateVerificationScore(
  criteria: { status: "met" | "partial" | "missing" }[]
): number {
  if (criteria.length === 0) return 0;
  const met = criteria.filter((c) => c.status === "met").length;
  const partial = criteria.filter((c) => c.status === "partial").length;
  return Math.round(((met * 1.0 + partial * 0.5) / criteria.length) * 100);
}

describe("Acceptance Criteria and Verification Validation", () => {
  it("validates well-formed verification JSON payload", () => {
    const validPayload = {
      summary: "Evaluated 3 criteria with 1 met, 1 partial, and 1 missing.",
      criteria: [
        {
          criterion: "Persistent cart state across browser sessions",
          status: "met",
          evidence: "src/context/CartContext.tsx: localStorage sync verified",
          reasoning: "Session rehydration logic is fully implemented",
        },
        {
          criterion: "Promo code discount validation engine",
          status: "partial",
          evidence: "src/lib/discounts.ts: missing minimum spend check",
          reasoning: "Deduction works but boundary condition is a TODO",
        },
        {
          criterion: "Automated invoice PDF generator",
          status: "missing",
          evidence: "No PDF module found",
          reasoning: "Feature not implemented in repository",
        },
      ],
    };

    const parsed = verificationResponseSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid status values", () => {
    const invalidPayload = {
      summary: "Invalid status test",
      criteria: [
        {
          criterion: "Test criterion",
          status: "completed", // invalid, must be met/partial/missing
          evidence: "evidence",
          reasoning: "reasoning",
        },
      ],
    };

    const parsed = verificationResponseSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it("correctly computes score percentages", () => {
    // 4/4 met = 100%
    expect(
      calculateVerificationScore([
        { status: "met" },
        { status: "met" },
        { status: "met" },
        { status: "met" },
      ])
    ).toBe(100);

    // 0/4 met = 0%
    expect(
      calculateVerificationScore([
        { status: "missing" },
        { status: "missing" },
      ])
    ).toBe(0);

    // 1 met (1.0), 1 partial (0.5), 1 missing (0.0) out of 3 = 1.5/3 = 50%
    expect(
      calculateVerificationScore([
        { status: "met" },
        { status: "partial" },
        { status: "missing" },
      ])
    ).toBe(50);

    // 2 met (2.0), 1 partial (0.5), 1 missing (0.0) out of 4 = 2.5/4 = 63% (Math.round 62.5 -> 63)
    expect(
      calculateVerificationScore([
        { status: "met" },
        { status: "met" },
        { status: "partial" },
        { status: "missing" },
      ])
    ).toBe(63);
  });
});

