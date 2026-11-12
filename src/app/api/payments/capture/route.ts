import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { capturePayPalOrder } from "@/lib/paypal";
import { enforceRole } from "@/lib/auth-guard";
import { parseJsonBody } from "@/lib/parse-json";

const captureSchema = z.object({
  milestoneId: z.string().min(1, "Milestone ID is required"),
  orderId: z.string().min(1, "PayPal Order ID is required"),
});

export async function POST(req: NextRequest) {
  // Server-side role guard: only clients can capture milestone payments
  const roleCheck = enforceRole("client", req);
  if (roleCheck) return roleCheck;

  const { data: body, errorResponse } = await parseJsonBody(req);
  if (errorResponse) return errorResponse;

  try {
    const { milestoneId, orderId } = captureSchema.parse(body);

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: true,
        payments: true,
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Double-funding & idempotency guard
    if (milestone.status !== "Created") {
      // Check if this exact order was already captured (idempotent replay)
      const existingPayment = milestone.payments.find(
        (p) => p.paypalOrderId === orderId && p.status === "COMPLETED"
      );

      if (existingPayment) {
        return NextResponse.json({
          success: true,
          alreadyCaptured: true,
          captureId: existingPayment.captureId,
          orderId,
          status: "COMPLETED",
          milestoneId: milestone.id,
          amount: milestone.amount,
        });
      }

      // If milestone is already funded or beyond, reject new payment capture
      return NextResponse.json(
        {
          success: false,
          error: `Milestone #${milestone.order} is already ${milestone.status}. Additional funding is blocked.`,
        },
        { status: 400 }
      );
    }

    const paymentMode = process.env.PAYMENT_MODE || "mock";
    const hasCredentials = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

    let captureId: string;

    if (paymentMode === "sandbox" && hasCredentials && !orderId.startsWith("MOCK-")) {
      try {
        const result = await capturePayPalOrder(orderId);
        if (result.status !== "COMPLETED") {
          return NextResponse.json(
            { success: false, error: `PayPal capture status is ${result.status}` },
            { status: 400 }
          );
        }
        captureId = result.captureId || `CAP-${Date.now()}`;
      } catch (err: any) {
        console.error("PayPal capture error:", err);
        return NextResponse.json(
          { success: false, error: err.message || "Failed to capture PayPal order" },
          { status: 500 }
        );
      }
    } else {
      // Mock mode: simulated capture
      captureId = `MOCK-CAP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    // Update or create payment record
    const pendingPayment = milestone.payments.find((p) => p.paypalOrderId === orderId);

    if (pendingPayment) {
      await prisma.payment.update({
        where: { id: pendingPayment.id },
        data: {
          captureId,
          status: "COMPLETED",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          milestoneId: milestone.id,
          paypalOrderId: orderId,
          captureId,
          amount: milestone.amount,
          currency: process.env.PAYPAL_CURRENCY || "USD",
          status: "COMPLETED",
          mode: paymentMode === "sandbox" && hasCredentials ? "sandbox" : "mock",
        },
      });
    }

    // Transition milestone status to Funded
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: "Funded" },
    });

    // Write Event
    await prisma.event.create({
      data: {
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        type: "PAYMENT_CAPTURED",
        message: `Milestone #${milestone.order} ("${milestone.title}") funded with $${milestone.amount.toLocaleString()} via PayPal. Funds held in platform merchant account for conditional release.`,
      },
    });

    return NextResponse.json({
      success: true,
      captureId,
      orderId,
      status: "COMPLETED",
      milestoneId: milestone.id,
      amount: milestone.amount,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Payment capture error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during capture" },
      { status: 500 }
    );
  }
}
