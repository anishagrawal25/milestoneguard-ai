import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, MilestoneStatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Activity,
  FileCheck2,
  Lock,
  RotateCcw,
  Sparkles,
  FileCode2,
  AlertTriangle,
} from "lucide-react";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      milestones: {
        orderBy: { order: "asc" },
        include: {
          submissions: {
            orderBy: { createdAt: "desc" },
            include: {
              verifications: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
          },
          payouts: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project as any} />;
}
