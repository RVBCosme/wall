export const MAX_MESSAGE = 280;
export const MAX_NAME = 40;
export const FEED_LIMIT = 50;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export type Post = {
  id: string;
  author_name: string;
  message: string;
  image_url: string | null;
  created_at: string;
};

// Returns an error message for the visitor, or null when the post can be shared.
export function validatePost(name: string, message: string): string | null {
  const n = name.trim();
  const m = message.trim();
  if (!n) return "Please add your name.";
  if (n.length > MAX_NAME) return `Names can be up to ${MAX_NAME} characters.`;
  if (!m) return "Write something before you share.";
  if (m.length > MAX_MESSAGE) return `Posts can be up to ${MAX_MESSAGE} characters.`;
  return null;
}

export function validatePhoto(file: { type: string; size: number }): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return "Photos must be JPG, PNG, GIF or WebP.";
  if (file.size > MAX_PHOTO_BYTES) return "Photos can be up to 5 MB.";
  return null;
}

// Adds a post to the feed (from Realtime or from our own insert) without duplicates,
// keeping the newest first and at most FEED_LIMIT posts.
export function mergePost(posts: Post[], post: Post): Post[] {
  if (posts.some((p) => p.id === post.id)) return posts;
  return [post, ...posts]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, FEED_LIMIT);
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 45) return "a few seconds ago";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "about a minute ago" : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "about an hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
