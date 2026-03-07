import { useState, useEffect } from 'react';
import { FiPlus, FiCreditCard, FiX, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { purchasesAPI } from '../services/api';
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
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Expense</h3>
                        <p className="text-gray-500 mb-6">
                            Are you sure you want to delete <span className="font-semibold text-gray-700">{itemName}</span>? This action cannot be undone.
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

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, expense: null });
    const [formData, setFormData] = useState({ category: 'materials', description: '', amount: '', expense_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: 'cash', material_name: '', quantity_wasted: '', unit: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [expRes, statRes] = await Promise.all([purchasesAPI.getExpenses(), purchasesAPI.getExpenseStats()]);
            setExpenses(expRes.data.results || expRes.data);
            setStats(statRes.data);
        } catch { toast.error('Failed'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await purchasesAPI.createExpense({ ...formData, amount: parseFloat(formData.amount) });
            toast.success('Expense added');
            setIsModalOpen(false);
            setFormData({ category: 'other', description: '', amount: '', expense_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: 'cash', material_name: '', quantity_wasted: '', unit: '' });
            fetchData();
        } catch { toast.error('Failed'); }
    };

    const openDeleteModal = (expense) => {
        setDeleteModal({ isOpen: true, expense });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, expense: null });
    };

    const handleDelete = async () => {
        if (!deleteModal.expense) return;
        try {
            await purchasesAPI.deleteExpense(deleteModal.expense.id);
            toast.success('Deleted');
            fetchData();
            closeDeleteModal();
        } catch { toast.error('Failed'); }
    };

    const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString('en-IN')}`;
    const categories = ['materials', 'consumables', 'rent', 'salary', 'utilities', 'transport', 'maintenance', 'office', 'marketing', 'wastage', 'other'];
    const modes = ['cash', 'upi', 'bank', 'card'];

    return (
        <div className="space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .input-pro { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .input-pro:focus { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(249, 115, 22, 0.15); }
                .table-row-hover:hover { background: linear-gradient(90deg, rgba(249, 115, 22, 0.05) 0%, transparent 100%); }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
            `}</style>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FiCreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Expenses</h1>
                                <p className="text-white/70 text-sm">Track your business expenses</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                        <FiPlus className="w-4 h-4" />Add Expense
                    </button>
                </div>
            </div>

            {/* Stats Card */}
            <div className="glass-card rounded-2xl shadow-sm border border-orange-100 p-6 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-orange-600 text-sm font-medium mb-1">Monthly Expenses</p>
                        <p className="text-3xl font-bold text-orange-700">{formatCurrency(stats.monthly_expenses)}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200">
                        <FiCreditCard className="w-7 h-7 text-white" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
                            <FiCreditCard className="absolute inset-0 m-auto w-6 h-6 text-orange-500" />
                        </div>
                        <p className="text-gray-500 font-medium">Loading expenses...</p>
                    </div>
                ) : expenses.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Description</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Mode</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expenses.map((e) => (
                                    <tr key={e.id} className="table-row-hover transition-colors">
                                        <td className="px-6 py-4 text-gray-600">{format(new Date(e.expense_date), 'dd MMM yyyy')}</td>
                                        <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${e.category === 'wastage' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{e.category}</span></td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {e.description}
                                            {e.category === 'wastage' && e.material_name && (
                                                <div className="text-xs text-red-500 mt-0.5">📦 {e.material_name}{e.quantity_wasted ? ` — ${e.quantity_wasted} ${e.unit || 'pcs'}` : ''}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 capitalize text-gray-600">{e.payment_mode}</td>
                                        <td className="px-6 py-4"><span className="font-bold text-red-500">{formatCurrency(e.amount)}</span></td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                <button onClick={() => openDeleteModal(e)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><FiCreditCard className="w-8 h-8 text-gray-400" /></div>
                        <h3 className="font-semibold text-gray-800">No expenses recorded</h3>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Expense">
                <form onSubmit={handleSubmit}>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                            <Dropdown
                                options={categories.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
                                value={formData.category}
                                onChange={(val) => setFormData({ ...formData, category: val })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                            <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-orange-500 outline-none" placeholder="What was this for?" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                                <input type="number" required min="1" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-orange-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Mode</label>
                                <Dropdown
                                    options={modes.map(m => ({ value: m, label: m.toUpperCase() }))}
                                    value={formData.payment_mode}
                                    onChange={(val) => setFormData({ ...formData, payment_mode: val })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                            <DatePicker value={formData.expense_date} onChange={(val) => setFormData({ ...formData, expense_date: val })} placeholder="Select expense date" />
                        </div>
                        {formData.category === 'wastage' && (
                            <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-3">
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">📦 Wastage Material Details</p>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Material Name</label>
                                    <input type="text" value={formData.material_name} onChange={(e) => setFormData({ ...formData, material_name: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-white border-2 border-red-100 focus:border-red-400 outline-none" placeholder="e.g., A4 Paper, Ink Cartridge" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity Wasted</label>
                                        <input type="number" step="0.01" value={formData.quantity_wasted} onChange={(e) => setFormData({ ...formData, quantity_wasted: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-white border-2 border-red-100 focus:border-red-400 outline-none" placeholder="50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
                                        <Dropdown
                                            options={[
                                                { value: '', label: 'Select' },
                                                { value: 'sheets', label: 'Sheets' },
                                                { value: 'pcs', label: 'Pieces' },
                                                { value: 'kg', label: 'Kg' },
                                                { value: 'liters', label: 'Liters' },
                                                { value: 'rolls', label: 'Rolls' },
                                                { value: 'plates', label: 'Plates' },
                                                { value: 'reams', label: 'Reams' },
                                            ]}
                                            value={formData.unit}
                                            onChange={(val) => setFormData({ ...formData, unit: val })}
                                            placeholder="Select unit"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all">Add Expense</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={deleteModal.expense?.description}
            />
        </div>
    );
}
