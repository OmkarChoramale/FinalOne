import axios from 'axios';

// The Gateway (GatewayAPI) port from your Eureka status
const API_BASE_URL = 'http://localhost:8383'; 

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * AUTH INTERCEPTOR
 * Automatically attaches the JWT token from localStorage to every request.
 * The Gateway will decode this to populate the 'X-User-Id' and 'X-User-Roles' 
 * headers expected by your Java controllers.
 */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

/**
 * ─── NOTIFICATION API (Module 8) ───────────────────────────────────────────
 * Maps to NotificationController.java
 */
export const notificationApi = {
    // 1. GET all notifications
    getAll: () => api.get('/tourismgov/v1/notifications'),

    // 2. GET unread notifications
    getUnread: () => api.get('/tourismgov/v1/notifications/unread'),

    // 3. GET notifications by category
    getByCategory: (category) => api.get(`/tourismgov/v1/notifications/category/${category}`),

    // 4. PATCH mark a single notification as READ
    markAsRead: (id) => api.patch(`/tourismgov/v1/notifications/${id}/read`),

    // 5. PATCH mark ALL notifications as READ
    markAllAsRead: () => api.patch('/tourismgov/v1/notifications/read-all'),

    // 6. POST create a direct targeted notification
    create: (data) => api.post('/tourismgov/v1/notifications', data),

    // 7. POST broadcast to ALL users
    broadcast: (data) => api.post('/tourismgov/v1/notifications/broadcast', data)
};

/**
 * ─── DASHBOARD API ────────────────────────────────────────────────────────
 * Maps to DashboardController.java
 */
export const dashboardApi = {
    /**
     * Fetch aggregated metrics based on user role and ID.
     * Note: The backend expects X-User-Roles and X-User-Id headers,
     * which are typically injected by your Gateway from the JWT.
     */
    getStats: () => api.get('/tourismgov/v1/dashboard/stats')
};

/**
 * ─── REPORT API (Module 7) ────────────────────────────────────────────────
 * Maps to ReportController.java
 */
export const reportApi = {
    // 1. POST generate a new report
    generate: (data) => api.post('/tourismgov/v1/reports/generate', data),

    // 2. GET report history with optional filters (scope/date)
    getHistory: (params) => api.get('/tourismgov/v1/reports/history', { params }),

    // 3. GET download report as .txt file
    download: (id) => api.get(`/tourismgov/v1/reports/download/${id}`, {
        responseType: 'blob' // Crucial for handling byte[] data from backend
    })
};

/**
 * ─── COMPLIANCE API ───────────────────────────────────────────────────────
 * Maps to ComplianceController.java
 */
export const ComplianceAPI = {
    getAll: async () => {
        const response = await api.get('/tourismgov/v1/compliance/records?size=100&sort=createdAt,desc');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/tourismgov/v1/compliance/records', data);
        return response.data;
    },
    updateResult: async (recordId, result) => {
        const response = await api.patch(`/tourismgov/v1/compliance/records/${recordId}/result?result=${result}`);
        return response.data;
    },
    delete: async (recordId) => {
        const response = await api.delete(`/tourismgov/v1/compliance/records/${recordId}`);
        return response.data;
    }
};

/**
 * ─── AUDIT API ────────────────────────────────────────────────────────────
 * Maps to AuditController.java
 */
export const AuditAPI = {
    getAll: async () => {
        const response = await api.get('/tourismgov/v1/audits/official');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/tourismgov/v1/audits/official', data);
        return response.data;
    },
    update: async (auditId, data) => {
        const response = await api.patch(`/tourismgov/v1/audits/official/${auditId}`, data);
        return response.data;
    }
};

export default api;