import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRole } from "@/lib/auth-guard";
import { parseJsonBody } from "@/lib/parse-json";

const createProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  clientName: z.string().min(2, "Client name is required"),
  freelancerName: z.string().min(2, "Freelancer name is required"),
  freelancerEmail: z.string().email("Valid freelancer email is required"),
  milestones: z
    .array(
      z.object({
        order: z.number().int().positive(),
        title: z.string().min(3, "Milestone title required"),
        description: z.string().min(5, "Milestone description required"),
        amount: z.number().positive("Amount must be greater than 0"),
        criteria: z
          .array(z.string().min(2))
          .min(1, "At least one acceptance criterion is required"),
      })
    )
    .min(1, "At least one milestone is required"),
});

export async function POST(req: NextRequest) {
  // Server-side role guard: only clients can create project contracts
  const roleCheck = enforceRole("client", req);
  if (roleCheck) return roleCheck;

  const { data: body, errorResponse } = await parseJsonBody(req);
  if (errorResponse) return errorResponse;

  try {
    const validated = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        title: validated.title,
        description: validated.description,
        clientName: validated.clientName,
        freelancerName: validated.freelancerName,
        freelancerEmail: validated.freelancerEmail,
        milestones: {
          create: validated.milestones.map((m) => ({
            order: m.order,
            title: m.title,
            description: m.description,
            amount: m.amount,
            status: "Created",
            criteria: JSON.stringify(m.criteria),
          })),
        },
        events: {
          create: {
            type: "PROJECT_CREATED",
            message: `Project "${validated.title}" created with ${validated.milestones.length} milestones ($${validated.milestones.reduce((s, m) => s + m.amount, 0).toLocaleString()} total value).`,
          },
        },
      },
      include: {
        milestones: true,
      },
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error creating project" },
      { status: 500 }
    );
  }
}
