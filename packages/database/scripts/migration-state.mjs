import pg from 'pg';

const { Pool } = pg;
const migrations = ['20260827000100_init', '20260828000100_add_campus_lifecycle_and_audit', '20260829000100_add_campus_type_and_timezone', '20260829000200_allow_virtual_campus_without_city'];
const expectedTables = ['Campus', 'Program', 'Cohort', 'Learner', 'Enrollment', 'AuditEvent'];
const expectedIndexes = ['Campus_code_key', 'Campus_active_name_key', 'Campus_status_idx', 'Cohort_campusId_idx', 'Cohort_programId_idx', 'Learner_email_key', 'Enrollment_learnerId_idx', 'Enrollment_cohortId_status_idx', 'AuditEvent_entityType_entityId_occurredAt_idx', 'AuditEvent_correlationId_idx', 'AuditEvent_actorId_occurredAt_idx'];
const expectedConstraints = ['Campus_name_not_blank_check', 'Campus_code_normalized_check', 'Campus_city_by_type_check', 'Campus_deactivation_state_check', 'Campus_timezone_iana_check', 'AuditEvent_authorized_campus_ids_check'];
const expectedTriggers = ['AuditEvent_no_update', 'AuditEvent_no_delete'];

async function inspect(pool) {
  const result = await pool.query(`
    SELECT to_regclass('public."_prisma_migrations"') IS NOT NULL AS migrations_table,
      (SELECT count(*) FROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace AND relname = ANY($1::text[])) AS table_count,
      (SELECT count(*) FROM pg_class WHERE relkind IN ('i', 'I') AND relnamespace = 'public'::regnamespace AND relname = ANY($2::text[])) AS index_count,
      (SELECT count(*) FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND conname = ANY($3::text[])) AS constraint_count,
      (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE c.relnamespace = 'public'::regnamespace AND NOT t.tgisinternal AND t.tgname = ANY($4::text[])) AS trigger_count
  `, [expectedTables, expectedIndexes, expectedConstraints, expectedTriggers]);
  const state = result.rows[0];
  const applied = state.migrations_table ? await pool.query('SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at') : { rows: [] };
  const failed = applied.rows.filter((row) => row.rolled_back_at !== null || row.finished_at === null);
  if (failed.length > 0) throw new Error(`Database has failed or rolled-back migrations: ${failed.map((row) => row.migration_name).join(', ')}`);
  const appliedNames = new Set(applied.rows.filter((row) => row.finished_at !== null && row.rolled_back_at === null).map((row) => row.migration_name));
  const schemaComplete = Number(state.table_count) === expectedTables.length && Number(state.index_count) === expectedIndexes.length && Number(state.constraint_count) === expectedConstraints.length && Number(state.trigger_count) === expectedTriggers.length;
  if (!state.migrations_table && Number(state.table_count) === 0) return 'empty';
  if (state.migrations_table && appliedNames.size === 0 && Number(state.table_count) === 0) return 'empty';
  if (migrations.every((migration) => appliedNames.has(migration)) && schemaComplete) return 'tracked';
  if (appliedNames.size > 0 && migrations.some((migration) => !appliedNames.has(migration))) return 'pending';
  if (migrations.every((migration) => appliedNames.has(migration))) return 'drifted';
  return 'partial';
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const state = await inspect(pool);
  if (process.argv.includes('--verify') && state !== 'tracked') throw new Error(`Database verification failed: ${state}`);
  console.log(process.argv.includes('--verify') ? 'verified' : state);
} finally {
  await pool.end();
}
