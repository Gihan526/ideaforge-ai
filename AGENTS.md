<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Code style

Match the existing code. The conventions below are observed across the repo, not aspirational.

## Naming
- Components: PascalCase, kebab-case filenames — `add-ideas.tsx` → `AddIdeas`, `status-select.tsx` → `StatusSelect`.
- Hooks: `use` prefix, camelCase filenames — `hooks/useClickOutside.ts`, `hooks/useEscapeKey.ts`.
- Shared constants: camelCase — `ideaStatusOptions`, `ideaStatusLabels` (`status-select.tsx`).
- DB: snake_case column names mapped to camelCase TS keys — `text("user_id")` → `userId` (`lib/db/schema.ts`).

## Folder structure
- `app/` — routes (App Router). `components/` — shared components; `components/ui/` — Radix/shadcn primitives.
- `lib/` — `auth.ts`, `auth-client.ts`, `db/`, `utils.ts`. `hooks/` — client hooks. `actions/` — server actions.
- Import with the `@/*` alias, never relative `../..` (`tsconfig.json` maps `@/*` → `./*`).

## File top-to-bottom
Directive (`"use client"` / `"use server"`) → imports → inline `type` defs → the function.
- Inconsistent export style: `function X() {}` then `export default X;` at the bottom (`add-ideas.tsx`, `header.tsx`, `app/dashboard/page.tsx`) vs. inline `export function` / `export default function` (`status-select.tsx`, `app/page.tsx`, `app/layout.tsx`). Follow the file you're editing.
- Prop and data types are declared inline at the top of the file, not in a shared `types/` dir (`add-ideas.tsx` `type Idea`, `status-select.tsx` `StatusSelectProps`).

## Async & auth
- `async`/`await` only — no `.then()` chains anywhere.
- Server-side auth guard is the standard opener: `await auth.api.getSession({ headers: await headers() })` then branch on `if (!session)`. Server actions **throw** (`throw new Error("Unauthorized")`, `actions/action.ts`); pages **redirect** (`redirect("/")`, `app/dashboard/page.tsx`).

## Error handling
- Server actions validate then `throw new Error("message")` with a plain string — no try/catch, no custom error classes (`actions/action.ts:12,20`). No client-side error boundaries yet.

## Comments
- Sparse. Add a comment only to explain a non-obvious gotcha — e.g. the Supabase pooler port swap in `drizzle.config.ts` and `lib/db/index.ts` (`:6543` → `:5432`).
- Avoid: commented-out dead code left in files (`add-ideas.tsx:10,19`, `lib/auth.ts:7-9`) — a recurring habit worth breaking, not copying.

## Styling
- Tailwind utility classes inline. Colors are hardcoded hex from a Notion-like palette (`#37352f`, `#e3e2e0`, `#f7f6f3`), not theme tokens.
- A `cn()` helper exists (`lib/utils.ts`) but is underused. Prefer it over hand-concatenated template literals — see before/after below.

## Testing
- No tests, no test runner. Don't invent a framework; if a change needs verification, run `pnpm dev` / `pnpm build`.

## Known inconsistency to fix, not spread
Status values are encoded two ways: the schema defaults to `not_started` (`schema.ts:91`) while actions and `add-ideas.tsx` store display strings like `"Not started"`. `status-select.tsx` already defines the correct `value`/`label` map — reuse it rather than adding a third variant.

## Before / after (real repo code)
Ternary-stacked, hand-concatenated classes in `add-ideas.tsx`:
```tsx
// before — add-ideas.tsx
<div className={`mb-2 inline-flex items-center gap-1.5 rounded-full ${badgeLabel === "In progress" ? "bg-[#C1DEF5] text-[#075985]" : badgeLabel === "Completed" ? "bg-[#CFE1D6] text-[#166534]" : "bg-[#E1DFDC] text-[#4B5563]"} px-2.5 py-1 text-xs`}>
```
The pattern already established in `status-select.tsx` — data-driven options + `cn()`:
```tsx
// after — status-select.tsx
<SelectTrigger
  className={cn(
    "h-8 w-full rounded-lg border-[#e3e2e0] bg-white px-2.5 text-xs font-normal text-[#37352f]",
    triggerClassName,
  )}
>
```
