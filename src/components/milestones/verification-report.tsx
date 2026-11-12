"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCode2,
  ChevronDown,
  ChevronUp,
  History,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

export interface CriterionResult {
  criterion: string;
  status: "met" | "partial" | "missing";
  evidence: string;
  reasoning: string;
}

export interface VerificationItem {
  id: string;
  score: number;
  summary: string;
  perCriterion: string; // JSON string of CriterionResult[]
  createdAt: string | Date;
}

export interface SubmissionItem {
  id: string;
  url: string;
  type: string;
  createdAt: string | Date;
  verifications: VerificationItem[];
}

interface VerificationReportProps {
  submissions: SubmissionItem[];
}

export function VerificationReport({ submissions }: VerificationReportProps) {
  // Flatten all verifications with their submission info
  const allVerifications = submissions.flatMap((s) =>
    s.verifications.map((v) => ({
      ...v,
      submissionUrl: s.url,
      submissionType: s.type,
      submissionDate: s.createdAt,
    }))
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (allVerifications.length === 0) {
    return null;
  }

  const currentVerification = allVerifications[selectedIndex] || allVerifications[0];

  const criteriaResults: CriterionResult[] = (() => {
    try {
      return JSON.parse(currentVerification.perCriterion);
    } catch {
      return [];
    }
  })();

  const metCount = criteriaResults.filter((c) => c.status === "met").length;
  const partialCount = criteriaResults.filter((c) => c.status === "partial").length;
  const missingCount = criteriaResults.filter((c) => c.status === "missing").length;

  const toggleExpand = (idx: number) => {
    setExpandedCriteria((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copySnippet = (text: string, idx: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // SVG Ring Calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (currentVerification.score / 100) * circumference;

  const ringColor =
    currentVerification.score >= 80
      ? "text-emerald-500"
      : currentVerification.score >= 50
      ? "text-amber-500"
      : "text-rose-500";

  return (
    <Card className="rounded-3xl border-border/80 shadow-float overflow-hidden">
      {/* Top Header & History Selector */}
      <CardHeader className="p-6 pb-4 bg-secondary/30 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                <Sparkles className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg">AI Verification Evidence Report</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Repository:{" "}
              <a
                href={currentVerification.submissionUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-foreground hover:underline inline-flex items-center gap-1 font-semibold"
              >
                {currentVerification.submissionUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </div>

          {/* Verification history dropdown if more than 1 report */}
          {allVerifications.length > 1 && (
            <div className="flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
                aria-label="Select report version"
                className="text-xs bg-background border border-input rounded-xl px-2.5 py-1.5 font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              >
                {allVerifications.map((v, i) => (
                  <option key={v.id} value={i}>
                    {i === 0 ? "Latest Report" : `Revision #${allVerifications.length - i}`} ({v.score}%)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* SCORE RING & METRICS HERO */}
        <div className="p-6 rounded-2xl bg-secondary/40 border border-border/60 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Score ring */}
          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24 shrink-0 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-muted/40"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className={`transition-all duration-1000 ease-out ${ringColor}`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground num-tabular">
                  {currentVerification.score}%
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                  Score
                </span>
              </div>
            </div>

            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-base font-bold text-foreground">
                {currentVerification.score === 100
                  ? "All Criteria Fully Verified"
                  : currentVerification.score >= 60
                  ? "Deliverable Partially Verified"
                  : "Significant Criteria Missing"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Verified {formatRelativeTime(currentVerification.createdAt)} via static code evidence analysis.
              </p>
            </div>
          </div>

          {/* Counts Pills */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Met
              </span>
              <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200 num-tabular">
                {metCount}
              </span>
            </div>

            <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Partial
              </span>
              <span className="text-xl font-bold text-amber-800 dark:text-amber-200 num-tabular">
                {partialCount}
              </span>
            </div>

            <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Missing
              </span>
              <span className="text-xl font-bold text-rose-800 dark:text-rose-200 num-tabular">
                {missingCount}
              </span>
            </div>
          </div>
        </div>

        {/* AI SUMMARY BOX */}
        <div className="p-4 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/60 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-950 dark:text-violet-200">
              Executive AI Synthesis
            </h4>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed font-sans">
            {currentVerification.summary}
          </p>
        </div>

        {/* CRITERION CARDS BREAKDOWN */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Per-Criterion Evidence Breakdown ({criteriaResults.length})
          </h4>

          <div className="space-y-3">
            {criteriaResults.map((item, idx) => {
              const isExpanded = expandedCriteria[idx] ?? true;

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-all duration-200 hover:border-border"
                >
                  {/* Criterion Header */}
                  <div
                    onClick={() => toggleExpand(idx)}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {item.status === "met" && (
                          <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                        {item.status === "partial" && (
                          <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        )}
                        {item.status === "missing" && (
                          <div className="h-6 w-6 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center">
                            <XCircle className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={item.status}
                            className="uppercase text-[10px] tracking-wider font-bold"
                          >
                            {item.status}
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            Criterion #{idx + 1}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground leading-snug">
                          {item.criterion}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle details"
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Content: Monospace evidence & reasoning */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-border/40 space-y-3.5 bg-muted/10">
                      {/* Evidence block */}
                      <div className="space-y-1.5 pt-3">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1.5 font-semibold text-foreground">
                            <FileCode2 className="h-3.5 w-3.5 text-indigo-500" />
                            Extracted Code Evidence:
                          </span>
                          <button
                            onClick={() => copySnippet(item.evidence, idx)}
                            className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-sans text-[11px]"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-500 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="rounded-xl bg-slate-900 text-slate-100 p-3.5 text-xs font-mono border border-slate-800 overflow-x-auto">
                          <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {item.evidence || "No matching code snippet found."}
                          </pre>
                        </div>
                      </div>

                      {/* Reasoning block */}
                      <div className="p-3 rounded-xl bg-secondary/60 border border-border/60 text-xs space-y-1">
                        <span className="font-semibold text-foreground block">
                          AI Reasoning:
                        </span>
                        <p className="text-muted-foreground leading-relaxed">
                          {item.reasoning}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER DISCLAIMER */}
        <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>Static analysis of repository contents; code is not executed.</span>
          </div>

          <span className="text-[11px] font-mono text-muted-foreground">
            Static analysis of repository contents; code is not executed.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
