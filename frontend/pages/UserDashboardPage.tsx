import React from 'react';
import UserDashboard from '../components/UserDashboard';
import { useNavigate } from 'react-router-dom';

import { SessionGuardian } from '../components/session/SessionGuardian';

export const UserDashboardPage: React.FC = () => {
    // navigate was unused in the wrapper if we wrap the inner component
    // but the original code had it. I'll keep it simple.

    // Mock trust score for now, this will be connected to context/session later
    const trustScore = 95;

    const handleReauthenticate = () => {
        window.location.href = '/login'; // Simple redirect for now
    };

    return (
        <SessionGuardian>
            <div className="min-h-screen bg-[#F3F5F9]">
                <UserDashboard trustScore={trustScore} onReauthenticate={handleReauthenticate} />
            </div>
        </SessionGuardian>
    );
};

export default UserDashboardPage;
