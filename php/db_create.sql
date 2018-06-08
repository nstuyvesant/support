-- Meant to be run from PSQL:
-- $ psql -d postgres -f db_create.sql

-- Create database

-- Forcefully disconnect anyone
SELECT pid, pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'vr' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS vr;

CREATE DATABASE vr
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE vr
    IS 'Value Realization';

\connect vr


CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add tables

CREATE TABLE public.clouds (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fqdn character varying(255) UNIQUE,
    email_recipients character varying(4000)
);

COMMENT ON COLUMN public.clouds.fqdn IS 'Fully-qualified domain name of the Perfecto cloud';
COMMENT ON COLUMN public.clouds.email_recipients IS 'Comma-separated list of email recipients for the report (typically Champion, VRC, BB, and DAs)';

CREATE TABLE public.snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cloud_id uuid NOT NULL REFERENCES clouds(id),
    snapshot_date date,
    success_last24h smallint,
    success_last7d smallint,
    success_last30d smallint,
    lab_issues bigint,
    orchestration_issues bigint,
    scripting_issues bigint,
    UNIQUE (cloud_id, snapshot_date)
);

COMMENT ON COLUMN public.snapshots.cloud_id IS 'Foreign key to cloud';
COMMENT ON COLUMN public.snapshots.success_last24h IS 'Success rate for last 24 hours expressed as an integer between 0 and 100 (not as decimal < 1)';
COMMENT ON COLUMN public.snapshots.success_last7d IS 'Success percentage over the last 7 days expressed as an integer from 0 to 100 (not as decimal < 1)';
COMMENT ON COLUMN public.snapshots.success_last30d IS 'Success percentage over the last 30 days expressed as an integer from 0 to 100 (not as decimal < 1)';
COMMENT ON COLUMN public.snapshots.lab_issues IS 'The number of script failures due to device or browser issues in the lab over the last 24 hours';
COMMENT ON COLUMN public.snapshots.orchestration_issues IS 'The number of script failures due to attempts to use the same device';
COMMENT ON COLUMN public.snapshots.scripting_issues IS 'The number of script failures due to a problem with the script or framework over the past 24 hours';

CREATE TABLE public.devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id uuid NOT NULL REFERENCES snapshots(id),
    rank smallint DEFAULT 1 NOT NULL,
    model character varying(255) NOT NULL,
    os character varying(255) NOT NULL,
    device_id character varying(255) NOT NULL,
    errors_last7d bigint NOT NULL
);

COMMENT ON COLUMN public.devices.snapshot_id IS 'Foreign key to snapshot record';
COMMENT ON COLUMN public.devices.rank IS 'Report ranking of the importance of the problematic device';
COMMENT ON COLUMN public.devices.model IS 'Model of the device such as "iPhone X" (manufacturer not needed)';
COMMENT ON COLUMN public.devices.os IS 'Name of operating system and version number such as "iOS 11.3"';
COMMENT ON COLUMN public.devices.device_id IS 'The device ID such as the UUID of an Apple iOS device or the serial number of an Android device';
COMMENT ON COLUMN public.devices.errors_last7d IS 'The number of times the device has gone into error over the last 7 days';

CREATE TABLE public.recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id uuid NOT NULL REFERENCES snapshots(id),
    rank smallint DEFAULT 1 NOT NULL,
    recommendation character varying(2000) NOT NULL,
    impact_percentage smallint DEFAULT 0 NOT NULL,
    impact_message character varying(2000)
);

COMMENT ON COLUMN public.recommendations.snapshot_id IS 'Foreign key to snapshot record';
COMMENT ON COLUMN public.recommendations.rank IS 'Report ranking of the importance of the recommendation';
COMMENT ON COLUMN public.recommendations.recommendation IS 'Specific recommendation such as "Replace top 5 failing devices" or "Remediate TransferMoney test"';
COMMENT ON COLUMN public.recommendations.impact_percentage IS 'Percentage of improvement to success rate if the recommendation is implemented (use 0 to 100 rather than decimal < 1)';
COMMENT ON COLUMN public.recommendations.impact_message IS 'For recommendations that do not have a clear impact such as "Ensure tests use Digitalzoom API" (impact should equal 0 for those)';


CREATE TABLE public.tests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id uuid NOT NULL REFERENCES snapshots(id),
    rank smallint DEFAULT 1 NOT NULL,
    test character varying(4000) NOT NULL,
    age bigint NOT NULL,
    failures_last7d bigint NOT NULL,
    passes_last7d bigint NOT NULL
);

COMMENT ON COLUMN public.tests.snapshot_id IS 'Foreign key to snapshot record';
COMMENT ON COLUMN public.tests.rank IS 'Report ranking of the importance of the problematic test';
COMMENT ON COLUMN public.tests.test IS 'Name of the test having issues';
COMMENT ON COLUMN public.tests.age IS 'How many days Digitalzoom has known about this test (used to select out tests that are newly created)';
COMMENT ON COLUMN public.tests.failures_last7d IS 'Number of failures of the test for the last 7 days';
COMMENT ON COLUMN public.tests.passes_last7d IS 'The number of times the test has passed over the last 7 days';

-- Add indices

CREATE INDEX fki_clouds_fkey ON public.snapshots USING btree (cloud_id);
CREATE INDEX fki_devices_snapshots_fkey ON public.devices USING btree (snapshot_id);
CREATE INDEX fki_recommendations_snapshots_fkey ON public.recommendations USING btree (snapshot_id);
CREATE INDEX fki_tests_snapshots_fkey ON public.tests USING btree (snapshot_id);

-- Add stored procedures

-- clouds_upsert(fqdn, email_recipients)
-- INSERT INTO clouds(fqdn, email_recipients) VALUES ($1, $2)
-- ON CONFLICT (fqdn) DO UPDATE SET fqdn = $1, email_recipients = $2);

-- snapshots_upsert(fqdn, snapshot_date)
-- INSERT INTO snapshots(cloud_id, date) VALUES ($1, $2)
-- ON CONFLICT (fqdn) DO UPDATE SET fqdn = $1, email_recipients = $2);