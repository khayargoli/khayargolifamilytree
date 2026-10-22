import { z } from "zod";

import { MarriageEndReason, RelationshipType } from "@prisma/client";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const personInputSchema = z.object({
  primaryName: z.string().trim().min(1).max(200),
  alternateNames: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  biography: optionalText(10_000),
  occupation: optionalText(200),
  birthDate: z.coerce.date().optional().nullable(),
  deathDate: z.coerce.date().optional().nullable(),
  birthPlace: optionalText(200),
  profileImageKey: optionalText(500),
  isLiving: z.boolean().optional().nullable(),
  visibility: z.enum(["PUBLIC", "RESTRICTED"]).default("RESTRICTED"),
});

const parentChildSchema = z.object({
  type: z.literal(RelationshipType.PARENT_CHILD),
  parentId: z.string().min(1),
  childId: z.string().min(1),
});

const spouseSchema = z.object({
  type: z.literal(RelationshipType.SPOUSE),
  personAId: z.string().min(1),
  personBId: z.string().min(1),
  marriageStartDate: z.coerce.date().optional().nullable(),
  marriageEndDate: z.coerce.date().optional().nullable(),
  marriageEndReason: z
    .nativeEnum(MarriageEndReason)
    .optional()
    .nullable(),
});

export const relationshipInputSchema = z.discriminatedUnion("type", [
  parentChildSchema,
  spouseSchema,
]);

export type PersonInput = z.infer<typeof personInputSchema>;
export type RelationshipInput = z.infer<typeof relationshipInputSchema>;

export function validateRelationship(input: RelationshipInput) {
  if (input.type === RelationshipType.PARENT_CHILD) {
    if (input.parentId === input.childId) {
      throw new Error("A person cannot be their own parent.");
    }

    return {
      type: input.type,
      personAId: input.parentId,
      personBId: input.childId,
    } as const;
  }

  if (input.personAId === input.personBId) {
    throw new Error("A person cannot be their own spouse.");
  }

  if (
    input.marriageStartDate &&
    input.marriageEndDate &&
    input.marriageEndDate < input.marriageStartDate
  ) {
    throw new Error("A marriage cannot end before it starts.");
  }

  if (input.marriageEndReason && !input.marriageEndDate) {
    throw new Error("A marriage end reason requires an end date.");
  }

  const [personAId, personBId] = [input.personAId, input.personBId].sort();

  return {
    type: input.type,
    personAId,
    personBId,
    marriageStartDate: input.marriageStartDate ?? null,
    marriageEndDate: input.marriageEndDate ?? null,
    marriageEndReason: input.marriageEndReason ?? null,
  } as const;
}
