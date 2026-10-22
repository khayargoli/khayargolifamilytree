import {
  ChangeType,
  RelationshipType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";

import {
  getClaimedPersonForUser,
  getPendingClaimForUser,
  listSubmittedChangeRequests,
  requestPersonClaim,
  submitChangeRequest,
} from "@/lib/contributions";
import { listPublicPeopleForTree } from "@/lib/public-data";
import { requireActor } from "@/lib/session";

export const metadata = {
  title: "Contribute",
  description: "Contribute reviewed information to the Khayargoli Family Tree.",
};

export default function ContributePage() {
  return (
    <Suspense fallback={<ContributeSkeleton />}>
      <ContributeContent />
    </Suspense>
  );
}

async function ContributeContent() {
  const { session, actor } = await requireActor();
  const requests = await listSubmittedChangeRequests(actor.userId);

  if (
    session.user.membershipStatus !== "APPROVED" &&
    session.user.role !== "ADMIN"
  ) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:px-10">
        <PageIntro />
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          Your membership request is{" "}
          <strong>{session.user.membershipStatus.toLowerCase()}</strong>.
          Contribution tools will become available after an administrator
          approves your membership.
        </section>
        <SubmissionList requests={requests} />
      </main>
    );
  }

  const [claimed, pendingClaim, people] = await Promise.all([
    getClaimedPersonForUser(actor.userId),
    getPendingClaimForUser(actor.userId),
    listPublicPeopleForTree(),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:px-10">
      <PageIntro />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {claimed ? (
          <ProfileUpdateForm person={claimed.person} />
        ) : (
          <ClaimForm people={people} pendingClaim={pendingClaim} />
        )}
        <NewPersonForm />
        <RelationshipForm people={people} />
      </div>
      <SubmissionList requests={requests} />
    </main>
  );
}

function PageIntro() {
  return (
    <>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Contributions
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
        Help keep the family record accurate
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-stone-600">
        Contributions are proposals. An administrator reviews them before
        anything becomes part of the canonical public tree.
      </p>
    </>
  );
}

function ClaimForm({
  people,
  pendingClaim,
}: {
  people: Awaited<ReturnType<typeof listPublicPeopleForTree>>;
  pendingClaim: Awaited<ReturnType<typeof getPendingClaimForUser>>;
}) {
  if (pendingClaim) {
    return (
      <Panel title="Profile claim">
        <p className="text-sm leading-6 text-stone-600">
          Your request to claim{" "}
          <strong>{pendingClaim.person.primaryName}</strong> is pending admin
          review.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Claim your profile">
      <p className="text-sm leading-6 text-stone-600">
        Choose the profile that represents you. An admin must verify the claim;
        selecting a name does not grant access.
      </p>
      <form action={submitClaim} className="mt-5 space-y-4">
        <label className="block text-sm font-medium text-stone-800" htmlFor="claim-person">
          Profile
        </label>
        <select
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
          id="claim-person"
          name="personId"
          required
        >
          <option value="">Select a public profile</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.primaryName}
            </option>
          ))}
        </select>
        <SubmitButton label="Request claim review" />
      </form>
    </Panel>
  );
}

function ProfileUpdateForm({
  person,
}: {
  person: NonNullable<Awaited<ReturnType<typeof getClaimedPersonForUser>>>["person"];
}) {
  return (
    <Panel title={`Suggest updates for ${person.primaryName}`}>
      <form action={submitProfileUpdate} className="space-y-4">
        <input name="personId" type="hidden" value={person.id} />
        <label className="block text-sm font-medium text-stone-800" htmlFor="occupation">
          Occupation
        </label>
        <input
          className="w-full rounded-xl border border-stone-300 px-4 py-3"
          defaultValue={person.occupation ?? ""}
          id="occupation"
          maxLength={200}
          name="occupation"
        />
        <label className="block text-sm font-medium text-stone-800" htmlFor="biography">
          Biography
        </label>
        <textarea
          className="min-h-28 w-full rounded-xl border border-stone-300 px-4 py-3"
          defaultValue={person.biography ?? ""}
          id="biography"
          maxLength={10_000}
          name="biography"
        />
        <SubmitButton label="Submit profile update" />
      </form>
    </Panel>
  );
}

function NewPersonForm() {
  return (
    <Panel title="Propose a new person">
      <form action={submitNewPerson} className="space-y-4">
        <label className="block text-sm font-medium text-stone-800" htmlFor="new-name">
          Primary name
        </label>
        <input
          className="w-full rounded-xl border border-stone-300 px-4 py-3"
          id="new-name"
          maxLength={200}
          name="primaryName"
          required
        />
        <label className="block text-sm font-medium text-stone-800" htmlFor="new-occupation">
          Occupation (optional)
        </label>
        <input
          className="w-full rounded-xl border border-stone-300 px-4 py-3"
          id="new-occupation"
          maxLength={200}
          name="occupation"
        />
        <SubmitButton label="Submit new person" />
      </form>
    </Panel>
  );
}

function RelationshipForm({
  people,
}: {
  people: Awaited<ReturnType<typeof listPublicPeopleForTree>>;
}) {
  return (
    <Panel title="Propose a relationship">
      <p className="text-sm leading-6 text-stone-600">
        For parent-child relationships, Person A is the parent and Person B is
        the child.
      </p>
      <form action={submitRelationship} className="mt-5 space-y-4">
        <label className="block text-sm font-medium text-stone-800" htmlFor="relationship-type">
          Relationship type
        </label>
        <select
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
          defaultValue={RelationshipType.PARENT_CHILD}
          id="relationship-type"
          name="type"
        >
          <option value={RelationshipType.PARENT_CHILD}>Parent-child</option>
          <option value={RelationshipType.SPOUSE}>Spouse/partner</option>
        </select>
        <PersonSelect id="person-a" label="Person A" name="personAId" people={people} />
        <PersonSelect id="person-b" label="Person B" name="personBId" people={people} />
        <SubmitButton label="Submit relationship" />
      </form>
    </Panel>
  );
}

function PersonSelect({
  id,
  label,
  name,
  people,
}: {
  id: string;
  label: string;
  name: string;
  people: Awaited<ReturnType<typeof listPublicPeopleForTree>>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-800" htmlFor={id}>
        {label}
      </label>
      <select
        className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
        id={id}
        name={name}
        required
      >
        <option value="">Select a person</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.primaryName}
          </option>
        ))}
      </select>
    </div>
  );
}

function SubmissionList({
  requests,
}: {
  requests: Awaited<ReturnType<typeof listSubmittedChangeRequests>>;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold text-stone-950">Your submissions</h2>
      {requests.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {requests.map((request) => (
            <li
              className="rounded-2xl border border-stone-200 bg-white p-5 text-sm"
              key={request.id}
            >
              <span className="font-semibold text-stone-900">
                {request.changeType.replaceAll("_", " ").toLowerCase()}
              </span>
              <span className="ml-3 text-stone-500">
                {request.status.toLowerCase()}
              </span>
              {request.person && (
                <p className="mt-2 text-stone-600">
                  Related to {request.person.primaryName}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-stone-500">
          You have not submitted any changes yet.
        </p>
      )}
    </section>
  );
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button
      className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
      type="submit"
    >
      {label}
    </button>
  );
}

async function submitClaim(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await requestPersonClaim(actor, String(formData.get("personId") ?? ""));
  revalidatePath("/contribute");
}

async function submitProfileUpdate(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await submitChangeRequest(actor, {
    changeType: ChangeType.UPDATE_PERSON,
    personId: String(formData.get("personId") ?? ""),
    data: {
      occupation: String(formData.get("occupation") ?? ""),
      biography: String(formData.get("biography") ?? ""),
    },
  });
  revalidatePath("/contribute");
}

async function submitNewPerson(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await submitChangeRequest(actor, {
    changeType: ChangeType.CREATE_PERSON,
    data: {
      primaryName: String(formData.get("primaryName") ?? ""),
      occupation: String(formData.get("occupation") ?? ""),
      alternateNames: [],
      biography: null,
      birthDate: null,
      deathDate: null,
      birthPlace: null,
      profileImageKey: null,
      isLiving: null,
      visibility: "RESTRICTED",
    },
  });
  revalidatePath("/contribute");
}

async function submitRelationship(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await submitChangeRequest(actor, {
    changeType: ChangeType.CREATE_RELATIONSHIP,
    data: {
      type: String(formData.get("type") ?? "") as RelationshipType,
      ...(String(formData.get("type") ?? "") === RelationshipType.PARENT_CHILD
        ? {
            parentId: String(formData.get("personAId") ?? ""),
            childId: String(formData.get("personBId") ?? ""),
          }
        : {
            personAId: String(formData.get("personAId") ?? ""),
            personBId: String(formData.get("personBId") ?? ""),
          }),
    },
  });
  revalidatePath("/contribute");
}

function ContributeSkeleton() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 animate-pulse px-6 py-12 sm:px-10">
      <div className="h-10 w-96 rounded bg-stone-200" />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-2xl bg-stone-200" />
        <div className="h-72 rounded-2xl bg-stone-200" />
      </div>
    </main>
  );
}
