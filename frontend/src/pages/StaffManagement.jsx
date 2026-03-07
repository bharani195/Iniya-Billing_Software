import { useState, useEffect } from 'react';
import {
    FiUsers, FiCalendar, FiFileText, FiPlus, FiTrash2, FiX, FiEdit2,
    FiCheck, FiDollarSign, FiDownload, FiAlertTriangle, FiClock,
    FiUserCheck, FiUserX, FiStar, FiRefreshCw, FiSun
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { staffAPI } from '../services/api';
import DatePicker from '../components/DatePicker';
import Dropdown from '../components/Dropdown';
import { format } from 'date-fns';

// Reusable Modal
function Modal({ isOpen, onClose, title, children, wide }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className={`relative ${wide ? 'max-w-2xl' : 'max-w-md'} w-full bg-white rounded-2xl shadow-2xl transform transition-all animate-fadeIn`} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><FiX className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

// Delete confirm modal
function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl transform transition-all animate-fadeIn" onClick={e => e.stopPropagation()}>
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <FiAlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Staff</h3>
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
}

export default function StaffManagement() {
    const [activeTab, setActiveTab] = useState('staff');
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [staffStats, setStaffStats] = useState({});

    // Staff form
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [staffForm, setStaffForm] = useState({
        name: '', phone: '', role: 'helper', salary_type: 'daily',
        daily_rate: '', monthly_salary: '', joining_date: '', is_active: true,
        aadhar_number: '', bank_account: '', bank_name: '', address: ''
    });
    const [deleteModal, setDeleteModal] = useState({ open: false, item: null });

    // Attendance
    const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});

    // Pay Slips
    const [paySlipMonth, setPaySlipMonth] = useState(new Date().getMonth() + 1);
    const [paySlipYear, setPaySlipYear] = useState(new Date().getFullYear());
    const [paySlips, setPaySlips] = useState([]);
    const [monthlySummary, setMonthlySummary] = useState(null);

    // Holidays
    const [holidays, setHolidays] = useState([]);
    const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());
    const [showAddHoliday, setShowAddHoliday] = useState(false);
    const [holidayForm, setHolidayForm] = useState({ name: '', date: '', holiday_type: 'government' });

    useEffect(() => { fetchStaff(); }, []);
    useEffect(() => { if (activeTab === 'attendance') fetchAttendance(); }, [activeTab, attendanceDate]);
    useEffect(() => { if (activeTab === 'payslips') { fetchPaySlips(); fetchMonthlySummary(); } }, [activeTab, paySlipMonth, paySlipYear]);
    useEffect(() => { if (activeTab === 'holidays') fetchHolidays(); }, [activeTab, holidayYear]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const [staffRes, statsRes] = await Promise.all([
                staffAPI.getAll(),
                staffAPI.getStats().catch(() => ({ data: {} }))
            ]);
            setStaffList(staffRes.data.results || staffRes.data);
            setStaffStats(statsRes.data);
        } catch { toast.error('Failed to load staff'); }
        setLoading(false);
    };

    const fetchAttendance = async () => {
        try {
            const res = await staffAPI.getAttendance({ date: attendanceDate });
            const records = res.data.results || res.data;
            setAttendanceRecords(records);
            const dataMap = {};
            (Array.isArray(records) ? records : []).forEach(r => {
                dataMap[r.staff] = { status: r.status, overtime_hours: r.overtime_hours || 0, notes: r.notes || '' };
            });
            setAttendanceData(dataMap);
        } catch { setAttendanceRecords([]); setAttendanceData({}); }
    };

    const fetchPaySlips = async () => {
        try {
            const res = await staffAPI.getPaySlips({ month: paySlipMonth, year: paySlipYear });
            setPaySlips(res.data.results || res.data);
        } catch { setPaySlips([]); }
    };

    const fetchMonthlySummary = async () => {
        try {
            const res = await staffAPI.getMonthlySummary({ month: paySlipMonth, year: paySlipYear });
            setMonthlySummary(res.data);
        } catch { setMonthlySummary(null); }
    };

    // Staff CRUD
    const openAddStaff = () => {
        setEditingStaff(null);
        setStaffForm({
            name: '', phone: '', role: 'helper', salary_type: 'daily',
            daily_rate: '', monthly_salary: '', joining_date: '', is_active: true,
            aadhar_number: '', bank_account: '', bank_name: '', address: ''
        });
        setShowStaffModal(true);
    };

    const openEditStaff = (staff) => {
        setEditingStaff(staff);
        setStaffForm({
            name: staff.name, phone: staff.phone || '', role: staff.role,
            salary_type: staff.salary_type, daily_rate: staff.daily_rate || '',
            monthly_salary: staff.monthly_salary || '', joining_date: staff.joining_date || '',
            is_active: staff.is_active, aadhar_number: staff.aadhar_number || '',
            bank_account: staff.bank_account || '', bank_name: staff.bank_name || '',
            address: staff.address || ''
        });
        setShowStaffModal(true);
    };

    const handleStaffSubmit = async (e) => {
        e.preventDefault();
        // Clean form data — convert empty strings to proper defaults
        const cleanData = {
            ...staffForm,
            daily_rate: staffForm.daily_rate === '' ? 0 : staffForm.daily_rate,
            monthly_salary: staffForm.monthly_salary === '' ? 0 : staffForm.monthly_salary,
            joining_date: staffForm.joining_date || null,
        };
        try {
            if (editingStaff) {
                await staffAPI.update(editingStaff.id, cleanData);
                toast.success('Staff updated');
            } else {
                await staffAPI.create(cleanData);
                toast.success('Staff added');
            }
            setShowStaffModal(false);
            fetchStaff();
        } catch (err) {
            const detail = err.response?.data;
            const msg = detail ? Object.values(detail).flat().join(', ') : 'Failed to save staff';
            toast.error(msg);
        }
    };

    const handleDeleteStaff = async () => {
        try {
            await staffAPI.delete(deleteModal.item.id);
            toast.success('Staff deleted');
            setDeleteModal({ open: false, item: null });
            fetchStaff();
        } catch { toast.error('Failed to delete'); }
    };

    // Attendance
    const updateAttendanceField = (staffId, field, value) => {
        setAttendanceData(prev => ({
            ...prev,
            [staffId]: { ...(prev[staffId] || { status: 'present', overtime_hours: 0, notes: '' }), [field]: value }
        }));
    };

    const saveAttendance = async () => {
        const activeStaff = staffList.filter(s => s.is_active);
        const records = activeStaff.map(s => ({
            staff_id: String(s.id),
            status: attendanceData[s.id]?.status || 'present',
            overtime_hours: String(attendanceData[s.id]?.overtime_hours || '0'),
            notes: attendanceData[s.id]?.notes || ''
        }));

        try {
            const res = await staffAPI.bulkMarkAttendance({ date: attendanceDate, records });
            toast.success(res.data.message);
            fetchAttendance();
        } catch { toast.error('Failed to save attendance'); }
    };

    // Pay Slips
    const generatePaySlip = async (staffId) => {
        try {
            await staffAPI.generatePaySlip({ staff_id: staffId, month: paySlipMonth, year: paySlipYear });
            toast.success('Pay slip generated');
            fetchPaySlips();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to generate');
        }
    };

    const downloadPaySlip = async (payslipId) => {
        try {
            const res = await staffAPI.downloadPaySlip(payslipId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `PaySlip_${payslipId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Pay slip downloaded');
        } catch { toast.error('Failed to download'); }
    };

    const markPaid = async (payslipId) => {
        try {
            await staffAPI.markPaid(payslipId, { payment_mode: 'cash' });
            toast.success('Marked as paid');
            fetchPaySlips();
        } catch { toast.error('Failed to mark as paid'); }
    };

    const resetPaid = async (payslipId) => {
        try {
            await staffAPI.resetPaid(payslipId);
            toast.success('Reset to pending');
            fetchPaySlips();
        } catch { toast.error('Failed to reset'); }
    };

    const deletePaySlip = async (payslipId) => {
        try {
            await staffAPI.removePaySlip(payslipId);
            toast.success('Pay slip deleted');
            fetchPaySlips();
        } catch { toast.error('Failed to delete'); }
    };

    // ===== Holiday Functions =====
    const fetchHolidays = async () => {
        try {
            const res = await staffAPI.getHolidays({ year: holidayYear });
            setHolidays(res.data.results || res.data);
        } catch { toast.error('Failed to fetch holidays'); }
    };

    const addHoliday = async (e) => {
        e.preventDefault();
        try {
            await staffAPI.createHoliday(holidayForm);
            toast.success('Holiday added');
            setShowAddHoliday(false);
            setHolidayForm({ name: '', date: '', holiday_type: 'government' });
            fetchHolidays();
        } catch (err) {
            const detail = err.response?.data;
            toast.error(detail ? Object.values(detail).flat().join(', ') : 'Failed to add holiday');
        }
    };

    const deleteHoliday = async (id) => {
        try {
            await staffAPI.deleteHoliday(id);
            toast.success('Holiday removed');
            fetchHolidays();
        } catch { toast.error('Failed to delete holiday'); }
    };

    const loadDefaultHolidays = async () => {
        const y = holidayYear;
        const defaults = [
            { name: 'New Year', date: `${y}-01-01`, holiday_type: 'festival' },
            { name: 'Pongal', date: `${y}-01-14`, holiday_type: 'festival' },
            { name: 'Pongal (Day 2)', date: `${y}-01-15`, holiday_type: 'festival' },
            { name: 'Republic Day', date: `${y}-01-26`, holiday_type: 'government' },
            { name: 'May Day', date: `${y}-05-01`, holiday_type: 'government' },
            { name: 'Independence Day', date: `${y}-08-15`, holiday_type: 'government' },
            { name: 'Gandhi Jayanti', date: `${y}-10-02`, holiday_type: 'government' },
            { name: 'Diwali', date: `${y}-10-20`, holiday_type: 'festival' },
            { name: 'Christmas', date: `${y}-12-25`, holiday_type: 'festival' },
        ];
        try {
            const res = await staffAPI.bulkCreateHolidays({ holidays: defaults });
            toast.success(res.data.message);
            fetchHolidays();
        } catch { toast.error('Failed to load holidays'); }
    };

    const formatCurrency = (a) => `₹${parseFloat(a || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const statusBtnConfig = [
        { key: 'present', label: '✓', title: 'Present', bg: 'bg-emerald-500', ring: 'ring-emerald-200', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { key: 'absent', label: '✗', title: 'Absent', bg: 'bg-red-500', ring: 'ring-red-200', light: 'bg-red-50 text-red-700 border-red-200' },
        { key: 'half_day', label: '½', title: 'Half Day', bg: 'bg-amber-500', ring: 'ring-amber-200', light: 'bg-amber-50 text-amber-700 border-amber-200' },
        { key: 'leave', label: 'L', title: 'Leave', bg: 'bg-blue-500', ring: 'ring-blue-200', light: 'bg-blue-50 text-blue-700 border-blue-200' },
    ];

    const roleColors = {
        helper: '#F59E0B', designer: '#EC4899',
        driver: '#10B981', operator: '#06B6D4',
        manager: '#EF4444', other: '#6B7280',
    };

    const tabs = [
        { id: 'staff', label: 'Staff List', icon: FiUsers },
        { id: 'attendance', label: 'Attendance', icon: FiCalendar },
        { id: 'payslips', label: 'Pay Slips', icon: FiFileText },
        { id: 'holidays', label: 'Holidays', icon: FiSun },
    ];

    const activeStaff = staffList.filter(s => s.is_active);

    return (
        <div className="space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .input-staff { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .input-staff:focus { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15); }
                .table-row-hover:hover { background: linear-gradient(90deg, rgba(139, 92, 246, 0.04) 0%, transparent 100%); }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
                .btn-status { transition: all 0.15s ease; }
                .btn-status:hover { transform: scale(1.08); }
                .btn-status:active { transform: scale(0.95); }
            `}</style>

            {/* Gradient Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FiUsers className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Staff Management</h1>
                                <p className="text-white/70 text-sm">Manage staff, attendance & pay slips</p>
                            </div>
                        </div>
                    </div>
                    {activeTab === 'staff' && (
                        <button onClick={openAddStaff} className="flex items-center gap-2 px-5 py-2.5 bg-white text-violet-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                            <FiPlus className="w-4 h-4" />Add Staff
                        </button>
                    )}
                    {activeTab === 'attendance' && (
                        <button onClick={saveAttendance} className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                            <FiCheck className="w-4 h-4" />Save Attendance
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl shadow-sm border border-violet-100 p-4 bg-gradient-to-br from-violet-50 to-purple-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-violet-500 text-xs font-semibold uppercase tracking-wider">Total Staff</p>
                            <p className="text-2xl font-bold text-violet-700 mt-1">{staffStats.total_staff || staffList.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-200">
                            <FiUsers className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-2xl shadow-sm border border-emerald-100 p-4 bg-gradient-to-br from-emerald-50 to-green-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-500 text-xs font-semibold uppercase tracking-wider">Active</p>
                            <p className="text-2xl font-bold text-emerald-700 mt-1">{staffStats.active_staff || activeStaff.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                            <FiUserCheck className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-2xl shadow-sm border border-blue-100 p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-500 text-xs font-semibold uppercase tracking-wider">Today Present</p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">{staffStats.today_present || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-200">
                            <FiCalendar className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-2xl shadow-sm border border-amber-100 p-4 bg-gradient-to-br from-amber-50 to-yellow-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-500 text-xs font-semibold uppercase tracking-wider">Half Day</p>
                            <p className="text-2xl font-bold text-amber-700 mt-1">{staffStats.today_half_day || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-200">
                            <FiClock className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="glass-card rounded-2xl shadow-sm border border-gray-100 p-1.5">
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all flex-1
                                ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══════ TAB 1: Staff List ═══════ */}
            {activeTab === 'staff' && (
                <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-violet-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
                                <FiUsers className="absolute inset-0 m-auto w-6 h-6 text-violet-500" />
                            </div>
                            <p className="text-gray-500 font-medium">Loading staff...</p>
                        </div>
                    ) : staffList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/80">
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary Type</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate / Salary</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {staffList.map(s => (
                                        <tr key={s.id} className="table-row-hover transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ backgroundColor: roleColors[s.role] || '#6B7280' }}>
                                                        {s.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-800">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm" style={{ backgroundColor: roleColors[s.role] || '#6B7280' }}>
                                                    {s.role_display}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.salary_type === 'daily' ? 'bg-cyan-100 text-cyan-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {s.salary_type_display}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-800">
                                                {s.salary_type === 'daily' ? `${formatCurrency(s.daily_rate)}/day` : `${formatCurrency(s.monthly_salary)}/mo`}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{s.phone || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {s.is_active ? <><FiUserCheck className="w-3 h-3" /> Active</> : <><FiUserX className="w-3 h-3" /> Inactive</>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => openEditStaff(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => setDeleteModal({ open: true, item: s })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-4">
                                <FiUsers className="w-10 h-10 text-violet-400" />
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg">No staff members yet</h3>
                            <p className="text-gray-400 text-sm mt-1 mb-4">Add your first staff member to get started</p>
                            <button onClick={openAddStaff} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl transition-all">
                                <FiPlus className="w-4 h-4" />Add Staff
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ TAB 2: Attendance ═══════ */}
            {activeTab === 'attendance' && (
                <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Date Selector Bar */}
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-violet-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
                                <FiCalendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-800">Daily Attendance</h2>
                                <p className="text-xs text-gray-500">{activeStaff.length} active staff</p>
                            </div>
                        </div>
                        <DatePicker
                            value={attendanceDate}
                            onChange={(val) => setAttendanceDate(val)}
                            placeholder="Select date"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">OT Hours</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activeStaff.map(s => {
                                    const rec = attendanceData[s.id] || { status: 'present', overtime_hours: 0, notes: '' };
                                    return (
                                        <tr key={s.id} className="table-row-hover transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ backgroundColor: roleColors[s.role] || '#6B7280' }}>
                                                        {s.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-800">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: roleColors[s.role] || '#6B7280' }}>
                                                    {s.role_display}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    {statusBtnConfig.map(opt => (
                                                        <button
                                                            key={opt.key}
                                                            title={opt.title}
                                                            onClick={() => updateAttendanceField(s.id, 'status', opt.key)}
                                                            className={`btn-status w-10 h-10 rounded-xl font-bold text-sm border-2 ${rec.status === opt.key
                                                                ? `${opt.bg} text-white border-transparent ring-4 ${opt.ring} shadow-md`
                                                                : `${opt.light} hover:shadow-sm`
                                                                }`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.5"
                                                        value={rec.overtime_hours}
                                                        onChange={(e) => updateAttendanceField(s.id, 'overtime_hours', e.target.value)}
                                                        className="input-staff w-20 px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:border-violet-400 outline-none text-center font-semibold"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={rec.notes}
                                                    onChange={(e) => updateAttendanceField(s.id, 'notes', e.target.value)}
                                                    placeholder="Optional note..."
                                                    className="input-staff w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:border-violet-400 outline-none"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                                {activeStaff.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-16">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                                <FiCalendar className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No active staff. Add staff members first.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══════ TAB 3: Pay Slips ═══════ */}
            {activeTab === 'payslips' && (
                <div className="space-y-5">
                    {/* Month/Year Selector */}
                    <div className="glass-card rounded-2xl shadow-sm border border-gray-100 p-5 bg-gradient-to-r from-emerald-50 to-green-50 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                                <FiFileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-800">Pay Slips</h2>
                                <p className="text-xs text-gray-500">Generate & download monthly pay slips</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                            <Dropdown
                                className="min-w-[140px]"
                                options={monthNames.map((m, i) => ({ value: i + 1, label: m }))}
                                value={paySlipMonth}
                                onChange={(val) => setPaySlipMonth(parseInt(val))}
                            />
                            <input
                                type="number"
                                value={paySlipYear}
                                onChange={(e) => setPaySlipYear(parseInt(e.target.value))}
                                className="input-staff w-24 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm font-semibold bg-white"
                            />
                        </div>
                    </div>

                    {/* Pay Slip Table */}
                    <div className="glass-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/80">
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
                                        <th className="text-center px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Present</th>
                                        <th className="text-center px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Half</th>
                                        <th className="text-center px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Absent</th>
                                        <th className="text-center px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">OT Hrs</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Salary</th>
                                        <th className="text-center px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activeStaff.map(s => {
                                        const slip = paySlips.find(p => p.staff === s.id);
                                        const summary = monthlySummary?.summary?.find(ms => ms.staff_id === s.id);
                                        return (
                                            <tr key={s.id} className="table-row-hover transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ backgroundColor: roleColors[s.role] || '#6B7280' }}>
                                                            {s.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-800">{s.name}</div>
                                                            <div className="text-xs text-gray-400">{s.role_display} • {s.salary_type === 'daily' ? `${formatCurrency(s.daily_rate)}/day` : `${formatCurrency(s.monthly_salary)}/mo`}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
                                                        {slip ? slip.days_present : (summary?.present || '—')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold text-sm">
                                                        {slip ? slip.half_days : (summary?.half_day || '—')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold text-sm">
                                                        {slip ? slip.days_absent : (summary?.absent || '—')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center text-sm font-semibold text-gray-600">
                                                    {slip ? slip.overtime_hours : (summary?.overtime_hours || '—')}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {slip ? (
                                                        <span className="font-bold text-lg text-emerald-600">{formatCurrency(slip.net_salary)}</span>
                                                    ) : <span className="text-gray-400 text-sm">—</span>}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {slip ? (
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${slip.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {slip.payment_status === 'paid' ? <><FiCheck className="w-3 h-3" /> Paid</> : <><FiClock className="w-3 h-3" /> Pending</>}
                                                        </span>
                                                    ) : <span className="text-gray-300 text-xs font-medium">Not generated</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-1">
                                                        {!slip ? (
                                                            <button onClick={() => generatePaySlip(s.id)} className="px-3.5 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-violet-200 transition-all flex items-center gap-1.5">
                                                                <FiStar className="w-3 h-3" /> Generate
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => downloadPaySlip(slip.id)} title="Download PDF" className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><FiDownload className="w-4 h-4" /></button>
                                                                {slip.payment_status === 'paid' ? (
                                                                    <button onClick={() => resetPaid(slip.id)} title="Reset to Pending" className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><FiRefreshCw className="w-4 h-4" /></button>
                                                                ) : (
                                                                    <button onClick={() => markPaid(slip.id)} title="Mark Paid" className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><FiDollarSign className="w-4 h-4" /></button>
                                                                )}
                                                                <button onClick={() => deletePaySlip(slip.id)} title="Delete & Regenerate" className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 className="w-3.5 h-3.5" /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {activeStaff.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-16">
                                                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                                    <FiFileText className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-gray-500 font-medium">No active staff members.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ HOLIDAYS TAB ═══════ */}
            {activeTab === 'holidays' && (
                <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-800">Holiday Calendar</h3>
                            <Dropdown
                                className="min-w-[100px]"
                                options={[...Array(5)].map((_, i) => { const y = new Date().getFullYear() - 1 + i; return { value: y, label: String(y) }; })}
                                value={holidayYear}
                                onChange={(val) => setHolidayYear(parseInt(val))}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={loadDefaultHolidays}
                                className="px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors flex items-center gap-2 border border-amber-200">
                                <FiStar className="w-4 h-4" /> Load Indian Holidays
                            </button>
                            <button onClick={() => setShowAddHoliday(true)}
                                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2">
                                <FiPlus className="w-4 h-4" /> Add Holiday
                            </button>
                        </div>
                    </div>

                    {/* Holiday Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-xs text-gray-500 font-medium">Total Holidays</p>
                            <p className="text-2xl font-bold text-violet-600 mt-1">{holidays.length}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-xs text-gray-500 font-medium">Government</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{holidays.filter(h => h.holiday_type === 'government').length}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-xs text-gray-500 font-medium">Festival</p>
                            <p className="text-2xl font-bold text-pink-600 mt-1">{holidays.filter(h => h.holiday_type === 'festival').length}</p>
                        </div>
                    </div>

                    {/* Holiday List by Month */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {(() => {
                            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                            const grouped = {};
                            holidays.forEach(h => {
                                const m = new Date(h.date).getMonth();
                                if (!grouped[m]) grouped[m] = [];
                                grouped[m].push(h);
                            });
                            const monthsWithHolidays = Object.keys(grouped).sort((a, b) => a - b);
                            if (monthsWithHolidays.length === 0) {
                                return (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                            <FiSun className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium">No holidays added for {holidayYear}.</p>
                                        <p className="text-gray-400 text-sm mt-1">Click "Load Indian Holidays" to get started.</p>
                                    </div>
                                );
                            }
                            return monthsWithHolidays.map(m => (
                                <div key={m}>
                                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                                        <h4 className="font-bold text-gray-700 text-sm">{months[m]} {holidayYear}</h4>
                                    </div>
                                    {grouped[m].map(h => {
                                        const typeColors = { government: 'bg-blue-100 text-blue-700', festival: 'bg-pink-100 text-pink-700', company: 'bg-green-100 text-green-700' };
                                        const dayName = new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short' });
                                        const dayNum = new Date(h.date).getDate();
                                        return (
                                            <div key={h.id} className="flex items-center justify-between px-6 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-violet-50 flex flex-col items-center justify-center text-violet-600">
                                                        <span className="text-xs font-medium leading-none">{dayName}</span>
                                                        <span className="text-lg font-bold leading-none mt-0.5">{dayNum}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{h.name}</p>
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${typeColors[h.holiday_type] || 'bg-gray-100 text-gray-600'}`}>
                                                            {h.holiday_type_display}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button onClick={() => deleteHoliday(h.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}

            {/* ═══════ Add Holiday Modal ═══════ */}
            <Modal isOpen={showAddHoliday} onClose={() => setShowAddHoliday(false)} title="Add Holiday">
                <form onSubmit={addHoliday} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Holiday Name *</label>
                        <input type="text" value={holidayForm.name} onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none"
                            placeholder="e.g. Pongal, Republic Day" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                            <DatePicker value={holidayForm.date} onChange={(val) => setHolidayForm({ ...holidayForm, date: val })} placeholder="Select holiday date" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                            <Dropdown
                                options={[
                                    { value: 'government', label: 'Government Holiday' },
                                    { value: 'festival', label: 'Festival Holiday' },
                                    { value: 'company', label: 'Company Holiday' },
                                ]}
                                value={holidayForm.holiday_type}
                                onChange={(val) => setHolidayForm({ ...holidayForm, holiday_type: val })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={() => setShowAddHoliday(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">Add Holiday</button>
                    </div>
                </form>
            </Modal>

            {/* ═══════ Add/Edit Staff Modal ═══════ */}
            <Modal isOpen={showStaffModal} onClose={() => setShowStaffModal(false)} title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'} wide>
                <form onSubmit={handleStaffSubmit}>
                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                <input type="text" required value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                                    className="input-staff w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none" placeholder="Enter name" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                <input type="text" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                                    className="input-staff w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none" placeholder="9876543210" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                <Dropdown
                                    options={[
                                        { value: 'helper', label: 'Helper' },
                                        { value: 'designer', label: 'Designer' },
                                        { value: 'driver', label: 'Driver' },
                                        { value: 'operator', label: 'Machine Operator' },
                                        { value: 'manager', label: 'Manager' },
                                        { value: 'other', label: 'Other' },
                                    ]}
                                    value={staffForm.role}
                                    onChange={(val) => setStaffForm({ ...staffForm, role: val })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Type</label>
                                <Dropdown
                                    options={[
                                        { value: 'daily', label: 'Daily Wage' },
                                        { value: 'monthly', label: 'Monthly Salary' },
                                    ]}
                                    value={staffForm.salary_type}
                                    onChange={(val) => setStaffForm({ ...staffForm, salary_type: val })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {staffForm.salary_type === 'daily' ? (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Rate (₹) *</label>
                                    <input type="number" step="0.01" value={staffForm.daily_rate} onChange={(e) => setStaffForm({ ...staffForm, daily_rate: e.target.value })}
                                        className="input-staff w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none" placeholder="800" />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Salary (₹) *</label>
                                    <input type="number" step="0.01" value={staffForm.monthly_salary} onChange={(e) => setStaffForm({ ...staffForm, monthly_salary: e.target.value })}
                                        className="input-staff w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none" placeholder="15000" />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Joining Date</label>
                                <DatePicker value={staffForm.joining_date} onChange={(val) => setStaffForm({ ...staffForm, joining_date: val })} placeholder="Select joining date" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Account</label>
                                <input type="text" value={staffForm.bank_account} onChange={(e) => setStaffForm({ ...staffForm, bank_account: e.target.value })}
                                    className="input-staff w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none" placeholder="Account number" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                                <input type="text" value={staffForm.bank_name} onChange={(e) => setStaffForm({ ...staffForm, bank_name: e.target.value })}
                                    className="input-staff w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-violet-500 outline-none" placeholder="SBI, HDFC..." />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={staffForm.is_active} onChange={(e) => setStaffForm({ ...staffForm, is_active: e.target.checked })}
                                    className="w-5 h-5 text-violet-600 rounded-md border-2 border-gray-300 focus:ring-violet-500" />
                                <span className="text-sm font-semibold text-gray-700">Active Employee</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
                        <button type="button" onClick={() => setShowStaffModal(false)} className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl transition-all">
                            {editingStaff ? 'Update Staff' : 'Add Staff'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, item: null })}
                onConfirm={handleDeleteStaff}
                itemName={deleteModal.item?.name || 'staff member'}
            />
        </div>
    );
}
