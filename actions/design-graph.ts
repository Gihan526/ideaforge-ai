"use server";

import {
  generateDesignGraph,
  type DesignGraph,
} from "@/actions/generate-design";

export type DesignResult =
  | { status: "ok"; graph: DesignGraph; cached: boolean }
  | { status: "error"; error: string };

export type DesignInput = {
  title: string;
  description: string | null;
  cachedGraph?: DesignGraph | null;
};

export async function getOrCreateDesignGraph(
  input: DesignInput,
): Promise<DesignResult> {
  if (input.cachedGraph && typeof input.cachedGraph === "object") {
    return {
      status: "ok",
      graph: input.cachedGraph,
      cached: true,
    };
  }

  try {
    const graph = await generateDesignGraph(
      input.title,
      input.description ?? "",
    );
    if (!graph.nodes.length) {
      return { status: "error", error: "The AI returned an empty design." };
    }
    return { status: "ok", graph, cached: false };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Failed to generate design",
    };
  }
}

export async function regenerateDesignGraph(
  input: DesignInput,
): Promise<DesignResult> {
  try {
    const graph = await generateDesignGraph(
      input.title,
      input.description ?? "",
    );
    if (!graph.nodes.length) {
      return { status: "error", error: "The AI returned an empty design." };
    }
    return { status: "ok", graph, cached: false };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Failed to regenerate design",
    };
  }
}
