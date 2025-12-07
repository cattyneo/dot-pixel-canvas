"use client";

import { memo, useMemo } from "react";
import type { Post } from "@/types";

interface AlbumItemProps {
  post: Post;
  onView: (post: Post) => void;
  onDelete: (postId: string) => void;
}

function AlbumItemComponent({ post, onView, onDelete }: AlbumItemProps) {
  const dateString = useMemo(() => {
    const date = new Date(post.created_at);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
  }, [post.created_at]);

  const pixels = useMemo(() => {
    try {
      return JSON.parse(post.pixels) as string[];
    } catch {
      return Array(16).fill("#cccccc");
    }
  }, [post.pixels]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("この絵をアルバムから削除しますか？")) {
      onDelete(post.id);
    }
  };

  return (
    <div
      className="bg-white p-[10px] border-[3px] border-border cursor-pointer transition-transform hover:scale-105 animate-fadeIn relative"
      onClick={() => onView(post)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onView(post)}
      aria-label={`${post.title} - ${dateString}`}
    >
      <button
        type="button"
        onClick={handleDelete}
        className="absolute -top-[15px] -right-[15px] w-10 h-10 leading-10 text-center text-[#888] text-xl cursor-pointer z-10 hover:text-border"
        aria-label="削除"
      >
        ×
      </button>

      <div className="grid grid-cols-4 gap-[1px] w-20 h-20 bg-border border-2 border-border mb-2 p-[1px]">
        {pixels.map((color, index) => (
          <div
            key={index}
            className="w-full h-full"
            style={{ backgroundColor: typeof color === "string" ? color : "#cccccc" }}
          />
        ))}
      </div>

      <div className="text-xs text-center text-border font-bold font-pixel">
        {post.title}
      </div>
      <div className="text-[10px] text-center text-[#666] font-pixel">
        {dateString}
      </div>
    </div>
  );
}

export const AlbumItem = memo(AlbumItemComponent);
