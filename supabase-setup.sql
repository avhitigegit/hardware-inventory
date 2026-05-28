-- ============================================================
-- HARDWARE INVENTORY — COMPLETE SUPABASE SQL SETUP SCRIPT
-- Paste this entire file into Supabase SQL Editor and click Run
-- ============================================================


-- ============================================================
-- 1. TABLES (in dependency order)
-- ============================================================

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
-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases           ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;


-- ============================================================
-- 4. TRIGGER FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-increment stock when a purchase_item is inserted
CREATE OR REPLACE FUNCTION increment_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_stock_on_purchase
AFTER INSERT ON purchase_items
FOR EACH ROW EXECUTE FUNCTION increment_stock_on_purchase();

-- Auto-update supplier credit balance when a CREDIT purchase is created
-- (fires once per purchase on the purchases table, not per item)
CREATE OR REPLACE FUNCTION update_supplier_credit_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_type = 'CREDIT' AND NEW.supplier_id IS NOT NULL THEN
    UPDATE suppliers
    SET credit_balance = credit_balance + NEW.total_amount
    WHERE id = NEW.supplier_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_supplier_credit_on_purchase
AFTER INSERT ON purchases
FOR EACH ROW EXECUTE FUNCTION update_supplier_credit_on_purchase();

-- Auto-decrement stock when a sale_item is inserted
CREATE OR REPLACE FUNCTION decrement_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_stock_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_sale();

-- Auto-update customer credit balance when a CREDIT sale is created
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

CREATE TRIGGER trg_customer_credit_on_sale
AFTER INSERT ON sales
FOR EACH ROW EXECUTE FUNCTION update_customer_credit_on_sale();


-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

-- USERS (ADMIN only)
CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (get_user_role() = 'ADMIN');

CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (get_user_role() = 'ADMIN');

-- CATEGORIES (read: all authenticated | write: ADMIN, OWNER)
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "categories_update" ON categories
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "categories_delete" ON categories
  FOR DELETE USING (get_user_role() IN ('ADMIN','OWNER'));

-- SUPPLIERS (read: all authenticated | delete: ADMIN only)
CREATE POLICY "suppliers_select" ON suppliers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER'));

CREATE POLICY "suppliers_delete" ON suppliers
  FOR DELETE USING (get_user_role() = 'ADMIN');

-- CUSTOMERS (read: all authenticated | delete: ADMIN, OWNER)
CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));

CREATE POLICY "customers_update" ON customers
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER','CASHIER'));

CREATE POLICY "customers_delete" ON customers
  FOR DELETE USING (get_user_role() IN ('ADMIN','OWNER'));

-- PRODUCTS (read: all authenticated | delete: ADMIN, OWNER)
CREATE POLICY "products_select" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "products_insert" ON products
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));

CREATE POLICY "products_update" ON products
  FOR UPDATE USING (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));

CREATE POLICY "products_delete" ON products
  FOR DELETE USING (get_user_role() IN ('ADMIN','OWNER'));

-- PURCHASES (read: all authenticated | create: ADMIN, OWNER, STORE_KEEPER | no edit/delete)
CREATE POLICY "purchases_select" ON purchases
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "purchases_insert" ON purchases
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));

-- PURCHASE_ITEMS (follows purchases)
CREATE POLICY "purchase_items_select" ON purchase_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "purchase_items_insert" ON purchase_items
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));

-- SALES (read: all authenticated | create: ADMIN, OWNER, CASHIER | no edit/delete)
CREATE POLICY "sales_select" ON sales
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sales_insert" ON sales
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));

-- SALE_ITEMS (follows sales)
CREATE POLICY "sale_items_select" ON sale_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sale_items_insert" ON sale_items
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));

-- STOCK_ADJUSTMENTS (read: all authenticated | create: ADMIN, OWNER, STORE_KEEPER)
CREATE POLICY "stock_adjustments_select" ON stock_adjustments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "stock_adjustments_insert" ON stock_adjustments
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','STORE_KEEPER'));

-- CUSTOMER_PAYMENTS (read: all authenticated | create: ADMIN, OWNER, CASHIER)
CREATE POLICY "customer_payments_select" ON customer_payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "customer_payments_insert" ON customer_payments
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER','CASHIER'));

-- SUPPLIER_PAYMENTS (read: all authenticated | create: ADMIN, OWNER)
CREATE POLICY "supplier_payments_select" ON supplier_payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "supplier_payments_insert" ON supplier_payments
  FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN','OWNER'));
