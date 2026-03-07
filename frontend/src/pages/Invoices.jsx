import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiEye, FiPrinter, FiDownload, FiFileText, FiMail, FiTrash2, FiAlertTriangle, FiEdit } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { invoicesAPI } from '../services/api';
import { shareInvoiceViaWhatsApp } from '../utils/whatsappUtils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Dropdown from '../components/Dropdown';

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all animate-fadeIn" onClick={e => e.stopPropagation()}>
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <FiAlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Invoice</h3>
                        <p className="text-gray-500 mb-6">
                            Are you sure you want to delete invoice <span className="font-semibold text-gray-700">{itemName}</span>? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button onClick={onClose} className="px-6 py-2.5 text-gray-600 font-medium rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={onConfirm} className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-200 hover:shadow-xl transition-all">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Email Confirmation Modal Component
const EmailConfirmModal = ({ isOpen, onClose, onConfirm, invoice }) => {
    if (!isOpen || !invoice) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all animate-fadeIn" onClick={e => e.stopPropagation()}>
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                            <FiMail className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Send Invoice Email</h3>
                        <p className="text-gray-500 mb-2">
                            Send invoice <span className="font-semibold text-gray-700">{invoice.invoice_number}</span> to:
                        </p>
                        <p className="text-sm font-semibold text-gray-800 bg-gray-50 px-4 py-2 rounded-lg mb-5">
                            {invoice.customer_name} — {invoice.customer_email || 'No email'}
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button onClick={onClose} className="px-6 py-2.5 text-gray-600 font-medium rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={onConfirm} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center gap-2">
                                <FiMail className="w-4 h-4" /> Send Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, invoice: null });
    const [emailModal, setEmailModal] = useState({ isOpen: false, invoice: null });

    useEffect(() => { fetchInvoices(); }, []);

    const fetchInvoices = async () => {
        try {
            const response = await invoicesAPI.getAll();
            setInvoices(response.data.results || response.data);
        } catch { toast.error('Failed to fetch invoices'); }
        finally { setLoading(false); }
    };

    const filtered = invoices.filter(inv => {
        const matchSearch = inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
            inv.customer_name?.toLowerCase().includes(search.toLowerCase());
        if (statusFilter === 'all') return matchSearch;
        return matchSearch && inv.status === statusFilter;
    });

    const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString('en-IN')}`;

    const getStatusBadge = (status) => {
        const styles = {
            paid: 'bg-emerald-100 text-emerald-700',
            partial: 'bg-amber-100 text-amber-700',
            pending: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</span>;
    };

    const shareViaWhatsApp = (invoice) => {
        const success = shareInvoiceViaWhatsApp(invoice, (error) => toast.error(error));
        if (success) {
            toast.success('Opening WhatsApp...');
        }
    };

    // Preview invoice bill using invoice's own generate_bill endpoint
    const previewBill = async (invoice) => {
        try {
            const response = await invoicesAPI.generateBill(invoice.id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error previewing invoice:', error);
            toast.error('Failed to preview invoice');
        }
    };

    // Print invoice bill
    const printBill = async (invoice) => {
        try {
            const response = await invoicesAPI.generateBill(invoice.id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            printWindow.onload = () => {
                printWindow.print();
            };
        } catch (error) {
            console.error('Error printing invoice:', error);
            toast.error('Failed to print invoice');
        }
    };

    // Download invoice bill
    const downloadBill = async (invoice) => {
        try {
            const response = await invoicesAPI.generateBill(invoice.id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_${invoice.invoice_number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Invoice downloaded');
        } catch (error) {
            console.error('Error downloading invoice:', error);
            toast.error('Failed to download invoice');
        }
    };

    // Send invoice via email (called after confirmation)
    const sendEmailToCustomer = async (invoice) => {
        if (!invoice.customer_email) {
            toast.error('Customer email address not found');
            return;
        }

        setEmailModal({ isOpen: false, invoice: null });
        try {
            toast.loading('Sending email...', { id: 'email-sending' });
            await invoicesAPI.sendEmail(invoice.id);
            toast.dismiss('email-sending');
            toast.success(`Invoice sent to ${invoice.customer_email}`);
        } catch (error) {
            toast.dismiss('email-sending');
            console.error('Error sending email:', error);
            toast.error(error.response?.data?.error || 'Failed to send email');
        }
    };

    // Delete invoice
    const openDeleteModal = (invoice) => {
        setDeleteModal({ isOpen: true, invoice });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, invoice: null });
    };

    const handleDelete = async () => {
        if (!deleteModal.invoice) return;
        try {
            await invoicesAPI.delete(deleteModal.invoice.id);
            toast.success('Invoice deleted');
            fetchInvoices();
            closeDeleteModal();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete invoice');
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .table-row-hover:hover { background: linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%); }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
                .input-pro { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .input-pro:focus { box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15); }
            `}</style>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FiFileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Invoices</h1>
                                <p className="text-white/70 text-sm">{invoices.length} total invoices</p>
                            </div>
                        </div>
                    </div>
                    <Link to="/invoices/create" className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                        <FiPlus className="w-4 h-4" />Create Invoice
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 flex-1 border-2 border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
                        <FiSearch className="w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-none outline-none w-full text-gray-700" />
                    </div>
                    <Dropdown
                        className="min-w-[140px]"
                        options={[
                            { value: 'all', label: 'All Status' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'partial', label: 'Partial' },
                            { value: 'paid', label: 'Paid' },
                            { value: 'cancelled', label: 'Cancelled' },
                        ]}
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                            <FiFileText className="absolute inset-0 m-auto w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-gray-500 font-medium">Loading invoices...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((inv) => (
                                    <tr key={inv.id} className="table-row-hover transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">{inv.invoice_number}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{inv.customer_name}</td>
                                        <td className="px-6 py-4 text-gray-600">{format(new Date(inv.invoice_date), 'dd MMM yyyy')}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-800">{formatCurrency(inv.total)}</p>
                                            {inv.balance > 0 && <p className="text-xs text-red-500">Due: {formatCurrency(inv.balance)}</p>}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link to={`/invoices/${inv.id}/edit`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                                    <FiEdit className="w-4 h-4" />
                                                </Link>
                                                <button onClick={() => printBill(inv)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Print"><FiPrinter className="w-4 h-4" /></button>
                                                <button onClick={() => downloadBill(inv)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download"><FiDownload className="w-4 h-4" /></button>
                                                <button onClick={() => setEmailModal({ isOpen: true, invoice: inv })} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Send Email"><FiMail className="w-4 h-4" /></button>
                                                <button onClick={() => shareViaWhatsApp(inv)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Share via WhatsApp"><FaWhatsapp className="w-4 h-4" /></button>
                                                <button onClick={() => openDeleteModal(inv)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><FiFileText className="w-8 h-8 text-gray-400" /></div>
                        <h3 className="font-semibold text-gray-800">No invoices found</h3>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={deleteModal.invoice?.invoice_number}
            />

            {/* Email Confirmation Modal */}
            <EmailConfirmModal
                isOpen={emailModal.isOpen}
                onClose={() => setEmailModal({ isOpen: false, invoice: null })}
                onConfirm={() => sendEmailToCustomer(emailModal.invoice)}
                invoice={emailModal.invoice}
            />
        </div>
    );
}
