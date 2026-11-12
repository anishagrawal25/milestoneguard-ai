"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, RotateCcw, Check, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function Footer() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      const res = await fetch("/api/seed/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Demo data reset successfully!", {
          description: "Projects, milestones, and verifications restored to initial state.",
        });
        router.refresh();
      } else {
        toast.error("Failed to reset demo data");
      }
    } catch (e) {
      toast.error("Network error resetting data");
    } finally {
      setResetting(false);
    }
  };

  return (
    <footer className="mt-auto border-t border-border/80 bg-background/50 py-10 text-xs text-muted-foreground transition-colors">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2 max-w-md text-center md:text-left">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>MilestoneGuard AI</span>
          </div>
          <p className="leading-relaxed">
            Work gets verified against what was promised. Payments move forward with evidence, not guesswork.
          </p>
          <p className="text-[11px] text-muted-foreground/80 border-l-2 border-indigo-500/40 pl-2 mt-1">
            <strong className="text-foreground">Payment release notice:</strong> MilestoneGuard operates via platform merchant capture and conditional PayPal payouts upon client approval. It is not an escrow service.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDemo}
            loading={resetting}
            className="rounded-xl border-dashed hover:border-solid hover:bg-secondary text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset demo data
          </Button>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground/60">PayPal AI Hackathon</span>
            <Link
              href="https://developer.paypal.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit PayPal Developer Documentation"
              className="hover:text-foreground inline-flex items-center gap-1"
            >
              PayPal Docs
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
