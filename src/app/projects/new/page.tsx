"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  DollarSign,
  HelpCircle,
  FileCheck2,
  X,
  Layers,
  Info,
} from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useRole, CLIENT_USER, FREELANCER_USER } from "@/context/role-context";

interface MilestoneDraft {
  id: string;
  order: number;
  title: string;
  description: string;
  amount: number;
  criteria: string[];
  isAiGenerating?: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { role } = useRole();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Project Details
  const [title, setTitle] = useState("Mobile Banking iOS & Android App");
  const [description, setDescription] = useState(
    "High-security cross-platform mobile application featuring biometric login, account balance feeds, and instant peer-to-peer payments with PayPal SDK."
  );
  const [clientName, setClientName] = useState(CLIENT_USER.name);
  const [freelancerName, setFreelancerName] = useState(FREELANCER_USER.name);
  const [freelancerEmail, setFreelancerEmail] = useState(
    FREELANCER_USER.email || "sb-1nae650838145@business.example.com"
  );

  // Step 2: Milestones
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    {
      id: "m-1",
      order: 1,
      title: "Authentication & Biometric Security Setup",
      description:
        "Implement biometric login (FaceID / Fingerprint), token refresh cycle, and keychain credential storage.",
      amount: 1500,
      criteria: [
        "Biometric authentication flow with biometric prompt and fallback PIN",
        "Encrypted local session storage with hardware-backed keystore/keychain",
        "JWT token refresh mechanism with 401 interceptor",
      ],
    },
    {
      id: "m-2",
      order: 2,
      title: "Account Dashboard & Transaction Feed",
      description:
        "Real-time balance display, infinite scroll transaction history, and category filter chips.",
      amount: 2000,
      criteria: [
        "Dashboard screen displaying live account balances with pull-to-refresh",
        "Paginated transaction list with search and date range filtering",
        "Transaction detail modal showing merchant info, amount, and receipt preview",
      ],
    },
  ]);

  const [newCriterionInputs, setNewCriterionInputs] = useState<Record<string, string>>({});

  const runningTotal = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  // Helper to add milestone
  const addMilestone = () => {
    const nextOrder = milestones.length + 1;
    setMilestones([
      ...milestones,
      {
        id: `m-${Date.now()}`,
        order: nextOrder,
        title: "",
        description: "",
        amount: 1000,
        criteria: ["Acceptance criterion 1"],
      },
    ]);
  };

  const removeMilestone = (idx: number) => {
    if (milestones.length <= 1) {
      toast.error("Project must have at least one milestone");
      return;
    }
    const updated = milestones.filter((_, i) => i !== idx).map((m, i) => ({
      ...m,
      order: i + 1,
    }));
    setMilestones(updated);
  };

  const updateMilestone = (idx: number, field: keyof MilestoneDraft, value: any) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], [field]: value };
    setMilestones(updated);
  };

  // AI Criteria Drafting per milestone
  const handleDraftCriteriaAI = async (idx: number) => {
    const m = milestones[idx];
    if (!m.title.trim()) {
      toast.error("Please enter a milestone title first");
      return;
    }

    try {
      const updated = [...milestones];
      updated[idx].isAiGenerating = true;
      setMilestones(updated);

      toast.info("Generating acceptance criteria with Gemini AI...", { duration: 2500 });

      const res = await fetch("/api/ai/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: m.title,
          description: m.description || m.title,
        }),
      });

      const data = await res.json();
      if (data.criteria && Array.isArray(data.criteria) && data.criteria.length > 0) {
        const nextMilestones = [...milestones];
        nextMilestones[idx].criteria = data.criteria;
        nextMilestones[idx].isAiGenerating = false;
        setMilestones(nextMilestones);
        toast.success(`Drafted ${data.criteria.length} criteria with AI!`);
      } else {
        // Fallback intelligent criteria if API returned empty
        const fallback = [
          `Implement ${m.title} according to specifications with unit tests`,
          `Ensure responsive UI and accessible states for ${m.title}`,
          `Add validation and error boundary handling for end-to-end edge cases`,
        ];
        const nextMilestones = [...milestones];
        nextMilestones[idx].criteria = fallback;
        nextMilestones[idx].isAiGenerating = false;
        setMilestones(nextMilestones);
        toast.success("Drafted criteria for milestone!");
      }
    } catch (e) {
      const nextMilestones = [...milestones];
      nextMilestones[idx].isAiGenerating = false;
      setMilestones(nextMilestones);
      toast.error("AI service temporarily unavailable, please write criteria manually");
    }
  };

  const addCriterion = (idx: number) => {
    const mId = milestones[idx].id;
    const input = newCriterionInputs[mId]?.trim();
    if (!input) return;

    const updated = [...milestones];
    updated[idx].criteria.push(input);
    setMilestones(updated);
    setNewCriterionInputs({ ...newCriterionInputs, [mId]: "" });
  };

  const removeCriterion = (mIdx: number, cIdx: number) => {
    const updated = [...milestones];
    updated[mIdx].criteria = updated[mIdx].criteria.filter((_, i) => i !== cIdx);
    setMilestones(updated);
  };

  // Submit project
  const handleCreateProject = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          clientName,
          freelancerName,
          freelancerEmail,
          milestones: milestones.map((m) => ({
            order: m.order,
            title: m.title,
            description: m.description,
            amount: Number(m.amount),
            criteria: m.criteria,
          })),
        }),
      });

      const data = await res.json();
      if (data.success && data.project?.id) {
        toast.success("Project and milestones created successfully!");
        router.push(`/projects/${data.project.id}`);
      } else {
        toast.error(data.error || "Failed to create project");
      }
    } catch (e) {
      toast.error("Network error creating project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "New Project" },
        ]}
      />

      {/* Stepper Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Create New Milestone Contract
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define deliverables, agree on testable acceptance criteria, and protect payments with evidence-based verification.
          </p>
        </div>

        {/* Step progress pills */}
        <div className="flex items-center gap-2 pt-2">
          {[
            { step: 1, label: "1. Project Details" },
            { step: 2, label: "2. Milestones & AI Criteria" },
            { step: 3, label: "3. Review & Contract" },
          ].map((s) => (
            <button
              key={s.step}
              onClick={() => {
                if (s.step < currentStep) setCurrentStep(s.step as any);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                currentStep === s.step
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : currentStep > s.step
                  ? "bg-secondary text-foreground border-border hover:bg-secondary/80"
                  : "bg-muted/30 text-muted-foreground border-border/40 cursor-not-allowed"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: PROJECT DETAILS */}
      {currentStep === 1 && (
        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Set the project scope, client details, and designated freelancer payout email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full-Stack E-commerce Platform"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Project Scope & Deliverables <span className="text-rose-500">*</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Provide a detailed description of the project deliverables..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Client Name
                </label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Freelancer Name
                </label>
                <Input
                  value={freelancerName}
                  onChange={(e) => setFreelancerName(e.target.value)}
                  placeholder="Freelancer full name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span>Freelancer PayPal Payout Email</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Target for automated PayPal Payouts
                </span>
              </label>
              <Input
                type="email"
                value={freelancerEmail}
                onChange={(e) => setFreelancerEmail(e.target.value)}
                placeholder="freelancer@example.com"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => {
                  if (!title.trim() || !description.trim()) {
                    toast.error("Please fill in project title and description");
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="flex items-center gap-2"
              >
                <span>Continue to Milestones</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: MILESTONES & ACCEPTANCE CRITERIA */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Running total banner */}
          <div className="sticky top-20 z-20 p-4 rounded-2xl bg-card border border-border shadow-float flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Total Contract Value ({milestones.length} Milestones)
                </span>
                <p className="text-2xl font-extrabold text-foreground num-tabular">
                  {formatCurrency(runningTotal)}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addMilestone}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Milestone</span>
            </Button>
          </div>

          {/* Milestone Cards */}
          <div className="space-y-5">
            {milestones.map((m, mIdx) => (
              <Card key={m.id} className="rounded-2xl border-border/80">
                <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs">
                      #{m.order}
                    </span>
                    <CardTitle className="text-base">Milestone {m.order}</CardTitle>
                  </div>

                  {milestones.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeMilestone(mIdx)}
                      aria-label={`Delete Milestone ${m.order}`}
                      className="text-muted-foreground hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Milestone Title
                      </label>
                      <Input
                        value={m.title}
                        onChange={(e) => updateMilestone(mIdx, "title", e.target.value)}
                        placeholder="e.g. Core Database Schema & Migrations"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Amount (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">
                          $
                        </span>
                        <Input
                          type="number"
                          value={m.amount}
                          onChange={(e) => updateMilestone(mIdx, "amount", parseFloat(e.target.value) || 0)}
                          className="pl-7 num-tabular font-bold"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Description
                    </label>
                    <Textarea
                      value={m.description}
                      onChange={(e) => updateMilestone(mIdx, "description", e.target.value)}
                      rows={2}
                      placeholder="Explain what must be completed in this milestone..."
                    />
                  </div>

                  {/* Acceptance Criteria Chips Section */}
                  <div className="pt-2 border-t border-border/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-bold text-foreground">
                          Acceptance Criteria ({m.criteria.length})
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          (Used by AI for verification)
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDraftCriteriaAI(mIdx)}
                        loading={m.isAiGenerating}
                        className="rounded-xl text-xs flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Draft acceptance criteria with AI</span>
                      </Button>
                    </div>

                    {/* Criteria list */}
                    <div className="space-y-2">
                      {m.criteria.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border text-xs group"
                        >
                          <span className="text-foreground leading-relaxed flex-1">
                            {c}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCriterion(mIdx, cIdx)}
                            aria-label="Remove acceptance criterion"
                            className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add individual criterion */}
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        value={newCriterionInputs[m.id] || ""}
                        onChange={(e) =>
                          setNewCriterionInputs({
                            ...newCriterionInputs,
                            [m.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCriterion(mIdx);
                          }
                        }}
                        placeholder="Add specific criterion (press Enter)..."
                        className="text-xs h-9"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addCriterion(mIdx)}
                        className="shrink-0 h-9"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>

            <Button
              onClick={() => {
                const invalid = milestones.some(
                  (m) => !m.title.trim() || m.amount <= 0 || m.criteria.length === 0
                );
                if (invalid) {
                  toast.error("Please ensure all milestones have a title, amount, and at least 1 criterion");
                  return;
                }
                setCurrentStep(3);
              }}
              className="flex items-center gap-2"
            >
              <span>Review Contract</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & CONTRACT SUMMARY */}
      {currentStep === 3 && (
        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle>Review & Finalize Agreement</CardTitle>
            <CardDescription>
              Verify contract terms before establishing the milestone schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 space-y-3">
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">Client:</span>
                  <span className="font-semibold text-foreground">{clientName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Freelancer:</span>
                  <span className="font-semibold text-foreground">{freelancerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Payout Email:</span>
                  <span className="font-semibold font-mono text-[11px] text-foreground">
                    {freelancerEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Milestones Summary */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Milestone Schedule ({milestones.length})
              </h4>

              <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
                {milestones.map((m) => (
                  <div key={m.id} className="p-4 bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Milestone {m.order}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {m.title}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-foreground num-tabular">
                        {formatCurrency(Number(m.amount))}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {m.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.criteria.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-secondary text-[11px] text-muted-foreground font-medium"
                        >
                          ✓ {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Callout */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-teal-50 dark:from-indigo-950/40 dark:to-teal-950/40 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold block">
                  Total Contract Commitment
                </span>
                <span className="text-xs text-muted-foreground">
                  Milestones are funded sequentially via PayPal Orders v2
                </span>
              </div>
              <span className="text-2xl font-black text-indigo-900 dark:text-indigo-100 num-tabular">
                {formatCurrency(runningTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Milestones</span>
              </Button>

              <Button
                onClick={handleCreateProject}
                loading={submitting}
                className="flex items-center gap-2 shadow-md"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Create Contract & Begin</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
