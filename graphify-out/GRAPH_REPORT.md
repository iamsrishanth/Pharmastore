# Graph Report - .  (2026-07-03)

## Corpus Check
- Corpus is ~27,897 words - fits in a single context window. You may not need a graph.

## Summary
- 258 nodes · 446 edges · 25 communities (14 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 4,830 input · 572 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Analytics and Audit Logging Page Routes|Analytics and Audit Logging Page Routes]]
- [[_COMMUNITY_Package Configuration and Node Dependencies|Package Configuration and Node Dependencies]]
- [[_COMMUNITY_Admin and Employee Dashboard Views|Admin and Employee Dashboard Views]]
- [[_COMMUNITY_Stock Master Management and Batch Ingestion|Stock Master Management and Batch Ingestion]]
- [[_COMMUNITY_Inventory Pages and POS Checkout Routing|Inventory Pages and POS Checkout Routing]]
- [[_COMMUNITY_TypeScript Compiler Options Config|TypeScript Compiler Options Config]]
- [[_COMMUNITY_Daily Expiry Cron Checks and POS Billing Terminal|Daily Expiry Cron Checks and POS Billing Terminal]]
- [[_COMMUNITY_Employee Management Views and Form Controls|Employee Management Views and Form Controls]]
- [[_COMMUNITY_Sales Ledger and Past Invoices View|Sales Ledger and Past Invoices View]]
- [[_COMMUNITY_Supplier Management Views and Controls|Supplier Management Views and Controls]]
- [[_COMMUNITY_Global App Layout and Context Providers|Global App Layout and Context Providers]]
- [[_COMMUNITY_Documentation Rules and NextJS Guidelines|Documentation Rules and NextJS Guidelines]]
- [[_COMMUNITY_Root Landing Page and Project README|Root Landing Page and Project README]]
- [[_COMMUNITY_ESLint Configuration Rules|ESLint Configuration Rules]]
- [[_COMMUNITY_NextJS Next Config Setup|NextJS Next Config Setup]]
- [[_COMMUNITY_PostCSS Framework Configuration|PostCSS Framework Configuration]]
- [[_COMMUNITY_Vercel Platform Regional Deployment Config|Vercel Platform Regional Deployment Config]]
- [[_COMMUNITY_Public file SVG Asset|Public file SVG Asset]]
- [[_COMMUNITY_Public globe SVG Asset|Public globe SVG Asset]]
- [[_COMMUNITY_Public next SVG Asset|Public next SVG Asset]]
- [[_COMMUNITY_Public vercel SVG Asset|Public vercel SVG Asset]]
- [[_COMMUNITY_Public window SVG Asset|Public window SVG Asset]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 51 edges
2. `getCurrentUser()` - 25 edges
3. `compilerOptions` - 16 edges
4. `getExpiryStatus()` - 12 edges
5. `getProducts()` - 9 edges
6. `Modal()` - 7 edges
7. `getBatches()` - 6 edges
8. `getSuppliers()` - 6 edges
9. `createAdminClient()` - 6 edges
10. `getAnalyticsSummary()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `BatchesPage()` --calls--> `getBatches()`  [EXTRACTED]
  app/admin/batches/page.tsx → lib/actions/batches.ts
- `BatchesPage()` --calls--> `getSuppliers()`  [EXTRACTED]
  app/admin/batches/page.tsx → lib/actions/suppliers.ts
- `AdminLayout()` --calls--> `getCurrentUser()`  [EXTRACTED]
  app/admin/layout.tsx → lib/actions/auth.ts
- `ProductsPage()` --calls--> `getProducts()`  [EXTRACTED]
  app/admin/products/page.tsx → lib/actions/products.ts
- `SuppliersPage()` --calls--> `getSuppliers()`  [EXTRACTED]
  app/admin/suppliers/page.tsx → lib/actions/suppliers.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Project Documentation and Guidelines** — agents_md, claude_md, readme_md [INFERRED 0.90]

## Communities (25 total, 11 thin omitted)

### Community 0 - "Analytics and Audit Logging Page Routes"
Cohesion: 0.11
Nodes (16): AdminAnalyticsPage(), AdminAuditLogsPage(), AdminLayout(), EmployeeDashboardPage(), EmployeeLayout(), Home(), AnalyticsClientProps, AnalyticsData (+8 more)

### Community 1 - "Package Configuration and Node Dependencies"
Cohesion: 0.06
Nodes (31): dependencies, @hookform/resolvers, html5-qrcode, lucide-react, next, react, react-dom, react-hook-form (+23 more)

### Community 2 - "Admin and Employee Dashboard Views"
Cohesion: 0.12
Nodes (21): AdminDashboardPage(), EmployeeAlertsPage(), AdminDashboard(), AdminDashboardProps, PendingAdjustment, AlertsClientProps, BatchAlert, LowStockItem (+13 more)

### Community 3 - "Stock Master Management and Batch Ingestion"
Cohesion: 0.12
Nodes (17): EmployeeStockPage(), Batch, BatchClientProps, BatchFormData, Product, Supplier, AdjustmentFormData, Batch (+9 more)

### Community 4 - "Inventory Pages and POS Checkout Routing"
Cohesion: 0.15
Nodes (16): BatchesPage(), ProductsPage(), POSBillingPage(), POSBillingClient(), Product, ProductClientProps, ProductFormData, createProduct() (+8 more)

### Community 5 - "TypeScript Compiler Options Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 6 - "Daily Expiry Cron Checks and POS Billing Terminal"
Cohesion: 0.15
Nodes (10): GET(), CartItem, POSBillingClientProps, Product, EmployeeDashboardProps, ProductStockSummary, createClient(), ExpiryStatus (+2 more)

### Community 7 - "Employee Management Views and Form Controls"
Cohesion: 0.21
Nodes (12): EmployeesPage(), EmployeeClientProps, EmployeeFormData, Profile, createEmployee(), fetchEmployeesFromDb(), getCachedEmployees, getEmployees() (+4 more)

### Community 8 - "Sales Ledger and Past Invoices View"
Cohesion: 0.17
Nodes (10): AdminSalesPage(), Sale, SalesLedgerClientProps, createSale(), CreateSaleInput, getSaleDetails(), getSales(), SaleItemInput (+2 more)

### Community 9 - "Supplier Management Views and Controls"
Cohesion: 0.21
Nodes (11): SuppliersPage(), Supplier, SupplierClientProps, SupplierFormData, createSupplier(), deleteSupplier(), fetchSuppliersFromDb(), getCachedSuppliers (+3 more)

### Community 10 - "Global App Layout and Context Providers"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

## Knowledge Gaps
- **100 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `Product`, `CartItem` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Admin and Employee Dashboard Views` to `Analytics and Audit Logging Page Routes`, `Stock Master Management and Batch Ingestion`, `Inventory Pages and POS Checkout Routing`, `Employee Management Views and Form Controls`, `Sales Ledger and Past Invoices View`, `Supplier Management Views and Controls`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Why does `getCurrentUser()` connect `Analytics and Audit Logging Page Routes` to `Sales Ledger and Past Invoices View`, `Admin and Employee Dashboard Views`, `Stock Master Management and Batch Ingestion`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `getExpiryStatus()` connect `Daily Expiry Cron Checks and POS Billing Terminal` to `Analytics and Audit Logging Page Routes`, `Admin and Employee Dashboard Views`, `Stock Master Management and Batch Ingestion`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Analytics and Audit Logging Page Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.10984848484848485 - nodes in this community are weakly interconnected._
- **Should `Package Configuration and Node Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `Admin and Employee Dashboard Views` be split into smaller, more focused modules?**
  _Cohesion score 0.12258064516129032 - nodes in this community are weakly interconnected._