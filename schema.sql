-- ============================================================
-- Lahiru Hardware — Database Schema
-- Run this FIRST on a fresh Supabase project (before seed.sql)
-- ============================================================
-- ORDER TO RUN:
--   1. This file  (schema.sql)   — tables, triggers, RLS
--   2. seed.sql                  — sample data (UAT only)
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
  stock_quantity   INTEGER NOT NULL DEFAULT 0,
  reorder_level    INTEGER NOT NULL DEFAULT 5,
  image_url        TEXT,
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
  quantity     INTEGER NOT NULL,
  unit_price   NUMERIC(12,2) NOT NULL,
  total_price  NUMERIC(12,2) NOT NULL
);

-- POS sales
CREATE TABLE sales (
  id             BIGSERIAL PRIMARY KEY,
  customer_id    BIGINT REFERENCES customers(id),
  total_amount   NUMERIC(12,2) NOT NULL,
  paid_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_type   TEXT NOT NULL CHECK (payment_type IN ('CASH','CREDIT')),
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sale_items (
  id          BIGSERIAL PRIMARY KEY,
  sale_id     BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL
);

CREATE TABLE stock_adjustments (
  id              BIGSERIAL PRIMARY KEY,
  product_id      BIGINT NOT NULL REFERENCES products(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('ADD','SUBTRACT')),
  quantity        INTEGER NOT NULL,
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


-- ============================================================
-- PART 2 — TRIGGER FUNCTIONS
-- These run automatically when data is inserted
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

-- Fires when a sale is inserted → adds to customer credit balance if CREDIT sale
CREATE OR REPLACE FUNCTION update_customer_credit_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_type = 'CREDIT' AND NEW.customer_id IS NOT NULL THEN
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
-- PART 4 — ROW LEVEL SECURITY (RLS)
-- Enable RLS on every table, then add policies.
-- Without policies, an RLS-enabled table blocks ALL access.
-- ============================================================

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases          ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments  ENABLE ROW LEVEL SECURITY;

-- Helper function — reads the role of the currently logged-in user
-- SECURITY DEFINER means it runs with elevated rights (bypasses RLS itself)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;


-- ============================================================
-- PART 5 — RLS POLICIES
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
-- Any logged-in user can read their own row (needed for session checks)
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth.uid() OR get_user_role() = 'ADMIN');

CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (get_user_role() = 'ADMIN');


-- ── CATEGORIES ───────────────────────────────────────────────
CREATE POLICY "categories_select_auth" ON categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "categories_insert_admin_owner" ON categories
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "categories_update_admin_owner" ON categories
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "categories_delete_admin_owner" ON categories
  FOR DELETE USING (get_user_role() IN ('ADMIN','OWNER'));


-- ── SUPPLIERS ────────────────────────────────────────────────
CREATE POLICY "suppliers_select_auth" ON suppliers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "suppliers_insert_admin_owner" ON suppliers
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "suppliers_update_admin_owner" ON suppliers
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "suppliers_delete_admin" ON suppliers
  FOR DELETE USING (get_user_role() = 'ADMIN');


-- ── CUSTOMERS ────────────────────────────────────────────────
CREATE POLICY "customers_select_auth" ON customers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "customers_insert_admin_owner_cashier" ON customers
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));

CREATE POLICY "customers_update_admin_owner_cashier" ON customers
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER','CASHIER'));

CREATE POLICY "customers_delete_admin_owner" ON customers
  FOR DELETE USING (get_user_role() IN ('ADMIN','OWNER'));


-- ── PRODUCTS ─────────────────────────────────────────────────
CREATE POLICY "products_select_auth" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "products_insert_admin_owner_sk" ON products
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));

CREATE POLICY "products_update_admin_owner_sk" ON products
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));

CREATE POLICY "products_delete_admin_owner" ON products
  FOR DELETE USING (get_user_role() IN ('ADMIN','OWNER'));


-- ── PURCHASES (GRN) ──────────────────────────────────────────
CREATE POLICY "purchases_select_auth" ON purchases
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "purchases_insert_admin_owner_sk" ON purchases
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));


-- ── PURCHASE ITEMS ───────────────────────────────────────────
CREATE POLICY "purchase_items_select_auth" ON purchase_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "purchase_items_insert_admin_owner_sk" ON purchase_items
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));


-- ── SALES (POS) ──────────────────────────────────────────────
CREATE POLICY "sales_select_auth" ON sales
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sales_insert_admin_owner_cashier" ON sales
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));


-- ── SALE ITEMS ───────────────────────────────────────────────
CREATE POLICY "sale_items_select_auth" ON sale_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sale_items_insert_admin_owner_cashier" ON sale_items
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));


-- ── STOCK ADJUSTMENTS ────────────────────────────────────────
CREATE POLICY "stock_adj_select_auth" ON stock_adjustments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "stock_adj_insert_admin_owner_sk" ON stock_adjustments
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));


-- ── CUSTOMER PAYMENTS ────────────────────────────────────────
CREATE POLICY "cust_payments_select_auth" ON customer_payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "cust_payments_insert_admin_owner_cashier" ON customer_payments
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));


-- ── SUPPLIER PAYMENTS ────────────────────────────────────────
CREATE POLICY "sup_payments_select_auth" ON supplier_payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sup_payments_insert_admin_owner" ON supplier_payments
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER'));


-- ============================================================
-- DONE — schema.sql complete
-- Next step: create your admin user in Supabase Auth dashboard,
-- then run seed.sql to load sample data.
-- ============================================================
