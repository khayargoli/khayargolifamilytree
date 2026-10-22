-- Track which administrator reviewed a profile claim.
ALTER TABLE "PersonAccount" ADD COLUMN "reviewedByUserId" TEXT;

CREATE INDEX "PersonAccount_reviewedByUserId_idx"
    ON "PersonAccount"("reviewedByUserId");

ALTER TABLE "PersonAccount"
    ADD CONSTRAINT "PersonAccount_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
