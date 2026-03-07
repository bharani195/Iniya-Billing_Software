import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import CreateInvoice from './pages/CreateInvoice';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import JobOrders from './pages/JobOrders';
import CreateJobOrder from './pages/CreateJobOrder';
import ServiceRates from './pages/ServiceRates';
import AddCustomer from './pages/AddCustomer';
import PaymentPage from './pages/PaymentPage';
import StaffManagement from './pages/StaffManagement';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-50">
                <div className="text-center">
                    <div className="spinner text-primary-500 w-10 h-10 mx-auto mb-4"></div>
                    <p className="text-dark-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } />

            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/add" element={<AddCustomer />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="joborders" element={<JobOrders />} />
                <Route path="joborders/create" element={<CreateJobOrder />} />
                <Route path="joborders/:id" element={<CreateJobOrder />} />
                <Route path="joborders/:id/edit" element={<CreateJobOrder />} />
                <Route path="service-rates" element={<ServiceRates />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/create" element={<CreateInvoice />} />
                <Route path="invoices/:id" element={<CreateInvoice />} />
                <Route path="invoices/:id/edit" element={<CreateInvoice />} />
                <Route path="payments" element={<Payments />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="reports" element={<Reports />} />
                <Route path="staff" element={<StaffManagement />} />
                <Route path="settings" element={<Settings />} />
            </Route>

            {/* Public Payment Page (No auth required) */}
            <Route path="/pay/:invoiceId/:token" element={<PaymentPage />} />
            <Route path="/pay/:invoiceId/:token/success" element={<PaymentPage />} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#1e293b',
                            color: '#f8fafc',
                            borderRadius: '12px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#22c55e',
                                secondary: '#f8fafc',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#f8fafc',
                            },
                        },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
