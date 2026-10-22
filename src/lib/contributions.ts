import {
  ChangeRequestStatus,
  ChangeType,
  ClaimStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import { assertAdmin, type Actor } from "./authorization";
import { getPrisma } from "./db";
import {
  personInputSchema,
  relationshipInputSchema,
  validateRelationship,
} from "./validation";

const contributionPersonSchema = personInputSchema
  .omit({ visibility: true })
  .extend({
    visibility: z.literal("RESTRICTED").default("RESTRICTED"),
  });

const contributionPersonUpdateSchema = contributionPersonSchema.partial();

const newPersonRequestSchema = z.object({
  changeType: z.literal(ChangeType.CREATE_PERSON),
  data: contributionPersonSchema,
});

const personUpdateRequestSchema = z.object({
  changeType: z.literal(ChangeType.UPDATE_PERSON),
  personId: z.string().min(1),
  data: contributionPersonUpdateSchema,
});

const relationshipRequestSchema = z.object({
  changeType: z.literal(ChangeType.CREATE_RELATIONSHIP),
  data: relationshipInputSchema,
});

export const changeRequestInputSchema = z.discriminatedUnion("changeType", [
  newPersonRequestSchema,
  personUpdateRequestSchema,
  relationshipRequestSchema,
]);

export type ChangeRequestInput = z.infer<typeof changeRequestInputSchema>;

function approvedMember(actor: Actor) {
  if (
    actor.membershipStatus !== "APPROVED" &&
    actor.role !== UserRole.ADMIN
  ) {
    throw new Error("Approved membership is required to contribute.");
  }
}

export async function submitChangeRequest(
  actor: Actor,
  input: unknown,
) {
  approvedMember(actor);
  const parsed = changeRequestInputSchema.parse(input);
  const personId = "personId" in parsed ? parsed.personId : null;
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    if (personId) {
      const person = await tx.person.findFirst({
        where: { id: personId, archivedAt: null },
        select: { id: true },
      });
      if (!person) throw new Error("The selected person does not exist.");
    }

    const request = await tx.changeRequest.create({
      data: {
        submittedByUserId: actor.userId,
        personId,
        changeType: parsed.changeType,
        proposedData: parsed.data as Prisma.InputJsonValue,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "CHANGE_REQUEST_SUBMITTED",
        entityType: "ChangeRequest",
        entityId: request.id,
        afterSummary: { changeType: request.changeType },
      },
    });

    return request;
  });
}

export async function requestPersonClaim(actor: Actor, personId: string) {
  approvedMember(actor);
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const person = await tx.person.findFirst({
      where: { id: personId, archivedAt: null },
      select: { id: true },
    });
    if (!person) throw new Error("The selected person does not exist.");

    const existingClaim = await tx.personAccount.findFirst({
      where: {
        personId,
        status: { in: [ClaimStatus.PENDING, ClaimStatus.APPROVED] },
      },
    });
    if (existingClaim) {
      throw new Error("This profile already has a pending or approved claim.");
    }

    const claim = await tx.personAccount.create({
      data: { userId: actor.userId, personId },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "PROFILE_CLAIM_SUBMITTED",
        entityType: "PersonAccount",
        entityId: claim.id,
      },
    });

    return claim;
  });
}

export async function getClaimedPersonForUser(userId: string) {
  return getPrisma().personAccount.findFirst({
    where: { userId, status: ClaimStatus.APPROVED },
    include: { person: true },
  });
}

export async function listSubmittedChangeRequests(userId: string) {
  return getPrisma().changeRequest.findMany({
    where: { submittedByUserId: userId },
    include: { person: { select: { id: true, primaryName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingClaimForUser(userId: string) {
  return getPrisma().personAccount.findFirst({
    where: { userId, status: ClaimStatus.PENDING },
    include: { person: { select: { id: true, primaryName: true } } },
  });
}

export async function listPendingChangeRequests() {
  return getPrisma().changeRequest.findMany({
    where: { status: ChangeRequestStatus.PENDING },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      person: { select: { id: true, primaryName: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listPendingClaims() {
  return getPrisma().personAccount.findMany({
    where: { status: ClaimStatus.PENDING },
    include: {
      user: { select: { id: true, name: true, email: true } },
      person: { select: { id: true, primaryName: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function reviewClaim(
  actor: Actor,
  claimId: string,
  status: "APPROVED" | "REJECTED",
) {
  assertAdmin(actor);
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const claim = await tx.personAccount.findUniqueOrThrow({
      where: { id: claimId },
    });
    if (claim.status !== ClaimStatus.PENDING) {
      throw new Error("This claim has already been reviewed.");
    }
    if (status === ClaimStatus.APPROVED) {
      const approvedClaim = await tx.personAccount.findFirst({
        where: {
          personId: claim.personId,
          status: ClaimStatus.APPROVED,
          id: { not: claim.id },
        },
      });
      if (approvedClaim) {
        throw new Error("This person already has an approved claim.");
      }
    }

    const updated = await tx.personAccount.update({
      where: { id: claim.id },
      data: { status, reviewedByUserId: actor.userId },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "PROFILE_CLAIM_REVIEWED",
        entityType: "PersonAccount",
        entityId: claim.id,
        afterSummary: { status },
      },
    });
    return updated;
  });
}

export async function reviewChangeRequest(
  actor: Actor,
  requestId: string,
  status: "APPROVED" | "REJECTED",
  reviewNote?: string,
) {
  assertAdmin(actor);
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const request = await tx.changeRequest.findUniqueOrThrow({
      where: { id: requestId },
    });
    if (request.status !== ChangeRequestStatus.PENDING) {
      throw new Error("This change request has already been reviewed.");
    }

    let entityId = request.personId ?? request.id;
    if (status === ChangeRequestStatus.APPROVED) {
      if (request.changeType === ChangeType.CREATE_PERSON) {
        const data = contributionPersonSchema.parse(request.proposedData);
        const person = await tx.person.create({
          data: {
            ...data,
            createdByUserId: request.submittedByUserId,
            names: { create: data.alternateNames.map((name) => ({ name })) },
          },
        });
        entityId = person.id;
      } else if (request.changeType === ChangeType.UPDATE_PERSON) {
        const data = contributionPersonUpdateSchema.parse(
          request.proposedData,
        );
        if (!request.personId) throw new Error("The change has no target.");
        const { alternateNames, ...fields } = data;
        await tx.person.update({
          where: { id: request.personId },
          data: fields,
        });
        if (alternateNames) {
          await tx.personName.createMany({
            data: alternateNames.map((name) => ({
              personId: request.personId as string,
              name,
            })),
            skipDuplicates: true,
          });
        }
        entityId = request.personId;
      } else if (request.changeType === ChangeType.CREATE_RELATIONSHIP) {
        const data = relationshipInputSchema.parse(request.proposedData);
        const normalized = validateRelationship(data);
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
            createdByUserId: request.submittedByUserId,
            reviewedByUserId: actor.userId,
          },
        });
        entityId = relationship.id;
      }
    }

    const updated = await tx.changeRequest.update({
      where: { id: request.id },
      data: {
        status,
        reviewedByUserId: actor.userId,
        reviewNote: reviewNote?.trim() || null,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "CHANGE_REQUEST_REVIEWED",
        entityType: "ChangeRequest",
        entityId: request.id,
        afterSummary: { status, entityId },
      },
    });
    return updated;
  });
}
