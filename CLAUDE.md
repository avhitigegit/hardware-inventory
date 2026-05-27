# Hardware Shop Inventory Management System
## Full-Stack Next.js 14 + Supabase — Project Guide

---

## Project Overview

A full-stack inventory management web application for small and medium hardware shops in Sri Lanka.
Single Next.js 14 project — no separate backend server. Supabase handles the database, auth, storage, and real-time.

**Target users:** Hardware shop staff across 4 roles — ADMIN, OWNER, CASHIER, STORE_KEEPER

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack — UI + Server Actions as API |
| Language | TypeScript | Type safety across the entire app |
| Database | Supabase (PostgreSQL) | All data storage, triggers, functions |
| Auth | Supabase Auth | Login, session management, JWT |
| Authorization | Supabase RLS (Row Level Security) | Role-based data access at DB level |
| Storage | Supabase Storage | Product images, receipt uploads |
| UI | Tailwind CSS + shadcn/ui | Styling and pre-built accessible components |
| Data Fetching | Supabase JS SDK + React Query | Typed DB access + client-side caching |
| Forms | react-hook-form + Zod | Form state management + validation |
| PDF | React-PDF | Invoice, receipt, GRN printouts |
| Charts | Recharts | Dashboard sales and stock charts |
| Deployment | Vercel | Hosting, env vars, preview deployments |

---

## User Roles

| Role | Access |
|---|---|
| `ADMIN` | Full system access — users, all data, delete operations |
| `OWNER` | Products, suppliers, customers, GRN, sales, all reports |
| `CASHIER` | POS billing, customers, view products |
| `STORE_KEEPER` | GRN (stock receiving), products, stock adjustments |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Sidebar + top nav, session guard
│   │   ├── page.tsx                    # Dashboard (redirect to /dashboard)
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Summary cards + charts
│   │   ├── products/
│   │   │   ├── page.tsx               # Product list + search + low stock badge
│   │   │   └── [id]/page.tsx          # Product detail / edit
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   ├── suppliers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx          # Supplier detail + payment history
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx          # Customer detail + credit + payment history
│   │   ├── purchases/                 # GRN — Goods Received Note
│   │   │   ├── page.tsx               # GRN list
│   │   │   ├── new/page.tsx           # Create new GRN
│   │   │   └── [id]/page.tsx          # GRN detail + printable view
│   │   ├── sales/                     # POS — Point of Sale
│   │   │   ├── page.tsx               # Sales history
│   │   │   ├── pos/page.tsx           # POS terminal / billing screen
│   │   │   └── [id]/page.tsx          # Sale detail + printable receipt
│   │   ├── stock-adjustments/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   ├── daily/page.tsx
│   │   │   ├── monthly/page.tsx
│   │   │   └── top-products/page.tsx
│   │   └── users/                     # ADMIN only
│   │       └── page.tsx
│   ├── api/
│   │   └── receipts/
│   │       └── [id]/route.ts          # PDF generation endpoint for printing
│   └── layout.tsx                     # Root layout, fonts, providers
├── actions/                           # All Server Actions (replaces REST controllers)
│   ├── auth.actions.ts
│   ├── categories.actions.ts
│   ├── customers.actions.ts
│   ├── products.actions.ts
│   ├── purchases.actions.ts
│   ├── reports.actions.ts
│   ├── sales.actions.ts
│   ├── stock-adjustments.actions.ts
│   ├── suppliers.actions.ts
│   └── users.actions.ts
├── components/
│   ├── ui/                            # shadcn/ui auto-generated components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   └── RoleGuard.tsx              # Client component to hide UI by role
│   ├── products/
│   ├── sales/
│   ├── purchases/
│   ├── reports/
│   │   ├── DashboardCards.tsx
│   │   ├── SalesChart.tsx
│   │   └── LowStockTable.tsx
│   └── pdf/
│       ├── SaleReceipt.tsx            # React-PDF receipt template
│       └── GrnDocument.tsx            # React-PDF GRN template
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser Supabase client
│   │   ├── server.ts                  # Server Supabase client (Server Actions/RSC)
│   │   └── middleware.ts              # Auth session refresh helper
│   ├── validations/                   # Zod schemas (one per feature)
│   │   ├── product.schema.ts
│   │   ├── sale.schema.ts
│   │   ├── purchase.schema.ts
│   │   └── ...
│   └── utils.ts                       # Shared helpers (formatCurrency, etc.)
├── hooks/                             # React Query hooks
│   ├── useProducts.ts
│   ├── useSales.ts
│   └── ...
├── types/
│   └── database.types.ts              # Auto-generated Supabase types (supabase gen types)
└── middleware.ts                      # Next.js middleware — session + route protection
```

---

## Database Schema

All tables in Supabase (PostgreSQL). Generate TypeScript types with:
```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.types.ts
```

### Core Tables

```sql
-- Extends auth.users — one row per Supabase auth user
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
```

### Database Triggers (stock auto-update)

```sql
-- Auto-increment stock when a purchase_item is inserted
CREATE OR REPLACE FUNCTION increment_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.product_id;
  -- If supplier paid on credit, increase their credit balance
  UPDATE suppliers SET credit_balance = credit_balance + (
    SELECT total_amount FROM purchases WHERE id = NEW.purchase_id
  ) WHERE id = (SELECT supplier_id FROM purchases WHERE id = NEW.purchase_id)
  AND (SELECT payment_type FROM purchases WHERE id = NEW.purchase_id) = 'CREDIT';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-decrement stock when a sale_item is inserted
CREATE OR REPLACE FUNCTION decrement_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update customer credit balance on credit sale
CREATE OR REPLACE FUNCTION update_customer_credit_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_type = 'CREDIT' AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers SET credit_balance = credit_balance + NEW.balance_amount
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Row Level Security (RLS) Policies

Enable RLS on all tables. Core patterns:

```sql
-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Example: only ADMIN/OWNER can delete products
CREATE POLICY "admin_owner_delete_products" ON products
  FOR DELETE USING (get_user_role() IN ('ADMIN', 'OWNER'));

-- Example: any authenticated user can read products
CREATE POLICY "authenticated_read_products" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Example: ADMIN only can manage users
CREATE POLICY "admin_manage_users" ON users
  FOR ALL USING (get_user_role() = 'ADMIN');
```

Apply similar policies to all tables matching the role access rules below.

---

## Role Access Rules (maps from original Spring Security config)

| Feature | Read | Create | Update | Delete |
|---|---|---|---|---|
| Categories | Any authenticated | ADMIN, OWNER | ADMIN, OWNER | ADMIN, OWNER |
| Suppliers | Any authenticated | ADMIN, OWNER | ADMIN, OWNER | ADMIN only |
| Customers | Any authenticated | ADMIN, OWNER, CASHIER | ADMIN, OWNER, CASHIER | ADMIN, OWNER |
| Products | Any authenticated | ADMIN, OWNER, STORE_KEEPER | ADMIN, OWNER, STORE_KEEPER | ADMIN, OWNER |
| Purchases (GRN) | Any authenticated | ADMIN, OWNER, STORE_KEEPER | — | — |
| Sales (POS) | Any authenticated | ADMIN, OWNER, CASHIER | — | — |
| Stock Adjustments | Any authenticated | ADMIN, OWNER, STORE_KEEPER | — | — |
| Reports / Dashboard | ADMIN, OWNER | — | — | — |
| Users | ADMIN only | ADMIN only | ADMIN only | — |

---

## Server Actions (replaces all REST API controllers)

Location: `src/actions/` — one file per domain. All actions use the server Supabase client.

### Auth (`auth.actions.ts`)
```typescript
signIn(email: string, password: string)         // → redirect to dashboard
signOut()                                        // → redirect to login
getCurrentUser()                                 // → User | null
```

### Products (`products.actions.ts`)
```typescript
getProducts(filters?: { search?: string; categoryId?: number; lowStock?: boolean; page?: number })
getProductById(id: number)
getProductByBarcode(barcode: string)            // For POS barcode scan
createProduct(data: ProductCreateInput)
updateProduct(id: number, data: ProductUpdateInput)
deleteProduct(id: number)
```

### Categories (`categories.actions.ts`)
```typescript
getCategories()
createCategory(data: CategoryInput)
updateCategory(id: number, data: CategoryInput)
deleteCategory(id: number)
```

### Suppliers (`suppliers.actions.ts`)
```typescript
getSuppliers()
getSupplierById(id: number)
createSupplier(data: SupplierInput)
updateSupplier(id: number, data: SupplierInput)
deleteSupplier(id: number)
recordSupplierPayment(id: number, amount: number, notes?: string)
```

### Customers (`customers.actions.ts`)
```typescript
getCustomers()
getCreditCustomers()                            // customers with credit_balance > 0
getCustomerById(id: number)
createCustomer(data: CustomerInput)
updateCustomer(id: number, data: CustomerInput)
recordCustomerPayment(id: number, amount: number, notes?: string)
```

### Purchases / GRN (`purchases.actions.ts`)
```typescript
getPurchases(filters?: { supplierId?: number; page?: number })
getPurchaseById(id: number)
createPurchase(data: PurchaseInput)             // triggers stock increment via DB trigger
```

### Sales / POS (`sales.actions.ts`)
```typescript
getSales(filters?: { customerId?: number; startDate?: string; endDate?: string; page?: number })
getSaleById(id: number)
createSale(data: SaleInput)                     // triggers stock decrement via DB trigger
getSalesReport(startDate: string, endDate: string)
```

### Stock Adjustments (`stock-adjustments.actions.ts`)
```typescript
getStockAdjustments(filters?: { productId?: number; page?: number })
createStockAdjustment(data: StockAdjustmentInput)
```

### Reports (`reports.actions.ts`)
```typescript
getDashboardSummary()     // total sales today, total products, low stock count, credit outstanding
getDailyReport(date: string)
getMonthlyReport(year: number, month: number)
getLowStockProducts()
getTopSellingProducts(limit?: number)
```

### Users (`users.actions.ts`)
```typescript
getUsers()
updateUserRole(id: string, role: UserRole)
toggleUserStatus(id: string)
changePassword(newPassword: string)
```

---

## Supabase Storage Buckets

| Bucket | Purpose | Access |
|---|---|---|
| `product-images` | Product photos | Authenticated read, ADMIN/OWNER/STORE_KEEPER write |
| `receipts` | Generated PDF receipts | Authenticated read, system write |

---

## Authentication Flow

1. User visits any protected route → `middleware.ts` checks Supabase session
2. No session → redirect to `/login`
3. Login page calls `signIn()` Server Action → Supabase Auth validates
4. Session stored in HTTP-only cookie by Supabase SSR helpers
5. `users` table row is fetched to get `role` — stored in session/context
6. `RoleGuard` component on client hides/shows UI elements by role
7. RLS policies on Supabase enforce the same rules at the database level

---

## Key Patterns & Conventions

### Supabase Clients
- **Server components / Server Actions:** use `createServerClient` from `@supabase/ssr`
- **Client components:** use `createBrowserClient` from `@supabase/ssr`
- Never expose the `service_role` key — only use `anon` key on the client

### Form Handling
```typescript
// All forms use react-hook-form + zod
const form = useForm<ProductInput>({ resolver: zodResolver(productSchema) })

// Server Actions return typed results
type ActionResult<T> = { data: T; error: null } | { data: null; error: string }
```

### React Query Setup
```typescript
// Wrap all client fetches in React Query for caching
const { data: products } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => getProducts(filters),
})
```

### Currency
- All monetary values stored as `NUMERIC(12,2)` in database
- Display using `formatCurrency(amount)` utility → `Rs. 1,250.00`
- Never do math with displayed strings — always use raw numbers from DB

### PDF Generation
- Use `react-pdf` for `SaleReceipt` and `GrnDocument` components
- Render as `<PDFDownloadLink>` for save, `<PDFViewer>` for print preview
- Receipt must include: shop name, date, cashier name, items table, totals, payment type

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only (never NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Development Roadmap

### Phase 1 — Foundation (Week 1)
- [ ] Create Next.js 14 project with TypeScript
- [ ] Install and configure: Tailwind CSS, shadcn/ui, Supabase SSR
- [ ] Set up Supabase project — create all tables, triggers, RLS policies
- [ ] Implement auth flow: login page, middleware, session management
- [ ] Create dashboard layout: sidebar, top nav, role-based menu

### Phase 2 — Core Inventory (Week 2)
- [ ] Categories — list, create, edit, delete
- [ ] Suppliers — list, create, edit, delete, credit balance display
- [ ] Products — list with search/filter, create, edit, delete, image upload
- [ ] Low stock alert badge on sidebar

### Phase 3 — Transactions (Week 3)
- [ ] Customers — list, create, edit, credit balance
- [ ] GRN / Purchases — create new GRN with line items, view GRN list and detail
- [ ] POS / Sales — billing screen with barcode lookup, line items, payment type
- [ ] Stock Adjustments — manual adjustment with reason

### Phase 4 — Reports & PDF (Week 4)
- [ ] Dashboard — summary cards (today's sales, total products, low stock, credit)
- [ ] Sales chart (daily/monthly) using Recharts
- [ ] Daily and monthly reports tables
- [ ] Top-selling products
- [ ] Sale receipt PDF with React-PDF
- [ ] GRN printable document with React-PDF

### Phase 5 — Admin & Polish (Week 5)
- [ ] User management (ADMIN only) — list users, change role, activate/deactivate
- [ ] Customer payment recording — reduce credit balance
- [ ] Supplier payment recording — reduce credit balance
- [ ] Pagination on all list pages (products, sales, purchases)
- [ ] Toast notifications for all actions
- [ ] Loading skeletons for all data tables

### Phase 6 — Production
- [ ] Deploy to Vercel — set environment variables
- [ ] Configure Supabase production project
- [ ] Create default ADMIN user via Supabase dashboard
- [ ] Test all flows end-to-end

---

## Default Admin User

Create manually in Supabase dashboard (Authentication → Users → Invite user), then insert into `users` table:
```sql
INSERT INTO users (id, full_name, email, role, is_active)
VALUES ('<auth-user-uuid>', 'Administrator', 'admin@shop.com', 'ADMIN', true);
```

---

## Commands Reference

```bash
# Start dev server
npm run dev

# Generate Supabase TypeScript types
npx supabase gen types typescript --project-id <id> > src/types/database.types.ts

# Add shadcn/ui component
npx shadcn@latest add <component-name>

# Build for production
npm run build
```

---

## Package Installation

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install recharts
npm install @react-pdf/renderer

npx shadcn@latest init
npx shadcn@latest add button input table dialog form select badge card skeleton toast
```

---

## Business Workflows

This section is the source of truth for all screen logic, data flow, and validation. Every feature must follow the steps described here exactly.

---

### 1. Authentication Workflows

#### Login (any role)
- URL: `/login` — public, no auth required. No "Register" link — only ADMIN creates users.
- Fields: Email, Password
- On submit:
  1. Call `signIn(email, password)` → Supabase Auth validates
  2. If credentials invalid → error: "Invalid email or password"
  3. Fetch `users` row for the logged-in auth UID
  4. If `is_active = false` → sign them out immediately, show error: "Your account has been deactivated. Contact the administrator."
  5. If success → redirect by role:
     - ADMIN → `/dashboard`
     - OWNER → `/dashboard`
     - CASHIER → `/sales/pos`
     - STORE_KEEPER → `/purchases`

#### Logout
- Click "Logout" in top nav or sidebar footer
- Call `signOut()` → clears Supabase session cookie
- Redirect to `/login` — no confirmation dialog

#### Session Expiry
- On expiry, `middleware.ts` detects no valid session → redirect to `/login`
- Show toast on login page: "Your session has expired. Please log in again."

#### Change Password
- Available to all logged-in users via: Top Nav → Profile → Change Password
- Fields: New Password, Confirm New Password (min 8 characters, must match)
- Calls Supabase Auth `updateUser({ password })` via Server Action

---

### 2. Navigation & Sidebar by Role

Sidebar items are conditionally rendered by role. CASHIER and STORE_KEEPER never see menu items outside their scope — no 403 page, simply not rendered.

| Menu Item | ADMIN | OWNER | CASHIER | STORE_KEEPER |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ❌ | ❌ |
| Products | ✅ | ✅ | ✅ view only | ✅ |
| Categories | ✅ | ✅ | ❌ | ❌ |
| Suppliers | ✅ | ✅ | ❌ | ❌ |
| Customers | ✅ | ✅ | ✅ | ❌ |
| Purchases / GRN | ✅ | ✅ | ❌ | ✅ |
| Sales / POS | ✅ | ✅ | ✅ | ❌ |
| Stock Adjustments | ✅ | ✅ | ❌ | ✅ |
| Reports | ✅ | ✅ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ | ❌ |

**Sidebar footer:** shows logged-in user's full name and role badge.

**Low stock badge:** Products menu item shows a red count badge when any product has `stock_quantity <= reorder_level`. Clicking opens Products page pre-filtered to low stock.

---

### 3. Dashboard (ADMIN, OWNER only)

**Summary cards (top row):**
| Card | Data |
|---|---|
| Today's Sales | Count of sales today + total revenue (Rs.) |
| Total Products | Count of active products (`is_active = true`) |
| Low Stock Alert | Count where `stock_quantity <= reorder_level` — clicking navigates to Products filtered by low stock |
| Customer Credit Outstanding | Sum of all `customers.credit_balance` |
| Supplier Credit Outstanding | Sum of all `suppliers.credit_balance` |

**Below cards:**
- Sales chart: bar chart of daily sales revenue for the last 30 days (Recharts)
- Low stock table: top 10 products sorted by `stock_quantity` ascending — shows product name, SKU, current stock, reorder level, supplier name

---

### 4. Product Management

#### Product List (`/products`)
- Table columns: Name, SKU, Barcode, Category, Unit, Stock Qty, Selling Price, Status
- Low stock rows (`stock_quantity <= reorder_level`): amber row highlight
- Out of stock rows (`stock_quantity = 0`): red row highlight
- Search bar: filter by product name or SKU (debounced, server-side)
- Category filter dropdown
- Toggle: "Low stock only"
- "Add Product" button — visible to ADMIN, OWNER, STORE_KEEPER
- Edit button — visible to ADMIN, OWNER, STORE_KEEPER
- Delete button — visible to ADMIN, OWNER only

#### Create Product form fields:
| Field | Required | Notes |
|---|---|---|
| Name | Yes | |
| SKU | Yes | Unique — validate on blur |
| Barcode | No | Unique if provided |
| Category | Yes | Dropdown from categories |
| Supplier | No | Dropdown from suppliers |
| Unit | Yes | PCS / KG / MTR / LTR / BOX / PACK (default: PCS) |
| Buying Price | Yes | Must be > 0 |
| Selling Price | Yes | Must be > 0. Warn (don't block) if < buying price |
| Reorder Level | Yes | Default 5 |
| Initial Stock Qty | Yes on Create | Not shown on Edit — stock changes only via GRN or adjustment |
| Description | No | |
| Image | No | Upload to Supabase Storage `product-images` bucket |

#### Delete Product
- Confirmation dialog required
- BLOCKED if product has any `sale_items` or `purchase_items` → error: "Cannot delete a product with transaction history. Deactivate it instead (set status to Inactive)."
- Soft delete alternative: set `is_active = false`

---

### 5. Category Management (`/categories`)

- Inline management — add/edit via dialog, no separate page
- Table: Name, Description, Product Count
- Delete: confirmation dialog
- Delete BLOCKED if any products are assigned to that category → error: "Cannot delete a category that has products. Reassign or delete those products first."

---

### 6. Supplier Management

#### Supplier List (`/suppliers`)
- Table: Name, Contact Person, Phone, Email, Credit Balance
- Credit balance > 0: shown in amber text
- "Add Supplier" button

#### Supplier Detail (`/suppliers/[id]`)
- Editable supplier info at top
- **Credit Balance card**: amount currently owed to this supplier
- **"Record Payment" button** (opens dialog):
  - Amount field (required; max = current `credit_balance` — validate, cannot overpay)
  - Notes field (optional)
  - On submit: call `recordSupplierPayment(id, amount, notes)` → decrements `credit_balance`, inserts `supplier_payments` row
  - Success toast: "Payment of Rs. X recorded for [supplier name]"
- **Tabs below:**
  - Purchase History: all GRNs from this supplier (date, GRN#, invoice#, total, payment type)
  - Payment History: all payments made to this supplier (date, amount, notes, recorded by)

#### Delete Supplier
- ADMIN only
- BLOCKED if any purchases reference this supplier → error: "Cannot delete a supplier with purchase history."

---

### 7. Customer Management

#### Customer List (`/customers`)
- Table: Name, Phone, Email, Credit Limit, Credit Balance
- Filter: "Credit customers only" (where `credit_balance > 0`)
- Credit balance > 0: amber text
- "Add Customer" button (ADMIN, OWNER, CASHIER)

#### Customer Detail (`/customers/[id]`)
- Editable customer info at top
- **Credit Balance card**: amount currently owed by this customer
- **Credit Limit card**: maximum credit allowed (0 = no limit enforced)
- **"Record Payment" button** (opens dialog):
  - Amount field (required; max = current `credit_balance` — cannot overpay)
  - Notes (optional)
  - On submit: `recordCustomerPayment(id, amount, notes)` → decrements `credit_balance`, inserts `customer_payments` row
  - Success toast: "Payment of Rs. X received from [customer name]"
- **Tabs:**
  - Sales History: all sales linked to this customer
  - Payment History: all payments received from this customer

---

### 8. GRN / Purchase Workflow

GRNs record stock arriving from a supplier. Once created, they cannot be edited or deleted — they are permanent records.

#### GRN List (`/purchases`)
- Table: Date, Supplier, Invoice#, Items, Total Amount, Payment Type, Created By
- "New GRN" button (ADMIN, OWNER, STORE_KEEPER)

#### Create New GRN (`/purchases/new`) — step by step:

1. **Supplier** (required — searchable dropdown)
2. **Invoice Number** (optional — supplier's delivery note/invoice reference)
3. **Payment Type**: CASH or CREDIT
   - CASH: supplier paid at delivery, no credit balance change
   - CREDIT: will owe supplier — `suppliers.credit_balance` increases by total amount on submit
4. **Notes** (optional)
5. **Line Items** (minimum 1 required):
   - Product (searchable dropdown — shows name + SKU + current stock)
   - Quantity (positive integer, required)
   - Unit Price (required — auto-fills with product's `buying_price`, cashier can edit)
   - Line Total (read-only — qty × unit price, auto-calculated)
   - "Add Row" button to add another line item
   - Remove (×) button per row
6. **Grand Total**: auto-calculated from all line items (read-only)
7. **"Submit GRN"** button:
   - Validate: supplier selected, at least 1 item, all qtys > 0, all prices > 0
   - Insert `purchases` row
   - Insert all `purchase_items` rows
   - DB trigger fires: `stock_quantity += quantity` for each product
   - If CREDIT: DB trigger fires: `suppliers.credit_balance += total_amount`
   - Redirect to `/purchases/[id]`
   - Toast: "GRN created. Stock updated for [N] products."

#### GRN Detail (`/purchases/[id]`)
- All fields read-only
- Shows: supplier, date, invoice#, payment type, notes, line items table, grand total, created by + timestamp
- "Print GRN" button → opens React-PDF `GrnDocument`

---

### 9. POS / Sale Workflow

The POS screen is the primary screen for CASHIER. It must be fast — keyboard-first, minimal clicks.

#### POS Terminal (`/sales/pos`)

**Screen layout — two panels:**

**Left panel — Cart:**
- List of added items: product name | qty (editable) | unit price (editable for ADMIN/OWNER, read-only for CASHIER) | line total | remove (×)
- Running total at bottom
- Empty state text: "Scan a barcode or search for a product to start"

**Right panel — Add Products:**
- **Barcode input field**: auto-focused on page load and after every item added (supports USB barcode scanner)
  - On barcode scan/enter: call `getProductByBarcode(barcode)` → add to cart (if already in cart, increment qty by 1)
  - If barcode not found → error toast: "Product not found for barcode [X]"
  - If product is inactive → error: "This product is not available for sale"
- **Product name search**: text input → dropdown results → click to add to cart

**Payment panel (bottom):**
- **Customer** field (optional for CASH, required for CREDIT — searchable dropdown)
- **Payment Type**: radio/toggle — CASH or CREDIT

  **If CASH:**
  - "Amount Received" input (number)
  - "Change" display: auto-calculated = Amount Received − Total. Shows 0 if amount < total.
  - Submit blocked if Amount Received < Total Amount

  **If CREDIT:**
  - Customer becomes required (show inline error if not selected)
  - No "Amount Received" field
  - `balance_amount = total_amount` (entire amount is credit)

- **"Complete Sale" button**

**On "Complete Sale" — validation sequence:**
1. Cart must not be empty
2. For each cart item: `stock_quantity >= requested_quantity`
   - If any fail → error: "Insufficient stock for [product name]. In stock: X, Requested: Y"
   - User must reduce qty or remove item before proceeding
3. If CREDIT: customer must be selected
4. If CREDIT and customer has `credit_limit > 0`: check `credit_balance + total_amount <= credit_limit`
   - If exceeded → error: "Credit limit exceeded for [customer name]. Available credit: Rs. X"
5. If CASH: amount_received >= total_amount
6. All validations pass → insert `sales` and `sale_items` rows
7. DB trigger: `stock_quantity -= quantity` for each item
8. If CREDIT: DB trigger: `customers.credit_balance += balance_amount`

**Post-sale screen (same page, cart replaced):**
- Receipt summary: sale ID, items, total, payment info
- **"Print Receipt"** button → React-PDF `SaleReceipt`
- **Change amount** (CASH): displayed prominently — e.g., "Change: Rs. 150.00"
- **"New Sale"** button → clears everything, re-focuses barcode field

#### Sale History (`/sales`)
- Table: Date/Time, Customer (or "Walk-in"), Total, Payment Type, Cashier
- Filters: date range, customer, payment type
- Sales are read-only once created — no edit, no delete, no void in v1

#### Sale Detail (`/sales/[id]`)
- Read-only view: all details + line items
- "Print Receipt" button

---

### 10. Stock Adjustment Workflow

Used for: damaged goods, expired items, stock count corrections, theft, opening balance entry.

#### Stock Adjustment Page (`/stock-adjustments`)
- Table: Date, Product, Type, Qty, Reason, Done By
- "New Adjustment" button opens dialog:
  - **Product** (searchable dropdown — shows name + current stock qty)
  - **Type**: ADD or SUBTRACT
    - ADD: increases `stock_quantity` (e.g., found extra units, customer return)
    - SUBTRACT: decreases `stock_quantity` (e.g., damaged, expired)
  - **Quantity** (positive integer, required)
    - If SUBTRACT: validate qty ≤ current `stock_quantity` → error: "Cannot subtract [X]. Only [Y] units in stock."
  - **Reason** (required, free text, minimum 5 characters)
- On submit: insert `stock_adjustments` row, update `products.stock_quantity`
- Adjustments are immutable — no edit, no delete

---

### 11. Reports (ADMIN, OWNER only)

#### Daily Report (`/reports/daily`)
- Default date: today. Date picker to change.
- Summary cards: Total Sales Count, Total Revenue, Cash Revenue, Credit Revenue
- Table: Sale Time | Customer | Cashier | Items | Total | Payment Type
- "Export PDF" button

#### Monthly Report (`/reports/monthly`)
- Default: current month + year. Month/year pickers to change.
- Summary cards: Total Sales, Total Revenue, Average Daily Revenue
- Bar chart: daily revenue for selected month (Recharts)
- Table: Date | Sales Count | Cash Total | Credit Total | Daily Total
- "Export PDF" button

#### Top Products Report (`/reports/top-products`)
- Date range filter (default: current month)
- Table: Rank | Product Name | SKU | Qty Sold | Revenue
- Bar chart: top 10 products by quantity sold

#### Low Stock Report
- Accessible from Dashboard card or sidebar Reports submenu
- Table: Product Name | SKU | Category | Current Stock | Reorder Level | Supplier
- Sorted by current stock ascending (most urgent first)
- "Export PDF" button

---

### 12. User Management (ADMIN only)

#### User List (`/users`)
- Table: Full Name, Email, Role, Status (Active/Inactive), Created At
- "Invite User" button
- Inline role change (dropdown) and activate/deactivate toggle per row
- ADMIN cannot deactivate themselves

#### Create User Flow:
1. ADMIN clicks "Invite User"
2. Form: Full Name, Email, Role (required)
3. On submit:
   - Call Supabase Auth `admin.createUser({ email, password: tempPassword, email_confirm: true })`
   - Insert row into `users` table: `{ id: authUser.id, full_name, email, role, is_active: true }`
   - OR use Supabase invite email flow: user receives invite link to set own password
4. New user appears in table with "Active" status

#### Change User Role
- Opens dialog: "Change role for [name]"
- Role dropdown (cannot set own role to non-ADMIN if last ADMIN)

#### Deactivate User
- Sets `is_active = false`
- On their next request, middleware fetches `users` row → detects inactive → signs them out → redirect to `/login` with message: "Your account has been deactivated."
- ADMIN cannot deactivate themselves

---

### 13. Complete Business Rules & Constraints

Enforced at Server Action level (not just UI validation):

#### Stock
- Sale BLOCKED if any `requested_quantity > stock_quantity`
- Stock adjustment SUBTRACT BLOCKED if `quantity > stock_quantity`
- `stock_quantity` must never go negative — enforce before DB write

#### Credit
- Credit sale REQUIRES `customer_id` — blocked without it
- If `customer.credit_limit > 0`: block if `credit_balance + total > credit_limit`
- If `credit_limit = 0`: no limit enforced (unlimited credit)
- Customer payment: amount must be > 0 and ≤ `credit_balance`
- Supplier payment: amount must be > 0 and ≤ `credit_balance`

#### Products
- SKU: unique — validated before insert/update
- Barcode: unique if provided — validated before insert/update
- `buying_price` and `selling_price`: must be > 0
- If `selling_price < buying_price`: warn but allow
- Hard delete blocked if product has `sale_items` or `purchase_items` — must soft delete

#### Categories
- Name must be unique
- Delete blocked if products exist in the category

#### Suppliers
- Delete blocked if any purchases reference the supplier

#### Users
- ADMIN cannot deactivate themselves
- System must always have at least 1 active ADMIN
- ADMIN cannot change their own role if they are the only ADMIN

#### GRN / Sales
- GRN minimum 1 line item
- Sale minimum 1 cart item
- All quantities: positive integers only
- Both GRNs and Sales: immutable after creation

---

### 14. Receipt & Document Content (React-PDF)

**Sale Receipt (`SaleReceipt.tsx`) must include:**
- Shop name + address (from `NEXT_PUBLIC_SHOP_NAME`, `NEXT_PUBLIC_SHOP_ADDRESS`)
- Receipt number: `REC-` + zero-padded sale ID (e.g., `REC-000045`)
- Date and time of sale (Sri Lanka time, format: `DD/MM/YYYY HH:MM`)
- Cashier full name
- Customer name (or "Walk-in Customer")
- Line items table: Product Name | Qty | Unit Price | Line Total
- Subtotal, Total Amount
- Payment Type
- If CASH: Amount Received, Change
- If CREDIT: "On Credit" label with customer name

**GRN Document (`GrnDocument.tsx`) must include:**
- Shop name + address
- GRN number: `GRN-` + zero-padded purchase ID (e.g., `GRN-000012`)
- Date and time
- Supplier name + contact info
- Invoice number (if any)
- Line items table: Product Name | Unit | Qty | Unit Price | Line Total
- Grand Total, Payment Type
- Received By (user full name)

---

### 15. Global UI Behavior

- **Currency**: all amounts in LKR (Sri Lankan Rupee). Display format: `Rs. 1,250.00`. Never show raw decimals to users.
- **Timezone**: store UTC in Supabase. Display in Asia/Colombo (UTC+5:30) everywhere.
- **Pagination**: all list tables paginate at 20 rows per page. Show total count.
- **Toasts**: success (green) for create/update/delete/payment. Error (red) for validation failures and rejected actions.
- **Confirm dialogs**: required for all delete operations and user deactivation.
- **Loading skeletons**: shown on all tables while data loads — never show empty tables without skeleton.
- **POS barcode field**: re-focus automatically after each item added. Supports USB barcode scanner (fires Enter after scan).
- **Shop config env vars**: `NEXT_PUBLIC_SHOP_NAME`, `NEXT_PUBLIC_SHOP_ADDRESS`, `NEXT_PUBLIC_SHOP_PHONE` — used in PDF headers.
- **No returns/refunds in v1**: sales and GRNs are final. A future phase can add a returns module.
