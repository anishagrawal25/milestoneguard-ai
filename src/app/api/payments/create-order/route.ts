import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPayPalOrder } from "@/lib/paypal";

const createOrderSchema = z.object({
  milestoneId: z.string().min(1, "Milestone ID is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { milestoneId } = createOrderSchema.parse(body);

    // Read amount from DATABASE, never trust client
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

    if (milestone.status !== "Created") {
      return NextResponse.json(
        { success: false, error: `Milestone is already in status '${milestone.status}'` },
        { status: 400 }
      );
    }

    const currency = process.env.PAYPAL_CURRENCY || "USD";
    const paymentMode = process.env.PAYMENT_MODE || "mock";
    const hasCredentials = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

    // Sandbox PayPal execution if enabled and credentials exist
    if (paymentMode === "sandbox" && hasCredentials) {
      try {
        const order = await createPayPalOrder(milestone.id, milestone.amount, currency);

        // Store pending payment record
        await prisma.payment.create({
          data: {
            milestoneId: milestone.id,
            paypalOrderId: order.id,
            amount: milestone.amount,
            currency,
            status: "PENDING",
            mode: "sandbox",
          },
        });

        return NextResponse.json({
          success: true,
          orderId: order.id,
          mode: "sandbox",
          amount: milestone.amount,
          currency,
        });
      } catch (err: any) {
        console.error("PayPal Sandbox create order error:", err);
        return NextResponse.json(
          { success: false, error: err.message || "Failed to create PayPal sandbox order" },
          { status: 500 }
        );
      }
    }

    // Mock Mode: Generate realistic fake order ID
    const mockOrderId = `MOCK-ORDER-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Store pending payment record
    await prisma.payment.create({
      data: {
        milestoneId: milestone.id,
        paypalOrderId: mockOrderId,
        amount: milestone.amount,
        currency,
        status: "PENDING",
        mode: "mock",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      mode: "mock",
      amount: milestone.amount,
      currency,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error creating order" },
      { status: 500 }
    );
  }
}
