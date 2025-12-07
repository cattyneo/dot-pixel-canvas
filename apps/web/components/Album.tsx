"use client";

import { memo } from "react";
import type { Post } from "@/types";
import { AlbumItem } from "./AlbumItem";

interface AlbumProps {
  posts: Post[];
  onView: (post: Post) => void;
  onDelete: (postId: string) => void;
}

function AlbumComponent({ posts, onView, onDelete }: AlbumProps) {
  return (
    <section className="w-full max-w-[600px]">
      <h2 className="text-center mb-5 text-lg border-b-[3px] border-border pb-[10px] font-bold font-pixel">
        アルバム
      </h2>
      <div className="flex flex-wrap justify-center gap-5">
        {posts.map((post) => (
          <AlbumItem
            key={post.id}
            post={post}
            onView={onView}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

export const Album = memo(AlbumComponent);
