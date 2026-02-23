
// services/api.ts

export const API_BASE = '/api';

export interface VerifyResponse {
    success: boolean;
    data?: {
        verified: boolean;
        score: number;
        matchId: string | null;
        token?: string; // JWT from verify step
    };
    error?: {
        message: string;
    };
}

export interface EnrollResponse {
    success: boolean;
    data?: {
        assetId: string;
        status: string;
    };
    error?: {
        message: string;
    };
}

// Helper to convert Blob/File to FormData
function createFormData(file: Blob, userId: string, modality: string): FormData {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('modality', modality);
    return formData;
}


export const api = {
    setToken: (token: string) => {
        localStorage.setItem('auth_token', token);
    },

    getToken: () => {
        return localStorage.getItem('auth_token');
    },

    register: async (data: any): Promise<any> => {
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: { message: 'Network error' } };
        }
    },

    // --- STAGED LOGIN FLOW ---

    // Step 1: Password
    loginStep1: async (data: { email: string, password: string }): Promise<any> => {
        try {
            const res = await fetch(`${API_BASE}/auth/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: { message: 'Network error' } };
        }
    },

    // Step 2: OTP
    loginStep2: async (data: { userId: string, otp: string, stageToken: string }): Promise<any> => {
        try {
            const res = await fetch(`${API_BASE}/auth/otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: { message: 'Network error' } };
        }
    },

    // Step 3: Biometric / Verify / Fusion
    loginStep3: async (data: { userId: string, biometricEmbedding: number[], voiceEmbedding?: number[], stageToken: string }): Promise<any> => {
        try {
            const res = await fetch(`${API_BASE}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: { message: 'Network error' } };
        }
    },

    enroll: async (file: Blob, userId: string, modality: string): Promise<EnrollResponse> => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/enroll`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: createFormData(file, userId, modality)
            });
            return await res.json();
        } catch (e) {
            console.error('API Error:', e);
            return { success: false, error: { message: 'Network error' } };
        }
    },

    verify: async (file: Blob, userId: string, modality: string): Promise<VerifyResponse> => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/verify`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: createFormData(file, userId, modality)
            });
            return await res.json();
        } catch (e) {
            console.error('API Error:', e);
            return { success: false, error: { message: 'Network error' } };
        }
    },

    // --- PHASE 3: VECTOR BIOMETRICS ---
    enrollBiometrics: async (userId: string, embedding: number[] | number[][]) => {
        try {
            const token = localStorage.getItem('auth_token');

            // Normalize to array of arrays
            const embeddings = Array.isArray(embedding[0]) ? embedding : [embedding];

            const res = await fetch(`${API_BASE}/biometric/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, embeddings })
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: { message: 'Network error' } };
        }
    },

    verifyBiometrics: async (userId: string, embedding: Float32Array | number[]) => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/biometric/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, embedding: Array.from(embedding) })
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: { message: 'Network error' } };
        }
    },

    // --- ADMIN ---
    admin: {
        createUser: async (userData: any) => {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(userData)
            });
            return await res.json();
        },
        getStats: async () => {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/admin/stats`, {
                method: 'POST', // Using POST as per init requirements, though GET is more semantic
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            return await res.json();
        }
    },

    // --- ADVANCED AUTH (WebAuthn / QR) ---
    webauthn: {
        registerChallenge: async () => {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/auth/webauthn/register/challenge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            return await res.json();
        },
        registerVerify: async (data: any) => {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/auth/webauthn/register/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        loginChallenge: async (username: string) => {
            const res = await fetch(`${API_BASE}/auth/webauthn/login/challenge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            return await res.json();
        },
        loginVerify: async (data: any, userId: string) => {
            const res = await fetch(`${API_BASE}/auth/webauthn/login/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: data, userId })
            });
            return await res.json();
        }
    },
    qr: {
        init: async () => {
            const res = await fetch(`${API_BASE}/auth/qr/init`, { method: 'POST' });
            return await res.json();
        },
        poll: async (sessionId: string) => {
            const res = await fetch(`${API_BASE}/auth/qr/poll/${sessionId}`);
            return await res.json();
        },
        approve: async (sessionId: string) => {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/auth/qr/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ sessionId })
            });
            return await res.json();
        }
    },

    // --- VOICE BIOMETRICS ---
    enrollVoice: async (userId: string, samples: number[][]): Promise<any> => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/voice/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, samples })
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: { message: 'Network error' } };
        }
    },

    verifyVoice: async (userId: string, embedding: number[]): Promise<any> => {
        try {
            // const token = localStorage.getItem('auth_token'); // Might be pre-auth
            const res = await fetch(`${API_BASE}/voice/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, // 'Authorization': `Bearer ${token}` if needed
                body: JSON.stringify({ userId, embedding })
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: { message: 'Network error' } };
        }
    }
};
