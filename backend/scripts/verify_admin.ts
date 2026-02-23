import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

async function verifyAdminFlow() {
    console.log('🚀 Starting Admin Control Plane Verification...');

    try {
        // 1. Login as Admin
        console.log('\nLogging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@bioshield.com',
            password: 'admin123'
        });

        const token = loginRes.data.accessToken;
        console.log('✅ Admin Logged In');

        // 2. Get All Users
        console.log('\nFetching Users...');
        try {
            const usersRes = await axios.get(`${API_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ Fetched ${usersRes.data.data.length} users`);
        } catch (e: any) {
            console.error('❌ Failed to fetch users:', e.message);
        }

        // 3. Get Audit Logs
        console.log('\nFetching Audit Logs...');
        try {
            const auditRes = await axios.get(`${API_URL}/admin/audit`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ Fetched ${auditRes.data.data.length} audit logs`);
        } catch (e: any) {
            console.error('❌ Failed to fetch audit logs:', e.message);
        }

        // 4. Test Lockout/Unlock (Simulated)
        // We'll unlock the admin user (safe op)
        console.log('\nUnlocking Admin User...');
        const adminId = loginRes.data.user.id;
        try {
            await axios.post(`${API_URL}/admin/users/${adminId}/unlock`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Admin User Unlocked successfully');
        } catch (e: any) {
            console.error('❌ Failed to unlock user:', e.message);
        }

    } catch (error: any) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

verifyAdminFlow();
