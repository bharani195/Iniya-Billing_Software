import { useState, useEffect, useRef } from 'react';
import { FiBell, FiCheck, FiCreditCard, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [lastChecked, setLastChecked] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 10 seconds
        const interval = setInterval(() => {
            fetchNotifications(true);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async (silent = false) => {
        try {
            const response = await api.get('/settings/notifications/');
            const data = response.data;

            // Show toast for new payment notifications
            if (!silent && data.unread_count > unreadCount && unreadCount > 0) {
                const newNotif = data.notifications.find(n => !n.is_read && n.type === 'payment');
                if (newNotif) {
                    toast.success(`💰 ${newNotif.title}`, {
                        duration: 5000,
                        icon: '🔔'
                    });
                }
            }

            // Check for new notifications and show toast
            if (data.unread_count > lastChecked && lastChecked > 0) {
                const newest = data.notifications[0];
                if (newest && !newest.is_read && newest.type === 'payment') {
                    toast.success(`💰 New Payment: ₹${newest.amount?.toLocaleString('en-IN')}`, {
                        duration: 5000,
                    });
                }
            }

            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
            setLastChecked(data.unread_count || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (ids = [], markAll = false) => {
        try {
            await api.post('/settings/notifications/', {
                ids,
                mark_all: markAll
            });
            fetchNotifications(true);
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead([notification.id]);
        }
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-amber-100 hover:text-amber-50 hover:bg-amber-900/30 rounded-lg transition-colors"
            >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAsRead([], true)}
                                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                                <FiCheck className="w-3 h-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-400">
                                <FiBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`px-4 py-3 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors ${!notif.is_read ? 'bg-emerald-900/20' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${notif.type === 'payment'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {notif.type === 'payment' ? (
                                                <FiCreditCard className="w-4 h-4" />
                                            ) : (
                                                <FiBell className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${!notif.is_read ? 'text-white' : 'text-slate-300'
                                                }`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {formatTime(notif.created_at)}
                                            </p>
                                        </div>
                                        {!notif.is_read && (
                                            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
