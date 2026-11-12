import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({
      message: "Demo database reset and seeded successfully",
      ...result,
    });
  } catch (error) {
    console.error("Failed to reset demo data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset demo data" },
      { status: 500 }
    );
  }
}
