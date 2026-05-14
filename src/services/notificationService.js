import api from './api';

export const notificationService = {
    getUnreadNotifications: async (userId) => {
        const response = await api.get(`/tourismgov/v1/notifications/unread`);
        return response.data;
    },

    getAllNotifications: async (userId) => {
        const response = await api.get(`/tourismgov/v1/notifications`);
        return response.data;
    },

    markAsRead: async (notificationId, userId) => {
        const response = await api.patch(`/tourismgov/v1/notifications/${notificationId}/read`);
        return response.data;
    },

    markAllAsRead: async (userId) => {
        const response = await api.patch(`/tourismgov/v1/notifications/read-all`);
        return response.data;
    }
};
