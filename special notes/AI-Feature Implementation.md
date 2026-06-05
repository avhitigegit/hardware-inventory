================================================================================
  NUVI ENGINEERING — INVENTORY MANAGEMENT SYSTEM
  AI FEATURE IMPLEMENTATION REFERENCE
================================================================================
  Version   : 2.0
  Project   : Hardware Inventory Management System (Next.js + Supabase)
  Prepared  : NUVI Engineering PVT LTD
  Contact   : info@nuvi.lk | 077 662 2922
================================================================================

  This document is the master AI feature development reference. Each feature
  includes business context, user stories, workflow, data sources, technology
  stack, implementation approach, API integration details, and acceptance
  criteria. Use this file to pick up any AI feature and begin development
  immediately.

  IMPORTANT: None of these features require changes to the core database schema
  designed for the base system. They read existing data and layer intelligence
  on top of it. They are additive — not disruptive.

================================================================================
  AI TECHNOLOGY STACK
================================================================================

  PRIMARY AI ENGINE
  -----------------
  Claude API (Anthropic)
    Model      : claude-sonnet-4-6 (latest capable model)
    SDK        : @anthropic-ai/sdk (npm package)
    Auth       : ANTHROPIC_API_KEY environment variable
    Use for    : All text generation, insights, chat assistant, summaries,
                 anomaly detection, business analysis

  VECTOR SEARCH (for Smart POS Search)
  -------------------------------------
  pgvector on Supabase
    Extension  : Already supported on Supabase Pro plan
    Use for    : Semantic product search at POS counter
    Alternative: Claude API embedding + cosine similarity (no extra extension)

  BACKGROUND JOBS
  ---------------
  Supabase Edge Functions
    Runtime    : Deno (TypeScript)
    Use for    : Daily AI jobs (fraud detection, reorder forecasting)
    Trigger    : Supabase Cron (pg_cron) or external cron

  MESSAGING
  ---------
  WhatsApp Business API (Meta Cloud API)
    Use for    : Automated supplier alerts when stock is critically low
    Alternative: wa.me deep link (no API key — simpler but manual send)

  ENVIRONMENT VARIABLES TO ADD
  ----------------------------
  ANTHROPIC_API_KEY=sk-ant-...
  WHATSAPP_ACCESS_TOKEN=...        (for WhatsApp Business API)
  WHATSAPP_PHONE_NUMBER_ID=...     (for WhatsApp Business API)

================================================================================
  AI FEATURE PRIORITY LEGEND
================================================================================

  [AI-01] through [AI-07] — ordered by business value and build complexity
  Each feature is independent — can be built in any order.

================================================================================
  EFFORT LEGEND
================================================================================

  XS = Half a day    (< 4 hours)
  S  = 1 day         (4–8 hours)
  M  = 2–3 days
  L  = 4–6 days
  XL = 7–14 days


================================================================================
================================================================================
  AI FEATURES — FULL IMPLEMENTATION REFERENCE
================================================================================
================================================================================


────────────────────────────────────────────────────────────────────────────────
  [AI-01]  AI BUSINESS INSIGHTS ON THE DASHBOARD
  Effort : M  |  API Cost : Very Low  |  Value : ★★★★★
────────────────────────────────────────────────────────────────────────────────

  BUSINESS CONTEXT
  ----------------
  The current dashboard shows numbers — revenue, sales count, low stock count,
  credit outstanding. But numbers alone do not tell the owner WHY things
  changed. A shop owner who sees "revenue down 18%" cannot act on that without
  knowing the cause. AI Insights translates raw numbers into plain English
  explanations with actionable recommendations, every time the owner logs in.

  EXAMPLE OUTPUT
  --------------
  "Your revenue this week is Rs. 82,400 — down 18% from last week (Rs. 100,500).
   The main reason: 4 of your top 10 products are currently out of stock, including
   PVC Pipe 1 inch and Angle Grinder 4 inch which together account for 22% of
   your weekly revenue. Restocking these two items could recover approximately
   Rs. 18,000 in weekly sales.

   Also note: Saturday continues to be your highest revenue day (Rs. 24,000 avg).
   Consider ensuring full stock and extra staff on Saturdays."

  USER STORIES
  ------------
  As an OWNER, when I open the dashboard, I want to see a plain English summary
  of how my business is performing and why, so I can take action without
  spending time analysing charts.

  As an OWNER, I want the AI insight to tell me specifically what is causing
  problems and what I should do about it, not just repeat the numbers I already
  see on the dashboard.

  DATA SOURCES USED
  -----------------
  - sales table         : today's revenue, this week's revenue, last week's revenue
  - sale_items table    : which products are selling and at what volume
  - products table      : which top products are currently out of stock / low stock
  - customers table     : total credit outstanding
  - purchases table     : recent purchasing activity

  WORKFLOW
  --------
  1. Owner loads dashboard (/dashboard)
  2. Server Action fetches dashboard summary data (already exists: getDashboardSummary)
  3. Server Action also calls getAIDashboardInsight(summaryData)
  4. getAIDashboardInsight() calls Claude API with a structured prompt
  5. Claude returns 2–4 sentences of plain English insight
  6. Insight is rendered in a highlighted card below the dashboard metrics
  7. A [Refresh Insight] button allows manual refresh
  8. Insight is cached for 30 minutes (avoid repeated API calls on page refresh)

  PROMPT DESIGN
  -------------
  System prompt:
    "You are a business advisor for a hardware shop in Sri Lanka. Analyse the
     provided business data and give 2-4 sentences of plain English insight.
     Focus on: what changed, why it changed, and one specific recommendation.
     Use Sri Lankan Rupees (Rs.) for amounts. Be direct and practical."

  User prompt (structured JSON of dashboard data):
    {
      "today_revenue": 45200,
      "week_revenue": 82400,
      "last_week_revenue": 100500,
      "low_stock_count": 8,
      "top_products_out_of_stock": ["PVC Pipe 1 inch", "Angle Grinder 4 inch"],
      "customer_credit_outstanding": 124500,
      "best_day_of_week": "Saturday",
      "avg_saturday_revenue": 24000
    }

  IMPLEMENTATION FILES
  --------------------
  src/actions/ai.actions.ts
    → getAIDashboardInsight(data: DashboardSummary): Promise<string>

  src/app/(dashboard)/dashboard/page.tsx
    → Add AI insight card component below metrics grid

  src/components/dashboard/AIInsightCard.tsx
    → Renders the AI insight text with loading skeleton
    → Shows timestamp ("Insight generated at 09:14 AM")
    → [Refresh] button

  CACHING STRATEGY
  ----------------
  Store insight text in Supabase (simple key-value or in a settings table)
  with a generated_at timestamp. If generated_at < 30 minutes ago, serve
  cached text without calling Claude API again. This keeps API costs near zero.

  ROLE ACCESS
  -----------
  OWNER and ADMIN only. CASHIER and STORE_KEEPER do not see the insight card.

  ACCEPTANCE CRITERIA
  -------------------
  [ ] AI insight card appears on dashboard for OWNER and ADMIN roles
  [ ] Insight is generated fresh on first load of the day
  [ ] Cached insight served if < 30 minutes old (no duplicate API calls)
  [ ] Insight mentions specific products, amounts, or trends from real data
  [ ] Loading skeleton shown while Claude API responds
  [ ] [Refresh Insight] button regenerates a fresh insight immediately
  [ ] If Claude API fails or times out, a graceful fallback message is shown
  [ ] No sensitive data (buying prices, profit margins) sent to Claude API


────────────────────────────────────────────────────────────────────────────────
  [AI-02]  SMART REORDER SUGGESTIONS (DEMAND FORECASTING)
  Effort : M  |  API Cost : Very Low  |  Value : ★★★★★
────────────────────────────────────────────────────────────────────────────────

  BUSINESS CONTEXT
  ----------------
  The current system has a static reorder_level per product — set once and
  never updated. A hardware shop's demand is seasonal and variable. Setting
  reorder levels manually means they quickly become wrong — too high for slow
  months (over-ordering, cash tied up) or too low for busy months (stockouts,
  lost sales). AI demand forecasting analyses the last 60 days of sales velocity
  per product and predicts how many days until stock runs out — then suggests
  the optimal reorder quantity.

  EXAMPLE OUTPUT (on Low Stock Report page)
  ------------------------------------------
  Product: 10mm Copper Pipe
  Current Stock : 45 units
  Avg Daily Sales : 11.2 units/day (last 60 days)
  Days Until Zero : ~4 days
  AI Suggestion   : "Order 150 units from Pettah Metals now.
                    At current sales rate this covers 13 days.
                    Consider increasing your reorder level to 80 units."

  Product: Sandpaper 80 Grit
  Current Stock : 320 units
  Avg Daily Sales : 1.8 units/day (last 60 days)
  Days Until Zero : ~178 days
  AI Suggestion   : "No action needed. Current stock covers ~6 months.
                    Consider reducing reorder level to 30 units to free up shelf space."

  USER STORIES
  ------------
  As an OWNER, I want AI to analyse my sales patterns and tell me which products
  will run out soon and exactly how many to order, so I never lose a sale due to
  stockout and never over-buy slow items.

  As a STORE_KEEPER, I want to see the AI reorder suggestions when I check the
  low stock list so I know exactly what to order from which supplier.

  DATA SOURCES USED
  -----------------
  - sale_items + sales  : last 60 days of quantity sold per product per day
  - products            : current stock_quantity, reorder_level, supplier_id
  - suppliers           : supplier name (for recommendation text)

  WORKFLOW
  --------
  1. A daily background job (Supabase Edge Function or cron) runs at 7:00 AM
  2. For each active product:
     a. Calculate avg_daily_sales = total_qty_sold_last_60_days / 60
     b. Calculate days_until_zero = current_stock / avg_daily_sales
     c. Calculate suggested_reorder_qty = avg_daily_sales × 30 (30-day buffer)
  3. Store results in reorder_suggestions table (see DB below)
  4. On Low Stock Report page: show AI suggestions alongside each low-stock item
  5. On Products page: show "AI Forecast" badge on products with < 7 days left

  ALGORITHM (no Claude API needed for calculation)
  ------------------------------------------------
  avg_daily_sales = SUM(quantity) FROM sale_items
                    JOIN sales ON sales.id = sale_items.sale_id
                    WHERE sales.created_at >= NOW() - INTERVAL '60 days'
                    AND sale_items.product_id = $1
                    GROUP BY sale_items.product_id
                    / 60

  days_until_zero = current_stock_quantity / avg_daily_sales
                    (NULL if avg_daily_sales = 0, product is not moving)

  suggested_qty = CEIL(avg_daily_sales × 30)   -- 30-day stock buffer
                  adjusted up to nearest sensible unit (×10 for small items)

  NOTE: Claude API is used only for the human-readable summary text.
        The calculations themselves are pure SQL — no AI cost for the math.

  DATABASE TABLE NEEDED
  ----------------------
  reorder_suggestions:
    id                  BIGSERIAL PRIMARY KEY
    product_id          BIGINT REFERENCES products(id)
    avg_daily_sales     NUMERIC(10,3)
    days_until_zero     NUMERIC(10,1)
    suggested_qty       NUMERIC(10,3)
    ai_note             TEXT        -- generated by Claude
    calculated_at       TIMESTAMPTZ DEFAULT NOW()

  IMPLEMENTATION FILES
  --------------------
  supabase/functions/daily-reorder-forecast/index.ts
    → Edge function: calculates all metrics, stores in reorder_suggestions
    → Calls Claude API for ai_note text per product (batched)

  src/actions/ai.actions.ts
    → getReorderSuggestions(): returns reorder_suggestions joined to products

  src/app/(dashboard)/reports/low-stock/page.tsx
    → Add AI suggestion column to the low stock table

  ACCEPTANCE CRITERIA
  -------------------
  [ ] Daily job calculates days_until_zero for all active products
  [ ] Products with days_until_zero < 7 shown with urgent badge on Low Stock page
  [ ] AI note text is product-specific (mentions product name, supplier, quantity)
  [ ] Products with no sales in 60 days show "Slow moving — review needed" note
  [ ] Suggested reorder qty is sensible (not 0, not unrealistically large)
  [ ] Results refresh daily (not on every page load — uses stored suggestions)
  [ ] OWNER and STORE_KEEPER can see suggestions; CASHIER cannot


────────────────────────────────────────────────────────────────────────────────
  [AI-03]  AI FRAUD & ANOMALY DETECTION
  Effort : M  |  API Cost : Very Low  |  Value : ★★★★
────────────────────────────────────────────────────────────────────────────────

  BUSINESS CONTEXT
  ----------------
  The audit log records every action in the system — but the owner would need
  to read hundreds of rows daily to spot suspicious activity. AI anomaly
  detection runs automatically at end of day, analyses patterns in the audit
  log and sales data, and surfaces only the events that look unusual. This
  catches cashier manipulation, after-hours changes, unusual return spikes, and
  price edits before they cause significant damage.

  EXAMPLE ALERTS GENERATED
  ------------------------
  "WARNING: Cashier Nimal processed 6 returns in 30 minutes (6:00–6:30 PM) —
   this is 4x higher than his average. Total refund value: Rs. 4,200.
   All returns were cash refunds with no linked customer. Review recommended."

  "NOTICE: Product price for Steel Rod 8mm was changed at 11:45 PM by user
   Kamal. The selling price was reduced from Rs. 280 to Rs. 180 (-36%).
   No other prices were changed at this time."

  "NOTICE: 3 stock adjustments were recorded by Store Keeper Priya in the
   last 48 hours totalling -85 units (SUBTRACT). This is higher than the
   monthly average of 12 units. Reasons given: 'damaged', 'damaged', 'damaged'."

  SUSPICIOUS PATTERNS DETECTED
  -----------------------------
  Pattern 1 — Return Spike
    Trigger : A single user processes > 3 returns in any 60-minute window
    Data    : returns table joined to users, filtered by created_at

  Pattern 2 — After-Hours Price Change
    Trigger : products UPDATE audit log entry between 8:00 PM and 7:00 AM
    Data    : audit_logs WHERE action='UPDATE' AND entity='product'
              AND EXTRACT(HOUR FROM created_at) NOT BETWEEN 7 AND 20

  Pattern 3 — Unusual Stock Reduction
    Trigger : stock_adjustments SUBTRACT total for one user in 7 days
              exceeds 3x their rolling monthly average
    Data    : stock_adjustments grouped by created_by, adjustment_type='SUBTRACT'

  Pattern 4 — High Discount Sales
    Trigger : discount_amount > 20% of total_amount on a single sale
    Data    : sales WHERE (discount_amount / total_amount) > 0.20

  Pattern 5 — Deleted Product with Sales History
    Trigger : audit_logs WHERE action='DELETE' AND entity='product'
    Data    : immediate alert — deleting a product with sales history
              is blocked by the system but a deactivation is flagged

  USER STORIES
  ------------
  As an OWNER, I want a daily alert showing any suspicious activity from the
  previous day so I can review it without reading the full audit log.

  As an ADMIN, I want to see anomaly alerts in a dedicated section so I can
  investigate and take action on each one.

  WORKFLOW
  --------
  1. Edge Function runs nightly at 11:00 PM (or on-demand from dashboard)
  2. Runs pattern queries against audit_logs, returns, stock_adjustments, sales
  3. For each anomaly found: builds a structured anomaly object
  4. Passes all anomalies to Claude API in one batch call
  5. Claude generates a human-readable summary for each
  6. Results stored in anomaly_alerts table
  7. Dashboard shows alert count badge if unreviewed alerts exist
  8. OWNER/ADMIN reviews alerts, marks each as Reviewed or Escalated

  DATABASE TABLE NEEDED
  ----------------------
  anomaly_alerts:
    id              BIGSERIAL PRIMARY KEY
    pattern_type    TEXT NOT NULL   -- RETURN_SPIKE, PRICE_CHANGE, etc.
    severity        TEXT CHECK (IN 'INFO','WARNING','CRITICAL')
    user_id         UUID REFERENCES users(id)   -- staff member flagged
    description     TEXT NOT NULL   -- AI-generated plain English summary
    raw_data        JSONB           -- the raw data that triggered the alert
    reviewed        BOOLEAN DEFAULT false
    reviewed_by     UUID REFERENCES users(id)
    reviewed_at     TIMESTAMPTZ
    created_at      TIMESTAMPTZ DEFAULT NOW()

  IMPLEMENTATION FILES
  --------------------
  supabase/functions/nightly-anomaly-scan/index.ts
    → Runs all 5 pattern queries
    → Passes results to Claude API for text generation
    → Inserts into anomaly_alerts

  src/actions/ai.actions.ts
    → getUnreviewedAlerts(): returns unreviewed anomaly_alerts
    → markAlertReviewed(id): marks alert as reviewed

  src/app/(dashboard)/anomaly-alerts/page.tsx
    → List of alerts with severity badge, description, [Mark Reviewed] button

  src/components/layout/Sidebar.tsx
    → Add "Alerts" menu item with red badge count for OWNER/ADMIN

  ACCEPTANCE CRITERIA
  -------------------
  [ ] Nightly scan runs automatically and stores results
  [ ] Each of the 5 patterns is detected correctly with test data
  [ ] AI-generated description is specific (names the user, product, amount)
  [ ] Dashboard shows red badge with unreviewed alert count
  [ ] OWNER and ADMIN can view and mark alerts as reviewed
  [ ] Reviewed alerts are archived, not deleted
  [ ] False positives can be dismissed without affecting audit log
  [ ] Alert page shows: severity, pattern type, user flagged, description, date


────────────────────────────────────────────────────────────────────────────────
  [AI-04]  AI CHAT ASSISTANT — ASK YOUR BUSINESS QUESTIONS
  Effort : L  |  API Cost : Low  |  Value : ★★★★★
────────────────────────────────────────────────────────────────────────────────

  BUSINESS CONTEXT
  ----------------
  Non-technical shop owners should not need to navigate multiple report pages to
  get a basic business answer. The AI Chat Assistant lets the owner type a
  question in plain English (or Sinhala) and get an instant, accurate answer
  directly from their live business data — no menu navigation required.
  This is the feature that most impresses business owners in a demo.

  EXAMPLE CONVERSATIONS
  ---------------------
  Owner: "What was my best selling product last month?"
  AI   : "Your best selling product in May 2026 was PVC Pipe 1 inch with
          340 units sold generating Rs. 68,000 in revenue — 8.2% of your
          total monthly sales."

  Owner: "How much credit is outstanding from customers?"
  AI   : "Total outstanding credit balance is Rs. 124,500 across 8 customers.
          The largest balance is Karunasena Hardware at Rs. 45,000 (overdue 47
          days), followed by City Builders at Rs. 32,000."

  Owner: "Which supplier do I owe the most to?"
  AI   : "You currently owe Rs. 28,400 to Lanka Tools Import. This has been
          outstanding for 38 days."

  Owner: "What products did Chaminda buy last month?"
  AI   : "Chaminda Construction made 3 purchases in May 2026 totalling Rs. 85,200.
          Items purchased: Angle Grinder (2 units), MS Re-bar 12mm (150 units),
          Safety Helmets (20 units), and GI Wire Nail 3 inch (40 kg)."

  Owner: "Which day of the week has the highest sales?"
  AI   : "Based on your last 90 days, Saturday generates the highest average
          daily revenue at Rs. 24,800. Tuesday is your slowest day at Rs. 8,400."

  USER STORIES
  ------------
  As an OWNER, I want to type any business question in plain language and get
  an accurate answer from my real business data, so I can make decisions without
  navigating multiple report pages.

  As a non-technical OWNER, I want the assistant to work in simple English
  (and ideally Sinhala) so I can use it comfortably.

  ARCHITECTURE — FUNCTION CALLING (Tool Use)
  ------------------------------------------
  The Chat Assistant uses Claude API with Tool Use (function calling).
  Claude decides which database query to run based on the question asked.

  Tools defined for Claude:
  ┌────────────────────────────────┬─────────────────────────────────────────┐
  │ Tool Name                      │ What it queries                         │
  ├────────────────────────────────┼─────────────────────────────────────────┤
  │ get_top_products               │ sale_items + products, date range       │
  │ get_customer_balances          │ customers WHERE credit_balance > 0      │
  │ get_supplier_balances          │ suppliers WHERE credit_balance > 0      │
  │ get_customer_purchase_history  │ sales + sale_items WHERE customer       │
  │ get_revenue_by_day_of_week     │ sales grouped by EXTRACT(DOW)          │
  │ get_low_stock_products         │ products WHERE qty <= reorder_level     │
  │ get_daily_revenue              │ sales for a specific date               │
  │ get_monthly_summary            │ sales + purchases for a month           │
  │ get_product_stock              │ products WHERE name ILIKE search        │
  └────────────────────────────────┴─────────────────────────────────────────┘

  Flow:
    1. Owner types question in chat input
    2. Question sent to Claude API with tool definitions
    3. Claude decides which tool(s) to call and with what parameters
    4. Server Action executes the SQL query and returns data to Claude
    5. Claude formats the data into a natural language answer
    6. Answer rendered in chat bubble on screen

  DATA SECURITY NOTE
  ------------------
  Buying prices and profit margins are sensitive. Only pass these to Claude
  if the user is OWNER or ADMIN. Strip buying_price from data passed to Claude
  when responding to CASHIER-level queries (though CASHIER will not have
  access to the chat assistant anyway).

  WORKFLOW
  --------
  1. Owner clicks chat icon (bottom-right floating button on dashboard)
  2. Chat drawer opens — shows last 10 messages in session
  3. Owner types question → hits Enter
  4. Loading dots shown while Claude processes
  5. Answer appears as a chat bubble
  6. Conversation history maintained for the session (not persisted to DB)
  7. [Clear Chat] button resets the conversation

  DATABASE CHANGES
  ----------------
  No new tables required for core functionality.
  Optional: chat_history table to persist conversations for review.

  IMPLEMENTATION FILES
  --------------------
  src/actions/ai.actions.ts
    → askBusinessQuestion(question: string, history: Message[]): Promise<string>
    → All tool implementation functions (SQL queries)

  src/components/dashboard/ChatAssistant.tsx
    → Floating chat button + drawer
    → Message list with user/AI bubbles
    → Input box with send button

  src/app/(dashboard)/layout.tsx
    → Mount ChatAssistant component (visible on all dashboard pages)

  ACCEPTANCE CRITERIA
  -------------------
  [ ] Chat assistant accessible from all dashboard pages via floating button
  [ ] Correctly answers at least all 5 example questions shown above
  [ ] If question is outside business data scope, gracefully says so
  [ ] Conversation history maintained within the session
  [ ] Loading state shown while Claude processes the request
  [ ] Errors (API timeout, network) shown as a friendly message
  [ ] OWNER and ADMIN roles can access; CASHIER and STORE_KEEPER cannot
  [ ] No buying_price or sensitive financial data exposed to non-OWNER roles
  [ ] Typing in Sinhala characters is supported (UTF-8 input)


────────────────────────────────────────────────────────────────────────────────
  [AI-05]  SMART PRODUCT SEARCH AT POS
  Effort : M  |  API Cost : Very Low  |  Value : ★★★★
────────────────────────────────────────────────────────────────────────────────

  BUSINESS CONTEXT
  ----------------
  The current POS product search uses exact text matching (ILIKE). If a cashier
  types "copper half" they get zero results because the product is named "Copper
  Pipe 0.5 Inch". This causes delays at the counter, queues building up, and
  frustrated customers. Smart search understands what the cashier means even
  when the search text does not exactly match the product name.

  COMPARISON TABLE
  ----------------
  What cashier types  | Current system   | With AI smart search
  --------------------|------------------|------------------------------------
  "copper half"       | No results       | Copper Pipe 0.5 Inch
  "small bolt"        | No results       | Hex Bolt M6, Hex Bolt M8
  "light bulb 20w"    | No results       | LED Bulb 20W Warm White
  "pvc tee"           | PVC Tee results  | Same + related fittings suggested
  "drill makita"      | No results       | Makita Drill 750W
  "angle grinder dis" | No results       | Grinding Disc 4 inch (accessory)

  USER STORIES
  ------------
  As a CASHIER, I want the POS search to find products even when I type
  partial names, common abbreviations, or informal descriptions, so I can
  serve customers faster without needing to know the exact product name.

  TWO IMPLEMENTATION OPTIONS
  --------------------------

  OPTION A — pgvector Semantic Search (Recommended)
  --------------------------------------------------
  Technology : pgvector extension on Supabase + OpenAI/Anthropic embeddings
  How it works:
    1. When a product is created/updated, generate a vector embedding of its
       name + category + description using Claude or OpenAI embeddings API
    2. Store the embedding in a products.embedding vector(1536) column
    3. At POS search, generate an embedding of the search text
    4. Find the N products with the closest cosine similarity to the query
    5. Return ranked results

  DB Change:
    ALTER TABLE products ADD COLUMN embedding vector(1536);
    CREATE INDEX ON products USING ivfflat (embedding vector_cosine_ops);

  Cost: Embedding API call is ~$0.0001 per search — essentially free

  OPTION B — Claude API Fuzzy Match (Simpler, no DB change)
  ----------------------------------------------------------
  Technology : Claude API with the full product name list
  How it works:
    1. On search, send the query + list of all product names to Claude
    2. Claude returns a ranked list of matching product names
    3. Query DB for those products by name
  Downside: Slower (full API round-trip per search), higher API cost at volume
  Good for: Shops with < 500 products, simpler setup

  RECOMMENDED APPROACH
  --------------------
  Start with Option B (simpler, no schema change).
  Migrate to Option A (pgvector) when product count exceeds 1,000.

  WORKFLOW (Option B)
  -------------------
  1. Cashier types ≥ 3 characters in POS search box
  2. After 400ms debounce, fire smart search
  3. Server Action: getSmartProductSearch(query, allProductNames[])
  4. Claude receives: query + array of product names + categories
  5. Claude returns: [{product_name, relevance_reason}] ranked list
  6. Server Action fetches full product data for matched names
  7. Results displayed in POS search dropdown with relevance indication

  IMPLEMENTATION FILES
  --------------------
  src/actions/ai.actions.ts
    → getSmartProductSearch(query: string): Promise<Product[]>

  src/app/(dashboard)/sales/pos/page.tsx
    → Replace or augment current ILIKE search with smart search call
    → Add "AI Search" badge on results found via smart search

  CACHING
  -------
  Product name list is cached in memory (fetched once on POS page load).
  Only refreshed if a product is added or edited (invalidate cache on mutation).

  ACCEPTANCE CRITERIA
  -------------------
  [ ] Search finds results for all 6 examples in the comparison table above
  [ ] Smart search fires after 400ms debounce (not on every keystroke)
  [ ] Results ranked by relevance — best match at the top
  [ ] Existing exact-match search still works (smart search augments, not replaces)
  [ ] If smart search finds nothing, falls back to original ILIKE search
  [ ] Search response time < 1.5 seconds including API call
  [ ] Works on any product in the catalog regardless of naming convention


────────────────────────────────────────────────────────────────────────────────
  [AI-06]  AI MONTHLY BUSINESS SUMMARY REPORT
  Effort : S  |  API Cost : Very Low  |  Value : ★★★★
────────────────────────────────────────────────────────────────────────────────

  BUSINESS CONTEXT
  ----------------
  At the end of every month, a business owner should review how the month went.
  Currently the system provides data but the owner must interpret it themselves.
  The AI Monthly Summary reads all the month's data and generates a professional
  written business review — like having a business consultant summarise the
  month for free. This is the easiest AI feature to build and has a very high
  "wow factor" in demos.

  EXAMPLE OUTPUT
  --------------
  "November 2026 Business Summary — [Shop Name]

   Revenue & Sales: November revenue was Rs. 1,240,000 — up 12.4% from
   October (Rs. 1,103,000). You completed 847 transactions with an average
   sale value of Rs. 1,465. Cash sales made up 68% of revenue.

   Best Performing Category: Electrical products led with Rs. 312,000 revenue
   (25.2% of total), driven by strong demand for MCBs and PVC wiring cables.

   Top 3 Products: (1) PVC Pipe 1 inch — Rs. 68,000 (2) MCB 16A — Rs. 54,000
   (3) Angle Grinder 4 inch — Rs. 48,000.

   Concern — Returns: Customer returns increased 35% vs October (Rs. 42,000
   vs Rs. 31,000). The majority came from City Builders Ltd. Follow-up
   recommended to understand the pattern.

   Stock Position: 14 products ended the month at or below reorder level.
   The most critical: Copper Wire 2.5mm (4 units remaining — order urgently).

   Recommendation for December: Based on November trends, increase stock for
   Electrical and Plumbing categories. Consider a promotion on slow-moving
   items in Paints & Coatings (Rs. 180,000 stock, only Rs. 28,000 sold)."

  USER STORIES
  ------------
  As an OWNER, at the end of each month I want an automatically generated
  written summary of how the business performed, with specific highlights and
  recommendations, so I can plan for the next month without spending hours
  analysing reports.

  DATA SOURCES USED
  -----------------
  - sales + sale_items  : month's revenue, transaction count, top products
  - purchases           : total stock purchased and at what cost
  - returns             : return volume and which customers returned most
  - products            : stock levels, low stock items at month end
  - categories          : revenue breakdown by category

  WORKFLOW
  --------
  1. At month end (or manually triggered), generate summary
  2. Server Action: getMonthlyAISummary(year, month) called
  3. Fetches all relevant monthly data from Supabase
  4. Structures data into a clean JSON payload
  5. Sends to Claude API with the prompt below
  6. Claude returns a 400–600 word professional business summary
  7. Summary stored in monthly_ai_summaries table
  8. Displayed on the Monthly Report page alongside the usual data
  9. Available as PDF download

  PROMPT DESIGN
  -------------
  System prompt:
    "You are a professional business analyst writing a monthly performance
     summary for a hardware shop owner in Sri Lanka. Write a clear, structured
     summary of 400-600 words. Include: revenue performance vs prior month,
     top products, category breakdown, concerns or anomalies, stock position,
     and 1-2 specific recommendations for next month. Use Sri Lankan Rupees
     (Rs.). Be specific with numbers. Use plain English."

  DATABASE TABLE NEEDED
  ----------------------
  monthly_ai_summaries:
    id            BIGSERIAL PRIMARY KEY
    year          INTEGER NOT NULL
    month         INTEGER NOT NULL
    summary_text  TEXT NOT NULL
    data_snapshot JSONB       -- the data sent to Claude (for audit)
    generated_at  TIMESTAMPTZ DEFAULT NOW()
    UNIQUE (year, month)

  IMPLEMENTATION FILES
  --------------------
  src/actions/ai.actions.ts
    → getMonthlyAISummary(year: number, month: number): Promise<string>
    → Fetches all monthly data, calls Claude, stores and returns result

  src/app/(dashboard)/reports/monthly/page.tsx
    → Add "AI Summary" tab or section at top of monthly report
    → [Generate AI Summary] button + display area
    → [Download as PDF] button

  ACCEPTANCE CRITERIA
  -------------------
  [ ] Summary generated on demand from Monthly Report page
  [ ] Summary mentions specific numbers from the actual month's data
  [ ] Concerns section highlights any unusual patterns (high returns, stockouts)
  [ ] Recommendations are specific and actionable (not generic)
  [ ] Summary stored so it does not regenerate on every page load
  [ ] Summary downloadable as part of the monthly report PDF
  [ ] OWNER and ADMIN access only
  [ ] If regenerated, previous summary is overwritten (one per month per shop)


────────────────────────────────────────────────────────────────────────────────
  [AI-07]  AUTOMATED WHATSAPP ALERTS TO SUPPLIERS
  Effort : M  |  API Cost : Low (WhatsApp API per message)  |  Value : ★★★★
────────────────────────────────────────────────────────────────────────────────

  BUSINESS CONTEXT
  ----------------
  When a product hits its reorder level, the owner knows from the low stock
  alert — but still has to manually call or message the supplier. This takes
  time and often gets forgotten. Automated WhatsApp alerts to the supplier
  remove the human step entirely. The system detects the low stock, drafts a
  professional message, and sends it to the supplier's WhatsApp automatically
  (or with one-click confirmation from the owner).

  EXAMPLE MESSAGE SENT TO SUPPLIER
  ----------------------------------
  "Dear Pettah Metals,

   This is an automated stock alert from [Shop Name] — NUVI Inventory System.

   The following item has reached its minimum reorder level:

   Product   : Copper Pipe 0.5 Inch
   Current   : 8 units remaining
   Reorder   : 50 units minimum
   Suggested : 150 units (based on current sales rate)

   Please confirm availability and your earliest delivery date.

   Thank you,
   [Shop Name] | 077 XXX XXXX"

  USER STORIES
  ------------
  As an OWNER, when any product hits its reorder level, I want the system to
  automatically notify the relevant supplier on WhatsApp so I do not have to
  remember to call them.

  As an OWNER, I want to review and approve the message before it is sent, so
  I remain in control of supplier communication.

  TWO MODES OF OPERATION
  -----------------------

  MODE A — One-Click Send (Recommended for start)
  ------------------------------------------------
  Low Stock page → [Send WhatsApp Alert] per supplier
  → Owner clicks → wa.me link opens in browser with pre-filled message
  → Owner sends manually from their own WhatsApp
  No API key needed. Uses wa.me deep link. Zero cost.

  MODE B — Fully Automated (Advanced)
  -------------------------------------
  Uses WhatsApp Business API (Meta Cloud API)
  → Message sent directly from server — no manual step
  → Owner receives a copy in their WhatsApp as confirmation
  Requires: WhatsApp Business Account, Meta Business Verification, API access
  Cost: ~Rs. 8–15 per message (Meta pricing for utility messages in Sri Lanka)

  RECOMMENDED: Start with Mode A (zero cost, zero API setup).
               Upgrade to Mode B when client specifically requests full automation.

  AI COMPONENT
  ------------
  Claude API is used to personalise the message per supplier and product.
  The message above is generated by Claude using:
    - product name, current quantity, reorder level
    - supplier name (from suppliers table)
    - suggested reorder quantity (from AI-02 if built, else 2× reorder_level)
    - shop name (from env variable NEXT_PUBLIC_SHOP_NAME)

  WORKFLOW (Mode A)
  -----------------
  1. Low Stock Report page shows products below reorder level
  2. Products grouped by supplier
  3. Each supplier group has [Send WhatsApp Alert] button
  4. Server Action: generateSupplierAlertMessage(supplierId, products[])
  5. Claude generates a professional message for that supplier + product list
  6. wa.me link created: https://wa.me/94XXXXXXXXX?text=[encoded message]
  7. Owner's browser opens WhatsApp with pre-filled message
  8. Owner reviews and taps Send from their own WhatsApp

  WORKFLOW (Mode B — Full Automation)
  ------------------------------------
  1. Nightly Edge Function checks for products at reorder level
  2. Groups by supplier
  3. For each supplier with phone number: generates message via Claude
  4. Sends via WhatsApp Business API
  5. Logs the alert in supplier_alerts table

  DATABASE TABLE NEEDED (for Mode B logging)
  -------------------------------------------
  supplier_whatsapp_alerts:
    id            BIGSERIAL PRIMARY KEY
    supplier_id   BIGINT REFERENCES suppliers(id)
    message_text  TEXT NOT NULL
    products_list JSONB
    sent_via      TEXT CHECK (IN 'MANUAL','API')
    sent_at       TIMESTAMPTZ DEFAULT NOW()
    delivered     BOOLEAN DEFAULT false

  IMPLEMENTATION FILES
  --------------------
  src/actions/ai.actions.ts
    → generateSupplierAlertMessage(supplierId, products): Promise<string>
    → Calls Claude to draft message, returns WhatsApp URL

  src/app/(dashboard)/reports/low-stock/page.tsx
    → Group low-stock items by supplier
    → [Send WhatsApp Alert] button per supplier group

  supabase/functions/nightly-supplier-alerts/index.ts  (Mode B only)
    → Automated nightly send via WhatsApp Business API

  ACCEPTANCE CRITERIA
  -------------------
  [ ] [Send WhatsApp Alert] button appears on Low Stock Report grouped by supplier
  [ ] Message is personalised with supplier name, product names, quantities
  [ ] Message is professional and clearly from the shop (includes shop name)
  [ ] Suppliers without a phone number show [Add Phone] prompt instead
  [ ] In Mode A: wa.me link opens correctly pre-filled with message
  [ ] In Mode B: message sent automatically, alert logged in DB
  [ ] Owner can preview the message before it is sent
  [ ] Multiple low-stock items for the same supplier combined in one message


================================================================================
  MASTER SUMMARY TABLE
================================================================================

  ID      FEATURE                           EFFORT  API COST    VALUE    STATUS
  ------  --------------------------------  ------  ----------  -------  --------
  AI-01   AI Dashboard Insights             M       Very Low    5/5      PENDING
  AI-02   Smart Reorder Forecasting         M       Very Low    5/5      PENDING
  AI-03   Fraud & Anomaly Detection         M       Very Low    4/5      PENDING
  AI-04   AI Chat Assistant                 L       Low         5/5      PENDING
  AI-05   Smart POS Product Search          M       Very Low    4/5      PENDING
  AI-06   Monthly AI Business Summary       S       Very Low    4/5      PENDING
  AI-07   WhatsApp Supplier Alerts          M       Low         4/5      PENDING

================================================================================
  RECOMMENDED BUILD ORDER
================================================================================

  PHASE 1 — IMMEDIATE IMPACT (2–3 weeks)
  ----------------------------------------
  1. AI-06  Monthly Business Summary    (S  — 1 day,   easiest, highest wow factor)
  2. AI-01  Dashboard Insights          (M  — 2 days,  owner sees it every day)
  3. AI-02  Smart Reorder Forecasting   (M  — 3 days,  solves daily pain point)

  PHASE 2 — POWER FEATURES (3–4 weeks)
  --------------------------------------
  4. AI-07  WhatsApp Supplier Alerts    (M  — 2 days,  Mode A first, Mode B later)
  5. AI-05  Smart POS Search            (M  — 3 days,  Option B first)
  6. AI-03  Fraud & Anomaly Detection   (M  — 3 days,  owner security confidence)

  PHASE 3 — ADVANCED (2–3 weeks)
  --------------------------------
  7. AI-04  AI Chat Assistant           (L  — 5 days,  most impressive demo feature)

================================================================================
  PRICING IMPACT ON YOUR SYSTEM
================================================================================

  These 7 AI features together make the NUVI system significantly more valuable
  than any other inventory software in the Sri Lankan market. They justify a
  higher price point and make the system much harder to replace once installed.

  Estimated monthly Claude API cost per shop:
  -------------------------------------------
  AI-01 Dashboard Insights    : ~30 calls/month      = ~$0.30/month
  AI-02 Reorder Forecasting   : ~30 background jobs  = ~$0.50/month
  AI-03 Anomaly Detection     : ~30 nightly scans    = ~$0.50/month
  AI-04 Chat Assistant        : ~100 questions/month = ~$1.00/month
  AI-05 POS Smart Search      : ~500 searches/day    = ~$1.50/month
  AI-06 Monthly Summary       : 1 summary/month      = ~$0.10/month
  AI-07 WhatsApp Alerts       : ~20 messages/month   = ~$0.20/month
                                               TOTAL : ~$4.10/month per shop

  At Rs. 325/USD: approximately Rs. 1,330/month per shop.
  This can be included in the hosting cost or charged as an "AI Add-on" for
  an additional Rs. 2,000–3,000/month (profitable at any volume above 3 shops).

================================================================================
  DEVELOPER NOTES
================================================================================

  - All Claude API calls go through src/actions/ai.actions.ts (server-side only)
  - Never call Claude API from client components — always use Server Actions
  - Always implement graceful degradation: if AI fails, system works normally
  - Always log AI API errors to console but never break the user's workflow
  - Prompt caching: use Anthropic prompt caching for system prompts to reduce
    cost by up to 90% on repeated calls with the same system prompt
  - Data privacy: never send customer PII (names, phones, emails) to Claude API
    — use anonymised references ("Customer A", "Supplier B") if needed
  - Rate limiting: add a simple cooldown on AI calls (min 30 seconds between
    repeated calls to the same feature) to prevent accidental cost spikes

================================================================================
  END OF DOCUMENT
  NUVI Engineering PVT LTD | info@nuvi.lk | 077 662 2922
================================================================================
