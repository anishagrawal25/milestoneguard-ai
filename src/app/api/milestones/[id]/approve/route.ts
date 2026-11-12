import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPayPalPayout } from "@/lib/paypal";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const milestoneId = params.id;

    // Fetch milestone with project and payments
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: true,
        payments: true,
        payouts: true,
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Server-side state enforcement: allowed only if Verified
    if (milestone.status !== "Verified") {
      return NextResponse.json(
        {
          success: false,
          error: `Milestone cannot be approved from status '${milestone.status}'. It must be 'Verified'.`,
        },
        { status: 400 }
      );
    }

    // Server-side check: must have a completed payment
    const completedPayment = milestone.payments.find((p) => p.status === "COMPLETED");
    if (!completedPayment) {
      return NextResponse.json(
        {
          success: false,
          error: "Milestone has not been funded yet; payment must be captured before payout release.",
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
          recipient,
          amount,
          currency,
          `MilestoneGuard Payout for Milestone #${milestone.order}: ${milestone.title}`
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

    // Log Event
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
    console.error("Milestone approval error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error approving milestone" },
      { status: 500 }
    );
  }
}
