import axios from 'axios';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:8080/api';
const prisma = new PrismaClient();

async function verifyEnrollment() {
    console.log('🚀 Starting User Enrollment Verification...');

    try {
        // 1. Get Admin User directly from DB
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            throw new Error('No Admin user found in DB');
        }

        // 2. Generate Token Locally (Bypass Login/Fusion for this test)
        const token = jwt.sign(
            { id: adminUser.id, role: adminUser.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '15m' }
        );

        console.log('✅ Generated Admin Token locally');

        // 3. Create New User
        const newEmail = `user_${Date.now()}@test.com`;
        const newPassword = 'testUser123!';
        console.log(`\nCreating User: ${newEmail}...`);

        try {
            const createRes = await axios.post(`${API_URL}/admin/users`, {
                email: newEmail,
                password: newPassword,
                role: 'USER'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ User Created:', createRes.data.data);

            // 4. Verify User exists in List
            console.log('\nVerifying User in List...');
            const listRes = await axios.get(`${API_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const userExists = listRes.data.data.find((u: any) => u.email === newEmail);
            if (userExists) {
                console.log('✅ User found in database list');
            } else {
                console.error('❌ User NOT found in list');
            }

        } catch (e: any) {
            console.error('❌ Failed to create user:', e.response?.data || e.message);
        }

    } catch (error: any) {
        console.error('Test Failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyEnrollment();
