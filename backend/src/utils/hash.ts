import argon2 from "argon2";

export async function hashPassword(password: string) {
    try {
        return await argon2.hash(password);
    } catch (err) {
        throw new Error('Password hashing failed');
    }
}

export async function verifyPassword(hash: string, password: string) {
    try {
        return await argon2.verify(hash, password);
    } catch (err) {
        return false;
    }
}
