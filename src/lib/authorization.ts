import { MembershipStatus, UserRole } from "@prisma/client";

export type Actor = {
  userId: string;
  role: UserRole;
  membershipStatus: MembershipStatus;
};

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function assertAdmin(actor: Actor): void {
  if (
    actor.role !== UserRole.ADMIN ||
    actor.membershipStatus !== MembershipStatus.APPROVED
  ) {
    throw new AuthorizationError("Only approved administrators may do this.");
  }
}
