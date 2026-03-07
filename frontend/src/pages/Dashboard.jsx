import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import {
    FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiBox,
    FiAlertTriangle, FiFileText, FiArrowRight, FiCalendar, FiClock,
    FiCheckCircle, FiLoader, FiZap, FiActivity, FiTarget, FiAward,
    FiRefreshCw, FiPlus, FiArrowUpRight, FiArrowDownRight, FiStar
} from 'react-icons/fi';
import { reportsAPI, invoicesAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshCountdown, setRefreshCountdown] = useState(30);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const [dashboardRes, invoicesRes] = await Promise.all([
                reportsAPI.getDashboard(),
                invoicesAPI.getRecent(5),
            ]);
            setDashboardData(dashboardRes.data);
            setRecentInvoices(invoicesRes.data);
            setRefreshCountdown(30);
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchDashboardData(true); }, []);

    useEffect(() => {
        const countdownInterval = setInterval(() => setRefreshCountdown(prev => prev <= 1 ? 30 : prev - 1), 1000);
        const refreshInterval = setInterval(() => { if (!document.hidden) fetchDashboardData(false); }, 30000);
        const handleVisibility = () => { if (!document.hidden) fetchDashboardData(false); };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => { clearInterval(countdownInterval); clearInterval(refreshInterval); document.removeEventListener('visibilitychange', handleVisibility); };
    }, []);

    const handleRefresh = () => { setRefreshing(true); fetchDashboardData(false); };

    const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

    const salesChartOptions = {
        chart: { type: 'area', toolbar: { show: false }, animations: { enabled: true, speed: 800, animateGradually: { enabled: true, delay: 150 } } },
        stroke: { curve: 'smooth', width: 3 },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 90, 100] } },
        colors: ['#8B5CF6', '#06B6D4'],
        grid: { borderColor: '#e2e8f0', strokeDashArray: 4, padding: { left: 10, right: 10 } },
        xaxis: { categories: dashboardData?.charts?.sales_trend?.map(d => d.day) || [], axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#94a3b8', fontFamily: 'inherit' } } },
        yaxis: { labels: { formatter: (val) => `₹${(val / 1000).toFixed(0)}K`, style: { colors: '#94a3b8' } } },
        dataLabels: { enabled: false },
        tooltip: { theme: 'light', y: { formatter: (val) => formatCurrency(val) } }
    };

    const paymentChartOptions = {
        chart: { type: 'donut', animations: { enabled: true, speed: 800 } },
        labels: dashboardData?.charts?.payment_modes?.map(m => m.mode?.toUpperCase()) || [],
        colors: ['#8B5CF6', '#10B981', '#F59E0B', '#EC4899'],
        legend: { position: 'bottom', fontFamily: 'inherit' },
        plotOptions: { pie: { donut: { size: '75%', labels: { show: true, name: { fontSize: '14px', color: '#64748b' }, value: { fontSize: '18px', fontWeight: 700, color: '#1e293b', formatter: (v) => formatCurrency(v) }, total: { show: true, label: 'Total Received', color: '#64748b', formatter: (w) => formatCurrency(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) } } } } },
        dataLabels: { enabled: false },
        stroke: { width: 0 }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-violet-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
                    <FiActivity className="absolute inset-0 m-auto w-8 h-8 text-violet-500" />
                </div>
                <p className="text-gray-500 font-medium">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); } 50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8); } }
                @keyframes count { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
                .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-glow { animation: glow 3s ease-in-out infinite; }
                .animate-count { animation: count 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); }
                .shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2s infinite; }
                .stat-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .stat-card:hover { transform: translateY(-4px) scale(1.02); }
                .hero-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); }
                .card-shine { position: relative; overflow: hidden; }
                .card-shine::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: 0.5s; }
                .card-shine:hover::before { left: 100%; }
            `}</style>

            {/* Epic Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 shadow-2xl animate-glow">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>
                    <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-cyan-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }}></div>
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="text-white">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-xl">
                                    <FiZap className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="px-3 py-1 text-xs font-semibold bg-white/20 rounded-full backdrop-blur">Command Center</span>
                                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-emerald-500/30 text-emerald-200 rounded-full">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>Live
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-bold tracking-tight">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}!</h1>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-white/70">
                                <span className="flex items-center gap-2">
                                    <FiCalendar className="w-4 h-4" />
                                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur">
                                    <FiRefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh in {refreshCountdown}s
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/20 transition-all text-white font-medium">
                                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Today's Sales */}
                <div className="stat-card card-shine rounded-2xl p-6 shadow-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white relative overflow-hidden">
                    <div className="absolute inset-0 shimmer pointer-events-none"></div>
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <FiDollarSign className="w-6 h-6" />
                            </div>
                            <FiZap className="w-5 h-5 text-yellow-300" />
                        </div>
                        <p className="text-white/70 text-sm font-medium mb-1">Today's Sales</p>
                        <p className="text-3xl font-bold animate-count">{formatCurrency(dashboardData?.today?.sales)}</p>
                    </div>
                </div>

                {/* Monthly Sales */}
                <div className="stat-card card-shine glass-card rounded-2xl p-6 shadow-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100 rounded-full opacity-50"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <FiTrendingUp className="w-6 h-6 text-emerald-600" />
                            </div>
                            {dashboardData?.monthly?.growth >= 0 ? (
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                    <FiArrowUpRight className="w-3 h-3" />+{dashboardData?.monthly?.growth}%
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                    <FiArrowDownRight className="w-3 h-3" />{dashboardData?.monthly?.growth}%
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Monthly Sales</p>
                        <p className="text-3xl font-bold text-gray-800 animate-count">{formatCurrency(dashboardData?.monthly?.sales)}</p>
                    </div>
                </div>

                {/* Pending Dues */}
                <div className="stat-card card-shine glass-card rounded-2xl p-6 shadow-lg border border-amber-100 bg-gradient-to-br from-amber-50 to-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-100 rounded-full opacity-50"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                <FiTarget className="w-6 h-6 text-amber-600" />
                            </div>
                            {(dashboardData?.pending?.overdue_count || 0) > 0 && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                                    {dashboardData.pending.overdue_count} overdue
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Pending Dues</p>
                        <p className="text-3xl font-bold text-amber-600 animate-count">{formatCurrency(dashboardData?.pending?.receivable)}</p>
                        <p className="text-xs text-gray-400 mt-1">{dashboardData?.pending?.invoice_count || 0} unpaid invoices</p>
                    </div>
                </div>

                {/* Overdue Orders */}
                <div className="stat-card card-shine glass-card rounded-2xl p-6 shadow-lg border border-red-100 bg-gradient-to-br from-red-50 to-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-100 rounded-full opacity-50"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <FiAlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            {(dashboardData?.job_orders?.overdue || 0) > 0 && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                                    Urgent
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Overdue Orders</p>
                        <p className="text-3xl font-bold text-red-600 animate-count">{dashboardData?.job_orders?.overdue || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">{dashboardData?.job_orders?.today_delivery || 0} due today</p>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend Chart */}
                <div className="lg:col-span-2 glass-card rounded-2xl p-6 shadow-lg border border-gray-100 animate-slideUp">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Sales Trend</h3>
                            <p className="text-gray-500 text-sm">Revenue performance over time</p>
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold bg-violet-100 text-violet-600 rounded-full">Last 7 Days</span>
                    </div>
                    {dashboardData?.charts?.sales_trend?.length > 0 ? (
                        <Chart options={salesChartOptions} series={[{ name: 'Sales', data: dashboardData.charts.sales_trend.map(d => d.amount) }]} type="area" height={320} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                            <FiActivity className="w-16 h-16 mb-4 opacity-30" />
                            <p>No sales data available</p>
                        </div>
                    )}
                </div>

                {/* Payment Distribution */}
                <div className="glass-card rounded-2xl p-6 shadow-lg border border-gray-100 animate-slideUp" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Payment Modes</h3>
                            <p className="text-gray-500 text-sm">This month's distribution</p>
                        </div>
                    </div>
                    {dashboardData?.charts?.payment_modes?.length > 0 ? (
                        <Chart options={paymentChartOptions} series={dashboardData.charts.payment_modes.map(m => m.total)} type="donut" height={300} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                            <FiDollarSign className="w-16 h-16 mb-4 opacity-30" />
                            <p>No payment data</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Invoices */}
                <div className="glass-card rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-slideUp" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                                <FiFileText className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Recent Invoices</h3>
                                <p className="text-gray-500 text-xs">Latest transactions</p>
                            </div>
                        </div>
                        <Link to="/invoices" className="flex items-center gap-1 text-violet-600 text-sm font-semibold hover:text-violet-700 transition-colors">
                            View All <FiArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="p-4">
                        {recentInvoices.length > 0 ? (
                            <div className="space-y-3">
                                {recentInvoices.map((invoice, idx) => (
                                    <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-violet-600 text-sm shadow-sm">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">{invoice.invoice_number}</p>
                                                <p className="text-sm text-gray-500">{invoice.customer_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">{formatCurrency(invoice.total)}</p>
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                invoice.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                                                    invoice.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {invoice.status === 'paid' && <FiCheckCircle className="w-3 h-3" />}
                                                {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <FiFileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No invoices yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Orders Pipeline */}
                <div className="glass-card rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-slideUp" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                                <FiActivity className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Order Pipeline</h3>
                                <p className="text-gray-500 text-xs">Job order status overview</p>
                            </div>
                        </div>
                        <Link to="/joborders" className="flex items-center gap-1 text-pink-600 text-sm font-semibold hover:text-pink-700 transition-colors">
                            View All <FiArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center shadow-sm">
                                    <FiBox className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Received</p>
                                    <p className="text-sm text-gray-500">Awaiting work</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-blue-600">{dashboardData?.job_orders?.received || 0}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-cyan-50 border border-cyan-100 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white border border-cyan-200 flex items-center justify-center shadow-sm">
                                    <FiLoader className="w-6 h-6 text-cyan-500 animate-spin" style={{ animationDuration: '3s' }} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Finishing</p>
                                    <p className="text-sm text-gray-500">Work in progress</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-cyan-600">{dashboardData?.job_orders?.finishing || 0}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shadow-sm">
                                    <FiCheckCircle className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Ready</p>
                                    <p className="text-sm text-gray-500">Ready for delivery</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-emerald-600">{dashboardData?.job_orders?.ready || 0}</p>
                            </div>
                        </div>

                        {(dashboardData?.job_orders?.overdue || 0) > 0 && (
                            <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 hover:shadow-md transition-all animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-red-200 flex items-center justify-center shadow-sm">
                                        <FiAlertTriangle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Overdue</p>
                                        <p className="text-sm text-red-500">Needs attention!</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-red-600">{dashboardData?.job_orders?.overdue || 0}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Customers */}
            {dashboardData?.charts?.top_customers?.length > 0 && (
                <div className="glass-card rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-slideUp" style={{ animationDelay: '0.4s' }}>
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                                <FiAward className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Top Customers</h3>
                                <p className="text-gray-500 text-xs">Best performers this month</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {dashboardData.charts.top_customers.map((customer, idx) => (
                                <div key={customer.customer__id} className={`relative p-5 rounded-2xl border transition-all hover:shadow-lg cursor-pointer ${idx === 0 ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' :
                                    idx === 1 ? 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200' :
                                        idx === 2 ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200' :
                                            'bg-white border-gray-100'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                            idx === 1 ? 'bg-gradient-to-br from-gray-400 to-slate-500' :
                                                idx === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-500' :
                                                    'bg-gradient-to-br from-violet-400 to-purple-500'
                                            }`}>
                                            {idx === 0 ? <FiStar className="w-4 h-4" /> : idx + 1}
                                        </span>
                                        {idx === 0 && <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Top</span>}
                                    </div>
                                    <p className="font-semibold text-gray-800 text-sm truncate mb-2">{customer.customer__name}</p>
                                    <p className="text-xl font-bold text-violet-600">{formatCurrency(customer.total)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
