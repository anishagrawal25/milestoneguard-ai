import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPayPalWebhookSignature } from "@/lib/paypal";

const webhookHeaderSchema = z.object({
  "paypal-auth-algo": z.string().optional().default(""),
  "paypal-cert-url": z.string().optional().default(""),
  "paypal-transmission-id": z.string().optional().default(""),
  "paypal-transmission-sig": z.string().optional().default(""),
  "paypal-transmission-time": z.string().optional().default(""),
});

const webhookBodySchema = z.object({
  id: z.string().optional(),
  event_type: z.string(),
  resource_type: z.string().optional(),
  resource: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    // If webhook ID is not configured (e.g. mock mode or initial setup), acknowledge with 200 and log
    if (!webhookId) {
      console.log("[PayPal Webhook] PAYPAL_WEBHOOK_ID not set. Acknowledging event with 200.");
      return NextResponse.json(
        { message: "Webhook acknowledged; PAYPAL_WEBHOOK_ID not set" },
        { status: 200 }
      );
    }

    const headersRaw = {
      "paypal-auth-algo": req.headers.get("paypal-auth-algo") || "",
      "paypal-cert-url": req.headers.get("paypal-cert-url") || "",
      "paypal-transmission-id": req.headers.get("paypal-transmission-id") || "",
      "paypal-transmission-sig": req.headers.get("paypal-transmission-sig") || "",
      "paypal-transmission-time": req.headers.get("paypal-transmission-time") || "",
    };

    const headers = webhookHeaderSchema.parse(headersRaw);
    const bodyJson = await req.json();
    const body = webhookBodySchema.parse(bodyJson);

    // Verify webhook signature with PayPal API
    const isValid = await verifyPayPalWebhookSignature(headers, bodyJson, webhookId);
    if (!isValid) {
      console.warn("[PayPal Webhook] Invalid webhook signature detected");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const eventType = body.event_type;
    console.log(`[PayPal Webhook] Processing verified event: ${eventType}`);

    // Handle PAYMENT.CAPTURE.COMPLETED
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = body.resource;
      const captureId = resource?.id;
      const orderId =
        resource?.supplementary_data?.related_ids?.order_id ||
        resource?.custom_id;

      if (orderId || captureId) {
        // Find matching payment record
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [
              ...(orderId ? [{ paypalOrderId: orderId }] : []),
              ...(captureId ? [{ captureId }] : []),
            ],
          },
          include: { milestone: true },
        });

        if (payment) {
          // Idempotent update
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              captureId: captureId || payment.captureId,
            },
          });

          if (payment.milestone.status === "Created") {
            await prisma.milestone.update({
              where: { id: payment.milestoneId },
              data: { status: "Funded" },
            });

            await prisma.event.create({
              data: {
                projectId: payment.milestone.projectId,
                milestoneId: payment.milestoneId,
                type: "PAYMENT_CAPTURED",
                message: `Webhook confirmed PAYMENT.CAPTURE.COMPLETED for Milestone #${payment.milestone.order} ($${payment.amount} ${payment.currency}).`,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, event: eventType }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid webhook payload structure", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[PayPal Webhook] Handler error:", error);
    return NextResponse.json(
      { error: "Webhook handling failed", details: error.message },
      { status: 500 }
    );
  }
}
