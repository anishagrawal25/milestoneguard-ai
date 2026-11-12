import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type Role = "client" | "freelancer";

export function getActiveRole(req?: Request): Role {
  // First check cookie header in Request if provided
  if (req) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/mg_role=([^;]+)/);
    if (match && (match[1] === "client" || match[1] === "freelancer")) {
      return match[1] as Role;
    }
  }

  // Next.js cookies() API
  try {
    const cookieStore = cookies();
    const roleCookie = cookieStore.get("mg_role")?.value;
    if (roleCookie === "client" || roleCookie === "freelancer") {
      return roleCookie as Role;
    }
  } catch {
    // If called outside server request context
  }

  return "client"; // Default persona
}

export function enforceRole(requiredRole: Role, req?: Request): NextResponse | null {
  const currentRole = getActiveRole(req);
  if (currentRole !== requiredRole) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden: Action requires '${requiredRole}' role, but your active session is '${currentRole}'. Switch your role in the top header to proceed.`,
        activeRole: currentRole,
        requiredRole,
      },
      { status: 403 }
    );
  }
  return null;
}
