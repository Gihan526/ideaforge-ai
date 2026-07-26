"use client";

import { useEffect, useMemo, useState } from "react";
import type { TechStackItem } from "@/actions/generate-design";
import { getOrCreateDesignGraph } from "@/actions/design-graph";

type Idea = {
  ideaId: number;
};

const CATEGORY_ORDER: TechStackItem["category"][] = [
  "language",
  "framework",
  "database",
  "service",
  "tool",
  "library",
];

const CATEGORY_LABEL: Record<TechStackItem["category"], string> = {
  language: "Languages",
  framework: "Frameworks",
  database: "Databases",
  service: "Services",
  tool: "Tools",
  library: "Libraries",
};

function TechStack({ idea }: { idea: Idea }) {
  const [items, setItems] = useState<TechStackItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ideaKey = idea.ideaId;

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear previous result before fetching
    setItems(null);
    setError(null);
    getOrCreateDesignGraph(ideaKey)
      .then((res) => {
        if (cancelled) return;
        if (res.status === "error") {
          setError(res.error);
        } else {
          setItems(res.graph.techStack ?? []);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load tech stack");
      });
    return () => {
      cancelled = true;
    };
  }, [ideaKey]);

  const grouped = useMemo(() => {
    const map = new Map<TechStackItem["category"], TechStackItem[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const item of items ?? []) {
      map.get(item.category)?.push(item);
    }
    return CATEGORY_ORDER.map((cat) => ({ category: cat, items: map.get(cat) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [items]);

  if (error) {
    return <p className="text-xs text-[#fa4646]">{error}</p>;
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {grouped.map(({ category, items }) => (
        <div key={category}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#9b9a97]">
            {CATEGORY_LABEL[category]}
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <div
                key={item.name}
                className="rounded-lg border border-[#e8e8e6] bg-white px-3 py-1.5 text-sm text-[#37352f]"
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TechStack;
