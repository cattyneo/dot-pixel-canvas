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
            className="border-border animate-fadeIn relative cursor-pointer border-[3px] bg-white p-[10px] transition-transform hover:scale-105"
            onClick={() => onView(post)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onView(post)}
            aria-label={`${post.title} - ${dateString}`}
        >
            <button
                type="button"
                onClick={handleDelete}
                className="hover:text-border absolute -right-[15px] -top-[15px] z-10 h-10 w-10 cursor-pointer text-center text-xl leading-10 text-[#888]"
                aria-label="削除"
            >
                ×
            </button>

            <div className="bg-border border-border mb-2 grid h-20 w-20 grid-cols-4 gap-[1px] border-2 p-[1px]">
                {pixels.map((color, index) => (
                    <div
                        key={index}
                        className="h-full w-full"
                        style={{ backgroundColor: typeof color === "string" ? color : "#cccccc" }}
                    />
                ))}
            </div>

            <div className="text-border font-pixel text-center text-xs font-bold">{post.title}</div>
            <div className="font-pixel text-center text-[10px] text-[#666]">{dateString}</div>
        </div>
    );
}

export const AlbumItem = memo(AlbumItemComponent);
