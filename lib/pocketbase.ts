import PocketBase from 'pocketbase';

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Helper types
export interface Post {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    slug: string;
    created: string;
    image?: string;
}
