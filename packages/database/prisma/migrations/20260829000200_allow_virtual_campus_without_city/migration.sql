-- Virtual campuses may omit a physical city; physical campuses still require one.
ALTER TABLE "Campus" ALTER COLUMN "city" DROP NOT NULL;
ALTER TABLE "Campus" DROP CONSTRAINT "Campus_city_not_blank_check";
ALTER TABLE "Campus"
  ADD CONSTRAINT "Campus_city_by_type_check"
  CHECK ("type" = 'virtual' OR ("city" IS NOT NULL AND btrim("city") <> ''));