import { v2 as cloudinary } from "cloudinary";
import {
  MediaStatus,
  MediaVisibility,
  Prisma,
} from "@prisma/client";
import { z } from "zod";

import { assertAdmin, type Actor } from "./authorization";
import { getPrisma } from "./db";

const mediaInputSchema = z.object({
  caption: z.string().trim().max(500).optional().nullable(),
  personId: z.string().min(1).optional().nullable(),
  storyId: z.string().min(1).optional().nullable(),
});

const storyInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(50_000),
  personId: z.string().min(1).optional().nullable(),
});

const maxImageBytes = 10 * 1024 * 1024;

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}

function assertContributor(actor: Actor) {
  if (actor.membershipStatus !== "APPROVED" && actor.role !== "ADMIN") {
    throw new Error("Approved membership is required to contribute media.");
  }
}

export async function submitPhoto(
  actor: Actor,
  file: File,
  input: unknown,
) {
  assertContributor(actor);
  const data = mediaInputSchema.parse(input);
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }
  if (file.size === 0 || file.size > maxImageBytes) {
    throw new Error("Images must be smaller than 10 MB.");
  }

  const client = configureCloudinary();
  const publicId = `pending/${actor.userId}/${crypto.randomUUID()}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await new Promise<{
    public_id: string;
    resource_type: string;
    type: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
  }>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        public_id: publicId,
        folder: "khayargoli",
        resource_type: "image",
        type: "authenticated",
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed."));
        else resolve(result);
      },
    );
    stream.end(buffer);
  });

  try {
    const prisma = getPrisma();
    const media = await prisma.$transaction(async (tx) => {
      const record = await tx.media.create({
        data: {
          cloudinaryPublicId: upload.public_id,
          resourceType: upload.resource_type,
          assetType: upload.type,
          format: upload.format,
          bytes: upload.bytes,
          width: upload.width,
          height: upload.height,
          caption: data.caption,
          uploadedByUserId: actor.userId,
          personId: data.personId,
          storyId: data.storyId,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: "MEDIA_SUBMITTED",
          entityType: "Media",
          entityId: record.id,
          afterSummary: { resourceType: record.resourceType },
        },
      });
      return record;
    });
    return media;
  } catch (error) {
    await client.uploader.destroy(upload.public_id, {
      resource_type: "image",
      type: "authenticated",
    });
    throw error;
  }
}

export async function submitStory(actor: Actor, input: unknown) {
  assertContributor(actor);
  const data = storyInputSchema.parse(input);
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const story = await tx.familyStory.create({
      data: {
        ...data,
        submittedByUserId: actor.userId,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "STORY_SUBMITTED",
        entityType: "FamilyStory",
        entityId: story.id,
      },
    });
    return story;
  });
}

export async function listPendingMedia() {
  return getPrisma().media.findMany({
    where: { status: MediaStatus.PENDING },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      person: { select: { primaryName: true } },
      story: { select: { title: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listPendingStories() {
  return getPrisma().familyStory.findMany({
    where: { status: MediaStatus.PENDING },
    include: {
      submittedBy: { select: { name: true, email: true } },
      person: { select: { primaryName: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listPublicStories() {
  return getPrisma().familyStory.findMany({
    where: {
      status: MediaStatus.APPROVED,
      visibility: MediaVisibility.PUBLIC,
    },
    include: {
      person: { select: { id: true, primaryName: true } },
      media: {
        where: {
          status: MediaStatus.APPROVED,
          visibility: MediaVisibility.PUBLIC,
        },
        select: {
          id: true,
          cloudinaryPublicId: true,
          resourceType: true,
          format: true,
          status: true,
          visibility: true,
          caption: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function reviewMedia(
  actor: Actor,
  mediaId: string,
  status: "APPROVED" | "REJECTED",
  reviewNote?: string,
) {
  assertAdmin(actor);
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const media = await tx.media.update({
      where: { id: mediaId },
      data: {
        status,
        visibility:
          status === MediaStatus.APPROVED
            ? MediaVisibility.PUBLIC
            : MediaVisibility.RESTRICTED,
        reviewedByUserId: actor.userId,
        reviewNote: reviewNote?.trim() || null,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "MEDIA_REVIEWED",
        entityType: "Media",
        entityId: media.id,
        afterSummary: { status: media.status },
      },
    });
    return media;
  });
}

export async function reviewStory(
  actor: Actor,
  storyId: string,
  status: "APPROVED" | "REJECTED",
  reviewNote?: string,
) {
  assertAdmin(actor);
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const story = await tx.familyStory.update({
      where: { id: storyId },
      data: {
        status,
        visibility:
          status === MediaStatus.APPROVED
            ? MediaVisibility.PUBLIC
            : MediaVisibility.RESTRICTED,
        reviewedByUserId: actor.userId,
        reviewNote: reviewNote?.trim() || null,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "STORY_REVIEWED",
        entityType: "FamilyStory",
        entityId: story.id,
        afterSummary: { status: story.status },
      },
    });
    return story;
  });
}

export function getApprovedMediaUrl(media: {
  cloudinaryPublicId: string;
  resourceType: string;
  format: string | null;
  status: MediaStatus;
  visibility: MediaVisibility;
}) {
  if (
    media.status !== MediaStatus.APPROVED ||
    media.visibility !== MediaVisibility.PUBLIC
  ) {
    return null;
  }
  const client = configureCloudinary();
  return client.url(media.cloudinaryPublicId, {
    type: "authenticated",
    resource_type: media.resourceType,
    secure: true,
    sign_url: true,
    format: media.format ?? undefined,
  });
}

export type MediaJson = Prisma.JsonObject;
