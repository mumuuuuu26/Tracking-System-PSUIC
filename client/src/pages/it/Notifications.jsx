import React, { useEffect, useState, useCallback } from "react";
import { Bell, Check, Trash2, Clock, FilePlus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    listNotifications,
    markRead,
    removeNotification,
} from "../../api/notification";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ITWrapper from "../../components/it/ITWrapper";

dayjs.extend(relativeTime);

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await listNotifications();
            setNotifications(res.data);
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkRead = async (e, id) => {
        e.stopPropagation();
        try {
            await markRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            toast.success("Marked as read");
        } catch {
            toast.error("Failed to mark as read");
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await removeNotification(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            toast.success("Notification removed");
        } catch {
            toast.error("Failed to remove notification");
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
            );
            markRead(notification.id).catch(() => { });
        }

        if (notification.ticketId) {
            navigate(`/it/ticket/${notification.ticketId}`);
        }
    };

    const getNotificationStyle = (type) => {
        switch (type) {
            case "ticket_create":
                return {
                    icon: <FilePlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
                    bgIcon: "bg-blue-100 dark:bg-blue-900/30",
                    border: "border-blue-200 dark:border-blue-700/50",
                    accent: "text-blue-600 dark:text-blue-400"
                };
            case "ticket_update":
                return {
                    icon: <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
                    bgIcon: "bg-orange-100 dark:bg-orange-900/30",
                    border: "border-orange-200 dark:border-orange-700/50",
                    accent: "text-orange-600 dark:text-orange-400"
                };
            default:
                return {
                    icon: <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />,
                    bgIcon: "bg-gray-100 dark:bg-gray-800/50",
                    border: "border-gray-200 dark:border-gray-700/50",
                    accent: "text-gray-600 dark:text-gray-400"
                };
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <ITWrapper>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 dark:bg-blue-700 rounded-lg shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                            <Bell className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notifications</h1>
                            <p className="text-gray-500 dark:text-blue-300/70 text-sm">Manage your task updates and alerts</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-blue-300/70 bg-white dark:bg-[#1a2f4e] px-3 py-1 rounded-full border border-gray-200 dark:border-blue-800/30 shadow-sm">
                        {notifications.filter(n => !n.isRead).length} Unread
                    </div>
                </div>

                <div className="space-y-4">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1a2f4e] rounded-2xl shadow-sm dark:shadow-lg border border-dashed border-gray-200 dark:border-blue-800/30">
                            <div className="p-4 bg-gray-50 dark:bg-blue-900/20 rounded-full mb-4">
                                <Bell className="w-8 h-8 text-gray-300 dark:text-blue-700/50" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
                            <p className="text-gray-500 dark:text-blue-300/60 mt-1">No new notifications at the moment.</p>
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const style = getNotificationStyle(notification.type);
                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`group relative overflow-hidden p-5 rounded-xl border transition-all duration-200 hover:shadow-md dark:hover:shadow-blue-900/20 cursor-pointer ${notification.isRead
                                        ? "bg-white dark:bg-[#1a2f4e] border-gray-200 dark:border-blue-800/30"
                                        : "bg-white dark:bg-[#1a2f4e] border-blue-200 dark:border-blue-600/40 shadow-sm ring-1 ring-blue-50 dark:ring-blue-900/30"
                                        }`}
                                >
                                    {/* Unread Indicator Strip */}
                                    {!notification.isRead && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 dark:bg-blue-400" />
                                    )}

                                    <div className="flex gap-4">
                                        {/* Icon Box */}
                                        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${style.bgIcon}`}>
                                            {style.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className={`text-base font-semibold mb-1 ${notification.isRead ? 'text-gray-800 dark:text-white/80' : 'text-gray-900 dark:text-white'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={(e) => handleMarkRead(e, notification.id)}
                                                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleDelete(e, notification.id)}
                                                        className="p-2 text-gray-400 dark:text-blue-300/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Footer Info */}
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-blue-300/50 font-medium">
                                                    <Clock size={14} />
                                                    <span>{dayjs(notification.createdAt).fromNow()}</span>
                                                </div>
                                                {notification.type && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.bgIcon} ${style.accent} opacity-80`}>
                                                        {notification.type.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </ITWrapper>
    );
};

export default Notifications;
