import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  archivePerson,
  createPerson,
  listPeople,
  updatePerson,
} from "@/lib/data-access";
import { requireActor } from "@/lib/session";

export const metadata = {
  title: "Manage people",
  description: "Create and maintain family person records.",
};

export default function AdminPeoplePage() {
  return (
    <Suspense fallback={<PeopleSkeleton />}>
      <PeopleContent />
    </Suspense>
  );
}

async function PeopleContent() {
  const { actor } = await requireActor();
  if (actor.role !== "ADMIN" || actor.membershipStatus !== "APPROVED") {
    redirect("/account");
  }
  const people = await listPeople();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-14 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="display-heading mt-4 text-5xl text-stone-950">
            Manage people
          </h1>
        </div>
        <Link className="text-sm font-semibold underline" href="/admin/relationships">
          Manage relationships →
        </Link>
      </div>

      <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-stone-950">
          Create a person
        </h2>
        <form action={createPersonAction} className="mt-5 grid gap-4 md:grid-cols-4">
          <input
            className="rounded-xl border border-stone-300 px-4 py-3"
            name="primaryName"
            placeholder="Primary name"
            required
          />
          <input
            className="rounded-xl border border-stone-300 px-4 py-3"
            name="alternateNames"
            placeholder="Alternate names, comma separated"
          />
          <input
            className="rounded-xl border border-stone-300 px-4 py-3"
            name="occupation"
            placeholder="Occupation (optional)"
          />
          <button
            className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Create person
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-stone-950">
          Active people ({people.length})
        </h2>
        <ul className="mt-5 space-y-4">
          {people.map((person) => (
            <li
              className="rounded-2xl border border-stone-200 bg-white p-6"
              key={person.id}
            >
              <form action={updatePersonAction} className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <input name="personId" type="hidden" value={person.id} />
                <input
                  className="rounded-xl border border-stone-300 px-4 py-3"
                  defaultValue={person.primaryName}
                  name="primaryName"
                  required
                />
                <input
                  className="rounded-xl border border-stone-300 px-4 py-3"
                  defaultValue={person.names.map((name) => name.name).join(", ")}
                  name="alternateNames"
                  placeholder="Alternate names"
                />
                <input
                  className="rounded-xl border border-stone-300 px-4 py-3"
                  defaultValue={person.occupation ?? ""}
                  name="occupation"
                  placeholder="Occupation"
                />
                <button
                  className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-800"
                  type="submit"
                >
                  Save
                </button>
              </form>
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-xs text-stone-400">{person.id}</p>
                <form action={archivePersonAction}>
                  <input name="personId" type="hidden" value={person.id} />
                  <button
                    className="text-sm font-semibold text-red-700 underline"
                    type="submit"
                  >
                    Archive
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

async function createPersonAction(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await createPerson(actor, {
    primaryName: String(formData.get("primaryName") ?? ""),
    alternateNames: splitNames(formData.get("alternateNames")),
    occupation: String(formData.get("occupation") ?? "") || null,
    visibility: "RESTRICTED",
  });
  revalidatePath("/admin/people");
}

async function updatePersonAction(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await updatePerson(actor, String(formData.get("personId") ?? ""), {
    primaryName: String(formData.get("primaryName") ?? ""),
    alternateNames: splitNames(formData.get("alternateNames")),
    occupation: String(formData.get("occupation") ?? "") || null,
    visibility: "RESTRICTED",
  });
  revalidatePath("/admin/people");
}

async function archivePersonAction(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await archivePerson(actor, String(formData.get("personId") ?? ""));
  revalidatePath("/admin/people");
}

function splitNames(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function PeopleSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 animate-pulse px-6 py-14 sm:px-10">
      <div className="h-12 w-80 rounded bg-stone-200" />
      <div className="mt-10 h-48 rounded-2xl bg-stone-200" />
    </main>
  );
}
