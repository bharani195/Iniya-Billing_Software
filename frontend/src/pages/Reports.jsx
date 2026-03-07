import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { FiCalendar, FiTrendingUp, FiTrendingDown, FiDollarSign, FiBox, FiBarChart2, FiPieChart, FiActivity, FiRefreshCw, FiDownload, FiArrowUpRight, FiArrowDownRight, FiZap, FiTarget, FiAward, FiUsers } from 'react-icons/fi';
import { reportsAPI } from '../services/api';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';
import DatePicker from '../components/DatePicker';
import Dropdown from '../components/Dropdown';

export default function Reports() {
    const [activeTab, setActiveTab] = useState('sales');
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Salary report state
    const [salaryData, setSalaryData] = useState(null);
    const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
    const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
    const [salaryReportType, setSalaryReportType] = useState('monthly');
    const [salaryLoading, setSalaryLoading] = useState(false);

    useEffect(() => { if (activeTab === 'salary') fetchSalaryReport(); else fetchReport(); }, [activeTab, dateRange, salaryMonth, salaryYear, salaryReportType]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = { start_date: dateRange.start, end_date: dateRange.end };
            let response;
            switch (activeTab) {
                case 'sales': response = await reportsAPI.getSales(params); break;
                case 'purchase': response = await reportsAPI.getPurchase(params); break;
                case 'profit': response = await reportsAPI.getProfitLoss(params); break;
                case 'gst': response = await reportsAPI.getGST(params); break;
                case 'stock': response = await reportsAPI.getStock(); break;
                default: response = await reportsAPI.getSales(params);
            }
            setData(response.data);
        } catch { toast.error('Failed to load report'); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const handleRefresh = () => { setRefreshing(true); if (activeTab === 'salary') fetchSalaryReport(); else fetchReport(); };

    const fetchSalaryReport = async () => {
        setSalaryLoading(true);
        try {
            const params = { type: salaryReportType, month: salaryMonth, year: salaryYear };
            const response = await reportsAPI.getStaffSalary(params);
            setSalaryData(response.data);
        } catch { toast.error('Failed to load salary report'); }
        finally { setSalaryLoading(false); setRefreshing(false); }
    };

    const downloadExcel = async () => {
        try {
            const params = { type: salaryReportType, month: salaryMonth, year: salaryYear };
            const response = await reportsAPI.downloadStaffSalaryExcel(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            link.setAttribute('download', salaryReportType === 'monthly' ? `Staff_Salary_${monthNames[salaryMonth - 1]}_${salaryYear}.xlsx` : `Staff_Salary_Yearly_${salaryYear}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Excel downloaded!');
        } catch { toast.error('Failed to download Excel'); }
    };

    const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString('en-IN')}`;
    const tabs = [
        { id: 'sales', label: 'Sales', icon: FiTrendingUp, color: 'from-emerald-500 to-teal-600' },
        { id: 'purchase', label: 'Purchase', icon: FiTrendingDown, color: 'from-orange-500 to-amber-600' },
        { id: 'profit', label: 'P&L', icon: FiTarget, color: 'from-blue-500 to-indigo-600' },
        { id: 'gst', label: 'GST', icon: FiDollarSign, color: 'from-violet-500 to-purple-600' },
        { id: 'stock', label: 'Stock', icon: FiBox, color: 'from-pink-500 to-rose-600' },
        { id: 'salary', label: 'Salary', icon: FiUsers, color: 'from-cyan-500 to-blue-600' },
    ];

    const salesChartOptions = {
        chart: { type: 'area', toolbar: { show: false }, sparkline: { enabled: false }, animations: { enabled: true, speed: 800, animateGradually: { enabled: true, delay: 150 } } },
        colors: ['#8B5CF6', '#06B6D4'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
        stroke: { curve: 'smooth', width: 3 },
        dataLabels: { enabled: false },
        xaxis: { categories: data?.daily_breakdown?.map(d => format(new Date(d.invoice_date), 'dd MMM')) || [], axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#94a3b8', fontFamily: 'inherit' } } },
        yaxis: { labels: { formatter: (v) => `₹${(v / 1000).toFixed(0)}K`, style: { colors: '#94a3b8' } } },
        grid: { borderColor: '#e2e8f0', strokeDashArray: 4, padding: { left: 10, right: 10 } },
        tooltip: { theme: 'light', y: { formatter: (v) => formatCurrency(v) } }
    };

    const donutChartOptions = {
        chart: { type: 'donut', animations: { enabled: true, speed: 800 } },
        colors: ['#10b981', '#3b82f6', '#ec4899', '#f59e0b'],
        labels: ['Paid', 'Pending', 'Overdue', 'Others'],
        legend: { position: 'bottom', fontFamily: 'inherit' },
        plotOptions: { pie: { donut: { size: '75%', labels: { show: true, name: { fontSize: '14px', color: '#64748b' }, value: { fontSize: '20px', fontWeight: 700, color: '#1e293b', formatter: (v) => formatCurrency(v) }, total: { show: true, label: 'Total', color: '#64748b', formatter: (w) => formatCurrency(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) } } } } },
        dataLabels: { enabled: false },
        stroke: { width: 0 }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); } 50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); } }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                @keyframes counter { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-counter { animation: counter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
                .glass-dark { background: rgba(0, 0, 0, 0.1); backdrop-filter: blur(10px); }
                .stat-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .stat-card:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .glow-violet { box-shadow: 0 0 60px rgba(139, 92, 246, 0.3); }
                .shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2s infinite; }
                .gradient-border { background: linear-gradient(135deg, #8B5CF6, #EC4899, #06B6D4) padding-box, linear-gradient(135deg, #8B5CF6, #EC4899, #06B6D4) border-box; }
                .tab-active { background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1)); }
            `}</style>

            {/* Epic Header */}
            <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 shadow-2xl glow-violet">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="text-white">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-lg">
                                    <FiBarChart2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-3 py-1 text-xs font-medium bg-white/20 rounded-full backdrop-blur">Analytics Dashboard</span>
                                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-emerald-500/30 text-emerald-200 rounded-full">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>Live
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-bold tracking-tight">Business Reports</h1>
                                </div>
                            </div>
                            <p className="text-white/60 text-lg max-w-md">Real-time analytics and insights to help you make data-driven decisions</p>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            {/* Tab Navigation — Top */}
                            <div className="flex flex-wrap gap-1.5 justify-end">
                                {tabs.map((tab, idx) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`group relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white text-gray-800 shadow-lg shadow-white/20' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                        {activeTab === tab.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"></div>}
                                    </button>
                                ))}
                            </div>

                            {/* Date Range Picker — Below Tabs */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/10">
                                    <FiCalendar className="w-5 h-5 text-white/70" />
                                    <DatePicker value={dateRange.start} onChange={(val) => setDateRange({ ...dateRange, start: val })} dark placeholder="Start date" />
                                    <span className="text-white/40">→</span>
                                    <DatePicker value={dateRange.end} onChange={(val) => setDateRange({ ...dateRange, end: val })} dark placeholder="End date" />
                                </div>
                                <button onClick={handleRefresh} disabled={refreshing} className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/20 transition-all disabled:opacity-50">
                                    <FiRefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
                                </button>
                                <button className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/20 transition-all">
                                    <FiDownload className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-violet-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
                        <FiActivity className="absolute inset-0 m-auto w-6 h-6 text-violet-500" />
                    </div>
                    <p className="text-gray-500 font-medium">Crunching the numbers...</p>
                </div>
            ) : (
                <div className="animate-slideUp">
                    {/* Sales Report */}
                    {activeTab === 'sales' && data && (
                        <div className="space-y-6">
                            {/* Hero Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-100 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                                                <FiZap className="w-6 h-6 text-violet-600" />
                                            </div>
                                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                                <FiArrowUpRight className="w-3 h-3" />+12%
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm font-medium mb-1">Total Invoices</p>
                                        <p className="text-4xl font-bold text-gray-800 animate-counter">{data.summary?.total_invoices || 0}</p>
                                    </div>
                                </div>

                                <div className="stat-card rounded-2xl p-6 shadow-lg relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white group">
                                    <div className="absolute inset-0 shimmer pointer-events-none"></div>
                                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                                <FiTrendingUp className="w-6 h-6" />
                                            </div>
                                            <FiAward className="w-5 h-5 text-yellow-300" />
                                        </div>
                                        <p className="text-white/80 text-sm font-medium mb-1">Total Sales</p>
                                        <p className="text-3xl font-bold animate-counter">{formatCurrency(data.summary?.total_sales)}</p>
                                    </div>
                                </div>

                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                                <FiDollarSign className="w-6 h-6 text-blue-600" />
                                            </div>
                                        </div>
                                        <p className="text-blue-600 text-sm font-medium mb-1">Amount Received</p>
                                        <p className="text-3xl font-bold text-blue-700 animate-counter">{formatCurrency(data.summary?.total_received)}</p>
                                    </div>
                                </div>

                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-red-100 bg-gradient-to-br from-red-50 to-white relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                                <FiArrowDownRight className="w-6 h-6 text-red-600" />
                                            </div>
                                        </div>
                                        <p className="text-red-600 text-sm font-medium mb-1">Pending Amount</p>
                                        <p className="text-3xl font-bold text-red-700 animate-counter">{formatCurrency(data.summary?.total_pending)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main Chart */}
                                <div className="lg:col-span-2 glass-card rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">Sales Trend</h3>
                                            <p className="text-gray-500 text-sm">Daily revenue over time</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="w-3 h-3 rounded-full bg-violet-500"></span>Revenue
                                            </span>
                                        </div>
                                    </div>
                                    {data?.daily_breakdown?.length > 0 ? (
                                        <Chart options={salesChartOptions} series={[{ name: 'Revenue', data: data.daily_breakdown.map(d => d.total) }]} type="area" height={320} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                                            <FiPieChart className="w-16 h-16 mb-4 opacity-30" />
                                            <p>No data available for this period</p>
                                        </div>
                                    )}
                                </div>

                                {/* Distribution Donut */}
                                <div className="glass-card rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <h3 className="font-bold text-gray-800 text-lg mb-2">Payment Status</h3>
                                    <p className="text-gray-500 text-sm mb-4">Invoice distribution</p>
                                    <Chart
                                        options={donutChartOptions}
                                        series={[
                                            data.summary?.total_received || 0,
                                            data.summary?.total_pending || 0,
                                            0, 0
                                        ]}
                                        type="donut"
                                        height={280}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Purchase Report */}
                    {activeTab === 'purchase' && data && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
                                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                                        <FiBox className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium mb-1">Total Purchases</p>
                                    <p className="text-4xl font-bold text-gray-800">{data.purchases?.count || 0}</p>
                                </div>
                                <div className="stat-card rounded-2xl p-6 shadow-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white relative overflow-hidden">
                                    <div className="absolute inset-0 shimmer pointer-events-none"></div>
                                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-3">
                                        <FiTrendingDown className="w-6 h-6" />
                                    </div>
                                    <p className="text-white/80 text-sm font-medium mb-1">Purchase Amount</p>
                                    <p className="text-3xl font-bold">{formatCurrency(data.purchases?.total)}</p>
                                </div>
                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                                        <FiDollarSign className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <p className="text-emerald-600 text-sm font-medium mb-1">Amount Paid</p>
                                    <p className="text-3xl font-bold text-emerald-700">{formatCurrency(data.purchases?.paid)}</p>
                                </div>
                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-red-100 bg-gradient-to-br from-red-50 to-white">
                                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-3">
                                        <FiActivity className="w-6 h-6 text-red-600" />
                                    </div>
                                    <p className="text-red-600 text-sm font-medium mb-1">Total Expenses</p>
                                    <p className="text-3xl font-bold text-red-700">{formatCurrency(data.expenses?.total)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profit & Loss */}
                    {activeTab === 'profit' && data && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass-card rounded-2xl p-8 shadow-lg border border-gray-100">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <FiTarget className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-xl">Profit & Loss Statement</h3>
                                        <p className="text-gray-500 text-sm">Financial summary for selected period</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-4 px-5 rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-100">
                                        <div className="flex items-center gap-3">
                                            <FiTrendingUp className="w-5 h-5 text-emerald-500" />
                                            <span className="font-medium text-gray-700">Sales Revenue</span>
                                        </div>
                                        <span className="text-xl font-bold text-emerald-600">{formatCurrency(data.income?.sales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 px-5 rounded-xl bg-gradient-to-r from-red-50 to-white border border-red-100">
                                        <div className="flex items-center gap-3">
                                            <FiTrendingDown className="w-5 h-5 text-red-500" />
                                            <span className="font-medium text-gray-700">Cost of Goods</span>
                                        </div>
                                        <span className="text-xl font-bold text-red-600">-{formatCurrency(data.cost_of_goods?.purchases)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 px-5 rounded-xl bg-blue-100 border border-blue-200">
                                        <span className="font-semibold text-gray-800">Gross Profit</span>
                                        <span className="text-xl font-bold text-blue-700">{formatCurrency(data.gross_profit)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 px-5 rounded-xl bg-gradient-to-r from-orange-50 to-white border border-orange-100">
                                        <div className="flex items-center gap-3">
                                            <FiActivity className="w-5 h-5 text-orange-500" />
                                            <span className="font-medium text-gray-700">Operating Expenses</span>
                                        </div>
                                        <span className="text-xl font-bold text-orange-600">-{formatCurrency(data.expenses?.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Net Profit Card */}
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
                                    <div className="absolute inset-0 shimmer pointer-events-none"></div>
                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                                    <div className="relative">
                                        <p className="text-white/70 font-medium mb-2">Net Profit</p>
                                        <p className="text-5xl font-bold mb-4">{formatCurrency(data.net_profit)}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                                Margin: {data.profit_margin}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Circular Progress */}
                                <div className="glass-card rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <h4 className="font-semibold text-gray-800 mb-4">Profit Margin</h4>
                                    <div className="flex items-center justify-center">
                                        <div className="relative w-40 h-40">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle cx="80" cy="80" r="70" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                                                <circle cx="80" cy="80" r="70" fill="none" stroke="url(#gradient)" strokeWidth="12" strokeDasharray={`${(data.profit_margin / 100) * 440} 440`} strokeLinecap="round" />
                                                <defs>
                                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#8B5CF6" />
                                                        <stop offset="100%" stopColor="#EC4899" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <span className="text-3xl font-bold text-gray-800">{data.profit_margin}%</span>
                                                <span className="text-gray-500 text-sm">margin</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GST Report */}
                    {activeTab === 'gst' && data && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                                        <span className="text-lg font-bold text-violet-600">C</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-1">CGST Collected</p>
                                    <p className="text-3xl font-bold text-gray-800">{formatCurrency(data.output_tax?.cgst)}</p>
                                </div>
                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                                        <span className="text-lg font-bold text-purple-600">S</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-1">SGST Collected</p>
                                    <p className="text-3xl font-bold text-gray-800">{formatCurrency(data.output_tax?.sgst)}</p>
                                </div>
                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
                                        <span className="text-lg font-bold text-indigo-600">I</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-1">IGST Collected</p>
                                    <p className="text-3xl font-bold text-gray-800">{formatCurrency(data.output_tax?.igst)}</p>
                                </div>
                                <div className="stat-card rounded-2xl p-6 shadow-lg bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
                                    <div className="absolute inset-0 shimmer pointer-events-none"></div>
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-3">
                                            <FiDollarSign className="w-6 h-6" />
                                        </div>
                                        <p className="text-white/80 text-sm mb-1">Total GST Output</p>
                                        <p className="text-3xl font-bold">{formatCurrency(data.output_tax?.total)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stock Report */}
                    {activeTab === 'stock' && data && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-3">
                                        <FiBox className="w-6 h-6 text-pink-600" />
                                    </div>
                                    <p className="text-gray-500 text-sm mb-1">Total Products</p>
                                    <p className="text-4xl font-bold text-gray-800">{data.summary?.total_products || 0}</p>
                                </div>
                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                                        <FiActivity className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <p className="text-gray-500 text-sm mb-1">Total Quantity</p>
                                    <p className="text-4xl font-bold text-gray-800">{data.summary?.total_quantity || 0}</p>
                                </div>
                                <div className="stat-card rounded-2xl p-6 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative overflow-hidden">
                                    <div className="absolute inset-0 shimmer pointer-events-none"></div>
                                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-3">
                                        <FiDollarSign className="w-6 h-6" />
                                    </div>
                                    <p className="text-white/80 text-sm mb-1">Stock Value</p>
                                    <p className="text-3xl font-bold">{formatCurrency(data.summary?.total_value)}</p>
                                </div>
                                <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-red-100 bg-gradient-to-br from-red-50 to-white">
                                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-3">
                                        <FiArrowDownRight className="w-6 h-6 text-red-600" />
                                    </div>
                                    <p className="text-red-600 text-sm font-medium mb-1">Low Stock Items</p>
                                    <p className="text-4xl font-bold text-red-700">{data.summary?.low_stock_count || 0}</p>
                                </div>
                            </div>

                            {data.low_stock_items?.length > 0 && (
                                <div className="glass-card rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                                <FiArrowDownRight className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">Low Stock Alert</h3>
                                                <p className="text-gray-500 text-sm">Items that need restocking</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50/80">
                                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Current Stock</th>
                                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Min Required</th>
                                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {data.low_stock_items.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">{item.sku || '-'}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full">{item.quantity}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-gray-600 font-medium">{item.min_stock}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full border border-red-200">Restock Needed</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════ SALARY REPORT ═══════ */}
                    {activeTab === 'salary' && (
                        <div className="space-y-6">
                            {/* Controls */}
                            <div className="glass-card rounded-2xl p-5 shadow-lg border border-gray-100">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        {/* Monthly/Yearly Toggle */}
                                        <div className="flex bg-gray-100 rounded-xl p-1">
                                            <button onClick={() => setSalaryReportType('monthly')}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${salaryReportType === 'monthly' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                                Monthly
                                            </button>
                                            <button onClick={() => setSalaryReportType('yearly')}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${salaryReportType === 'yearly' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                                Yearly
                                            </button>
                                        </div>
                                        {salaryReportType === 'monthly' && (
                                            <Dropdown
                                                className="min-w-[140px]"
                                                options={['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => ({ value: i + 1, label: m }))}
                                                value={salaryMonth}
                                                onChange={(val) => setSalaryMonth(parseInt(val))}
                                            />
                                        )}
                                        <Dropdown
                                            className="min-w-[100px]"
                                            options={[...Array(5)].map((_, i) => { const y = new Date().getFullYear() - 2 + i; return { value: y, label: String(y) }; })}
                                            value={salaryYear}
                                            onChange={(val) => setSalaryYear(parseInt(val))}
                                        />
                                    </div>
                                    <button onClick={downloadExcel}
                                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2">
                                        <FiDownload className="w-4 h-4" /> Export Excel
                                    </button>
                                </div>
                            </div>

                            {salaryLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin"></div>
                                </div>
                            ) : salaryData && salaryReportType === 'monthly' ? (
                                <>
                                    {/* Monthly Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="stat-card rounded-2xl p-6 shadow-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white relative overflow-hidden">
                                            <div className="absolute inset-0 shimmer pointer-events-none"></div>
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-3">
                                                    <FiDollarSign className="w-6 h-6" />
                                                </div>
                                                <p className="text-white/80 text-sm mb-1">Total Net Salary</p>
                                                <p className="text-3xl font-bold">{formatCurrency(salaryData.summary?.total_net)}</p>
                                            </div>
                                        </div>
                                        <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-gray-100">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                                                <FiTrendingUp className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <p className="text-gray-500 text-sm mb-1">Gross Salary</p>
                                            <p className="text-3xl font-bold text-gray-800">{formatCurrency(salaryData.summary?.total_gross)}</p>
                                        </div>
                                        <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-red-100 bg-gradient-to-br from-red-50 to-white">
                                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-3">
                                                <FiTrendingDown className="w-6 h-6 text-red-600" />
                                            </div>
                                            <p className="text-red-600 text-sm mb-1">Deductions</p>
                                            <p className="text-3xl font-bold text-red-700">{formatCurrency(salaryData.summary?.total_deductions)}</p>
                                        </div>
                                        <div className="stat-card glass-card rounded-2xl p-6 shadow-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                                                <FiActivity className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <p className="text-emerald-600 text-sm mb-1">Overtime</p>
                                            <p className="text-3xl font-bold text-emerald-700">{formatCurrency(salaryData.summary?.total_overtime)}</p>
                                        </div>
                                    </div>

                                    {/* Payment Status Pills */}
                                    <div className="flex gap-3">
                                        <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                                            ✅ {salaryData.summary?.paid_count || 0} Paid
                                        </span>
                                        <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                                            ⏳ {salaryData.summary?.pending_count || 0} Pending
                                        </span>
                                        <span className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-bold">
                                            🔴 {salaryData.summary?.live_count || 0} Live
                                        </span>
                                    </div>

                                    {/* Monthly Salary Table */}
                                    <div className="glass-card rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                                            <h3 className="font-bold text-gray-800 text-lg">Monthly Salary Sheet — {salaryData.month_name} {salaryData.year}</h3>
                                            <p className="text-gray-500 text-sm">{salaryData.staff_count} staff members • {salaryData.days_in_month} calendar days</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[1100px]">
                                                <thead>
                                                    <tr className="bg-gray-50/80">
                                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                                                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Work Days</th>
                                                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Present</th>
                                                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Absent</th>
                                                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Sun</th>
                                                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Holidays</th>
                                                        <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Gross</th>
                                                        <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Deductions</th>
                                                        <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase">OT</th>
                                                        <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Net Salary</th>
                                                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {salaryData.staff?.map((s, idx) => (
                                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <p className="font-semibold text-gray-800">{s.name}</p>
                                                                <p className="text-xs text-gray-400">{s.salary_type === 'daily' ? `₹${s.daily_rate}/day` : `₹${s.monthly_salary}/mo`}</p>
                                                            </td>
                                                            <td className="text-center px-3 py-3 text-sm text-gray-600">{s.role}</td>
                                                            <td className="text-center px-3 py-3 font-medium text-gray-700">{s.total_working_days}</td>
                                                            <td className="text-center px-3 py-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{s.days_present}</span></td>
                                                            <td className="text-center px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.days_absent > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{s.days_absent}</span></td>
                                                            <td className="text-center px-3 py-3 text-sm text-gray-500">{s.sundays}</td>
                                                            <td className="text-center px-3 py-3 text-sm text-gray-500">{s.holidays_count}</td>
                                                            <td className="text-right px-3 py-3 text-sm font-medium text-gray-700">{formatCurrency(s.gross_salary)}</td>
                                                            <td className="text-right px-3 py-3 text-sm font-medium text-red-600">{s.deductions > 0 ? `-${formatCurrency(s.deductions)}` : '—'}</td>
                                                            <td className="text-right px-3 py-3 text-sm font-medium text-emerald-600">{s.overtime_amount > 0 ? `+${formatCurrency(s.overtime_amount)}` : '—'}</td>
                                                            <td className="text-right px-3 py-3 font-bold text-violet-700 text-lg">{formatCurrency(s.net_salary)}</td>
                                                            <td className="text-center px-3 py-3">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : s.payment_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'}`}>
                                                                    {s.payment_status === 'paid' ? '✅ Paid' : s.payment_status === 'pending' ? '⏳ Pending' : '🔴 Live'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Totals Row */}
                                                    <tr className="bg-gray-50 font-bold">
                                                        <td className="px-4 py-4 text-gray-800" colSpan={7}>TOTAL</td>
                                                        <td className="text-right px-3 py-4 text-gray-800">{formatCurrency(salaryData.summary?.total_gross)}</td>
                                                        <td className="text-right px-3 py-4 text-red-600">-{formatCurrency(salaryData.summary?.total_deductions)}</td>
                                                        <td className="text-right px-3 py-4 text-emerald-600">+{formatCurrency(salaryData.summary?.total_overtime)}</td>
                                                        <td className="text-right px-3 py-4 text-violet-700 text-lg">{formatCurrency(salaryData.summary?.total_net)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : salaryData && salaryReportType === 'yearly' ? (
                                <>
                                    {/* Grand Total Card */}
                                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
                                        <div className="absolute inset-0 shimmer pointer-events-none"></div>
                                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                                        <div className="relative">
                                            <p className="text-white/70 font-medium mb-2">Total Salary Paid — {salaryYear}</p>
                                            <p className="text-5xl font-bold mb-2">{formatCurrency(salaryData.grand_total)}</p>
                                            <p className="text-white/60">{salaryData.staff_count} staff members</p>
                                        </div>
                                    </div>

                                    {/* Yearly Table */}
                                    <div className="glass-card rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                                            <h3 className="font-bold text-gray-800 text-lg">Yearly Salary Summary — {salaryYear}</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[900px]">
                                                <thead>
                                                    <tr className="bg-gray-50/80">
                                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                                                        <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                                            <th key={m} className="text-right px-2 py-3 text-xs font-semibold text-gray-500 uppercase">{m}</th>
                                                        ))}
                                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {salaryData.staff?.map(s => (
                                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 font-semibold text-gray-800">{s.name}</td>
                                                            <td className="text-center px-2 py-3 text-sm text-gray-500">{s.role}</td>
                                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                                                                const monthData = s.months[m];
                                                                return (
                                                                    <td key={m} className="text-right px-2 py-3 text-sm">
                                                                        {monthData ? (
                                                                            <span className={monthData.payment_status === 'paid' ? 'text-emerald-600 font-medium' : 'text-gray-700'}>
                                                                                {formatCurrency(monthData.net_salary)}
                                                                            </span>
                                                                        ) : <span className="text-gray-300">—</span>}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="text-right px-4 py-3 font-bold text-violet-700">{formatCurrency(s.yearly_total)}</td>
                                                        </tr>
                                                    ))}
                                                    {/* Month Totals Row */}
                                                    <tr className="bg-gray-50 font-bold">
                                                        <td className="px-4 py-4 text-gray-800" colSpan={2}>TOTAL</td>
                                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                                            <td key={m} className="text-right px-2 py-4 text-sm text-gray-700">
                                                                {formatCurrency(salaryData.month_totals?.[m] || 0)}
                                                            </td>
                                                        ))}
                                                        <td className="text-right px-4 py-4 text-violet-700 text-lg">{formatCurrency(salaryData.grand_total)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
