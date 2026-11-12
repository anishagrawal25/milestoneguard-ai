import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { EvidenceSnapshot } from "@/lib/evidence-fetcher";
import { enforceRole } from "@/lib/auth-guard";
import { parseJsonBody } from "@/lib/parse-json";

const verifyRequestSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  milestoneId: z.string().min(1, "Milestone ID is required"),
});

const criterionResultSchema = z.object({
  criterion: z.string().min(1),
  status: z.enum(["met", "partial", "missing"]),
  evidence: z.string(),
  reasoning: z.string(),
});

const verificationResponseSchema = z.object({
  criteria: z.array(criterionResultSchema).min(1),
  summary: z.string().min(10),
});

async function runGeminiVerification(
  criteria: string[],
  snapshot: EvidenceSnapshot,
  milestoneTitle: string,
  modelName: string,
  apiKey: string
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const evidenceSummary = {
    submissionUrl: snapshot.url,
    submissionType: snapshot.type,
    metadata: snapshot.metadata,
    treeSample: snapshot.treeSample?.slice(0, 30),
    files: snapshot.files?.map((f) => ({
      path: f.path,
      contentSnippet: f.content.slice(0, 3500),
    })),
    pageContent: snapshot.pageContent,
  };

  const prompt = `You are MilestoneGuard AI's strict technical verification judge.
Your goal is to inspect the submitted repository/URL snapshot and objectively verify whether the agreed acceptance criteria are satisfied.

STRICT EVALUATION RULES:
1. ONLY cite evidence explicitly present in the provided snapshot (file tree and key source files).
2. NEVER invent file paths, functions, or variable names.
3. For each criterion, assign one status:
   - "met": The code or evidence clearly implements this requirement. Provide exact file path and a concise relevant code snippet.
   - "partial": Scaffolding or partial logic exists (e.g., TODO comment, missing edge case, stub), but is incomplete.
   - "missing": No evidence exists in the repository snapshot. State clearly that evidence was not found.
4. Be concise, objective, and neutral.

Milestone: "${milestoneTitle}"
Agreed Acceptance Criteria:
${criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Submitted Snapshot:
${JSON.stringify(evidenceSummary, null, 2)}

Return strictly a JSON object with this exact schema:
{
  "criteria": [
    {
      "criterion": "exact text of criterion",
      "status": "met" | "partial" | "missing",
      "evidence": "concise file path & code excerpt from snapshot",
      "reasoning": "brief explanation of determination"
    }
  ],
  "summary": "1-3 sentence objective overview of the evaluation findings"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text);
  return verificationResponseSchema.parse(parsed);
}

export async function POST(req: NextRequest) {
  // Server-side role guard: only freelancers can run verification on deliverables
  const roleCheck = enforceRole("freelancer", req);
  if (roleCheck) return roleCheck;

  const { data: body, errorResponse } = await parseJsonBody(req);
  if (errorResponse) return errorResponse;

  try {
    const { submissionId, milestoneId } = verifyRequestSchema.parse(body);

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });

    if (!submission || !milestone) {
      return NextResponse.json(
        { success: false, error: "Submission or Milestone not found" },
        { status: 404 }
      );
    }

    if (milestone.status !== "Submitted" && milestone.status !== "RevisionRequested") {
      return NextResponse.json(
        {
          success: false,
          error: `Milestone #${milestone.order} is currently '${milestone.status}'. Deliverables must be submitted before running verification.`,
        },
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

    let snapshot: EvidenceSnapshot;
    try {
      snapshot = JSON.parse(submission.evidenceSnapshot);
    } catch {
      snapshot = {
        type: "github",
        url: submission.url,
        fetchedAt: new Date().toISOString(),
        metadata: {},
      };
    }

    // Read model ONLY from GEMINI_MODEL
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("[AI Verification] GEMINI_API_KEY is not configured on server.");
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured on the server. Please set GEMINI_API_KEY in your environment to run AI verification.",
        },
        { status: 503 }
      );
    }

    let evaluation: {
      criteria: z.infer<typeof criterionResultSchema>[];
      summary: string;
    };

    try {
      evaluation = await runGeminiVerification(
        criteria,
        snapshot,
        milestone.title,
        modelName,
        apiKey
      );
      // Log server-side only: which model and provider answered
      console.log(`[AI Verification] Provider: Google Gemini | Model: ${modelName} | Milestone: "${milestone.title}" (#${milestone.order}) answered verification successfully.`);
    } catch (firstError: any) {
      console.warn(`[AI Verification] First attempt with Google Gemini (${modelName}) failed, retrying once:`, firstError?.message || firstError);
      try {
        evaluation = await runGeminiVerification(
          criteria,
          snapshot,
          milestone.title,
          modelName,
          apiKey
        );
        console.log(`[AI Verification] Provider: Google Gemini | Model: ${modelName} answered verification successfully on retry.`);
      } catch (retryError: any) {
        console.error(`[AI Verification] Provider: Google Gemini | Model: ${modelName} failed verification after retry:`, retryError?.message || retryError);
        return NextResponse.json(
          {
            success: false,
            error: "AI verification model is temporarily unavailable. Please click 'Try again' to re-run verification.",
            details: retryError?.message,
          },
          { status: 502 }
        );
      }
    }

    // Compute overall score percentage: (met * 1.0 + partial * 0.5) / total * 100
    const metCount = evaluation.criteria.filter((c) => c.status === "met").length;
    const partialCount = evaluation.criteria.filter((c) => c.status === "partial").length;
    const totalCount = evaluation.criteria.length;

    const rawScore = totalCount > 0 ? ((metCount * 1.0 + partialCount * 0.5) / totalCount) * 100 : 0;
    const score = Math.round(rawScore);

    // Save Verification record
    const verification = await prisma.verification.create({
      data: {
        submissionId: submission.id,
        score,
        summary: evaluation.summary,
        perCriterion: JSON.stringify(evaluation.criteria),
      },
    });

    // Transition Milestone status to Verified
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: "Verified" },
    });

    // Write Event
    await prisma.event.create({
      data: {
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        type: "VERIFICATION_COMPLETED",
        message: `AI verified Milestone #${milestone.order} submission: ${score}% score (${metCount} met, ${partialCount} partial, ${totalCount - metCount - partialCount} missing). Awaiting client review.`,
      },
    });

    return NextResponse.json({
      success: true,
      verification: {
        id: verification.id,
        score: verification.score,
        summary: verification.summary,
        perCriterion: evaluation.criteria,
        createdAt: verification.createdAt,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Verification endpoint error:", error);
    return NextResponse.json(
      { success: false, error: "Verification process encountered an unexpected error. Please click 'Try again' to re-run verification." },
      { status: 500 }
    );
  }
}
