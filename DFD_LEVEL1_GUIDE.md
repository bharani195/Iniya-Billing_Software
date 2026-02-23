# Data Flow Diagram (DFD) — Level 1

## Lakshmi Printing Works — Billing & Inventory Management System

---

## Table of Contents

1. [DFD Rules & Conventions](#1-dfd-rules--conventions)
2. [DFD Symbols & Notations](#2-dfd-symbols--notations)
3. [External Entities](#3-external-entities)
4. [Processes](#4-processes)
5. [Data Stores](#5-data-stores)
6. [Data Flows](#6-data-flows)
7. [Complete DFD Level 1 — Component Mapping Table](#7-complete-dfd-level-1--component-mapping-table)
8. [Step-by-Step Drawing Guide](#8-step-by-step-drawing-guide)
9. [DFD Level 1 — Textual Diagram](#9-dfd-level-1--textual-diagram)
10. [Validation Checklist](#10-validation-checklist)

---

## 1. DFD Rules & Conventions

Before drawing, ensure strict adherence to the following DFD rules:

### 1.1 Fundamental Rules

| # | Rule | Description |
|---|------|-------------|
| R1 | **No direct data flow between two entities** | External entities cannot communicate directly — data must pass through at least one process |
| R2 | **No direct data flow between two data stores** | Data stores cannot exchange data directly — a process must mediate |
| R3 | **No direct data flow from entity to data store** | An entity cannot read/write a data store directly — it must go through a process |
| R4 | **Every process must have at least one input and one output** | No "black hole" (input only) or "miracle" (output only) processes |
| R5 | **All data flows must be labeled** | Every arrow must have a meaningful name describing the data being transferred |
| R6 | **Each process must be numbered** | Use hierarchical numbering (1.0, 2.0, ... for Level 1) |
| R7 | **Data flows are unidirectional** | Each arrow flows in one direction; use separate arrows for bidirectional communication |
| R8 | **Processes must transform data** | A process cannot simply pass data through without any transformation or logic |
| R9 | **Data store names are nouns** | Data stores represent stored collections (e.g., "Customers", "Invoices") |
| R10 | **Process names are verb phrases** | Processes describe actions (e.g., "Manage Invoices", "Process Payments") |

### 1.2 Level 1 Specific Rules

- Level 1 is the **decomposition of the Level 0 (Context Diagram)** single process into sub-processes
- All external entities from Level 0 must appear in Level 1
- All data flows entering/leaving the Level 0 boundary must be preserved
- Data stores appear for the **first time** at Level 1 (they are hidden in Level 0)
- Each process at Level 1 can be further decomposed into Level 2

---

## 2. DFD Symbols & Notations

Use the **Yourdon & DeMarco** notation (most common):

```
┌─────────────────────────────────────────────────────────┐
│  SYMBOL              SHAPE              MEANING          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  External Entity     ┌──────────┐       Source or        │
│                      │          │       destination of   │
│                      │  Entity  │       data (outside    │
│                      │          │       system boundary) │
│                      └──────────┘                        │
│                                                          │
│  Process             ╭──────────╮       Transforms       │
│                      │   1.0    │       input data to    │
│                      │ Process  │       output data      │
│                      │  Name    │       (verb phrase)    │
│                      ╰──────────╯                        │
│                                                          │
│  Data Store          ═══════════════    Repository of    │
│                      ║ D1 │ Name   ║    data at rest     │
│                      ═══════════════    (noun)           │
│                                                          │
│  Data Flow           ──────────→        Movement of      │
│                      "label"            data (labeled     │
│                                         arrow)           │
└─────────────────────────────────────────────────────────┘
```

### Shape Guide for Drawing Tools

| Component | Draw.io / Lucidchart | MS Visio | Hand Drawing |
|-----------|---------------------|----------|--------------|
| **External Entity** | Rectangle (square corners) | Rectangle | Square/Rectangle |
| **Process** | Circle or Rounded Rectangle | Circle | Circle with number on top |
| **Data Store** | Open-ended rectangle (two horizontal lines) | Two parallel lines | Two parallel lines with ID on left |
| **Data Flow** | Arrow (labeled) | Arrow (labeled) | Arrow with label above |

---

## 3. External Entities

External entities are **actors outside the system boundary** that interact with the system by sending or receiving data.

| Entity ID | Entity Name | Description | Interacts With |
|-----------|-------------|-------------|----------------|
| **E1** | **Admin / Manager** | System administrator who manages all modules, users, company settings, and views reports | P1.0, P2.0, P3.0, P4.0, P5.0, P6.0, P7.0, P8.0, P9.0, P10.0 |
| **E2** | **Staff / Worker** | Staff members assigned to job orders, can create invoices and manage day-to-day operations | P1.0, P5.0, P6.0, P7.0 |
| **E3** | **Accountant** | Handles payments, purchases, expenses, and financial reports | P1.0, P7.0, P8.0, P9.0 |
| **E4** | **Customer** | External party who receives invoices, makes payments, and places job orders | P2.0, P5.0, P6.0, P7.0 |
| **E5** | **Supplier** | External party who supplies products/materials and receives purchase payments | P3.0, P8.0 |
| **E6** | **Stripe Payment Gateway** | Third-party payment processor for online invoice payments in INR | P7.0 |
| **E7** | **Email Service (Gmail SMTP)** | External email service for sending invoice emails with PDF attachments | P5.0 |

---

## 4. Processes

Each process represents a **logical transformation** of data within the system.

| Process ID | Process Name | Description | Inputs | Outputs |
|------------|-------------|-------------|--------|---------|
| **P1.0** | **Authenticate & Manage Users** | Handles user login/logout (JWT), profile management, password operations, role assignment, and user activation/deactivation | Login credentials, profile data, password data | JWT tokens, user details, dashboard stats |
| **P2.0** | **Manage Customers** | CRUD operations on customers, ledger generation, due tracking, credit management | Customer details, search/filter criteria | Customer records, ledger report, due list, stats |
| **P3.0** | **Manage Suppliers** | CRUD operations on suppliers, payable tracking | Supplier details | Supplier records, payable stats |
| **P4.0** | **Manage Products & Inventory** | Product/category CRUD, stock adjustments, stock movement tracking, low/dead stock detection | Product details, stock adjustments, category data | Product records, stock alerts, stock movement logs, top-selling data |
| **P5.0** | **Manage Invoices** | Create/edit/cancel invoices (5 types), auto-calculate GST, generate PDF, send email, generate payment links | Invoice details, line items, customer ID | Invoice records, PDF document, email notification, payment token |
| **P6.0** | **Manage Job Orders** | Job order CRUD, 9-stage status workflow, worker assignment, design uploads, advance tracking, convert to invoice | Job order details, services, status updates, design files | Job order records, status history, PDF bill, linked invoice |
| **P7.0** | **Process Payments** | Record incoming (customer) and outgoing (supplier) payments, Stripe online payment processing, payment verification | Payment details, Stripe session data | Payment records, payment confirmation, notifications, updated balances |
| **P8.0** | **Manage Purchases & Expenses** | Purchase bill CRUD, expense recording with categories, supplier payment tracking | Purchase details, expense details | Purchase records, expense records, payable stats |
| **P9.0** | **Generate Reports** | Generate Sales, Purchase, Profit & Loss, GST, and Stock reports with date-range filters; aggregate dashboard data | Date range, report type | Report data (summaries, charts, breakdowns) |
| **P10.0** | **Manage Settings & Notifications** | System configuration (key-value store), notification creation/tracking, company profile management | Setting values, company details, logo/signature files | Configuration data, notification alerts, company profile |

---

## 5. Data Stores

Data stores represent **repositories where data is stored** persistently (database tables).

| Store ID | Store Name | Description | Key Fields |
|----------|-----------|-------------|------------|
| **D1** | **Users** | Stores user accounts with roles and authentication details | user_id, username, email, role (admin/staff/accountant), phone, avatar, password_hash, is_active |
| **D2** | **Customers** | Stores customer information and balance tracking | customer_id, name, phone, email, GSTIN, PAN, address, opening_balance, current_balance, credit_limit, credit_days |
| **D3** | **Suppliers** | Stores supplier information and payable tracking | supplier_id, name, contact_person, phone, GSTIN, PAN, address, opening_balance, current_balance |
| **D4** | **Products & Categories** | Stores product catalog, categories, and stock movement history | product_id, name, SKU, HSN_code, category_id, sale_price, purchase_price, MRP, GST_rate, stock_quantity, min_stock, max_stock, unit |
| **D5** | **Invoices & Invoice Items** | Stores all invoice documents and their line items | invoice_id, invoice_number, type, status, customer_id, subtotal, discount, CGST, SGST, IGST, total, balance_due, payment_token |
| **D6** | **Job Orders & Services** | Stores job orders, assigned services, and status history | joborder_id, order_number, customer_id, material_type, printing_type, status, priority, design_file, advance_amount, assigned_workers |
| **D7** | **Payments** | Stores incoming (customer) and outgoing (supplier) payment records | payment_id, type (in/out), customer_id/supplier_id, invoice_id/purchase_id, amount, mode, reference, cheque_details |
| **D8** | **Purchases & Expenses** | Stores purchase bills, purchase items, and categorized expenses | purchase_id, supplier_id, bill_number, total, balance; expense_id, category, amount, date, payment_mode |
| **D9** | **Company Profile** | Stores company information, branding, and bank details (singleton) | company_name, logo, address, GSTIN, PAN, bank_name, account_number, IFSC, UPI, signature, invoice_prefix |
| **D10** | **Settings & Notifications** | Stores system configuration and admin notifications | setting_key, setting_value, category; notification_id, type, message, is_read, linked_invoice/payment |
| **D11** | **Stock Movements** | Audit trail of all stock changes | movement_id, product_id, type (IN/OUT/ADJ/RET), quantity, before_qty, after_qty, reference |

---

## 6. Data Flows

### 6.1 Data Flow Catalog

Each data flow is labeled with a unique identifier and description.

---

#### P1.0 — Authenticate & Manage Users

| Flow ID | From | To | Data Flow Label | Description |
|---------|------|----|----------------|-------------|
| DF1.1 | E1 (Admin) | P1.0 | Login Credentials | Username and password for authentication |
| DF1.2 | E2 (Staff) | P1.0 | Login Credentials | Username and password for authentication |
| DF1.3 | E3 (Accountant) | P1.0 | Login Credentials | Username and password for authentication |
| DF1.4 | P1.0 | E1/E2/E3 | JWT Tokens + User Profile | Access token, refresh token, and user details |
| DF1.5 | P1.0 | D1 (Users) | User Record | Store/update user account data |
| DF1.6 | D1 (Users) | P1.0 | User Data | Retrieve user credentials and profile for validation |
| DF1.7 | E1 (Admin) | P1.0 | User Management Data | New user details, role assignment, activation toggle |
| DF1.8 | P1.0 | E1 (Admin) | Dashboard Statistics | Aggregated stats (today's sales, pending amounts, low stock count) |

---

#### P2.0 — Manage Customers

| Flow ID | From | To | Data Flow Label | Description |
|---------|------|----|----------------|-------------|
| DF2.1 | E1 (Admin) | P2.0 | Customer Details | Name, phone, email, GSTIN, PAN, address, credit info |
| DF2.2 | P2.0 | D2 (Customers) | Customer Record | Store new/updated customer data |
| DF2.3 | D2 (Customers) | P2.0 | Customer Data | Retrieve customer list, details, balances |
| DF2.4 | P2.0 | E1 (Admin) | Customer List / Ledger / Stats | Customer records, transaction ledger, due summaries |
| DF2.5 | D5 (Invoices) | P2.0 | Invoice Records | Invoice data for customer ledger generation |
| DF2.6 | D7 (Payments) | P2.0 | Payment Records | Payment data for customer ledger generation |

---

#### P3.0 — Manage Suppliers

| Flow ID | From | To | Data Flow Label | Description |
|---------|------|----|----------------|-------------|
| DF3.1 | E1 (Admin) | P3.0 | Supplier Details | Name, contact person, phone, GSTIN, PAN, address |
| DF3.2 | P3.0 | D3 (Suppliers) | Supplier Record | Store new/updated supplier data |
| DF3.3 | D3 (Suppliers) | P3.0 | Supplier Data | Retrieve supplier list and details |
| DF3.4 | P3.0 | E1 (Admin) | Supplier List / Stats | Supplier records, total/active counts, payable amounts |

---

#### P4.0 — Manage Products & Inventory

| Flow ID | From | To | Data Flow Label | Description |
|---------|------|----|----------------|-------------|
| DF4.1 | E1 (Admin) | P4.0 | Product Details | Product name, SKU, HSN, prices, GST rate, stock, category |
| DF4.2 | P4.0 | D4 (Products) | Product Record | Store new/updated product and category data |
| DF4.3 | D4 (Products) | P4.0 | Product Data | Retrieve product catalog, stock levels, categories |
| DF4.4 | P4.0 | E1 (Admin) | Product List / Stock Alerts | Product records, low stock alerts, dead stock items, top-selling |
| DF4.5 | E1 (Admin) | P4.0 | Stock Adjustment | Manual stock adjustment (quantity, reason) |
| DF4.6 | P4.0 | D11 (Stock Movements) | Stock Movement Record | Log stock change with before/after quantities |
| DF4.7 | D11 (Stock Movements) | P4.0 | Movement History | Retrieve stock movement audit trail |

---

#### P5.0 — Manage Invoices

| Flow ID | From | To | Data Flow Label | Description |
|---------|------|----|----------------|-------------|
| DF5.1 | E1 (Admin) / E2 (Staff) | P5.0 | Invoice Details | Invoice type, customer, line items, discount, notes |
| DF5.2 | P5.0 | D5 (Invoices) | Invoice Record | Store invoice header and line items |
| DF5.3 | D5 (Invoices) | P5.0 | Invoice Data | Retrieve invoice list, details, totals |
| DF5.4 | D2 (Customers) | P5.0 | Customer Info | Customer details for invoice header |
| DF5.5 | D4 (Products) | P5.0 | Product Info | Product details, prices, GST rates, HSN codes |
| DF5.6 | P5.0 | D4 (Products) | Stock Deduction | Reduce product stock quantity on invoice creation |
| DF5.7 | P5.0 | D2 (Customers) | Balance Update | Update customer current_balance (increase due) |
| DF5.8 | P5.0 | D11 (Stock Movements) | Stock OUT Record | Log stock deduction movement |
| DF5.9 | P5.0 | E1 (Admin) | Invoice List / PDF / Stats | Invoice records, PDF document, statistics |
| DF5.10 | P5.0 | E7 (Email Service) | Invoice Email + PDF | HTML email body, PDF attachment, payment link |
| DF5.11 | E7 (Email Service) | E4 (Customer) | Email Notification | Invoice email delivered to customer |
| DF5.12 | D9 (Company) | P5.0 | Company Details | Company name, logo, address, bank details, signature for PDF |

---

#### P6.0 — Manage Job Orders

| Flow ID | From | To | Data Flow Label | Description |
|---------|------|----|----------------|-------------|
| DF6.1 | E1 (Admin) / E2 (Staff) | P6.0 | Job Order Details | Customer, material, design, printing type, services, priority |
| DF6.2 | P6.0 | D6 (Job Orders) | Job Order Record | Store job order, services, and status updates |
| DF6.3 | D6 (Job Orders) | P6.0 | Job Order Data | Retrieve job order list, details, status history |
| DF6.4 | P6.0 | E1 (Admin) / E2 (Staff) | Job Order List / PDF / Stats | Job order records, PDF bill, status updates |
| DF6.5 | E1 (Admin) / E2 (Staff) | P6.0 | Status Update | New status in the 9-stage workflow |
| DF6.6 | D1 (Users) | P6.0 | Staff List | Available staff/workers for assignment |
| DF6.7 | P6.0 | P5.0 | Invoice Conversion Data | Job order data converted into invoice (convert-to-invoice action) |
| DF6.8 | D2 (Customers) | P6.0 | Customer Info | Customer details for job order association |

---

#### P7.0 — Process Payments

| Flow ID | From | To | Data Flow Label | Description |
|---------|------|----|----------------|-------------|
| DF7.1 | E1 (Admin) / E3 (Accountant) | P7.0 | Payment In Details | Customer, invoice, amount, mode, reference |
| DF7.2 | P7.0 | D7 (Payments) | Payment Record | Store incoming/outgoing payment data |
| DF7.3 | D7 (Payments) | P7.0 | Payment Data | Retrieve payment list, stats, recent payments |
| DF7.4 | P7.0 | D5 (Invoices) | Invoice Balance Update | Reduce invoice balance_due, update status (partial/paid) |
| DF7.5 | P7.0 | D2 (Customers) | Customer Balance Update | Reduce customer current_balance on payment receipt |
| DF7.6 | P7.0 | E1 (Admin) | Payment Confirmation / Stats | Payment summary, today/monthly collections, mode breakdown |
| DF7.7 | E4 (Customer) | P7.0 | Online Payment Request | Access payment link (token-based) |
| DF7.8 | P7.0 | E6 (Stripe) | Checkout Session Request | Invoice amount, currency (INR), success/cancel URLs |
| DF7.9 | E6 (Stripe) | P7.0 | Payment Confirmation | Payment session status, transaction ID |
| DF7.10 | P7.0 | D10 (Notifications) | Payment Notification | Create notification for admin about received payment |
| DF7.11 | E1 (Admin) / E3 (Accountant) | P7.0 | Payment Out Details | Supplier, purchase, amount, mode, reference |
| DF7.12 | P7.0 | D3 (Suppliers) | Supplier Balance Update | Reduce supplier current_balance on payment out |

---

#### P8.0 — Manage Purchases & Expenses

| Flow ID | From | To | Data Flow Label | Description |
|---------|------|----|----------------|-------------|
| DF8.1 | E1 (Admin) / E3 (Accountant) | P8.0 | Purchase Details | Supplier, bill number, items, amounts |
| DF8.2 | P8.0 | D8 (Purchases) | Purchase Record | Store purchase bill and line items |
| DF8.3 | D8 (Purchases) | P8.0 | Purchase Data | Retrieve purchase list and details |
| DF8.4 | P8.0 | D3 (Suppliers) | Supplier Balance Update | Update supplier payable balance |
| DF8.5 | D3 (Suppliers) | P8.0 | Supplier Info | Supplier details for purchase association |
| DF8.6 | E1 (Admin) / E3 (Accountant) | P8.0 | Expense Details | Category, amount, date, description, payment mode |
| DF8.7 | P8.0 | D8 (Purchases) | Expense Record | Store expense data |
| DF8.8 | P8.0 | E1 (Admin) | Purchase / Expense Stats | Purchase totals, expense category breakdown |

---

#### P9.0 — Generate Reports

| Flow ID | From | To | Data Flow Label | Description |
|---------|------|----|----------------|-------------|
| DF9.1 | E1 (Admin) / E3 (Accountant) | P9.0 | Report Request | Report type, date range filters |
| DF9.2 | D5 (Invoices) | P9.0 | Invoice Data | Invoice records for sales/GST reports |
| DF9.3 | D7 (Payments) | P9.0 | Payment Data | Payment records for collection reports |
| DF9.4 | D8 (Purchases) | P9.0 | Purchase & Expense Data | Purchase/expense records for P&L report |
| DF9.5 | D4 (Products) | P9.0 | Product & Stock Data | Product stock levels for stock report |
| DF9.6 | D2 (Customers) | P9.0 | Customer Data | Customer info for top-customer report |
| DF9.7 | D6 (Job Orders) | P9.0 | Job Order Data | Job order metrics for dashboard |
| DF9.8 | P9.0 | E1 (Admin) / E3 (Accountant) | Report Output | Sales summary, P&L statement, GST breakdown, stock report, dashboard data |

---

#### P10.0 — Manage Settings & Notifications

| Flow ID | From | To | Data Flow Label | Description |
|---------|------|----|----------------|-------------|
| DF10.1 | E1 (Admin) | P10.0 | Setting Values | Configuration key-value pairs, company details, logo/signature files |
| DF10.2 | P10.0 | D10 (Settings) | Setting Record | Store configuration and notification data |
| DF10.3 | D10 (Settings) | P10.0 | Setting Data | Retrieve current settings and notifications |
| DF10.4 | P10.0 | E1 (Admin) | Settings / Notifications | Current configuration, unread notifications, alert count |
| DF10.5 | P10.0 | D9 (Company) | Company Profile | Store/update company details, logo, signature |
| DF10.6 | D9 (Company) | P10.0 | Company Data | Retrieve company profile for display |
| DF10.7 | E1 (Admin) | P10.0 | Mark as Read | Notification ID to mark as read |

---

## 7. Complete DFD Level 1 — Component Mapping Table

### 7.1 Entity-Process Interaction Matrix

| Entity ↓ \ Process → | P1.0 Auth | P2.0 Cust | P3.0 Supp | P4.0 Prod | P5.0 Inv | P6.0 Job | P7.0 Pay | P8.0 Purch | P9.0 Report | P10.0 Set |
|---|---|---|---|---|---|---|---|---|---|---|
| **E1 Admin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **E2 Staff** | ✓ | — | — | — | ✓ | ✓ | ✓ | — | — | — |
| **E3 Accountant** | ✓ | — | — | — | — | — | ✓ | ✓ | ✓ | — |
| **E4 Customer** | — | ✓ | — | — | ✓ | ✓ | ✓ | — | — | — |
| **E5 Supplier** | — | — | ✓ | — | — | — | — | ✓ | — | — |
| **E6 Stripe** | — | — | — | — | — | — | ✓ | — | — | — |
| **E7 Email** | — | — | — | — | ✓ | — | — | — | — | — |

### 7.2 Process-Data Store Interaction Matrix

| Data Store ↓ \ Process → | P1.0 | P2.0 | P3.0 | P4.0 | P5.0 | P6.0 | P7.0 | P8.0 | P9.0 | P10.0 |
|---|---|---|---|---|---|---|---|---|---|---|
| **D1 Users** | R/W | — | — | — | — | R | — | — | — | — |
| **D2 Customers** | — | R/W | — | — | R/W | R | R/W | — | R | — |
| **D3 Suppliers** | — | — | R/W | — | — | — | W | R/W | — | — |
| **D4 Products** | — | — | — | R/W | R/W | — | — | — | R | — |
| **D5 Invoices** | — | R | — | — | R/W | — | R/W | — | R | — |
| **D6 Job Orders** | — | — | — | — | — | R/W | — | — | R | — |
| **D7 Payments** | — | R | — | — | — | — | R/W | — | R | — |
| **D8 Purchases** | — | — | — | — | — | — | — | R/W | R | — |
| **D9 Company** | — | — | — | — | R | — | — | — | — | R/W |
| **D10 Settings** | — | — | — | — | — | — | W | — | — | R/W |
| **D11 Stock Movements** | — | — | — | R/W | W | — | — | — | — | — |

> **R** = Read, **W** = Write, **R/W** = Read and Write

---

## 8. Step-by-Step Drawing Guide

Follow these steps to draw the DFD Level 1 on paper, Draw.io, Lucidchart, or MS Visio:

### Step 1: Set Up the Canvas

- Use **landscape** orientation (A3 or larger recommended)
- Leave margins on all four sides for external entities
- The center area is for processes and data stores

### Step 2: Place External Entities (Rectangles) on the Edges

Place the 7 external entities around the border of the diagram:

```
Position Layout:

         ┌──────────┐                    ┌──────────┐
         │ E1:Admin  │                    │E3:Accnt  │
         └──────────┘                    └──────────┘

┌──────────┐                                    ┌──────────┐
│E2:Staff  │           (CENTER AREA             │E5:Supplier│
└──────────┘         for Processes &             └──────────┘
                      Data Stores)
┌──────────┐                                    ┌──────────┐
│E4:Customer│                                   │E6:Stripe  │
└──────────┘                                    └──────────┘

                     ┌──────────┐
                     │E7:Email  │
                     └──────────┘
```

### Step 3: Place the 10 Processes (Circles/Rounded Rectangles) in the Center

Arrange the 10 processes in a logical flow, roughly in this layout:

```
Row 1 (Top):       P1.0 Auth          P10.0 Settings
Row 2:         P2.0 Customers    P3.0 Suppliers    P4.0 Products
Row 3 (Middle):    P5.0 Invoices      P6.0 Job Orders
Row 4:             P7.0 Payments      P8.0 Purchases
Row 5 (Bottom):               P9.0 Reports
```

### Step 4: Place Data Stores (Open-Ended Rectangles) Between Processes

Position data stores near the processes that access them most:

```
D1 Users           → Near P1.0
D2 Customers       → Between P2.0, P5.0, P7.0
D3 Suppliers       → Between P3.0, P8.0
D4 Products        → Near P4.0, connected to P5.0
D5 Invoices        → Between P5.0, P7.0, P9.0
D6 Job Orders      → Near P6.0
D7 Payments        → Near P7.0
D8 Purchases       → Near P8.0
D9 Company Profile  → Near P10.0, connected to P5.0
D10 Settings       → Near P10.0
D11 Stock Movements → Near P4.0
```

### Step 5: Draw Data Flows (Labeled Arrows)

Connect entities, processes, and data stores using arrows. Follow this order:

1. **Entity → Process arrows first** (incoming data from users)
2. **Process → Entity arrows** (outputs to users)
3. **Process → Data Store arrows** (writes/stores)
4. **Data Store → Process arrows** (reads/retrieves)
5. **Process → Process arrows** (inter-process data transfer, e.g., DF6.7 Job Order to Invoice conversion)

### Step 6: Label Every Arrow

Every arrow must have a descriptive label. Use the Flow IDs and labels from Section 6 above.

### Step 7: Validate the Diagram

Use the checklist in Section 10 to verify correctness.

---

## 9. DFD Level 1 — Textual Diagram

Below is the complete DFD Level 1 represented textually. Use this as a direct reference when drawing:

```
═══════════════════════════════════════════════════════════════════════════
                     DFD LEVEL 1 — BILLING SYSTEM
═══════════════════════════════════════════════════════════════════════════

    ┌───────────┐    Login Credentials     ╭─────────────────────╮
    │ E1: Admin │ ───────────────────────→  │      P1.0           │
    │ Manager   │ ←─────────────────────── │ Authenticate &      │
    └───────────┘   JWT Tokens + Profile   │ Manage Users        │
         │                                  ╰──────────┬──────────╯
         │                                        ↕ R/W
         │                               ══════════════════════
         │                               ║ D1 │ Users        ║
         │                               ══════════════════════
         │
         │   Customer Details    ╭─────────────────────╮
         │ ────────────────────→ │      P2.0           │
         │ ←──────────────────── │ Manage Customers    │
         │  Customer List/Ledger ╰──────────┬──────────╯
         │                              ↕ R/W
         │                     ══════════════════════
         │                     ║ D2 │ Customers    ║
         │                     ══════════════════════
         │
         │   Supplier Details    ╭─────────────────────╮
         │ ────────────────────→ │      P3.0           │
         │ ←──────────────────── │ Manage Suppliers    │
         │   Supplier List/Stats ╰──────────┬──────────╯
         │                              ↕ R/W
         │                     ══════════════════════
         │                     ║ D3 │ Suppliers    ║
         │                     ══════════════════════
         │
         │   Product Details     ╭─────────────────────╮
         │ ────────────────────→ │      P4.0           │
         │ ←──────────────────── │ Manage Products     │
         │  Product List/Alerts  │ & Inventory         │
         │                       ╰──────────┬──────────╯
         │                            ↕ R/W      ↕ R/W
         │                  ══════════════════  ═══════════════════
         │                  ║D4│Products    ║  ║D11│Stock Movmnts║
         │                  ══════════════════  ═══════════════════
         │
         │   Invoice Details     ╭─────────────────────╮    Inv Email+PDF
         │ ────────────────────→ │      P5.0           │ ──────────────→ ┌──────────┐
         │ ←──────────────────── │ Manage Invoices     │                 │E7: Email │
         │  Invoice List/PDF     ╰──┬────┬─────┬───────╯                 │ Service  │
         │                          │    │     │                         └──────────┘
         │                     ↕R/W │  R↓    W↓ Stock Deduction              │
         │              ═══════════════  D2    D4                   Email ↓ to
         │              ║D5│Invoices  ║  Cust   Products          ┌──────────┐
         │              ═══════════════  Balance                  │E4:Customer│
         │                    ↑            Update                 └──────────┘
         │                    │                                        │
         │   Job Order Details │  ╭─────────────────────╮              │
         │ ────────────────────│→ │      P6.0           │              │
         │ ←──────────────────── │ Manage Job Orders    │              │
    ┌──────────┐  JO List/PDF    ╰──────────┬──────────╯              │
    │E2: Staff │ ───→ P5.0/P6.0        ↕ R/W                         │
    └──────────┘      (also)    ══════════════════                    │
                                ║D6│Job Orders   ║                    │
                                ══════════════════                    │
         │                                                            │
         │  Payment Details      ╭─────────────────────╮    Pay Req.  │
         │ ────────────────────→ │      P7.0           │ ←────────────┘
         │ ←──────────────────── │ Process Payments    │
         │  Payment Stats        ╰──┬──────┬───────────╯
    ┌──────────┐                    │      │
    │E3:Accnt  │ ───→ P7.0/P8.0  ↕R/W    ↕ Checkout Session
    └──────────┘      P9.0  ═══════════  ┌──────────┐
                            ║D7│Payments║ │E6:Stripe │
                            ═══════════  └──────────┘
         │
         │  Purchase/Expense     ╭─────────────────────╮
         │ ────────────────────→ │      P8.0           │
    ┌──────────┐                 │ Manage Purchases    │ ←── ┌──────────┐
    │E5:Supplier│                │ & Expenses          │     │E5:Supplier│
    └──────────┘                 ╰──────────┬──────────╯     └──────────┘
                                       ↕ R/W
                                 ══════════════════
                                 ║D8│Purchases   ║
                                 ║   & Expenses  ║
                                 ══════════════════
         │
         │  Report Request       ╭─────────────────────╮
         │ ────────────────────→ │      P9.0           │
         │ ←──────────────────── │ Generate Reports    │
         │   Report Output       ╰─────────────────────╯
         │                         ↑ Reads from:
         │                         D2, D4, D5, D6, D7, D8
         │
         │  Settings/Company     ╭─────────────────────╮
         │ ────────────────────→ │      P10.0          │
         │ ←──────────────────── │ Manage Settings     │
         │  Config/Notifications │ & Notifications     │
                                 ╰──────────┬──────────╯
                                       ↕ R/W        ↕ R/W
                              ══════════════════  ═══════════════
                              ║D10│Settings &  ║  ║D9│Company   ║
                              ║    Notificatns ║  ║   Profile   ║
                              ══════════════════  ═══════════════

═══════════════════════════════════════════════════════════════════════════
         INTER-PROCESS DATA FLOWS:
         P6.0 ────→ P5.0  : Invoice Conversion Data (Job Order → Invoice)
         P7.0 ────→ D10   : Payment Notification
         P5.0 ←──── D9    : Company Details (for PDF generation)
═══════════════════════════════════════════════════════════════════════════
```

---

## 10. Validation Checklist

After drawing, verify your DFD Level 1 against this checklist:

### Rule Compliance

| # | Check | Status |
|---|-------|--------|
| 1 | No direct flow between two external entities | ☐ Verified |
| 2 | No direct flow between two data stores | ☐ Verified |
| 3 | No direct flow between entity and data store | ☐ Verified |
| 4 | Every process has at least one input AND one output | ☐ Verified |
| 5 | All data flows are labeled with meaningful names | ☐ Verified |
| 6 | All processes are numbered (1.0 through 10.0) | ☐ Verified |
| 7 | All arrows are unidirectional | ☐ Verified |
| 8 | Processes transform data (not just pass-through) | ☐ Verified |
| 9 | Data store names are nouns | ☐ Verified |
| 10 | Process names are verb phrases | ☐ Verified |

### Completeness

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 11 | Total External Entities drawn | 7 | ☐ |
| 12 | Total Processes drawn | 10 | ☐ |
| 13 | Total Data Stores drawn | 11 | ☐ |
| 14 | Total Data Flows drawn | 60+ | ☐ |
| 15 | All entities from Level 0 preserved | Yes | ☐ |
| 16 | Inter-process flows shown | P6.0→P5.0 | ☐ |

### Balancing (Level 0 ↔ Level 1)

| # | Check | Status |
|---|-------|--------|
| 17 | All Level 0 input flows appear in Level 1 | ☐ Verified |
| 18 | All Level 0 output flows appear in Level 1 | ☐ Verified |
| 19 | No new external entities added that weren't in Level 0 | ☐ Verified |

---

## 11. Summary Count

| Component | Count | Identifiers |
|-----------|-------|-------------|
| **External Entities** | 7 | E1–E7 |
| **Processes** | 10 | P1.0–P10.0 |
| **Data Stores** | 11 | D1–D11 |
| **Data Flows** | 63 | DF1.1–DF10.7 |

---

## 12. Recommended Drawing Tools

| Tool | Type | Best For |
|------|------|----------|
| **Draw.io (diagrams.net)** | Free, Web-based | Quick diagramming, export to PNG/PDF/SVG |
| **Lucidchart** | Paid, Web-based | Professional diagrams, collaboration |
| **Microsoft Visio** | Paid, Desktop | Enterprise-grade DFD templates |
| **StarUML** | Free/Paid | UML + DFD support |
| **Creately** | Free/Paid, Web | DFD-specific templates |
| **Paper + Pen** | Manual | Initial brainstorming and sketching |

### Draw.io Quick Start

1. Go to [https://app.diagrams.net](https://app.diagrams.net)
2. Select **Create New Diagram → Software → Data Flow Diagram**
3. Use the DFD shape library (External Entity, Process, Data Store, Data Flow)
4. Follow the placement guide in Step 2–6 above
5. Export as PNG/PDF for documentation

---

> **Document Version:** 1.0  
> **Project:** Lakshmi Printing Works — Billing & Inventory Management System  
> **Diagram Type:** Data Flow Diagram — Level 1  
> **Total Components:** 7 Entities | 10 Processes | 11 Data Stores | 63 Data Flows
