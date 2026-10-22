# Khayargoli Family Tree

Public family-tree application built with Next.js App Router, TypeScript,
Tailwind CSS, Prisma, PostgreSQL, Zod, and Vitest.

## Local setup

Prerequisites:

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer

Install dependencies and configure the database:

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
```

Set `DATABASE_URL` in `.env` to a PostgreSQL database. For development,
seed only the clearly fictional sample data:

```bash
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Phase 1 data model

The initial migration adds:

- `Person` and searchable alternate `PersonName` records
- `Relationship` records with explicit parent-child direction
- Multiple spouse relationships per person, with optional marriage dates and
  end reasons
- `User`, `PersonAccount`, `ChangeRequest`, and `AuditLog`
- Visibility, membership, publication, claim, and review statuses

People can have unknown parents, missing dates, no user account, and no
occupation. Archived people are excluded from active data-access queries.
Relationship writes are admin-only, validated, transactional, and audited.

The seed uses fictional records only and demonstrates remarriage, a deceased
former spouse, and children from different unions.

## Product decisions

The current working default is that anyone may browse, while a person signs
in with Google and requests membership. An admin approves membership before
the person can contribute. This remains an open product decision before
authentication is implemented.

Bulk import is intentionally not included until the initial input format is
known.

## Phase 2 public experience

The public directory is available at `/people`, with server-side search,
pagination, and stable `/people/[id]` profile URLs. Public profile queries use
an explicit field allowlist and include only published relationships to other
public, active people. `/privacy` explains the visibility boundary. The
interactive visualization route at `/tree` uses `@xyflow/react` for a focused,
one-generation view with pan, zoom, fit-to-view, minimap, profile
click-through, and search/jump controls. Parent-child and spouse edges remain
distinct, including multiple spouse relationships. Each branch also includes
a keyboard-friendly linked-list alternative.

The authoritative implementation plan is
`docs/khayargoli-family-tree-plan.md`. Phase 4 is the next phase.
