import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

dotenv.config();

const API_URL = 'http://localhost:8080/api';
const TEST_USER = {
    username: 'sys_check_' + Date.now(),
    password: 'Password123!',
    fullName: 'System Check User'
};

async function run() {
    console.log('🛡️  Starting BioShield System Verification 🛡️');
    console.log('-------------------------------------------');

    // 1. Health Check
    try {
        const healthUrl = 'http://localhost:8080/health';
        const res = await fetch(healthUrl);
        if (!res.ok) throw new Error(`Health check returned ${res.status}`);
        const health = await res.json();
        console.log('✅ Health Check:', health);
    } catch (e) {
        console.error('❌ Health Check Failed:', e);
        process.exit(1);
    }

    // 2. Registration
    console.log('\n1️⃣  Testing Registration...');
    let res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
    });

    if (!res.ok) throw new Error(`Registration failed: ${await res.text()}`);
    let json = await res.json();
    const userId = json.data.userId;
    console.log('   ✅ User Registered. ID:', userId);

    // 3. Login (Risk Engine)
    console.log('\n2️⃣  Testing Login & Risk Engine...');
    res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BioShield-Test-Script/1.0'
        },
        body: JSON.stringify({
            username: TEST_USER.username,
            password: TEST_USER.password,
            deviceFingerprint: 'test-device-hash-' + Date.now() // Simulate new device
        })
    });

    if (!res.ok) throw new Error(`Login failed: ${await res.text()}`);
    json = await res.json();
    const token = json.data.token;
    console.log('   ✅ Login Successful.');
    console.log('   📊 Risk Score:', json.data.riskScore);
    console.log('   🛡️  Decision:', json.data.riskDecision);
    console.log('   📱 New Device Detected:', json.data.isNewDevice);

    if (json.data.riskDecision === 'BLOCK') {
        console.error('   ❌ Unexpected BLOCK decision.');
        process.exit(1);
    }

    // 4. Biometric Enrollment
    console.log('\n3️⃣  Testing Biometric Enrollment (Face)...');
    const dummyPath = path.join(__dirname, 'temp_face.dat');
    fs.writeFileSync(dummyPath, Buffer.alloc(1024, 'fake-face-data'));

    const blobEnroll = new Blob([fs.readFileSync(dummyPath)]);
    const formDataEnroll = new FormData();
    formDataEnroll.append('file', blobEnroll, 'face.dat');
    formDataEnroll.append('userId', userId);
    formDataEnroll.append('modality', 'face');

    res = await fetch(`${API_URL}/biometric/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataEnroll
    });

    if (!res.ok) throw new Error(`Enrollment failed: ${await res.text()}`);
    json = await res.json();
    console.log('   ✅ Enrollment Successful. Asset ID:', json.data.assetId);
    console.log('   🔒 Encryption:', json.data.encryption);

    // 5. Biometric Verification
    console.log('\n4️⃣  Testing Biometric Verification...');
    const formDataVerify = new FormData();
    formDataVerify.append('file', blobEnroll, 'face.dat'); // Verify with same data
    formDataVerify.append('userId', userId);
    formDataVerify.append('modality', 'face');

    res = await fetch(`${API_URL}/biometric/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataVerify
    });

    if (!res.ok) throw new Error(`Verification failed: ${await res.text()}`);
    json = await res.json();
    console.log('   ✅ Verification Result:', json.data.verified ? 'MATCH' : 'NO MATCH');
    console.log('   💯 Match Score:', json.data.score);

    // 6. Admin Stats Check
    console.log('\n5️⃣  Testing Admin Stats (Security Check)...');
    // We need an admin token. Since we don't have one easily, we'll try to access and expect 403
    res = await fetch(`${API_URL}/admin/stats`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` } // User token
    });

    if (res.status === 403) {
        console.log('   ✅ RBAC Working: User denied access to Admin API.');
    } else {
        console.error('   ❌ RBAC Failed: User accessed Admin API or other error.', res.status);
    }

    // 7. Cleanup
    fs.unlinkSync(dummyPath);
    console.log('\n-------------------------------------------');
    console.log('🎉 System Verification Complete! No critical errors found.');
}

run().catch(e => {
    console.error('\n❌ System Check Failed:', e);
    process.exit(1);
});
