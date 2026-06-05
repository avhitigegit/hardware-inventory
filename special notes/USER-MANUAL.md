# Hardware Inventory Management System
## User Manual

**Version:** 1.0  
**Prepared for:** Shop Owner & Staff  
**Last Updated:** June 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [User Roles — Who Can Do What](#2-user-roles)
3. [Getting Started — Login & Logout](#3-getting-started)
4. [Changing Your Password](#4-changing-your-password)
5. [Dashboard](#5-dashboard)
6. [Products](#6-products)
7. [Categories](#7-categories)
8. [Suppliers](#8-suppliers)
9. [Customers](#9-customers)
10. [Purchases / GRN (Receiving Stock)](#10-purchases--grn)
11. [Sales / POS (Billing Customers)](#11-sales--pos)
12. [Returns](#12-returns)
13. [Stock Adjustments](#13-stock-adjustments)
14. [Reports](#14-reports)
15. [User Management (Admin Only)](#15-user-management)
16. [Quick Reference](#16-quick-reference)

---

## 1. Introduction

This system helps you manage your hardware shop inventory, billing, and reports from any computer or phone with an internet connection. All data is saved to the cloud automatically — no need to worry about backups.

**What you can do with this system:**

- Add and manage all your products with stock levels
- Receive stock from suppliers (GRN)
- Bill customers at the counter (POS)
- Track customer and supplier credit balances
- Process customer returns
- View daily and monthly sales reports
- Know which products are running low on stock

**Web Address (URL):** Your system is accessible at the link provided by your administrator.

---

## 2. User Roles

The system has 4 types of staff accounts. Each role sees only the screens they need.

| Role | What They Can Do |
|---|---|
| **ADMIN** | Everything — full access including managing staff accounts |
| **OWNER** | Everything except managing staff accounts |
| **CASHIER** | Billing (POS), customers, returns |
| **STORE KEEPER** | Receiving stock (GRN), products, stock adjustments |

### What each role sees in the menu:

| Menu Item | ADMIN | OWNER | CASHIER | STORE KEEPER |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | — | — |
| Products | ✅ | ✅ | ✅ view only | ✅ |
| Categories | ✅ | ✅ | — | — |
| Suppliers | ✅ | ✅ | — | — |
| Customers | ✅ | ✅ | ✅ | — |
| Purchases / GRN | ✅ | ✅ | — | ✅ |
| Sales / POS | ✅ | ✅ | ✅ | — |
| Returns | ✅ | ✅ | ✅ | — |
| Stock Adjustments | ✅ | ✅ | — | ✅ |
| Reports | ✅ | ✅ | — | — |
| Users | ✅ | — | — | — |

> **Note:** If a menu item is not listed above for your role, it will not appear in your sidebar at all — you will not see a "blocked" or "access denied" message, it simply will not show.

---

## 3. Getting Started

### 3.1 Logging In

1. Open the web address in your browser (Chrome or Edge recommended)
2. You will see the login page with your shop name at the top
3. Enter your **Email Address** and **Password**
4. Click **Sign In**

After login, you are automatically taken to the correct screen for your role:
- **Admin / Owner** → Dashboard
- **Cashier** → POS (billing screen)
- **Store Keeper** → Purchases / GRN

> **If you see "Invalid email or password":** Check that Caps Lock is not on and try again. If you still cannot log in, ask your administrator to reset your password.

> **If you see "Your account has been deactivated":** Contact your administrator — your account has been disabled.

### 3.2 Logging Out

Click your name at the **bottom of the left sidebar** — you will see a Logout option. Or look for the logout button in the top navigation bar.

You are returned to the login page immediately. No confirmation is asked.

### 3.3 Forgot Password

1. On the login page, click **"Forgot password?"**
2. Enter your email address and click **Send Reset Link**
3. Check your email inbox for a reset link
4. Click the link in the email — it will open the system and ask for a new password
5. Enter your new password (minimum 8 characters) and confirm it
6. Click **Update Password** — you are redirected to login

---

## 4. Changing Your Password

You can change your password at any time after logging in.

1. Click your name or the profile icon in the **top navigation bar**
2. Select **Change Password**
3. Enter your new password (minimum 8 characters)
4. Enter it again to confirm
5. Click **Update Password**

> **Important:** After changing your password, you will be logged out and need to sign in again with the new password.

---

## 5. Dashboard

**Who can see this:** Admin, Owner only

The Dashboard is your shop's overview screen. It updates automatically every minute.

### 5.1 Summary Cards (top row)

| Card | What it shows |
|---|---|
| **Today's Revenue** | Total money from all sales today (Rs.) and number of sales |
| **Active Products** | How many products are currently in your system and active |
| **Low Stock Alert** | Number of products that are at or below their reorder level — shown in amber if any exist. Click it to see the full list. |
| **Customer Credit** | Total amount currently owed to you by all credit customers combined |
| **Supplier Credit** | Total amount you currently owe to all suppliers combined |

### 5.2 Sales Chart

A bar chart showing your daily revenue for the **last 30 days**. Each bar is one day. Hover over any bar to see the exact amount for that day.

### 5.3 Low Stock Table

Shows up to 10 products that need restocking, sorted by most urgent first:
- **Red row** = completely out of stock (0 units)
- **Amber row** = stock at or below the reorder level

Click **"View all →"** to see the full low stock report.

---

## 6. Products

**Who can see this:** All roles  
**Who can add/edit:** Admin, Owner, Store Keeper  
**Who can delete:** Admin, Owner only

### 6.1 Viewing the Product List

Go to **Products** in the left menu. You will see a table of all products with:
- Name, SKU (product code), Barcode
- Category, Unit of measure
- Current stock quantity
- Selling price
- Status (Active / Inactive)

**Colour coding:**
- **Red row** = out of stock
- **Amber row** = low stock (at or below reorder level)

**Filtering and searching:**
- Type in the **search bar** to find products by name or SKU
- Use the **Category** dropdown to show only one category
- Tick **"Low stock only"** to show only products that need restocking

### 6.2 Adding a New Product

1. Click **"Add Product"** (top right)
2. Fill in the form:

| Field | Required | Notes |
|---|---|---|
| Name | Yes | Full product name |
| SKU | Yes | Your unique product code (e.g. `SCR-3IN-BOX`) |
| Barcode | No | If the product has a barcode on the packaging |
| Category | Yes | Select from your category list |
| Supplier | No | Main supplier for this product |
| Unit | Yes | PCS, KG, MTR, LTR, BOX, or PACK |
| Buying Price | Yes | What you pay the supplier (Rs.) |
| Selling Price | Yes | What you charge customers (Rs.) |
| Reorder Level | Yes | When stock falls to this number, a low-stock alert appears (default: 5) |
| Initial Stock Qty | Yes | How many units you currently have |
| Description | No | Optional notes about the product |
| Image | No | Upload a photo |

3. Click **Save Product**

> **Note:** If the selling price is lower than the buying price, the system will warn you but still allow you to save.

### 6.3 Editing a Product

1. Find the product in the list and click **Edit** (pencil icon)
2. Change the fields you need
3. Click **Save**

> **Important:** You cannot change stock quantity from the edit form. Stock changes only happen through GRN (receiving stock from supplier) or Stock Adjustments. This is by design to keep accurate records.

### 6.4 Deactivating a Product

If a product is no longer sold but has transaction history, do not delete it — **deactivate** it instead:

1. Open the product → click Edit
2. Uncheck the **"Active"** toggle
3. Save

Inactive products will not appear in the POS search or barcode lookup.

### 6.5 Deleting a Product

1. Click the **Delete** button (trash icon) next to the product
2. Confirm in the dialog

> **Note:** If this product has been used in any past sale or GRN, the system will block the deletion and ask you to deactivate it instead. This protects your sales history.

### 6.6 Printing a Product Label

Each product has a **"Print Label"** button on its detail page (click the product name to open it).

1. Open a product by clicking its name
2. Click **"Print Label"** (top right)
3. A label preview opens in a new window and your browser's print dialog appears
4. Select your label printer and print

The label includes: shop name, product name, SKU, selling price, and barcode/SKU number.

---

## 7. Categories

**Who can use this:** Admin, Owner

Categories help you organise products (e.g. Power Tools, Plumbing, Electrical).

### 7.1 Viewing Categories

Go to **Categories** in the menu. You will see a table with category name, description, and how many products are in each.

### 7.2 Adding a Category

1. Click **"Add Category"**
2. Enter a name and optional description
3. Click Save

### 7.3 Editing a Category

Click the **Edit** button next to the category, change the details, and save.

### 7.4 Deleting a Category

Click **Delete**. The system will block deletion if any products are assigned to this category. You must reassign or delete those products first.

---

## 8. Suppliers

**Who can use this:** Admin, Owner  
**Who can delete:** Admin only

Suppliers are the companies or people you buy stock from.

### 8.1 Supplier List

Go to **Suppliers**. The table shows each supplier's name, contact, phone, email, and credit balance (what you owe them).

- **Amber text** on the credit balance means you currently owe that supplier money

### 8.2 Adding a Supplier

1. Click **"Add Supplier"**
2. Fill in the supplier's details (name is required, others are optional)
3. Save

### 8.3 Supplier Detail Page

Click a supplier's name to open their detail page. Here you can:

- **Edit** their contact information
- See their current **Credit Balance** (what you owe them)
- **Record a Payment** — when you pay a supplier, click this button

#### Recording a Supplier Payment

1. Click **"Record Payment"**
2. Enter the amount you are paying (cannot exceed what you owe)
3. Add a note (e.g. "Bank transfer 01/06/2026")
4. Click Submit

The credit balance reduces automatically.

#### Tabs on the Supplier Detail Page

- **Purchase History** — all GRNs from this supplier
- **Payment History** — all payments made to this supplier

---

## 9. Customers

**Who can use this:** Admin, Owner, Cashier

Customers are the people and businesses you sell to. You only need to add a customer if they buy on credit or you want to track their purchase history.

> Walk-in customers who pay cash do not need to be added.

### 9.1 Customer List

Go to **Customers**. The table shows name, phone, email, credit limit, and credit balance.

- **Amber text** on the credit balance means this customer owes you money
- Use the **"Credit customers only"** filter to see only customers with an outstanding balance

### 9.2 Adding a Customer

1. Click **"Add Customer"**
2. Fill in the details:

| Field | Notes |
|---|---|
| Name | Required |
| Phone | Optional |
| Email | Optional |
| Address | Optional |
| Credit Limit | Maximum credit you will give this customer. Enter **0** for no limit. |

3. Save

### 9.3 Customer Detail Page

Click a customer's name to open their page. Here you can:

- Edit their information
- See their **Credit Balance** (what they owe you)
- **Record a Payment** — when a credit customer pays you

#### Recording a Customer Payment

1. Click **"Record Payment"**
2. Enter the amount they are paying (cannot exceed what they owe you)
3. Add a note (e.g. "Cash payment received")
4. Submit

The credit balance reduces automatically.

#### Tabs on the Customer Detail Page

- **Sales History** — all sales linked to this customer
- **Payment History** — all payments received from this customer

---

## 10. Purchases / GRN

**Who can use this:** Admin, Owner, Store Keeper

GRN stands for **Goods Received Note**. You create a GRN every time stock arrives from a supplier. This is the only way stock quantities increase (other than manual adjustments).

> **Important:** Once a GRN is saved, it cannot be edited or deleted. It is a permanent record.

### 10.1 GRN List

Go to **Purchases / GRN**. The table shows all stock receivals with date, supplier, invoice number, total amount, and payment type.

### 10.2 Creating a New GRN

1. Click **"New GRN"**
2. Fill in the header:
   - **Supplier** — select from the list (required)
   - **Invoice Number** — the supplier's invoice/delivery note number (optional but recommended)
   - **Payment Type** — select CASH or CREDIT
     - **CASH** = you paid at delivery, nothing is owed to the supplier
     - **CREDIT** = you will pay later — the supplier's credit balance increases by this GRN total
   - **Notes** — optional

3. Add line items — click **"+ Add Item"** for each product received:
   - Select the **Product** from the dropdown
   - Enter the **Quantity** received (can be decimal, e.g. 5.5 for 5.5 kg)
   - Enter the **Unit Price** (auto-fills with the product's buying price — you can change it)
   - The line total calculates automatically

4. The **Grand Total** updates automatically as you add items

5. Click **"Submit GRN"**

After submitting:
- Stock quantities for all products increase automatically
- If payment type was CREDIT, the supplier's credit balance increases
- You are taken to the GRN detail page

### 10.3 Printing a GRN

On any GRN detail page, click **"Print GRN"** to generate a printable document showing all items received, quantities, prices, and totals.

---

## 11. Sales / POS

**Who can use this:** Admin, Owner, Cashier

The POS (Point of Sale) screen is used for billing customers at the counter.

### 11.1 POS Screen Layout

The screen is split into two panels:

- **Left panel** — the Cart (list of items being sold)
- **Right panel** — product search, discount, payment, and customer selection

### 11.2 Adding Products to Cart

**Method 1 — Barcode Scanner:**
- The barcode field is automatically focused when the screen loads
- Scan a barcode with a USB barcode scanner (or type a barcode and press Enter)
- The product is added to the cart instantly
- If the barcode is not found, an error message appears

**Method 2 — Name/SKU Search:**
- Type at least 2 characters in the **Product Search** box
- A dropdown list of matching products appears
- Click on the product to add it to the cart

When a product already in the cart is scanned again, the quantity increases by 1 automatically.

### 11.3 Editing the Cart

For each item in the cart you can:
- **Change quantity** — type in the Qty box (supports decimals, e.g. 0.5 for half a kg)
- **Change unit price** — only Admin and Owner can edit the price
- **Remove item** — click the × button

The cart total updates automatically.

### 11.4 Applying a Discount

In the **Discount (Rs.)** field, enter the discount amount in rupees.

- Example: Bill is Rs. 5,000. Enter 200 as discount. Customer pays Rs. 4,800.
- The discount is shown separately in the cart and on the receipt.

### 11.5 Selecting a Customer

- For **walk-in cash customers**, leave the Customer field as "Walk-in Customer"
- For **credit customers** or customers with an account, select their name from the dropdown

### 11.6 Payment Types

Select one of three payment types:

#### CASH
- Enter the **Amount Received** (how much cash the customer gives you)
- The **Change** amount calculates automatically
- You cannot complete the sale if the amount received is less than the total

#### CREDIT
- The entire amount goes on the customer's account
- **A customer must be selected** — you cannot do a credit sale to a walk-in customer
- If the customer has a credit limit and this sale would exceed it, the system blocks the sale

#### SPLIT (Part Cash, Part Credit)
- Customer pays some in cash, the rest goes on their credit account
- Enter the **Cash Amount** the customer is paying now
- The **On Credit** amount calculates automatically
- **A customer must be selected**

### 11.7 Completing the Sale

Click **"Complete Sale"**.

The system checks:
1. Cart is not empty
2. All items have enough stock
3. Customer is selected for credit/split sales
4. Cash amount is enough (for cash sales)
5. Credit limit is not exceeded

If any check fails, an error message appears. Fix the issue and try again.

### 11.8 After Sale — Receipt Screen

When the sale is completed, you see a summary showing:

- Receipt number (e.g. REC-000045)
- Customer name
- All items sold
- Subtotal, discount (if any), total
- Payment details (change for cash, credit amount for credit/split)

From here you can:
- **Download Receipt (PDF)** — generates a printable receipt
- **New Sale** — clears everything and starts the next transaction

### 11.9 Sales History

Go to **Sales / POS** → click the **Sales History** tab (or go to the Sales menu). All past sales are listed with date, customer, cashier, total, and payment type. Click any sale to view its full details and reprint the receipt.

---

## 12. Returns

**Who can use this:** Admin, Owner, Cashier

Use Returns when a customer brings back items they purchased.

> When a return is submitted, the returned products are automatically added back to stock.

### 12.1 Returns List

Go to **Returns** in the menu. All past returns are listed with date, customer, number of items, total amount, and return method.

### 12.2 Creating a New Return

1. Click **"New Return"**
2. Select the **Return Method**:

   | Method | When to use |
   |---|---|
   | **Cash Refund** | You are giving the customer cash back |
   | **Credit Adjustment** | The customer bought on credit — you are reducing what they owe you |

3. Select the **Customer** (required for Credit Adjustment, optional for Cash Refund)
4. Add a **Note** if needed (e.g. "Wrong size", "Damaged on delivery")
5. Add the returned items — click **"+ Add Item"** for each product:
   - Select the product
   - Enter the quantity being returned
   - Enter the price per unit (usually the original selling price)
6. Click **"Submit Return"**

After submitting:
- Stock is restored for each returned product
- For Credit Adjustment: the customer's credit balance is reduced by the return amount

---

## 13. Stock Adjustments

**Who can use this:** Admin, Owner, Store Keeper

Use Stock Adjustments to correct stock quantities for reasons other than a sale or GRN — for example: damaged goods, items found during stocktake, or theft.

> All adjustments are permanent records and cannot be edited after saving.

### 13.1 Viewing Adjustments

Go to **Stock Adjustments**. All past adjustments are listed with date, product, type, quantity, reason, and who recorded it.

### 13.2 Creating a New Adjustment

1. Click **"New Adjustment"**
2. Select the **Product** from the dropdown (shows current stock level)
3. Select the **Type**:
   - **ADD** — increases stock (e.g. found extra items in stocktake, customer return via adjustment)
   - **SUBTRACT** — decreases stock (e.g. damaged, expired, theft)
4. Enter the **Quantity** (supports decimals)
5. Enter the **Reason** (minimum 5 characters — be specific, e.g. "3 bags of cement damaged in flood")
6. Click **Submit**

> **Note:** If you try to SUBTRACT more than the current stock, the system will block it with an error message.

---

## 14. Reports

**Who can use this:** Admin, Owner only

### 14.1 Daily Report

Go to **Reports → Daily Report**.

- Shows all sales for a specific day
- Default is today — use the date picker to view any past date
- Summary cards show: total sales count, total revenue, cash revenue, credit revenue
- Table below shows each sale with time, customer, cashier, items, total, and payment type
- Click **"Export PDF"** to download a printable report for that day

### 14.2 Monthly Report

Go to **Reports → Monthly Report**.

- Shows sales summary for an entire month
- Default is the current month — use the month/year pickers to view past months
- Summary cards: total sales, total revenue, average daily revenue
- Bar chart showing revenue by day within the month
- Table showing each day's cash, credit, and total revenue
- Click **"Export PDF"** to download

### 14.3 Top Products Report

Go to **Reports → Top Products**.

- Select a date range (default: current month)
- Shows your best-selling products ranked by quantity sold
- Table: rank, product name, SKU, quantity sold, revenue
- Bar chart showing top 10 products visually

Use this report to decide what to stock more of and what is not selling.

### 14.4 Low Stock Report

Go to **Reports → Low Stock**.

- Shows all products where current stock is at or below the reorder level
- Sorted from most urgent (lowest stock) to least urgent
- Columns: product name, SKU, category, current stock, reorder level, supplier
- Click **"Export PDF"** to download a report to take when ordering from suppliers

### 14.5 Cash Summary (End of Day)

Go to **Reports → Cash Summary**.

This report tells you **how much cash should be in your drawer** at the end of the day.

| Section | What it shows |
|---|---|
| **Net Cash in Drawer** | The amount you should physically count in the till |
| **Cash Sales** | Total from all cash payments |
| **Split — Cash Portion** | Cash received from split payment sales |
| **Cash Refunds** | Cash given back to customers for returns (subtracted) |
| **Credit Sales** | Total on credit — this is NOT in the drawer |
| **Split — Credit Portion** | Credit portion of split sales — NOT in the drawer |
| **Total Revenue** | Everything combined |

**How to reconcile at end of day:**
1. Count the physical cash in your drawer
2. Compare with **Net Cash in Drawer** on this screen
3. They should match (minus your opening float)
4. Any difference should be investigated

---

## 15. User Management

**Who can use this:** Admin only

Go to **Users** in the menu.

### 15.1 Viewing Users

The table shows all staff accounts with their name, email, role, status, and when they were created.

### 15.2 Creating a New User Account

1. Click **"+ Invite User"**
2. Enter the staff member's:
   - **Full Name**
   - **Email Address**
   - **Role** (Admin, Owner, Cashier, or Store Keeper)
3. Click **Create Account**
4. A **temporary password** is shown — copy this and share it with the new staff member

The staff member should log in with this temporary password and change it immediately via **Change Password**.

### 15.3 Changing a User's Role

In the Users table, click the **coloured role badge** next to any user's name. A dropdown appears — select the new role. The change saves immediately.

> **Note:** You cannot change your own role if you are the only Admin in the system.

### 15.4 Activating / Deactivating a User

Click the **green Active** or **grey Inactive** button next to any user.

- **Deactivating** a user: they will be logged out on their next action and cannot log in again until reactivated
- **You cannot deactivate your own account**

---

## 16. Quick Reference

### Keyboard Tips for POS

| Action | How |
|---|---|
| Add product by barcode | The barcode field is auto-focused — just scan |
| Move to next field | Press Tab |
| Complete sale | Click "Complete Sale" button |

### Understanding Stock Colours

| Colour | Meaning |
|---|---|
| Red row / Red number | Out of stock — 0 units |
| Amber row / Amber number | Low stock — at or below reorder level |
| Normal | Sufficient stock |

### Understanding Credit

| Term | Meaning |
|---|---|
| **Customer Credit Balance** | Amount the customer owes you |
| **Customer Credit Limit** | Maximum credit you allow for this customer (0 = no limit) |
| **Supplier Credit Balance** | Amount you owe the supplier |

### Receipt Numbers

| Format | Example | Used for |
|---|---|---|
| REC-000001 | REC-000045 | Sale receipts |
| GRN-000001 | GRN-000012 | Goods received notes |
| RET-000001 | RET-000003 | Return records |

### Common Error Messages

| Message | What to do |
|---|---|
| "Invalid email or password" | Check caps lock, try again. Ask admin if still failing. |
| "Insufficient stock for [product]" | The item doesn't have enough stock. Reduce quantity or remove from cart. |
| "Credit limit exceeded" | Customer has reached their credit limit. Ask for cash or reduce the order. |
| "Customer is required for credit sales" | Select a customer from the dropdown before completing the sale. |
| "Cannot delete a product with transaction history" | Deactivate the product instead of deleting it. |

---

*For technical support or issues, contact your system administrator.*
