import {
  MarriageEndReason,
  MembershipStatus,
  PersonVisibility,
  RelationshipStatus,
  RelationshipType,
  UserRole,
} from "@prisma/client";

import { getPrisma } from "../src/lib/db";

const prisma = getPrisma();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.test" },
    update: {},
    create: {
      id: "seed-admin",
      name: "Fictional Admin",
      email: "admin@example.test",
      role: UserRole.ADMIN,
      membershipStatus: MembershipStatus.APPROVED,
    },
  });

  const people = [
    {
      id: "seed-asha",
      primaryName: "Asha Khayargoli",
      alternateNames: ["आशा खयारगोली"],
      occupation: "Teacher",
      visibility: PersonVisibility.PUBLIC,
    },
    {
      id: "seed-bir",
      primaryName: "Bir Khayargoli",
      alternateNames: ["वीर खयारगोली"],
      occupation: "Farmer",
      visibility: PersonVisibility.PUBLIC,
    },
    {
      id: "seed-chandra",
      primaryName: "Chandra Thapa",
      alternateNames: ["चन्द्र थापा"],
      occupation: "Nurse",
      visibility: PersonVisibility.PUBLIC,
    },
    {
      id: "seed-deepa",
      primaryName: "Deepa Khayargoli",
      alternateNames: ["दीपा खयारगोली"],
      occupation: null,
      visibility: PersonVisibility.PUBLIC,
    },
    {
      id: "seed-eshal",
      primaryName: "Eshal Khayargoli",
      alternateNames: [],
      occupation: null,
      visibility: PersonVisibility.PUBLIC,
    },
  ];

  for (const person of people) {
    const { alternateNames, ...personData } = person;
    await prisma.person.upsert({
      where: { id: person.id },
      update: {
        primaryName: person.primaryName,
        occupation: person.occupation,
        visibility: person.visibility,
      },
      create: {
        ...personData,
        createdByUserId: admin.id,
        names: {
          create: alternateNames.map((name) => ({ name })),
        },
      },
    });
  }

  const relationships = [
    {
      type: RelationshipType.SPOUSE,
      personAId: "seed-asha",
      personBId: "seed-bir",
      marriageStartDate: new Date("1980-01-01"),
      marriageEndDate: new Date("1998-01-01"),
      marriageEndReason: MarriageEndReason.DEATH,
    },
    {
      type: RelationshipType.SPOUSE,
      personAId: "seed-bir",
      personBId: "seed-chandra",
      marriageStartDate: new Date("2001-01-01"),
      marriageEndDate: null,
      marriageEndReason: null,
    },
    {
      type: RelationshipType.PARENT_CHILD,
      personAId: "seed-asha",
      personBId: "seed-deepa",
      marriageStartDate: null,
      marriageEndDate: null,
      marriageEndReason: null,
    },
    {
      type: RelationshipType.PARENT_CHILD,
      personAId: "seed-bir",
      personBId: "seed-deepa",
      marriageStartDate: null,
      marriageEndDate: null,
      marriageEndReason: null,
    },
    {
      type: RelationshipType.PARENT_CHILD,
      personAId: "seed-bir",
      personBId: "seed-eshal",
      marriageStartDate: null,
      marriageEndDate: null,
      marriageEndReason: null,
    },
    {
      type: RelationshipType.PARENT_CHILD,
      personAId: "seed-chandra",
      personBId: "seed-eshal",
      marriageStartDate: null,
      marriageEndDate: null,
      marriageEndReason: null,
    },
  ];

  for (const relationship of relationships) {
    const { type, personAId, personBId, ...dates } = relationship;
    await prisma.relationship.upsert({
      where: {
        type_personAId_personBId: { type, personAId, personBId },
      },
      update: dates,
      create: {
        type,
        personAId,
        personBId,
        status: RelationshipStatus.PUBLISHED,
        ...dates,
        createdByUserId: admin.id,
      },
    });
  }

  console.log("Seeded fictional Khayargoli family data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
