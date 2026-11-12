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

  // PROJECT 1: E-commerce Website
  const p1 = await prisma.project.create({
    data: {
      title: "E-commerce Website",
      description:
        "Modern headless e-commerce storefront with product catalog, cart management, and seamless PayPal checkout integration.",
      clientName,
      freelancerName,
      freelancerEmail,
      createdAt: new Date(Date.now() - 14 * 86400000), // 14 days ago
    },
  });

  // Project 1 - Milestone 1: PaidOut
  const m1_1 = await prisma.milestone.create({
    data: {
      projectId: p1.id,
      order: 1,
      title: "Product Catalog & Filtering",
      description:
        "Interactive product catalog with category facets, server-side search debounce, and responsive product detail modals.",
      amount: 1200,
      status: "PaidOut",
      criteria: JSON.stringify([
        "Product listing grid with category filtering and pagination",
        "Product detail page showing high-res images, SKU, variants, and stock availability",
        "Responsive search bar with debounce query support and instant result dropdown",
        "REST API endpoints returning sanitized product payloads with test coverage",
      ]),
      createdAt: new Date(Date.now() - 14 * 86400000),
    },
  });

  await prisma.payment.create({
    data: {
      milestoneId: m1_1.id,
      paypalOrderId: "MOCK-PAYPAL-ORD-1011",
      captureId: "MOCK-PAYPAL-CAP-1011",
      amount: 1200,
      currency: "USD",
      status: "COMPLETED",
      mode: "mock",
      createdAt: new Date(Date.now() - 13 * 86400000),
    },
  });

  const sub1_1 = await prisma.submission.create({
    data: {
      milestoneId: m1_1.id,
      url: "https://github.com/sara-khan/ecommerce-catalog-module",
      type: "github",
      evidenceSnapshot: JSON.stringify({
        source: "github",
        repo: "sara-khan/ecommerce-catalog-module",
        files: [
          "src/components/ProductGrid.tsx",
          "src/components/ProductCard.tsx",
          "src/pages/product/[id].tsx",
          "src/pages/api/products.ts",
          "tests/products.test.ts",
        ],
      }),
      createdAt: new Date(Date.now() - 10 * 86400000),
    },
  });

  await prisma.verification.create({
    data: {
      submissionId: sub1_1.id,
      score: 100,
      summary:
        "All 4 acceptance criteria have been verified with complete evidence. The product catalog implements responsive grid layout, category filtering, high-resolution media galleries with variant pickers, search debounce, and fully typed endpoints with 94% test coverage.",
      perCriterion: JSON.stringify([
        {
          criterion: "Product listing grid with category filtering and pagination",
          status: "met",
          evidence: "src/components/ProductGrid.tsx: Grid component renders responsive layout with dynamic filter facet sidebar and cursor-based pagination.",
          reasoning: "Pagination and category filters are fully wired up to URL search params.",
        },
        {
          criterion: "Product detail page showing high-res images, SKU, variants, and stock availability",
          status: "met",
          evidence: "src/pages/product/[id].tsx: Detail view displays image carousel, SKU code, variant color/size pills, and live inventory count badge.",
          reasoning: "All required detail fields and variant selections are present and visually represented.",
        },
        {
          criterion: "Responsive search bar with debounce query support and instant result dropdown",
          status: "met",
          evidence: "src/components/SearchBar.tsx: Implements useDebounce(300ms) hook to query /api/products/search and render instant preview list.",
          reasoning: "Debounced user input prevents query storms and provides instant visual feedback.",
        },
        {
          criterion: "REST API endpoints returning sanitized product payloads with test coverage",
          status: "met",
          evidence: "tests/products.test.ts: 8 unit tests assert payload structure, sanitization of input filters, and 200 HTTP responses.",
          reasoning: "API routes and test assertions fulfill the backend contract.",
        },
      ]),
      createdAt: new Date(Date.now() - 9 * 86400000),
    },
  });

  await prisma.payout.create({
    data: {
      milestoneId: m1_1.id,
      batchId: "PAYOUTS-BATCH-2024-8849",
      status: "SUCCESS",
      simulated: true,
      amount: 1200,
      recipient: freelancerEmail,
      createdAt: new Date(Date.now() - 8 * 86400000),
    },
  });

  // Project 1 - Milestone 2: Verified (waiting for client approval, mixed report)
  const m1_2 = await prisma.milestone.create({
    data: {
      projectId: p1.id,
      order: 2,
      title: "Shopping Cart & Checkout Integration",
      description:
        "Persistent cart state, quantity controls, coupon engine, and PayPal smart checkout button integration.",
      amount: 1800,
      status: "Verified",
      criteria: JSON.stringify([
        "Persistent cart state across browser sessions using local storage or server session",
        "Real-time line item quantity updates with automatic tax and shipping recalculation",
        "Promo code discount validation engine with expiration check and minimum cart rules",
        "PayPal checkout button integration with server-side order capture workflow",
        "Automated order confirmation email dispatch with invoice PDF attachment",
      ]),
      createdAt: new Date(Date.now() - 7 * 86400000),
    },
  });

  await prisma.payment.create({
    data: {
      milestoneId: m1_2.id,
      paypalOrderId: "MOCK-PAYPAL-ORD-2044",
      captureId: "MOCK-PAYPAL-CAP-2044",
      amount: 1800,
      currency: "USD",
      status: "COMPLETED",
      mode: "mock",
      createdAt: new Date(Date.now() - 6 * 86400000),
    },
  });

  const sub1_2 = await prisma.submission.create({
    data: {
      milestoneId: m1_2.id,
      url: "https://github.com/sara-khan/ecommerce-checkout-core",
      type: "github",
      evidenceSnapshot: JSON.stringify({
        source: "github",
        repo: "sara-khan/ecommerce-checkout-core",
        files: [
          "src/context/CartContext.tsx",
          "src/components/CartSummary.tsx",
          "src/lib/discounts.ts",
          "src/components/PayPalButton.tsx",
          "src/pages/api/checkout/capture.ts",
        ],
      }),
      createdAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  await prisma.verification.create({
    data: {
      submissionId: sub1_2.id,
      score: 60,
      summary:
        "The repository successfully implements the core shopping cart persistence and PayPal button integration. However, the promo code validation is missing the minimum order value boundary, and the automated email confirmation with PDF generation is entirely absent.",
      perCriterion: JSON.stringify([
        {
          criterion: "Persistent cart state across browser sessions using local storage or server session",
          status: "met",
          evidence: "src/context/CartContext.tsx: useEffect hook synchronizes cart state to localStorage with key 'mg_cart_store'. Re-hydration logic validates item freshness on mount.",
          reasoning: "Session persistence implemented with local storage fallback and state dehydration.",
        },
        {
          criterion: "Real-time line item quantity updates with automatic tax and shipping recalculation",
          status: "met",
          evidence: "src/components/CartSummary.tsx: Line items update quantity and triggers calculateSubtotal(), calculateTax(0.0825), and calculateShipping().",
          reasoning: "Line item quantities recalculate cart totals immediately with tax and shipping logic.",
        },
        {
          criterion: "Promo code discount validation engine with expiration check and minimum cart rules",
          status: "partial",
          evidence: "src/lib/discounts.ts: validatePromoCode() checks code expiration and percentage deduction, but line 42 has a '// TODO: add min cart spend threshold' comment.",
          reasoning: "Discount code expiry and percentage deduction work, but the minimum cart spend rule is incomplete.",
        },
        {
          criterion: "PayPal checkout button integration with server-side order capture workflow",
          status: "met",
          evidence: "src/components/PayPalButton.tsx & src/pages/api/checkout/capture.ts: Integrates @paypal/react-paypal-js with server-side /api/checkout/capture endpoint.",
          reasoning: "Payment capture initiates on button click and verifies response on the server route.",
        },
        {
          criterion: "Automated order confirmation email dispatch with invoice PDF attachment",
          status: "missing",
          evidence: "No email dispatch service or PDF generation library found in package.json or src/services/mailer.ts.",
          reasoning: "Mailer service is only an empty mock interface; no PDF generator or email transport exists.",
        },
      ]),
      createdAt: new Date(Date.now() - 1 * 86400000),
    },
  });

  // Project 1 - Milestone 3: Created
  await prisma.milestone.create({
    data: {
      projectId: p1.id,
      order: 3,
      title: "Order History & Customer Account Portal",
      description:
        "Customer authentication, past order archive with printable receipts, tracking integration, and address book.",
      amount: 1000,
      status: "Created",
      criteria: JSON.stringify([
        "Customer authentication with password reset and secure JWT session management",
        "Order history table with pagination, tracking link, and printable invoice views",
        "Shipping and billing address management with primary address selection",
      ]),
      createdAt: new Date(Date.now() - 7 * 86400000),
    },
  });

  // Project 1 Events
  await prisma.event.createMany({
    data: [
      {
        projectId: p1.id,
        type: "PROJECT_CREATED",
        message: 'Project "E-commerce Website" created by Aarav Mehta',
        createdAt: new Date(Date.now() - 14 * 86400000),
      },
      {
        projectId: p1.id,
        milestoneId: m1_1.id,
        type: "PAYMENT_CAPTURED",
        message: 'Milestone 1 ("Product Catalog & Filtering") funded with $1,200 via PayPal',
        createdAt: new Date(Date.now() - 13 * 86400000),
      },
      {
        projectId: p1.id,
        milestoneId: m1_1.id,
        type: "SUBMISSION_RECEIVED",
        message: 'Sara Khan submitted repository for Milestone 1',
        createdAt: new Date(Date.now() - 10 * 86400000),
      },
      {
        projectId: p1.id,
        milestoneId: m1_1.id,
        type: "VERIFICATION_COMPLETED",
        message: 'AI verified Milestone 1 submission: 100% score (4/4 criteria met)',
        createdAt: new Date(Date.now() - 9 * 86400000),
      },
      {
        projectId: p1.id,
        milestoneId: m1_1.id,
        type: "PAYOUT_RELEASED",
        message: 'Aarav Mehta approved Milestone 1. Released $1,200 payout to Sara Khan',
        createdAt: new Date(Date.now() - 8 * 86400000),
      },
      {
        projectId: p1.id,
        milestoneId: m1_2.id,
        type: "PAYMENT_CAPTURED",
        message: 'Milestone 2 ("Shopping Cart & Checkout Integration") funded with $1,800 via PayPal',
        createdAt: new Date(Date.now() - 6 * 86400000),
      },
      {
        projectId: p1.id,
        milestoneId: m1_2.id,
        type: "SUBMISSION_RECEIVED",
        message: 'Sara Khan submitted repository for Milestone 2',
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        projectId: p1.id,
        milestoneId: m1_2.id,
        type: "VERIFICATION_COMPLETED",
        message: 'AI verified Milestone 2 submission: 60% score (3 met, 1 partial, 1 missing). Awaiting client review.',
        createdAt: new Date(Date.now() - 1 * 86400000),
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
