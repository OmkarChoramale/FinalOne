import api from './api';

export const dashboardService = {
    getDashboardMetrics: async (role, userId) => {
        const config = {
            headers: {
                'X-User-Role': role,
                'X-User-Id': userId
            }
        };
        const response = await api.get(`/tourismgov/v1/dashboard/stats`, config);
        return response.data;
    }
};
