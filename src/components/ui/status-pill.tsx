import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock, DollarSign, Send, Sparkles, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type PillVariant =
  | "met"
  | "partial"
  | "missing"
  | "created"
  | "funded"
  | "submitted"
  | "verified"
  | "approved"
  | "paidout"
  | "revision";

interface StatusPillProps {
  variant: PillVariant;
  label?: string;
  className?: string;
}

export function StatusPill({ variant, label, className }: StatusPillProps) {
  switch (variant) {
    case "met":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800",
            className
          )}
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>{label || "Met"}</span>
        </span>
      );
    case "partial":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800",
            className
          )}
        >
          <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          <span>{label || "Partial"}</span>
        </span>
      );
    case "missing":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800",
            className
          )}
        >
          <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
          <span>{label || "Missing"}</span>
        </span>
      );
    case "funded":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800",
            className
          )}
        >
          <DollarSign className="h-3 w-3 text-teal-600 dark:text-teal-400" />
          <span>{label || "Funded via PayPal"}</span>
        </span>
      );
    case "verified":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800",
            className
          )}
        >
          <Sparkles className="h-3 w-3 text-violet-600 dark:text-violet-400" />
          <span>{label || "AI Verified"}</span>
        </span>
      );
    case "paidout":
    case "approved":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800",
            className
          )}
        >
          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>{label || "Paid Out"}</span>
        </span>
      );
    case "revision":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800",
            className
          )}
        >
          <RotateCcw className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          <span>{label || "Revision Requested"}</span>
        </span>
      );
    case "submitted":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800",
            className
          )}
        >
          <Send className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
          <span>{label || "Submitted"}</span>
        </span>
      );
    case "created":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700",
            className
          )}
        >
          <Clock className="h-3 w-3 text-slate-500" />
          <span>{label || "Draft / Created"}</span>
        </span>
      );
  }
}

