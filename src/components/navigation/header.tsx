"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Plus, LayoutDashboard, Sparkles, Menu, X, Info } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/context/role-context";

export function Header() {
  const pathname = usePathname();
  const { role } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // In production / mock mode from env
  const paymentMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || "mock";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-all">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Brand & Mode */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 text-white shadow-sm shadow-indigo-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
                MilestoneGuard <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">AI</span>
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                PayPal AI Hackathon
              </span>
            </div>
          </Link>

          {/* Payment Mode Badge (Essential for Hackathon judges) */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-teal-200/60 dark:border-teal-800/60 bg-teal-50/60 dark:bg-teal-950/40 text-[11px] text-teal-800 dark:text-teal-300 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span>{paymentMode.toUpperCase()} MODE</span>
            <span className="text-teal-600 dark:text-teal-400 font-normal">
              (PayPal Orders & Payouts)
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              pathname === "/dashboard"
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          {role === "client" && (
            <Link
              href="/projects/new"
              className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                pathname === "/projects/new"
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Plus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>New Project</span>
            </Link>
          )}
        </nav>

        {/* Right side controls: Role Switcher, Dark mode, Mobile Toggle */}
        <div className="flex items-center gap-3">
          <RoleSwitcher />
          <ThemeToggle />

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-muted-foreground">
            <span>Payment Mode:</span>
            <Badge variant="funded">{paymentMode.toUpperCase()} MODE</Badge>
          </div>
          <div className="flex flex-col space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            {role === "client" && (
              <Link
                href="/projects/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary text-indigo-600 dark:text-indigo-400"
              >
                <Plus className="h-4 w-4" />
                Create New Project
              </Link>
            )}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary"
            >
              <ShieldCheck className="h-4 w-4" />
              Landing Page
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
