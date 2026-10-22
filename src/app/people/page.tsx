import Link from "next/link";
import { Suspense } from "react";

import { searchPublicPeople } from "@/lib/public-data";

function pageHref(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", String(page));
  return `/people?${params.toString()}`;
}

export default function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:px-10">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Family directory
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
          Find a family member
        </h1>
        <p className="mt-4 text-stone-600">
          Search publicly shared names and open a profile to explore family
          connections.
        </p>
      </div>
      <Suspense fallback={<DirectorySkeleton />}>
        <DirectoryResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function DirectoryResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const result = await searchPublicPeople({
    query: params.q,
    page,
  });

  return (
    <>
      <form className="mt-8 flex max-w-2xl gap-3" method="get">
        <label className="sr-only" htmlFor="people-search">
          Search by name
        </label>
        <input
          className="min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-5 py-3 text-stone-950 outline-none ring-amber-700 placeholder:text-stone-400 focus:ring-2"
          defaultValue={result.query}
          id="people-search"
          name="q"
          placeholder="Search by primary or alternate name"
          type="search"
        />
        <button
          className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="mt-10">
        <p className="text-sm text-stone-500">
          {result.total} {result.total === 1 ? "person" : "people"} found
        </p>
        {result.people.length > 0 ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.people.map((person) => (
              <li key={person.id}>
                <Link
                  className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-stone-400"
                  href={`/people/${person.id}`}
                >
                  <h2 className="font-semibold text-stone-950">
                    {person.primaryName}
                  </h2>
                  {person.names.length > 0 && (
                    <p className="mt-2 text-sm text-stone-500">
                      Also known as{" "}
                      {person.names.map((name) => name.name).join(", ")}
                    </p>
                  )}
                  {person.occupation && (
                    <p className="mt-4 text-sm text-stone-600">
                      {person.occupation}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-stone-300 p-8 text-stone-600">
            No public profiles matched that search.
          </div>
        )}
      </div>

      {result.pageCount > 1 && (
        <nav
          aria-label="Directory pages"
          className="mt-10 flex items-center gap-4 text-sm"
        >
          {result.page > 1 && (
            <Link
              className="rounded-full border border-stone-300 px-4 py-2 text-stone-800 hover:border-stone-500"
              href={pageHref(result.query, result.page - 1)}
            >
              Previous
            </Link>
          )}
          <span className="text-stone-500">
            Page {result.page} of {result.pageCount}
          </span>
          {result.page < result.pageCount && (
            <Link
              className="rounded-full border border-stone-300 px-4 py-2 text-stone-800 hover:border-stone-500"
              href={pageHref(result.query, result.page + 1)}
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

function DirectorySkeleton() {
  return (
    <div className="mt-8 h-72 animate-pulse rounded-2xl bg-stone-200/70" />
  );
}
