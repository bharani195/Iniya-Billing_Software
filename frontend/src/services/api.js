import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem('access_token', access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login/', credentials),
    logout: () => api.post('/auth/logout/', { refresh: localStorage.getItem('refresh_token') }),
    getProfile: () => api.get('/auth/profile/'),
    updateProfile: (data) => api.put('/auth/profile/', data),
    changePassword: (data) => api.post('/auth/change-password/', data),
    resetPassword: (data) => api.post('/auth/reset-password/', data),
    getDashboardStats: () => api.get('/auth/dashboard-stats/'),
};

// Company API
export const companyAPI = {
    getProfile: () => api.get('/company/profile/'),
    updateProfile: (data) => api.put('/company/profile/', data),
    uploadLogo: (formData) => api.post('/company/upload-logo/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    uploadSignature: (formData) => api.post('/company/upload-signature/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// Customers API
export const customersAPI = {
    getAll: (params) => api.get('/customers/', { params }),
    getById: (id) => api.get(`/customers/${id}/`),
    create: (data) => api.post('/customers/', data),
    update: (id, data) => api.put(`/customers/${id}/`, data),
    delete: (id) => api.delete(`/customers/${id}/`),
    getDropdown: () => api.get('/customers/dropdown/'),
    getWithDues: () => api.get('/customers/with_dues/'),
    getLedger: (id) => api.get(`/customers/${id}/ledger/`),
    getStats: () => api.get('/customers/stats/'),
};

// Suppliers API
export const suppliersAPI = {
    getAll: (params) => api.get('/suppliers/', { params }),
    getById: (id) => api.get(`/suppliers/${id}/`),
    create: (data) => api.post('/suppliers/', data),
    update: (id, data) => api.put(`/suppliers/${id}/`, data),
    delete: (id) => api.delete(`/suppliers/${id}/`),
    getDropdown: () => api.get('/suppliers/dropdown/'),
    getStats: () => api.get('/suppliers/stats/'),
};

// Products API
export const productsAPI = {
    getAll: (params) => api.get('/products/', { params }),
    getById: (id) => api.get(`/products/${id}/`),
    create: (data) => api.post('/products/', data),
    update: (id, data) => api.put(`/products/${id}/`, data),
    delete: (id) => api.delete(`/products/${id}/`),
    getDropdown: () => api.get('/products/dropdown/'),
    getLowStock: () => api.get('/products/low_stock/'),
    getDeadStock: () => api.get('/products/dead_stock/'),
    adjustStock: (id, data) => api.post(`/products/${id}/adjust_stock/`, data),
    getStats: () => api.get('/products/stats/'),
    getTopSelling: (limit = 10) => api.get('/products/top_selling/', { params: { limit } }),
    // Categories
    getCategories: () => api.get('/products/categories/'),
    createCategory: (data) => api.post('/products/categories/', data),
    updateCategory: (id, data) => api.put(`/products/categories/${id}/`, data),
    deleteCategory: (id) => api.delete(`/products/categories/${id}/`),
};

// Invoices API
export const invoicesAPI = {
    getAll: (params) => api.get('/invoices/', { params }),
    getById: (id) => api.get(`/invoices/${id}/`),
    create: (data) => api.post('/invoices/', data),
    update: (id, data) => api.put(`/invoices/${id}/`, data),
    delete: (id) => api.delete(`/invoices/${id}/`),
    addPayment: (id, data) => api.post(`/invoices/${id}/add_payment/`, data),
    cancel: (id) => api.post(`/invoices/${id}/cancel/`),
    getPdfData: (id) => api.get(`/invoices/${id}/pdf_data/`),
    generateBill: (id) => api.get(`/invoices/${id}/generate_bill/`, { responseType: 'blob' }),
    sendEmail: (id) => api.post(`/invoices/${id}/send_email/`),
    getNextNumber: () => api.get('/invoices/next_number/'),
    getStats: () => api.get('/invoices/stats/'),
    getRecent: (limit = 10) => api.get('/invoices/recent/', { params: { limit } }),
};

// Payments API
export const paymentsAPI = {
    getAll: (params) => api.get('/payments/', { params }),
    getById: (id) => api.get(`/payments/${id}/`),
    create: (data) => api.post('/payments/', data),
    update: (id, data) => api.put(`/payments/${id}/`, data),
    delete: (id) => api.delete(`/payments/${id}/`),
    getStats: () => api.get('/payments/stats/'),
    getRecent: (limit = 10) => api.get('/payments/recent/', { params: { limit } }),
    // Payments Out
    getOutAll: (params) => api.get('/payments/out/', { params }),
    createOut: (data) => api.post('/payments/out/', data),
};

// Purchases API
export const purchasesAPI = {
    getAll: (params) => api.get('/purchases/', { params }),
    getById: (id) => api.get(`/purchases/${id}/`),
    create: (data) => api.post('/purchases/', data),
    update: (id, data) => api.put(`/purchases/${id}/`, data),
    delete: (id) => api.delete(`/purchases/${id}/`),
    getStats: () => api.get('/purchases/stats/'),
    // Expenses
    getExpenses: (params) => api.get('/purchases/expenses/', { params }),
    createExpense: (data) => api.post('/purchases/expenses/', data),
    updateExpense: (id, data) => api.put(`/purchases/expenses/${id}/`, data),
    deleteExpense: (id) => api.delete(`/purchases/expenses/${id}/`),
    getExpenseStats: () => api.get('/purchases/expenses/stats/'),
};

// Reports API
export const reportsAPI = {
    getSales: (params) => api.get('/reports/sales/', { params }),
    getPurchase: (params) => api.get('/reports/purchase/', { params }),
    getProfitLoss: (params) => api.get('/reports/profit-loss/', { params }),
    getGST: (params) => api.get('/reports/gst/', { params }),
    getStock: () => api.get('/reports/stock/'),
    getDashboard: () => api.get('/reports/dashboard/'),
    getStaffSalary: (params) => api.get('/reports/staff-salary/', { params }),
    downloadStaffSalaryExcel: (params) => api.get('/reports/staff-salary/excel/', { params, responseType: 'blob' }),
};

// Notifications API (for real-time alerts)
export const notificationsAPI = {
    // Get notification counts (for badge)
    getCounts: async () => {
        try {
            const [jobStats, dashboardData] = await Promise.all([
                api.get('/joborders/stats/'),
                api.get('/reports/dashboard/')
            ]);
            return {
                overdue_jobs: jobStats.data?.overdue || 0,
                pending_payments: dashboardData.data?.pending?.count || 0,
                low_stock: dashboardData.data?.counts?.low_stock || 0,
                total: (jobStats.data?.overdue || 0) + (dashboardData.data?.counts?.low_stock || 0)
            };
        } catch {
            return { overdue_jobs: 0, pending_payments: 0, low_stock: 0, total: 0 };
        }
    },
    // Get payment notifications via axios (proper token handling)
    getPaymentNotifications: () => api.get('/settings/notifications/'),
    // Mark specific notifications as read
    markAsRead: (ids) => api.post('/settings/notifications/', { ids }),
    // Mark all notifications as read
    markAllAsRead: () => api.post('/settings/notifications/', { mark_all: true }),
};

// Settings API
export const settingsAPI = {
    getAll: (category) => api.get('/settings/', { params: { category } }),
    update: (settings) => api.post('/settings/', settings),
    get: (key) => api.get(`/settings/${key}/`),
    set: (key, value, category) => api.put(`/settings/${key}/`, { value, category }),
    initDefaults: () => api.post('/settings/defaults/'),
};

// Orders API
export const jobordersAPI = {
    getAll: (params) => api.get('/joborders/', { params }),
    getById: (id) => api.get(`/joborders/${id}/`),
    create: (data) => api.post('/joborders/', data),
    update: (id, data) => api.put(`/joborders/${id}/`, data),
    delete: (id) => api.delete(`/joborders/${id}/`),
    updateStatus: (id, status) => api.post(`/joborders/${id}/update_status/`, { status }),
    addService: (id, data) => api.post(`/joborders/${id}/add_service/`, data),
    convertToInvoice: (id) => api.post(`/joborders/${id}/convert_to_invoice/`),
    receiveAdvance: (id, amount) => api.post(`/joborders/${id}/receive_advance/`, { amount }),
    getStats: () => api.get('/joborders/stats/'),
    getRecent: (limit = 10) => api.get('/joborders/recent/', { params: { limit } }),
    getNextNumber: () => api.get('/joborders/next_number/'),

    // Material Types
    getMaterialTypes: () => api.get('/joborders/material-types/'),
    createMaterialType: (data) => api.post('/joborders/material-types/', data),
    updateMaterialType: (id, data) => api.put(`/joborders/material-types/${id}/`, data),
    deleteMaterialType: (id) => api.delete(`/joborders/material-types/${id}/`),

    // Printing Types
    getPrintingTypes: () => api.get('/joborders/printing-types/'),
    createPrintingType: (data) => api.post('/joborders/printing-types/', data),
    updatePrintingType: (id, data) => api.put(`/joborders/printing-types/${id}/`, data),
    deletePrintingType: (id) => api.delete(`/joborders/printing-types/${id}/`),

    // Service Rates
    getServiceRates: () => api.get('/joborders/service-rates/'),
    createServiceRate: (data) => api.post('/joborders/service-rates/', data),
    updateServiceRate: (id, data) => api.put(`/joborders/service-rates/${id}/`, data),
    deleteServiceRate: (id) => api.delete(`/joborders/service-rates/${id}/`),

    // Generate Bill PDF
    generateBill: (id) => api.get(`/joborders/${id}/generate_bill/`, { responseType: 'blob' }),
};

// Staff API
export const staffAPI = {
    getAll: (params) => api.get('/staff/members/', { params }),
    getById: (id) => api.get(`/staff/members/${id}/`),
    create: (data) => api.post('/staff/members/', data),
    update: (id, data) => api.put(`/staff/members/${id}/`, data),
    delete: (id) => api.delete(`/staff/members/${id}/`),
    getStats: () => api.get('/staff/members/stats/'),
    getDropdown: () => api.get('/staff/members/dropdown/'),
    // Attendance
    getAttendance: (params) => api.get('/staff/attendance/', { params }),
    bulkMarkAttendance: (data) => api.post('/staff/attendance/bulk_mark/', data),
    getMonthlySummary: (params) => api.get('/staff/attendance/monthly_summary/', { params }),
    // Pay Slips
    getPaySlips: (params) => api.get('/staff/payslips/', { params }),
    generatePaySlip: (data) => api.post('/staff/payslips/generate/', data),
    downloadPaySlip: (id) => api.get(`/staff/payslips/${id}/download_pdf/`, { responseType: 'blob' }),
    markPaid: (id, data) => api.post(`/staff/payslips/${id}/mark_paid/`, data),
    resetPaid: (id) => api.post(`/staff/payslips/${id}/reset_paid/`),
    removePaySlip: (id) => api.delete(`/staff/payslips/${id}/`),
    // Worker Assignments
    getAssignments: (params) => api.get('/staff/assignments/', { params }),
    bulkAssign: (data) => api.post('/staff/assignments/bulk_assign/', data),
    updateAssignmentStatus: (id, data) => api.post(`/staff/assignments/${id}/update_status/`, data),
    deleteAssignment: (id) => api.delete(`/staff/assignments/${id}/`),
    // Holidays
    getHolidays: (params) => api.get('/staff/holidays/', { params }),
    createHoliday: (data) => api.post('/staff/holidays/', data),
    deleteHoliday: (id) => api.delete(`/staff/holidays/${id}/`),
    bulkCreateHolidays: (data) => api.post('/staff/holidays/bulk_create/', data),
    getHolidaysByMonth: (params) => api.get('/staff/holidays/by_month/', { params }),
};

export default api;
