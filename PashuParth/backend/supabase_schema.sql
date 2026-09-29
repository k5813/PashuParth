-- =========================================================================
-- PASHUPARTH SCHEMA v2 — SUPABASE POSTGRESQL DDL
-- =========================================================================
-- Production Database DDL for Bovine Mastitis Early Forecasting System (PS 26109)
-- v2 Changes:
--   • Dropped farm_workers table (no workers model in v1 — farmer = milker = one login)
--   • Dropped user_profiles monolithic role table
--   • farms: added owner_name, mobile_number, cattle_count, buffalo_count,
--             registered_by (FK → field_personnel), auth_user_id, first_login_at
--   • New table: vets
--   • New table: field_personnel
--   • New table: admins
--   • New enum: district_enum (Anand, Kheda, Mehsana, Banaskantha)
--   • Removed worker_id FKs from milking_events, treatment_records, manual_entries
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- -------------------------------------------------------------------------
-- 0. ENUMS
-- -------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE district_enum AS ENUM (
        'Anand',
        'Kheda',
        'Mehsana',
        'Banaskantha'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- -------------------------------------------------------------------------
-- 1. FIELD PERSONNEL TABLE
--    (Must be created before farms, because farms.registered_by → field_personnel)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS field_personnel (
    fp_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name        VARCHAR(255) NOT NULL,
    phone_number     VARCHAR(20)  NOT NULL UNIQUE,
    employee_id      VARCHAR(100) NOT NULL UNIQUE,
    assigned_district district_enum NOT NULL,
    auth_user_id     UUID UNIQUE,                    -- nullable; filled on first Supabase auth login
    first_login_at   TIMESTAMPTZ,                    -- nullable; set on first successful login
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,  -- deactivate instead of delete
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN field_personnel.is_active IS
    'Soft-delete flag. Set FALSE to deactivate; never hard-delete so historical registered_by links stay intact.';
COMMENT ON COLUMN field_personnel.auth_user_id IS
    'Populated on first login via Supabase Auth trigger; NULL until the person first logs in.';


-- -------------------------------------------------------------------------
-- 2. VETS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vets (
    vet_id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name               VARCHAR(255) NOT NULL,
    phone_number            VARCHAR(20)  NOT NULL UNIQUE,
    vet_council_reg_number  VARCHAR(100) NOT NULL UNIQUE,
    registered_by           UUID REFERENCES field_personnel(fp_id) ON DELETE SET NULL,
    auth_user_id            UUID UNIQUE,             -- nullable; filled on first login
    first_login_at          TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN vets.registered_by IS
    'FK to the field_personnel row that onboarded this vet. SET NULL on personnel deactivation — record stays.';
COMMENT ON COLUMN vets.auth_user_id IS
    'Populated on first login via Supabase Auth trigger; NULL until first login.';


-- -------------------------------------------------------------------------
-- 3. ADMINS TABLE
--    PK = auth_user_id (Supabase auth.users UUID). No self-registration path.
--    Rows are seeded manually by a DB admin, never through the app.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    auth_user_id  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admins IS
    'Seeded manually. No app-facing registration path. auth_user_id is both PK and FK to auth.users.';


-- -------------------------------------------------------------------------
-- 4. FARMS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farms (
    farm_id          VARCHAR(50)   PRIMARY KEY,
    farm_name        VARCHAR(255)  NOT NULL,
    owner_name       VARCHAR(255)  NOT NULL,
    mobile_number    VARCHAR(20)   NOT NULL UNIQUE,
    district         district_enum NOT NULL,
    cattle_count     INT           NOT NULL DEFAULT 0 CHECK (cattle_count >= 0),
    buffalo_count    INT           NOT NULL DEFAULT 0 CHECK (buffalo_count >= 0),
    registered_by    UUID          REFERENCES field_personnel(fp_id) ON DELETE SET NULL,
    auth_user_id     UUID          UNIQUE,           -- nullable; filled on first farmer login
    first_login_at   TIMESTAMPTZ,                    -- nullable
    -- Existing operational / static fields
    latitude         NUMERIC(10, 6),
    longitude        NUMERIC(10, 6),
    housing_type     VARCHAR(100)  DEFAULT 'Stall-Fed',
    bedding_type     VARCHAR(100)  DEFAULT 'Rubber Mats',
    bedding_cleaning_freq  VARCHAR(100) DEFAULT 'Twice Daily',
    milking_system_type    VARCHAR(100) DEFAULT 'Bucket Milker',
    milkings_per_day       INT          DEFAULT 2,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN farms.owner_name IS 'Farmer full name — denormalized here for quick lookups without a join.';
COMMENT ON COLUMN farms.mobile_number IS 'Farmer contact number; unique per farm row (one farmer = one farm in v1).';
COMMENT ON COLUMN farms.registered_by IS 'FK to the field_personnel row that onboarded this farm.';
COMMENT ON COLUMN farms.auth_user_id IS 'Populated on first farmer login via Supabase Auth trigger; NULL until first login.';
COMMENT ON COLUMN farms.first_login_at IS 'Set once, on the farmer''s first successful Supabase Auth login.';


-- -------------------------------------------------------------------------
-- 5. ANIMALS TABLE (Slow-changing master entity)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS animals (
    animal_id            VARCHAR(50) PRIMARY KEY,
    rfid_tag             VARCHAR(100) UNIQUE NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    species              VARCHAR(50)  NOT NULL CHECK (species IN ('Cattle', 'Buffalo')),
    breed                VARCHAR(100) NOT NULL,
    birth_date           DATE,
    lactation_number     INT          DEFAULT 1,
    days_in_milk         INT          DEFAULT 0,
    farm_id              VARCHAR(50)  NOT NULL REFERENCES farms(farm_id),
    current_risk_score   INT          DEFAULT 0 CHECK (current_risk_score BETWEEN 0 AND 100),
    current_risk_band    VARCHAR(50)  DEFAULT 'No Risk'
                             CHECK (current_risk_band IN ('No Risk', 'Low Risk', 'Moderate Risk', 'High Risk')),
    forecast_lead_days   INT          DEFAULT 14,
    body_temp            NUMERIC(4,1) DEFAULT 38.5,
    rumination_minutes   INT          DEFAULT 500,
    vaccination_status   JSONB        DEFAULT '{}'::jsonb,
    disease_history      JSONB        DEFAULT '{}'::jsonb,
    genetics             JSONB        DEFAULT '{}'::jsonb,
    last_tested_at       TIMESTAMPTZ  DEFAULT NOW(),
    registered_by_fp_id  UUID         REFERENCES field_personnel(fp_id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ  DEFAULT NOW()
);


-- -------------------------------------------------------------------------
-- 6. MILKING EVENTS TABLE (One row per milking session)
--    worker_id column removed (no workers table in v1)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS milking_events (
    milking_event_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id               VARCHAR(50)  NOT NULL REFERENCES animals(animal_id) ON DELETE CASCADE,
    milking_ts              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    duration_seconds        INT,
    total_milk_l            NUMERIC(5,2),
    milk_per_teat           JSONB,                   -- {fl, fr, bl, br} litres
    abnormal_flow           BOOLEAN      DEFAULT FALSE,
    gap_since_last_milking_min INT,
    ec_bulk                 NUMERIC(4,2),
    ec_per_quarter          JSONB,                   -- {fl, fr, bl, br} mS/cm
    milk_temp_c             NUMERIC(4,1),
    ph                      NUMERIC(3,2),
    udder_temp_c            NUMERIC(4,1),
    flow_rate_curve         JSONB                    -- sampled array
);


-- -------------------------------------------------------------------------
-- 7. COLLAR READINGS TABLE (Buffered batch inserts per animal)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collar_readings (
    collar_reading_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id          VARCHAR(50)  NOT NULL REFERENCES animals(animal_id) ON DELETE CASCADE,
    rumination_time_min INT,
    standing_time_min   INT,
    lying_time_min      INT,
    body_temp_c         NUMERIC(4,1),
    feeding_time_min    INT,                         -- roadmap column, nullable
    activity_index      NUMERIC(5,2),
    recorded_at         TIMESTAMPTZ  DEFAULT NOW()
);


-- -------------------------------------------------------------------------
-- 8. BARN READINGS TABLE (Farm-level interval-based telemetry)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS barn_readings (
    barn_reading_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id          VARCHAR(50)  NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
    temp_c           NUMERIC(4,1),
    ammonia_ppm      NUMERIC(5,2),
    co_ppm           NUMERIC(5,2),
    co2_ppm          NUMERIC(6,1),
    humidity_pct     NUMERIC(4,1),
    recorded_at      TIMESTAMPTZ  DEFAULT NOW()
);


-- -------------------------------------------------------------------------
-- 9. LACTATION CYCLES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lactation_cycles (
    cycle_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id            VARCHAR(50) NOT NULL REFERENCES animals(animal_id) ON DELETE CASCADE,
    lactation_number     INT         NOT NULL,
    calving_date         DATE        NOT NULL,
    dry_off_date         DATE,
    dry_period_end_date  DATE,
    calving_difficulty   VARCHAR(255),
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN lactation_cycles.cycle_id IS
    'DIM is not stored — derived at query time as (NOW() - calving_date) for the open cycle.';


-- -------------------------------------------------------------------------
-- 10. TREATMENT RECORDS TABLE (AMR Drug & Withdrawal tracking)
--     treated_by_worker_id removed; replaced with treated_by_vet_id
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatment_records (
    treatment_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id          VARCHAR(50)  NOT NULL REFERENCES animals(animal_id) ON DELETE CASCADE,
    diagnosis          TEXT         NOT NULL,
    affected_quarter   VARCHAR(50),
    drug_name          VARCHAR(255) NOT NULL,
    dosage             VARCHAR(100) NOT NULL,
    treatment_date     TIMESTAMPTZ  DEFAULT NOW(),
    withdrawal_days    INT          DEFAULT 0,
    withdrawal_end_date TIMESTAMPTZ,
    treated_by_vet_id  UUID         REFERENCES vets(vet_id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON COLUMN treatment_records.treated_by_vet_id IS
    'FK to vets table. SET NULL if vet row is removed — record stays for AMR audit trail.';


-- -------------------------------------------------------------------------
-- 11. MASTITIS LABELS TABLE (SCC Lab & CMT Manual test results)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mastitis_labels (
    label_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id  VARCHAR(50)  NOT NULL REFERENCES animals(animal_id) ON DELETE CASCADE,
    scc_lab    INT,
    cmt_result VARCHAR(50),
    source     VARCHAR(100) DEFAULT 'Lab',
    tested_at  TIMESTAMPTZ  DEFAULT NOW()
);


-- -------------------------------------------------------------------------
-- 12. GENERIC MANUAL ENTRIES TABLE (JSONB payload by category)
--     recorded_by_worker_id removed (no workers table in v1)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manual_entries (
    entry_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id    VARCHAR(50)  REFERENCES farms(farm_id),
    animal_id  VARCHAR(50)  REFERENCES animals(animal_id),
    category   VARCHAR(100) NOT NULL
                   CHECK (category IN (
                       'milking_hygiene',
                       'nutrition',
                       'reproductive_status',
                       'symptom_self_report',
                       'clinical',
                       'hygiene',
                       'treatment'
                   )),
    payload    JSONB        NOT NULL,
    photo_url  TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- -------------------------------------------------------------------------
-- 13. QUARTER TEAT TELEMETRY TABLE (Legacy Stage 1 & 2 ingestion compat.)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teat_telemetry (
    telemetry_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id         VARCHAR(50)  NOT NULL REFERENCES animals(animal_id) ON DELETE CASCADE,
    rfid_tag          VARCHAR(100) NOT NULL,
    device_id         VARCHAR(100) NOT NULL,
    front_left_ec     NUMERIC(4,2) NOT NULL,
    front_left_ph     NUMERIC(3,2) NOT NULL,
    front_left_temp   NUMERIC(4,1) NOT NULL,
    front_left_clot   BOOLEAN      DEFAULT FALSE,
    front_right_ec    NUMERIC(4,2) NOT NULL,
    front_right_ph    NUMERIC(3,2) NOT NULL,
    front_right_temp  NUMERIC(4,1) NOT NULL,
    front_right_clot  BOOLEAN      DEFAULT FALSE,
    back_left_ec      NUMERIC(4,2) NOT NULL,
    back_left_ph      NUMERIC(3,2) NOT NULL,
    back_left_temp    NUMERIC(4,1) NOT NULL,
    back_left_clot    BOOLEAN      DEFAULT FALSE,
    back_right_ec     NUMERIC(4,2) NOT NULL,
    back_right_ph     NUMERIC(3,2) NOT NULL,
    back_right_temp   NUMERIC(4,1) NOT NULL,
    back_right_clot   BOOLEAN      DEFAULT FALSE,
    recorded_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teat_telemetry_animal_date
    ON teat_telemetry (animal_id, recorded_at DESC);


-- -------------------------------------------------------------------------
-- 14. MASTITIS FORECASTS & SHAP ATTRIBUTION TABLE (Stage 4 Output)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mastitis_forecasts (
    forecast_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id          VARCHAR(50)  NOT NULL REFERENCES animals(animal_id) ON DELETE CASCADE,
    risk_score         INT          NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_band          VARCHAR(50)  NOT NULL,
    forecast_lead_days INT          NOT NULL,
    top_shap_factor    VARCHAR(255),
    shap_weight_pct    NUMERIC(5,2),
    shap_json          JSONB,
    generated_at       TIMESTAMPTZ  DEFAULT NOW()
);


-- -------------------------------------------------------------------------
-- 15. URGENT AI ALERTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    alert_id           VARCHAR(50)  PRIMARY KEY,
    animal_id          VARCHAR(50)  NOT NULL REFERENCES animals(animal_id) ON DELETE CASCADE,
    risk_band          VARCHAR(50)  NOT NULL,
    message            TEXT         NOT NULL,
    recommended_action TEXT         NOT NULL,
    status             VARCHAR(50)  DEFAULT 'unread'
                           CHECK (status IN ('unread', 'read', 'actioned')),
    alert_category     VARCHAR(50)  DEFAULT 'mastitis_risk'
                           CHECK (alert_category IN ('mastitis_risk', 'unregistered_rfid', 'sync_failure', 'system')),
    created_at         TIMESTAMPTZ  DEFAULT NOW()
);


-- -------------------------------------------------------------------------
-- 16. INDEXES
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_farms_district          ON farms (district);
CREATE INDEX IF NOT EXISTS idx_farms_registered_by     ON farms (registered_by);
CREATE INDEX IF NOT EXISTS idx_vets_registered_by      ON vets (registered_by);
CREATE INDEX IF NOT EXISTS idx_field_personnel_district ON field_personnel (assigned_district);
CREATE INDEX IF NOT EXISTS idx_animals_farm            ON animals (farm_id);
CREATE INDEX IF NOT EXISTS idx_milking_events_animal   ON milking_events (animal_id, milking_ts DESC);
CREATE INDEX IF NOT EXISTS idx_collar_readings_animal  ON collar_readings (animal_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_barn_readings_farm      ON barn_readings (farm_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_records_animal ON treatment_records (animal_id);
CREATE INDEX IF NOT EXISTS idx_mastitis_forecasts_animal ON mastitis_forecasts (animal_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_animal           ON alerts (animal_id);


-- -------------------------------------------------------------------------
-- 17. ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------
ALTER TABLE farms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_personnel   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins            ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE teat_telemetry    ENABLE ROW LEVEL SECURITY;
ALTER TABLE milking_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts            ENABLE ROW LEVEL SECURITY;

-- Demo / development open policies (tighten per role before production)
CREATE POLICY "Allow public select on farms"             ON farms             FOR SELECT USING (true);
CREATE POLICY "Allow public insert on farms"             ON farms             FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on animals"           ON animals           FOR SELECT USING (true);
CREATE POLICY "Allow public insert on animals"           ON animals           FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on manual_entries"    ON manual_entries    FOR SELECT USING (true);
CREATE POLICY "Allow public insert on manual_entries"    ON manual_entries    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on treatment_records" ON treatment_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert on treatment_records" ON treatment_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on milking_events"    ON milking_events    FOR SELECT USING (true);
CREATE POLICY "Allow public insert on milking_events"    ON milking_events    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on alerts"            ON alerts            FOR SELECT USING (true);
CREATE POLICY "Allow public insert on alerts"            ON alerts            FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on vets"              ON vets              FOR SELECT USING (true);
CREATE POLICY "Allow public insert on vets"              ON vets              FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on field_personnel"   ON field_personnel   FOR SELECT USING (true);
CREATE POLICY "Allow public insert on field_personnel"   ON field_personnel   FOR INSERT WITH CHECK (true);
