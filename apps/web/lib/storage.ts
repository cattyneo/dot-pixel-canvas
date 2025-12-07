import type { Post } from "@/types";

const STORAGE_KEY = "pixel_diary_album";

export function getAlbumFromStorage(): Post[] {
  if (typeof window === "undefined") return [];

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as Post[];
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
