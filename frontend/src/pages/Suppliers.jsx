import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiTruck, FiPhone, FiMail, FiAlertTriangle } from 'react-icons/fi';
import { suppliersAPI } from '../services/api';
import toast from 'react-hot-toast';

// Professional Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
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
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Supplier</h3>
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

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, supplier: null });
    const [formData, setFormData] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', gstin: '' });

    useEffect(() => { fetchSuppliers(); }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await suppliersAPI.getAll();
            setSuppliers(response.data.results || response.data);
        } catch (error) { toast.error('Failed to fetch suppliers'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await suppliersAPI.update(editingSupplier.id, formData);
                toast.success('Supplier updated');
            } else {
                await suppliersAPI.create(formData);
                toast.success('Supplier created');
            }
            fetchSuppliers();
            closeModal();
        } catch (error) { toast.error('Failed to save supplier'); }
    };

    const openDeleteModal = (supplier) => {
        setDeleteModal({ isOpen: true, supplier });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, supplier: null });
    };

    const handleDelete = async () => {
        if (!deleteModal.supplier) return;
        try {
            await suppliersAPI.delete(deleteModal.supplier.id);
            toast.success('Deleted');
            fetchSuppliers();
            closeDeleteModal();
        } catch { toast.error('Cannot delete'); }
    };

    const openModal = (supplier = null) => {
        setEditingSupplier(supplier);
        setFormData(supplier || { name: '', contact_person: '', phone: '', email: '', address: '', gstin: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingSupplier(null); };

    const filtered = suppliers.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));
    const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString('en-IN')}`;

    return (
        <div className="space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .input-pro { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .input-pro:focus { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15); }
                .table-row-hover:hover { background: linear-gradient(90deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%); }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
            `}</style>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-violet-600 to-purple-600 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FiTruck className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Suppliers</h1>
                                <p className="text-white/70 text-sm">{suppliers.length} total suppliers</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-white text-violet-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                        <FiPlus className="w-4 h-4" />Add Supplier
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border-2 border-transparent focus-within:border-violet-500 focus-within:bg-white transition-all">
                    <FiSearch className="w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-none outline-none w-full text-gray-700" />
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-violet-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
                            <FiTruck className="absolute inset-0 m-auto w-6 h-6 text-violet-500" />
                        </div>
                        <p className="text-gray-500 font-medium">Loading suppliers...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">GSTIN</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Payable</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((s) => (
                                    <tr key={s.id} className="table-row-hover transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                                                    <FiTruck className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{s.name}</p>
                                                    <p className="text-sm text-gray-500">{s.contact_person}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {s.phone && <p className="flex items-center gap-2 text-sm"><FiPhone className="w-3.5 h-3.5 text-gray-400" />{s.phone}</p>}
                                                {s.email && <p className="flex items-center gap-2 text-sm text-gray-500"><FiMail className="w-3.5 h-3.5 text-gray-400" />{s.email}</p>}
                                                {!s.phone && !s.email && <span className="text-gray-400">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{s.gstin || '-'}</span></td>
                                        <td className="px-6 py-4"><span className={`font-bold ${s.current_balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{formatCurrency(s.current_balance)}</span></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openModal(s)} className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><FiEdit2 className="w-4 h-4" /></button>
                                                <button onClick={() => openDeleteModal(s)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><FiTruck className="w-8 h-8 text-gray-400" /></div>
                        <h3 className="font-semibold text-gray-800">No suppliers</h3>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}>
                <form onSubmit={handleSubmit}>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier Name *</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                                <input type="text" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">GSTIN</label>
                            <input type="text" value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none font-mono" maxLength={15} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                            <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none resize-none" rows={2} />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl transition-all">
                            {editingSupplier ? 'Update' : 'Create'} Supplier
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={deleteModal.supplier?.name}
            />
        </div>
    );
}
