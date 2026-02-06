import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiBox, FiAlertTriangle } from 'react-icons/fi';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal max-w-xl" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
                    <button onClick={onClose} className="btn-ghost btn-icon"><FiX className="w-5 h-5" /></button>
                </div>
                {children}
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
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <FiAlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Product</h3>
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

export default function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null });
    const [formData, setFormData] = useState({
        name: '', sku: '', category: '', hsn_code: '', sale_price: 0, purchase_price: 0,
        gst_rate: 18, quantity: 0, min_stock: 10, unit: 'PCS', is_service: false
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([productsAPI.getAll(), productsAPI.getCategories()]);
            setProducts(prodRes.data.results || prodRes.data);
            setCategories(catRes.data.results || catRes.data);
        } catch { toast.error('Failed to fetch products'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData, category: formData.category || null };
            if (editingProduct) {
                await productsAPI.update(editingProduct.id, data);
                toast.success('Updated');
            } else {
                await productsAPI.create(data);
                toast.success('Created');
            }
            fetchData();
            closeModal();
        } catch { toast.error('Failed to save'); }
    };

    const openDeleteModal = (product) => {
        setDeleteModal({ isOpen: true, product });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, product: null });
    };

    const handleDelete = async () => {
        if (!deleteModal.product) return;
        try {
            await productsAPI.delete(deleteModal.product.id);
            toast.success('Deleted');
            fetchData();
            closeDeleteModal();
        } catch { toast.error('Cannot delete'); }
    };

    const openModal = (product = null) => {
        setEditingProduct(product);
        setFormData(product || { name: '', sku: '', category: '', hsn_code: '', sale_price: 0, purchase_price: 0, gst_rate: 18, quantity: 0, min_stock: 10, unit: 'PCS', is_service: false });
        setIsModalOpen(true);
    };
    const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); };

    const filtered = products.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
        if (filter === 'low_stock') return matchSearch && p.quantity <= p.min_stock;
        return matchSearch;
    });

    const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString('en-IN')}`;
    const units = ['PCS', 'NOS', 'KG', 'GM', 'MTR', 'LTR', 'BOX', 'SET'];
    const gstRates = [0, 5, 12, 18, 28];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-dark-900">Products</h1><p className="text-dark-500">{products.length} products</p></div>
                <button onClick={() => openModal()} className="btn-primary"><FiPlus className="w-4 h-4" />Add Product</button>
            </div>
            <div className="card flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2 bg-dark-50 rounded-xl px-4 py-2 flex-1">
                    <FiSearch className="w-5 h-5 text-dark-400" />
                    <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-none outline-none w-full" />
                </div>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select w-40">
                    <option value="all">All Products</option>
                    <option value="low_stock">Low Stock</option>
                </select>
            </div>
            <div className="card p-0 overflow-hidden">
                {loading ? <div className="flex items-center justify-center py-12"><div className="spinner text-primary-500"></div></div> :
                    filtered.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead><tr><th>Product</th><th>Price</th><th>GST</th><th>Stock</th><th className="text-right">Actions</th></tr></thead>
                                <tbody>
                                    {filtered.map((p) => (
                                        <tr key={p.id}>
                                            <td><div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.quantity <= p.min_stock ? 'bg-danger-100' : 'bg-primary-100'}`}>
                                                    {p.quantity <= p.min_stock ? <FiAlertTriangle className="w-5 h-5 text-danger-600" /> : <FiBox className="w-5 h-5 text-primary-600" />}
                                                </div>
                                                <div><p className="font-medium">{p.name}</p><p className="text-sm text-dark-500">{p.sku || 'No SKU'}</p></div>
                                            </div></td>
                                            <td><p className="font-semibold text-dark-900">{formatCurrency(p.sale_price)}</p><p className="text-sm text-dark-500">Cost: {formatCurrency(p.purchase_price)}</p></td>
                                            <td><span className="badge-primary">{p.gst_rate}%</span></td>
                                            <td><span className={`font-semibold ${p.quantity <= p.min_stock ? 'text-danger-600' : 'text-success-600'}`}>{p.quantity} {p.unit}</span></td>
                                            <td><div className="flex items-center justify-end gap-2"><button onClick={() => openModal(p)} className="btn-ghost btn-icon text-primary-600"><FiEdit2 className="w-4 h-4" /></button><button onClick={() => openDeleteModal(p)} className="btn-ghost btn-icon text-danger-600"><FiTrash2 className="w-4 h-4" /></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <div className="empty-state py-12"><FiBox className="empty-state-icon" /><h3 className="font-semibold">No products</h3></div>}
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? 'Edit Product' : 'Add Product'}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Product Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" /></div>
                            <div><label className="label">SKU/Code</label><input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="input" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">HSN Code</label><input type="text" value={formData.hsn_code} onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })} className="input" /></div>
                            <div><label className="label">GST Rate</label><select value={formData.gst_rate} onChange={(e) => setFormData({ ...formData, gst_rate: Number(e.target.value) })} className="select">{gstRates.map(r => <option key={r} value={r}>{r}%</option>)}</select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Sale Price *</label><input type="number" required min="0" step="0.01" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} className="input" /></div>
                            <div><label className="label">Purchase Price</label><input type="number" min="0" step="0.01" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} className="input" /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="label">Quantity</label><input type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input" /></div>
                            <div><label className="label">Min Stock</label><input type="number" min="0" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} className="input" /></div>
                            <div><label className="label">Unit</label><select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="select">{units.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                        </div>
                    </div>
                    <div className="modal-footer"><button type="button" onClick={closeModal} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editingProduct ? 'Update' : 'Create'}</button></div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={deleteModal.product?.name}
            />
        </div>
    );
}
