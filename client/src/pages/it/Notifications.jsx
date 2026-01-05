import React, { useEffect, useState } from "react";
import { Bell, Check, Trash2, Clock } from "lucide-react";
import useAuthStore from "../../store/auth-store";
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

    const handleMarkRead = async (id) => {
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

    const handleDelete = async (id) => {
        try {
            await removeNotification(token, id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            toast.success("Notification removed");
        } catch (err) {
            toast.error("Failed to remove notification");
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-3 mb-6">
                <Bell className="text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            </div>

            <div className="space-y-4 max-w-3xl mx-auto">
                {notifications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 rounded-xl shadow-sm border transition-all ${notification.isRead
                                    ? "bg-white border-gray-100"
                                    : "bg-blue-50 border-blue-100"
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3
                                            className={`font-semibold ${notification.isRead ? "text-gray-700" : "text-blue-700"
                                                }`}
                                        >
                                            {notification.title}
                                        </h3>
                                        {!notification.isRead && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-sm mb-2">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <Clock size={12} />
                                        <span>{dayjs(notification.createdAt).fromNow()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => handleMarkRead(notification.id)}
                                            className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"
                                            title="Mark as read"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notification.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;

