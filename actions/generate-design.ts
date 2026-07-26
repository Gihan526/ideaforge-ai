"use server";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENCODE_API_KEY,
  baseURL: "https://opencode.ai/zen/go/v1",
});

export type DesignNode = {
  id: string;
  label: string;
  tier: string;
  shape: "rectangle" | "ellipse" | "cloud" | "diamond" | "hexagon";
};

export type DesignEdge = {
  from: string;
  to: string;
  label?: string;
};

export type TechStackItem = {
  name: string;
  category: "language" | "framework" | "database" | "service" | "tool" | "library";
  pricing: "free" | "paid" | "freemium";
  freeAlternative?: string;
  description?: string;
};

export type DesignGraph = {
  summary: string;
  nodes: DesignNode[];
  edges: DesignEdge[];
  techStack: TechStackItem[];
};

const SYSTEM_PROMPT = `You design production system architectures. Given an idea, output STRICT JSON only — no prose, no fences.

Schema:
{
  "summary": "<one-line>",
  "nodes": [
    { "id": "<kebab>", "label": "<2-3 words>", "tier": "<client|edge|gateway|service|worker|queue|cache|data|external>", "shape": "<rectangle|ellipse|cloud|diamond|hexagon>" }
  ],
  "edges": [
    { "from": "<id>", "to": "<id>", "label": "<1-2 words>" }
  ],
  "techStack": [
    { "name": "<Tech>", "category": "<language|framework|database|service|tool|library>", "pricing": "<free|paid|freemium>", "description": "<1 short sentence>", "freeAlternative": "<only for paid/freemium, else omit>" }
  ]
}

Rules:
- 8 to 12 nodes. Be concise.
- Tier order: client → edge → gateway → service → worker → queue → cache → data → external.
- Shapes: ellipse=database, cloud=3rd-party, hexagon=cache, diamond=gateway, rectangle=everything else.
- Use real names: "Postgres", "Redis", "Kafka", "S3", "CloudFront", "API Gateway", "Auth Service", etc.
- Every node must connect to at least one edge.
- 6 to 12 techStack items. Cover languages, frameworks, databases, and key services.
- pricing: "free" for open-source / free tier, "paid" for commercial (suggest a freeAlternative), "freemium" for services with both free and paid tiers.
- For paid/freemium items, ALWAYS include "freeAlternative" naming a real free option (e.g. Auth0 → Supabase Auth, AWS S3 → Cloudflare R2 or MinIO, SendGrid → Resend free tier).
- Output ONLY the JSON object.`;

function extractJson(content: string): DesignGraph {
  let trimmed = content.trim();
  if (trimmed.startsWith("```")) {
    trimmed = trimmed
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?\s*```\s*$/i, "");
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response did not contain a JSON object");
  }
  const parsed: Record<string, unknown> = JSON.parse(trimmed.slice(start, end + 1));
  const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
  const nodes: DesignNode[] = rawNodes
    .filter((n: unknown): n is Record<string, unknown> => !!n && typeof n === "object")
    .map((n: Record<string, unknown>) => {
      const rawShape = String(n.shape ?? "rectangle").toLowerCase();
      const shape: DesignNode["shape"] =
        rawShape === "ellipse" ||
        rawShape === "cloud" ||
        rawShape === "diamond" ||
        rawShape === "hexagon"
          ? rawShape
          : "rectangle";
      return {
        id: String(n.id ?? "").trim(),
        label: String(n.label ?? n.id ?? "").trim(),
        tier: String(n.tier ?? "service").trim().toLowerCase(),
        shape,
      };
    })
    .filter((n: DesignNode) => n.id && n.label);

  const validIds = new Set(nodes.map((n) => n.id));
  const rawEdges = Array.isArray(parsed.edges) ? parsed.edges : [];
  const edges: DesignEdge[] = rawEdges
    .filter((e: unknown): e is Record<string, unknown> => !!e && typeof e === "object")
    .map((e: Record<string, unknown>) => ({
      from: String(e.from ?? "").trim(),
      to: String(e.to ?? "").trim(),
      label: typeof e.label === "string" ? e.label : undefined,
    }))
    .filter((e: DesignEdge) => validIds.has(e.from) && validIds.has(e.to));

  const rawStack = Array.isArray(parsed.techStack) ? parsed.techStack : [];
  const validCategories = new Set([
    "language",
    "framework",
    "database",
    "service",
    "tool",
    "library",
  ]);
  const validPricing = new Set(["free", "paid", "freemium"]);
  const techStack: TechStackItem[] = rawStack
    .filter((t: unknown): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t: Record<string, unknown>) => {
      const categoryRaw = String(t.category ?? "tool").toLowerCase();
      const pricingRaw = String(t.pricing ?? "free").toLowerCase();
      const category = (validCategories.has(categoryRaw) ? categoryRaw : "tool") as TechStackItem["category"];
      const pricing = (validPricing.has(pricingRaw) ? pricingRaw : "free") as TechStackItem["pricing"];
      return {
        name: String(t.name ?? "").trim(),
        category,
        pricing,
        freeAlternative:
          typeof t.freeAlternative === "string" && t.freeAlternative.trim()
            ? t.freeAlternative.trim()
            : undefined,
        description:
          typeof t.description === "string" && t.description.trim()
            ? t.description.trim()
            : undefined,
      };
    })
    .filter((t) => t.name.length > 0);

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    nodes,
    edges,
    techStack,
  };
}

export async function generateDesignGraph(
  title: string,
  description: string,
): Promise<DesignGraph> {
  const userPrompt = `Idea title: ${title}\n\nIdea description:\n${description && description.trim().length > 0 ? description : "(no description provided)"}`;

  const response = await client.chat.completions.create({
    model: "deepseek-v4-flash",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content ?? "";
  if (!content) {
    throw new Error("LLM returned an empty response");
  }
  return extractJson(content);
}
