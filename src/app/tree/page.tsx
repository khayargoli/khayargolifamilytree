import Link from "next/link";
import { Suspense } from "react";

import {
  getPublicTreeView,
  listPublicPeopleForTree,
} from "@/lib/public-data";

import FamilyTreeView, {
  type TreeViewData,
} from "./family-tree-view";

export const metadata = {
  title: "Family tree",
  description: "Explore the Khayargoli family tree.",
};

export default function TreePage({
  searchParams,
}: {
  searchParams: Promise<{ root?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:px-10">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Family tree
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
          Explore one branch at a time
        </h1>
        <p className="mt-4 leading-7 text-stone-600">
          Start with a person, then follow parents, children, and each spouse
          relationship. The focused view keeps larger family histories
          readable.
        </p>
      </div>
      <Suspense fallback={<TreeSkeleton />}>
        <TreeContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function TreeContent({
  searchParams,
}: {
  searchParams: Promise<{ root?: string }>;
}) {
  const { root } = await searchParams;
  const [tree, people] = await Promise.all([
    getPublicTreeView(root),
    listPublicPeopleForTree(),
  ]);

  if (!tree) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-stone-300 p-8 text-stone-600">
        No public family profiles are available yet. A public profile is
        needed to start the tree.
      </div>
    );
  }

  return (
    <>
      <FamilyTreeView data={tree as TreeViewData} />
      <AccessibleFamilyList data={tree} />
      <div className="mt-10">
        <p className="text-sm text-stone-500">
          Looking for someone else?
        </p>
        <Link
          className="mt-2 inline-block text-sm font-semibold text-stone-900 underline underline-offset-4"
          href="/people"
        >
          Search the full public directory ({people.length} profiles)
        </Link>
      </div>
    </>
  );
}

function AccessibleFamilyList({ data }: { data: TreeViewData }) {
  return (
    <section
      aria-labelledby="accessible-tree-heading"
      className="mt-12 rounded-2xl border border-stone-200 bg-white p-6"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-amber-700">
        Accessible alternative
      </p>
      <h2
        className="mt-2 text-2xl font-semibold text-stone-950"
        id="accessible-tree-heading"
      >
        People in this branch
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.people.map((person) => (
          <li key={person.id}>
            <Link
              className="block rounded-xl border border-stone-200 px-4 py-3 hover:border-stone-500"
              href={`/people/${person.id}`}
            >
              <span className="font-medium text-stone-950">
                {person.primaryName}
              </span>
              <span className="mt-1 block text-sm text-stone-500">
                {relationshipDescription(data, person.id)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function relationshipDescription(data: TreeViewData, personId: string) {
  if (personId === data.rootId) return "Selected person";
  const descriptions = new Set<string>();

  for (const relationship of data.relationships) {
    if (relationship.type === "SPOUSE" && (relationship.personAId === personId || relationship.personBId === personId)) {
      descriptions.add("Spouse");
    }
    if (
      relationship.type === "PARENT_CHILD" &&
      relationship.personAId === personId
    ) {
      descriptions.add("Parent");
    }
    if (
      relationship.type === "PARENT_CHILD" &&
      relationship.personBId === personId
    ) {
      descriptions.add("Child");
    }
  }

  return [...descriptions].join(" · ") || "Family connection";
}

function TreeSkeleton() {
  return (
    <div className="mt-8 h-[560px] animate-pulse rounded-2xl bg-stone-200/70" />
  );
}
