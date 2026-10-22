import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export const metadata = {
  title: "Admin",
  description: "Khayargoli Family Tree administration.",
};

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (
    session.user.role !== "ADMIN" ||
    session.user.membershipStatus !== "APPROVED"
  ) {
    redirect("/account");
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Administration
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
        Keep the family record accurate
      </h1>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          className="rounded-2xl border border-stone-200 bg-white p-6 hover:border-stone-400"
          href="/admin/members"
        >
          <h2 className="font-semibold text-stone-950">Membership</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Review membership requests and approve trusted contributors.
          </p>
        </Link>
        <Link
          className="rounded-2xl border border-stone-200 bg-white p-6 hover:border-stone-400"
          href="/admin/claims"
        >
          <h2 className="font-semibold text-stone-950">Profile claims</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Verify which person record an approved member may manage.
          </p>
        </Link>
        <Link
          className="rounded-2xl border border-stone-200 bg-white p-6 hover:border-stone-400"
          href="/admin/changes"
        >
          <h2 className="font-semibold text-stone-950">Change review</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Review and publish proposed people and relationship changes.
          </p>
        </Link>
        <Link
          className="rounded-2xl border border-stone-200 bg-white p-6 hover:border-stone-400"
          href="/admin/media"
        >
          <h2 className="font-semibold text-stone-950">Photos and stories</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Review submitted family history and media before publication.
          </p>
        </Link>
        <Link
          className="rounded-2xl border border-stone-200 bg-white p-6 hover:border-stone-400"
          href="/admin/people"
        >
          <h2 className="font-semibold text-stone-950">People</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Create, edit, and archive canonical person records.
          </p>
        </Link>
        <Link
          className="rounded-2xl border border-stone-200 bg-white p-6 hover:border-stone-400"
          href="/admin/relationships"
        >
          <h2 className="font-semibold text-stone-950">Relationships</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Connect parents, children, and multiple spouse relationships.
          </p>
        </Link>
        <Link
          className="rounded-2xl border border-stone-200 bg-white p-6 hover:border-stone-400"
          href="/people"
        >
          <h2 className="font-semibold text-stone-950">Public directory</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Review the public view of family profiles.
          </p>
        </Link>
      </div>
    </main>
  );
}

function AdminSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 animate-pulse px-6 py-12 sm:px-10">
      <div className="h-10 w-80 rounded bg-stone-200" />
      <div className="mt-10 h-32 rounded-2xl bg-stone-200" />
    </main>
  );
}
