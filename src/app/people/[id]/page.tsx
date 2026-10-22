import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getPublicPersonProfile } from "@/lib/public-data";

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export async function generateMetadata({
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return {
    title: "Family profile",
    description: "Public family profile from the Khayargoli family tree.",
  };
}

export default function PersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent params={params} />
    </Suspense>
  );
}

async function ProfileContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getPublicPersonProfile(id);
  if (!person) notFound();

  const spouses = [
    ...person.relationshipsAsA
      .filter((relationship) => relationship.type === "SPOUSE")
      .map((relationship) => ({
        person: relationship.personB,
        relationship,
      })),
    ...person.relationshipsAsB
      .filter((relationship) => relationship.type === "SPOUSE")
      .map((relationship) => ({
        person: relationship.personA,
        relationship,
      })),
  ];
  const parents = person.relationshipsAsB
    .filter((relationship) => relationship.type === "PARENT_CHILD")
    .map((relationship) => relationship.personA);
  const children = person.relationshipsAsA
    .filter((relationship) => relationship.type === "PARENT_CHILD")
    .map((relationship) => relationship.personB);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:px-10">
      <Link className="text-sm text-stone-500 hover:text-stone-900" href="/people">
        ← Back to people
      </Link>

      <header className="mt-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Public family profile
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
          {person.primaryName}
        </h1>
        {person.names.length > 0 && (
          <p className="mt-3 text-stone-500">
            Also known as {person.names.map((name) => name.name).join(", ")}
          </p>
        )}
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-950">About</h2>
          {person.biography && (
            <p className="mt-4 whitespace-pre-line leading-7 text-stone-600">
              {person.biography}
            </p>
          )}
          <dl className="mt-6 space-y-4 text-sm">
            {person.occupation && (
              <div>
                <dt className="text-stone-500">Occupation</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {person.occupation}
                </dd>
              </div>
            )}
            {person.birthPlace && (
              <div>
                <dt className="text-stone-500">Birth place</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {person.birthPlace}
                </dd>
              </div>
            )}
            {person.birthDate && (
              <div>
                <dt className="text-stone-500">Born</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {formatDate(person.birthDate)}
                </dd>
              </div>
            )}
            {person.deathDate && (
              <div>
                <dt className="text-stone-500">Died</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {formatDate(person.deathDate)}
                </dd>
              </div>
            )}
          </dl>
          {!person.biography &&
            !person.occupation &&
            !person.birthPlace &&
            !person.birthDate &&
            !person.deathDate && (
              <p className="mt-4 text-stone-500">
                More public details have not been added yet.
              </p>
            )}
        </section>

        <section className="space-y-8">
          <RelationshipGroup title="Parents" people={parents} />
          <RelationshipGroup title="Children" people={children} />
          <div>
            <h2 className="text-lg font-semibold text-stone-950">Spouses</h2>
            {spouses.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {spouses.map(({ person: spouse, relationship }) => (
                  <li
                    className="rounded-2xl border border-stone-200 bg-white p-5"
                    key={relationship.id}
                  >
                    <Link
                      className="font-semibold text-stone-950 hover:underline"
                      href={`/people/${spouse.id}`}
                    >
                      {spouse.primaryName}
                    </Link>
                    <p className="mt-2 text-sm text-stone-500">
                      {formatMarriageDates(relationship.marriageStartDate, relationship.marriageEndDate, relationship.marriageEndReason)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-500">
                No public spouse relationship has been recorded.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function RelationshipGroup({
  title,
  people,
}: {
  title: string;
  people: Array<{ id: string; primaryName: string }>;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
      {people.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                className="block rounded-2xl border border-stone-200 bg-white p-5 font-medium text-stone-900 hover:border-stone-400"
                href={`/people/${person.id}`}
              >
                {person.primaryName}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-stone-500">
          No public relationship has been recorded.
        </p>
      )}
    </div>
  );
}

function formatMarriageDates(
  startDate: Date | null,
  endDate: Date | null,
  endReason: string | null,
) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (!start && !end) return "Marriage dates unknown";
  if (start && !end) return `From ${start}`;
  if (!start && end) return `Until ${end}`;
  return `${start} – ${end}${endReason ? ` · ${endReason.toLowerCase()}` : ""}`;
}

function ProfileSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 animate-pulse px-6 py-12 sm:px-10">
      <div className="h-4 w-32 rounded bg-stone-200" />
      <div className="mt-10 h-12 w-72 rounded bg-stone-200" />
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="h-72 rounded-2xl bg-stone-200" />
        <div className="h-72 rounded-2xl bg-stone-200" />
      </div>
    </main>
  );
}
