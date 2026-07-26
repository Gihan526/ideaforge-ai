"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateDesignGraph,
  type DesignGraph,
} from "@/actions/generate-design";

export type DesignResult =
  | { status: "ok"; graph: DesignGraph; cached: boolean }
  | { status: "error"; error: string };

export async function getOrCreateDesignGraph(
  ideaId: number,
): Promise<DesignResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { status: "error", error: "Unauthorized" };

  const rows = await db
    .select({
      ideaId: ideas.ideaId,
      title: ideas.title,
      description: ideas.description,
      designGraph: ideas.designGraph,
    })
    .from(ideas)
    .where(and(eq(ideas.ideaId, ideaId), eq(ideas.userId, session.user.id)))
    .limit(1);

  const idea = rows[0];
  if (!idea) return { status: "error", error: "Idea not found" };

  if (idea.designGraph && typeof idea.designGraph === "object") {
    return {
      status: "ok",
      graph: idea.designGraph as unknown as DesignGraph,
      cached: true,
    };
  }

  try {
    const graph = await generateDesignGraph(
      idea.title,
      idea.description ?? "",
    );
    if (!graph.nodes.length) {
      return { status: "error", error: "The AI returned an empty design." };
    }
    await db
      .update(ideas)
      .set({ designGraph: graph })
      .where(and(eq(ideas.ideaId, ideaId), eq(ideas.userId, session.user.id)));
    return { status: "ok", graph, cached: false };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Failed to generate design",
    };
  }
}

export async function regenerateDesignGraph(
  ideaId: number,
): Promise<DesignResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { status: "error", error: "Unauthorized" };

  const rows = await db
    .select({
      ideaId: ideas.ideaId,
      title: ideas.title,
      description: ideas.description,
    })
    .from(ideas)
    .where(and(eq(ideas.ideaId, ideaId), eq(ideas.userId, session.user.id)))
    .limit(1);

  const idea = rows[0];
  if (!idea) return { status: "error", error: "Idea not found" };

  try {
    const graph = await generateDesignGraph(
      idea.title,
      idea.description ?? "",
    );
    if (!graph.nodes.length) {
      return { status: "error", error: "The AI returned an empty design." };
    }
    await db
      .update(ideas)
      .set({ designGraph: graph })
      .where(and(eq(ideas.ideaId, ideaId), eq(ideas.userId, session.user.id)));
    return { status: "ok", graph, cached: false };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Failed to generate design",
    };
  }
}
