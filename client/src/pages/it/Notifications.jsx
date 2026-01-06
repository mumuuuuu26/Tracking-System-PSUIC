import React, { useEffect, useState } from "react";
import { Bell, Check, Trash2, Clock, FilePlus, RefreshCw, AlertCircle } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { useNavigate } from "react-router-dom";
import {
    listNotifications,
    markRead,
    removeNotification,
} from "../../api/notification";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const Notifications = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, [token]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await listNotifications(token);
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
            // toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (e, id) => {
        e.stopPropagation();
        try {
            await markRead(token, id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            toast.success("Marked as read");
        } catch (err) {
            toast.error("Failed to mark as read");
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await removeNotification(token, id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            toast.success("Notification removed");
        } catch (err) {
            toast.error("Failed to remove notification");
        }
    };

    const handleNotificationClick = async (notification) => {
        // 1. Mark as read immediately in UI and Backend
        if (!notification.isRead) {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
            );
            // API call in background (don't await to block nav)
            markRead(token, notification.id).catch(console.error);
        }

        // 2. Navigate to ticket
        if (notification.ticketId) {
            navigate(`/it/ticket/${notification.ticketId}`);
        }
    };

    // Helper to get icon and color based on notification type
    const getNotificationStyle = (type) => {
        switch (type) {
            case "ticket_create":
                return {
                    icon: <FilePlus className="w-5 h-5 text-blue-600" />,
                    bgIcon: "bg-blue-100",
                    border: "border-blue-200",
                    accent: "text-blue-600"
                };
            case "ticket_update":
                return {
                    icon: <RefreshCw className="w-5 h-5 text-orange-600" />,
                    bgIcon: "bg-orange-100",
                    border: "border-orange-200",
                    accent: "text-orange-600"
                };
            default:
                return {
                    icon: <Bell className="w-5 h-5 text-gray-600" />,
                    bgIcon: "bg-gray-100",
                    border: "border-gray-200",
                    accent: "text-gray-600"
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
        <div className="p-6 max-w-4xl mx-auto min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                        <Bell className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                        <p className="text-gray-500 text-sm">Manage your task updates and alerts</p>
                    </div>
                </div>
                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm">
                    {notifications.filter(n => !n.isRead).length} Unread
                </div>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <Bell className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                        <p className="text-gray-500 mt-1">No new notifications at the moment.</p>
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const style = getNotificationStyle(notification.type);
                        return (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`group relative overflow-hidden p-5 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer ${notification.isRead
                                    ? "bg-white border-gray-200"
                                    : "bg-white border-blue-200 shadow-sm ring-1 ring-blue-50"
                                    }`}
                            >
                                {/* Unread Indicator Strip */}
                                {!notification.isRead && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
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
                                                <h3 className={`text-base font-semibold mb-1 ${notification.isRead ? 'text-gray-800' : 'text-gray-900'}`}>
                                                    {notification.title}
                                                </h3>
                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                    {notification.message}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={(e) => handleMarkRead(e, notification.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(e, notification.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Footer Info */}
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
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
    );
};

export default Notifications;

