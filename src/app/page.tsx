"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileCode2,
  DollarSign,
  Search,
  Lock,
  History,
  FileCheck2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useRole } from "@/context/role-context";

export default function LandingPage() {
  const { role, setRole } = useRole();
  const [activeCriterionTab, setActiveCriterionTab] = useState(0);

  const sampleCriteria = [
    {
      title: "Cart state persistence with localStorage",
      status: "met" as const,
      file: "src/context/CartContext.tsx",
      snippet: `useEffect(() => {\n  const cached = localStorage.getItem("mg_cart_store");\n  if (cached) dispatch({ type: "REHYDRATE", payload: JSON.parse(cached) });\n}, []);`,
      notes: "Local storage persistence and rehydration properly handled.",
    },
    {
      title: "Promo code discount validation engine",
      status: "partial" as const,
      file: "src/lib/discounts.ts",
      snippet: `export function validatePromoCode(code: string, subtotal: number) {\n  if (!ACTIVE_CODES[code]) return { valid: false };\n  // TODO: Add minimum spend threshold check\n  return { valid: true, discountPct: ACTIVE_CODES[code].pct };\n}`,
      notes: "Code matches percentage deduction, but minimum spend check is incomplete.",
    },
    {
      title: "Automated invoice PDF generator",
      status: "missing" as const,
      file: "src/services/mailer.ts",
      snippet: `// No PDF generation library found in package.json\n// export async function generatePdfInvoice(orderId) { ... }`,
      notes: "No PDF generation module or email attachment handler found.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-16 md:py-24 border-b border-border/60 bg-gradient-to-b from-indigo-50/40 via-background to-background dark:from-indigo-950/20 dark:via-background dark:to-background">
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 dark:border-indigo-800/80 dark:bg-indigo-950/60 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>PayPal AI Hackathon 2026</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">Gemini 2.0 Flash Verified</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                Work gets verified against what was promised.{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 bg-clip-text text-transparent">
                  Payments move forward with evidence.
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Clients fear paying for bad work. Freelancers fear delivering work and not getting paid. MilestoneGuard AI funds milestones via PayPal, uses Gemini AI to verify GitHub code against acceptance criteria, and releases payouts conditionally with verified evidence.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button size="lg" asChild className="w-full sm:w-auto shadow-md">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <span>Open Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/projects/new">
                    <span>Create Demo Project</span>
                  </Link>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>PayPal Orders v2 & Payouts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Static AST & File Tree Analysis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Transparent Audit Log</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Verification Report Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow effect */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-teal-400 opacity-20 blur-xl"></div>

                <div className="relative rounded-3xl border border-border/80 bg-card p-6 shadow-float">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        <FileCheck2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-foreground">AI Verification Report</h2>
                          <Badge variant="verified">Live Snapshot</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          sara-khan/ecommerce-checkout-core
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Score overview */}
                  <div className="my-5 p-4 rounded-2xl bg-secondary/60 border border-border/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Verification Score
                      </p>
                      <p className="text-2xl font-extrabold text-foreground mt-0.5">
                        60% <span className="text-xs font-normal text-muted-foreground">Acceptance Met</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        1 Met
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        1 Partial
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        1 Missing
                      </span>
                    </div>
                  </div>

                  {/* Interactive criterion tabs */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Select criteria to inspect evidence:</p>
                    <div className="space-y-2">
                      {sampleCriteria.map((c, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveCriterionTab(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                            activeCriterionTab === idx
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/60 bg-background hover:bg-muted/40"
                          }`}
                        >
                          <span className="font-medium text-foreground truncate pr-2">
                            {c.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              c.status === "met"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : c.status === "partial"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {c.status}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Active snippet preview */}
                    <div className="mt-4 rounded-xl bg-slate-900 text-slate-100 p-3 text-[11px] font-mono overflow-x-auto border border-slate-800">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
                        <span className="flex items-center gap-1">
                          <FileCode2 className="h-3 w-3 text-teal-400" />
                          {sampleCriteria[activeCriterionTab].file}
                        </span>
                        <span>Evidence Excerpt</span>
                      </div>
                      <pre className="text-slate-300 whitespace-pre leading-relaxed">
                        {sampleCriteria[activeCriterionTab].snippet}
                      </pre>
                      <p className="mt-2 text-[10px] text-slate-400 italic">
                        {sampleCriteria[activeCriterionTab].notes}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Static AST inspection</span>
                    <span className="text-teal-600 dark:text-teal-400 font-medium">
                      Code is not executed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-STEP HOW IT WORKS */}
      <section className="py-20 bg-background">
        <div className="container space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs uppercase tracking-widest font-bold text-indigo-600 dark:text-indigo-400">
              Payment Flow
            </h2>
              <h3 className="text-3xl font-bold tracking-tight text-foreground">
              How MilestoneGuard Works
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A fair, automated, and evidence-based workflow powered by PayPal Orders v2 and Gemini AI analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Define Milestones",
                desc: "Draft clear, testable acceptance criteria with AI assistance. Both parties align upfront on what constitutes completion.",
                icon: FileCheck2,
                color: "indigo",
              },
              {
                step: "02",
                title: "Fund with PayPal",
                desc: "Client funds the milestone via PayPal Checkout into the platform merchant account. Freelancer begins with total certainty.",
                icon: DollarSign,
                color: "teal",
              },
              {
                step: "03",
                title: "AI Verifies Work",
                desc: "Freelancer submits a GitHub repository or URL. Gemini AI statically inspects files, extracting concrete evidence for each criterion.",
                icon: Search,
                color: "indigo",
              },
              {
                step: "04",
                title: "Approve & Payout",
                desc: "Client inspects the evidence report. With a single click, client approves and PayPal Payouts releases payment instantly.",
                icon: CheckCircle2,
                color: "emerald",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-card hover:shadow-float transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-muted-foreground/30 font-mono">
                    {item.step}
                  </span>
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
                <h4 className="text-base font-bold text-foreground mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY IT'S DIFFERENT */}
      <section className="py-20 border-t border-border/60 bg-secondary/30">
        <div className="container space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs uppercase tracking-widest font-bold text-teal-600 dark:text-teal-400">
              Why It&apos;s Different
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">
              Built for Certainty, Not Guesswork
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Traditional platforms rely on subjective dispute committees. MilestoneGuard replaces guesswork with code evidence and automated PayPal payments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="rounded-2xl border-border/80 hover:shadow-float transition-shadow">
              <CardContent className="p-8 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                  <FileCode2 className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-foreground">Evidence-Based, Not Subjective</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No generic disputes. The AI model inspects AST file trees, functions, routes, and tests. Every verification cites exact line numbers and code snippets from the repo snapshot.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80 hover:shadow-float transition-shadow">
              <CardContent className="p-8 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-300 flex items-center justify-center">
                  <Lock className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-foreground">Pay-on-Approval Confidence</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The client commits payment into the platform account upfront so the freelancer can build with peace of mind. Payout is triggered strictly when the client approves the verified submission.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80 hover:shadow-float transition-shadow">
              <CardContent className="p-8 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                  <History className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-foreground">Transparent Audit Trail</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every order creation, capture, submission snapshot, verification score, client revision note, and payout batch ID is recorded immutably in the event log.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* QUICK ROLE DEMO CTA */}
      <section className="py-16 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Experience the dual-perspective demo
            </h3>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Switch freely between Aarav Mehta (Client) to fund and approve milestones, and Sara Khan (Freelancer) to submit work and trigger AI code verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              size="lg"
              className="bg-white text-indigo-950 hover:bg-slate-100 font-bold shadow-lg"
              asChild
            >
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-indigo-400/40 text-white hover:bg-indigo-800/50"
              onClick={() => setRole(role === "client" ? "freelancer" : "client")}
            >
              Current: {role === "client" ? "Aarav (Client)" : "Sara (Freelancer)"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
