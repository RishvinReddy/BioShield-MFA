const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const FRONTEND_URL = 'http://127.0.0.1:3000/api';

async function verifyFrontendProxy() {
    console.log('🚀 Verifying Frontend Proxy (Port 3000 -> 8080)...');

    try {
        // 1. Test Login flow through Proxy
        console.log('\nTesting Login through Proxy...');
        const loginRes = await axios.post(`${FRONTEND_URL}/auth/login`, {
            email: 'user@test.com',
            password: 'password123'
        });

        if (loginRes.status === 200 && loginRes.data.success) {
            console.log('✅ Login Successful via Frontend Proxy');
            console.log('   Token received:', !!loginRes.data.accessToken);
        } else {
            console.error('❌ Login Failed via Proxy:', loginRes.data);
        }

    } catch (error: any) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

verifyFrontendProxy();
