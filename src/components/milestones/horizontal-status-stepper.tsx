"use client";

import React from "react";
import { Check, Circle, Clock, Sparkles, DollarSign, Send, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface HorizontalStatusStepperProps {
  currentStatus: string;
}

const STEPS = [
  { id: "Created", label: "Created", icon: Circle },
  { id: "Funded", label: "Funded", icon: DollarSign },
  { id: "Submitted", label: "Submitted", icon: Send },
  { id: "Verified", label: "AI Verified", icon: Sparkles },
  { id: "Approved", label: "Approved", icon: Check },
  { id: "PaidOut", label: "Paid Out", icon: DollarSign },
];

export function HorizontalStatusStepper({ currentStatus }: HorizontalStatusStepperProps) {
  const isRevision = currentStatus === "RevisionRequested";

  // Map status to index in progression
  const getStepIndex = (status: string) => {
    switch (status) {
      case "Created":
        return 0;
      case "Funded":
        return 1;
      case "Submitted":
        return 2;
      case "Verified":
        return 3;
      case "Approved":
        return 4;
      case "PaidOut":
        return 5;
      case "RevisionRequested":
        return 2; // Revision returns to submission phase
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-card overflow-x-auto">
      {isRevision && (
        <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong>Revision requested by client:</strong> Freelancer must make requested updates and resubmit repository for verification.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between min-w-[620px]">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex || currentStatus === "PaidOut";
          const isCurrent = idx === currentIndex && currentStatus !== "PaidOut";
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step item */}
              <div className="flex flex-col items-center relative group">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs transition-all duration-300",
                    isDone
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25"
                      : isCurrent
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-sm shadow-indigo-500/30 scale-105"
                      : "bg-secondary text-muted-foreground border border-border/70"
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <span
                  className={cn(
                    "mt-2 text-xs font-semibold whitespace-nowrap transition-colors",
                    isDone
                      ? "text-foreground"
                      : isCurrent
                      ? "text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line between steps */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300",
                    idx < currentIndex
                      ? "bg-emerald-500"
                      : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
