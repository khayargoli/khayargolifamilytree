import type { DefaultSession } from "next-auth";

import type { MembershipStatus, UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      membershipStatus: MembershipStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    membershipStatus: MembershipStatus;
  }
}
