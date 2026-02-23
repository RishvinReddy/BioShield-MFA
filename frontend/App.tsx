import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SystemBoot from './components/SystemBoot';

const App: React.FC = () => {
    // We can keep a global loading state or boot sequence here if needed
    const [booting, setBooting] = React.useState(true);

    if (booting) {
        return <SystemBoot onComplete={() => setBooting(false)} />;
    }

    return (
        <Router>
            <Routes>
                {/* Default redirect to Login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Auth Routes */}
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes (We'll add real protection wrappers next) */}
                <Route path="/dashboard" element={<UserDashboardPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
};

export default App;
