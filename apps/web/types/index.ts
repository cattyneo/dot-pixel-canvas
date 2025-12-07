export interface Post {
  id: string;
  title: string;
  pixels: string; // JSON string of 16 hex colors
  created_at: string;
}

export interface AlbumPost extends Post {
  // Additional fields for album display
}

export type PixelGrid = string[]; // Array of 16 hex color codes
