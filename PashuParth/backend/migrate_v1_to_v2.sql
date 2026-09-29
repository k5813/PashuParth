-- =========================================================================
-- PASHUPARTH SCHEMA MIGRATION  v1 → v2
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to run on an existing v1 database (uses IF EXISTS / IF NOT EXISTS)
-- =========================================================================

-- STEP 1 — Drop old farm_workers + user_profiles tables
--          (drop FK columns first so Postgres does not complain)
-- -------------------------------------------------------------------------
ALTER TABLE milking_events    DROP COLUMN IF EXISTS worker_id;
ALTER TABLE treatment_records DROP COLUMN IF EXISTS treated_by_worker_id;
ALTER TABLE manual_entries    DROP COLUMN IF EXISTS recorded_by_worker_id;

DROP TABLE IF EXISTS farm_workers CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;


-- STEP 2 — Create district enum (idempotent)
-- -------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE district_enum AS ENUM (
        'Anand', 'Kheda', 'Mehsana', 'Banaskantha'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- STEP 3 — Create field_personnel table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS field_personnel (
    fp_id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name         VARCHAR(255)  NOT NULL,
    phone_number      VARCHAR(20)   NOT NULL UNIQUE,
    employee_id       VARCHAR(100)  NOT NULL UNIQUE,
    assigned_district district_enum NOT NULL,
    auth_user_id      UUID          UNIQUE,
    first_login_at    TIMESTAMPTZ,
    is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- STEP 4 — Create vets table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vets (
    vet_id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name              VARCHAR(255) NOT NULL,
    phone_number           VARCHAR(20)  NOT NULL UNIQUE,
    vet_council_reg_number VARCHAR(100) NOT NULL UNIQUE,
    registered_by          UUID         REFERENCES field_personnel(fp_id) ON DELETE SET NULL,
    auth_user_id           UUID         UNIQUE,
    first_login_at         TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- STEP 5 — Create admins table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    auth_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- STEP 6 — Alter farms table
-- -------------------------------------------------------------------------
ALTER TABLE farms
    ADD COLUMN IF NOT EXISTS owner_name     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS mobile_number  VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS cattle_count   INT DEFAULT 0 CHECK (cattle_count >= 0),
    ADD COLUMN IF NOT EXISTS buffalo_count  INT DEFAULT 0 CHECK (buffalo_count >= 0),
    ADD COLUMN IF NOT EXISTS registered_by  UUID REFERENCES field_personnel(fp_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS auth_user_id   UUID UNIQUE,
    ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;

-- Drop outdated columns
ALTER TABLE farms
    DROP COLUMN IF EXISTS total_animals,
    DROP COLUMN IF EXISTS herd_size;

-- Migrate district column from VARCHAR to district_enum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name  = 'farms'
          AND column_name = 'district'
          AND data_type   = 'character varying'
    ) THEN
        ALTER TABLE farms RENAME COLUMN district TO district_old;
        ALTER TABLE farms ADD COLUMN district district_enum;
        UPDATE farms
           SET district = district_old::district_enum
         WHERE district_old IN ('Anand','Kheda','Mehsana','Banaskantha');
        ALTER TABLE farms DROP COLUMN district_old;
    END IF;
END $$;


-- STEP 7 — Add treated_by_vet_id to treatment_records
-- -------------------------------------------------------------------------
ALTER TABLE treatment_records
    ADD COLUMN IF NOT EXISTS treated_by_vet_id UUID REFERENCES vets(vet_id) ON DELETE SET NULL;


-- STEP 7b — Animal registration workflow columns
-- -------------------------------------------------------------------------

-- Track which path registered the animal:
--   registered_by_fp_id  = Field Personnel bulk onboarding (most animals)
--   registered_by_fp_id IS NULL = farmer self-service (calf born / animal purchased post-visit)
ALTER TABLE animals
    ADD COLUMN IF NOT EXISTS registered_by_fp_id UUID REFERENCES field_personnel(fp_id) ON DELETE SET NULL;

-- Distinguish alert types so the frontend can render unregistered_rfid alerts
-- differently from mastitis_risk alerts.
ALTER TABLE alerts
    ADD COLUMN IF NOT EXISTS alert_category VARCHAR(50) DEFAULT 'mastitis_risk'
        CHECK (alert_category IN ('mastitis_risk', 'unregistered_rfid', 'sync_failure', 'system'));


-- STEP 8 — Add new indexes
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_farms_district           ON farms (district);
CREATE INDEX IF NOT EXISTS idx_farms_registered_by      ON farms (registered_by);
CREATE INDEX IF NOT EXISTS idx_vets_registered_by       ON vets (registered_by);
CREATE INDEX IF NOT EXISTS idx_field_personnel_district ON field_personnel (assigned_district);


-- STEP 9 — Enable RLS on new tables and add open dev policies
-- -------------------------------------------------------------------------
ALTER TABLE field_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE vets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on vets"            ON vets            FOR SELECT USING (true);
CREATE POLICY "Allow public insert on vets"            ON vets            FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on field_personnel" ON field_personnel FOR SELECT USING (true);
CREATE POLICY "Allow public insert on field_personnel" ON field_personnel FOR INSERT WITH CHECK (true);

-- =========================================================================
-- MIGRATION COMPLETE
-- =========================================================================
