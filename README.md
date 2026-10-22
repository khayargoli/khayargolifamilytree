# Khayargoli Family Tree

Public family-tree application built with Next.js App Router, TypeScript,
Tailwind CSS, Prisma, PostgreSQL, Zod, and Vitest.

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer (local or hosted)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL
   database you can use for development.

3. Start the development server:

   ```bash
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

Prisma is configured for PostgreSQL. The application schema and first
migration will be added in Phase 1; Phase 0 intentionally does not create
family records or feature data.

## Product decisions

The current working default is that anyone may browse, while a person signs
in with Google and requests membership. An admin approves membership before
the person can contribute. This is still an open product decision and may be
changed before authentication is implemented.

Other Phase 0 defaults follow `docs/khayargoli-family-tree-plan.md`: public
visibility is controlled per person, sensitive information about living people
and minors is private by default, and names support Unicode and alternate
variants.

## Project phases

The authoritative implementation plan is
`docs/khayargoli-family-tree-plan.md`. Only Phase 0 is implemented currently.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
