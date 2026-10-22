import { RelationshipStatus } from "@prisma/client";
import { z } from "zod";

import { getPrisma } from "./db";

export const publicPersonSelect = {
  id: true,
  primaryName: true,
  biography: true,
  occupation: true,
  birthDate: true,
  deathDate: true,
  birthPlace: true,
  isLiving: true,
  names: {
    select: {
      name: true,
    },
    orderBy: {
      name: "asc" as const,
    },
  },
} as const;

const searchInputSchema = z.object({
  query: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).default(1),
});

const pageSize = 20;

export type PublicPerson = Awaited<
  ReturnType<typeof getPublicPersonProfile>
>;

export async function searchPublicPeople(input: {
  query?: string;
  page?: number;
}) {
  const { query, page } = searchInputSchema.parse(input);
  const where = {
    visibility: "PUBLIC" as const,
    archivedAt: null,
    ...(query
      ? {
          OR: [
            { primaryName: { contains: query, mode: "insensitive" as const } },
            {
              names: {
                some: { name: { contains: query, mode: "insensitive" as const } },
              },
            },
          ],
        }
      : {}),
  };
  const prisma = getPrisma();
  const [people, total] = await prisma.$transaction([
    prisma.person.findMany({
      where,
      select: publicPersonSelect,
      orderBy: { primaryName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.person.count({ where }),
  ]);

  return {
    people,
    query,
    page,
    pageSize,
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPublicPersonProfile(personId: string) {
  return getPrisma().person.findFirst({
    where: {
      id: personId,
      visibility: "PUBLIC",
      archivedAt: null,
    },
    select: {
      ...publicPersonSelect,
      relationshipsAsA: {
        where: {
          status: RelationshipStatus.PUBLISHED,
          personB: {
            visibility: "PUBLIC",
            archivedAt: null,
          },
        },
        select: {
          id: true,
          type: true,
          marriageStartDate: true,
          marriageEndDate: true,
          marriageEndReason: true,
          personB: {
            select: publicPersonSelect,
          },
        },
        orderBy: { createdAt: "asc" },
      },
      relationshipsAsB: {
        where: {
          status: RelationshipStatus.PUBLISHED,
          personA: {
            visibility: "PUBLIC",
            archivedAt: null,
          },
        },
        select: {
          id: true,
          type: true,
          marriageStartDate: true,
          marriageEndDate: true,
          marriageEndReason: true,
          personA: {
            select: publicPersonSelect,
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
