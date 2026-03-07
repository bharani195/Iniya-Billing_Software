import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiPhone, FiMail, FiX, FiUser, FiUsers, FiAlertTriangle } from 'react-icons/fi';
import { customersAPI } from '../services/api';
import toast from 'react-hot-toast';

// Professional Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl transform transition-all"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <FiX className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, customerName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all animate-fadeIn"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <FiAlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Customer</h3>
                        <p className="text-gray-500 mb-6">
                            Are you sure you want to delete <span className="font-semibold text-gray-700">{customerName}</span>? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 text-gray-600 font-medium rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-200 hover:shadow-xl transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, customer: null });
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', gstin: '', credit_limit: 0
    });

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        try {
            const response = await customersAPI.getAll();
            setCustomers(response.data.results || response.data);
        } catch (error) {
            toast.error('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await customersAPI.update(editingCustomer.id, formData);
                toast.success('Customer updated successfully');
            } else {
                await customersAPI.create(formData);
                toast.success('Customer created successfully');
            }
            fetchCustomers();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save customer');
        }
    };

    const openDeleteModal = (customer) => {
        setDeleteModal({ isOpen: true, customer });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, customer: null });
    };

    const handleDelete = async () => {
        if (!deleteModal.customer) return;
        try {
            await customersAPI.delete(deleteModal.customer.id);
            toast.success('Customer deleted');
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Cannot delete customer with existing invoices');
        } finally {
            closeDeleteModal();
        }
    };

    const openModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData(customer);
        } else {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', gstin: '', credit_limit: 0 });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.gstin?.toLowerCase().includes(search.toLowerCase())
    );

    const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Styles */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .input-pro {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .input-pro:focus {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.15);
                }
                .table-row-hover:hover {
                    background: linear-gradient(90deg, rgba(6, 182, 212, 0.05) 0%, transparent 100%);
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                }
            `}</style>

            {/* Header with Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-600 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FiUsers className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Customers</h1>
                                <p className="text-white/70 text-sm">{customers.length} total customers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Card */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border-2 border-transparent focus-within:border-cyan-500 focus-within:bg-white transition-all duration-300">
                    <FiSearch className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or GSTIN..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Table Card */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-cyan-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
                            <FiUsers className="absolute inset-0 m-auto w-6 h-6 text-cyan-500" />
                        </div>
                        <p className="text-gray-500 font-medium">Loading customers...</p>
                    </div>
                ) : filteredCustomers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">GSTIN</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="table-row-hover transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200">
                                                    <FiUser className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{customer.name}</p>
                                                    <p className="text-sm text-gray-500">{customer.city}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {customer.phone && (
                                                    <p className="flex items-center gap-2 text-sm text-gray-600">
                                                        <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                                                        {customer.phone}
                                                    </p>
                                                )}
                                                {customer.email && (
                                                    <p className="flex items-center gap-2 text-sm text-gray-500">
                                                        <FiMail className="w-3.5 h-3.5 text-gray-400" />
                                                        {customer.email}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{customer.gstin || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${customer.current_balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {formatCurrency(customer.current_balance)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(customer)}
                                                    className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(customer)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <FiUser className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-1">No customers found</h3>
                        <p className="text-gray-500 text-sm">Add your first customer to get started</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCustomer ? 'Edit Customer' : 'Add Customer'}>
                <form onSubmit={handleSubmit}>
                    <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                                placeholder="Enter customer name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                                    placeholder="Phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                                    placeholder="Email address"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">GSTIN</label>
                            <input
                                type="text"
                                value={formData.gstin}
                                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none font-mono"
                                placeholder="15 digit GSTIN"
                                maxLength={15}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none resize-none"
                                rows={2}
                                placeholder="Full address"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none"
                                    maxLength={6}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-200 hover:shadow-xl transition-all">
                            {editingCustomer ? 'Update' : 'Create'} Customer
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                customerName={deleteModal.customer?.name}
            />
        </div>
    );
}
