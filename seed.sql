-- ============================================================
-- Hardware Inventory — Sample Data Seed Script
-- ============================================================
-- HOW TO RUN:
--   1. schema.sql must have been run first (fresh database)
--   2. At least one ADMIN user must exist in the users table
--   3. Paste this entire script into SQL Editor and click Run
--
-- WHAT THIS CREATES:
--   7 categories, 5 suppliers, 20 products, 6 customers
--   7 GRN purchases, 12 sales (CASH / CREDIT / SPLIT + discounts)
--   4 stock adjustments, 2 customer payments, 2 supplier payments
--   2 returns (1 CASH_REFUND, 1 CREDIT_ADJUSTMENT)
--
-- FINAL LOW-STOCK ITEMS (for dashboard testing):
--   Makita Drill 750W  :  7 units  (reorder 10) ← LOW STOCK
--   PVC Pipe 1/2"      : 45 units  (reorder 50) ← LOW STOCK
--   Sandpaper 80 Grit  : 88 units  (reorder 90) ← LOW STOCK
--   Safety Helmet      :  8 units  (reorder 10) ← LOW STOCK
--
-- RETURNS (after seed):
--   padlock stock +1 (CASH_REFUND walk-in)   → 23 units
--   gloves  stock +2 (CREDIT_ADJUSTMENT)     → 52 units  | Anura credit -300
-- ============================================================

DO $$
DECLARE
  admin_id UUID;

  -- Categories
  cat_power      BIGINT; cat_hand       BIGINT; cat_plumbing  BIGINT;
  cat_electrical BIGINT; cat_fasteners  BIGINT; cat_painting  BIGINT;
  cat_safety     BIGINT;

  -- Suppliers
  sup_lanka   BIGINT; sup_ceylon  BIGINT; sup_colombo BIGINT;
  sup_rainbow BIGINT; sup_sathosa BIGINT;

  -- Products
  prod_drill       BIGINT; prod_grinder   BIGINT; prod_hammer    BIGINT;
  prod_tapemeasure BIGINT; prod_hacksaw   BIGINT; prod_pvc       BIGINT;
  prod_elbow       BIGINT; prod_wire      BIGINT; prod_mcb       BIGINT;
  prod_socket      BIGINT; prod_sandpaper BIGINT; prod_brush     BIGINT;
  prod_screw       BIGINT; prod_nail      BIGINT; prod_padlock   BIGINT;
  prod_tape        BIGINT; prod_putty     BIGINT; prod_paint     BIGINT;
  prod_helmet      BIGINT; prod_gloves    BIGINT;

  -- Customers
  cust_chaminda BIGINT; cust_small   BIGINT; cust_perera  BIGINT;
  cust_anura    BIGINT; cust_nimal   BIGINT; cust_sunrise BIGINT;

  -- Purchases
  pur1 BIGINT; pur2 BIGINT; pur3 BIGINT; pur4 BIGINT;
  pur5 BIGINT; pur6 BIGINT; pur7 BIGINT;

  -- Sales
  sale1  BIGINT; sale2  BIGINT; sale3  BIGINT; sale4  BIGINT;
  sale5  BIGINT; sale6  BIGINT; sale7  BIGINT; sale8  BIGINT;
  sale9  BIGINT; sale10 BIGINT; sale11 BIGINT; sale12 BIGINT;

  -- Returns
  ret1 BIGINT; ret2 BIGINT;

BEGIN

  SELECT id INTO admin_id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE' LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No active ADMIN user found (role=ADMIN, status=ACTIVE). Insert one into the users table first.';
  END IF;


  -- ==========================================================
  -- CATEGORIES (7)
  -- ==========================================================
  INSERT INTO categories (name, description) VALUES ('Power Tools',          'Electric and battery-powered tools')              RETURNING id INTO cat_power;
  INSERT INTO categories (name, description) VALUES ('Hand Tools',           'Manual hand tools and basic equipment')            RETURNING id INTO cat_hand;
  INSERT INTO categories (name, description) VALUES ('Plumbing',             'Pipes, fittings, and plumbing supplies')           RETURNING id INTO cat_plumbing;
  INSERT INTO categories (name, description) VALUES ('Electrical',           'Wiring, sockets, switches, and electrical parts')  RETURNING id INTO cat_electrical;
  INSERT INTO categories (name, description) VALUES ('Hardware & Fasteners', 'Screws, nails, bolts, padlocks, and fixings')      RETURNING id INTO cat_fasteners;
  INSERT INTO categories (name, description) VALUES ('Painting & Finishing', 'Paints, brushes, putty, and finishing materials')  RETURNING id INTO cat_painting;
  INSERT INTO categories (name, description) VALUES ('Safety & PPE',         'Personal protective equipment and site safety')    RETURNING id INTO cat_safety;


  -- ==========================================================
  -- SUPPLIERS (5)
  -- ==========================================================
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance) VALUES
    ('Lanka Tools Import',       'Suresh Fernando',    '0112345678', 'suresh@lankatools.lk',  'Main Street, Pettah, Colombo 11',  0) RETURNING id INTO sup_lanka;
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance) VALUES
    ('Ceylon Hardware Ltd',      'Niroshan Silva',     '0114567890', 'niroshan@ceylonhw.lk', 'Maradana Road, Colombo 10',         0) RETURNING id INTO sup_ceylon;
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance) VALUES
    ('Colombo Building Supplies','Ranjith Jayawardena','0117654321', 'ranjith@cbs.lk',        'Borella Junction, Colombo 08',      0) RETURNING id INTO sup_colombo;
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance) VALUES
    ('Rainbow Paints Lanka',     'Priya Mendis',       '0112233445', 'priya@rainbowpaints.lk','Nawala Road, Nugegoda',             0) RETURNING id INTO sup_rainbow;
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance) VALUES
    ('Sathosa Hardware',         'Bandara Wickrama',   '0118877665', 'bandara@sathosahw.lk',  'Baseline Road, Colombo 09',         0) RETURNING id INTO sup_sathosa;


  -- ==========================================================
  -- PRODUCTS (20)  stock_quantity = 0 at creation; GRNs build it
  -- ==========================================================

  -- Power Tools
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Makita Drill 750W',    'MKT-DRILL-750', '4012345670001', cat_power,      sup_lanka,   'PCS', 12500, 15000, 0, 10, true) RETURNING id INTO prod_drill;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Angle Grinder 4"',     'ANG-GRND-4IN',  '4012345670011', cat_power,      sup_lanka,   'PCS',  8500, 11000, 0,  5, true) RETURNING id INTO prod_grinder;

  -- Hand Tools
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Stanley Hammer 500g',  'STN-HMR-500G',  '4012345670002', cat_hand,       sup_lanka,   'PCS',   850,  1200, 0,  5, true) RETURNING id INTO prod_hammer;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Measuring Tape 5m',    'MSR-TAPE-5M',   '4012345670012', cat_hand,       sup_sathosa, 'PCS',   280,   420, 0, 10, true) RETURNING id INTO prod_tapemeasure;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Hacksaw Blade 12"',    'HKS-BLD-12IN',  '4012345670013', cat_hand,       sup_ceylon,  'PCS',    35,    60, 0, 20, true) RETURNING id INTO prod_hacksaw;

  -- Plumbing
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('PVC Pipe 1/2"',        'PVC-PIPE-HLF',  '4012345670003', cat_plumbing,   sup_colombo, 'PCS',   120,   180, 0, 50, true) RETURNING id INTO prod_pvc;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('PVC Elbow 1/2"',       'PVC-ELBW-HLF',  '4012345670014', cat_plumbing,   sup_colombo, 'PCS',    15,    28, 0, 50, true) RETURNING id INTO prod_elbow;

  -- Electrical
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Wire 2.5mm (per metre)','WR-2.5MM-M',   '4012345670004', cat_electrical, sup_ceylon,  'MTR',    45,    75, 0, 30, true) RETURNING id INTO prod_wire;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('MCB Switch 20A',       'MCB-SW-20A',    '4012345670015', cat_electrical, sup_sathosa, 'PCS',   320,   480, 0, 15, true) RETURNING id INTO prod_mcb;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Electric Socket 3-Pin','ELEC-SCK-3P',   '4012345670010', cat_electrical, sup_colombo, 'PCS',   280,   450, 0, 10, true) RETURNING id INTO prod_socket;

  -- Hand Tools (continued)
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Sandpaper 80 Grit',    'SND-80G-SHT',   '4012345670005', cat_hand,       sup_ceylon,  'PCS',    15,    25, 0, 90, true) RETURNING id INTO prod_sandpaper;

  -- Painting
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Paint Brush 3"',       'PNT-BRSH-3IN',  '4012345670006', cat_painting,   sup_ceylon,  'PCS',    85,   120, 0, 10, true) RETURNING id INTO prod_brush;

  -- Hardware & Fasteners
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Cement Screw 3"',      'SCR-CEM-3IN',   '4012345670007', cat_fasteners,  sup_colombo, 'PCS',     5,     8, 0,200, true) RETURNING id INTO prod_screw;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('GI Wire Nail 2"',      'NAIL-GI-2IN',   '4012345670016', cat_fasteners,  sup_sathosa, 'KG',    180,   260, 0, 20, true) RETURNING id INTO prod_nail;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Padlock 40mm Steel',   'PDL-40MM-STL',  '4012345670008', cat_fasteners,  sup_lanka,   'PCS',   180,   280, 0, 10, true) RETURNING id INTO prod_padlock;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Duct Tape 48mm',       'DCT-TAPE-48',   '4012345670009', cat_fasteners,  sup_colombo, 'PCS',    80,   130, 0, 10, true) RETURNING id INTO prod_tape;

  -- Painting & Finishing
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Wall Putty 1kg',       'WPT-1KG',       '4012345670017', cat_painting,   sup_rainbow, 'PCS',   120,   180, 0, 20, true) RETURNING id INTO prod_putty;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Gloss Paint White 1L', 'GPNT-WHT-1L',   '4012345670018', cat_painting,   sup_rainbow, 'PCS',   480,   680, 0, 15, true) RETURNING id INTO prod_paint;

  -- Safety & PPE
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Safety Helmet White',  'SFT-HLM-WHT',   '4012345670019', cat_safety,     sup_sathosa, 'PCS',   350,   550, 0, 10, true) RETURNING id INTO prod_helmet;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Safety Gloves (pair)', 'SFT-GLV-PR',    '4012345670020', cat_safety,     sup_sathosa, 'PR',     95,   150, 0, 20, true) RETURNING id INTO prod_gloves;


  -- ==========================================================
  -- CUSTOMERS (6)
  -- ==========================================================
  INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance) VALUES
    ('Chaminda Construction', '0771234567', 'chaminda@construct.lk',  'Nugegoda, Colombo',        100000, 0) RETURNING id INTO cust_chaminda;
  INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance) VALUES
    ('Small Shop Owner',      '0779876543', '',                        'Kaduwela',                  10000, 0) RETURNING id INTO cust_small;
  INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance) VALUES
    ('Perera Hardware',       '0712233445', 'info@pererahw.lk',        'Kandy Road, Kegalle',      150000, 0) RETURNING id INTO cust_perera;
  INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance) VALUES
    ('Anura Builders',        '0762233991', '',                        'Gampaha',                   50000, 0) RETURNING id INTO cust_anura;
  INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance) VALUES
    ('Nimal Contractors',     '0771122334', 'nimal@contractors.lk',    'Piliyandala, Colombo',      75000, 0) RETURNING id INTO cust_nimal;
  INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance) VALUES
    ('Sunrise Properties',    '0115566778', 'info@sunriseprop.lk',     'Rajagiriya, Colombo',      200000, 0) RETURNING id INTO cust_sunrise;


  -- ==========================================================
  -- PURCHASES / GRN (7)
  --
  -- CRITICAL: CREDIT payment GRNs must have ONLY ONE purchase_item.
  -- The increment_stock trigger adds total_amount to supplier credit
  -- once per item row, so multi-item CREDIT GRNs double-count.
  -- Use CASH for multi-item GRNs.
  --
  -- Stock after all GRNs:
  --   drill=12, grinder=12, hammer=25, tapemeasure=25, hacksaw=60
  --   pvc=80, elbow=150, wire=400, mcb=35, socket=50
  --   sandpaper=150, brush=50, screw=1000, nail=30, padlock=30
  --   tape=60, putty=60, paint=40, helmet=15, gloves=60
  -- ==========================================================

  -- GRN-1: CASH — Lanka Tools (Power Tools + Hammer)
  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_lanka,'INV-LT-2024-001',278250,'CASH','Initial power tools order',admin_id,NOW()-INTERVAL '50 days') RETURNING id INTO pur1;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur1, prod_drill,   12, 12500, 150000),
    (pur1, prod_grinder, 12,  8500, 102000),
    (pur1, prod_hammer,  25,   850,  21250);

  -- GRN-2: CREDIT — Lanka Tools (Padlock — single item only)
  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_lanka,'INV-LT-2024-002',5400,'CREDIT','Padlock restock — 30-day credit',admin_id,NOW()-INTERVAL '45 days') RETURNING id INTO pur2;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur2, prod_padlock, 30, 180, 5400);
  -- Lanka Tools credit_balance += 5400

  -- GRN-3: CASH — Ceylon Hardware (Wire, Sandpaper, Brushes, Hacksaw Blades)
  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_ceylon,'INV-CH-2024-101',25850,'CASH','Consumables and blades',admin_id,NOW()-INTERVAL '38 days') RETURNING id INTO pur3;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur3, prod_wire,      400, 45, 18000),
    (pur3, prod_sandpaper, 150, 15,  2250),
    (pur3, prod_brush,      50, 85,  4250),
    (pur3, prod_hacksaw,    60, 35,  2100);

  -- GRN-4: CASH — Colombo Building Supplies (Plumbing, Electrical, Fasteners)
  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_colombo,'INV-CBS-2024-052',47100,'CASH','Plumbing, electrical and fastener stock',admin_id,NOW()-INTERVAL '30 days') RETURNING id INTO pur4;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur4, prod_pvc,    80,  120,  9600),
    (pur4, prod_elbow, 150,   15,  2250),
    (pur4, prod_screw, 1000,   5,  5000),
    (pur4, prod_tape,   60,   80,  4800),
    (pur4, prod_socket, 50,  280, 14000),
    (pur4, prod_nail,   30,  180,  5400),
    (pur4, prod_mcb,    35,  320, 11200);

  -- GRN-5: CASH — Rainbow Paints (Paints + Putty + Gloves)
  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_rainbow,'INV-RP-2024-201',33900,'CASH','Paints, putty and safety gloves',admin_id,NOW()-INTERVAL '20 days') RETURNING id INTO pur5;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur5, prod_putty,  60, 120,  7200),
    (pur5, prod_paint,  40, 480, 19200),
    (pur5, prod_gloves, 60,  95,  5700);

  -- GRN-6: CREDIT — Sathosa Hardware (Safety Helmets — single item)
  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_sathosa,'INV-SH-2024-301',5250,'CREDIT','Safety helmets on credit',admin_id,NOW()-INTERVAL '12 days') RETURNING id INTO pur6;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur6, prod_helmet, 15, 350, 5250);
  -- Sathosa credit_balance += 5250

  -- GRN-7: CASH — Sathosa Hardware (Measuring Tapes)
  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_sathosa,'INV-SH-2024-302',7000,'CASH','Measuring tapes',admin_id,NOW()-INTERVAL '10 days') RETURNING id INTO pur7;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur7, prod_tapemeasure, 25, 280, 7000);


  -- ==========================================================
  -- SALES (12)  — stock tracked cumulatively in comments
  --
  -- Starting stock: drill=12 grinder=12 hammer=25 tapemeasure=25
  --   hacksaw=60 pvc=80 elbow=150 wire=400 mcb=35 socket=50
  --   sandpaper=150 brush=50 screw=1000 nail=30 padlock=30
  --   tape=60 putty=60 paint=40 helmet=15 gloves=60
  -- ==========================================================

  -- Sale 1: CASH walk-in (40 days ago)
  -- drill-1=11, hammer-2=23, padlock-3=27
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL, 18240, 0, 18240, 0, 'CASH', NULL, admin_id, NOW()-INTERVAL '40 days') RETURNING id INTO sale1;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale1, prod_drill,   1, 15000, 15000),
    (sale1, prod_hammer,  2,  1200,  2400),
    (sale1, prod_padlock, 3,   280,   840);

  -- Sale 2: CREDIT — Chaminda Construction (35 days ago)
  -- drill-2=9  [Chaminda credit: +30000]
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_chaminda, 30000, 0, 0, 30000, 'CREDIT', 'Site project — 2 drills on credit', admin_id, NOW()-INTERVAL '35 days') RETURNING id INTO sale2;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale2, prod_drill, 2, 15000, 30000);

  -- Sale 3: CASH walk-in (28 days ago)
  -- wire-100=300, brush-5=45, sandpaper-30=120
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL, 8850, 0, 8850, 0, 'CASH', NULL, admin_id, NOW()-INTERVAL '28 days') RETURNING id INTO sale3;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale3, prod_wire,      100, 75, 7500),
    (sale3, prod_brush,       5, 120,  600),
    (sale3, prod_sandpaper,  30,  25,  750);

  -- Sale 4: CREDIT — Perera Hardware (22 days ago)
  -- socket-8=42, mcb-8=27, screw-200=800, hacksaw-15=45, brush-5=40
  -- [Perera credit: +10540]
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_perera, 10540, 0, 0, 10540, 'CREDIT', 'Monthly stock supply', admin_id, NOW()-INTERVAL '22 days') RETURNING id INTO sale4;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale4, prod_socket,  8, 450, 3600),
    (sale4, prod_mcb,     8, 480, 3840),
    (sale4, prod_screw, 200,   8, 1600),
    (sale4, prod_hacksaw,15,  60,  900),
    (sale4, prod_brush,   5, 120,  600);

  -- Sale 5: CASH with discount (18 days ago)
  -- pvc-35=45, elbow-20=130, tape-5=55, nail-5=25
  -- Subtotal: 6300+560+650+1300=8810, discount=500, total=8310
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL, 8310, 500, 8310, 0, 'CASH', 'Bulk discount applied', admin_id, NOW()-INTERVAL '18 days') RETURNING id INTO sale5;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale5, prod_pvc,   35, 180, 6300),
    (sale5, prod_elbow, 20,  28,  560),
    (sale5, prod_tape,   5, 130,  650),
    (sale5, prod_nail,   5, 260, 1300);

  -- Sale 6: SPLIT — Nimal Contractors (15 days ago)
  -- wire-100=200, padlock-5=22, total=8900, cash=4000, credit=4900
  -- [Nimal credit: +4900]
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_nimal, 8900, 0, 4000, 4900, 'SPLIT', 'Partial cash, balance on credit', admin_id, NOW()-INTERVAL '15 days') RETURNING id INTO sale6;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale6, prod_wire,    100, 75, 7500),
    (sale6, prod_padlock,   5, 280, 1400);

  -- Sale 7: CREDIT — Anura Builders (10 days ago)
  -- helmet-7=8, gloves-10=50, total=5350
  -- [Anura credit: +5350]
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_anura, 5350, 0, 0, 5350, 'CREDIT', 'Safety equipment for construction site', admin_id, NOW()-INTERVAL '10 days') RETURNING id INTO sale7;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale7, prod_helmet,  7, 550, 3850),
    (sale7, prod_gloves, 10, 150, 1500);

  -- Sale 8: CASH — Sunrise Properties (8 days ago)
  -- grinder-2=10, paint-3=37, putty-5=55, total=24940
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_sunrise, 24940, 0, 24940, 0, 'CASH', 'Property renovation supplies', admin_id, NOW()-INTERVAL '8 days') RETURNING id INTO sale8;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale8, prod_grinder, 2, 11000, 22000),
    (sale8, prod_paint,   3,   680,  2040),
    (sale8, prod_putty,   5,   180,   900);

  -- Sale 9: CASH walk-in (5 days ago)
  -- brush-5=35, sandpaper-30=90, tapemeasure-3=22, total=2610
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL, 2610, 0, 2610, 0, 'CASH', NULL, admin_id, NOW()-INTERVAL '5 days') RETURNING id INTO sale9;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale9, prod_brush,       5, 120,  600),
    (sale9, prod_sandpaper,  30,  25,  750),
    (sale9, prod_tapemeasure, 3, 420, 1260);

  -- Sale 10: SPLIT — Small Shop Owner (3 days ago)
  -- screw-200=600, nail-5=20, total=2900, cash=1500, credit=1400
  -- [Small Shop credit: +1400]
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_small, 2900, 0, 1500, 1400, 'SPLIT', NULL, admin_id, NOW()-INTERVAL '3 days') RETURNING id INTO sale10;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale10, prod_screw, 200,   8, 1600),
    (sale10, prod_nail,    5, 260, 1300);

  -- Sale 11: CASH walk-in (2 days ago)
  -- hammer-2=21, hacksaw-10=35, mcb-3=24, total=4440
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL, 4440, 0, 4440, 0, 'CASH', NULL, admin_id, NOW()-INTERVAL '2 days') RETURNING id INTO sale11;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale11, prod_hammer,  2, 1200, 2400),
    (sale11, prod_hacksaw,10,   60,  600),
    (sale11, prod_mcb,     3,  480, 1440);

  -- Sale 12: CASH TODAY (shows on today's revenue dashboard)
  -- wire-50=150, socket-3=39, tape-5=50, total=5750
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL, 5750, 0, 5750, 0, 'CASH', NULL, admin_id, NOW()) RETURNING id INTO sale12;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale12, prod_wire,   50,  75, 3750),
    (sale12, prod_socket,  3, 450, 1350),
    (sale12, prod_tape,    5, 130,  650);


  -- ==========================================================
  -- STOCK ADJUSTMENTS (4)
  -- No DB trigger — insert record AND manually update stock.
  -- Applied after all sales. Final LOW STOCK items shown below.
  -- ==========================================================

  -- Adj 1: Sandpaper SUBTRACT 2 → 90-2 = 88  (reorder 90 → LOW STOCK ✓)
  INSERT INTO stock_adjustments (product_id,adjustment_type,quantity,reason,created_by,created_at)
    VALUES (prod_sandpaper,'SUBTRACT',2,'Two damaged sheets found during stocktake — disposed',admin_id,NOW()-INTERVAL '1 day');
  UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = prod_sandpaper;

  -- Adj 2: Tape SUBTRACT 2 → 50-2 = 48
  INSERT INTO stock_adjustments (product_id,adjustment_type,quantity,reason,created_by,created_at)
    VALUES (prod_tape,'SUBTRACT',2,'Two rolls damaged in storage — moisture damage',admin_id,NOW()-INTERVAL '3 days');
  UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = prod_tape;

  -- Adj 3: Drill SUBTRACT 2 → 9-2 = 7  (reorder 10 → LOW STOCK ✓)
  INSERT INTO stock_adjustments (product_id,adjustment_type,quantity,reason,created_by,created_at)
    VALUES (prod_drill,'SUBTRACT',2,'Two drills returned — motor failure, written off as damaged',admin_id,NOW()-INTERVAL '2 days');
  UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = prod_drill;

  -- Adj 4: Putty ADD 5 → 55+5 = 60  (stocktake correction)
  INSERT INTO stock_adjustments (product_id,adjustment_type,quantity,reason,created_by,created_at)
    VALUES (prod_putty,'ADD',5,'5 bags found in back store — not previously counted in system',admin_id,NOW()-INTERVAL '6 days');
  UPDATE products SET stock_quantity = stock_quantity + 5 WHERE id = prod_putty;

  -- ==========================================================
  -- EXPECTED FINAL STOCK (after sales + adjustments + returns):
  --   drill=7(LOW)  grinder=10  hammer=21  tapemeasure=22
  --   hacksaw=35    pvc=45(LOW) elbow=130  wire=150
  --   mcb=24        socket=39   sandpaper=88(LOW) brush=35
  --   screw=600     nail=20     padlock=23 tape=48
  --   putty=60      paint=37    helmet=8(LOW) gloves=52
  -- ==========================================================


  -- ==========================================================
  -- CUSTOMER PAYMENTS (2)
  -- No trigger — manually reduce credit_balance.
  -- ==========================================================

  -- Chaminda pays Rs. 20,000 partial (28 days ago)
  INSERT INTO customer_payments (customer_id,amount,notes,created_by,created_at)
    VALUES (cust_chaminda, 20000, 'Partial payment — cash', admin_id, NOW()-INTERVAL '28 days');
  UPDATE customers SET credit_balance = credit_balance - 20000 WHERE id = cust_chaminda;
  -- Chaminda remaining: 30000 - 20000 = Rs. 10,000

  -- Perera Hardware pays Rs. 5,000 (18 days ago)
  INSERT INTO customer_payments (customer_id,amount,notes,created_by,created_at)
    VALUES (cust_perera, 5000, 'Bank transfer received', admin_id, NOW()-INTERVAL '18 days');
  UPDATE customers SET credit_balance = credit_balance - 5000 WHERE id = cust_perera;
  -- Perera remaining: 10540 - 5000 = Rs. 5,540


  -- ==========================================================
  -- SUPPLIER PAYMENTS (2)
  -- No trigger — manually reduce credit_balance.
  -- ==========================================================

  -- Lanka Tools receives Rs. 3,000 (38 days ago)
  INSERT INTO supplier_payments (supplier_id,amount,notes,created_by,created_at)
    VALUES (sup_lanka, 3000, 'Partial settlement — bank transfer', admin_id, NOW()-INTERVAL '38 days');
  UPDATE suppliers SET credit_balance = credit_balance - 3000 WHERE id = sup_lanka;
  -- Lanka Tools remaining: 5400 - 3000 = Rs. 2,400

  -- Sathosa Hardware receives Rs. 2,500 (8 days ago)
  INSERT INTO supplier_payments (supplier_id,amount,notes,created_by,created_at)
    VALUES (sup_sathosa, 2500, 'Partial payment — cash', admin_id, NOW()-INTERVAL '8 days');
  UPDATE suppliers SET credit_balance = credit_balance - 2500 WHERE id = sup_sathosa;
  -- Sathosa remaining: 5250 - 2500 = Rs. 2,750


  -- ==========================================================
  -- RETURNS (2)
  -- No trigger — stock is manually restored here.
  -- ==========================================================

  -- Return 1: Anura Builders returns 2 gloves (from Sale 7) — CREDIT_ADJUSTMENT
  -- Reduces Anura's credit balance: 5350 - 300 = Rs. 5,050
  -- gloves stock: 50 + 2 = 52
  INSERT INTO returns (sale_id,customer_id,total_return_amount,return_method,notes,created_by,created_at)
    VALUES (sale7, cust_anura, 300, 'CREDIT_ADJUSTMENT', '2 pairs — wrong size, exchanged', admin_id, NOW()-INTERVAL '7 days') RETURNING id INTO ret1;
  INSERT INTO return_items (return_id,product_id,quantity,unit_price,total_price) VALUES
    (ret1, prod_gloves, 2, 150, 300);
  UPDATE products  SET stock_quantity = stock_quantity + 2   WHERE id = prod_gloves;
  UPDATE customers SET credit_balance = credit_balance - 300 WHERE id = cust_anura;

  -- Return 2: Walk-in returns 1 padlock (from Sale 1) — CASH_REFUND
  -- No customer credit change (walk-in, cash refund issued)
  -- padlock stock: 22 + 1 = 23
  INSERT INTO returns (sale_id,customer_id,total_return_amount,return_method,notes,created_by,created_at)
    VALUES (sale1, NULL, 280, 'CASH_REFUND', 'Wrong size, cash refunded at counter', admin_id, NOW()-INTERVAL '38 days') RETURNING id INTO ret2;
  INSERT INTO return_items (return_id,product_id,quantity,unit_price,total_price) VALUES
    (ret2, prod_padlock, 1, 280, 280);
  UPDATE products SET stock_quantity = stock_quantity + 1 WHERE id = prod_padlock;

END $$;


-- ==========================================================
-- VERIFY — Run these after seed to confirm correctness
-- ==========================================================

-- Stock levels (4 should be LOW STOCK)
SELECT name, sku, unit, stock_quantity, reorder_level,
  CASE WHEN stock_quantity = 0              THEN '❌ OUT OF STOCK'
       WHEN stock_quantity <= reorder_level THEN '⚠ LOW STOCK'
       ELSE '✓ OK' END AS status
FROM products ORDER BY status, stock_quantity ASC;

-- Customer balances
SELECT name, credit_limit, credit_balance,
  credit_limit - credit_balance AS available_credit
FROM customers ORDER BY credit_balance DESC;

-- Supplier balances
SELECT name, credit_balance FROM suppliers WHERE credit_balance > 0;

-- Sales summary by type
SELECT
  COUNT(*)                                                       AS total_sales,
  SUM(total_amount)                                              AS total_revenue,
  SUM(discount_amount)                                           AS total_discounts,
  SUM(CASE WHEN payment_type = 'CASH'   THEN 1 ELSE 0 END)      AS cash_count,
  SUM(CASE WHEN payment_type = 'CREDIT' THEN 1 ELSE 0 END)      AS credit_count,
  SUM(CASE WHEN payment_type = 'SPLIT'  THEN 1 ELSE 0 END)      AS split_count
FROM sales;

-- Category and product count
SELECT c.name AS category, COUNT(p.id) AS product_count
FROM categories c LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name ORDER BY c.name;

-- Returns summary
SELECT
  r.id,
  r.return_method,
  r.total_return_amount,
  r.notes,
  c.name AS customer,
  r.created_at
FROM returns r
LEFT JOIN customers c ON c.id = r.customer_id
ORDER BY r.created_at;
