import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "disconnected";
  let projectCount = 0;

  try {
    projectCount = await prisma.project.count();
    dbStatus = "connected";
  } catch (err: any) {
    console.error("[Health Check] Database query failed:", err?.message || err);
    dbStatus = "error";
  }

  const paymentMode = process.env.PAYMENT_MODE || "mock";

  // Report strictly boolean flags for secrets — NEVER output actual values!
  const envStatus = {
    PAYMENT_MODE: true,
    PAYPAL_CLIENT_ID: !!process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_ID !== "mock_client_id",
    PAYPAL_CLIENT_SECRET: !!process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_CLIENT_SECRET !== "mock_client_secret",
    PAYPAL_WEBHOOK_ID: !!process.env.PAYPAL_WEBHOOK_ID && process.env.PAYPAL_WEBHOOK_ID !== "mock_webhook_id",
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    PAYPAL_CURRENCY: !!process.env.PAYPAL_CURRENCY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    GEMINI_MODEL: !!process.env.GEMINI_MODEL,
    GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
    APP_BASE_URL: !!process.env.APP_BASE_URL,
    DEMO_REPO_URL: !!process.env.DEMO_REPO_URL,
    DATABASE_URL: !!process.env.DATABASE_URL,
  };

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    paymentMode,
    currency: process.env.PAYPAL_CURRENCY || "USD",
    database: {
      status: dbStatus,
      projectCount,
    },
    env: envStatus,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
}

