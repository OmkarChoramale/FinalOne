import api from './api';

export const reportService = {
    generateReport: async (reportRequest) => {
        const response = await api.post(`/tourismgov/v1/reports/generate`, reportRequest);
        return response.data;
    },
    
    getReportHistory: async (userId, scope, searchDate) => {
        const params = {};
        if (scope) params.scope = scope;
        if (searchDate) params.date = searchDate;
        
        const response = await api.get(`/tourismgov/v1/reports/history`, { params });
        return response.data;
    },

    downloadReport: async (reportId) => {
        const response = await api.get(`/tourismgov/v1/reports/download/${reportId}`, { responseType: 'blob' });
        return response.data;
    }
};
