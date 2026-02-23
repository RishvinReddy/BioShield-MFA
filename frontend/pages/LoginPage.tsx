
import React, { useState } from 'react';
import { StagedLoginForm } from '../components/StagedLoginForm';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const handleLoginSuccess = (user: any, token: string) => {
        // Redirect to Dashboard
        console.log("Login Success", user);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 bg-grid-slate-100">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl" />
            </div>

            <div className="z-10 w-full flex justify-center">
                <StagedLoginForm onLoginSuccess={handleLoginSuccess} />
            </div>

            <div className="absolute bottom-6 text-center text-slate-400 text-xs">
                <p>BioShield MFA v2.0 • Secured by XAI Neural Engine</p>
            </div>
        </div>
    );
};
