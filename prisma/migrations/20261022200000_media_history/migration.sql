-- Add reviewed family stories and authenticated Cloudinary media.
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'RESTRICTED');

CREATE TABLE "FamilyStory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "personId" TEXT,
    "submittedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'RESTRICTED',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyStory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'image',
    "assetType" TEXT NOT NULL DEFAULT 'authenticated',
    "format" TEXT,
    "bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "caption" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "personId" TEXT,
    "storyId" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'RESTRICTED',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Media_cloudinaryPublicId_key"
    ON "Media"("cloudinaryPublicId");
CREATE INDEX "FamilyStory_status_createdAt_idx"
    ON "FamilyStory"("status", "createdAt");
CREATE INDEX "FamilyStory_personId_idx" ON "FamilyStory"("personId");
CREATE INDEX "Media_status_createdAt_idx" ON "Media"("status", "createdAt");
CREATE INDEX "Media_personId_idx" ON "Media"("personId");
CREATE INDEX "Media_storyId_idx" ON "Media"("storyId");

ALTER TABLE "FamilyStory"
    ADD CONSTRAINT "FamilyStory_personId_fkey"
    FOREIGN KEY ("personId") REFERENCES "Person"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FamilyStory"
    ADD CONSTRAINT "FamilyStory_submittedByUserId_fkey"
    FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FamilyStory"
    ADD CONSTRAINT "FamilyStory_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media"
    ADD CONSTRAINT "Media_uploadedByUserId_fkey"
    FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Media"
    ADD CONSTRAINT "Media_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media"
    ADD CONSTRAINT "Media_personId_fkey"
    FOREIGN KEY ("personId") REFERENCES "Person"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media"
    ADD CONSTRAINT "Media_storyId_fkey"
    FOREIGN KEY ("storyId") REFERENCES "FamilyStory"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
