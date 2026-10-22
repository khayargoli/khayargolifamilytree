import {
  Prisma,
  RelationshipStatus,
  RelationshipType,
} from "@prisma/client";

import { assertAdmin, type Actor } from "./authorization";
import { getPrisma } from "./db";
import {
  personInputSchema,
  validateRelationship,
  relationshipInputSchema,
  type PersonInput,
  type RelationshipInput,
} from "./validation";

function personData(input: PersonInput) {
  const { alternateNames, ...data } = input;

  return {
    ...data,
    names: {
      create: alternateNames.map((name) => ({ name })),
    },
  };
}

function personFields(input: PersonInput) {
  const { alternateNames, ...data } = input;
  void alternateNames;
  return data;
}

function auditSummary(primaryName: string, visibility: string) {
  return { primaryName, visibility };
}

export async function listPeople() {
  return getPrisma().person.findMany({
    where: { archivedAt: null },
    include: { names: true },
    orderBy: { primaryName: "asc" },
  });
}

export async function getPersonWithRelationships(personId: string) {
  return getPrisma().person.findFirst({
    where: { id: personId, archivedAt: null },
    include: {
      names: true,
      relationshipsAsA: {
        where: { status: RelationshipStatus.PUBLISHED },
        include: { personB: true },
      },
      relationshipsAsB: {
        where: { status: RelationshipStatus.PUBLISHED },
        include: { personA: true },
      },
    },
  });
}

export async function createPerson(actor: Actor, input: unknown) {
  assertAdmin(actor);
  const parsed = personInputSchema.parse(input);
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        ...personData(parsed),
        createdByUserId: actor.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "PERSON_CREATED",
        entityType: "Person",
        entityId: person.id,
        afterSummary: auditSummary(person.primaryName, person.visibility),
      },
    });

    return person;
  });
}

export async function updatePerson(
  actor: Actor,
  personId: string,
  input: unknown,
) {
  assertAdmin(actor);
  const parsed = personInputSchema.parse(input);
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const before = await tx.person.findUniqueOrThrow({
      where: { id: personId },
    });
    const person = await tx.person.update({
      where: { id: personId },
      data: {
        ...personFields(parsed),
        names: {
          deleteMany: {},
        },
      },
    });

    await tx.personName.createMany({
      data: parsed.alternateNames.map((name) => ({ personId, name })),
    });
    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "PERSON_UPDATED",
        entityType: "Person",
        entityId: person.id,
        beforeSummary: auditSummary(before.primaryName, before.visibility),
        afterSummary: auditSummary(person.primaryName, person.visibility),
      },
    });

    return person;
  });
}

export async function archivePerson(actor: Actor, personId: string) {
  assertAdmin(actor);
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const person = await tx.person.update({
      where: { id: personId },
      data: {
        archivedAt: new Date(),
        visibility: "RESTRICTED",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "PERSON_ARCHIVED",
        entityType: "Person",
        entityId: person.id,
        afterSummary: auditSummary(person.primaryName, person.visibility),
      },
    });

    return person;
  });
}

export async function createRelationship(
  actor: Actor,
  input: RelationshipInput,
) {
  assertAdmin(actor);
  const parsed = relationshipInputSchema.parse(input);
  const normalized = validateRelationship(parsed);
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const people = await tx.person.findMany({
      where: {
        id: { in: [normalized.personAId, normalized.personBId] },
        archivedAt: null,
      },
      select: { id: true },
    });

    if (people.length !== 2) {
      throw new Error("Both people must exist and be active.");
    }

    const relationship = await tx.relationship.create({
      data: {
        ...normalized,
        createdByUserId: actor.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "RELATIONSHIP_CREATED",
        entityType: "Relationship",
        entityId: relationship.id,
        afterSummary: {
          type: relationship.type,
          personAId: relationship.personAId,
          personBId: relationship.personBId,
        },
      },
    });

    return relationship;
  });
}

export async function removeRelationship(actor: Actor, relationshipId: string) {
  assertAdmin(actor);
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const relationship = await tx.relationship.delete({
      where: { id: relationshipId },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "RELATIONSHIP_REMOVED",
        entityType: "Relationship",
        entityId: relationship.id,
        beforeSummary: {
          type: relationship.type,
          personAId: relationship.personAId,
          personBId: relationship.personBId,
        },
      },
    });

    return relationship;
  });
}

export type RelationshipRecord = Prisma.RelationshipGetPayload<{
  include: { personA: true; personB: true };
}>;

export async function listRelationships() {
  return getPrisma().relationship.findMany({
    where: { status: RelationshipStatus.PUBLISHED },
    include: { personA: true, personB: true },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });
}

export function isParentChildRelationship(
  relationship: RelationshipRecord,
): boolean {
  return relationship.type === RelationshipType.PARENT_CHILD;
}
