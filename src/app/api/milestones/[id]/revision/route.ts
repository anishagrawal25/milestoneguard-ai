import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const revisionSchema = z.object({
  note: z.string().min(5, "Please provide a detailed revision note (at least 5 characters)"),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const milestoneId = params.id;
    const body = await req.json();
    const { note } = revisionSchema.parse(body);

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

    // Server-side enforcement: can only request revision from 'Verified' or 'Submitted'
    if (milestone.status !== "Verified" && milestone.status !== "Submitted") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot request revision for milestone in status '${milestone.status}'. It must be 'Verified'.`,
        },
        { status: 400 }
      );
    }

    // Update status to RevisionRequested
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: "RevisionRequested" },
    });

    // Log Event with client's revision note
    await prisma.event.create({
      data: {
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        type: "REVISION_REQUESTED",
        message: `${milestone.project.clientName} requested revisions for Milestone #${milestone.order} ("${milestone.title}"): "${note}". Freelancer must make updates and resubmit repository.`,
      },
    });

    return NextResponse.json({
      success: true,
      milestoneId: milestone.id,
      status: "RevisionRequested",
      note,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Revision request error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error requesting revision" },
      { status: 500 }
    );
  }
}
