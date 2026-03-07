import { useState, useEffect } from 'react';
import {
    FiClipboard, FiPlus, FiSearch,
    FiEdit2, FiTrash2, FiClock, FiCheckCircle, FiAlertCircle,
    FiTruck, FiRefreshCw, FiChevronDown, FiFilter, FiAlertTriangle, FiUsers, FiZap
} from 'react-icons/fi';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { jobordersAPI, staffAPI } from '../services/api';
import Dropdown from '../components/Dropdown';

const STATUS_CONFIG = {
    received: { label: 'Received', color: 'bg-blue-100 text-blue-700', icon: FiClipboard },
    finishing: { label: 'Finishing', color: 'bg-teal-100 text-teal-700', icon: FiCheckCircle },
    ready: { label: 'Ready', color: 'bg-green-100 text-green-700', icon: FiCheckCircle },
    delivered: { label: 'Delivered', color: 'bg-gray-100 text-gray-700', icon: FiTruck },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: FiAlertCircle },
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
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Order</h3>
                        <p className="text-gray-500 mb-6">
                            Are you sure you want to delete order <span className="font-semibold text-gray-700">{itemName}</span>? This action cannot be undone.
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

export default function JobOrders() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showStatusDropdown, setShowStatusDropdown] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, job: null });
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const handleStatusClick = (jobId, e) => {
        if (showStatusDropdown === jobId) {
            setShowStatusDropdown(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setDropdownPos({
            top: spaceBelow > 220 ? rect.bottom + 4 : rect.top - 220,
            left: rect.left,
        });
        setShowStatusDropdown(jobId);
    };

    const fetchJobs = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (searchTerm) params.search = searchTerm;
            const response = await jobordersAPI.getAll(params);
            setJobs(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to load orders');
        } finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const response = await jobordersAPI.getStats();
            setStats(response.data);
        } catch (error) { console.error('Error fetching stats:', error); }
    };

    useEffect(() => { fetchJobs(true); fetchStats(); }, [statusFilter]);

    useEffect(() => {
        const refreshInterval = setInterval(() => {
            if (!document.hidden) { fetchJobs(false); fetchStats(); }
        }, 15000);
        const handleVisibilityChange = () => {
            if (!document.hidden) { fetchJobs(false); fetchStats(); }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => { clearInterval(refreshInterval); document.removeEventListener('visibilitychange', handleVisibilityChange); };
    }, [statusFilter, searchTerm]);

    const handleSearch = (e) => { e.preventDefault(); fetchJobs(true); };

    const updateStatus = async (jobId, newStatus) => {
        // Close dropdown immediately
        setShowStatusDropdown(null);

        // Optimistic UI update — instant feedback
        setJobs(prev => prev.map(job =>
            job.id === jobId ? { ...job, status: newStatus } : job
        ));

        try {
            await jobordersAPI.updateStatus(jobId, newStatus);
            toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
            // Re-fetch to get accurate server data (deadline_status, progress, etc.)
            fetchJobs(); fetchStats();
        } catch (error) {
            toast.error('Failed to update status');
            // Revert on error
            fetchJobs(true);
        }
    };

    const openDeleteModal = (job) => {
        setDeleteModal({ isOpen: true, job });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, job: null });
    };

    const deleteJob = async () => {
        if (!deleteModal.job) return;
        try {
            await jobordersAPI.delete(deleteModal.job.id);
            toast.success(`Order ${deleteModal.job.job_number} deleted`);
            fetchJobs(); fetchStats();
            closeDeleteModal();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete');
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.design_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

    return (
        <>
            <div className="space-y-6 animate-fadeIn">
                <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .table-row-hover:hover { background: linear-gradient(90deg, rgba(236, 72, 153, 0.05) 0%, transparent 100%); }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
                .stat-card { transition: all 0.3s ease; }
                .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
            `}</style>

                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-pink-600 to-rose-600 p-6 shadow-xl">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    <FiClipboard className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">Orders</h1>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white/70 text-sm">Manage printing orders</p>
                                        <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>Live
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Link to="/joborders/create" className="flex items-center gap-2 px-5 py-2.5 bg-white text-pink-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                            <FiPlus className="w-4 h-4" />New Order
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[
                        { icon: FiClipboard, label: 'Total Orders', value: stats.total || 0, color: 'blue' },
                        { icon: FiRefreshCw, label: 'In Progress', value: stats.in_progress || 0, color: 'orange' },
                        { icon: FiCheckCircle, label: 'Ready', value: stats.ready || 0, color: 'green' },
                        { icon: FiAlertCircle, label: 'Overdue', value: stats.overdue || 0, color: 'red' },
                        { icon: FiAlertTriangle, label: 'Deadline Soon', value: stats.deadline_warnings || 0, color: 'yellow' },
                        { icon: FiTruck, label: 'Delivered Today', value: stats.delivered_today || 0, color: 'purple' },
                    ].map((stat, idx) => (
                        <div key={idx} className={`stat-card glass-card rounded-xl p-4 shadow-sm border border-gray-100`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="glass-card rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border-2 border-transparent focus-within:border-pink-500 focus-within:bg-white transition-all">
                                <FiSearch className="w-5 h-5 text-gray-400" />
                                <input type="text" placeholder="Search by order number, customer, design..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none w-full text-gray-700" />
                            </div>
                        </form>
                        <Dropdown
                            className="min-w-[140px]"
                            options={[
                                { value: '', label: 'All Status' },
                                ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({ value: key, label: config.label }))
                            ]}
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {['', 'received', 'finishing', 'ready', 'delivered'].map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === status ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {status ? STATUS_CONFIG[status]?.label : 'All'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-transparent border-t-pink-500 rounded-full animate-spin"></div>
                                <FiClipboard className="absolute inset-0 m-auto w-6 h-6 text-pink-500" />
                            </div>
                            <p className="text-gray-500 font-medium">Loading orders...</p>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><FiClipboard className="w-8 h-8 text-gray-400" /></div>
                            <h3 className="font-semibold text-gray-800 mb-2">No orders found</h3>
                            <Link to="/joborders/create" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium shadow-lg">
                                <FiPlus className="w-4 h-4" />Create First Order
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/80">
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order #</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Design</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Material</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Delivery</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Workers</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredJobs.map((job) => {
                                        const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.received;
                                        const StatusIcon = statusConfig.icon;
                                        return (
                                            <tr key={job.id} className="table-row-hover transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-gray-900">{job.job_number}</span>
                                                    <p className="text-xs text-gray-500">{formatDate(job.job_date)}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-800">{job.customer_name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-800">{job.design_name}</span>
                                                    {job.num_colors > 1 && <span className="ml-2 text-xs text-gray-500">({job.num_colors} colors)</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-700">{job.material_quantity} {job.material_unit}</span>
                                                    {job.material_type_name && <p className="text-xs text-gray-500">{job.material_type_name}</p>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-medium ${job.deadline_status === 'overdue' ? 'text-red-600' :
                                                        job.deadline_status === 'danger' ? 'text-red-500' :
                                                            job.deadline_status === 'warning' ? 'text-amber-600' :
                                                                'text-gray-700'
                                                        }`}>{formatDate(job.expected_delivery)}</span>
                                                    {job.deadline_status === 'overdue' && <span className="block text-xs font-semibold text-red-500 animate-pulse">⬛ OVERDUE</span>}
                                                    {job.deadline_status === 'danger' && <span className="block text-xs font-semibold text-red-400">🔴 Due Tomorrow</span>}
                                                    {job.deadline_status === 'warning' && <span className="block text-xs font-medium text-amber-500">🟡 Due Soon</span>}
                                                    {job.deadline_status === 'safe' && <span className="block text-xs text-green-500">🟢 On Track</span>}
                                                    {job.priority === 'urgent' && !['delivered', 'cancelled'].includes(job.status) && (
                                                        <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                                            <FiZap className="w-2.5 h-2.5" />URGENT
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {job.assigned_worker_names && job.assigned_worker_names.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {job.assigned_worker_names.slice(0, 2).map((name, i) => (
                                                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                                    <FiUsers className="w-3 h-3" />{name}
                                                                </span>
                                                            ))}
                                                            {job.assigned_worker_names.length > 2 && (
                                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">+{job.assigned_worker_names.length - 2}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <button onClick={(e) => handleStatusClick(job.id, e)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />{statusConfig.label}<FiChevronDown className="w-3 h-3" />
                                                        </button>
                                                        {/* Progress bar for finishing jobs */}
                                                        {job.status === 'finishing' && job.estimated_hours > 0 && (
                                                            <div className="w-full">
                                                                <div className="flex items-center gap-1">
                                                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-500 ${job.progress_percent >= 100 ? 'bg-green-500 animate-pulse' :
                                                                                job.progress_percent >= 75 ? 'bg-teal-500' :
                                                                                    job.progress_percent >= 50 ? 'bg-blue-500' :
                                                                                        'bg-indigo-500'
                                                                                }`}
                                                                            style={{ width: `${Math.min(job.progress_percent, 100)}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-[10px] font-medium text-gray-500 min-w-[30px] text-right">{job.progress_percent}%</span>
                                                                </div>
                                                                {job.progress_percent >= 100 && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); updateStatus(job.id, 'ready'); }}
                                                                        className="mt-1 w-full px-2 py-1 text-[10px] font-bold bg-green-500 text-white rounded-lg shadow-lg shadow-green-200 animate-pulse hover:bg-green-600 transition-colors"
                                                                    >
                                                                        ✅ Mark Ready?
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-gray-900">{formatCurrency(job.total)}</span>
                                                    {job.balance > 0 && <p className="text-xs text-red-500">Due: {formatCurrency(job.balance)}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link to={`/joborders/${job.id}/edit`} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit"><FiEdit2 className="w-4 h-4" /></Link>
                                                        <button onClick={() => openDeleteModal(job)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed-position Status Dropdown (outside table to avoid overflow clipping) */}
            {showStatusDropdown && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(null)}></div>
                    <div
                        className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 min-w-[170px]"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                    >
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                            const currentJob = jobs.find(j => j.id === showStatusDropdown);
                            return (
                                <button key={key} onClick={() => updateStatus(showStatusDropdown, key)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 transition-colors ${currentJob?.status === key ? 'bg-pink-50 text-pink-600 font-medium' : 'text-gray-700'}`}>
                                    <config.icon className="w-4 h-4" />{config.label}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={deleteJob}
                itemName={deleteModal.job?.job_number}
            />
        </>
    );
}
