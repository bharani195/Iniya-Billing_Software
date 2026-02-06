# Lakshmi Printing Works - Billing Software

A comprehensive web-based **Billing & Inventory Management System** built with React, Django REST Framework, and PostgreSQL(Neon).

![Dashboard](docs/dashboard.png)

## ✨ Features

### 🎯 Core Modules
- **Dashboard** - Real-time sales analytics, charts, low stock alerts
- **Customers** - Full customer management with ledger tracking
- **Suppliers** - Supplier management with payable tracking
- **Products** - Inventory management with stock alerts, GST rates
- **Invoices** - Smart invoice builder with auto GST calculations
- **Payments** - Customer payment collection tracking
- **Purchases** - Supplier purchase management
- **Expenses** - Business expense tracking
- **Reports** - Sales, Purchase, P&L, GST, Stock reports
- **Settings** - Application configuration
- **Company Profile** - Business info, logo, bank details

### 💡 Smart Features
- **GST Compliant** - CGST/SGST/IGST auto-calculations
- **Real-time Totals** - Live invoice calculations
- **Low Stock Alerts** - Automatic inventory alerts
- **Role-based Access** - Admin, Staff, Accountant roles
- **Responsive Design** - Works on desktop and tablet

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| UI | Tailwind CSS |
| Charts | ApexCharts |
| Backend | Django 5.x + DRF |
| Database | PostgreSQL (Neon) |
| Auth | JWT (Simple JWT) |

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or Neon account)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:5173 in your browser.

## 📁 Project Structure

```
Billing Software/
├── backend/
│   ├── apps/
│   │   ├── authentication/   # User auth & roles
│   │   ├── company/          # Company profile
│   │   ├── customers/        # Customer management
│   │   ├── suppliers/        # Supplier management
│   │   ├── products/         # Inventory management
│   │   ├── invoices/         # Invoice & billing
│   │   ├── payments/         # Payment tracking
│   │   ├── purchases/        # Purchase management
│   │   ├── reports/          # Report generation
│   │   └── settings/         # App configuration
│   ├── config/               # Django settings
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/       # Reusable components
    │   ├── context/          # React context
    │   ├── layouts/          # Page layouts
    │   ├── pages/            # All pages
    │   └── services/         # API services
    ├── package.json
    └── tailwind.config.js
```

## 🔒 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/auth/` | Authentication |
| `/api/customers/` | Customer CRUD |
| `/api/suppliers/` | Supplier CRUD |
| `/api/products/` | Product & Stock |
| `/api/invoices/` | Invoice management |
| `/api/payments/` | Payment tracking |
| `/api/purchases/` | Purchase management |
| `/api/reports/` | Report generation |
| `/api/settings/` | App settings |
| `/api/company/` | Company profile |

## 🎨 Screenshots

### Login Page
Beautiful login with animated gradient background

### Dashboard
Real-time stats, sales charts, low stock alerts

### Invoice Builder
Smart builder with live GST calculations

### Reports
Comprehensive sales, P&L, GST reports

## 📄 License

MIT License - See LICENSE file

## 👨‍💻 Author

Built for **Lakshmi Printing Works**

---

Made with ❤️ using React + Django
# Iniya-Billing_Software
