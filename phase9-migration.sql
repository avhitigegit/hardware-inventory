-- ============================================================
-- Phase 9 Enhancements — Database Migration
-- Run this ONCE in Supabase SQL Editor before deploying code
-- ============================================================

-- 1. DECIMAL QUANTITIES
-- Allows selling/receiving/adjusting fractional units (0.5 kg, 2.5 m, etc.)
ALTER TABLE products ALTER COLUMN stock_quantity TYPE NUMERIC(10,3);
ALTER TABLE purchase_items ALTER COLUMN quantity TYPE NUMERIC(10,3);
ALTER TABLE sale_items ALTER COLUMN quantity TYPE NUMERIC(10,3);
ALTER TABLE stock_adjustments ALTER COLUMN quantity TYPE NUMERIC(10,3);

-- 2. DISCOUNT ON SALE
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 3. SPLIT PAYMENT
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_type_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_type_check
  CHECK (payment_type IN ('CASH', 'CREDIT', 'SPLIT'));

-- Update credit trigger to also handle SPLIT sales
CREATE OR REPLACE FUNCTION update_customer_credit_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_type IN ('CREDIT', 'SPLIT')
     AND NEW.customer_id IS NOT NULL
     AND NEW.balance_amount > 0 THEN
    UPDATE customers
      SET credit_balance = credit_balance + NEW.balance_amount
      WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. RETURNS TABLES
CREATE TABLE IF NOT EXISTS returns (
  id                  BIGSERIAL PRIMARY KEY,
  sale_id             BIGINT REFERENCES sales(id),
  customer_id         BIGINT REFERENCES customers(id),
  total_return_amount NUMERIC(12,2) NOT NULL,
  return_method       TEXT NOT NULL CHECK (return_method IN ('CASH_REFUND','CREDIT_ADJUSTMENT')),
  notes               TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_items (
  id          BIGSERIAL PRIMARY KEY,
  return_id   BIGINT NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id),
  quantity    NUMERIC(10,3) NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL
);

-- Grants
GRANT ALL ON returns TO service_role;
GRANT ALL ON return_items TO service_role;
GRANT SELECT, INSERT ON returns TO authenticated;
GRANT SELECT, INSERT ON return_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE returns_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE return_items_id_seq TO authenticated;

-- RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "returns_select_auth" ON returns
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "returns_insert_roles" ON returns
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));
CREATE POLICY "return_items_select_auth" ON return_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "return_items_insert_roles" ON return_items
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));

-- ============================================================
-- DONE — run phase9-migration.sql once, then deploy code
-- ============================================================
