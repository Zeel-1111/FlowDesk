-- Fix: Remove stale migration entry and apply the column addition
-- Run this once, then delete this file

START TRANSACTION;

-- 1. Remove the stale migration history entry (migration ran with empty Up())
DELETE FROM "__EFMigrationsHistory" 
WHERE "MigrationId" = '20260623022903_AddEmailVerification';

-- 2. Add the missing column with default false for existing records
ALTER TABLE "Users" ADD "IsEmailVerified" boolean NOT NULL DEFAULT FALSE;

-- 3. Re-insert the migration history entry so EF knows it's applied
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260623022903_AddEmailVerification', '8.0.28');

COMMIT;
