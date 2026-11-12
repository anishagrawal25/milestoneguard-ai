import { describe, it, expect } from "vitest";
import { z } from "zod";

// 1. Project creation schema
const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  clientName: z.string().min(1, "Client name is required"),
  freelancerName: z.string().min(1, "Freelancer name is required"),
  freelancerEmail: z.string().email("Valid freelancer email is required"),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1, "Milestone title is required"),
        description: z.string().default(""),
        amount: z.number().positive("Amount must be positive"),
        criteria: z.array(z.string()).default([]),
      })
    )
    .min(1, "At least one milestone is required"),
});

// 2. Capture schema
const captureSchema = z.object({
  milestoneId: z.string().min(1),
  orderId: z.string().min(1),
});

// 3. Create order schema
const createOrderSchema = z.object({
  milestoneId: z.string().min(1),
});

// 4. Submission schema
const submissionSchema = z.object({
  milestoneId: z.string().min(1),
  url: z.string().url("Must be a valid URL"),
  type: z.enum(["github", "url"]),
});

// 5. Revision schema
const revisionSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

// 6. AI criteria prompt schema
const criteriaRequestSchema = z.object({
  milestoneTitle: z.string().min(1),
  milestoneDescription: z.string().optional(),
  projectTitle: z.string().optional(),
});

describe("Zod API Request Schemas", () => {
  describe("createProjectSchema", () => {
    it("validates valid project creation payload", () => {
      const valid = {
        title: "AI E-Commerce Platform",
        description: "Full stack marketplace",
        clientName: "Aarav Mehta",
        freelancerName: "Sara Khan",
        freelancerEmail: "sara@example.com",
        milestones: [
          {
            title: "Phase 1: Architecture",
            description: "Setup DB and core auth",
            amount: 1500,
            criteria: ["Prisma schema finalized", "JWT auth tests pass"],
          },
        ],
      };
      const result = createProjectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects project with negative milestone amount", () => {
      const invalid = {
        title: "AI Project",
        clientName: "Aarav",
        freelancerName: "Sara",
        freelancerEmail: "sara@example.com",
        milestones: [{ title: "Bad Milestone", amount: -50 }],
      };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid freelancer email", () => {
      const invalid = {
        title: "AI Project",
        clientName: "Aarav",
        freelancerName: "Sara",
        freelancerEmail: "not-an-email",
        milestones: [{ title: "Milestone 1", amount: 100 }],
      };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects project with empty milestones array", () => {
      const invalid = {
        title: "AI Project",
        clientName: "Aarav",
        freelancerName: "Sara",
        freelancerEmail: "sara@example.com",
        milestones: [],
      };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("captureSchema and createOrderSchema", () => {
    it("validates correct capture order payload", () => {
      const valid = { milestoneId: "m_123", orderId: "ORDER_999" };
      expect(captureSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects missing milestoneId or orderId", () => {
      expect(captureSchema.safeParse({ milestoneId: "" }).success).toBe(false);
      expect(captureSchema.safeParse({ orderId: "123" }).success).toBe(false);
      expect(createOrderSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("submissionSchema", () => {
    it("validates valid GitHub submission URL", () => {
      const valid = {
        milestoneId: "m_456",
        url: "https://github.com/org/repo",
        type: "github",
      };
      expect(submissionSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects non-URL strings", () => {
      const invalid = {
        milestoneId: "m_456",
        url: "just-a-plain-string",
        type: "github",
      };
      expect(submissionSchema.safeParse(invalid).success).toBe(false);
    });

    it("rejects invalid submission type", () => {
      const invalid = {
        milestoneId: "m_456",
        url: "https://github.com/org/repo",
        type: "gitlab", // must be github or url
      };
      expect(submissionSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("revisionSchema", () => {
    it("validates valid non-empty revision reason", () => {
      expect(
        revisionSchema.safeParse({ reason: "Please fix mobile layout" }).success
      ).toBe(true);
    });

    it("rejects empty revision reason", () => {
      expect(revisionSchema.safeParse({ reason: "" }).success).toBe(false);
    });
  });

  describe("criteriaRequestSchema", () => {
    it("validates milestone title prompt for AI criteria generation", () => {
      expect(
        criteriaRequestSchema.safeParse({
          milestoneTitle: "Stripe integration",
          projectTitle: "E-Commerce",
        }).success
      ).toBe(true);
    });

    it("rejects empty milestone title", () => {
      expect(criteriaRequestSchema.safeParse({ milestoneTitle: "" }).success).toBe(
        false
      );
    });
  });
});

