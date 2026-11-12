"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  DollarSign,
  Send,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Github,
  Globe,
  Loader2,
  ExternalLink,
  Copy,
  Info,
  Check,
} from "lucide-react";
import { useRole } from "@/context/role-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface MilestoneActionPanelProps {
  milestone: {
    id: string;
    projectId: string;
    order: number;
    title: string;
    description: string;
    amount: number;
    status: string;
    criteria: string;
    payments: any[];
    payouts: any[];
    submissions: any[];
  };
  project: {
    id: string;
    title: string;
    clientName: string;
    freelancerName: string;
    freelancerEmail: string;
  };
  paymentMode?: string;
  demoRepoUrl?: string;
}

export function MilestoneActionPanel({
  milestone,
  project,
  paymentMode = "mock",
  demoRepoUrl = "https://github.com/anishagrawal25/dockerized-react-app",
}: MilestoneActionPanelProps) {
  const router = useRouter();
  const { role } = useRole();

  // Funding state
  const [fundingModalOpen, setFundingModalOpen] = useState(false);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<{
    orderId: string;
    captureId: string;
    amount: number;
  } | null>(null);

  // Submission state
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionType, setSubmissionType] = useState<"github" | "url">("github");
  const [verifying, setVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<string>("");

  // Approval state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  // Revision state
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [requestingRevision, setRequestingRevision] = useState(false);

  // Latest payout details
  const latestPayout = milestone.payouts[0];
  const latestPayment = milestone.payments[0];

  // 1. FUNDING HANDLER (Mock + Sandbox)
  const handleFundMilestone = async () => {
    try {
      setFundingLoading(true);

      // Create Order on Server
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: milestone.id }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // Server-side capture
      const captureRes = await fetch("/api/payments/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: milestone.id,
          orderId: orderData.orderId,
        }),
      });
      const captureData = await captureRes.json();

      if (!captureData.success) {
        throw new Error(captureData.error || "Payment capture failed");
      }

      setPaymentSuccessReceipt({
        orderId: captureData.orderId || orderData.orderId,
        captureId: captureData.captureId || "CAP-SIMULATED",
        amount: milestone.amount,
      });

      toast.success(`Milestone funded with ${formatCurrency(milestone.amount)}!`, {
        description: "Funds securely captured into platform merchant account.",
      });

      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Payment funding failed");
    } finally {
      setFundingLoading(false);
    }
  };

  // 2. SUBMISSION & VERIFICATION HANDLER
  const handleRunVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionUrl.trim()) {
      toast.error("Please enter a GitHub repository or live URL");
      return;
    }

    try {
      setVerifying(true);

      // Step 1: Fetching repository / URL snapshot
      setVerificationStep("Fetching repository & file tree...");
      const subRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: milestone.id,
          url: submissionUrl.trim(),
          type: submissionType,
        }),
      });
      const subData = await subRes.json();
      if (!subData.success) {
        throw new Error(subData.error || "Failed to fetch repository submission");
      }

      // Step 2: Reading key files
      setVerificationStep("Reading file tree and key source files...");
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Checking each criterion with Gemini
      setVerificationStep("Checking each acceptance criterion with Gemini AI...");
      const verifyRes = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: subData.submission.id,
          milestoneId: milestone.id,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || "AI Verification failed");
      }

      // Step 4: Writing report
      setVerificationStep("Writing evidence report & calculating score...");
      await new Promise((r) => setTimeout(r, 400));

      toast.success("AI Verification completed!", {
        description: `Overall score: ${verifyData.verification.score}%. Client notified for review.`,
      });

      setSubmissionUrl("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Verification process encountered an error", {
        description: "You can retry or submit another public repository.",
      });
    } finally {
      setVerifying(false);
      setVerificationStep("");
    }
  };

  // 3. APPROVAL & PAYOUT HANDLER
  const handleApprove = async () => {
    try {
      setApproving(true);
      const res = await fetch(`/api/milestones/${milestone.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Approval failed");
      }

      toast.success("Milestone approved and payout released!", {
        description: `Sent ${formatCurrency(milestone.amount)} to ${project.freelancerEmail}.`,
      });
      setApproveDialogOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve milestone");
    } finally {
      setApproving(false);
    }
  };

  // 4. REVISION HANDLER
  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      toast.error("Please explain what requires revision");
      return;
    }

    try {
      setRequestingRevision(true);
      const res = await fetch(`/api/milestones/${milestone.id}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: revisionNote.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to request revision");
      }

      toast.warning("Revision requested", {
        description: "Freelancer has been notified to make updates and resubmit.",
      });
      setRevisionDialogOpen(false);
      setRevisionNote("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to request revision");
    } finally {
      setRequestingRevision(false);
    }
  };

  // ----------------------------------------------------
  // RENDER BASED ON MILESTONE STATUS AND USER ROLE
  // ----------------------------------------------------

  // COMPLETED / PAID OUT
  if (milestone.status === "PaidOut" || milestone.status === "Approved") {
    return (
      <Card className="rounded-2xl border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-card">
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-emerald-200/60 dark:border-emerald-800/60">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">
                  Milestone #{milestone.order}
                </Badge>
                <StatusPill variant="paidout" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {milestone.title}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {milestone.description}
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                Amount Released
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground num-tabular">
                {formatCurrency(latestPayout?.amount || milestone.amount)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Milestone Completed & Paid Out
                </h3>
                <p className="text-xs text-muted-foreground">
                  Funds released via PayPal Payouts directly to freelancer.
                </p>
              </div>
            </div>

            <Badge variant="paidout">
              {latestPayout?.simulated ? "Simulated Payout" : "PayPal Payout"}
            </Badge>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Amount Released:</span>
              <span className="font-extrabold text-foreground text-sm num-tabular">
                {formatCurrency(latestPayout?.amount || milestone.amount)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Recipient Email:</span>
              <span className="font-mono text-foreground font-medium truncate block">
                {latestPayout?.recipient || project.freelancerEmail}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Payout Batch ID:</span>
              <span className="font-mono text-muted-foreground truncate block">
                {latestPayout?.batchId || "PAYOUTS-BATCH-VERIFIED"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 1. STATUS: CREATED
  if (milestone.status === "Created") {
    if (role === "client") {
      return (
        <Card className="rounded-2xl border-indigo-200 dark:border-indigo-800/40 bg-gradient-to-br from-indigo-50/50 to-background dark:from-indigo-950/30 dark:to-card shadow-card">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-border/60">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    Milestone #{milestone.order}
                  </Badge>
                  <StatusPill variant="created" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {milestone.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {milestone.description}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                  Milestone Value
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground num-tabular">
                  {formatCurrency(milestone.amount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                  <h3 className="text-sm font-bold text-foreground">
                    Next Action: Fund Milestone with PayPal
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                  Lock {formatCurrency(milestone.amount)} into the platform account so {project.freelancerName} can start working. Payment will only release upon your verified approval.
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => setFundingModalOpen(true)}
                className="shrink-0 shadow-md flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Fund {formatCurrency(milestone.amount)} with PayPal</span>
              </Button>
            </div>

            {/* FUNDING MODAL */}
            <Dialog open={fundingModalOpen} onOpenChange={setFundingModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    <span>PayPal Milestone Checkout</span>
                  </DialogTitle>
                  <DialogDescription>
                    You are funding Milestone #{milestone.order}: &ldquo;{milestone.title}&rdquo;.
                  </DialogDescription>
                </DialogHeader>

                {paymentSuccessReceipt ? (
                  <div className="py-4 space-y-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      <Check className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground">
                        Payment Captured!
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(paymentSuccessReceipt.amount)} has been deposited into the platform merchant account.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary text-left space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order ID:</span>
                        <span className="text-foreground">{paymentSuccessReceipt.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capture ID:</span>
                        <span className="text-foreground">{paymentSuccessReceipt.captureId}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        setFundingModalOpen(false);
                        setPaymentSuccessReceipt(null);
                      }}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-xl bg-secondary/60 border border-border/80 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Milestone Amount:</span>
                      <span className="text-xl font-bold text-foreground num-tabular">
                        {formatCurrency(milestone.amount)}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 border-l-2 border-indigo-500 pl-3">
                      <p className="font-semibold text-foreground">
                        Conditional Release Notice
                      </p>
                      <p>
                        This payment will be captured into the platform&apos;s PayPal merchant account. Freelancer cannot claim funds until you inspect the AI verification report and approve release.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button
                        size="lg"
                        className="w-full shadow-md flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600"
                        onClick={handleFundMilestone}
                        loading={fundingLoading}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>
                          {paymentMode === "mock"
                            ? `Simulate PayPal Checkout (${formatCurrency(milestone.amount)})`
                            : `Pay ${formatCurrency(milestone.amount)} with PayPal Sandbox`}
                        </span>
                      </Button>
                      <p className="text-[11px] text-center text-muted-foreground mt-2">
                        {paymentMode === "mock"
                          ? "Mock Mode: Simulates PayPal Orders v2 create & capture instantly"
                          : "Sandbox Mode: Real PayPal Orders v2 REST API"}
                      </p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      );
    } else {
      // Freelancer sees waiting banner
      return (
        <Card className="rounded-2xl border-dashed border-border/80 bg-muted/20">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-border/60">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    Milestone #{milestone.order}
                  </Badge>
                  <StatusPill variant="created" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {milestone.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {milestone.description}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                  Milestone Value
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground num-tabular">
                  {formatCurrency(milestone.amount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Awaiting Client Funding
                </h3>
                <p className="text-xs text-muted-foreground">
                  {project.clientName} has not yet funded this milestone ({formatCurrency(milestone.amount)}). You will be notified when funds are committed so you can begin work safely.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // 2. STATUS: FUNDED OR REVISION REQUESTED
  if (milestone.status === "Funded" || milestone.status === "RevisionRequested") {
    if (role === "freelancer") {
      return (
        <Card className="rounded-2xl border-teal-200 dark:border-teal-800/40 bg-gradient-to-br from-teal-50/40 to-background dark:from-teal-950/30 dark:to-card shadow-card">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-border/60">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    Milestone #{milestone.order}
                  </Badge>
                  <StatusPill variant={milestone.status === "RevisionRequested" ? "revision" : "funded"} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {milestone.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {milestone.description}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                  Funded Amount
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground num-tabular">
                  {formatCurrency(milestone.amount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleRunVerification} className="space-y-4 pt-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Next Action: Submit GitHub Repository or Live URL for AI Verification
                  </label>

                  {/* 1-Click Demo sample button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionUrl(demoRepoUrl);
                      setSubmissionType("github");
                      toast.info("Filled with sample repository!", {
                        description: demoRepoUrl,
                      });
                    }}
                    className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Use sample repository</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={submissionUrl}
                      onChange={(e) => {
                        setSubmissionUrl(e.target.value);
                        if (e.target.value.includes("github.com")) {
                          setSubmissionType("github");
                        } else if (e.target.value.startsWith("http")) {
                          setSubmissionType("url");
                        }
                      }}
                      placeholder="https://github.com/username/repository or https://your-demo.app"
                      disabled={verifying}
                      className="text-xs font-mono"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={verifying || !submissionUrl.trim()}
                    loading={verifying}
                    className="shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Run AI Verification</span>
                  </Button>
                </div>
              </div>

              {/* Multi-step progress UI during AI verification */}
              {verifying && (
                <div className="p-4 rounded-xl bg-card border border-teal-200 dark:border-teal-800 space-y-3 animate-in fade-in-50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                    <span>{verificationStep}</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-muted-foreground font-mono">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                      <span>Inspecting repository tree & source files</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span>AI evaluating {JSON.parse(milestone.criteria || "[]").length} criteria against static evidence</span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      );
    } else {
      // Client sees waiting for submission banner
      return (
        <Card className="rounded-2xl border-border/80 bg-secondary/30">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-border/60">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    Milestone #{milestone.order}
                  </Badge>
                  <StatusPill variant={milestone.status === "RevisionRequested" ? "revision" : "funded"} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {milestone.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {milestone.description}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                  Funded Balance
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground num-tabular">
                  {formatCurrency(milestone.amount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-foreground">
                    Awaiting Freelancer Submission
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Payment is protected in the platform merchant account. Waiting for {project.freelancerName} to submit code deliverables for AI verification.
                </p>
              </div>

              <Badge variant="funded">In Progress</Badge>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // 3. STATUS: VERIFIED (Client Review Time)
  if (milestone.status === "Verified") {
    if (role === "client") {
      return (
        <Card className="rounded-2xl border-violet-200 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/40 to-background dark:from-violet-950/30 dark:to-card shadow-card">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-border/60">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    Milestone #{milestone.order}
                  </Badge>
                  <StatusPill variant="verified" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {milestone.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {milestone.description}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                  Payout on Approval
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground num-tabular">
                  {formatCurrency(milestone.amount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-bold text-foreground">
                    Next Action: Review Report & Release Payment
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                  AI has inspected the submitted code against acceptance criteria. Review the evidence report below, then approve payment release or request revisions.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setRevisionDialogOpen(true)}
                  className="text-amber-700 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Request Revision
                </Button>

                <Button
                  onClick={() => setApproveDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Approve & Release {formatCurrency(milestone.amount)}
                </Button>
              </div>
            </div>

            {/* CONFIRMATION DIALOG FOR APPROVAL */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Confirm Milestone Approval</span>
                  </DialogTitle>
                  <DialogDescription>
                    Approving this milestone will immediately trigger a PayPal payout from the platform account to the freelancer.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 text-xs">
                  <div className="p-3 rounded-xl bg-secondary space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Milestone:</span>
                      <span className="font-semibold text-foreground">{milestone.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Release Amount:</span>
                      <span className="font-bold text-emerald-600 num-tabular text-sm">
                        {formatCurrency(milestone.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipient PayPal:</span>
                      <span className="font-mono text-foreground font-semibold">
                        {project.freelancerEmail}
                      </span>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    This action is final and executes the PayPal Payouts API.
                  </p>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setApproveDialogOpen(false)}
                    disabled={approving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApprove}
                    loading={approving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Confirm & Send Payout
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* REVISION REQUEST DIALOG */}
            <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-amber-600" />
                    <span>Request Revision</span>
                  </DialogTitle>
                  <DialogDescription>
                    Explain to {project.freelancerName} what needs to be fixed or completed before payment release.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                  <Textarea
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    rows={4}
                    placeholder="Specify the criteria that were missed or need improvement..."
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This will transition the milestone status to &ldquo;Revision Requested&rdquo; and prompt the freelancer to resubmit.
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRevisionDialogOpen(false)}
                    disabled={requestingRevision}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRequestRevision}
                    loading={requestingRevision}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Submit Revision Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      );
    } else {
      // Freelancer view during client review
      return (
        <Card className="rounded-2xl border-violet-200 dark:border-violet-800/40 bg-violet-50/20 dark:bg-violet-950/20">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-border/60">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    Milestone #{milestone.order}
                  </Badge>
                  <StatusPill variant="verified" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {milestone.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {milestone.description}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                  Expected Payout
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground num-tabular">
                  {formatCurrency(milestone.amount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-bold text-foreground">
                    Verification Complete — Awaiting Client Approval
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your submission has been verified by AI. {project.clientName} is currently reviewing the evidence report. You will receive an automated payout to {project.freelancerEmail} upon approval.
                </p>
              </div>

              <Badge variant="verified">Under Review</Badge>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Fallback for SUBMITTED (processing verification)
  return (
    <Card className="rounded-2xl border-border/80 bg-secondary/30">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">
            Submission Received
          </h3>
          <p className="text-xs text-muted-foreground">
            Milestone deliverable is submitted and ready for verification.
          </p>
        </div>
        <Badge variant="outline">{milestone.status}</Badge>
      </CardContent>
    </Card>
  );
}
