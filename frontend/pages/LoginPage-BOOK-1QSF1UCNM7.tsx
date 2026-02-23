import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { StagedLoginForm } from '../components/StagedLoginForm';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const handleLoginSuccess = (user: any, token: string) => {
        // Token is already stored by StagedLoginForm, just navigate
        if (user.role === 'ADMIN') {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <StagedLoginForm onLoginSuccess={handleLoginSuccess} />

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/register')}
                        className="text-slate-400 hover:text-white transition-colors text-sm font-light tracking-wide"
                    >
                        New Personnel? <span className="text-blue-400 font-medium">Initialize Enrollment</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
