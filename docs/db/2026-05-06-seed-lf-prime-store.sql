-- Seed: LF Prime Store account
-- User UID  : 0033b623-e66e-4d00-8c4e-2d0a1a99d834
-- Email     : contato@lfprimestore.com
-- Date      : 2026-05-06
--
-- Run this AFTER both migrations:
--   2026-05-06-accounts-minimal.sql
--   2026-05-06-f1-accounts-multitenant.sql

DO $$
DECLARE
  v_uid  TEXT := '0033b623-e66e-4d00-8c4e-2d0a1a99d834';
BEGIN

  -- 1. Upsert account
  --    id = uid for Phase 0 compatibility (settings pages use user.id as account_id)
  --    onboarding_completed = true  → skips wizard (user already has real data)
  INSERT INTO accounts (
    id,
    name,
    marketplace_id,
    ads_profile_id,
    active,
    owner_id,
    currency,
    timezone,
    plan_id,
    onboarding_completed,
    onboarding_step
  ) VALUES (
    v_uid,
    'LF Prime Store',
    'A2Q3Y263D00KWC',   -- Amazon.com.br
    '',                  -- fill after connecting Ads API
    true,
    v_uid::uuid,
    'BRL',
    'America/Sao_Paulo',
    'free',
    true,
    4
  )
  ON CONFLICT (id) DO UPDATE SET
    name                = EXCLUDED.name,
    owner_id            = EXCLUDED.owner_id,
    onboarding_completed = true,
    onboarding_step     = 4,
    updated_at          = now();

  -- 2. Upsert owner membership
  INSERT INTO account_members (
    account_id,
    user_id,
    role,
    accepted_at
  ) VALUES (
    v_uid,
    v_uid::uuid,
    'owner',
    now()
  )
  ON CONFLICT (account_id, user_id) DO NOTHING;

  RAISE NOTICE 'Account e membership criados/atualizados para UID %', v_uid;
END;
$$;
