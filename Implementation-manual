  ---
  Complete Implementation Steps

  ---
  PHASE 0 — BEFORE YOU START CODING

  ---
  STEP 1 — MANUAL: Create your new project folder

  Create a new empty folder on your computer — name it hardware-inventory (or anything you like). Copy the CLAUDE.md file from the current Spring Boot project
   into this new folder. Open this new folder in VS Code. Open Claude Code terminal inside this folder. All future steps happen here.

  ---
  STEP 2 — MANUAL: Create your Supabase project

  1. Go to https://supabase.com → sign up or login
  2. Click New Project
  3. Name: hardware-inventory, choose a strong database password (save it somewhere)
  4. Region: Southeast Asia (Singapore) — closest to Sri Lanka
  5. Wait 2–3 minutes for the project to be ready
  6. Go to Settings → API — copy and save:
    - Project URL (looks like https://xxxx.supabase.co)
    - anon public key
    - service_role key (keep this secret)

  ---
  STEP 3 — MANUAL: Create your GitHub repository

  Create a new empty GitHub repository called hardware-inventory. You will push your code here after each phase. Vercel will deploy from this repo at the end.

  ---
  PHASE 1 — PROJECT SETUP

  ---
  STEP 4 — CLAUDE: Create the Next.js project and install all packages

  Read CLAUDE.md. Do the following in order:
  1. Run the Next.js project creation command from the Package Installation section to scaffold the project in the current folder.
  2. Install all npm packages listed in the Package Installation section.
  3. Run the shadcn/ui init command and add all the listed shadcn components.
  4. Create the complete folder and file structure shown in the Project Structure section — empty files are fine, just create the folders and placeholder
  files.
  5. Create a .env.local file using the template from the Environment Variables section. Leave placeholder values — I will fill them in next.

  ---
  STEP 5 — MANUAL: Fill in your .env.local

  Open .env.local and replace the placeholder values with your real Supabase URL and keys from Step 2. Also add:
  NEXT_PUBLIC_SHOP_NAME=Your Hardware Shop Name
  NEXT_PUBLIC_SHOP_ADDRESS=Your Shop Address, City, Sri Lanka
  NEXT_PUBLIC_SHOP_PHONE=+94 XX XXX XXXX

  ---
  STEP 6 — CLAUDE: Generate the complete Supabase SQL setup script

  Read CLAUDE.md. Generate one complete, ready-to-run SQL script that I will paste into the Supabase SQL Editor. The script must include in this order:
  1. All CREATE TABLE statements from the Database Schema section (in correct order — referenced tables first).
  2. Enable RLS on every table.
  3. The get_user_role() helper function.
  4. All database trigger functions and their CREATE TRIGGER statements (increment_stock_on_purchase, decrement_stock_on_sale,
  update_customer_credit_on_sale).
  5. All RLS policies for every table — one policy per operation per table — matching the Role Access Rules table exactly.
  Output only the SQL, no explanation.

  ---
  STEP 7 — MANUAL: Run the SQL in Supabase

  1. Go to your Supabase project → SQL Editor → New Query
  2. Paste the entire SQL from Step 6 → click Run
  3. If any errors appear, note them — you will fix them in the next Claude step if needed

  ---
  STEP 8 — MANUAL: Create your ADMIN user in Supabase

  1. Go to Supabase → Authentication → Users → Invite user
  2. Enter your email address → Send invite
  3. Check your email → click the invite link → set your password
  4. Back in Supabase → Authentication → Users → copy the User UID (UUID) of your new user
  5. Go to SQL Editor and run:
  INSERT INTO users (id, full_name, email, role, is_active)
  VALUES ('PASTE-YOUR-UUID-HERE', 'Administrator', 'your@email.com', 'ADMIN', true);

  ---
  PHASE 2 — AUTHENTICATION & LAYOUT

  ---
  STEP 9 — CLAUDE: Supabase clients + auth actions + middleware

  Read CLAUDE.md. Implement the complete authentication foundation:
  1. lib/supabase/server.ts — server-side Supabase client using @supabase/ssr createServerClient with cookie handling.
  2. lib/supabase/client.ts — browser-side Supabase client using createBrowserClient.
  3. middleware.ts — session refresh on every request. Redirect unauthenticated users to /login. Redirect authenticated users who visit /login to their
  role-based landing page (ADMIN/OWNER → /dashboard, CASHIER → /sales/pos, STORE_KEEPER → /purchases).
  4. actions/auth.actions.ts — signIn (email + password, check is_active, redirect by role), signOut (clear session, redirect to /login), getCurrentUser
  (returns user row from users table including role).
  5. A useUser() React context and provider that makes current user + role available to all client components.

  ---
  STEP 10 — CLAUDE: Login page

  Read CLAUDE.md. Build the complete login page following Business Workflows section 1 (Login):
  1. app/(auth)/layout.tsx — centered layout, no sidebar.
  2. app/(auth)/login/page.tsx — email and password fields using react-hook-form + Zod validation. Submit calls the signIn Server Action. Show error message
  "Invalid email or password" for wrong credentials. Show "Your account has been deactivated. Contact the administrator." for inactive accounts. No register
  link anywhere. Use shadcn/ui Card, Input, Button components. Add the shop name from env var as a heading.

  ---
  STEP 11 — CLAUDE: Dashboard layout — sidebar and top navigation

  Read CLAUDE.md. Build the main application layout that wraps all dashboard pages:
  1. components/layout/Sidebar.tsx — vertical sidebar with navigation links. Show/hide menu items per role exactly as in the Navigation & Sidebar by Role
  table in Business Workflows section 2. Fetch count of low-stock products (stock_quantity <= reorder_level) and show as a red badge on the Products link.
  Show logged-in user's full name and role badge at the bottom of the sidebar.
  2. components/layout/TopNav.tsx — top bar with page title, and a user dropdown on the right showing user name, a Change Password option, and a Logout button
   that calls signOut.
  3. app/(dashboard)/layout.tsx — imports Sidebar and TopNav, checks for valid session (redirect to /login if none), wraps page content. Fetch and provide the
   current user role to child components via context.

  ---
  PHASE 3 — CORE INVENTORY

  ---
  STEP 12 — CLAUDE: Categories

  Read CLAUDE.md. Implement complete Category Management following Business Workflows section 5:
  1. lib/validations/category.schema.ts — Zod schema for category create/edit.
  2. actions/categories.actions.ts — getCategories (include product count per category), createCategory, updateCategory, deleteCategory (check for existing
  products — return an error string if any exist, do not delete).
  3. app/(dashboard)/categories/page.tsx — data table: Name, Description, Product Count. "Add Category" button opens a shadcn Dialog with the form. Each row
  has Edit (opens same dialog pre-filled) and Delete (opens confirmation dialog — shows error message if blocked). Success and error toast notifications for
  all actions.

  ---
  STEP 13 — CLAUDE: Suppliers

  Read CLAUDE.md. Implement complete Supplier Management following Business Workflows section 6:
  1. lib/validations/supplier.schema.ts — Zod schema.
  2. actions/suppliers.actions.ts — getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier (blocked if purchases exist — return error
  string), recordSupplierPayment (validate amount > 0 and amount <= credit_balance — return error string if not).
  3. app/(dashboard)/suppliers/page.tsx — table: Name, Contact Person, Phone, Email, Credit Balance (amber text color if > 0). "Add Supplier" button opens
  dialog.
  4. app/(dashboard)/suppliers/[id]/page.tsx — editable supplier info form at top. Credit Balance card showing current amount. "Record Payment" button opens
  dialog (amount field with max = credit_balance, optional notes). Two tabs below: Purchase History (list of all GRNs for this supplier) and Payment History
  (list of all supplier_payments records).

  ---
  STEP 14 — CLAUDE: Products

  Read CLAUDE.md. Implement complete Product Management following Business Workflows section 4:
  1. lib/validations/product.schema.ts — Zod schema for all product fields.
  2. actions/products.actions.ts — getProducts (with search by name/SKU, categoryId filter, lowStock boolean filter, page number for pagination),
  getProductById, getProductByBarcode, createProduct (validate unique SKU and barcode), updateProduct (same uniqueness check), deleteProduct (blocked if
  sale_items or purchase_items exist — return error).
  3. app/(dashboard)/products/page.tsx — table with all columns. Search input (debounced). Category filter dropdown. "Low stock only" toggle button. Amber row
   highlight for low stock, red for zero stock. "Add Product" button visible to ADMIN/OWNER/STORE_KEEPER. Edit button same roles. Delete button ADMIN/OWNER
  only.
  4. Product create/edit — use a full page (/products/new and /products/[id]/edit) not a dialog, because there are many fields. Include all fields from the
  form fields table in section 4 including image upload to Supabase Storage bucket "product-images". Show warning toast (but do not block) if selling_price <
  buying_price.

  ---
  PHASE 4 — CUSTOMERS & TRANSACTIONS

  ---
  STEP 15 — CLAUDE: Customers

  Read CLAUDE.md. Implement complete Customer Management following Business Workflows section 7:
  1. lib/validations/customer.schema.ts — Zod schema.
  2. actions/customers.actions.ts — getCustomers, getCreditCustomers (credit_balance > 0), getCustomerById, createCustomer, updateCustomer,
  recordCustomerPayment (validate amount > 0 and amount <= credit_balance).
  3. app/(dashboard)/customers/page.tsx — table: Name, Phone, Email, Credit Limit, Credit Balance (amber if > 0). "Credit customers only" filter toggle. "Add
  Customer" dialog.
  4. app/(dashboard)/customers/[id]/page.tsx — editable customer info. Credit Balance card. Credit Limit card. "Record Payment" dialog (amount max =
  credit_balance, notes optional). Two tabs: Sales History (all sales for this customer), Payment History (all customer_payments records).

  ---
  STEP 16 — CLAUDE: GRN / Purchase — list and create

  Read CLAUDE.md. Implement GRN creation following Business Workflows section 8:
  1. lib/validations/purchase.schema.ts — Zod schema for the full GRN form including line items array.
  2. actions/purchases.actions.ts — getPurchases (with supplierId filter and pagination), getPurchaseById (include all purchase_items with product details),
  createPurchase (insert purchases row then all purchase_items rows — the DB triggers will handle stock and credit updates automatically).
  3. app/(dashboard)/purchases/page.tsx — table: Date, Supplier, Invoice#, Items count, Total Amount, Payment Type, Created By. "New GRN" button navigates to
  /purchases/new.
  4. app/(dashboard)/purchases/new/page.tsx — the full multi-step form: supplier searchable dropdown, invoice number field, payment type radio (CASH/CREDIT),
  notes field. Dynamic line items table with "Add Item" button — each row has: product searchable dropdown (shows name + SKU + current stock in parentheses),
  quantity input, unit price input (auto-fills from product buying_price, editable), line total (read-only, auto-calculated). "Remove" button per row. Grand
  total at bottom (read-only, sum of all line totals). Submit button with validation: supplier required, at least 1 item, all quantities > 0, all prices > 0.

  ---
  STEP 17 — CLAUDE: GRN detail page + GRN PDF document

  Read CLAUDE.md. Build:
  1. app/(dashboard)/purchases/[id]/page.tsx — full read-only GRN detail view. All header fields, line items table, grand total, created by + timestamp.
  "Print GRN" button.
  2. components/pdf/GrnDocument.tsx — React-PDF document component with all content defined in Business Workflows section 14 (GRN Document): shop
  name/address/phone from NEXT_PUBLIC_ env vars, GRN number formatted as GRN-000012 (zero-padded to 6 digits), date+time in Sri Lanka timezone (Asia/Colombo),
   supplier name and contact info, invoice number (if present), line items table with columns: Product Name, Unit, Qty, Unit Price (Rs.), Line Total (Rs.),
  grand total row, payment type label, "Received By" with the user's full name.
  3. Wire the "Print GRN" button on the detail page to open a PDF preview using PDFViewer or trigger download using PDFDownloadLink.

  ---
  STEP 18 — CLAUDE: POS / Sale terminal

  Read CLAUDE.md. Build the POS terminal — the most important screen in the app. Follow Business Workflows section 9 exactly and completely.
  1. lib/validations/sale.schema.ts — Zod schema for sale + sale items.
  2. actions/sales.actions.ts — getSales (with customerId, startDate, endDate filters and pagination), getSaleById (with all sale_items and product details),
  createSale (full server-side validation: cart not empty, stock check per item, credit customer required if CREDIT, credit limit check if customer has
  credit_limit > 0, amount received >= total if CASH — return specific error strings for each failure. DB triggers handle stock and credit updates).
  3. app/(dashboard)/sales/pos/page.tsx — two-panel layout:
     LEFT: cart panel showing added items (product name, qty editable input, unit price, line total, remove button), running total.
     RIGHT: barcode input field (auto-focused on mount and after every item added, supports Enter key from USB scanner), product name search with dropdown
  results. When product added: if already in cart increment qty, else add new row.
     BOTTOM: customer searchable dropdown, payment type toggle CASH/CREDIT. CASH shows "Amount Received" input and auto-calculated "Change" display. CREDIT
  hides amount received, requires customer. "Complete Sale" button runs the full validation sequence, shows specific error for each failure. On success:
  replace cart with post-sale success screen showing receipt summary, change amount (CASH), Print Receipt button, New Sale button that resets everything.
  This is a client component — use React state for cart management.

  ---
  STEP 19 — CLAUDE: Sale history + receipt PDF

  Read CLAUDE.md. Build:
  1. components/pdf/SaleReceipt.tsx — React-PDF receipt component with all content from Business Workflows section 14 (Sale Receipt): shop name/address/phone
  from env vars, receipt number REC-000045 (zero-padded sale ID), date+time in Asia/Colombo timezone, cashier full name, customer name or "Walk-in Customer",
  line items table (Product Name, Qty, Unit Price, Line Total), subtotal, total amount, payment type, if CASH show Amount Received and Change, if CREDIT show
  "On Credit" label.
  2. app/(dashboard)/sales/page.tsx — sales history table: Date/Time, Customer (or Walk-in), Total Amount, Payment Type, Cashier name. Date range filter,
  customer filter, payment type filter. All sales read-only — no edit/delete buttons.
  3. app/(dashboard)/sales/[id]/page.tsx — read-only sale detail with all fields and line items. "Print Receipt" button using SaleReceipt component.
  4. Wire "Print Receipt" on the POS post-sale success screen (from Step 18) to use the same SaleReceipt component with the just-created sale data.

  ---
  STEP 20 — CLAUDE: Stock Adjustments

  Read CLAUDE.md. Implement Stock Adjustments following Business Workflows section 10:
  1. lib/validations/stock-adjustment.schema.ts — Zod schema.
  2. actions/stock-adjustments.actions.ts — getStockAdjustments (with productId filter and pagination), createStockAdjustment (validate: if type is SUBTRACT,
  qty must not exceed product's current stock_quantity — return specific error if it does. Update products.stock_quantity in the same action after inserting
  the adjustment record).
  3. app/(dashboard)/stock-adjustments/page.tsx — table: Date, Product, Type (ADD badge in green / SUBTRACT badge in red), Qty, Reason, Done By. "New
  Adjustment" button opens dialog: product searchable dropdown showing current stock in parentheses, ADD/SUBTRACT radio, quantity input, reason textarea
  (required, minimum 5 characters). Show live validation error if SUBTRACT qty exceeds current stock.

  ---
  PHASE 5 — REPORTS & DASHBOARD

  ---
  STEP 21 — CLAUDE: Dashboard page

  Read CLAUDE.md. Build the main dashboard page following Business Workflows section 3:
  1. actions/reports.actions.ts — getDashboardSummary (today's sale count + revenue, total active products count, low stock count, total customer credit
  outstanding, total supplier credit outstanding), getDailyReport, getMonthlyReport, getLowStockProducts, getTopSellingProducts.
  2. app/(dashboard)/dashboard/page.tsx — five summary cards at top (see exact content in section 3). Low Stock card is clickable — navigates to
  /products?lowStock=true. Below cards: Recharts BarChart showing daily sales revenue for the last 30 days (x-axis: date, y-axis: Rs. amount). Below chart:
  low stock table showing top 10 products with lowest stock — columns: Product Name, SKU, Current Stock, Reorder Level, Supplier.

  ---
  STEP 22 — CLAUDE: All reports pages

  Read CLAUDE.md. Build all four reports pages following Business Workflows section 11:
  1. app/(dashboard)/reports/daily/page.tsx — date picker defaulting to today. Four summary cards: Total Sales Count, Total Revenue, Cash Revenue, Credit
  Revenue. Table: Sale Time, Customer, Cashier, Items count, Total, Payment Type. "Export PDF" button (generate a simple PDF table using React-PDF).
  2. app/(dashboard)/reports/monthly/page.tsx — month and year pickers defaulting to current month. Three summary cards: Total Sales, Total Revenue, Average
  Daily Revenue. Recharts BarChart of daily revenue for the month. Table: Date, Sales Count, Cash Total, Credit Total, Daily Total. "Export PDF" button.
  3. app/(dashboard)/reports/top-products/page.tsx — start and end date pickers. Table: Rank, Product Name, SKU, Qty Sold, Revenue. Recharts BarChart top 10
  by quantity.
  4. app/(dashboard)/reports/low-stock/page.tsx — no filter needed. Table sorted by stock quantity ascending: Product Name, SKU, Category, Current Stock,
  Reorder Level, Supplier name. "Export PDF" button. Link this page from the Dashboard low stock card click.

  ---
  PHASE 6 — ADMIN & USER MANAGEMENT

  ---
  STEP 23 — CLAUDE: User management

  Read CLAUDE.md. Implement User Management (ADMIN only) following Business Workflows section 12:
  1. actions/users.actions.ts — getUsers, updateUserRole (block if this user is the only ADMIN and is changing themselves), toggleUserStatus (block if trying
  to deactivate themselves), changePassword (calls Supabase Auth updateUser).
  2. app/(dashboard)/users/page.tsx — table: Full Name, Email, Role (inline editable dropdown), Status (Active/Inactive toggle), Created At. "Invite User"
  button opens dialog: Full Name, Email, Role fields. On submit: create Supabase Auth user with a temporary password and mark email as confirmed, then insert
  into users table with the returned auth UUID and selected role. Show the temp password to the ADMIN in a success dialog so they can share it with the new
  staff member.
  3. Change Password dialog accessible from TopNav profile dropdown — available to all roles. Fields: New Password + Confirm New Password (min 8 chars, must
  match). Calls changePassword action.
  4. Add route protection: if a non-ADMIN somehow reaches /users, redirect them to /dashboard.

  ---
  PHASE 7 — POLISH & PRODUCTION QUALITY

  ---
  STEP 24 — CLAUDE: Loading skeletons, empty states, and pagination

  Read CLAUDE.md. Add production-quality polish across the entire app:
  1. Add shadcn Skeleton loading states to every data table page — shown while React Query is fetching. Each table should show 5 skeleton rows matching the
  column structure of the real table.
  2. Add empty state UI to every table when there are no records — a centered icon, a short message, and where appropriate an action button (e.g., "No
  products yet — Add your first product").
  3. Add a reusable Pagination component and connect it to all list pages that have paginated actions (products, sales, purchases, customers, suppliers,
  stock-adjustments). Show page number, prev/next buttons, and total record count.
  4. Verify every create/update/delete/payment Server Action shows a success toast (green) on success and an error toast (red) on failure. Use shadcn Sonner
  for toasts. No action should fail silently.

  ---
  STEP 25 — CLAUDE: Error handling and final checks

  Read CLAUDE.md. Complete the following final production checks:
  1. Add app/not-found.tsx — a clean 404 page with a "Go to Dashboard" button.
  2. Add app/error.tsx — a clean error boundary page.
  3. Run through the complete Business Rules list in section 13 and verify each constraint is enforced in the relevant Server Action — check: stock never goes
   negative, credit limit enforcement, SKU uniqueness, category delete block, supplier delete block, last-ADMIN protection. Fix any that are missing.
  4. Check that all monetary values throughout the app are displayed using a formatCurrency() utility that outputs "Rs. 1,250.00" format.
  5. Check all date/time displays use Asia/Colombo timezone (UTC+5:30).
  6. Run npm run build and fix all TypeScript errors and build warnings until the build completes successfully with zero errors.

  ---
  PHASE 8 — TESTING

  ---
  STEP 26 — CLAUDE: Full end-to-end test

  Read CLAUDE.md. Perform a complete end-to-end flow test — trace through every business workflow and report what works and what is broken:
  1. Auth: login, role-based redirect, sidebar visibility per role, logout.
  2. Setup data: create 1 category, 1 supplier, 1 customer (with credit limit Rs. 5000), 2 products with initial stock.
  3. GRN flow: create a GRN with 2 products, CREDIT payment type. After submit, verify products.stock_quantity increased and suppliers.credit_balance
  increased.
  4. Cash sale: go to POS, add 1 product, CASH payment Rs. 500. After submit verify stock decreased, receipt shows correct change.
  5. Credit sale: POS, add 1 product, CREDIT, select the customer. After submit verify stock decreased and customer.credit_balance increased.
  6. Credit limit test: try a credit sale that would exceed the customer's Rs. 5000 limit. Verify it is blocked with correct error.
  7. Customer payment: go to customer detail, record a payment. Verify credit_balance decreases.
  8. Stock adjustment: subtract 1 unit from a product with reason. Verify stock decreased.
  9. Dashboard: verify all 5 summary cards show correct data.
  10. Role test: note which routes work and which are blocked for CASHIER and STORE_KEEPER.
  Report all bugs found with the page and action where they occur.

  ---
  STEP 27 — CLAUDE: Fix bugs from testing

  Read CLAUDE.md. Fix all bugs identified in the Step 26 test report. After fixing each one, describe what was wrong and what was changed.

  ---
  PHASE 9 — DEPLOYMENT

  ---
  STEP 28 — MANUAL: Push to GitHub and deploy on Vercel

  1. Initialize git in your project: git init
  2. Commit all files: git add . && git commit -m "Initial commit"
  3. Push to your GitHub repository
  4. Go to https://vercel.com → Add New Project → import your GitHub repo
  5. In the Environment Variables section, add all variables from your .env.local file
  6. Click Deploy — Vercel will build and deploy automatically
  7. Once deployed, go to your Vercel URL and test the login

  ---
  STEP 29 — CLAUDE: Vercel deployment fixes (if needed)

  Read CLAUDE.md. The app has been deployed to Vercel but there are build or runtime errors. Run npm run build locally and fix all issues. Common issues to
  check: missing 'use client' or 'use server' directives, Server Actions called from Client Components without proper wiring, Supabase SSR cookie handling in
  middleware, environment variables used server-side that are not prefixed with NEXT_PUBLIC_, dynamic rendering errors on static pages. Fix all errors until
  the deployed app works correctly end-to-end.

  ---
  Summary

  ┌──────────────────────┬───────┬──────────────────────────────────────────────────┐
  │        Phase         │ Steps │                 What gets built                  │
  ├──────────────────────┼───────┼──────────────────────────────────────────────────┤
  │ 0 — Before You Start │ 1–3   │ Folder, Supabase project, GitHub repo            │
  ├──────────────────────┼───────┼──────────────────────────────────────────────────┤
  │ 1 — Project Setup    │ 4–8   │ Next.js scaffold, SQL database, admin user       │
  ├──────────────────────┼───────┼──────────────────────────────────────────────────┤
  │ 2 — Auth & Layout    │ 9–11  │ Login, middleware, sidebar, top nav              │
  ├──────────────────────┼───────┼──────────────────────────────────────────────────┤
  │ 3 — Core Inventory   │ 12–14 │ Categories, suppliers, products                  │
  ├──────────────────────┼───────┼──────────────────────────────────────────────────┤
  │ 4 — Transactions     │ 15–20 │ Customers, GRN, POS, stock adjustments           │
  ├──────────────────────┼───────┼──────────────────────────────────────────────────┤
  │ 5 — Reports          │ 21–22 │ Dashboard, daily/monthly/top/low-stock reports   │
  ├──────────────────────┼───────┼──────────────────────────────────────────────────┤
  │ 6 — Admin            │ 23    │ User management, change password                 │
  ├──────────────────────┼───────┼──────────────────────────────────────────────────┤
  │ 7 — Polish           │ 24–25 │ Skeletons, empty states, pagination, build check │
  ├──────────────────────┼───────┼──────────────────────────────────────────────────┤
  │ 8 — Testing          │ 26–27 │ Full end-to-end test and bug fixes               │
  ├──────────────────────┼───────┼──────────────────────────────────────────────────┤
  │ 9 — Deployment       │ 28–29 │ Vercel deploy and fixes                          │
  └──────────────────────┴───────┴──────────────────────────────────────────────────┘

  Total: 29 steps. 20 are Claude Code prompts, 9 are manual steps you do yourself.

  Start with Step 1 and go in order. Each prompt builds on the previous one, so don't skip steps. When you're ready to begin, just create the new folder and
  paste Step 4 into Claude Code.




waNhxczFIaxfGxBo