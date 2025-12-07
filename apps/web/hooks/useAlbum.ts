"use client";

import { useState, useEffect, useCallback } from "react";
import type { Post } from "@/types";
import {
  getAlbumFromStorage,
  savePostToStorage,
  removePostFromStorage,
} from "@/lib/storage";

export function useAlbum() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = getAlbumFromStorage();
    setPosts(saved);
    setIsLoaded(true);
  }, []);

  const addPost = useCallback((post: Post) => {
    savePostToStorage(post);
    setPosts((prev) => [post, ...prev]);
  }, []);

  const removePost = useCallback((postId: string) => {
    removePostFromStorage(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  return {
    posts,
    isLoaded,
    addPost,
    removePost,
  };
}
