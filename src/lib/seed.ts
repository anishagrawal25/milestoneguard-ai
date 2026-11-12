import { prisma } from "./prisma";

export async function seedDatabase() {
  // Clear existing records in cascade order
  await prisma.event.deleteMany({});
  await prisma.verification.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.project.deleteMany({});

  const clientName = "Aarav Mehta";
  const freelancerName = "Sara Khan";
  const freelancerEmail = "sb-1nae650838145@business.example.com";

  // PROJECT 1: Containerized React Deployment
  const p1 = await prisma.project.create({
    data: {
      title: "Containerized React Deployment",
      description:
        "Production containerization of Vite React web application with Nginx Alpine static serving, multi-stage Docker build pipeline, and container deployment criteria.",
      clientName,
      freelancerName,
      freelancerEmail,
      createdAt: new Date(Date.now() - 5 * 86400000), // 5 days ago
    },
  });

  // Project 1 - Milestone 1: Created (Ready for client funding & demo verification)
  const m1_1 = await prisma.milestone.create({
    data: {
      projectId: p1.id,
      order: 1,
      title: "Dockerize the React app and serve it with Nginx",
      description:
        "Multi-stage Dockerfile packaging Vite React build artifacts into an Nginx Alpine container, custom SPA reverse proxy routing, and local deployment configuration.",
      amount: 1000,
      status: "Created",
      criteria: JSON.stringify([
        "A multi-stage Dockerfile that builds the React application with Node.js and packages it into an Nginx Alpine container exposing port 80",
        "Nginx configuration with SPA fallback routing using try_files to index.html and gzip compression enabled",
        "A .dockerignore file that excludes build artifacts and sensitive directories (node_modules, dist, .git, .env) while omitting common dev logs and container configuration files",
        "A docker-compose.yml file configuring container services, port bindings, and environment variables for local development",
        "README documentation detailing docker build and docker run commands with container port mapping instructions",
      ]),
      createdAt: new Date(Date.now() - 5 * 86400000),
    },
  });

  // Project 1 - Milestone 2: Created (Next phase)
  await prisma.milestone.create({
    data: {
      projectId: p1.id,
      order: 2,
      title: "CI/CD Automated Container Registry Pipeline",
      description:
        "GitHub Actions workflow to build, tag, and publish Docker container images to GitHub Container Registry (GHCR) with vulnerability scanning.",
      amount: 1500,
      status: "Created",
      criteria: JSON.stringify([
        "GitHub Actions workflow triggered on push to main branch",
        "Automated Docker image build and push to container registry with semantic version tags",
        "Trivy container security vulnerability scanner step in CI pipeline",
      ]),
      createdAt: new Date(Date.now() - 5 * 86400000),
    },
  });

  // Project 1 Events
  await prisma.event.createMany({
    data: [
      {
        projectId: p1.id,
        type: "PROJECT_CREATED",
        message: 'Project "Containerized React Deployment" created by Aarav Mehta',
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
    ],
  });

  // PROJECT 2: Portfolio + Admin Dashboard
  const p2 = await prisma.project.create({
    data: {
      title: "Portfolio + Admin Dashboard",
      description:
        "High-performance design studio portfolio with a headless CMS administrative dashboard for managing case studies and client inquiries.",
      clientName,
      freelancerName,
      freelancerEmail,
      createdAt: new Date(Date.now() - 4 * 86400000),
    },
  });

  // Project 2 - Milestone 1: Funded
  const m2_1 = await prisma.milestone.create({
    data: {
      projectId: p2.id,
      order: 1,
      title: "Public Portfolio & Case Study Showcase",
      description:
        "Responsive portfolio homepage with interactive project grid, animated case study showcase, and contact form.",
      amount: 1500,
      status: "Funded",
      criteria: JSON.stringify([
        "Responsive portfolio homepage with animated hero and client logo reel",
        "Dynamic case study detail pages with markdown rendering and image lightbox",
        "Interactive inquiry contact form with client-side validation and rate limiting",
        "Lighthouse Performance score >= 90 and accessible WCAG AA contrast compliance",
      ]),
      createdAt: new Date(Date.now() - 4 * 86400000),
    },
  });

  await prisma.payment.create({
    data: {
      milestoneId: m2_1.id,
      paypalOrderId: "MOCK-PAYPAL-ORD-7721",
      captureId: "MOCK-PAYPAL-CAP-7721",
      amount: 1500,
      currency: "USD",
      status: "COMPLETED",
      mode: "mock",
      createdAt: new Date(Date.now() - 3 * 86400000),
    },
  });

  // Project 2 - Milestone 2: Created
  await prisma.milestone.create({
    data: {
      projectId: p2.id,
      order: 2,
      title: "Admin Content Management Dashboard",
      description:
        "Administrative dashboard for publishing case studies, managing featured banners, and reviewing client inquiry submissions.",
      amount: 1500,
      status: "Created",
      criteria: JSON.stringify([
        "Secure administrative authentication and role-based permissions",
        "CRUD editor for case studies with draft/publish states and slug generator",
        "Inquiry message inbox with read/unread flags and CSV export capability",
      ]),
      createdAt: new Date(Date.now() - 4 * 86400000),
    },
  });

  // Project 2 Events
  await prisma.event.createMany({
    data: [
      {
        projectId: p2.id,
        type: "PROJECT_CREATED",
        message: 'Project "Portfolio + Admin Dashboard" created by Aarav Mehta',
        createdAt: new Date(Date.now() - 4 * 86400000),
      },
      {
        projectId: p2.id,
        milestoneId: m2_1.id,
        type: "PAYMENT_CAPTURED",
        message: 'Milestone 1 ("Public Portfolio & Case Study Showcase") funded with $1,500 via PayPal. Waiting for freelancer submission.',
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
    ],
  });

  return { success: true, projectCount: 2 };
}
