import { pb } from './pocketbase';

export interface UserRecord {
    id: string;
    username: string;
    email?: string;
    introduction?: string;
    permission_group?: number;
    created: string;
    updated: string;
}

export async function loginUser(username: string, password: string) {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
    }

    // Save token and record to local authStore
    pb.authStore.save(data.token, data.record);
    return data;
}

export async function registerUser(username: string, password: string, passwordConfirm: string, name: string) {
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, passwordConfirm, name }),
    });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
    }

    // Save token and record to local authStore
    pb.authStore.save(data.token, data.record);
    return data;
}

export async function logoutUser() {
    pb.authStore.clear();
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
        // Server may be unreachable; in-memory store is already cleared.
    }
}

export function getCurrentUser(): UserRecord | null {
    if (!pb.authStore.isValid) return null;
    return pb.authStore.record as unknown as UserRecord;
}

export function isAuthenticated(): boolean {
    return pb.authStore.isValid;
}
