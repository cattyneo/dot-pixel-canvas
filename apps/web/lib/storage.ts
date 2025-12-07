import type { Post } from "@/types";

const STORAGE_KEY = "pixel_diary_album";

function parsePixels(value: unknown): string[] {
    if (Array.isArray(value)) return value as string[];
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed as string[];
            }
        } catch {
            // ignore
        }
    }
    return Array(16).fill("#cccccc");
}

function normalizePost(post: any): Post | null {
    if (!post || !post.id || !post.created_at || typeof post.title !== "string") {
        return null;
    }

    return {
        id: post.id,
        title: post.title,
        pixels: parsePixels(post.pixels),
        created_at: post.created_at,
    };
}

export function getAlbumFromStorage(): Post[] {
    if (typeof window === "undefined") return [];

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    try {
        const raw = JSON.parse(saved) as unknown[];
        return raw.map((item) => normalizePost(item)).filter((item): item is Post => Boolean(item));
    } catch {
        return [];
    }
}

export function savePostToStorage(post: Post): void {
    if (typeof window === "undefined") return;

    const posts = getAlbumFromStorage();
    posts.unshift(post);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function removePostFromStorage(postId: string): void {
    if (typeof window === "undefined") return;

    const posts = getAlbumFromStorage();
    const filtered = posts.filter((p) => p.id !== postId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
