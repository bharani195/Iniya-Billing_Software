import { useState, useEffect } from 'react';
import { FiPlus, FiDollarSign, FiX, FiEye, FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiCreditCard, FiHash } from 'react-icons/fi';
import { paymentsAPI, customersAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DatePicker from '../components/DatePicker';
import Dropdown from '../components/Dropdown';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><FiX className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewModal, setViewModal] = useState({ isOpen: false, payment: null });
    const [formData, setFormData] = useState({ customer_name: '', amount: '', mode: 'cash', payment_date: format(new Date(), 'yyyy-MM-dd'), reference: '', notes: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [payRes, custRes, statRes] = await Promise.all([paymentsAPI.getAll(), customersAPI.getDropdown(), paymentsAPI.getStats()]);
            setPayments(payRes.data.results || payRes.data);
            setCustomers(custRes.data);
            setStats(statRes.data);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await paymentsAPI.create({ ...formData, amount: parseFloat(formData.amount) });
            toast.success('Payment recorded');
            setIsModalOpen(false);
            setFormData({ customer_name: '', amount: '', mode: 'cash', payment_date: format(new Date(), 'yyyy-MM-dd'), reference: '', notes: '' });
            fetchData();
        } catch { toast.error('Failed'); }
    };

    const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString('en-IN')}`;
    const modes = ['cash', 'upi', 'bank', 'card', 'cheque', 'online'];

    const openViewModal = (payment) => {
        setViewModal({ isOpen: true, payment });
    };

    const closeViewModal = () => {
        setViewModal({ isOpen: false, payment: null });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .input-pro { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .input-pro:focus { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15); }
                .table-row-hover:hover { background: linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%); }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
            `}</style>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FiDollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Payments</h1>
                                <p className="text-white/70 text-sm">Track customer payments</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card rounded-2xl shadow-sm border border-emerald-100 p-6 bg-gradient-to-r from-emerald-50 to-green-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-600 text-sm font-medium mb-1">Today's Collections</p>
                            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.today_collections)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                            <FiDollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-2xl shadow-sm border border-blue-100 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 text-sm font-medium mb-1">Monthly Collections</p>
                            <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.monthly_collections)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200">
                            <FiDollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
                            <FiDollarSign className="absolute inset-0 m-auto w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-gray-500 font-medium">Loading payments...</p>
                    </div>
                ) : payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Mode</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Reference</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.map((p) => (
                                    <tr key={p.id} className="table-row-hover transition-colors">
                                        <td className="px-6 py-4 text-gray-600">{format(new Date(p.payment_date), 'dd MMM yyyy')}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">{p.customer_name}</td>
                                        <td className="px-6 py-4"><span className="font-bold text-emerald-600">{formatCurrency(p.amount)}</span></td>
                                        <td className="px-6 py-4"><span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium uppercase">{p.mode}</span></td>
                                        <td className="px-6 py-4 text-gray-500">{p.reference || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openViewModal(p)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Details"><FiEye className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><FiDollarSign className="w-8 h-8 text-gray-400" /></div>
                        <h3 className="font-semibold text-gray-800">No payments recorded</h3>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Payment">
                <form onSubmit={handleSubmit}>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name *</label>
                            <input type="text" value={formData.customer_name || ''} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-emerald-500 outline-none" placeholder="Enter customer name" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                                <input type="number" required min="1" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Mode</label>
                                <Dropdown
                                    options={modes.map(m => ({ value: m, label: m.toUpperCase() }))}
                                    value={formData.mode}
                                    onChange={(val) => setFormData({ ...formData, mode: val })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                            <DatePicker value={formData.payment_date} onChange={(val) => setFormData({ ...formData, payment_date: val })} placeholder="Select payment date" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Reference</label>
                            <input type="text" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-emerald-500 outline-none" placeholder="UPI ID, Cheque No, etc." />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl transition-all">Record Payment</button>
                    </div>
                </form>
            </Modal>

            {/* View Payment Details Modal */}
            <Modal isOpen={viewModal.isOpen} onClose={closeViewModal} title="Payment Details">
                {viewModal.payment && (
                    <div className="p-5 space-y-4">
                        {/* Customer Info */}
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <FiUser className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">{viewModal.payment.customer_name}</h4>
                                    <p className="text-emerald-600 text-sm font-medium">Customer</p>
                                </div>
                            </div>
                            {viewModal.payment.customer_phone && (
                                <div className="flex items-center gap-2 text-gray-600 text-sm mt-2">
                                    <FiPhone className="w-4 h-4 text-gray-400" />
                                    <span>{viewModal.payment.customer_phone}</span>
                                </div>
                            )}
                            {viewModal.payment.customer_email && (
                                <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                                    <FiMail className="w-4 h-4 text-gray-400" />
                                    <span>{viewModal.payment.customer_email}</span>
                                </div>
                            )}
                        </div>

                        {/* Payment Details */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <FiDollarSign className="w-4 h-4" />
                                    <span className="text-sm font-medium">Amount</span>
                                </div>
                                <span className="font-bold text-emerald-600 text-lg">{formatCurrency(viewModal.payment.amount)}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <FiCalendar className="w-4 h-4" />
                                    <span className="text-sm font-medium">Payment Date</span>
                                </div>
                                <span className="font-semibold text-gray-800">{format(new Date(viewModal.payment.payment_date), 'dd MMM yyyy')}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <FiCreditCard className="w-4 h-4" />
                                    <span className="text-sm font-medium">Payment Mode</span>
                                </div>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium uppercase">{viewModal.payment.mode}</span>
                            </div>
                            {viewModal.payment.reference && (
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <FiHash className="w-4 h-4" />
                                        <span className="text-sm font-medium">Reference</span>
                                    </div>
                                    <span className="font-mono text-gray-700 text-sm">{viewModal.payment.reference}</span>
                                </div>
                            )}
                            {viewModal.payment.invoice_number && (
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <FiHash className="w-4 h-4" />
                                        <span className="text-sm font-medium">Invoice</span>
                                    </div>
                                    <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">{viewModal.payment.invoice_number}</span>
                                </div>
                            )}
                            {viewModal.payment.notes && (
                                <div className="py-3">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                                    <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3 break-all overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{viewModal.payment.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
                    <button onClick={closeViewModal} className="px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-xl hover:shadow-md transition-all">Close</button>
                </div>
            </Modal>
        </div>
    );
}
