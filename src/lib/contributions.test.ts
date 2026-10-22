import { describe, expect, it } from "vitest";

import { ChangeType, RelationshipType } from "@prisma/client";

import { changeRequestInputSchema } from "./contributions";

describe("contribution request validation", () => {
  it("accepts a typed new-person proposal", () => {
    const result = changeRequestInputSchema.parse({
      changeType: ChangeType.CREATE_PERSON,
      data: {
        primaryName: "Fictional Contributor",
        alternateNames: [],
        biography: null,
        occupation: "Teacher",
        birthDate: null,
        deathDate: null,
        birthPlace: null,
        profileImageKey: null,
        isLiving: true,
        visibility: "RESTRICTED",
      },
    });

    expect(result.changeType).toBe(ChangeType.CREATE_PERSON);
  });

  it("requires explicit relationship fields", () => {
    expect(
      changeRequestInputSchema.safeParse({
        changeType: ChangeType.CREATE_RELATIONSHIP,
        data: {
          type: RelationshipType.PARENT_CHILD,
          parentId: "parent",
        },
      }).success,
    ).toBe(false);
  });

  it("does not accept arbitrary change types", () => {
    expect(
      changeRequestInputSchema.safeParse({
        changeType: "DELETE_EVERYTHING",
        data: {},
      }).success,
    ).toBe(false);
  });
});
