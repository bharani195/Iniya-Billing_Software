import { useState, useEffect } from 'react';
import {
    FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiPackage, FiPrinter, FiX, FiSave, FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { jobordersAPI } from '../services/api';
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
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Item</h3>
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

export default function ServiceRates() {
    const [activeTab, setActiveTab] = useState('services');
    const [loading, setLoading] = useState(true);
    const [serviceRates, setServiceRates] = useState([]);
    const [materialTypes, setMaterialTypes] = useState([]);
    const [printingTypes, setPrintingTypes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', item: null });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [servicesRes, materialsRes, printingRes] = await Promise.all([
                jobordersAPI.getServiceRates(),
                jobordersAPI.getMaterialTypes(),
                jobordersAPI.getPrintingTypes()
            ]);
            setServiceRates(servicesRes.data?.results || servicesRes.data || []);
            setMaterialTypes(materialsRes.data?.results || materialsRes.data || []);
            setPrintingTypes(printingRes.data?.results || printingRes.data || []);
        } catch (error) {
            toast.error('Failed to load data');
        } finally { setLoading(false); }
    };

    const openModal = (type, item = null) => {
        setModalType(type);
        setEditingItem(item);
        if (type === 'service') {
            setFormData(item ? { name: item.name, category: item.category, rate_type: item.rate_type, rate: item.rate, gst_rate: item.gst_rate, description: item.description || '', is_active: item.is_active } : { name: '', category: 'other', rate_type: 'fixed', rate: 0, gst_rate: 5, description: '', is_active: true });
        } else {
            setFormData(item ? { name: item.name, description: item.description || '', is_active: item.is_active } : { name: '', description: '', is_active: true });
        }
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setModalType(''); setEditingItem(null); setFormData({}); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'service') {
                if (editingItem) { await jobordersAPI.updateServiceRate(editingItem.id, formData); toast.success('Service rate updated'); }
                else { await jobordersAPI.createServiceRate(formData); toast.success('Service rate created'); }
            } else if (modalType === 'material') {
                if (editingItem) { await jobordersAPI.updateMaterialType(editingItem.id, formData); toast.success('Material type updated'); }
                else { await jobordersAPI.createMaterialType(formData); toast.success('Material type created'); }
            } else if (modalType === 'printing') {
                if (editingItem) { await jobordersAPI.updatePrintingType(editingItem.id, formData); toast.success('Printing type updated'); }
                else { await jobordersAPI.createPrintingType(formData); toast.success('Printing type created'); }
            }
            closeModal(); fetchData();
        } catch (error) { toast.error('Failed to save'); }
    };

    const openDeleteModal = (type, item) => {
        setDeleteModal({ isOpen: true, type, item });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, type: '', item: null });
    };

    const handleDelete = async () => {
        if (!deleteModal.item) return;
        try {
            if (deleteModal.type === 'service') await jobordersAPI.deleteServiceRate(deleteModal.item.id);
            else if (deleteModal.type === 'material') await jobordersAPI.deleteMaterialType(deleteModal.item.id);
            else if (deleteModal.type === 'printing') await jobordersAPI.deletePrintingType(deleteModal.item.id);
            toast.success('Deleted successfully');
            fetchData();
            closeDeleteModal();
        } catch (error) { toast.error('Failed to delete'); }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    const getRateTypeLabel = (type) => ({ fixed: 'Fixed', per_meter: 'Per Meter', per_piece: 'Per Piece', per_color: 'Per Color', per_sqm: 'Per Sq.M' }[type] || type);
    const getCategoryLabel = (cat) => ({ design: 'Design Work', printing: 'Printing', finishing: 'Finishing', other: 'Other' }[cat] || cat);

    const tabs = [
        { id: 'services', label: 'Service Rates', icon: FiDollarSign, count: serviceRates.length },
        { id: 'materials', label: 'Material Types', icon: FiPackage, count: materialTypes.length },
        { id: 'printing', label: 'Printing Types', icon: FiPrinter, count: printingTypes.length },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
                .table-row-hover:hover { background: linear-gradient(90deg, rgba(168, 85, 247, 0.05) 0%, transparent 100%); }
                .input-pro { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .input-pro:focus { box-shadow: 0 4px 20px rgba(168, 85, 247, 0.15); }
            `}</style>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 via-purple-600 to-violet-600 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FiDollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Service Rates & Master Data</h1>
                                <p className="text-white/70 text-sm">Manage service rates, material types, and printing methods</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Card */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 p-2">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <tab.icon className="w-4 h-4" />{tab.label}
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'}`}>{tab.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
                                <FiDollarSign className="absolute inset-0 m-auto w-6 h-6 text-purple-500" />
                            </div>
                            <p className="text-gray-500 font-medium">Loading service rates...</p>
                        </div>
                    ) : (
                        <>
                            {/* Service Rates Tab */}
                            {activeTab === 'services' && (
                                <div>
                                    <div className="flex justify-end mb-4">
                                        <button onClick={() => openModal('service')} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                                            <FiPlus className="w-4 h-4" />Add Service Rate
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full">
                                            <thead><tr className="bg-gray-50/80"><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Service Name</th><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rate Type</th><th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rate</th><th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">GST %</th><th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {serviceRates.map((rate) => (
                                                    <tr key={rate.id} className="table-row-hover transition-colors">
                                                        <td className="px-6 py-4"><span className="font-medium text-gray-900">{rate.name}</span>{rate.description && <p className="text-xs text-gray-500">{rate.description}</p>}</td>
                                                        <td className="px-6 py-4 text-gray-700">{getCategoryLabel(rate.category)}</td>
                                                        <td className="px-6 py-4 text-gray-700">{getRateTypeLabel(rate.rate_type)}</td>
                                                        <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(rate.rate)}</td>
                                                        <td className="px-6 py-4 text-right text-gray-700">{rate.gst_rate}%</td>
                                                        <td className="px-6 py-4 text-center"><span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${rate.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{rate.is_active ? 'Active' : 'Inactive'}</span></td>
                                                        <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openModal('service', rate)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"><FiEdit2 className="w-4 h-4" /></button><button onClick={() => openDeleteModal('service', rate)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 className="w-4 h-4" /></button></div></td>
                                                    </tr>
                                                ))}
                                                {serviceRates.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No service rates found. Add your first service rate.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Material Types Tab */}
                            {activeTab === 'materials' && (
                                <div>
                                    <div className="flex justify-end mb-4">
                                        <button onClick={() => openModal('material')} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                                            <FiPlus className="w-4 h-4" />Add Material Type
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {materialTypes.map((material) => (
                                            <div key={material.id} className="glass-card rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><FiPackage className="w-5 h-5 text-blue-600" /></div>
                                                        <div><h3 className="font-semibold text-gray-900">{material.name}</h3><span className={`text-xs ${material.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>{material.is_active ? 'Active' : 'Inactive'}</span></div>
                                                    </div>
                                                    <div className="flex items-center gap-1"><button onClick={() => openModal('material', material)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><FiEdit2 className="w-4 h-4" /></button><button onClick={() => openDeleteModal('material', material)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 className="w-4 h-4" /></button></div>
                                                </div>
                                                {material.description && <p className="mt-3 text-sm text-gray-500">{material.description}</p>}
                                            </div>
                                        ))}
                                        {materialTypes.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">No material types found. Add types like Cotton, Silk, Polyester.</div>}
                                    </div>
                                </div>
                            )}

                            {/* Printing Types Tab */}
                            {activeTab === 'printing' && (
                                <div>
                                    <div className="flex justify-end mb-4">
                                        <button onClick={() => openModal('printing')} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                                            <FiPlus className="w-4 h-4" />Add Printing Type
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {printingTypes.map((printing) => (
                                            <div key={printing.id} className="glass-card rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><FiPrinter className="w-5 h-5 text-purple-600" /></div>
                                                        <div><h3 className="font-semibold text-gray-900">{printing.name}</h3><span className={`text-xs ${printing.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>{printing.is_active ? 'Active' : 'Inactive'}</span></div>
                                                    </div>
                                                    <div className="flex items-center gap-1"><button onClick={() => openModal('printing', printing)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><FiEdit2 className="w-4 h-4" /></button><button onClick={() => openDeleteModal('printing', printing)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 className="w-4 h-4" /></button></div>
                                                </div>
                                                {printing.description && <p className="mt-3 text-sm text-gray-500">{printing.description}</p>}
                                            </div>
                                        ))}
                                        {printingTypes.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">No printing types found. Add types like Screen Print, Digital Print.</div>}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">{editingItem ? 'Edit' : 'Add'} {modalType === 'service' ? 'Service Rate' : modalType === 'material' ? 'Material Type' : 'Printing Type'}</h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><FiX className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-purple-500 outline-none" required />
                            </div>
                            {modalType === 'service' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                            <Dropdown
                                                options={[
                                                    { value: 'design', label: 'Design Work' },
                                                    { value: 'printing', label: 'Printing' },
                                                    { value: 'finishing', label: 'Finishing' },
                                                    { value: 'other', label: 'Other' },
                                                ]}
                                                value={formData.category || 'other'}
                                                onChange={(val) => setFormData({ ...formData, category: val })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Rate Type</label>
                                            <Dropdown
                                                options={[
                                                    { value: 'fixed', label: 'Fixed Amount' },
                                                    { value: 'per_meter', label: 'Per Meter' },
                                                    { value: 'per_piece', label: 'Per Piece' },
                                                    { value: 'per_color', label: 'Per Color' },
                                                    { value: 'per_sqm', label: 'Per Sq. Meter' },
                                                ]}
                                                value={formData.rate_type || 'fixed'}
                                                onChange={(val) => setFormData({ ...formData, rate_type: val })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Rate (₹)</label>
                                            <input type="number" value={formData.rate || 0} onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-purple-500 outline-none" step="0.01" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">GST %</label>
                                            <input type="number" value={formData.gst_rate || 5} onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-purple-500 outline-none" />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-pro w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-purple-500 outline-none resize-none" rows={2} />
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="is_active" checked={formData.is_active !== false} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 text-purple-600 rounded" />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"><FiSave className="w-4 h-4" />Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={deleteModal.item?.name}
            />
        </div>
    );
}
