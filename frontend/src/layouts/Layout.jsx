import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI, invoicesAPI, customersAPI, jobordersAPI } from '../services/api';
import {
    FiHome, FiUsers, FiBox, FiFileText, FiShoppingCart, FiDollarSign,
    FiTruck, FiBarChart2, FiSettings, FiLogOut, FiMenu, FiX, FiChevronDown,
    FiBriefcase, FiCreditCard, FiPlusCircle, FiBell, FiSearch, FiChevronRight,
    FiClipboard, FiAlertCircle, FiUserCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const sidebarItems = [
    { path: '/', icon: FiHome, label: 'Dashboard', color: '#f4f7f7ff' }, // Purple
    {
        label: 'Parties',
        icon: FiUsers,
        color: '#f4f7f7ff', // Cyan
        children: [
            { path: '/customers', icon: FiUsers, label: 'Customers' },
            { path: '/suppliers', icon: FiTruck, label: 'Suppliers' },
        ]
    },
    {
        label: 'Orders',
        icon: FiClipboard,
        color: '#f4f7f7ff', // Pink
        children: [
            { path: '/customers/add', icon: FiPlusCircle, label: 'New Order' },
            { path: '/joborders', icon: FiClipboard, label: 'All Orders' },
            { path: '/service-rates', icon: FiDollarSign, label: 'Service Rates' },
        ]
    },
    {
        label: 'Sales',
        icon: FiFileText,
        color: '#f4f7f7ff', // Emerald
        children: [
            { path: '/invoices/create', icon: FiPlusCircle, label: 'New Invoice' },
            { path: '/invoices', icon: FiFileText, label: 'All Invoices' },
        ]
    },
    { path: '/expenses', icon: FiCreditCard, label: 'Expenses', color: '#f4f7f7ff' }, // Orange
    { path: '/payments', icon: FiDollarSign, label: 'Payments', color: '#f4f7f7ff' }, // Green
    { path: '/staff', icon: FiUserCheck, label: 'Staff', color: '#f4f7f7ff' }, // Violet
    { path: '/reports', icon: FiBarChart2, label: 'Reports', color: '#f4f7f7ff' }, // Blue
    { path: '/settings', icon: FiSettings, label: 'Settings', color: '#f4f7f7ff' }, // Teal
];

const SidebarItem = ({ item, collapsed }) => {
    const [expanded, setExpanded] = useState(false);
    const location = useLocation();
    const moduleColor = item.color || '#A500FF';

    if (item.children) {
        const isActive = item.children.some(child => location.pathname === child.path);

        return (
            <div className="relative">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`
                        w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-300 ease-out
                        ${isActive
                            ? 'bg-transparent'
                            : 'text-[#8892B0] hover:bg-[#ffffff08] hover:text-[#c8cfe0]'
                        }
                    `}
                >
                    {/* Active indicator with module color */}
                    {isActive && (
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                            style={{
                                backgroundColor: moduleColor,
                                boxShadow: `0 0 12px ${moduleColor}`
                            }}
                        />
                    )}

                    {/* Icon — no background box, just colored icon */}
                    <div
                        className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 group-hover:scale-105"
                        style={{ color: isActive ? moduleColor : '#8892B0' }}
                    >
                        <item.icon className="w-[18px] h-[18px]" />
                    </div>

                    {!collapsed && (
                        <>
                            <span
                                className="flex-1 text-left font-medium text-[14px] transition-colors duration-300"
                                style={{ color: isActive ? moduleColor : undefined }}
                            >{item.label}</span>
                            <FiChevronDown
                                className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                                style={{ color: isActive ? moduleColor : undefined }}
                            />
                        </>
                    )}
                </button>

                {/* Submenu with module color border */}
                <div className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${expanded && !collapsed ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                `}>
                    <div
                        className="ml-5 pl-4 space-y-1"
                        style={{ borderLeft: `2px solid ${moduleColor}40` }}
                    >
                        {item.children.map((child) => (
                            <NavLink
                                key={child.path}
                                to={child.path}
                                end
                                className={({ isActive: childActive }) => `
                                    flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]
                                    transition-all duration-200
                                    ${childActive
                                        ? 'font-medium bg-transparent'
                                        : 'text-[#6B7599] hover:text-[#A8B2D1] hover:bg-[#ffffff08]'
                                    }
                                `}
                                style={({ isActive: childActive }) => childActive ? {
                                    color: moduleColor
                                } : {}}
                            >
                                <child.icon className="w-4 h-4" />
                                <span>{child.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const isActive = location.pathname === item.path;

    return (
        <NavLink
            to={item.path}
            className={`
                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-300 ease-out
                ${isActive
                    ? 'bg-transparent'
                    : 'text-[#8892B0] hover:bg-[#ffffff08] hover:text-[#c8cfe0]'
                }
            `}
        >
            {/* Active indicator with module color */}
            {isActive && (
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                    style={{
                        backgroundColor: moduleColor,
                        boxShadow: `0 0 12px ${moduleColor}`
                    }}
                />
            )}

            {/* Icon — no background box, just colored icon */}
            <div
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 group-hover:scale-105"
                style={{ color: isActive ? moduleColor : '#8892B0' }}
            >
                <item.icon className="w-[18px] h-[18px]" />
            </div>

            {!collapsed && (
                <span
                    className="font-medium text-[14px] transition-colors duration-300"
                    style={{ color: isActive ? moduleColor : undefined }}
                >{item.label}</span>
            )}

            {/* Hover arrow */}
            {!collapsed && !isActive && (
                <FiChevronRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-300" />
            )}
        </NavLink>
    );
};

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState({});
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);

    // Debounced search
    const searchTimeout = useRef(null);
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!query.trim()) { setSearchResults([]); setShowSearch(false); return; }
        setShowSearch(true);
        setSearchLoading(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const [invRes, custRes, jobRes] = await Promise.all([
                    invoicesAPI.getAll({ search: query }).catch(() => ({ data: { results: [] } })),
                    customersAPI.getAll({ search: query }).catch(() => ({ data: { results: [] } })),
                    jobordersAPI.getAll({ search: query }).catch(() => ({ data: { results: [] } })),
                ]);
                const results = [];
                (invRes.data?.results || invRes.data || []).slice(0, 4).forEach(inv => {
                    results.push({ type: 'invoice', label: inv.invoice_number, sub: inv.customer_name, path: '/invoices', icon: '📄' });
                });
                (custRes.data?.results || custRes.data || []).slice(0, 4).forEach(c => {
                    results.push({ type: 'customer', label: c.name, sub: c.phone || c.email || '', path: '/customers', icon: '👤' });
                });
                (jobRes.data?.results || jobRes.data || []).slice(0, 4).forEach(j => {
                    results.push({ type: 'joborder', label: j.job_number, sub: j.customer_name, path: `/joborders/${j.id}`, icon: '📋' });
                });
                setSearchResults(results);
            } catch { setSearchResults([]); }
            setSearchLoading(false);
        }, 300);
    }, []);

    // Keyboard shortcut Ctrl+K
    useEffect(() => {
        const handleKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    // Click outside to close search
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notification counts
    const fetchNotifications = async () => {
        try {
            const counts = await notificationsAPI.getCounts();

            // Also fetch payment notifications via axios (not raw fetch)
            try {
                const paymentRes = await notificationsAPI.getPaymentNotifications();
                const paymentNotifs = paymentRes.data || paymentRes;

                // Show toast for new unread payment notifications
                if (paymentNotifs.unread_count > 0 && paymentNotifs.notifications?.[0]) {
                    const newest = paymentNotifs.notifications[0];
                    if (!newest.is_read && newest.type === 'payment') {
                        const lastNotifId = localStorage.getItem('lastPaymentNotifId');
                        if (lastNotifId !== String(newest.id)) {
                            toast.success(`💰 ${newest.title}`, {
                                duration: 5000,
                                icon: '🔔'
                            });
                            localStorage.setItem('lastPaymentNotifId', String(newest.id));
                        }
                    }
                }

                // Add payment notification count to total
                setNotificationCount(counts.total + (paymentNotifs.unread_count || 0));
                setNotifications({
                    ...counts,
                    payment_notifications: paymentNotifs.notifications || [],
                    payment_unread: paymentNotifs.unread_count || 0
                });
            } catch (e) {
                setNotificationCount(counts.total);
                setNotifications(counts);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Poll notifications every 30 seconds (faster for payment updates)
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            if (!document.hidden) {
                fetchNotifications();
            }
        }, 30000);

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchNotifications();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    // Handle notification click - clear all and toggle dropdown
    const handleNotificationClick = async () => {
        // If there are unread notifications, mark them all as read
        if (notificationCount > 0) {
            try {
                await fetch('/api/settings/notifications/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ mark_all: true })
                });
                // Reset notification count
                setNotificationCount(0);
                setNotifications(prev => ({
                    ...prev,
                    payment_notifications: prev.payment_notifications?.map(n => ({ ...n, is_read: true })) || [],
                    payment_unread: 0
                }));
            } catch (e) {
                console.error('Failed to clear notifications:', e);
            }
        }
        setShowNotifications(!showNotifications);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-[#0B1020]/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar - Dark Indigo / Midnight Blue */}
            <aside className={`
                fixed top-0 left-0 h-full z-50
                bg-gradient-to-b from-[#0A0A0B] via-[#0F0F10] to-[#111112]
                border-r border-[#1A1A1C]/50
                shadow-[4px_0_30px_-2px_rgba(0,0,0,0.7)]
                transition-all duration-300 ease-out
                ${sidebarOpen ? 'w-[260px]' : 'w-[76px]'}
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo Section */}
                <div className={`h-[72px] flex items-center border-b border-[#1A1A1C]/50 ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-2'}`}>
                    {/* Logo and Title - Hide when collapsed on desktop */}
                    <div className={`flex items-center gap-3 transition-all duration-300 ${!sidebarOpen && 'lg:hidden'}`}>
                        <div className="relative flex-shrink-0">
                            <img
                                src="/logo.png"
                                alt="Lakshmi"
                                className="w-10 h-10 rounded-xl object-contain bg-white/90 p-0.5 shadow-[0_0_15px_rgba(255,215,0,0.4)]"
                            />
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="font-bold text-white text-[15px] leading-tight whitespace-nowrap">Sri Lakshmi</h1>
                            <p className="text-xs text-[#6B7599] font-medium">Printing Works</p>
                        </div>
                    </div>

                    {/* Desktop hamburger - toggle sidebar expand/collapse */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-[#1A1A1C] transition-colors hidden lg:flex items-center justify-center"
                    >
                        <FiMenu className="w-5 h-5 text-[#8892B0]" />
                    </button>

                    {/* Mobile close button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 rounded-lg hover:bg-[#1A1A1C] lg:hidden"
                    >
                        <FiX className="w-5 h-5 text-[#8892B0]" />
                    </button>
                </div>

                {/* Quick Action Button with Electric Purple glow */}
                {sidebarOpen && (
                    <div className="px-4 py-4">
                        <NavLink
                            to="/customers/add"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4
                                bg-[#9110C2]
                                text-white font-semibold text-sm rounded-xl
                                shadow-[0_0_25px_rgba(165,0,255,0.4)]
                                hover:shadow-[0_0_35px_rgba(165,0,255,0.6)] hover:-translate-y-0.5
                                transition-all duration-300"
                        >
                            <FiPlusCircle className="w-5 h-5" />
                            <span>New Order</span>
                        </NavLink>
                    </div>
                )}

                {/* Navigation */}
                <nav className="px-3 space-y-1 overflow-y-auto h-[calc(100vh-260px)] scrollbar-thin pb-4">
                    {sidebarOpen && (
                        <p className="text-[11px] font-semibold text-[#4A5578] uppercase tracking-wider px-3 mb-2">
                            Main Menu
                        </p>
                    )}
                    {sidebarItems.map((item, idx) => (
                        <SidebarItem key={idx} item={item} collapsed={!sidebarOpen} />
                    ))}
                </nav>

                {/* User Section */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[#1A1A1C]/50 bg-[#0A0A0B]/95 backdrop-blur-sm">
                    {sidebarOpen ? (
                        <div className="group flex items-center gap-3 p-2 rounded-xl bg-[#1A1A1C]/60 mb-2 hover:bg-[#1A1A1C] transition-all duration-300 cursor-pointer">
                            {/* Avatar with gradient and online indicator */}
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A500FF] via-[#7C3AED] to-[#EC4899] flex items-center justify-center text-white font-bold shadow-lg shadow-[#A500FF]/20 group-hover:shadow-[#A500FF]/40 transition-all duration-300">
                                    {user?.username?.[0]?.toUpperCase() || 'U'}
                                </div>
                                {/* Online status */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-[#0A0A0B]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate group-hover:text-[#D580FF] transition-colors">{user?.username || 'User'}</p>
                                <p className="text-xs text-[#6B7599] capitalize flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
                                    {user?.role || 'Staff'}
                                </p>
                            </div>
                        </div>
                    ) : null}

                    <button
                        onClick={handleLogout}
                        className={`
                            flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                            text-[#FF4757] hover:bg-[#FF4757]/10 hover:text-[#FF6B7A]
                            transition-all duration-200
                            ${!sidebarOpen && 'justify-center'}
                        `}
                    >
                        <FiLogOut className="w-5 h-5" />
                        {sidebarOpen && <span className="font-medium text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[76px]'}`}>
                {/* Top Header */}
                <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-dark-200/60 sticky top-0 z-30 shadow-sm">
                    <div className="h-full px-4 lg:px-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="p-2.5 rounded-xl hover:bg-dark-100 lg:hidden transition-colors"
                            >
                                <FiMenu className="w-5 h-5 text-dark-600" />
                            </button>

                            {/* Functional Search Bar */}
                            <div ref={searchRef} className="hidden md:block relative">
                                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 w-80 transition-all duration-200 group border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md focus-within:border-[#A500FF] focus-within:shadow-[0_0_15px_rgba(165,0,255,0.2)] focus-within:ring-2 focus-within:ring-[#A500FF]/20">
                                    <FiSearch className="w-4 h-4 text-gray-400 group-focus-within:text-[#A500FF] transition-colors" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search invoices, customers..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        onFocus={() => searchQuery.trim() && setShowSearch(true)}
                                        className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
                                    />
                                    <kbd className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 rounded border border-gray-200">
                                        Ctrl+K
                                    </kbd>
                                </div>
                                {/* Search Results Dropdown */}
                                {showSearch && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-80 overflow-y-auto">
                                        {searchLoading ? (
                                            <div className="flex items-center justify-center py-6 gap-2">
                                                <div className="w-4 h-4 border-2 border-[#A500FF] border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm text-gray-500">Searching...</span>
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <>
                                                {searchResults.map((r, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => { navigate(r.path); setShowSearch(false); setSearchQuery(''); }}
                                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                                                    >
                                                        <span className="text-lg">{r.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                                                            <p className="text-xs text-gray-500 truncate">{r.sub}</p>
                                                        </div>
                                                        <span className="text-[10px] font-medium text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">{r.type}</span>
                                                    </button>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="py-6 text-center text-gray-500 text-sm">
                                                <FiSearch className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                                No results for "{searchQuery}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Notifications with count badge and dropdown */}
                            <div className="relative">
                                <button
                                    onClick={handleNotificationClick}
                                    className="relative p-2.5 rounded-xl hover:bg-dark-100 transition-all group"
                                >
                                    <FiBell className="w-5 h-5 text-dark-500 group-hover:text-dark-700" />
                                    {notificationCount > 0 && (
                                        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse ring-2 ring-white shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowNotifications(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#A500FF]/5 to-transparent flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                                                    <p className="text-xs text-gray-500">Real-time alerts</p>
                                                </div>
                                                {notifications.payment_unread > 0 && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await notificationsAPI.markAllAsRead();
                                                                fetchNotifications();
                                                            } catch (e) { console.error(e); }
                                                        }}
                                                        className="text-xs text-[#A500FF] hover:text-[#8400CC] font-medium"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {notificationCount === 0 ? (
                                                    <div className="p-4 text-center text-gray-500 text-sm">
                                                        <FiBell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                        All caught up!
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Payment Notifications */}
                                                        {notifications.payment_notifications?.filter(n => !n.is_read).slice(0, 3).map((notif) => (
                                                            <button
                                                                key={notif.id}
                                                                onClick={async () => {
                                                                    try {
                                                                        await notificationsAPI.markAsRead([notif.id]);
                                                                    } catch (e) { console.error(e); }
                                                                    setShowNotifications(false);
                                                                    navigate('/payments');
                                                                    fetchNotifications();
                                                                }}
                                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-emerald-50 transition-colors text-left border-b border-gray-50"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                                    <FiCreditCard className="w-4 h-4 text-emerald-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                                                                    <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                                                                </div>
                                                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0"></span>
                                                            </button>
                                                        ))}
                                                        {notifications.overdue_jobs > 0 && (
                                                            <button
                                                                onClick={() => { navigate('/joborders?status=overdue'); setShowNotifications(false); }}
                                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-left border-b border-gray-50"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                                                    <FiAlertCircle className="w-4 h-4 text-red-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{notifications.overdue_jobs} Overdue Jobs</p>
                                                                    <p className="text-xs text-gray-500">Require immediate attention</p>
                                                                </div>
                                                            </button>
                                                        )}
                                                        {notifications.low_stock > 0 && (
                                                            <button
                                                                onClick={() => { navigate('/products?filter=low_stock'); setShowNotifications(false); }}
                                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                                                    <FiBox className="w-4 h-4 text-orange-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{notifications.low_stock} Low Stock Items</p>
                                                                    <p className="text-xs text-gray-500">Need restocking</p>
                                                                </div>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                    Updates every 30 seconds
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* User Avatar - Mobile */}
                            <div className="flex items-center gap-3 pl-2 ml-2 border-l border-dark-200 lg:hidden">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B4C7A] to-[#2A3555] flex items-center justify-center text-white font-medium shadow-md ring-2 ring-[#A500FF]/20">
                                    {user?.username?.[0]?.toUpperCase() || 'U'}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
