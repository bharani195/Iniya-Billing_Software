# Lakshmi Printing Works — Billing & Inventory Management System

## Abstract

**Lakshmi Printing Works — Billing & Inventory Management System** is a full-stack, web-based enterprise application designed to digitize and streamline the end-to-end business operations of a printing industry firm operating in the Indian market. The system addresses the critical need for GST-compliant invoicing, job order lifecycle management, inventory control, financial reporting, and online payment collection — consolidating these functions into a single, unified platform.

---

## 1. Problem Statement

Small and medium printing businesses in India face operational challenges in managing diverse workflows — from receiving print job orders and tracking multi-stage production, to generating tax-compliant invoices, maintaining inventory, and reconciling customer payments. Manual or fragmented systems lead to billing errors, tax miscalculations, stock discrepancies, delayed payments, and limited business visibility. There is a need for an integrated, domain-specific solution that handles the unique requirements of the printing industry while adhering to India's Goods and Services Tax (GST) regulations.

---

## 2. Proposed Solution

The application is built on a modern decoupled architecture comprising a **Django REST Framework** backend serving RESTful APIs and a **React 18** single-page application (SPA) frontend powered by **Vite**. Authentication is handled via **JSON Web Tokens (JWT)** with role-based access control supporting Admin, Staff, and Accountant roles. The backend is organized into **12 modular Django applications** — Authentication, Company Profile, Customers, Suppliers, Products, Invoices, Job Orders, Payments, Purchases, Reports, Settings, and Notifications — exposing over **90 REST API endpoints**.

---

## 3. Key Features

### 3.1 GST-Compliant Invoicing

Supports multiple document types (Tax Invoice, Quotation, Proforma Invoice, Delivery Challan, Credit Note) with automatic computation of CGST/SGST (intra-state) or IGST (inter-state) taxes based on HSN/SAC codes and configurable tax rates (0%–28%).

### 3.2 Job Order Workflow Management

A 9-stage status pipeline (Received → Designing → Color Separation → Printing → Drying → Finishing → Ready → Delivered) with worker assignment, design file uploads, priority levels, advance payment tracking, and seamless conversion of completed job orders into invoices.

### 3.3 Inventory & Stock Management

Real-time stock tracking with automatic deduction on sales, low-stock and dead-stock alerts, stock adjustment capabilities, and a complete stock movement audit trail recording all inflows, outflows, returns, and adjustments.

### 3.4 Online Payments via Stripe

Secure, token-based public payment links enabling customers to pay invoices online through Stripe Checkout in INR, with automatic payment recording, duplicate prevention, and real-time admin notifications.

### 3.5 Professional PDF Generation

ReportLab-based A4 invoice and job order documents featuring company branding, itemized tables, GST breakdowns, amount-in-words (Indian numbering system — Lakhs/Crores), bank account details, digital signature, and terms & conditions.

### 3.6 Email & WhatsApp Integration

Automated HTML invoice emails with PDF attachments and "Pay Now" links, alongside formatted WhatsApp message generation for sharing invoices and job order updates with customers.

### 3.7 Financial Reports & Dashboard

Comprehensive reporting suite including Sales Reports, Purchase Reports, Profit & Loss Statements, GST Reports, and Stock Reports — all with date-range filters. A real-time dashboard presents 7-day sales trends, payment mode distribution charts, top customers, job order metrics, and month-over-month growth percentages using ApexCharts.

### 3.8 Customer Ledger & Credit Management

Complete transaction history per customer with credit limit and credit period enforcement, due balance tracking, and outstanding payment visibility.

### 3.9 Notification System

Real-time in-app notifications with 10-second polling, toast alerts for new payments, and an unread badge counter.

---

## 4. System Architecture

The system follows a **client-server** architecture with a clear separation between the presentation layer and the business logic/data layer, communicating over HTTP via RESTful APIs.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              React 18 SPA (Vite + Tailwind CSS)           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐  │  │
│  │  │  Pages   │ │Components│ │  Context   │ │  Services  │  │  │
│  │  │ (19 views│ │(Reusable)│ │(AuthContext│ │ (Axios +   │  │  │
│  │  │  )       │ │          │ │ )          │ │  JWT)      │  │  │
│  │  └──────────┘ └──────────┘ └───────────┘ └────────────┘  │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │ HTTP (REST API + JWT)                 │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                     SERVER (Django)                              │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │            Django REST Framework (API Layer)               │  │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌─────────────────┐  │  │
│  │  │  Auth  │ │  CRUD  │ │ Reports  │ │  PDF / Email /  │  │  │
│  │  │  JWT   │ │  Views │ │  Views   │ │  Stripe Utils   │  │  │
│  │  └────────┘ └────────┘ └──────────┘ └─────────────────┘  │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │              12 Django Applications (Models)               │  │
│  │  Auth │ Company │ Customers │ Suppliers │ Products │       │  │
│  │  Invoices │ Job Orders │ Payments │ Purchases │            │  │
│  │  Reports │ Settings                                        │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│            ┌─────────────┴─────────────┐                        │
│            │   PostgreSQL (Neon Cloud)  │                        │
│            │   / SQLite (Fallback)      │                        │
│            └───────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Technology Stack

| Layer              | Technologies                                                                    |
|--------------------|---------------------------------------------------------------------------------|
| **Frontend**       | React 18, Vite 5, Tailwind CSS 3.3, React Router 6, Axios, ApexCharts, react-hot-toast |
| **Backend**        | Django 5.x, Django REST Framework 3.14+, Simple JWT, ReportLab 4.0, Pillow 10+  |
| **Database**       | PostgreSQL (Neon cloud) with SQLite fallback                                     |
| **Payment Gateway**| Stripe (INR currency)                                                            |
| **Communication**  | Django SMTP (Gmail) for email, WhatsApp Web API for message sharing              |
| **Infrastructure** | CORS-enabled REST API, media file storage for logos/signatures/designs            |

---

## 6. Backend Modules

The backend is composed of **12 modular Django applications**, each encapsulating a specific business domain:

| # | Module           | Description                                                                 |
|---|------------------|-----------------------------------------------------------------------------|
| 1 | **Authentication** | Custom user model with roles (Admin/Staff/Accountant), JWT login/logout, profile management, password reset, dashboard statistics |
| 2 | **Company**        | Singleton company profile — name, logo, address, GSTIN, PAN, bank details (account, IFSC, UPI), digital signature, invoice prefix configuration |
| 3 | **Customers**      | Customer CRUD with GSTIN/PAN, balance tracking (opening/current), credit limit & period, customer ledger, due tracking |
| 4 | **Suppliers**      | Supplier CRUD with contact person, dual phone fields, GSTIN/PAN, payable balance tracking |
| 5 | **Products**       | Category and product management, SKU/HSN codes, sale/purchase/MRP pricing, GST rates (0–28%), 13 unit types, stock management with min/max levels, stock movement audit trail, low-stock and dead-stock detection |
| 6 | **Invoices**       | Multi-type invoicing (Tax Invoice, Quotation, Proforma, Delivery Challan, Credit Note), auto-generated invoice numbers, CGST/SGST/IGST calculation, discount support (% or fixed), payment token generation, stock auto-deduction, customer balance updates, PDF generation, email dispatch |
| 7 | **Job Orders**     | Material/printing type masters, configurable service rates, 9-stage status workflow, priority levels (Normal/Urgent/Express), worker assignment (M2M), design file upload, advance tracking, convert-to-invoice, PDF bill generation, full status history audit trail |
| 8 | **Payments**       | Incoming payments (customer → business) and outgoing payments (business → supplier), multiple payment modes (Cash/UPI/Bank/Card/Cheque/Online), cheque detail tracking, auto-notification generation |
| 9 | **Purchases**      | Purchase bill management with supplier linkage, line-item tracking, balance calculation, expense tracking with 8 categories (Rent/Salary/Utilities/Transport/Maintenance/Office/Marketing/Other) |
| 10 | **Reports**       | Sales report (daily breakdown with invoices, tax, discounts), Purchase report, Profit & Loss statement (Income − COGS = Gross Profit − Expenses = Net Profit), GST report (output tax by rate), Stock report (inventory summary, category breakdown, low stock), Dashboard data (aggregated metrics with trends) |
| 11 | **Settings**      | Key-value configuration store with categories (General/Invoice/Tax/Print/Notification), default settings initialization |
| 12 | **Notifications** | Admin notification system (payment/order/alert/info types), unread tracking, linked to invoices and payments |

---

## 7. Frontend Modules

The frontend is a **React 18 Single Page Application** with **19 page views**:

| Page               | Functionality                                                        |
|--------------------|----------------------------------------------------------------------|
| **Login**          | JWT authentication with animated gradient UI                         |
| **Dashboard**      | Real-time stats, 7-day sales trend (ApexCharts), top customers, job metrics |
| **Customers**      | Customer list with search, filter, inline editing                    |
| **Add Customer**   | Customer creation form with quick job order creation                 |
| **Suppliers**      | Supplier management interface                                        |
| **Products**       | Product inventory with stock management, low-stock indicators        |
| **Job Orders**     | Job order list with status tracking, filtering, status updates       |
| **Create Job Order** | Complex form — services, worker assignment, design upload          |
| **Service Rates**  | Service rate configuration (CRUD)                                    |
| **Invoices**       | Invoice list with actions (PDF download, email, payment, cancel)     |
| **Create Invoice** | Smart invoice builder with live GST calculations                     |
| **Payments**       | Payment tracking (incoming & outgoing)                               |
| **Purchases**      | Purchase bill management                                             |
| **Expenses**       | Expense tracking with category breakdown                             |
| **Reports**        | Sales, Purchase, P&L, GST, Stock reports with date filters           |
| **Settings**       | Application configuration                                           |
| **Company Profile**| Company info, logo upload, signature upload, bank details            |
| **Payment Page**   | Public (unauthenticated) Stripe payment page                        |
| **Quick Order**    | Simplified order entry                                               |

---

## 8. Database Schema (Key Relationships)

```
User (1) ──────→ (N) Invoice (created_by)
User (1) ──────→ (N) JobOrder (created_by)
User (M) ←─────→ (N) JobOrder (assigned_workers)

Customer (1) ──→ (N) Invoice
Customer (1) ──→ (N) Payment
Customer (1) ──→ (N) JobOrder

Supplier (1) ──→ (N) Purchase
Supplier (1) ──→ (N) PaymentOut

Invoice (1) ───→ (N) InvoiceItem
Invoice (1) ───→ (N) Payment
Invoice (1) ←── (1) JobOrder

Purchase (1) ──→ (N) PurchaseItem

Product (1) ───→ (N) InvoiceItem
Product (1) ───→ (N) StockMovement
Category (1) ──→ (N) Product

JobOrder (1) ──→ (N) JobOrderService
JobOrder (1) ──→ (N) JobStatusHistory
MaterialType (1) → (N) JobOrder
PrintingType (1) → (N) JobOrder
ServiceRate (1) ─→ (N) JobOrderService
```

---

## 9. API Endpoints Summary

The system exposes **90+ REST API endpoints** across 11 URL prefixes:

| Prefix             | Module          | Key Operations                                                  |
|--------------------|-----------------|----------------------------------------------------------------|
| `/api/auth/`       | Authentication  | Login, logout, profile, password change/reset, user management, dashboard stats |
| `/api/company/`    | Company         | Profile CRUD, logo/signature upload                             |
| `/api/customers/`  | Customers       | CRUD, dropdown, ledger, dues tracking, stats                    |
| `/api/suppliers/`  | Suppliers       | CRUD, dropdown, stats                                           |
| `/api/products/`   | Products        | CRUD, categories, stock adjust, low/dead stock, top selling     |
| `/api/invoices/`   | Invoices        | CRUD, add payment, cancel, PDF download, email dispatch, public payment (Stripe) |
| `/api/payments/`   | Payments        | Incoming/Outgoing CRUD, stats, recent                           |
| `/api/purchases/`  | Purchases       | Purchase CRUD, Expense CRUD, stats                              |
| `/api/reports/`    | Reports         | Sales, Purchase, P&L, GST, Stock, Dashboard data                |
| `/api/settings/`   | Settings        | Key-value CRUD, defaults initialization, notifications          |
| `/api/joborders/`  | Job Orders      | CRUD, status updates, services, convert-to-invoice, PDF bill, material/printing/rate masters |

---

## 10. Scope & Impact

The system serves as a **production-ready, domain-specific billing platform** tailored for the Indian printing industry. It manages the complete business cycle — from customer and supplier onboarding, through job order creation and production tracking, to invoicing, payment collection, expense recording, and financial analysis.

The **role-based access model** ensures operational security, while the **responsive dark-themed UI** provides an optimized user experience across devices. By automating tax calculations, invoice generation, stock management, and financial reporting, the system significantly reduces manual effort, minimizes errors, and provides real-time business intelligence to support data-driven decision-making.

### Quantitative Summary

| Metric                  | Value           |
|------------------------|-----------------|
| Backend Django Apps     | 12              |
| REST API Endpoints     | 90+             |
| Frontend Page Views    | 19              |
| Invoice Types Supported| 5               |
| Job Order Status Stages| 9               |
| Payment Modes          | 6               |
| GST Tax Rates          | 6 (0–28%)       |
| Report Types           | 6               |
| User Roles             | 3               |
| Expense Categories     | 8               |
| Product Unit Types     | 13              |

---

## 11. Keywords

Billing Software, GST Invoicing, Job Order Management, Inventory Management, Django REST Framework, React, Stripe Payments, PDF Generation, Printing Industry, Financial Reporting, CGST/SGST/IGST, Customer Ledger, Stock Management, Role-Based Access Control, Single Page Application.

---

> **Project:** Lakshmi Printing Works — Billing & Inventory Management System  
> **Architecture:** Django REST Framework + React 18 (Vite)  
> **Database:** PostgreSQL (Neon) / SQLite  
> **Domain:** Printing Industry — Indian Market (GST Compliant)
