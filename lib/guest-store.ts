export type GuestTodo = {
  todoId: number;
  title: string;
  description: string | null;
  steps: string[];
  completed: boolean;
  order: number;
};

export type GuestDesignGraph = {
  summary: string;
  nodes: unknown[];
  edges: unknown[];
  techStack: unknown[];
};

export type GuestIdea = {
  ideaId: number;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  designGraph: GuestDesignGraph | null;
  todos: GuestTodo[];
};

type GuestStore = {
  createdAt: number;
  ideas: GuestIdea[];
};

const STORAGE_KEY = "ideahub.guest.v1";
export const GUEST_MAX_IDEAS = 5;
export const GUEST_EXPIRY_DAYS = 5;
const EXPIRY_MS = GUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function read(): GuestStore | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestStore>;
    if (
      typeof parsed?.createdAt !== "number" ||
      !Array.isArray(parsed.ideas)
    ) {
      return null;
    }
    if (Date.now() - parsed.createdAt > EXPIRY_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed as GuestStore;
  } catch {
    return null;
  }
}

function write(store: GuestStore): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    for (const fn of listeners) fn();
  } catch {
    // ignore quota or serialization errors
  }
}

function ensureStore(): GuestStore {
  const existing = read();
  if (existing) return existing;
  const fresh: GuestStore = { createdAt: Date.now(), ideas: [] };
  write(fresh);
  return fresh;
}

function emit() {
  for (const fn of listeners) fn();
}

export function subscribeToGuestStore(fn: () => void): () => void {
  listeners.add(fn);
  if (isBrowser()) {
    window.addEventListener("storage", fn);
  }
  return () => {
    listeners.delete(fn);
    if (isBrowser()) {
      window.removeEventListener("storage", fn);
    }
  };
}

export function getGuestStoreSnapshot(): GuestStore {
  return read() ?? { createdAt: Date.now(), ideas: [] };
}

export function getGuestIdeas(): GuestIdea[] {
  return ensureStore().ideas;
}

export function getGuestIdeaCount(): number {
  return getGuestIdeas().length;
}

export function isAtGuestLimit(): boolean {
  return getGuestIdeaCount() >= GUEST_MAX_IDEAS;
}

export function getGuestDaysRemaining(): number {
  const store = read();
  if (!store) return GUEST_EXPIRY_DAYS;
  const remainingMs = EXPIRY_MS - (Date.now() - store.createdAt);
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

let idCounter = 0;
function nextId(): number {
  idCounter = (idCounter + 1) % 1000;
  return -1 * (Date.now() * 1000 + idCounter);
}

export type AddGuestIdeaInput = {
  title: string;
  description: string | null;
  status: string;
};

export type AddGuestIdeaResult =
  | { ok: true; idea: GuestIdea }
  | { ok: false; reason: "limit" };

export function addGuestIdea(input: AddGuestIdeaInput): AddGuestIdeaResult {
  const store = ensureStore();
  if (store.ideas.length >= GUEST_MAX_IDEAS) {
    return { ok: false, reason: "limit" };
  }
  const idea: GuestIdea = {
    ideaId: nextId(),
    title: input.title,
    description: input.description,
    status: input.status,
    createdAt: new Date().toISOString(),
    designGraph: null,
    todos: [],
  };
  store.ideas.push(idea);
  write(store);
  return { ok: true, idea };
}

export function getGuestIdea(ideaId: number): GuestIdea | null {
  return getGuestIdeas().find((i) => i.ideaId === ideaId) ?? null;
}

export function updateGuestIdea(
  ideaId: number,
  updates: Partial<Omit<GuestIdea, "ideaId">>,
): GuestIdea | null {
  const store = ensureStore();
  const idx = store.ideas.findIndex((i) => i.ideaId === ideaId);
  if (idx === -1) return null;
  store.ideas[idx] = { ...store.ideas[idx], ...updates };
  write(store);
  return store.ideas[idx];
}

export function deleteGuestIdea(ideaId: number): void {
  const store = ensureStore();
  store.ideas = store.ideas.filter((i) => i.ideaId !== ideaId);
  write(store);
}

export function setGuestDesignGraph(
  ideaId: number,
  designGraph: GuestDesignGraph | null,
): GuestIdea | null {
  return updateGuestIdea(ideaId, { designGraph });
}

export function setGuestTodos(
  ideaId: number,
  todos: GuestTodo[],
): GuestIdea | null {
  return updateGuestIdea(ideaId, { todos });
}

export function toggleGuestTodo(
  ideaId: number,
  todoId: number,
  completed: boolean,
): GuestTodo | null {
  const idea = getGuestIdea(ideaId);
  if (!idea) return null;
  const idx = idea.todos.findIndex((t) => t.todoId === todoId);
  if (idx === -1) return null;
  const updated: GuestTodo = { ...idea.todos[idx], completed };
  const nextTodos = idea.todos.slice();
  nextTodos[idx] = updated;
  updateGuestIdea(ideaId, { todos: nextTodos });
  return updated;
}

export function clearGuestStore(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  emit();
}
