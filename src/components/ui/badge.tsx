import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border border-border",
        // Fintech Status Variants
        met: "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium",
        partial: "border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium",
        missing: "border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium",
        funded: "border-teal-200 dark:border-teal-800/40 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-medium",
        verified: "border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-medium",
        paidout: "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium",
        revision: "border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium",
        created: "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function MilestoneStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Created":
      return <Badge variant="created">Draft / Created</Badge>;
    case "Funded":
      return <Badge variant="funded">Funded with PayPal</Badge>;
    case "Submitted":
      return <Badge variant="verified">Work Submitted</Badge>;
    case "Verified":
      return <Badge variant="verified">AI Verified</Badge>;
    case "Approved":
      return <Badge variant="paidout">Approved</Badge>;
    case "PaidOut":
      return <Badge variant="paidout">Paid Out</Badge>;
    case "RevisionRequested":
      return <Badge variant="revision">Revision Requested</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export { Badge, badgeVariants };
