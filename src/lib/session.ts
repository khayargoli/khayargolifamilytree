import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function requireActor() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return {
    session,
    actor: {
      userId: session.user.id,
      role: session.user.role,
      membershipStatus: session.user.membershipStatus,
    },
  };
}
