import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '../services/api';

const NotificationContext = createContext({
    unreadCount: 0,
    latestNotification: null,
    notifications: [],
    refresh: () => {},
});

export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const intervalRef = useRef(null);

    const refresh = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUnreadCount(0);
            setLatestNotification(null);
            setNotifications([]);
            return;
        }
        try {
            const res = await notificationApi.getUnread();
            const data = Array.isArray(res.data) ? res.data : [];
            setUnreadCount(data.length);
            setLatestNotification(data.length > 0 ? data[0] : null);
            setNotifications(data);
        } catch (err) {
            // silently fail — don't break pages if notification service is down
        }
    }, []);

    useEffect(() => {
        // Fetch immediately on mount
        refresh();

        // Poll every 30 seconds
        intervalRef.current = setInterval(refresh, 30000);

        return () => clearInterval(intervalRef.current);
    }, [refresh]);

    // Re-fetch when user logs in/out (localStorage token changes)
    useEffect(() => {
        const handleStorage = () => refresh();
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [refresh]);

    return (
        <NotificationContext.Provider value={{ unreadCount, latestNotification, notifications, refresh }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
