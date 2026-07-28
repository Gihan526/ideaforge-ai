"use server";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

export type GeneratedTodo = {
  title: string;
  description?: string;
  steps: string[];
};

export type GeneratedTodos = {
  todos: GeneratedTodo[];
};

const SYSTEM_PROMPT = `You break a product idea into concrete, ordered implementation tasks. Given an idea and (optionally) its system design, output STRICT JSON only — no prose, no fences.

Schema:
{
  "todos": [
    {
      "title": "<task>",
      "description": "<1 sentence summary>",
      "steps": ["<step>", "<step>", ...]
    }
  ]
}

Rules:
- 5 to 10 tasks. Order them in the order a developer would actually tackle them (foundation → data → services → frontend → polish).
- title: short imperative phrase, 3-8 words ("Set up Postgres schema", "Build the auth API", "Wire up the predictor service"). No numbering, no "Step 1:" prefixes.
- description: 1 short sentence explaining what to actually do for that step. Reference specific files, tables, endpoints, or components when relevant. No fluff.
- steps: 3 to 8 numbered actions the user must take to complete this task. Write them as imperative instructions the user can follow one-by-one ("Run \`bunx drizzle-kit push\` to apply the schema", "Create app/api/auth/login/route.ts exporting async function POST that takes { email, password } and returns a JWT", "Add a CHECK constraint on bets.stake > 0"). Reference exact file paths, function names, table names, env vars, and command names. Each step is one thing to do.
- The user is the coder: do not tell them to "design" or "plan" — give them concrete code-level actions.
- Output ONLY the JSON object.`;

function extractJson(content: string): GeneratedTodos {
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
  const raw = Array.isArray(parsed.todos) ? parsed.todos : [];
  const todos: GeneratedTodo[] = raw
    .filter((t: unknown): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => {
      const stepsRaw = Array.isArray(t.steps) ? t.steps : [];
      const steps = stepsRaw
        .filter((s: unknown): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return {
        title: String(t.title ?? "").trim(),
        description:
          typeof t.description === "string" && t.description.trim()
            ? t.description.trim()
            : undefined,
        steps,
      };
    })
    .filter((t) => t.title.length > 0);
  return { todos };
}

export async function generateTodos(
  title: string,
  description: string,
  designGraph?: { summary: string; nodes: Array<{ label: string; tier: string }> },
): Promise<GeneratedTodos> {
  const componentList = designGraph
    ? designGraph.nodes.map((n) => `- ${n.label} (${n.tier})`).join("\n")
    : "(no design available)";

  const userPrompt = `Idea title: ${title}

Idea description:
${description && description.trim().length > 0 ? description : "(no description provided)"}

System components:
${componentList}

${designGraph?.summary ? `Summary: ${designGraph.summary}` : ""}`;

  const response = await client.chat.completions.create({
    model: process.env.MISTRAL_MODEL ?? "open-mistral-nemo",
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
