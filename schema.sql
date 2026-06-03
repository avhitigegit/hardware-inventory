-- ============================================================
-- Hardware Inventory — Complete Database Schema
-- Run this ONCE on a fresh Supabase project (before seed.sql)
-- ============================================================
-- ORDER TO RUN:
--   1. This file  (schema.sql)  — tables, triggers, RLS, storage
--   2. seed.sql                 — sample data (UAT only, never PROD)
-- ============================================================


-- ============================================================
-- PART 1 — TABLES
-- ============================================================

-- Users (extends Supabase auth.users — one row per login account)
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('ADMIN','OWNER','CASHIER','STORE_KEEPER')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  birthday    DATE,
  address     TEXT,
  id_number   TEXT,
  mobile      TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE suppliers (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  contact_person  TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  credit_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customers (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  credit_limit    NUMERIC(12,2) NOT NULL DEFAULT 0,
  credit_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  sku              TEXT NOT NULL UNIQUE,
  barcode          TEXT UNIQUE,
  description      TEXT,
  category_id      BIGINT REFERENCES categories(id),
  supplier_id      BIGINT REFERENCES suppliers(id),
  unit             TEXT NOT NULL DEFAULT 'PCS',
  buying_price     NUMERIC(12,2) NOT NULL,
  selling_price    NUMERIC(12,2) NOT NULL,
  stock_quantity   NUMERIC(10,3) NOT NULL DEFAULT 0,
  reorder_level    NUMERIC(10,3) NOT NULL DEFAULT 5,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GRN — stock receiving from supplier
CREATE TABLE purchases (
  id              BIGSERIAL PRIMARY KEY,
  supplier_id     BIGINT REFERENCES suppliers(id),
  invoice_number  TEXT,
  total_amount    NUMERIC(12,2) NOT NULL,
  payment_type    TEXT NOT NULL CHECK (payment_type IN ('CASH','CREDIT')),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_items (
  id           BIGSERIAL PRIMARY KEY,
  purchase_id  BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id   BIGINT NOT NULL REFERENCES products(id),
  quantity     NUMERIC(10,3) NOT NULL,
  unit_price   NUMERIC(12,2) NOT NULL,
  total_price  NUMERIC(12,2) NOT NULL
);

-- POS sales (payment_type includes SPLIT for partial cash + partial credit)
CREATE TABLE sales (
  id              BIGSERIAL PRIMARY KEY,
  customer_id     BIGINT REFERENCES customers(id),
  total_amount    NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_type    TEXT NOT NULL CHECK (payment_type IN ('CASH','CREDIT','SPLIT')),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sale_items (
  id          BIGSERIAL PRIMARY KEY,
  sale_id     BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id),
  quantity    NUMERIC(10,3) NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL
);

CREATE TABLE stock_adjustments (
  id              BIGSERIAL PRIMARY KEY,
  product_id      BIGINT NOT NULL REFERENCES products(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('ADD','SUBTRACT')),
  quantity        NUMERIC(10,3) NOT NULL,
  reason          TEXT NOT NULL,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit payment records
CREATE TABLE customer_payments (
  id          BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  amount      NUMERIC(12,2) NOT NULL,
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE supplier_payments (
  id          BIGSERIAL PRIMARY KEY,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
  amount      NUMERIC(12,2) NOT NULL,
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable audit trail — one row per business event, never updated or deleted
CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name   TEXT,
  action      TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE')),
  entity      TEXT NOT NULL,
  entity_id   TEXT,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Returns — customer returns items, stock is restored
CREATE TABLE returns (
  id                  BIGSERIAL PRIMARY KEY,
  sale_id             BIGINT REFERENCES sales(id),
  customer_id         BIGINT REFERENCES customers(id),
  total_return_amount NUMERIC(12,2) NOT NULL,
  return_method       TEXT NOT NULL CHECK (return_method IN ('CASH_REFUND','CREDIT_ADJUSTMENT')),
  notes               TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE return_items (
  id          BIGSERIAL PRIMARY KEY,
  return_id   BIGINT NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id),
  quantity    NUMERIC(10,3) NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL
);


-- ============================================================
-- PART 2 — TRIGGER FUNCTIONS
-- ============================================================

-- Fires when a purchase_item is inserted → adds stock, tracks supplier credit
CREATE OR REPLACE FUNCTION increment_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE id = NEW.product_id;

  IF (SELECT payment_type FROM purchases WHERE id = NEW.purchase_id) = 'CREDIT' THEN
    UPDATE suppliers
      SET credit_balance = credit_balance + (
        SELECT total_amount FROM purchases WHERE id = NEW.purchase_id
      )
      WHERE id = (SELECT supplier_id FROM purchases WHERE id = NEW.purchase_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fires when a sale_item is inserted → removes stock
CREATE OR REPLACE FUNCTION decrement_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fires when a sale is inserted → updates customer credit for CREDIT and SPLIT sales
CREATE OR REPLACE FUNCTION update_customer_credit_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_type IN ('CREDIT','SPLIT')
     AND NEW.customer_id IS NOT NULL
     AND NEW.balance_amount > 0 THEN
    UPDATE customers
      SET credit_balance = credit_balance + NEW.balance_amount
      WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- PART 3 — ATTACH TRIGGERS TO TABLES
-- ============================================================

CREATE TRIGGER trigger_increment_stock
  AFTER INSERT ON purchase_items
  FOR EACH ROW EXECUTE FUNCTION increment_stock_on_purchase();

CREATE TRIGGER trigger_decrement_stock
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_sale();

CREATE TRIGGER trigger_customer_credit
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION update_customer_credit_on_sale();


-- ============================================================
-- PART 4 — GRANTS
-- Required because "Automatically expose new tables" is OFF.
-- GRANT unlocks the door; RLS policies control which rows.
-- ============================================================

GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ============================================================
-- PART 5 — ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases          ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items       ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role (SECURITY DEFINER bypasses RLS for the inner query)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;


-- ============================================================
-- PART 6 — RLS POLICIES
-- auth.role() = 'authenticated' is used for SELECT policies
-- because it is more reliable than auth.uid() with the new
-- Supabase key format (sb_publishable_ / sb_secret_).
-- ============================================================

-- ── AUDIT LOGS ───────────────────────────────────────────────
-- Authenticated users can write; only ADMIN/OWNER can read; nobody can update/delete
CREATE POLICY "audit_logs_insert_auth" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "audit_logs_select_admin_owner" ON audit_logs
  FOR SELECT USING (get_user_role() IN ('ADMIN','OWNER'));


-- ── USERS ────────────────────────────────────────────────────
CREATE POLICY "users_select_auth" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins manage all users; any user can update their own row (profile/avatar)
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (get_user_role() = 'ADMIN');

CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (id = auth.uid());


-- ── CATEGORIES ───────────────────────────────────────────────
CREATE POLICY "categories_select_auth" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "categories_insert_admin_owner" ON categories
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "categories_update_admin_owner" ON categories
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "categories_delete_admin_owner" ON categories
  FOR DELETE USING (get_user_role() IN ('ADMIN','OWNER'));


-- ── SUPPLIERS ────────────────────────────────────────────────
CREATE POLICY "suppliers_select_auth" ON suppliers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "suppliers_insert_admin_owner" ON suppliers
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "suppliers_update_admin_owner" ON suppliers
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "suppliers_delete_admin" ON suppliers
  FOR DELETE USING (get_user_role() = 'ADMIN');


-- ── CUSTOMERS ────────────────────────────────────────────────
CREATE POLICY "customers_select_auth" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "customers_insert_admin_owner_cashier" ON customers
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));

CREATE POLICY "customers_update_admin_owner_cashier" ON customers
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER','CASHIER'));

CREATE POLICY "customers_delete_admin_owner" ON customers
  FOR DELETE USING (get_user_role() IN ('ADMIN','OWNER'));


-- ── PRODUCTS ─────────────────────────────────────────────────
CREATE POLICY "products_select_auth" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "products_insert_admin_owner_sk" ON products
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));

CREATE POLICY "products_update_admin_owner_sk" ON products
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));

CREATE POLICY "products_delete_admin_owner" ON products
  FOR DELETE USING (get_user_role() IN ('ADMIN','OWNER'));


-- ── PURCHASES (GRN) ──────────────────────────────────────────
CREATE POLICY "purchases_select_auth" ON purchases
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "purchases_insert_admin_owner_sk" ON purchases
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));


-- ── PURCHASE ITEMS ───────────────────────────────────────────
CREATE POLICY "purchase_items_select_auth" ON purchase_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "purchase_items_insert_admin_owner_sk" ON purchase_items
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));


-- ── SALES (POS) ──────────────────────────────────────────────
CREATE POLICY "sales_select_auth" ON sales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "sales_insert_admin_owner_cashier" ON sales
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));


-- ── SALE ITEMS ───────────────────────────────────────────────
CREATE POLICY "sale_items_select_auth" ON sale_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "sale_items_insert_admin_owner_cashier" ON sale_items
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));


-- ── STOCK ADJUSTMENTS ────────────────────────────────────────
CREATE POLICY "stock_adj_select_auth" ON stock_adjustments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "stock_adj_insert_admin_owner_sk" ON stock_adjustments
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));


-- ── CUSTOMER PAYMENTS ────────────────────────────────────────
CREATE POLICY "cust_payments_select_auth" ON customer_payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "cust_payments_insert_admin_owner_cashier" ON customer_payments
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));


-- ── SUPPLIER PAYMENTS ────────────────────────────────────────
CREATE POLICY "sup_payments_select_auth" ON supplier_payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "sup_payments_insert_admin_owner" ON supplier_payments
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER'));


-- ── RETURNS ──────────────────────────────────────────────────
CREATE POLICY "returns_select_auth" ON returns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "returns_insert_roles" ON returns
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));


-- ── RETURN ITEMS ─────────────────────────────────────────────
CREATE POLICY "return_items_select_auth" ON return_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "return_items_insert_roles" ON return_items
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));


-- ============================================================
-- PART 7 — STORAGE BUCKETS & POLICIES
-- ============================================================

-- avatars bucket — stores user profile photos (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_update_auth" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_delete_auth" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');


-- ============================================================
-- MIGRATION — run this on an existing UAT/PROD database
-- (schema.sql already includes everything above for fresh installs)
-- ============================================================
--
-- ALTER TABLE to add audit_logs (if upgrading existing DB):
--
-- CREATE TABLE IF NOT EXISTS audit_logs (
--   id          BIGSERIAL PRIMARY KEY,
--   user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
--   user_name   TEXT,
--   action      TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE')),
--   entity      TEXT NOT NULL,
--   entity_id   TEXT,
--   description TEXT NOT NULL,
--   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- GRANT SELECT, INSERT ON audit_logs TO authenticated;
-- GRANT ALL ON audit_logs TO service_role;
-- GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO authenticated;
-- CREATE POLICY "audit_logs_insert_auth" ON audit_logs
--   FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "audit_logs_select_admin_owner" ON audit_logs
--   FOR SELECT USING (get_user_role() IN ('ADMIN','OWNER'));
--
-- ============================================================
-- DONE — schema.sql complete
-- Next: create admin user in Supabase Auth dashboard, then
-- insert into users table, then run seed.sql (UAT only).
-- ============================================================
