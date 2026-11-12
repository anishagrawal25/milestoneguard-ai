import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPayPalPayout } from "@/lib/paypal";
import { enforceRole } from "@/lib/auth-guard";

const paramsSchema = z.object({
  id: z.string().min(1, "Milestone ID required"),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Server-side role guard: only clients can approve deliverables and trigger payouts
  const roleCheck = enforceRole("client", req);
  if (roleCheck) return roleCheck;

  try {
    const { id: milestoneId } = paramsSchema.parse(params);

    // Fetch milestone with project, payments, and payouts
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: true,
        payments: true,
        payouts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Idempotency: if already paid out, return existing payout gracefully
    if (milestone.status === "PaidOut" && milestone.payouts.length > 0) {
      const existingPayout = milestone.payouts[0];
      return NextResponse.json({
        success: true,
        alreadyApproved: true,
        milestoneId: milestone.id,
        payout: {
          id: existingPayout.id,
          batchId: existingPayout.batchId,
          status: existingPayout.status,
          simulated: existingPayout.simulated,
          amount: existingPayout.amount,
          recipient: existingPayout.recipient,
        },
      });
    }

    // Server-side state enforcement: allowed ONLY if Verified
    if (milestone.status !== "Verified") {
      return NextResponse.json(
        {
          success: false,
          error: `Milestone #${milestone.order} cannot be approved from status '${milestone.status}'. Deliverables must be 'Verified' first.`,
        },
        { status: 400 }
      );
    }

    // Server-side check: must have a completed payment captured into platform account
    const completedPayment = milestone.payments.find((p) => p.status === "COMPLETED");
    if (!completedPayment) {
      return NextResponse.json(
        {
          success: false,
          error: "Milestone has not been funded; merchant payment must be captured before conditional payout release.",
        },
        { status: 400 }
      );
    }

    const recipient = milestone.project.freelancerEmail;
    const amount = milestone.amount;
    const currency = process.env.PAYPAL_CURRENCY || "USD";
    const paymentMode = process.env.PAYMENT_MODE || "mock";
    const hasCredentials = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

    let batchId = "";
    let simulated = false;
    let payoutStatus = "SUCCESS";

    if (paymentMode === "sandbox" && hasCredentials) {
      try {
        const payoutResult = await createPayPalPayout(
          milestone.id,
          recipient,
          amount,
          currency,
          `Milestone payment release for "${milestone.title}" via MilestoneGuard AI`
        );
        batchId = payoutResult.batchId;
        payoutStatus = payoutResult.status;
        simulated = false;
      } catch (err: any) {
        console.warn("PayPal Sandbox Payouts API failed, falling back to simulated payout:", err);
        batchId = `SIM-PAYOUT-${Date.now().toString(36).toUpperCase()}`;
        simulated = true;
        payoutStatus = "SIMULATED";
      }
    } else {
      // Mock mode
      batchId = `MOCK-PAYOUT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      simulated = true;
      payoutStatus = "SUCCESS";
    }

    // Store Payout record in DB
    const payout = await prisma.payout.create({
      data: {
        milestoneId: milestone.id,
        batchId,
        status: payoutStatus,
        simulated,
        amount,
        recipient,
      },
    });

    // Transition milestone status to PaidOut
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: "PaidOut" },
    });

    // Write Event
    await prisma.event.create({
      data: {
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        type: "PAYOUT_RELEASED",
        message: `${milestone.project.clientName} approved Milestone #${milestone.order} ("${milestone.title}"). Released $${amount.toLocaleString()} payout to ${milestone.project.freelancerName} (${recipient}) [${simulated ? "Simulated Payout" : "PayPal Payout"} Batch: ${batchId}].`,
      },
    });

    return NextResponse.json({
      success: true,
      milestoneId: milestone.id,
      payout: {
        id: payout.id,
        batchId: payout.batchId,
        status: payout.status,
        simulated: payout.simulated,
        amount: payout.amount,
        recipient: payout.recipient,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Milestone approval error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error approving milestone" },
      { status: 500 }
    );
  }
}
