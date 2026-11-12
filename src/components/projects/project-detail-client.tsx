"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Activity,
  FileCheck2,
  Lock,
  RotateCcw,
  Sparkles,
  FileCode2,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, MilestoneStatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { useRole } from "@/context/role-context";

interface MilestoneWithDetails {
  id: string;
  projectId: string;
  order: number;
  title: string;
  description: string;
  amount: number;
  status: string;
  criteria: string;
  submissions: {
    id: string;
    url: string;
    type: string;
    createdAt: string | Date;
    verifications: {
      id: string;
      score: number;
      summary: string;
    }[];
  }[];
  payments: {
    id: string;
    status: string;
    paypalOrderId: string;
    captureId?: string | null;
  }[];
  payouts: {
    id: string;
    status: string;
    simulated: boolean;
    batchId: string;
  }[];
}

interface EventItem {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  type: string;
  message: string;
  createdAt: string | Date;
}

interface ProjectDetailClientProps {
  project: {
    id: string;
    title: string;
    description: string;
    clientName: string;
    freelancerName: string;
    freelancerEmail: string;
    createdAt: string | Date;
    milestones: MilestoneWithDetails[];
    events: EventItem[];
  };
}

export function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const { role } = useRole();

  // Financial calculations
  const totalBudget = project.milestones.reduce((sum, m) => sum + m.amount, 0);

  const releasedAmount = project.milestones
    .filter((m) => ["Approved", "PaidOut"].includes(m.status))
    .reduce((sum, m) => sum + m.amount, 0);

  const fundedAmount = project.milestones
    .filter((m) => ["Funded", "Submitted", "Verified"].includes(m.status))
    .reduce((sum, m) => sum + m.amount, 0);

  const remainingUnfunded = totalBudget - releasedAmount - fundedAmount;

  const releasedPercent = totalBudget > 0 ? (releasedAmount / totalBudget) * 100 : 0;
  const fundedPercent = totalBudget > 0 ? (fundedAmount / totalBudget) * 100 : 0;

  // Icon selector for event types
  const getEventIcon = (type: string) => {
    switch (type) {
      case "PROJECT_CREATED":
        return <FileCheck2 className="h-4 w-4 text-indigo-500" />;
      case "PAYMENT_CAPTURED":
        return <DollarSign className="h-4 w-4 text-teal-500" />;
      case "SUBMISSION_RECEIVED":
        return <FileCode2 className="h-4 w-4 text-indigo-500" />;
      case "VERIFICATION_COMPLETED":
        return <Sparkles className="h-4 w-4 text-violet-500" />;
      case "PAYOUT_RELEASED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "REVISION_REQUESTED":
        return <RotateCcw className="h-4 w-4 text-amber-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: project.title },
        ]}
      />

      {/* PROJECT HEADER */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                Milestone Contract
              </span>
              <span className="text-xs text-muted-foreground">
                Created {formatDate(project.createdAt)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {project.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {project.description}
            </p>

            {/* Participants Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Client:</span>
                <span className="px-2 py-0.5 rounded-lg bg-secondary text-foreground font-medium">
                  {project.clientName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Freelancer:</span>
                <span className="px-2 py-0.5 rounded-lg bg-secondary text-foreground font-medium">
                  {project.freelancerName}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  ({project.freelancerEmail})
                </span>
              </div>
            </div>
          </div>

          <div className="lg:border-l lg:border-border/80 lg:pl-8 flex flex-col justify-center shrink-0">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Total Budget
            </span>
            <span className="text-3xl font-black text-foreground num-tabular mt-1">
              {formatCurrency(totalBudget)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {project.milestones.length} Milestones
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: Left = Timeline, Right = Summary & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Vertical Milestone Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Milestones Timeline</h2>
            <span className="text-xs text-muted-foreground">
              Sequential funding and evidence verification
            </span>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-border">
            {project.milestones.map((m, idx) => {
              const criteriaList: string[] = (() => {
                try {
                  return JSON.parse(m.criteria);
                } catch {
                  return [];
                }
              })();

              const latestVerification = m.submissions[0]?.verifications[0];

              // Stepper node icon and color
              const isPaid = ["Approved", "PaidOut"].includes(m.status);
              const isVerified = m.status === "Verified";
              const isFunded = ["Funded", "Submitted"].includes(m.status);

              return (
                <div key={m.id} className="relative group">
                  {/* Timeline Circle Node */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border-2 transition-transform duration-200 group-hover:scale-110 ${
                      isPaid
                        ? "bg-emerald-600 border-white dark:border-background text-white shadow-sm shadow-emerald-500/30"
                        : isVerified
                        ? "bg-violet-600 border-white dark:border-background text-white shadow-sm shadow-violet-500/30 animate-pulse-subtle"
                        : isFunded
                        ? "bg-teal-600 border-white dark:border-background text-white shadow-sm shadow-teal-500/30"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {isPaid ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isVerified ? (
                      <Sparkles className="h-3.5 w-3.5" />
                    ) : (
                      <span>{m.order}</span>
                    )}
                  </div>

                  {/* Milestone Content Card */}
                  <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-card hover:border-primary/50 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Milestone {m.order}
                          </span>
                          <MilestoneStatusBadge status={m.status} />
                        </div>
                        <h3 className="text-base font-bold text-foreground">
                          {m.title}
                        </h3>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-base font-extrabold text-foreground num-tabular">
                          {formatCurrency(m.amount)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed my-3">
                      {m.description}
                    </p>

                    {/* Criteria Preview Chips */}
                    <div className="space-y-2 py-1">
                      <span className="text-[11px] font-semibold text-muted-foreground block">
                        Acceptance Criteria ({criteriaList.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {criteriaList.map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/80 text-[11px] text-foreground/80 font-medium border border-border/40"
                          >
                            <span className="text-primary text-[10px]">●</span>
                            <span>{c}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Verification result snippet if verified */}
                    {latestVerification && (
                      <div className="mt-3 p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200/50 dark:border-violet-800/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          <span className="font-semibold text-violet-900 dark:text-violet-200">
                            Verification Score: {latestVerification.score}%
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md">
                          {latestVerification.summary}
                        </span>
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {m.status === "Created" && (role === "client" ? "Ready to fund" : "Awaiting funding")}
                        {m.status === "Funded" && (role === "client" ? "Freelancer working" : "Ready for code submission")}
                        {m.status === "Verified" && (role === "client" ? "Action required: review & approve" : "Submitted: under review")}
                        {m.status === "PaidOut" && "Funds released via PayPal payout"}
                      </span>

                      <Button asChild size="sm" className="shadow-sm">
                        <Link
                          href={`/projects/${project.id}/milestones/${m.id}`}
                          className="flex items-center gap-1.5"
                        >
                          <span>Open Milestone</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Payment Summary Card & Activity Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* PAYMENT SUMMARY CARD */}
          <Card className="rounded-2xl border-border/80 shadow-card">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Payment Summary</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <CardDescription>
                Overview of committed, funded, and released funds.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-5">
              {/* Progress Bar with double segments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Release Progress
                  </span>
                  <span className="font-mono text-muted-foreground num-tabular">
                    {Math.round(releasedPercent)}%
                  </span>
                </div>
                <Progress value={releasedPercent} className="h-2.5" />
              </div>

              {/* Financial metrics breakdown */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/60">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Released to Freelancer
                  </span>
                  <span className="font-bold text-foreground num-tabular">
                    {formatCurrency(releasedAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/60">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-teal-500"></span>
                    Funded & Protected
                  </span>
                  <span className="font-bold text-foreground num-tabular">
                    {formatCurrency(fundedAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/60">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    Remaining Unfunded
                  </span>
                  <span className="font-bold text-foreground num-tabular">
                    {formatCurrency(remainingUnfunded)}
                  </span>
                </div>
              </div>

              {/* Honest Payment Release Policy */}
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  Milestone Release Protocol
                </p>
                <p className="leading-relaxed">
                  Payments are captured into the platform merchant account and released conditionally to the freelancer's PayPal email upon client signoff.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ACTIVITY FEED */}
          <Card className="rounded-2xl border-border/80 shadow-card">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>Activity Feed</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {project.events.length} Events
                </Badge>
              </div>
              <CardDescription>
                Timestamped audit trail of all project actions.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0">
              <div className="divide-y divide-border/60 max-h-[420px] overflow-y-auto pr-1">
                {project.events.map((event) => (
                  <div key={event.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs text-foreground leading-snug">
                          {event.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground block">
                          {formatRelativeTime(event.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
