import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import SignOutButton from "./sign-out-button";

export const metadata = {
  title: "Account",
  description: "Your Khayargoli Family Tree account.",
};

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Account
      </p>
      <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
            Welcome{session.user.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-3 text-stone-600">
            {session.user.email ?? "Signed in with Google"}
          </p>
        </div>
        <SignOutButton />
      </div>

      <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-950">
          Membership status
        </h2>
        <p className="mt-3 text-stone-600">
          Your membership is{" "}
          <span className="font-semibold text-stone-950">
            {session.user.membershipStatus.toLowerCase()}
          </span>
          .
        </p>
        {session.user.membershipStatus !== "APPROVED" && (
          <p className="mt-3 text-sm leading-6 text-stone-500">
            An administrator must approve your membership before contribution
            tools become available.
          </p>
        )}
      </section>
    </main>
  );
}

function AccountSkeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 animate-pulse px-6 py-12 sm:px-10">
      <div className="h-10 w-64 rounded bg-stone-200" />
      <div className="mt-10 h-40 rounded-2xl bg-stone-200" />
    </main>
  );
}
