import { MembershipStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { getPrisma } from "@/lib/db";

export const metadata = {
  title: "Membership",
  description: "Review Khayargoli Family Tree membership requests.",
};

export default function AdminMembersPage() {
  return (
    <Suspense fallback={<MembersSkeleton />}>
      <MembersContent />
    </Suspense>
  );
}

async function MembersContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" || session.user.membershipStatus !== "APPROVED") {
    redirect("/account");
  }

  const users = await getPrisma().user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      membershipStatus: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Administration
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
        Membership requests
      </h1>
      <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <ul className="divide-y divide-stone-200">
          {users.map((user) => (
            <li
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              key={user.id}
            >
              <div>
                <p className="font-semibold text-stone-950">
                  {user.name ?? "Unnamed Google account"}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {user.email ?? "No email supplied"} ·{" "}
                  {user.membershipStatus.toLowerCase()} ·{" "}
                  {user.role.toLowerCase()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.membershipStatus === MembershipStatus.PENDING && (
                  <>
                    <form action={updateMembership}>
                      <input name="userId" type="hidden" value={user.id} />
                      <input
                        name="status"
                        type="hidden"
                        value={MembershipStatus.APPROVED}
                      />
                      <button
                        className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
                        type="submit"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={updateMembership}>
                      <input name="userId" type="hidden" value={user.id} />
                      <input
                        name="status"
                        type="hidden"
                        value={MembershipStatus.REJECTED}
                      />
                      <button
                        className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 hover:border-stone-500"
                        type="submit"
                      >
                        Reject
                      </button>
                    </form>
                  </>
                )}
                <form action={updateRole} className="flex gap-2">
                  <input name="userId" type="hidden" value={user.id} />
                  <label className="sr-only" htmlFor={`role-${user.id}`}>
                    Role for {user.name ?? user.email ?? user.id}
                  </label>
                  <select
                    className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm"
                    defaultValue={user.role}
                    id={`role-${user.id}`}
                    name="role"
                  >
                    <option value={UserRole.MEMBER}>Member</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                  <button
                    className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 hover:border-stone-500"
                    type="submit"
                  >
                    Save role
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

async function updateMembership(formData: FormData) {
  "use server";

  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "ADMIN" ||
    session.user.membershipStatus !== "APPROVED"
  ) {
    throw new Error("Only approved administrators may update membership.");
  }

  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (
    !userId ||
    !Object.values(MembershipStatus).includes(status as MembershipStatus)
  ) {
    throw new Error("Invalid membership update.");
  }

  const prisma = getPrisma();
  const user = await prisma.user.update({
    where: { id: userId },
    data: { membershipStatus: status as MembershipStatus },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "MEMBERSHIP_UPDATED",
      entityType: "User",
      entityId: user.id,
      afterSummary: { membershipStatus: user.membershipStatus },
    },
  });

  revalidatePath("/admin/members");
}

async function updateRole(formData: FormData) {
  "use server";

  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "ADMIN" ||
    session.user.membershipStatus !== "APPROVED"
  ) {
    throw new Error("Only approved administrators may update roles.");
  }

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !Object.values(UserRole).includes(role as UserRole)) {
    throw new Error("Invalid role update.");
  }
  if (userId === session.user.id && role !== UserRole.ADMIN) {
    throw new Error("You cannot remove your own administrator role.");
  }

  const prisma = getPrisma();
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: role as UserRole },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "ROLE_UPDATED",
      entityType: "User",
      entityId: user.id,
      afterSummary: { role: user.role },
    },
  });

  revalidatePath("/admin/members");
}

function MembersSkeleton() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 animate-pulse px-6 py-12 sm:px-10">
      <div className="h-10 w-80 rounded bg-stone-200" />
      <div className="mt-8 h-64 rounded-2xl bg-stone-200" />
    </main>
  );
}
