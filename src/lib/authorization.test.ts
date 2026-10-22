import { describe, expect, it } from "vitest";

import { MembershipStatus, UserRole } from "@prisma/client";

import { assertAdmin, AuthorizationError } from "./authorization";

const approvedAdmin = {
  userId: "admin",
  role: UserRole.ADMIN,
  membershipStatus: MembershipStatus.APPROVED,
};

describe("admin authorization", () => {
  it("allows an approved admin", () => {
    expect(() => assertAdmin(approvedAdmin)).not.toThrow();
  });

  it("rejects members and unapproved admins", () => {
    expect(() =>
      assertAdmin({
        ...approvedAdmin,
        role: UserRole.MEMBER,
      }),
    ).toThrow(AuthorizationError);
    expect(() =>
      assertAdmin({
        ...approvedAdmin,
        membershipStatus: MembershipStatus.PENDING,
      }),
    ).toThrow(AuthorizationError);
  });
});
