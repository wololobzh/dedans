-- Campus lifecycle and audit persistence. Existing campus rows are retained.

CREATE TYPE "CampusStatus" AS ENUM ('active', 'inactive');

ALTER TABLE "Campus" ADD COLUMN "code" TEXT;
ALTER TABLE "Campus" ADD COLUMN "city" TEXT;
ALTER TABLE "Campus" ADD COLUMN "status" "CampusStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "Campus" ADD COLUMN "deactivatedAt" TIMESTAMP(3);
ALTER TABLE "Campus" ADD COLUMN "deactivatedBy" TEXT;
ALTER TABLE "Campus" ADD COLUMN "deactivationReason" TEXT;

-- Give pre-existing rows stable, deterministic codes before making the field required.
UPDATE "Campus"
SET "code" = 'legacy-' || lower(replace("id", '-', ''))
WHERE "code" IS NULL;

-- City was not present in the former model. Preserve rows with an explicit migration value;
-- new writes must provide a non-blank city.
UPDATE "Campus" SET "city" = 'unknown' WHERE "city" IS NULL;

ALTER TABLE "Campus" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Campus" ALTER COLUMN "city" SET NOT NULL;

ALTER TABLE "Campus" DROP CONSTRAINT "Campus_name_key";
CREATE UNIQUE INDEX "Campus_code_key" ON "Campus" ("code");
CREATE UNIQUE INDEX "Campus_active_name_key"
  ON "Campus" (lower(btrim("name")))
  WHERE "status" = 'active';
CREATE INDEX "Campus_status_idx" ON "Campus" ("status");

ALTER TABLE "Campus"
  ADD CONSTRAINT "Campus_name_not_blank_check"
  CHECK (btrim("name") <> '');
ALTER TABLE "Campus"
  ADD CONSTRAINT "Campus_code_normalized_check"
  CHECK ("code" <> '' AND "code" = lower(btrim("code")));
ALTER TABLE "Campus"
  ADD CONSTRAINT "Campus_city_not_blank_check"
  CHECK (btrim("city") <> '');
ALTER TABLE "Campus"
  ADD CONSTRAINT "Campus_deactivation_state_check"
  CHECK (
    ("status" = 'active' AND "deactivatedAt" IS NULL AND "deactivatedBy" IS NULL AND "deactivationReason" IS NULL)
    OR
    ("status" = 'inactive' AND "deactivatedAt" IS NOT NULL AND "deactivatedBy" IS NOT NULL AND btrim("deactivationReason") <> '')
  );

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "authorizedCampusIds" JSONB,
  "before" JSONB,
  "after" JSONB,
  "reason" TEXT,
  "correlationId" TEXT,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditEvent_authorized_campus_ids_check"
    CHECK ("authorizedCampusIds" IS NULL OR jsonb_typeof("authorizedCampusIds") = 'array')
);

CREATE INDEX "AuditEvent_entityType_entityId_occurredAt_idx"
  ON "AuditEvent" ("entityType", "entityId", "occurredAt");
CREATE INDEX "AuditEvent_correlationId_idx" ON "AuditEvent" ("correlationId");
CREATE INDEX "AuditEvent_actorId_occurredAt_idx" ON "AuditEvent" ("actorId", "occurredAt");

CREATE FUNCTION "reject_audit_event_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'AuditEvent is append-only';
END;
$$;

CREATE TRIGGER "AuditEvent_no_update"
  BEFORE UPDATE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION "reject_audit_event_mutation"();
CREATE TRIGGER "AuditEvent_no_delete"
  BEFORE DELETE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION "reject_audit_event_mutation"();