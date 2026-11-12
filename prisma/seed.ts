import { seedDatabase } from "../src/lib/seed";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding MilestoneGuard AI demo data...");
  const result = await seedDatabase();
  console.log(`Seeding complete! Created ${result.projectCount} demo projects.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
