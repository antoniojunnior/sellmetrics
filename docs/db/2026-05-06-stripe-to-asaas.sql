-- Migration: rename Stripe columns to ASAAS
-- Date: 2026-05-06

ALTER TABLE accounts
  RENAME COLUMN stripe_customer_id TO asaas_customer_id;

ALTER TABLE accounts
  RENAME COLUMN stripe_subscription_id TO asaas_subscription_id;
