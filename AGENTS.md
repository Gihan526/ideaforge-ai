# AGENTS.md

## Project overview

This is an idea-management web application. Authenticated users can:

* Create, update, and delete ideas
* Move ideas between workflow statuses
* Have the AI improve an idea's content
* Generate a system-design graph from an idea, for the user to work from
* Break the project down into smaller tasks

## Stack

* Next.js (App Router)
* TypeScript
* Drizzle ORM
* shadcn/ui
* Package manager: bun (see `bun.lockb` — do not use npm or yarn)

## Before making changes

1. Inspect the relevant files first.
2. If you need documentation for a library or API you're about to touch, fetch only the specific pages relevant to that library/API via the context7 MCP. Do not bulk-load unrelated docs.
3. Follow the existing patterns in nearby code.

## When making changes

* Keep changes focused on the requested task. Do not modify unrelated code.
* Reuse existing components and utilities where appropriate.
* Preserve existing authentication and data-ownership checks — every read/write on an idea must remain scoped to the requesting user.
* If a file you're already editing contains deprecated APIs or patterns, upgrade them to the current recommended approach (use context7 to confirm what's current). Do not go hunting for deprecated code elsewhere in the codebase as a separate task.
* Use bun for all commands (`bun install`, `bun run <script>`, etc.).

## After making changes

* Run only the checks relevant to the files you changed (see `package.json` for available scripts, e.g. lint/typecheck).
* Do not run tests.

## Key locations

* Drizzle schema: `lib/db/schema.ts`
* DB migration command: `bun run db:push`
* Auth implementation: `better-auth` — config at `lib/auth.ts`, client at `lib/auth-client.ts`
