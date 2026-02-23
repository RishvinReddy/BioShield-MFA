import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

async function verifyAuthFlow() {
    console.log('🚀 Starting Auth Flow Verification...');

    try {
        // 1. Test Login with WRONG password
        console.log('\nTesting Login (Wrong Password)...');
        try {
            await axios.post(`${API_URL}/login`, {
                email: 'admin@bioshield.com',
                password: 'wrongpassword'
            });
            console.error('❌ Expected 401, but got success');
        } catch (error: any) {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.log(`✅ Correctly rejected with ${error.response.status}`);
            } else {
                console.error(`❌ Unexpected error: ${error.message} (Status: ${error.response?.status})`);
                if (error.response?.data) console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            }
        }

        // 2. Test Login with CORRECT password
        console.log('\nTesting Login (Correct Password Only)...');
        try {
            const res = await axios.post(`${API_URL}/login`, {
                email: 'admin@bioshield.com',
                password: 'admin123'
            });

            console.log('✅ Login Successful');
            console.log('Fusion Result:', JSON.stringify(res.data.fusion, null, 2));

            if (res.data.stepUpRequired) {
                console.log('ℹ️ Step-Up Required (Expected for password-only if risk is medium)');
            } else {
                console.log('ℹ️ Allowed directly (High trust or permissive threshold)');
            }

        } catch (error: any) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Correctly rejected (DENY due to low score)');
                if (error.response.data) console.log('Details:', error.response.data);
            } else {
                console.error(`❌ Unexpected error: ${error.message}`);
                if (error.response?.data) console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            }
        }

    } catch (error: any) {
        console.error('Test Failed:', error.message);
    }
}

verifyAuthFlow();
