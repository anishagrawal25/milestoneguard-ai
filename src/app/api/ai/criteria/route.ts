import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseJsonBody } from "@/lib/parse-json";

const criteriaRequestSchema = z.object({
  title: z.string().min(2, "Milestone title is required"),
  description: z.string().optional(),
});

const criteriaResponseSchema = z.object({
  criteria: z.array(z.string().min(3)).min(1).max(7),
});

// Helper for fallback criteria generation when API key is not yet configured
function generateIntelligentFallback(title: string, description?: string): string[] {
  const t = title.toLowerCase();
  const d = (description || "").toLowerCase();

  if (t.includes("auth") || t.includes("login") || t.includes("user")) {
    return [
      "User authentication with session persistence and secure token storage",
      "Input validation on login and registration forms with error states",
      "Protected API routes rejecting unauthenticated requests with 401 status",
      "Unit and integration tests for authentication lifecycle",
    ];
  }

  if (t.includes("pay") || t.includes("checkout") || t.includes("cart") || t.includes("order")) {
    return [
      "Persistent cart state across browser sessions with quantity controls",
      "Tax and subtotal recalculation reacting to line item updates",
      "PayPal checkout button integration with server-side capture verification",
      "Order confirmation view showing line items, total, and receipt ID",
    ];
  }

  if (t.includes("api") || t.includes("backend") || t.includes("database") || t.includes("schema")) {
    return [
      "Database schema definitions with relational models and automated migrations",
      "RESTful API endpoints with input sanitization and Zod payload validation",
      "Error handling middleware catching unhandled exceptions with clean JSON responses",
      "Automated test suite asserting endpoint responses and status codes",
    ];
  }

  return [
    `Implement core modules for ${title} with typed interfaces and components`,
    `Ensure accessible responsive user interface with loading and empty states`,
    `Integrate error boundaries and client-side validation for edge cases`,
    `Provide comprehensive unit tests validating core functionality`,
  ];
}

async function callGemini(title: string, description: string | undefined, modelName: string, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const prompt = `You are an expert technical project architect for software contracts.
Given the milestone title and description below, generate 3 to 5 clear, objective, and testable acceptance criteria that can be statically verified by inspecting repository source files, file tree, and configuration.

Milestone Title: "${title}"
Milestone Description: "${description || "Deliverable for " + title}"

Return strictly a JSON object with this exact schema:
{
  "criteria": [
    "criterion 1",
    "criterion 2",
    "criterion 3"
  ]
}

Make each criterion specific, realistic, and verifiable in code.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const parsed = JSON.parse(responseText);
  return criteriaResponseSchema.parse(parsed);
}

export async function POST(req: NextRequest) {
  const { data: body, errorResponse } = await parseJsonBody(req);
  if (errorResponse) return errorResponse;

  try {
    const { title, description } = criteriaRequestSchema.parse(body);

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

    // If no API key provided, supply intelligent fallback
    if (!apiKey) {
      const fallbackCriteria = generateIntelligentFallback(title, description);
      return NextResponse.json({
        success: true,
        criteria: fallbackCriteria,
        mode: "fallback",
      });
    }

    // Try Gemini call with 1 automatic retry
    try {
      const data = await callGemini(title, description, modelName, apiKey);
      return NextResponse.json({
        success: true,
        criteria: data.criteria,
        mode: "gemini",
      });
    } catch (firstError) {
      console.warn("First Gemini call failed, retrying once after 2 seconds...", firstError);
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const retryData = await callGemini(title, description, modelName, apiKey);
        return NextResponse.json({
          success: true,
          criteria: retryData.criteria,
          mode: "gemini",
        });
      } catch (retryError) {
        console.error("Gemini retry failed, using resilient fallback:", retryError);
        const fallbackCriteria = generateIntelligentFallback(title, description);
        return NextResponse.json({
          success: true,
          criteria: fallbackCriteria,
          mode: "fallback",
        });
      }
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Criteria generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate criteria" },
      { status: 500 }
    );
  }
}
