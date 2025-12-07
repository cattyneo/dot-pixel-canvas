"use client";

import { useState, useCallback } from "react";
import { Canvas } from "./Canvas";
import { ColorPicker } from "./ColorPicker";
import { Album } from "./Album";
import { Modal } from "./Modal";
import { useAlbum } from "@/hooks/useAlbum";
import { exchangeArt } from "@/lib/actions";
import type { Post } from "@/types";

const INITIAL_PIXELS = Array(16).fill("#ffffff");
const DEFAULT_COLOR = "#ffb7b2";

export function PixelDiary() {
  const [pixels, setPixels] = useState<string[]>(INITIAL_PIXELS);
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [title, setTitle] = useState("");
  const [isExchanging, setIsExchanging] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { posts, addPost, removePost } = useAlbum();

  const handlePixelClick = useCallback(
    (index: number) => {
      setPixels((prev) => {
        const newPixels = [...prev];
        newPixels[index] = currentColor;
        return newPixels;
      });
    },
    [currentColor]
  );

  const resetCanvas = useCallback(() => {
    setPixels(INITIAL_PIXELS);
    setTitle("");
  }, []);

  const handleExchange = useCallback(async () => {
    setIsExchanging(true);

    try {
      const result = await exchangeArt(title, pixels);

      if (!result.success) {
        alert(result.error);
        return;
      }

      if (result.post) {
        addPost(result.post);
      }

      alert(result.message);
      resetCanvas();
    } catch (error) {
      console.error("Exchange error:", error);
      alert("エラーが発生しました");
    } finally {
      setIsExchanging(false);
    }
  }, [title, pixels, addPost, resetCanvas]);

  const handleViewPost = useCallback((post: Post) => {
    setSelectedPost(post);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const handleDeletePost = useCallback(
    (postId: string) => {
      removePost(postId);
    },
    [removePost]
  );

  return (
    <>
      <div className="bg-container-bg p-6 border-[3px] border-border text-center w-[300px] mb-10">
        <h1 className="text-xl mb-[15px] tracking-[2px] font-bold font-pixel">
          いまのきぶん
        </h1>

        <Canvas
          pixels={pixels}
          currentColor={currentColor}
          onPixelClick={handlePixelClick}
        />

        <ColorPicker color={currentColor} onChange={setCurrentColor} />

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル(5もじまで)"
          maxLength={5}
          className="w-[180px] p-2 mb-[15px] font-pixel text-base text-center border-[3px] border-border bg-[#f9f9f9] outline-none"
        />

        <button
          type="button"
          onClick={handleExchange}
          disabled={isExchanging}
          className="bg-accent text-border border-[3px] border-border py-3 px-5 font-pixel text-lg font-bold cursor-pointer w-full disabled:bg-[#ccc] disabled:text-[#888] disabled:cursor-not-allowed active:bg-border active:text-accent"
        >
          {isExchanging ? "つうしんちゅう..." : "こうかんする"}
        </button>
      </div>

      <Album
        posts={posts}
        onView={handleViewPost}
        onDelete={handleDeletePost}
      />

      <Modal post={selectedPost} onClose={handleCloseModal} />
    </>
  );
}
