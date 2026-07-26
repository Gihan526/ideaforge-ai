"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dagre from "dagre";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  type Edge,
  type EdgeMarker,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import {
  Cloud,
  Cog,
  Database,
  Globe,
  ListOrdered,
  Loader,
  Monitor,
  Network,
  RefreshCw,
  Server,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getOrCreateDesignGraph,
  regenerateDesignGraph,
} from "@/actions/design-graph";
import { type DesignGraph } from "@/actions/generate-design";

type Idea = {
  ideaId: number;
  title: string;
  description: string | null;
};

const TIER_COLORS: Record<string, { border: string; fill: string; text: string; chip: string }> = {
  client:   { border: "#0ea5e9", fill: "#e0f2fe", text: "#0c4a6e", chip: "#0ea5e9" },
  edge:     { border: "#a78bfa", fill: "#ede9fe", text: "#4c1d95", chip: "#8b5cf6" },
  gateway:  { border: "#7c3aed", fill: "#ede9fe", text: "#4c1d95", chip: "#7c3aed" },
  service:  { border: "#2563eb", fill: "#dbeafe", text: "#1e3a8a", chip: "#2563eb" },
  worker:   { border: "#f97316", fill: "#ffedd5", text: "#7c2d12", chip: "#f97316" },
  queue:    { border: "#eab308", fill: "#fef9c3", text: "#713f12", chip: "#ca8a04" },
  cache:    { border: "#ef4444", fill: "#fee2e2", text: "#7f1d1d", chip: "#ef4444" },
  data:     { border: "#16a34a", fill: "#dcfce7", text: "#14532d", chip: "#16a34a" },
  external: { border: "#6b7280", fill: "#f3f4f6", text: "#1f2937", chip: "#6b7280" },
};

const TIER_ORDER = [
  "client",
  "edge",
  "gateway",
  "service",
  "worker",
  "queue",
  "cache",
  "data",
  "external",
] as const;

const TIER_ICONS: Record<string, LucideIcon> = {
  client: Monitor,
  edge: Cloud,
  gateway: Network,
  service: Server,
  worker: Cog,
  queue: ListOrdered,
  cache: Zap,
  data: Database,
  external: Globe,
};

const NODE_W = 110;
const NODE_H = 88;
const BOX_SIZE = 56;
const ICON_SIZE = 28;

type ShapeKind = "rectangle" | "ellipse" | "cloud" | "diamond" | "hexagon";

function shapeFor(s: string): ShapeKind {
  switch (s) {
    case "ellipse":
    case "cloud":
    case "diamond":
    case "hexagon":
      return s;
    default:
      return "rectangle";
  }
}

function normalizeTier(t: string): string {
  return (TIER_ORDER as readonly string[]).includes(t) ? t : "external";
}

type ShapeNodeData = {
  label: string;
  tier: string;
  shape: ShapeKind;
  width: number;
  height: number;
  [key: string]: unknown;
};

function ShapeNode({ data }: NodeProps<Node<ShapeNodeData>>) {
  const { label, tier, shape } = data;
  const palette = TIER_COLORS[tier] ?? TIER_COLORS.service;
  const Icon = TIER_ICONS[tier] ?? Server;
  const color = palette.border;
  const w = NODE_W;
  const h = NODE_H;

  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: color,
          border: "none",
          width: 8,
          height: 8,
          top: BOX_SIZE / 2,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: color,
          border: "none",
          width: 8,
          height: 8,
          top: BOX_SIZE / 2,
        }}
      />
      <div className="flex flex-col items-center" style={{ width: w }}>
        {renderShapeBox(shape, color, Icon)}
        <div
          className="mt-1.5 px-1 text-center font-semibold text-[#1f2937] leading-tight"
          style={{ fontSize: 11, maxWidth: w + 12, lineHeight: 1.2 }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function renderShapeBox(shape: ShapeKind, color: string, Icon: LucideIcon) {
  if (shape === "ellipse") {
    return (
      <svg width={BOX_SIZE} height={BOX_SIZE * 0.78} viewBox="0 0 60 47" style={{ display: "block" }}>
        <defs>
          <clipPath id={`cyl-${color.replace("#", "")}`}>
            <path d="M 5 8 L 5 40 Q 5 46 30 46 Q 55 46 55 40 L 55 8 Z" />
          </clipPath>
        </defs>
        <path d="M 5 8 L 5 40 Q 5 46 30 46 Q 55 46 55 40 L 55 8 Z" fill={color} />
        <ellipse cx="30" cy="8" rx="25" ry="6" fill={color} />
        <ellipse cx="30" cy="8" rx="25" ry="6" fill="none" stroke={color} strokeWidth="1.5" />
        <line x1="5" y1="8" x2="5" y2="40" stroke={color} strokeWidth="1.5" />
        <line x1="55" y1="8" x2="55" y2="40" stroke={color} strokeWidth="1.5" />
        <path d="M 5 40 Q 5 46 30 46 Q 55 46 55 40" fill="none" stroke={color} strokeWidth="1.5" />
        <foreignObject x="18" y="14" width="24" height="24">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
            <Icon size={20} color="white" strokeWidth={1.8} />
          </div>
        </foreignObject>
      </svg>
    );
  }
  if (shape === "hexagon") {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          width: BOX_SIZE,
          height: BOX_SIZE,
          background: color,
          clipPath: "polygon(22% 0%, 78% 0%, 100% 50%, 78% 100%, 22% 100%, 0% 50%)",
        }}
      >
        <Icon size={ICON_SIZE} color="white" strokeWidth={1.8} />
      </div>
    );
  }
  if (shape === "diamond") {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          width: BOX_SIZE,
          height: BOX_SIZE,
          background: color,
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        }}
      >
        <Icon size={ICON_SIZE} color="white" strokeWidth={1.8} />
      </div>
    );
  }
  if (shape === "cloud") {
    return (
      <svg width={BOX_SIZE + 8} height={BOX_SIZE * 0.72} viewBox="0 0 100 65" style={{ display: "block" }}>
        <path
          d="M 22 55 Q 6 55 6 40 Q 6 24 22 22 Q 25 6 42 6 Q 58 -2 72 8 Q 90 8 94 24 Q 98 30 98 40 Q 98 55 80 55 Z"
          fill={color}
        />
        <foreignObject x="30" y="14" width="40" height="40">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
            <Icon size={ICON_SIZE} color="white" strokeWidth={1.8} />
          </div>
        </foreignObject>
      </svg>
    );
  }
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: BOX_SIZE,
        height: BOX_SIZE,
        background: color,
        borderRadius: 10,
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
      }}
    >
      <Icon size={ICON_SIZE} color="white" strokeWidth={1.8} />
    </div>
  );
}

const nodeTypes = { shape: ShapeNode };

type LayoutNode = Node<ShapeNodeData>;

function layoutGraph(graph: DesignGraph): {
  nodes: LayoutNode[];
  edges: Edge[];
} {
  const dg = new dagre.graphlib.Graph();
  dg.setDefaultEdgeLabel(() => ({}));
  dg.setGraph({
    rankdir: "LR",
    nodesep: 70,
    ranksep: 130,
    edgesep: 28,
    marginx: 50,
    marginy: 50,
  });

  const validIds = new Set(graph.nodes.map((n) => n.id));
  for (const n of graph.nodes) {
    dg.setNode(n.id, { width: NODE_W, height: NODE_H });
  }
  for (const e of graph.edges) {
    if (!validIds.has(e.from) || !validIds.has(e.to)) continue;
    dg.setEdge(e.from, e.to);
  }
  dagre.layout(dg);

  const nodes: LayoutNode[] = graph.nodes.map((n) => {
    const tier = normalizeTier(n.tier);
    const pos = dg.node(n.id);
    return {
      id: n.id,
      type: "shape",
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: {
        label: n.label,
        tier,
        shape: shapeFor(n.shape),
        width: NODE_W,
        height: NODE_H,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: true,
    };
  });

  const edges: Edge[] = graph.edges
    .filter((e) => validIds.has(e.from) && validIds.has(e.to))
    .map((e, i) => ({
      id: `e-${i}-${e.from}-${e.to}`,
      source: e.from,
      target: e.to,
      type: "step",
      label: e.label,
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 6,
      labelBgStyle: { fill: "#ffffff", fillOpacity: 1 },
      labelStyle: {
        fontSize: 11,
        fontWeight: 600,
        fill: "#374151",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      },
      style: {
        stroke: "#64748b",
        strokeWidth: 1.5,
      },
      markerEnd: {
        type: "arrowclosed" as EdgeMarker["type"],
        color: "#64748b",
        width: 18,
        height: 18,
      },
    }));

  return { nodes, edges };
}

const LOADING_STAGES = [
  "Reading the idea…",
  "Picking the components…",
  "Mapping the data flow…",
  "Drawing the connections…",
  "Polishing the diagram…",
];

const CACHED_STAGE = "Loading saved design…";

function useLoadingStage(active: boolean) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to first stage when loading ends
      setStage(0);
      return;
    }
    const id = window.setInterval(() => {
      setStage((s) => (s + 1) % LOADING_STAGES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [active]);
  return stage;
}

function DesignCanvas({ idea }: { idea: Idea }) {
  const [graph, setGraph] = useState<DesignGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(0);
  const requestIdRef = useRef(0);
  const stage = useLoadingStage(loading && !isCached);

  const ideaKey = idea.ideaId;

  useEffect(() => {
    if (!loading) return;
    startedAtRef.current = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets elapsed timer when loading flips on
    setElapsed(0);
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [loading]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: clear previous result before re-fetching
    setLoading(true);
    setError(null);
    setGraph(null);

    getOrCreateDesignGraph(ideaKey)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        if (res.status === "error") {
          setError(res.error);
          return;
        }
        setGraph(res.graph);
        setIsCached(res.cached);
      })
      .catch((e) => {
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to load design");
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [ideaKey]);

  const handleRegenerate = () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setGraph(null);
    setIsCached(false);

    regenerateDesignGraph(ideaKey)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        if (res.status === "error") {
          setError(res.error);
          return;
        }
        setGraph(res.graph);
        setIsCached(false);
      })
      .catch((e) => {
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to regenerate");
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  };

  const { nodes, edges } = useMemo(
    () => (graph ? layoutGraph(graph) : { nodes: [], edges: [] }),
    [graph],
  );

  return (
    <div className="relative h-full w-full">
      {graph && (
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.12, maxZoom: 1.1, minZoom: 0.2 }}
            minZoom={0.1}
            maxZoom={1.8}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: "smoothstep" }}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            panOnScroll
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick={false}
          >
            <Background
              variant={BackgroundVariant.Cross}
              gap={24}
              size={1.4}
              color="#e2e8f0"
            />
            <Controls
              showInteractive={false}
              className="overflow-hidden! rounded-lg! border! border-[#E3E2E0]! bg-white! shadow-sm! [&>button]:rounded-none! [&>button]:border-b! [&>button]:border-[#E3E2E0]! [&>button:last-child]:border-b-0!"
            />
          </ReactFlow>
        </ReactFlowProvider>
      )}

      {(loading || error) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-3 rounded-xl border border-[#E3E2E0] bg-white p-6 text-center shadow-sm">
            {loading ? (
              <>
                <div className="flex items-center gap-2 text-[#6b6b6b]">
                  {isCached ? null : <Sparkles className="size-4" />}
                  <Loader className="size-4 animate-spin" />
                </div>
                <p className="text-sm font-medium text-[#37352f] transition-opacity">
                  {isCached ? CACHED_STAGE : LOADING_STAGES[stage]}
                </p>
                <p className="text-xs leading-relaxed text-[#9b9a97]">
                  {isCached
                    ? "Pulled from cache"
                    : `${elapsed}s elapsed · first time can take ~60s`}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-[#fa4646]">{error}</p>
                <Button
                  onClick={handleRegenerate}
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                >
                  <RefreshCw className="size-3" /> Try again
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {!loading && !error && graph && isCached && (
        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
          <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] text-[#9b9a97] backdrop-blur-sm">
            from cache
          </span>
        </div>
      )}
    </div>
  );
}

export default DesignCanvas;
