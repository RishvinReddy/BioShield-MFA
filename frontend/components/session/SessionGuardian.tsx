import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CHECK_INTERVAL = 30000; // 30 seconds

export const SessionGuardian: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }

                const res = await fetch('http://localhost:8080/api/session/heartbeat', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.status === 401) {
                    throw new Error('Session expired');
                }
            } catch (err) {
                console.warn("Session invalid, logging out...", err);
                localStorage.removeItem('token');
                navigate('/login');
            }
        };

        const interval = setInterval(checkSession, CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, [navigate]);

    return <>{children}</>;
};
