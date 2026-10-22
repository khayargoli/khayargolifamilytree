import { ClaimStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { listPendingClaims, reviewClaim } from "@/lib/contributions";
import { requireActor } from "@/lib/session";

export const metadata = {
  title: "Profile claims",
  description: "Review profile claim requests.",
};

export default function AdminClaimsPage() {
  return (
    <Suspense fallback={<ClaimsSkeleton />}>
      <ClaimsContent />
    </Suspense>
  );
}

async function ClaimsContent() {
  const { actor } = await requireActor();
  if (actor.role !== "ADMIN" || actor.membershipStatus !== "APPROVED") {
    redirect("/account");
  }
  const claims = await listPendingClaims();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Administration
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
        Profile claims
      </h1>
      {claims.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {claims.map((claim) => (
            <li
              className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
              key={claim.id}
            >
              <div>
                <h2 className="font-semibold text-stone-950">
                  {claim.person.primaryName}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Requested by {claim.user.name ?? claim.user.email ?? "Unknown"}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={reviewClaimAction}>
                  <input name="claimId" type="hidden" value={claim.id} />
                  <input
                    name="status"
                    type="hidden"
                    value={ClaimStatus.APPROVED}
                  />
                  <button
                    className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
                    type="submit"
                  >
                    Approve
                  </button>
                </form>
                <form action={reviewClaimAction}>
                  <input name="claimId" type="hidden" value={claim.id} />
                  <input
                    name="status"
                    type="hidden"
                    value={ClaimStatus.REJECTED}
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
          There are no pending profile claims.
        </p>
      )}
    </main>
  );
}

async function reviewClaimAction(formData: FormData) {
  "use server";
  const { actor } = await requireActor();
  await reviewClaim(
    actor,
    String(formData.get("claimId") ?? ""),
    String(formData.get("status") ?? "") as
      | "APPROVED"
      | "REJECTED",
  );
  revalidatePath("/admin/claims");
  revalidatePath("/contribute");
}

function ClaimsSkeleton() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 animate-pulse px-6 py-12 sm:px-10">
      <div className="h-10 w-80 rounded bg-stone-200" />
      <div className="mt-8 h-48 rounded-2xl bg-stone-200" />
    </main>
  );
}
