"use client";

import React from "react";
import { useRole, CLIENT_USER, FREELANCER_USER } from "@/context/role-context";
import { ArrowLeftRight, Check, UserCheck, Shield, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RoleSwitcher() {
  const { role, user, setRole } = useRole();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-muted/60 border border-border/80">
        <button
          onClick={() => setRole("client")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            role === "client"
              ? "bg-white dark:bg-card text-foreground shadow-sm shadow-black/5 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Switch to Client perspective"
        >
          <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
            {CLIENT_USER.initials}
          </div>
          <div className="text-left hidden sm:block">
            <span>{CLIENT_USER.name}</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal ml-1.5">
              (Client)
            </span>
          </div>
          <span className="sm:hidden font-bold">Client</span>
        </button>

        <button
          onClick={() => setRole("freelancer")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            role === "freelancer"
              ? "bg-white dark:bg-card text-foreground shadow-sm shadow-black/5 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Switch to Freelancer perspective"
        >
          <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center font-bold text-[10px]">
            {FREELANCER_USER.initials}
          </div>
          <div className="text-left hidden sm:block">
            <span>{FREELANCER_USER.name}</span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal ml-1.5">
              (Freelancer)
            </span>
          </div>
          <span className="sm:hidden font-bold">Freelancer</span>
        </button>
      </div>
    </div>
  );
}
