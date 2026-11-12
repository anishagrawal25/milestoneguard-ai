import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HorizontalStatusStepper } from "@/components/milestones/horizontal-status-stepper";
import { MilestoneActionPanel } from "@/components/milestones/milestone-action-panel";
import { VerificationReport } from "@/components/milestones/verification-report";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCurrency } from "@/lib/utils";
import {
  FileCheck2,
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
    <div className="container py-8 space-y-6 max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: milestone.project.title, href: `/projects/${milestone.projectId}` },
          { label: `Milestone ${milestone.order}: ${milestone.title}` },
        ]}
      />

      {/* 1. HORIZONTAL STATUS STEPPER AT TOP */}
      <HorizontalStatusStepper currentStatus={milestone.status} />

      {/* 2. SINGLE PROMINENT ACTION PANEL & HERO */}
      <MilestoneActionPanel
        milestone={milestone as any}
        project={milestone.project as any}
        paymentMode={process.env.PAYMENT_MODE || "mock"}
        demoRepoUrl={process.env.DEMO_REPO_URL || "https://github.com/anishagrawal25/dockerized-react-app"}
      />

      {/* 3. AGREED CRITERIA & EVIDENCE VERIFICATION REPORT BELOW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
        {/* Left Column: Acceptance Criteria Card */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-card">
            <CardHeader className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-primary" />
                  <span>Acceptance Criteria</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono">
                  {criteriaList.length} Items
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Agreed technical specifications required for completion and payout release.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-2.5">
              {criteriaList.map((criterion, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs"
                >
                  <div className="flex items-start gap-2.5">
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
                Once {milestone.project.freelancerName} submits the GitHub repository or live URL, AI will run static code evidence analysis and produce an objective report here.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
