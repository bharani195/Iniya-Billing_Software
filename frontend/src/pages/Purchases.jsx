import { useState, useEffect } from 'react';
import { FiPlus, FiShoppingCart, FiX } from 'react-icons/fi';
import { purchasesAPI, suppliersAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DatePicker from '../components/DatePicker';
import Dropdown from '../components/Dropdown';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3 className="text-lg font-semibold">{title}</h3><button onClick={onClose} className="btn-ghost btn-icon"><FiX className="w-5 h-5" /></button></div>
                {children}
            </div>
        </div>
    );
};

export default function Purchases() {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ supplier: '', purchase_number: '', bill_number: '', purchase_date: format(new Date(), 'yyyy-MM-dd'), total: '', notes: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [purRes, supRes, statRes] = await Promise.all([purchasesAPI.getAll(), suppliersAPI.getDropdown(), purchasesAPI.getStats()]);
            setPurchases(purRes.data.results || purRes.data);
            setSuppliers(supRes.data);
            setStats(statRes.data);
        } catch { toast.error('Failed'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await purchasesAPI.create({ ...formData, total: parseFloat(formData.total) });
            toast.success('Purchase recorded');
            setIsModalOpen(false);
            fetchData();
        } catch { toast.error('Failed'); }
    };

    const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString('en-IN')}`;
    const getStatusBadge = (s) => {
        const c = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-gray', cancelled: 'badge-danger' };
        return <span className={c[s] || 'badge-gray'}>{s?.charAt(0).toUpperCase() + s?.slice(1)}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-dark-900">Purchases</h1></div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary"><FiPlus className="w-4 h-4" />Add Purchase</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card"><p className="text-dark-500 text-sm">Monthly Purchases</p><p className="text-2xl font-bold">{formatCurrency(stats.monthly_purchases)}</p></div>
                <div className="card"><p className="text-dark-500 text-sm">Total Payable</p><p className="text-2xl font-bold text-danger-600">{formatCurrency(stats.total_payable)}</p></div>
            </div>

            <div className="card p-0 overflow-hidden">
                {loading ? <div className="flex items-center justify-center py-12"><div className="spinner text-primary-500"></div></div> :
                    purchases.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead><tr><th>Purchase #</th><th>Supplier</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                                <tbody>
                                    {purchases.map((p) => (
                                        <tr key={p.id}>
                                            <td className="font-mono">{p.purchase_number}</td>
                                            <td className="font-medium">{p.supplier_name}</td>
                                            <td>{format(new Date(p.purchase_date), 'dd MMM yyyy')}</td>
                                            <td><p className="font-semibold">{formatCurrency(p.total)}</p>{p.balance > 0 && <p className="text-sm text-danger-600">Due: {formatCurrency(p.balance)}</p>}</td>
                                            <td>{getStatusBadge(p.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <div className="empty-state py-12"><FiShoppingCart className="empty-state-icon" /><h3 className="font-semibold">No purchases</h3></div>}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Purchase">
                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-4">
                        <div><label className="label">Supplier *</label><Dropdown options={[{ value: '', label: 'Select' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]} value={formData.supplier} onChange={(val) => setFormData({ ...formData, supplier: val })} placeholder="Select supplier" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Purchase #</label><input type="text" value={formData.purchase_number} onChange={(e) => setFormData({ ...formData, purchase_number: e.target.value })} className="input" /></div>
                            <div><label className="label">Bill #</label><input type="text" value={formData.bill_number} onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })} className="input" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Date</label><DatePicker value={formData.purchase_date} onChange={(val) => setFormData({ ...formData, purchase_date: val })} /></div>
                            <div><label className="label">Total *</label><input type="number" required min="0" step="0.01" value={formData.total} onChange={(e) => setFormData({ ...formData, total: e.target.value })} className="input" /></div>
                        </div>
                        <div><label className="label">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input" rows={2} /></div>
                    </div>
                    <div className="modal-footer"><button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
                </form>
            </Modal>
        </div>
    );
}
