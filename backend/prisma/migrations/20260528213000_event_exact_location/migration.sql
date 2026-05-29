ALTER TABLE "events"
ADD COLUMN "venue" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

CREATE INDEX "events_location_idx" ON "events"("location");
