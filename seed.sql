-- ============================================================
-- Lahiru Hardware — Sample Data Seed Script
-- ============================================================
-- HOW TO RUN:
--   1. Open your Supabase project dashboard
--   2. Go to SQL Editor (left sidebar)
--   3. Paste this entire script and click Run
--
-- REQUIREMENTS:
--   - At least one ADMIN user must exist in the users table
--   - Run this ONCE on a fresh database (no existing categories/products)
--   - The stock update DB triggers must be set up as per CLAUDE.md
--
-- WHAT THIS CREATES:
--   5 categories, 3 suppliers, 10 products, 4 customers,
--   4 GRN purchases, 7 sales, 2 stock adjustments,
--   1 customer payment, 1 supplier payment
--
-- EXPECTED FINAL STOCK (with 3 low-stock items for testing):
--   Makita Drill      : 7 units  (reorder 8)  ← LOW STOCK
--   PVC Pipe          : 45 units (reorder 50) ← LOW STOCK
--   Sandpaper 80 Grit : 85 units (reorder 90) ← LOW STOCK
-- ============================================================

DO $$
DECLARE
  admin_id       UUID;

  cat_power      BIGINT;
  cat_hand       BIGINT;
  cat_plumbing   BIGINT;
  cat_electrical BIGINT;
  cat_fasteners  BIGINT;

  sup_lanka      BIGINT;
  sup_ceylon     BIGINT;
  sup_colombo    BIGINT;

  prod_drill     BIGINT;
  prod_hammer    BIGINT;
  prod_pvc       BIGINT;
  prod_wire      BIGINT;
  prod_sandpaper BIGINT;
  prod_brush     BIGINT;
  prod_screw     BIGINT;
  prod_padlock   BIGINT;
  prod_tape      BIGINT;
  prod_socket    BIGINT;

  cust_chaminda  BIGINT;
  cust_small     BIGINT;
  cust_perera    BIGINT;
  cust_anura     BIGINT;

  pur1 BIGINT; pur2 BIGINT; pur3 BIGINT; pur4 BIGINT;
  sale1 BIGINT; sale2 BIGINT; sale3 BIGINT;
  sale4 BIGINT; sale5 BIGINT; sale6 BIGINT; sale7 BIGINT;

BEGIN

  -- Get the first active ADMIN user for created_by fields
  SELECT id INTO admin_id FROM users WHERE role = 'ADMIN' AND is_active = true LIMIT 1;

  -- ============================================================
  -- CATEGORIES
  -- ============================================================
  INSERT INTO categories (name, description)
    VALUES ('Power Tools', 'Electric and battery-powered tools')
    RETURNING id INTO cat_power;

  INSERT INTO categories (name, description)
    VALUES ('Hand Tools', 'Manual hand tools and basic equipment')
    RETURNING id INTO cat_hand;

  INSERT INTO categories (name, description)
    VALUES ('Plumbing', 'Pipes, fittings, and plumbing supplies')
    RETURNING id INTO cat_plumbing;

  INSERT INTO categories (name, description)
    VALUES ('Electrical', 'Wiring, sockets, switches, and electrical parts')
    RETURNING id INTO cat_electrical;

  INSERT INTO categories (name, description)
    VALUES ('Hardware & Fasteners', 'Screws, nails, bolts, padlocks, and fixings')
    RETURNING id INTO cat_fasteners;


  -- ============================================================
  -- SUPPLIERS
  -- ============================================================
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance)
    VALUES ('Lanka Tools Import', 'Suresh Fernando', '0112345678',
            'suresh@lankatools.lk', 'Main Street, Pettah, Colombo 11', 0)
    RETURNING id INTO sup_lanka;

  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance)
    VALUES ('Ceylon Hardware Ltd', 'Niroshan Silva', '0114567890',
            'niroshan@ceylonhw.lk', 'Maradana Road, Colombo 10', 0)
    RETURNING id INTO sup_ceylon;

  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance)
    VALUES ('Colombo Building Supplies', 'Ranjith Jayawardena', '0117654321',
            'ranjith@cbs.lk', 'Borella Junction, Colombo 08', 0)
    RETURNING id INTO sup_colombo;


  -- ============================================================
  -- PRODUCTS  (stock_quantity starts at 0 — purchases will build it)
  -- ============================================================
  INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit,
                        buying_price, selling_price, stock_quantity, reorder_level, is_active)
    VALUES ('Makita Drill 750W', 'MKT-DRILL-750', '4012345670001',
            cat_power, sup_lanka, 'PCS', 12500, 15000, 0, 8, true)
    RETURNING id INTO prod_drill;

  INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit,
                        buying_price, selling_price, stock_quantity, reorder_level, is_active)
    VALUES ('Stanley Hammer 500g', 'STN-HMR-500G', '4012345670002',
            cat_hand, sup_lanka, 'PCS', 850, 1200, 0, 5, true)
    RETURNING id INTO prod_hammer;

  INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit,
                        buying_price, selling_price, stock_quantity, reorder_level, is_active)
    VALUES ('PVC Pipe 1/2"', 'PVC-PIPE-HLF', '4012345670003',
            cat_plumbing, sup_colombo, 'PCS', 120, 180, 0, 50, true)
    RETURNING id INTO prod_pvc;

  INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit,
                        buying_price, selling_price, stock_quantity, reorder_level, is_active)
    VALUES ('Wire 2.5mm (per metre)', 'WR-2.5MM-M', '4012345670004',
            cat_electrical, sup_ceylon, 'MTR', 45, 75, 0, 30, true)
    RETURNING id INTO prod_wire;

  INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit,
                        buying_price, selling_price, stock_quantity, reorder_level, is_active)
    VALUES ('Sandpaper 80 Grit', 'SND-80G-SHT', '4012345670005',
            cat_hand, sup_ceylon, 'PCS', 15, 25, 0, 90, true)
    RETURNING id INTO prod_sandpaper;

  INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit,
                        buying_price, selling_price, stock_quantity, reorder_level, is_active)
    VALUES ('Paint Brush 3"', 'PNT-BRSH-3IN', '4012345670006',
            cat_hand, sup_ceylon, 'PCS', 85, 120, 0, 10, true)
    RETURNING id INTO prod_brush;

  INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit,
                        buying_price, selling_price, stock_quantity, reorder_level, is_active)
    VALUES ('Cement Screw 3"', 'SCR-CEM-3IN', '4012345670007',
            cat_fasteners, sup_colombo, 'PCS', 5, 8, 0, 100, true)
    RETURNING id INTO prod_screw;

  INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit,
                        buying_price, selling_price, stock_quantity, reorder_level, is_active)
    VALUES ('Padlock 40mm Steel', 'PDL-40MM-STL', '4012345670008',
            cat_fasteners, sup_lanka, 'PCS', 180, 250, 0, 10, true)
    RETURNING id INTO prod_padlock;

  INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit,
                        buying_price, selling_price, stock_quantity, reorder_level, is_active)
    VALUES ('Duct Tape 48mm', 'DCT-TAPE-48', '4012345670009',
            cat_fasteners, sup_colombo, 'PCS', 80, 130, 0, 10, true)
    RETURNING id INTO prod_tape;

  INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit,
                        buying_price, selling_price, stock_quantity, reorder_level, is_active)
    VALUES ('Electric Socket 3-Pin', 'ELEC-SCK-3P', '4012345670010',
            cat_electrical, sup_colombo, 'PCS', 280, 450, 0, 10, true)
    RETURNING id INTO prod_socket;


  -- ============================================================
  -- CUSTOMERS
  -- ============================================================
  INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance)
    VALUES ('Chaminda Construction', '0771234567', 'chaminda@construct.lk',
            'Nugegoda, Colombo', 50000, 0)
    RETURNING id INTO cust_chaminda;

  INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance)
    VALUES ('Small Shop Owner', '0779876543', '',
            'Kaduwela', 5000, 0)
    RETURNING id INTO cust_small;

  INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance)
    VALUES ('Perera Hardware', '0712233445', 'info@pererahw.lk',
            'Kandy Road, Kegalle', 100000, 0)
    RETURNING id INTO cust_perera;

  INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance)
    VALUES ('Anura Builders', '0762233991', '',
            'Gampaha', 30000, 0)
    RETURNING id INTO cust_anura;


  -- ============================================================
  -- PURCHASES / GRN
  -- DB trigger fires on each purchase_item INSERT:
  --   → increments products.stock_quantity
  --   → increments suppliers.credit_balance (for CREDIT purchases)
  --
  -- NOTE: Use CASH for multi-item GRNs. The credit trigger adds
  -- total_amount per item row, so single-item GRNs are used for CREDIT.
  -- ============================================================

  -- GRN-1: CASH, Lanka Tools — Drill + Hammer stock
  INSERT INTO purchases (supplier_id, invoice_number, total_amount, payment_type, notes, created_by, created_at)
    VALUES (sup_lanka, 'INV-LT-2024-001', 142000, 'CASH',
            'Initial power and hand tools order', admin_id, NOW() - INTERVAL '30 days')
    RETURNING id INTO pur1;
  INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, total_price) VALUES
    (pur1, prod_drill,  10, 12500, 125000),
    (pur1, prod_hammer, 20,   850,  17000);
  -- Stock after: drill=10, hammer=20

  -- GRN-2: CREDIT, Lanka Tools — Padlock (single item so credit trigger fires once correctly)
  INSERT INTO purchases (supplier_id, invoice_number, total_amount, payment_type, notes, created_by, created_at)
    VALUES (sup_lanka, 'INV-LT-2024-002', 2700, 'CREDIT',
            'Padlock restock — credit 30 days', admin_id, NOW() - INTERVAL '25 days')
    RETURNING id INTO pur2;
  INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, total_price) VALUES
    (pur2, prod_padlock, 15, 180, 2700);
  -- Stock after: padlock=15 | Lanka Tools credit_balance += 2700

  -- GRN-3: CASH, Ceylon Hardware — consumables
  INSERT INTO purchases (supplier_id, invoice_number, total_amount, payment_type, notes, created_by, created_at)
    VALUES (sup_ceylon, 'INV-CH-2024-101', 13050, 'CASH',
            'Consumables and accessories', admin_id, NOW() - INTERVAL '20 days')
    RETURNING id INTO pur3;
  INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, total_price) VALUES
    (pur3, prod_wire,      200, 45,  9000),
    (pur3, prod_sandpaper, 100, 15,  1500),
    (pur3, prod_brush,      30, 85,  2550);
  -- Stock after: wire=200, sandpaper=100, brush=30

  -- GRN-4: CASH, Colombo Building — building supplies
  INSERT INTO purchases (supplier_id, invoice_number, total_amount, payment_type, notes, created_by, created_at)
    VALUES (sup_colombo, 'INV-CBS-2024-052', 18700, 'CASH',
            'Building supplies delivery', admin_id, NOW() - INTERVAL '15 days')
    RETURNING id INTO pur4;
  INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, total_price) VALUES
    (pur4, prod_pvc,    50,  120,  6000),
    (pur4, prod_screw, 500,    5,  2500),
    (pur4, prod_tape,   40,   80,  3200),
    (pur4, prod_socket, 25,  280,  7000);
  -- Stock after: pvc=50, screw=500, tape=40, socket=25


  -- ============================================================
  -- SALES / POS
  -- DB trigger fires on each sale_items INSERT:
  --   → decrements products.stock_quantity
  -- DB trigger fires on each sales INSERT (if CREDIT):
  --   → increments customers.credit_balance
  -- ============================================================

  -- Sale 1: CASH, walk-in customer (12 days ago)
  INSERT INTO sales (customer_id, total_amount, paid_amount, balance_amount, payment_type, notes, created_by, created_at)
    VALUES (NULL, 17400, 17400, 0, 'CASH', NULL, admin_id, NOW() - INTERVAL '12 days')
    RETURNING id INTO sale1;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES
    (sale1, prod_drill,  1, 15000, 15000),
    (sale1, prod_hammer, 2,  1200,  2400);
  -- Stock: drill=9, hammer=18

  -- Sale 2: CASH, walk-in (10 days ago)
  INSERT INTO sales (customer_id, total_amount, paid_amount, balance_amount, payment_type, notes, created_by, created_at)
    VALUES (NULL, 990, 990, 0, 'CASH', NULL, admin_id, NOW() - INTERVAL '10 days')
    RETURNING id INTO sale2;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES
    (sale2, prod_wire,  10, 75,  750),
    (sale2, prod_brush,  2, 120, 240);
  -- Stock: wire=190, brush=28

  -- Sale 3: CREDIT, Chaminda Construction — Rs. 30,000 (8 days ago)
  INSERT INTO sales (customer_id, total_amount, paid_amount, balance_amount, payment_type, notes, created_by, created_at)
    VALUES (cust_chaminda, 30000, 0, 30000, 'CREDIT',
            'Site project — 2 drills', admin_id, NOW() - INTERVAL '8 days')
    RETURNING id INTO sale3;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES
    (sale3, prod_drill, 2, 15000, 30000);
  -- Stock: drill=7 | Chaminda credit_balance += 30000

  -- Sale 4: CASH, walk-in (6 days ago)
  INSERT INTO sales (customer_id, total_amount, paid_amount, balance_amount, payment_type, notes, created_by, created_at)
    VALUES (NULL, 1700, 1700, 0, 'CASH', NULL, admin_id, NOW() - INTERVAL '6 days')
    RETURNING id INTO sale4;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES
    (sale4, prod_pvc,   5, 180,  900),
    (sale4, prod_screw, 100,  8,  800);
  -- Stock: pvc=45, screw=400

  -- Sale 5: CREDIT, Small Shop Owner — Rs. 1,350 (4 days ago)
  INSERT INTO sales (customer_id, total_amount, paid_amount, balance_amount, payment_type, notes, created_by, created_at)
    VALUES (cust_small, 1350, 0, 1350, 'CREDIT', NULL, admin_id, NOW() - INTERVAL '4 days')
    RETURNING id INTO sale5;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES
    (sale5, prod_socket, 3, 450, 1350);
  -- Stock: socket=22 | Small Shop credit_balance += 1350

  -- Sale 6: CASH, walk-in (2 days ago)
  INSERT INTO sales (customer_id, total_amount, paid_amount, balance_amount, payment_type, notes, created_by, created_at)
    VALUES (NULL, 1000, 1000, 0, 'CASH', NULL, admin_id, NOW() - INTERVAL '2 days')
    RETURNING id INTO sale6;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES
    (sale6, prod_sandpaper, 20, 25, 500),
    (sale6, prod_padlock,    2, 250, 500);
  -- Stock: sandpaper=80, padlock=13

  -- Sale 7: CASH, walk-in TODAY (shows on dashboard today's revenue)
  INSERT INTO sales (customer_id, total_amount, paid_amount, balance_amount, payment_type, notes, created_by, created_at)
    VALUES (NULL, 1560, 1560, 0, 'CASH', NULL, admin_id, NOW())
    RETURNING id INTO sale7;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES
    (sale7, prod_hammer, 1, 1200, 1200),
    (sale7, prod_brush,  3,  120,  360);
  -- Stock: hammer=17, brush=25


  -- ============================================================
  -- STOCK ADJUSTMENTS
  -- No DB trigger — the app action updates stock directly.
  -- We do both here: insert the record AND update stock manually.
  -- ============================================================

  INSERT INTO stock_adjustments (product_id, adjustment_type, quantity, reason, created_by, created_at)
    VALUES (prod_sandpaper, 'ADD', 5,
            'Found 5 extra sheets during stocktake — not previously counted',
            admin_id, NOW() - INTERVAL '3 days');
  UPDATE products SET stock_quantity = stock_quantity + 5 WHERE id = prod_sandpaper;
  -- Stock: sandpaper=85 (reorder 90) → LOW STOCK

  INSERT INTO stock_adjustments (product_id, adjustment_type, quantity, reason, created_by, created_at)
    VALUES (prod_tape, 'SUBTRACT', 2,
            'Two rolls damaged during transit — packaging completely torn',
            admin_id, NOW() - INTERVAL '1 day');
  UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = prod_tape;
  -- Stock: tape=38


  -- ============================================================
  -- PAYMENTS
  -- No DB trigger — manually update credit balances.
  -- ============================================================

  -- Customer payment: Chaminda Construction pays Rs. 15,000 partial
  INSERT INTO customer_payments (customer_id, amount, notes, created_by, created_at)
    VALUES (cust_chaminda, 15000, 'Partial payment received — cash', admin_id, NOW() - INTERVAL '2 days');
  UPDATE customers SET credit_balance = credit_balance - 15000 WHERE id = cust_chaminda;
  -- Chaminda remaining balance: 30000 - 15000 = Rs. 15,000

  -- Supplier payment: Lanka Tools receives Rs. 1,500 towards credit balance
  INSERT INTO supplier_payments (supplier_id, amount, notes, created_by, created_at)
    VALUES (sup_lanka, 1500, 'Partial settlement — bank transfer', admin_id, NOW() - INTERVAL '5 days');
  UPDATE suppliers SET credit_balance = credit_balance - 1500 WHERE id = sup_lanka;
  -- Lanka Tools remaining balance: 2700 - 1500 = Rs. 1,200

END $$;


-- ============================================================
-- VERIFY: Run these SELECT queries to confirm the seed worked
-- ============================================================

-- Stock levels (3 should be low stock)
SELECT name, sku, stock_quantity, reorder_level,
  CASE WHEN stock_quantity = 0 THEN 'OUT OF STOCK'
       WHEN stock_quantity <= reorder_level THEN 'LOW STOCK'
       ELSE 'OK' END AS status
FROM products ORDER BY stock_quantity ASC;

-- Customer credit balances
SELECT name, credit_limit, credit_balance FROM customers ORDER BY name;

-- Supplier credit balances
SELECT name, credit_balance FROM suppliers ORDER BY name;

-- Sales summary
SELECT COUNT(*) AS total_sales, SUM(total_amount) AS total_revenue FROM sales;
