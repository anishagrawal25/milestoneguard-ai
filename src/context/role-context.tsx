"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "client" | "freelancer";

export interface RoleUser {
  role: UserRole;
  name: string;
  email?: string;
  title: string;
  initials: string;
}

export const CLIENT_USER: RoleUser = {
  role: "client",
  name: "Aarav Mehta",
  title: "Client & Project Owner",
  initials: "AM",
};

export const FREELANCER_USER: RoleUser = {
  role: "freelancer",
  name: "Sara Khan",
  email: "sb-1nae650838145@business.example.com",
  title: "Full-Stack Engineer",
  initials: "SK",
};

interface RoleContextType {
  role: UserRole;
  user: RoleUser;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("client");

  useEffect(() => {
    const saved = getCookie("mg_role") as UserRole | null;
    if (saved === "client" || saved === "freelancer") {
      setRoleState(saved);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    setCookie("mg_role", newRole);
  };

  const toggleRole = () => {
    const next = role === "client" ? "freelancer" : "client";
    setRole(next);
  };

  const user = role === "client" ? CLIENT_USER : FREELANCER_USER;

  return (
    <RoleContext.Provider value={{ role, user, setRole, toggleRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}
