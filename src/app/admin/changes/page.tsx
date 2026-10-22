import { ChangeRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  listPendingChangeRequests,
  reviewChangeRequest,
} from "@/lib/contributions";
import { requireActor } from "@/lib/session";

export const metadata = {
  title: "Change review",
  description: "Review proposed Khayargoli Family Tree changes.",
};

export default function AdminChangesPage() {
  return (
    <Suspense fallback={<ReviewSkeleton />}>
      <ChangesContent />
    </Suspense>
  );
}

async function ChangesContent() {
  const { actor } = await requireActor();
  if (actor.role !== "ADMIN" || actor.membershipStatus !== "APPROVED") {
    redirect("/account");
  }
  const requests = await listPendingChangeRequests();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Administration
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
        Proposed changes
      </h1>
      {requests.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {requests.map((request) => (
            <li
              className="rounded-2xl border border-stone-200 bg-white p-6"
              key={request.id}
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-stone-950">
                    {request.changeType.replaceAll("_", " ").toLowerCase()}
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Submitted by {request.submittedBy.name ?? request.submittedBy.email ?? "Unknown"}
                    {request.person ? ` · ${request.person.primaryName}` : ""}
                  </p>
                </div>
                <time
                  className="text-sm text-stone-500"
                  dateTime={request.createdAt.toISOString()}
                >
                  {request.createdAt.toLocaleDateString()}
                </time>
              </div>
              <pre className="mt-5 max-h-48 overflow-auto rounded-xl bg-stone-50 p-4 text-xs text-stone-700">
                {JSON.stringify(request.proposedData, null, 2)}
              </pre>
              <div className="mt-5 flex flex-wrap items-end gap-3">
                <form action={reviewChange}>
                  <input name="requestId" type="hidden" value={request.id} />
                  <input
                    name="status"
                    type="hidden"
                    value={ChangeRequestStatus.APPROVED}
                  />
                  <button
                    className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
                    type="submit"
                  >
                    Approve
                  </button>
                </form>
                <form action={reviewChange} className="flex items-end gap-2">
                  <input name="requestId" type="hidden" value={request.id} />
                  <input
                    name="status"
                    type="hidden"
                    value={ChangeRequestStatus.REJECTED}
                  />
                  <label className="sr-only" htmlFor={`note-${request.id}`}>
                    Rejection note
                  </label>
                  <input
                    className="rounded-full border border-stone-300 px-4 py-2.5 text-sm"
                    id={`note-${request.id}`}
                    name="note"
                    placeholder="Optional review note"
                  />
                  <button
                    className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-800 hover:border-stone-500"
                    type="submit"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-stone-300 p-8 text-stone-600">
          There are no pending change requests.
        </p>
      )}
    </main>
  );
}

async function reviewChange(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await reviewChangeRequest(
    actor,
    String(formData.get("requestId") ?? ""),
    String(formData.get("status") ?? "") as
      | "APPROVED"
      | "REJECTED",
    String(formData.get("note") ?? ""),
  );
  revalidatePath("/admin/changes");
  revalidatePath("/contribute");
}

function ReviewSkeleton() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 animate-pulse px-6 py-12 sm:px-10">
      <div className="h-10 w-80 rounded bg-stone-200" />
      <div className="mt-8 h-64 rounded-2xl bg-stone-200" />
    </main>
  );
}
