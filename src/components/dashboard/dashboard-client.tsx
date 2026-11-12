"use client";

import React from "react";
import Link from "next/link";
import {
  DollarSign,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  FolderGit2,
  UserCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useRole } from "@/context/role-context";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge, MilestoneStatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface ProjectWithRelations {
  id: string;
  title: string;
  description: string;
  clientName: string;
  freelancerName: string;
  freelancerEmail: string;
  createdAt: string | Date;
  milestones: {
    id: string;
    order: number;
    title: string;
    description: string;
    amount: number;
    status: string;
    criteria: string;
  }[];
  events: {
    id: string;
    type: string;
    message: string;
    createdAt: string | Date;
  }[];
}

interface DashboardClientProps {
  projects: ProjectWithRelations[];
}

export function DashboardClient({ projects }: DashboardClientProps) {
  const { role, user } = useRole();

  // Compute aggregate stats across all milestones
  const allMilestones = projects.flatMap((p) => p.milestones);
  const totalValue = allMilestones.reduce((sum, m) => sum + m.amount, 0);

  const fundedAmount = allMilestones
    .filter((m) => ["Funded", "Submitted", "Verified"].includes(m.status))
    .reduce((sum, m) => sum + m.amount, 0);

  const awaitingReviewCount = allMilestones.filter(
    (m) => m.status === "Verified"
  ).length;

  const paidOutAmount = allMilestones
    .filter((m) => ["Approved", "PaidOut"].includes(m.status))
    .reduce((sum, m) => sum + m.amount, 0);

  // Helper to determine next action for a project given current role
  const getNextAction = (project: ProjectWithRelations) => {
    const verified = project.milestones.find((m) => m.status === "Verified");
    const funded = project.milestones.find((m) => m.status === "Funded");
    const revision = project.milestones.find((m) => m.status === "RevisionRequested");
    const created = project.milestones.find((m) => m.status === "Created");

    if (role === "client") {
      if (verified) {
        return {
          milestoneId: verified.id,
          label: `Review Report & Approve ($${verified.amount.toLocaleString()})`,
          badge: "Awaiting Client Approval",
          color: "violet",
          urgent: true,
        };
      }
      if (created) {
        return {
          milestoneId: created.id,
          label: `Fund Milestone ${created.order} ($${created.amount.toLocaleString()}) with PayPal`,
          badge: "Ready to Fund",
          color: "indigo",
          urgent: false,
        };
      }
      if (funded) {
        return {
          milestoneId: funded.id,
          label: `View Milestone ${funded.order} (Freelancer Working)`,
          badge: "In Progress",
          color: "teal",
          urgent: false,
        };
      }
    } else {
      // Freelancer perspective
      if (funded || revision) {
        const target = funded || revision;
        return {
          milestoneId: target!.id,
          label: `Submit Code for Milestone ${target!.order} ($${target!.amount.toLocaleString()})`,
          badge: revision ? "Revision Needed" : "Ready for Submission",
          color: "teal",
          urgent: true,
        };
      }
      if (verified) {
        return {
          milestoneId: verified.id,
          label: `View AI Report for Milestone ${verified.order} (Under Client Review)`,
          badge: "Under Review",
          color: "violet",
          urgent: false,
        };
      }
      if (created) {
        return {
          milestoneId: created.id,
          label: `Waiting for client to fund Milestone ${created.order}`,
          badge: "Unfunded",
          color: "slate",
          urgent: false,
        };
      }
    }

    return {
      milestoneId: project.milestones[0]?.id || "",
      label: "View Milestones",
      badge: "Completed",
      color: "emerald",
      urgent: false,
    };
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {user.name}
            </h1>
            <Badge
              variant={role === "client" ? "default" : "funded"}
              className="text-xs"
            >
              {role === "client" ? "Client View" : "Freelancer View"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "client"
              ? "Review verified deliverables, fund upcoming milestones, and release PayPal payouts with confidence."
              : "Submit repositories, run AI verification tests against agreed criteria, and receive automated payouts upon client approval."}
          </p>
        </div>

        {role === "client" && (
          <Button asChild className="shrink-0 shadow-sm">
            <Link href="/projects/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Link>
          </Button>
        )}
      </div>

      {/* STAT CARDS with count-up animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Committed Value"
          value={totalValue}
          isCurrency
          icon={DollarSign}
          color="indigo"
          description="Across all contract milestones"
        />
        <StatCard
          title="Funded via PayPal"
          value={fundedAmount}
          isCurrency
          icon={ShieldCheck}
          color="teal"
          description="Merchant-captured & secured"
        />
        <StatCard
          title="Awaiting Review"
          value={awaitingReviewCount}
          suffix={awaitingReviewCount === 1 ? " milestone" : " milestones"}
          icon={Clock}
          color="amber"
          description="AI verification ready for signoff"
        />
        <StatCard
          title="Total Paid Out"
          value={paidOutAmount}
          isCurrency
          icon={CheckCircle2}
          color="emerald"
          description="Released upon client approval"
        />
      </div>

      {/* PROJECTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Active Projects</h2>
            <p className="text-xs text-muted-foreground">
              {projects.length} project{projects.length === 1 ? "" : "s"} under active milestone management
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {projects.map((project) => {
            const nextAction = getNextAction(project);
            const totalProjectBudget = project.milestones.reduce((s, m) => s + m.amount, 0);
            const releasedProjectBudget = project.milestones
              .filter((m) => ["Approved", "PaidOut"].includes(m.status))
              .reduce((s, m) => s + m.amount, 0);
            const completedMilestones = project.milestones.filter((m) =>
              ["Approved", "PaidOut"].includes(m.status)
            ).length;

            return (
              <Card
                key={project.id}
                className="overflow-hidden border-border/80 hover:border-border transition-all hover:shadow-float"
              >
                <CardHeader className="p-6 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-xl font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                        >
                          <span>{project.title}</span>
                          <ChevronRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                        </Link>
                      </div>
                      <CardDescription className="line-clamp-2 max-w-3xl">
                        {project.description}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          Total Budget
                        </span>
                        <span className="text-lg font-bold text-foreground num-tabular">
                          {formatCurrency(totalProjectBudget)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client & Freelancer info tags */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/60 mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">Client:</span>
                      <span>{project.clientName}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">Freelancer:</span>
                      <span>{project.freelancerName}</span>
                      <span className="text-[11px] font-mono text-muted-foreground/80">
                        ({project.freelancerEmail})
                      </span>
                    </div>
                    <span>•</span>
                    <div>
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-2 space-y-5">
                  {/* Milestones Stepper Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="font-semibold text-foreground">
                        Milestone Progress ({completedMilestones}/{project.milestones.length} Completed)
                      </span>
                      <span className="text-muted-foreground num-tabular">
                        {formatCurrency(releasedProjectBudget)} of {formatCurrency(totalProjectBudget)} released
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {project.milestones.map((m) => (
                        <Link
                          key={m.id}
                          href={`/projects/${project.id}/milestones/${m.id}`}
                          className="group/m block p-3.5 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/70 hover:border-primary/50 transition-all"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-muted-foreground">
                              Milestone {m.order}
                            </span>
                            <MilestoneStatusBadge status={m.status} />
                          </div>
                          <p className="text-xs font-semibold text-foreground truncate group-hover/m:text-primary transition-colors">
                            {m.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 num-tabular font-medium">
                            {formatCurrency(m.amount)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Next Action Callout Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-secondary/80 to-secondary/40 border border-border/80">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Next Recommended Action
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {nextAction.badge}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-foreground mt-0.5">
                          {nextAction.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button asChild size="sm" className="shadow-sm">
                        <Link
                          href={`/projects/${project.id}/milestones/${nextAction.milestoneId}`}
                          className="flex items-center gap-1.5"
                        >
                          <span>Execute Action</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${project.id}`}>
                          <span>View Project</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
