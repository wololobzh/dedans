-- Campus type and timezone are additive required attributes.
-- Existing rows already have city values from the previous lifecycle migration.
CREATE TYPE "CampusType" AS ENUM ('physical', 'virtual');

ALTER TABLE "Campus" ADD COLUMN "type" "CampusType";
ALTER TABLE "Campus" ADD COLUMN "timezone" TEXT;

-- Legacy campuses had a city and therefore represent physical locations.
-- Europe/Paris is the explicit local-development backfill; operators must review
-- historical rows before using them for timezone-sensitive reporting.
UPDATE "Campus"
SET "type" = 'physical', "timezone" = 'Europe/Paris'
WHERE "type" IS NULL OR "timezone" IS NULL;

ALTER TABLE "Campus" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "Campus" ALTER COLUMN "timezone" SET NOT NULL;

CREATE FUNCTION "is_iana_timezone"(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = candidate);
$$;

ALTER TABLE "Campus"
  ADD CONSTRAINT "Campus_timezone_iana_check"
  CHECK (btrim("timezone") <> '' AND "timezone" = btrim("timezone") AND "is_iana_timezone"("timezone"));