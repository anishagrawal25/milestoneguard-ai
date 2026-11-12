import { prisma } from "../src/lib/prisma";
import { seedDatabase } from "../src/lib/seed";

async function checkAndSeed() {
  try {
    const count = await prisma.project.count();
    if (count === 0) {
      console.log("[Auto-Init] Database is empty. Seeding initial demo projects...");
      await seedDatabase();
      console.log("[Auto-Init] Database seeded successfully!");
    } else {
      console.log(`[Auto-Init] Database contains ${count} projects. Skipping auto-seed.`);
    }
  } catch (err) {
    console.warn("[Auto-Init] Checking database encountered an issue, attempting initial migration and seed...", err);
    try {
      await seedDatabase();
      console.log("[Auto-Init] Fallback seeding successful.");
    } catch (seedErr) {
      console.error("[Auto-Init] Seeding failed:", seedErr);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSeed();
