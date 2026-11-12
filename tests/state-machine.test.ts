import { describe, it, expect } from "vitest";

// Formal Milestone Status State Machine Validator
export type MilestoneStatus =
  | "Created"
  | "Funded"
  | "Submitted"
  | "Verified"
  | "Approved"
  | "PaidOut"
  | "RevisionRequested";

export const ALLOWED_TRANSITIONS: Record<MilestoneStatus, readonly MilestoneStatus[]> = {
  Created: ["Funded"],
  Funded: ["Submitted"],
  Submitted: ["Verified"],
  Verified: ["Approved", "PaidOut", "RevisionRequested"],
  Approved: ["PaidOut"],
  PaidOut: [], // Terminal state
  RevisionRequested: ["Submitted"], // Resubmission loop
};

export function isValidTransition(from: MilestoneStatus, to: MilestoneStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canCapturePayment(status: MilestoneStatus): boolean {
  // A milestone can only be captured when it is in "Created" state (unfunded)
  return status === "Created";
}

export function canSubmitWork(status: MilestoneStatus): boolean {
  // Freelancer can submit when Funded or RevisionRequested
  return status === "Funded" || status === "RevisionRequested";
}

export function canVerifySubmission(status: MilestoneStatus): boolean {
  // Verification happens after submission
  return status === "Submitted";
}

export function canApproveMilestone(status: MilestoneStatus): boolean {
  // Client can approve only when milestone is Verified
  return status === "Verified";
}

export function canRequestRevision(status: MilestoneStatus): boolean {
  // Client can request revision only when milestone is Verified
  return status === "Verified";
}

describe("Milestone Status Flow State Machine", () => {
  const allStatuses: MilestoneStatus[] = [
    "Created",
    "Funded",
    "Submitted",
    "Verified",
    "Approved",
    "PaidOut",
    "RevisionRequested",
  ];

  describe("Legal transitions", () => {
    it("allows standard happy path transitions: Created -> Funded -> Submitted -> Verified -> Approved -> PaidOut", () => {
      expect(isValidTransition("Created", "Funded")).toBe(true);
      expect(isValidTransition("Funded", "Submitted")).toBe(true);
      expect(isValidTransition("Submitted", "Verified")).toBe(true);
      expect(isValidTransition("Verified", "Approved")).toBe(true);
      expect(isValidTransition("Approved", "PaidOut")).toBe(true);
    });

    it("allows direct transition from Verified to PaidOut (approval and instant payout)", () => {
      expect(isValidTransition("Verified", "PaidOut")).toBe(true);
    });

    it("allows revision loop transitions: Verified -> RevisionRequested -> Submitted", () => {
      expect(isValidTransition("Verified", "RevisionRequested")).toBe(true);
      expect(isValidTransition("RevisionRequested", "Submitted")).toBe(true);
    });
  });

  describe("Illegal transitions across all states", () => {
    it("exhaustively tests all invalid state transitions", () => {
      for (const from of allStatuses) {
        for (const to of allStatuses) {
          const expected = ALLOWED_TRANSITIONS[from].includes(to);
          expect(isValidTransition(from, to)).toBe(expected);
        }
      }
    });

    it("prevents self-transitions (no state can transition to itself without explicit action)", () => {
      for (const status of allStatuses) {
        expect(isValidTransition(status, status)).toBe(false);
      }
    });

    it("prevents skipping funding straight to submitted or verified", () => {
      expect(isValidTransition("Created", "Submitted")).toBe(false);
      expect(isValidTransition("Created", "Verified")).toBe(false);
      expect(isValidTransition("Created", "Approved")).toBe(false);
      expect(isValidTransition("Created", "PaidOut")).toBe(false);
    });

    it("prevents jumping from Funded to Approved or PaidOut without submission and verification", () => {
      expect(isValidTransition("Funded", "Verified")).toBe(false);
      expect(isValidTransition("Funded", "Approved")).toBe(false);
      expect(isValidTransition("Funded", "PaidOut")).toBe(false);
    });

    it("prevents approving from Submitted before AI verification completes", () => {
      expect(isValidTransition("Submitted", "Approved")).toBe(false);
      expect(isValidTransition("Submitted", "PaidOut")).toBe(false);
    });

    it("enforces PaidOut as an absolute terminal state", () => {
      for (const target of allStatuses) {
        expect(isValidTransition("PaidOut", target)).toBe(false);
      }
    });

    it("prevents jumping backwards arbitrarily", () => {
      expect(isValidTransition("Submitted", "Created")).toBe(false);
      expect(isValidTransition("Verified", "Funded")).toBe(false);
      expect(isValidTransition("Approved", "Submitted")).toBe(false);
    });
  });

  describe("Action Guard Preconditions", () => {
    it("guards payment capture: only Created milestones can receive captures", () => {
      expect(canCapturePayment("Created")).toBe(true);
      expect(canCapturePayment("Funded")).toBe(false);
      expect(canCapturePayment("Submitted")).toBe(false);
      expect(canCapturePayment("Verified")).toBe(false);
      expect(canCapturePayment("Approved")).toBe(false);
      expect(canCapturePayment("PaidOut")).toBe(false);
      expect(canCapturePayment("RevisionRequested")).toBe(false);
    });

    it("guards work submission: only Funded or RevisionRequested can be submitted", () => {
      expect(canSubmitWork("Funded")).toBe(true);
      expect(canSubmitWork("RevisionRequested")).toBe(true);
      expect(canSubmitWork("Created")).toBe(false);
      expect(canSubmitWork("Submitted")).toBe(false);
      expect(canSubmitWork("Verified")).toBe(false);
      expect(canSubmitWork("Approved")).toBe(false);
      expect(canSubmitWork("PaidOut")).toBe(false);
    });

    it("guards verification execution: only Submitted milestones can be verified", () => {
      expect(canVerifySubmission("Submitted")).toBe(true);
      expect(canVerifySubmission("Created")).toBe(false);
      expect(canVerifySubmission("Funded")).toBe(false);
      expect(canVerifySubmission("Verified")).toBe(false);
      expect(canVerifySubmission("PaidOut")).toBe(false);
    });

    it("guards client approval: only Verified milestones can be approved", () => {
      expect(canApproveMilestone("Verified")).toBe(true);
      expect(canApproveMilestone("Created")).toBe(false);
      expect(canApproveMilestone("Funded")).toBe(false);
      expect(canApproveMilestone("Submitted")).toBe(false);
      expect(canApproveMilestone("Approved")).toBe(false);
      expect(canApproveMilestone("PaidOut")).toBe(false);
    });

    it("guards revision requests: only Verified milestones can receive revision requests", () => {
      expect(canRequestRevision("Verified")).toBe(true);
      expect(canRequestRevision("Created")).toBe(false);
      expect(canRequestRevision("Funded")).toBe(false);
      expect(canRequestRevision("Submitted")).toBe(false);
      expect(canRequestRevision("PaidOut")).toBe(false);
    });
  });
});
