import { jwtDecode } from 'jwt-decode';

export const getAuthToken = () => localStorage.getItem('token');

export const getUser = () => {
    const token = getAuthToken();
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        const rawRole = decoded.roles || decoded.role || '';
        const role = rawRole.replace('ROLE_', '');
        
        return {
            userId: decoded.userId || decoded.id,
            role: role.toUpperCase(),
            email: decoded.sub,
            name: decoded.name || 'User'
        };
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
};
