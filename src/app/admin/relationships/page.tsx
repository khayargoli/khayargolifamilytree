import Link from "next/link";
import { MarriageEndReason, RelationshipType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  createRelationship,
  listPeople,
  listRelationships,
  removeRelationship,
} from "@/lib/data-access";
import { requireActor } from "@/lib/session";

export const metadata = {
  title: "Manage relationships",
  description: "Create and maintain family relationships.",
};

export default function AdminRelationshipsPage() {
  return (
    <Suspense fallback={<RelationshipsSkeleton />}>
      <RelationshipsContent />
    </Suspense>
  );
}

async function RelationshipsContent() {
  const { actor } = await requireActor();
  if (actor.role !== "ADMIN" || actor.membershipStatus !== "APPROVED") {
    redirect("/account");
  }
  const [people, relationships] = await Promise.all([
    listPeople(),
    listRelationships(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-14 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="display-heading mt-4 text-5xl text-stone-950">
            Manage relationships
          </h1>
        </div>
        <Link className="text-sm font-semibold underline" href="/admin/people">
          Manage people →
        </Link>
      </div>

      <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-stone-950">
          Add a relationship
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          For parent-child, Person A is the parent and Person B is the child.
          Spouse relationships can be repeated for remarriage.
        </p>
        <form
          action={createRelationshipAction}
          className="mt-5 grid gap-4 lg:grid-cols-4"
        >
          <select
            className="rounded-xl border border-stone-300 bg-white px-4 py-3"
            defaultValue={RelationshipType.PARENT_CHILD}
            name="type"
          >
            <option value={RelationshipType.PARENT_CHILD}>Parent-child</option>
            <option value={RelationshipType.SPOUSE}>Spouse/partner</option>
          </select>
          <PersonSelect label="Person A" name="personAId" people={people} />
          <PersonSelect label="Person B" name="personBId" people={people} />
          <button
            className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Add relationship
          </button>
          <label className="text-sm text-stone-600">
            Marriage start (optional)
            <input
              className="mt-2 block w-full rounded-xl border border-stone-300 px-4 py-3"
              name="marriageStartDate"
              type="date"
            />
          </label>
          <label className="text-sm text-stone-600">
            Marriage end (optional)
            <input
              className="mt-2 block w-full rounded-xl border border-stone-300 px-4 py-3"
              name="marriageEndDate"
              type="date"
            />
          </label>
          <label className="text-sm text-stone-600">
            End reason
            <select
              className="mt-2 block w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
              defaultValue=""
              name="marriageEndReason"
            >
              <option value="">Unknown</option>
              <option value="DEATH">Death</option>
              <option value="DIVORCE">Divorce</option>
              <option value="SEPARATION">Separation</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-stone-950">
          Published relationships ({relationships.length})
        </h2>
        <ul className="mt-5 space-y-3">
          {relationships.map((relationship) => (
            <li
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5"
              key={relationship.id}
            >
              <div>
                <p className="font-semibold text-stone-950">
                  {relationship.personA.primaryName}{" "}
                  <span className="font-normal text-stone-500">
                    {relationship.type === RelationshipType.SPOUSE
                      ? "and"
                      : "is parent of"}
                  </span>{" "}
                  {relationship.personB.primaryName}
                </p>
                {relationship.type === RelationshipType.SPOUSE && (
                  <p className="mt-1 text-sm text-stone-500">
                    {formatMarriage(relationship)}
                  </p>
                )}
              </div>
              <form action={removeRelationshipAction}>
                <input
                  name="relationshipId"
                  type="hidden"
                  value={relationship.id}
                />
                <button
                  className="text-sm font-semibold text-red-700 underline"
                  type="submit"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function PersonSelect({
  label,
  name,
  people,
}: {
  label: string;
  name: string;
  people: Awaited<ReturnType<typeof listPeople>>;
}) {
  return (
    <label className="text-sm text-stone-600">
      {label}
      <select
        className="mt-2 block w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
        name={name}
        required
      >
        <option value="">Select person</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.primaryName}
          </option>
        ))}
      </select>
    </label>
  );
}

async function createRelationshipAction(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  const type = String(formData.get("type") ?? "") as RelationshipType;
  const personAId = String(formData.get("personAId") ?? "");
  const personBId = String(formData.get("personBId") ?? "");
  const start = String(formData.get("marriageStartDate") ?? "");
  const end = String(formData.get("marriageEndDate") ?? "");
  const endReason = String(formData.get("marriageEndReason") ?? "");

  await createRelationship(
    actor,
    type === RelationshipType.PARENT_CHILD
      ? { type, parentId: personAId, childId: personBId }
      : {
          type,
          personAId,
          personBId,
          marriageStartDate: start ? new Date(start) : null,
          marriageEndDate: end ? new Date(end) : null,
          marriageEndReason: endReason
            ? (endReason as MarriageEndReason)
            : null,
        },
  );
  revalidatePath("/admin/relationships");
  revalidatePath("/tree");
}

async function removeRelationshipAction(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await removeRelationship(actor, String(formData.get("relationshipId") ?? ""));
  revalidatePath("/admin/relationships");
  revalidatePath("/tree");
}

function formatMarriage(relationship: {
  marriageStartDate: Date | null;
  marriageEndDate: Date | null;
  marriageEndReason: string | null;
}) {
  const start = relationship.marriageStartDate?.toLocaleDateString() ?? "?";
  const end = relationship.marriageEndDate?.toLocaleDateString() ?? "?";
  return `${start} – ${end}${
    relationship.marriageEndReason
      ? ` · ${relationship.marriageEndReason.toLowerCase()}`
      : ""
  }`;
}

function RelationshipsSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 animate-pulse px-6 py-14 sm:px-10">
      <div className="h-12 w-96 rounded bg-stone-200" />
      <div className="mt-10 h-64 rounded-2xl bg-stone-200" />
    </main>
  );
}
