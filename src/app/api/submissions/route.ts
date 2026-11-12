import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fetchGitHubEvidence, fetchLiveUrlEvidence } from "@/lib/evidence-fetcher";
import { enforceRole } from "@/lib/auth-guard";
import { parseJsonBody } from "@/lib/parse-json";

const submissionSchema = z.object({
  milestoneId: z.string().min(1, "Milestone ID is required"),
  url: z.string().url("A valid submission URL is required"),
  type: z.enum(["github", "url"]).default("github"),
});

export async function POST(req: NextRequest) {
  // Server-side role guard: only freelancers can submit work
  const roleCheck = enforceRole("freelancer", req);
  if (roleCheck) return roleCheck;

  const { data: body, errorResponse } = await parseJsonBody(req);
  if (errorResponse) return errorResponse;

  try {
    const { milestoneId, url, type } = submissionSchema.parse(body);

    // Verify milestone existence
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Only allow submissions when milestone is funded, revision requested, or resubmission
    if (milestone.status === "Created") {
      return NextResponse.json(
        { success: false, error: "Cannot submit deliverables for an unfunded milestone. Client must fund milestone first." },
        { status: 400 }
      );
    }

    if (["Approved", "PaidOut"].includes(milestone.status)) {
      return NextResponse.json(
        { success: false, error: "Milestone has already been approved and paid out." },
        { status: 400 }
      );
    }

    const criteria: string[] = (() => {
      try {
        return JSON.parse(milestone.criteria);
      } catch {
        return [];
      }
    })();

    // Fetch evidence snapshot
    const isGithub = url.includes("github.com") || type === "github";
    const snapshot = isGithub
      ? await fetchGitHubEvidence(url, criteria)
      : await fetchLiveUrlEvidence(url);

    // Create Submission record
    const submission = await prisma.submission.create({
      data: {
        milestoneId: milestone.id,
        url,
        type: isGithub ? "github" : "url",
        evidenceSnapshot: JSON.stringify(snapshot),
      },
    });

    // Update milestone status to Submitted
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: "Submitted" },
    });

    // Write Event
    await prisma.event.create({
      data: {
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        type: "SUBMISSION_RECEIVED",
        message: `${milestone.project.freelancerName} submitted ${isGithub ? "GitHub repository" : "live URL"} for Milestone #${milestone.order} ("${milestone.title}").`,
      },
    });

    return NextResponse.json({
      success: true,
      submission,
      snapshotSummary: {
        type: snapshot.type,
        fileCount: snapshot.files?.length || 0,
        metadata: snapshot.metadata,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Submission processing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
