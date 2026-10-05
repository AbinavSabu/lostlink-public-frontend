import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

function extractRole(resData, decoded) {
    // 1. Direct role string on user object or response
    if (resData?.user?.role) return resData.user.role;
    if (resData?.role) return resData.role;

    // 2. Roles array on user object or response
    const rolesArr = resData?.user?.roles || resData?.roles;
    if (Array.isArray(rolesArr) && rolesArr.length > 0) {
        return typeof rolesArr[0] === 'string' ? rolesArr[0] : rolesArr[0]?.authority;
    }

    // 3. Claims in decoded JWT token
    if (decoded?.role) return decoded.role;
    if (Array.isArray(decoded?.roles) && decoded.roles.length > 0) {
        return decoded.roles[0];
    }
    if (Array.isArray(decoded?.authorities) && decoded.authorities.length > 0) {
        const auth = decoded.authorities[0];
        return typeof auth === 'string' ? auth : auth?.authority;
    }

    return 'ROLE_USER';
}

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser && savedUser !== 'undefined') {
            try {
                return JSON.parse(savedUser);
            } catch {
                return null;
            }
        }
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            const decoded = parseJwt(savedToken);
            if (decoded) {
                const email = decoded?.sub || decoded?.email || 'User';
                return {
                    id: decoded?.id || decoded?.userId || null,
                    email,
                    name: decoded?.name || email,
                    role: extractRole(null, decoded)
                };
            }
        }
        return null;
    });

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const jwtToken = res.data.token || res.data.accessToken || (typeof res.data === 'string' ? res.data : null);

        if (jwtToken) {
            localStorage.setItem('token', jwtToken);
            setToken(jwtToken);

            const decoded = parseJwt(jwtToken);
            const userRole = extractRole(res.data, decoded);

            const userPayload = {
                id: res.data.user?.id || res.data.id || res.data.userId || decoded?.id || decoded?.userId || null,
                email: res.data.user?.email || res.data.email || decoded?.sub || email,
                name: res.data.user?.name || res.data.name || decoded?.name || decoded?.sub || email,
                role: userRole,
                department: res.data.user?.department || res.data.department || decoded?.department || null,
                staffBadgeNumber: res.data.user?.staffBadgeNumber || res.data.staffBadgeNumber || decoded?.staffBadgeNumber || null
            };

            localStorage.setItem('user', JSON.stringify(userPayload));
            localStorage.setItem('userEmail', userPayload.email);
            setUser(userPayload);
            return userPayload;
        }
    };

    const register = async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        const jwtToken = res.data.token || res.data.accessToken || (typeof res.data === 'string' ? res.data : null);

        if (jwtToken) {
            localStorage.setItem('token', jwtToken);
            setToken(jwtToken);

            const decoded = parseJwt(jwtToken);
            const userRole = extractRole(res.data, decoded);

            const userPayload = {
                id: res.data.user?.id || res.data.id || res.data.userId || decoded?.id || decoded?.userId || null,
                email: res.data.user?.email || res.data.email || decoded?.sub || email,
                name: res.data.user?.name || res.data.name || name,
                role: userRole
            };

            localStorage.setItem('user', JSON.stringify(userPayload));
            localStorage.setItem('userEmail', userPayload.email);
            setUser(userPayload);
            return userPayload;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userEmail');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedFields) => {
        setUser((prev) => {
            const next = { ...(prev || {}), ...updatedFields };
            localStorage.setItem('user', JSON.stringify(next));
            return next;
        });
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, loading: false }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);