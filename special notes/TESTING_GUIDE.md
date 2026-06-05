# Lahiru Hardware — Application Testing Guide

A complete business-level test checklist. Work through each section in order — some tests depend on data created in earlier steps.

**Before you start:** Make sure the dev server is running (`npm run dev`) and open the app at `http://localhost:3000`.

---

## 1. Login & Authentication

### 1.1 — Sign In as Admin
1. Go to `http://localhost:3000`
2. Enter your ADMIN email and password
3. Click **Sign In**
- **Expect:** Redirected to the Dashboard page

### 1.2 — Wrong Password
1. Go to `/login`
2. Enter a correct email but wrong password
3. Click **Sign In**
- **Expect:** Red error message — "Invalid email or password"

### 1.3 — Forgot Password (Password Recovery)
1. Go to `/login`
2. Click **Forgot password?** link at the bottom
3. Enter your email address
4. Click **Send Reset Link**
- **Expect:** Green message saying the reset link was sent
5. Check your email inbox, click the reset link
- **Expect:** Taken to the Reset Password page
6. Enter a new password (min 8 characters) and confirm it
7. Click **Update Password**
- **Expect:** Success message, then redirected back to login after 2 seconds

### 1.4 — Change Password (while logged in)
1. Log in as any user
2. Click your name/avatar in the top-right corner
3. Click **Change Password**
4. Enter a new password and confirm it
5. Click **Save Password**
- **Expect:** Green toast — "Password changed successfully"

### 1.5 — Logout
1. Click your name/avatar in the top-right corner
2. Click **Logout**
- **Expect:** Redirected to the login page

---

## 2. User Management (ADMIN only)

### 2.1 — View All Users
1. Log in as ADMIN
2. Click **Users** in the left sidebar
- **Expect:** Table showing all staff accounts with name, email, role, and status

### 2.2 — Invite a New Cashier
1. On the Users page, click **+ Invite User**
2. Fill in:
   - Full Name: `Kasun Perera`
   - Email: any valid email
   - Role: `CASHIER`
3. Click **Create Account**
- **Expect:** Success dialog showing a temporary password — note it down
4. Click **Done**
- **Expect:** New user appears in the table

### 2.3 — Invite a Store Keeper
1. Click **+ Invite User** again
2. Fill in:
   - Full Name: `Nimal Jayasinghe`
   - Email: another email
   - Role: `STORE_KEEPER`
3. Click **Create Account**
- **Expect:** Temporary password shown

### 2.4 — Change a User's Role
1. On the Users page, find Kasun Perera
2. Click the role badge/dropdown and change it from **CASHIER** to **OWNER**
- **Expect:** Green toast — "Role updated"

### 2.5 — Deactivate a User
1. Find Nimal Jayasinghe in the table
2. Click the green **Active** badge next to their name
- **Expect:** Badge turns to **Inactive** with a grey colour, success toast shown

### 2.6 — Try to Deactivate Yourself
1. Find your own account in the table (marked with "you")
2. The status button should be disabled (greyed out)
- **Expect:** Cannot click it — the system prevents self-deactivation

### 2.7 — Test Role-Based Login (Cashier)
1. Log out
2. Log in using Kasun Perera's email and the temp password
- **Expect:** Redirected straight to the **POS Terminal** (`/sales/pos`)
3. Check the sidebar — only POS, Sales, Customers, Products should be visible
- **Expect:** Dashboard, Reports, Users are NOT in the sidebar

---

## 3. Categories

### 3.1 — Add a Category
1. Log in as ADMIN or OWNER
2. Click **Categories** in the sidebar
3. Click **Add Category**
4. Enter Name: `Power Tools` and a short description
5. Click **Save**
- **Expect:** Green toast — "Category created", appears in the table

### 3.2 — Add More Categories
Repeat for: `Hand Tools`, `Plumbing`, `Electrical`, `Hardware & Fasteners`

### 3.3 — Edit a Category
1. Click **Edit** next to `Power Tools`
2. Change the description
3. Click **Save**
- **Expect:** Green toast — "Category updated"

### 3.4 — Delete a Category (should be blocked later)
1. Try to delete `Hardware & Fasteners` (before adding any products to it)
2. Click **Delete** → confirm
- **Expect:** Green toast — "Category deleted"
- *(We will test the blocked delete after adding products)*

---

## 4. Suppliers

### 4.1 — Add a Supplier
1. Click **Suppliers** in the sidebar
2. Click **Add Supplier**
3. Fill in:
   - Name: `Lanka Tools Import`
   - Contact Person: `Suresh Fernando`
   - Phone: `0112345678`
   - Email: `suresh@lankatools.lk`
4. Click **Add Supplier**
- **Expect:** Green toast — "Supplier added"

### 4.2 — Add a Second Supplier
Add another supplier: `Ceylon Hardware Ltd` with any contact info.

### 4.3 — View Supplier Details
1. Click on **Lanka Tools Import** in the table
- **Expect:** Supplier detail page with credit balance, purchase history, and payment history tabs

### 4.4 — Edit Supplier Info
1. On the supplier detail page, update the phone number
2. Click **Save Changes**
- **Expect:** Green toast — "Supplier updated"

---

## 5. Products

### 5.1 — Add a Product
1. Click **Products** in the sidebar
2. Click **Add Product**
3. Fill in:
   - Name: `Makita Drill 750W`
   - SKU: `MKT-DRILL-750`
   - Category: `Power Tools`
   - Supplier: `Lanka Tools Import`
   - Unit: `PCS`
   - Buying Price: `12500`
   - Selling Price: `15000`
   - Reorder Level: `3`
   - Initial Stock: `10`
4. Click **Create Product**
- **Expect:** Green toast — "Product created", redirected to the product detail page

### 5.2 — Add More Products
Add at least 3 more products with different categories. Include at least one with a very low initial stock (e.g. 1 or 2) to test the low-stock alert.

Example:
| Name | SKU | Category | Buying | Selling | Stock |
|---|---|---|---|---|---|
| Stanley Hammer | STN-HMR-500G | Hand Tools | 850 | 1200 | 15 |
| PVC Pipe 1/2" | PVC-PIPE-HLF | Plumbing | 120 | 180 | 2 |
| Wire 2.5mm (per m) | WR-2.5MM | Electrical | 45 | 75 | 100 |

### 5.3 — Search for a Product
1. On the Products page, type `Makita` in the search box
- **Expect:** Only Makita Drill appears in the table

### 5.4 — Filter by Category
1. Clear the search, then select `Plumbing` from the category dropdown
- **Expect:** Only plumbing products shown

### 5.5 — Low Stock Filter
1. Click **Low Stock Only** toggle
- **Expect:** Only products at or below their reorder level are shown (e.g. PVC Pipe with 2 units)

### 5.6 — Check Low Stock Badge in Sidebar
- Look at the **Products** menu item in the sidebar
- **Expect:** A red number badge showing the count of low-stock products

### 5.7 — Edit a Product
1. Click **Edit** on any product
2. Change the selling price
3. Click **Update Product**
- **Expect:** Green toast — "Product updated"

### 5.8 — Try Duplicate SKU
1. Click **Add Product**
2. Enter the same SKU as an existing product (e.g. `MKT-DRILL-750`)
- **Expect:** Error message — "SKU already exists"

### 5.9 — Delete a Product (with no sales history)
1. Add a temporary product: Name `Test Delete`, SKU `TEST-DEL-001`, stock 1
2. Go back to products list, find it and click **Delete**
3. Confirm in the dialog
- **Expect:** Green toast — "Product deleted"

### 5.10 — Try to Delete a Product with Transaction History
*(Do this after completing a sale in Section 7)*
1. Try to delete a product that was sold
2. Click **Delete** and confirm
- **Expect:** Error — "Cannot delete a product with transaction history. Deactivate it instead."

---

## 6. Customers

### 6.1 — Add a Customer
1. Click **Customers** in the sidebar
2. Click **Add Customer**
3. Fill in:
   - Name: `Chaminda Construction`
   - Phone: `0771234567`
   - Email: `chaminda@construct.lk`
   - Credit Limit: `50000`
4. Click **Add Customer**
- **Expect:** Green toast — "Customer added"

### 6.2 — Add a Walk-in Customer Placeholder
Add another customer named `Walk-in Customer` with no credit limit (0).

### 6.3 — Add a Customer with Low Credit Limit (for credit limit testing)
- Name: `Small Shop Owner`
- Credit Limit: `5000`

### 6.4 — View Customer Details
1. Click on **Chaminda Construction**
- **Expect:** Customer detail page showing credit balance (Rs. 0.00), credit limit (Rs. 50,000.00)

---

## 7. Purchases / GRN (Stock Receiving)

### 7.1 — Create a Cash GRN
1. Click **Purchases / GRN** in the sidebar
2. Click **New GRN**
3. Select Supplier: `Lanka Tools Import`
4. Payment Type: **CASH**
5. Add line items:
   - Product: `Makita Drill 750W`, Qty: `5`, Unit Price: `12500`
6. Check the grand total is calculated automatically
7. Click **Submit GRN**
- **Expect:** Green toast, redirected to GRN detail page showing `GRN-000001` (or similar)
8. Go to Products and check Makita Drill stock — should now be **15** (was 10, added 5)

### 7.2 — Create a Credit GRN
1. Click **New GRN**
2. Select Supplier: `Ceylon Hardware Ltd`
3. Payment Type: **CREDIT**
4. Add items:
   - Product: `Stanley Hammer`, Qty: `10`, Unit Price: `850`
   - Product: `PVC Pipe 1/2"`, Qty: `50`, Unit Price: `120`
5. Submit the GRN
- **Expect:** Success. Go to Suppliers → `Ceylon Hardware Ltd` detail page — credit balance should now show the total amount owed.

### 7.3 — Print a GRN
1. Go to Purchases list, click on any GRN
2. Click **Print GRN**
- **Expect:** A PDF downloads with the GRN details, shop name, supplier info, and line items

---

## 8. Sales / POS Terminal

### 8.1 — Complete a Cash Sale (Barcode Scan)
1. Click **Sales / POS** in the sidebar
2. The barcode field should be auto-focused
3. Type the SKU of a product (e.g. `MKT-DRILL-750`) and press **Enter** (simulates a barcode scan)
- **Expect:** Product added to the cart on the left
4. Type the same SKU again and press **Enter**
- **Expect:** Quantity increases to 2 (not a duplicate row)
5. Select **CASH** payment type
6. Enter Amount Received: `35000`
- **Expect:** Change shows `Rs. 5,000.00`
7. Click **Complete Sale**
- **Expect:** Sale complete screen showing receipt summary and change amount
8. Check stock — Makita Drill should be reduced by 2

### 8.2 — Print a Receipt
1. After the sale above, click **Print Receipt**
- **Expect:** PDF downloads with receipt number (REC-XXXXXX), items, total, cashier name

### 8.3 — Start a New Sale
1. Click **New Sale**
- **Expect:** Cart clears, barcode field is re-focused and ready

### 8.4 — Complete a Credit Sale
1. Start a new sale
2. Search for `Stanley Hammer` by name in the product search
3. Add it to the cart, qty 2
4. Select **CREDIT** payment type
5. Select Customer: `Chaminda Construction`
6. Click **Complete Sale**
- **Expect:** Sale complete. Go to Customers → Chaminda Construction — credit balance should now show the amount owed.

### 8.5 — Block: Credit Sale without a Customer
1. Start a new sale with any item
2. Select **CREDIT**
3. Do NOT select a customer
4. Click **Complete Sale**
- **Expect:** Error — "Customer is required for credit sales"

### 8.6 — Block: Insufficient Stock
1. Start a new sale
2. Add a product that has only 1 unit in stock
3. Change the quantity to 10
4. Click **Complete Sale**
- **Expect:** Error — "Insufficient stock for [product]. In stock: 1, Requested: 10"

### 8.7 — Block: Credit Limit Exceeded
1. Start a new sale
2. Add expensive items totalling more than Rs. 5,000
3. Select **CREDIT**, customer: `Small Shop Owner` (credit limit Rs. 5,000)
4. Click **Complete Sale**
- **Expect:** Error — "Credit limit exceeded for Small Shop Owner. Available credit: Rs. X"

### 8.8 — Block: Cash Amount Too Low
1. Start a new sale totalling Rs. 3,000
2. Select **CASH**, enter Amount Received: `2000`
3. Click **Complete Sale**
- **Expect:** The Complete Sale button should be disabled (or error shown)

---

## 9. Supplier & Customer Payments (Credit Settlement)

### 9.1 — Record Payment to Supplier
1. Go to **Suppliers** → click **Ceylon Hardware Ltd**
2. The credit balance should show money owed (from the credit GRN)
3. Click **Record Payment**
4. Enter Amount: half of the credit balance
5. Add Notes: `Partial payment - cheque no. 1234`
6. Click **Record Payment**
- **Expect:** Green toast — "Payment recorded", credit balance reduced by that amount

### 9.2 — Try to Overpay a Supplier
1. Click **Record Payment** again
2. Enter an amount greater than the remaining credit balance
- **Expect:** Error — "Amount exceeds credit balance"

### 9.3 — Record Payment from Customer
1. Go to **Customers** → click **Chaminda Construction**
2. Credit balance should show the amount from the credit sale
3. Click **Record Payment**
4. Enter the full amount
5. Click **Record Payment**
- **Expect:** Green toast — "Payment received", credit balance drops to Rs. 0.00

### 9.4 — View Payment History
1. On the Chaminda Construction detail page
2. Click the **Payment History** tab
- **Expect:** The payment just recorded appears in the list

---

## 10. Stock Adjustments

### 10.1 — Add Stock (e.g. found extra units)
1. Click **Stock Adjustments** in the sidebar
2. Click **New Adjustment**
3. Select Product: `PVC Pipe 1/2"`
4. Type: **ADD**
5. Quantity: `10`
6. Reason: `Found extra units in storage area`
7. Click **Submit**
- **Expect:** Green toast — "Stock adjustment recorded", product stock increases by 10

### 10.2 — Subtract Stock (e.g. damaged goods)
1. Click **New Adjustment**
2. Select a product, Type: **SUBTRACT**, Qty: `2`
3. Reason: `Damaged during delivery`
4. Click **Submit**
- **Expect:** Stock reduced by 2

### 10.3 — Block: Subtract More than Available Stock
1. Click **New Adjustment**
2. Select a product with 5 units, Type: **SUBTRACT**, Qty: `20`
- **Expect:** Red error message appears below the quantity field — "Cannot subtract 20. Only 5 units in stock."
3. The **Submit** button should be disabled

---

## 11. Dashboard

### 11.1 — View Summary Cards
1. Click **Dashboard** in the sidebar (ADMIN or OWNER only)
- **Expect:** 5 cards showing:
  - Today's Revenue (with sale count)
  - Active Products count
  - Low Stock Alert count (clickable)
  - Customer Credit Outstanding (total unpaid credit)
  - Supplier Credit Outstanding (total owed to suppliers)

### 11.2 — Click Low Stock Alert Card
1. Click the **Low Stock Alert** card
- **Expect:** Navigated to the Low Stock report page

### 11.3 — View the Sales Chart
- **Expect:** Bar chart showing daily revenue for the last 30 days (bars on days you made sales)

### 11.4 — View Low Stock Table on Dashboard
- **Expect:** Bottom of the dashboard shows the top 10 lowest-stock products with amber/red highlights

---

## 12. Reports (ADMIN & OWNER only)

### 12.1 — Daily Report
1. Click **Reports** → **Daily Report** in the sidebar
2. The report defaults to today's date
- **Expect:** Summary cards showing today's sales count, total revenue, cash and credit breakdown
3. Click a past date where you made sales
- **Expect:** Data updates for that date
4. Click **Export PDF**
- **Expect:** PDF downloads with the day's sales table

### 12.2 — Monthly Report
1. Click **Reports** → **Monthly Report**
- **Expect:** Summary cards for the current month, bar chart of daily revenue, table of each day
2. Change the month/year selectors
- **Expect:** Data refreshes for the selected period
3. Click **Export PDF**
- **Expect:** Monthly PDF downloads

### 12.3 — Top Products Report
1. Click **Reports** → **Top Products**
- **Expect:** Ranked table and bar chart showing products by quantity sold
2. Change the date range and click **Apply**
- **Expect:** Data refreshes

### 12.4 — Low Stock Report
1. Click **Reports** → **Low Stock**
- **Expect:** Full table of all products at or below their reorder level, sorted by lowest stock first
2. Click **Export PDF**
- **Expect:** PDF downloads with the low stock list

---

## 13. Role-Based Access Restrictions

### 13.1 — CASHIER cannot access Dashboard
1. Log in as the Cashier user (Kasun Perera)
- **Expect:** Redirected directly to POS Terminal, no Dashboard in sidebar

### 13.2 — CASHIER cannot access Reports
1. Manually type `/reports/daily` in the browser address bar
- **Expect:** Redirected away (to dashboard or login)

### 13.3 — Non-ADMIN cannot access Users page
1. While logged in as OWNER or CASHIER
2. Type `/users` in the browser address bar
- **Expect:** Redirected to Dashboard

### 13.4 — STORE_KEEPER access
1. Log in as the Store Keeper (Nimal Jayasinghe — if still active)
- **Expect:** Redirected to Purchases / GRN page, sidebar shows only: Products, Purchases/GRN, Stock Adjustments

### 13.5 — Deactivated User Cannot Login
1. Log in as ADMIN, go to Users, deactivate any test user
2. Log out and try to log in as that deactivated user
- **Expect:** Shown an error — account is deactivated

---

## 14. Delete Restrictions (Business Rules)

### 14.1 — Cannot Delete a Category that Has Products
1. Log in as ADMIN, go to Categories
2. Try to delete `Power Tools` (it has the Makita Drill in it)
3. Confirm in the dialog
- **Expect:** Error — "Cannot delete a category that has products"

### 14.2 — Cannot Delete a Supplier with Purchase History
1. Go to Suppliers → try to delete `Lanka Tools Import`
- **Expect:** Error — "Cannot delete a supplier with purchase history"

### 14.3 — Cannot Delete a Product with Sales History
1. Go to Products → try to delete the Makita Drill (which was sold)
- **Expect:** Error — "Cannot delete a product with transaction history. Deactivate it instead."

---

## 15. Pagination

### 15.1 — Test Pagination on Products
1. Add more than 20 products total
2. Go to the Products page
- **Expect:** "Page 1 of 2 — 21 products" at the bottom with **Previous** and **Next** buttons
3. Click **Next** to go to page 2

### 15.2 — Test Pagination on Sales
1. After making many sales (or check the total count)
- **Expect:** Pagination bar shows total sales count

---

## 16. Quick Sanity Checks

| # | Check | Where | Expected |
|---|---|---|---|
| 1 | All money amounts show "Rs. X,XXX.XX" | Everywhere | ✅ Correct format |
| 2 | All dates show in Sri Lanka time (not UTC) | All tables | ✅ Colombo time |
| 3 | Sidebar highlights the current page | All pages | ✅ Active item highlighted |
| 4 | Skeleton rows shown while data loads | All tables | ✅ Grey placeholders |
| 5 | 404 page looks clean | Type any wrong URL | ✅ "Page not found" page |
| 6 | Barcode field auto-focuses after each item added | POS terminal | ✅ Ready for next scan |

---

## Test Data Summary

Use this as a quick reference for data created during testing:

| Type | Name / SKU | Notes |
|---|---|---|
| Category | Power Tools, Hand Tools, Plumbing, Electrical | Core categories |
| Supplier | Lanka Tools Import | Cash purchase done |
| Supplier | Ceylon Hardware Ltd | Credit purchase done |
| Product | Makita Drill — `MKT-DRILL-750` | Sold in test sales |
| Product | Stanley Hammer — `STN-HMR-500G` | Sold on credit |
| Product | PVC Pipe — `PVC-PIPE-HLF` | Stock adjusted |
| Customer | Chaminda Construction | Credit limit Rs. 50,000 |
| Customer | Small Shop Owner | Credit limit Rs. 5,000 (for block test) |
| User | Kasun Perera | CASHIER role |
| User | Nimal Jayasinghe | STORE_KEEPER role |
