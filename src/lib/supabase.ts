import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill them in."
  );
}

// The publishable key is safe in the browser: Row Level Security only lets
// visitors read posts, add posts and upload photos to the wall-photos bucket.
export const supabase = createClient(url, key);

export const PHOTO_BUCKET = "wall-photos";
