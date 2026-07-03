# Graph Report - .  (2026-07-03)

## Corpus Check
- Corpus is ~24,656 words - fits in a single context window. You may not need a graph.

## Summary
- 231 nodes · 418 edges · 17 communities (12 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 51 edges
2. `getCurrentUser()` - 25 edges
3. `compilerOptions` - 16 edges
4. `getExpiryStatus()` - 12 edges
5. `getProducts()` - 8 edges
6. `Modal()` - 6 edges
7. `getBatches()` - 6 edges
8. `getSuppliers()` - 6 edges
9. `createAdminClient()` - 6 edges
10. `getAnalyticsSummary()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `BatchesPage()` --calls--> `getProducts()`  [EXTRACTED]
  app/admin/batches/page.tsx → lib/actions/products.ts
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

## Communities (17 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (31): dependencies, @hookform/resolvers, html5-qrcode, lucide-react, next, react, react-dom, react-hook-form (+23 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (19): ProductsPage(), POSBillingPage(), POSBillingClient(), AdjustmentFormData, Batch, EmployeeStockClientProps, Product, ProductClientProps (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (13): AdminAnalyticsPage(), AdminAuditLogsPage(), AdminLayout(), EmployeeLayout(), Home(), AuditLog, AuditLogsClientProps, HeaderProps (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (14): GET(), EmployeeDashboardPage(), EmployeeDashboardProps, ProductStockSummary, AlertsClientProps, BatchAlert, LowStockItem, returnBatchToSupplier() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (14): AdminDashboardPage(), EmployeeAlertsPage(), AdminDashboard(), AdminDashboardProps, PendingAdjustment, getNotifications(), getUnreadNotificationsCount(), markAllNotificationsAsRead() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (12): BatchesPage(), EmployeeStockPage(), Batch, BatchClientProps, BatchFormData, Product, Supplier, createBatch() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (11): CartItem, POSBillingClientProps, Product, createSale(), CreateSaleInput, getSaleDetails(), getSales(), SaleItemInput (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (10): EmployeesPage(), EmployeeClientProps, EmployeeFormData, Profile, createEmployee(), getEmployees(), toggleEmployeeStatus(), updateEmployee() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.24
Nodes (9): SuppliersPage(), Supplier, SupplierClientProps, SupplierFormData, createSupplier(), deleteSupplier(), getSuppliers(), updateSupplier() (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

## Knowledge Gaps
- **91 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `Product`, `CartItem` (+86 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 5` to `Community 1`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Why does `getCurrentUser()` connect `Community 2` to `Community 1`, `Community 3`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `getExpiryStatus()` connect `Community 3` to `Community 1`, `Community 5`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _91 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._