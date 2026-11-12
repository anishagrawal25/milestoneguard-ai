import { describe, it, expect } from "vitest";

// Formal Milestone Status State Machine Validator
type MilestoneStatus =
  | "Created"
  | "Funded"
  | "Submitted"
  | "Verified"
  | "Approved"
  | "PaidOut"
  | "RevisionRequested";

function isValidTransition(from: MilestoneStatus, to: MilestoneStatus): boolean {
  const allowedTransitions: Record<MilestoneStatus, MilestoneStatus[]> = {
    Created: ["Funded"],
    Funded: ["Submitted"],
    Submitted: ["Verified"],
    Verified: ["Approved", "PaidOut", "RevisionRequested"],
    Approved: ["PaidOut"],
    PaidOut: [], // Terminal state
    RevisionRequested: ["Submitted"], // Resubmission loop
  };

  return allowedTransitions[from]?.includes(to) ?? false;
}

describe("Milestone Status Flow State Machine", () => {
  it("allows standard happy path transitions from Created to PaidOut", () => {
    expect(isValidTransition("Created", "Funded")).toBe(true);
    expect(isValidTransition("Funded", "Submitted")).toBe(true);
    expect(isValidTransition("Submitted", "Verified")).toBe(true);
    expect(isValidTransition("Verified", "Approved")).toBe(true);
    expect(isValidTransition("Approved", "PaidOut")).toBe(true);
    expect(isValidTransition("Verified", "PaidOut")).toBe(true);
  });

  it("allows revision loop transitions", () => {
    expect(isValidTransition("Verified", "RevisionRequested")).toBe(true);
    expect(isValidTransition("RevisionRequested", "Submitted")).toBe(true);
  });

  it("blocks illegal transitions", () => {
    // Cannot skip funding straight to submitted
    expect(isValidTransition("Created", "Submitted")).toBe(false);
    // Cannot approve an unfunded / newly created milestone
    expect(isValidTransition("Created", "Approved")).toBe(false);
    // Cannot approve before verification
    expect(isValidTransition("Submitted", "Approved")).toBe(false);
    // Cannot request revision once already paid out
    expect(isValidTransition("PaidOut", "RevisionRequested")).toBe(false);
    // PaidOut is terminal
    expect(isValidTransition("PaidOut", "Created")).toBe(false);
  });
});

