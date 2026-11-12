import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, MilestoneStatusBadge } from "@/components/ui/badge";
import { HorizontalStatusStepper } from "@/components/milestones/horizontal-status-stepper";
import { MilestoneActionPanel } from "@/components/milestones/milestone-action-panel";
import { VerificationReport } from "@/components/milestones/verification-report";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileCheck2,
  DollarSign,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface MilestonePageProps {
  params: {
    id: string;
    mid: string;
  };
}

export default async function MilestonePage({ params }: MilestonePageProps) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: params.mid },
    include: {
      project: true,
      submissions: {
        orderBy: { createdAt: "desc" },
        include: {
          verifications: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      payouts: {
        orderBy: { createdAt: "desc" },
      },
      events: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!milestone || milestone.projectId !== params.id) {
    notFound();
  }

  const criteriaList: string[] = (() => {
    try {
      return JSON.parse(milestone.criteria);
    } catch {
      return [];
    }
  })();

  const latestSubmission = milestone.submissions[0];
  const latestVerification = latestSubmission?.verifications[0];

  return (
    <div className="container py-8 space-y-8 max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: milestone.project.title, href: `/projects/${milestone.projectId}` },
          { label: `Milestone ${milestone.order}: ${milestone.title}` },
        ]}
      />

      {/* HORIZONTAL STATUS STEPPER AT TOP */}
      <HorizontalStatusStepper currentStatus={milestone.status} />

      {/* MILESTONE HEADER & OVERVIEW */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Milestone #{milestone.order}
              </span>
              <MilestoneStatusBadge status={milestone.status} />
              <span className="text-xs text-muted-foreground">
                In project:{" "}
                <Link
                  href={`/projects/${milestone.projectId}`}
                  className="font-semibold text-foreground hover:underline"
                >
                  {milestone.project.title}
                </Link>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {milestone.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {milestone.description}
            </p>
          </div>

          <div className="lg:border-l lg:border-border/80 lg:pl-8 flex flex-col justify-center shrink-0">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Milestone Value
            </span>
            <span className="text-3xl font-black text-foreground num-tabular mt-1">
              {formatCurrency(milestone.amount)}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              Recipient: {milestone.project.freelancerEmail}
            </span>
          </div>
        </div>
      </div>

      {/* ROLE-BASED ACTION PANEL */}
      <MilestoneActionPanel
        milestone={milestone as any}
        project={milestone.project as any}
        paymentMode={process.env.PAYMENT_MODE || "mock"}
        demoRepoUrl={process.env.DEMO_REPO_URL || "https://github.com/facebook/react"}
      />

      {/* ACCEPTANCE CRITERIA LIST & VERIFICATION REPORT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Acceptance Criteria Card */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-card">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-primary" />
                  <span>Acceptance Criteria</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {criteriaList.length} Items
                </Badge>
              </div>
              <CardDescription>
                Agreed technical specifications required for completion and payout release.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-3">
              {criteriaList.map((criterion, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs space-y-1"
                >
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="font-medium text-foreground leading-relaxed">
                      {criterion}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Verification Report Component */}
        <div className="lg:col-span-7 space-y-4" id="verification-report-section">
          {latestVerification ? (
            <VerificationReport submissions={milestone.submissions as any} />
          ) : (
            <Card className="rounded-2xl border-dashed border-border/80 bg-muted/20 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                No Verification Report Yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
                Once {milestone.project.freelancerName} submits the GitHub repository or live URL, Gemini AI will run static code analysis and produce an evidence report here.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
