# My code style

Portable style guide — drop into any TS / React / Next.js project. Match these habits when writing or editing my code. Nothing here is project-specific.

## Naming
- Components: PascalCase, kebab-case filenames — `add-ideas.tsx` → `AddIdeas`.
- Hooks: `use` prefix, camelCase filenames — `useClickOutside.ts`.
- Shared constants: camelCase, often a `const` options array + a matching label map.
- DB columns: snake_case in the DB, camelCase in TS.

## Folder structure
- `components/` for shared components, `components/ui/` for primitives.
- `lib/` for cross-cutting setup (auth, db, utils). `hooks/` for client hooks. `actions/` for server actions.
- Always import via a path alias (`@/*`), never relative `../..` chains.

## How I structure a file (top to bottom)
1. Directive first when needed — `"use client"` / `"use server"`.
2. Imports — external packages, then internal `@/` imports.
3. Inline `type` definitions (props/data) at the top of the file, not a shared `types/` dir.
4. The function/component.
5. Export: I use both `export default X;` at the bottom AND inline `export function`. Pick whichever the file/neighbors already use — don't mix within one file.

## Async
- `async`/`await` only. No `.then()` chains.

## Error handling
- In server code: validate inputs, then `throw new Error("plain message")`. No try/catch wrapping, no custom error classes unless there's a real reason.
- Auth-guarded server code opens by fetching the session and branching immediately: actions **throw** on no session, pages **redirect**.

## Comments
- Sparse. Only comment a non-obvious gotcha (an environment quirk, a workaround, a "why not the obvious thing").
- No narrating comments on self-explanatory code.
- Don't leave commented-out dead code behind — delete it.

## Styling (Tailwind)
- Utility classes inline on the element.
- Use the `cn()` helper (`clsx` + `tailwind-merge`) to compose conditional/variant classes — prefer it over hand-concatenated template-literal ternaries.
- Data-driven variants (map over an options array) beat stacked `a ? x : b ? y : z` ternaries in JSX.

## Types
- Lean on inference; add explicit types at boundaries (props, function args, exported constants).
- `as const` for literal option arrays, then derive the union type from them.

## Testing
- I don't write tests by default. Don't scaffold a test framework unprompted — verify with `dev` / `build` instead.

## Things I avoid
- Relative import chains, `.then()` chains, custom error classes, commented-out dead code, hand-built class strings when `cn()` fits, premature abstraction.
