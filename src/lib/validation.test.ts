import { describe, expect, it } from "vitest";

import { RelationshipType } from "@prisma/client";

import { personInputSchema, validateRelationship } from "./validation";

describe("person validation", () => {
  it("allows incomplete historical records", () => {
    expect(
      personInputSchema.parse({
        primaryName: "Unknown Ancestor",
        birthDate: null,
        deathDate: null,
      }),
    ).toMatchObject({
      primaryName: "Unknown Ancestor",
      alternateNames: [],
      visibility: "RESTRICTED",
    });
  });

  it("rejects an empty name", () => {
    expect(() => personInputSchema.parse({ primaryName: " " })).toThrow();
  });
});

describe("relationship validation", () => {
  it("keeps parent-child direction explicit", () => {
    expect(
      validateRelationship({
        type: RelationshipType.PARENT_CHILD,
        parentId: "parent",
        childId: "child",
      }),
    ).toEqual({
      type: RelationshipType.PARENT_CHILD,
      personAId: "parent",
      personBId: "child",
    });
  });

  it("normalizes spouse pairs so remarriages can coexist", () => {
    const firstMarriage = validateRelationship({
      type: RelationshipType.SPOUSE,
      personAId: "person-b",
      personBId: "person-a",
      marriageEndDate: new Date("2000-01-01"),
      marriageEndReason: "DEATH",
    });
    const secondMarriage = validateRelationship({
      type: RelationshipType.SPOUSE,
      personAId: "person-b",
      personBId: "person-c",
      marriageStartDate: new Date("2002-01-01"),
    });

    expect(firstMarriage).toMatchObject({
      personAId: "person-a",
      personBId: "person-b",
    });
    expect(secondMarriage).toMatchObject({
      personAId: "person-b",
      personBId: "person-c",
    });
  });

  it("rejects self relationships and invalid marriage history", () => {
    expect(() =>
      validateRelationship({
        type: RelationshipType.PARENT_CHILD,
        parentId: "same",
        childId: "same",
      }),
    ).toThrow();
    expect(() =>
      validateRelationship({
        type: RelationshipType.SPOUSE,
        personAId: "same",
        personBId: "same",
      }),
    ).toThrow();
    expect(() =>
      validateRelationship({
        type: RelationshipType.SPOUSE,
        personAId: "a",
        personBId: "b",
        marriageStartDate: new Date("2001-01-01"),
        marriageEndDate: new Date("2000-01-01"),
      }),
    ).toThrow();
  });
});
