"use client";

import { useEffect, useRef, useState } from "react";
import { PHOTO_BUCKET, supabase } from "@/lib/supabase";
import {
  FEED_LIMIT,
  MAX_MESSAGE,
  MAX_NAME,
  PHOTO_TYPES,
  initials,
  mergePost,
  timeAgo,
  validatePhoto,
  validatePost,
  type Post,
} from "@/lib/posts";

export default function Wall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [, setTick] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  // Load the newest posts, then listen for new ones with Supabase Realtime.
  useEffect(() => {
    let cancelled = false;

    supabase
      .from("posts")
      .select("id, author_name, message, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(FEED_LIMIT)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setLoadError("Couldn't load the wall. Please refresh the page.");
        else setPosts(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel("wall-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        setPosts((current) => mergePost(current, payload.new as Post));
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-render every 30 s so the "x minutes ago" labels stay fresh.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  function choosePhoto(file: File | undefined) {
    if (!file) return;
    const problem = validatePhoto(file);
    if (problem) {
      setFormError(problem);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFormError(null);
    setPhoto(file);
  }

  function clearPhoto() {
    setPhoto(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function share(e: { preventDefault(): void }) {
    e.preventDefault();
    const problem = validatePost(name, message);
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError(null);
    setSharing(true);
    try {
      let image_url: string | null = null;
      if (photo) {
        const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, photo, { contentType: photo.type, upsert: false });
        if (uploadError) throw new Error("The photo didn't upload. Try a smaller image.");
        image_url = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({ author_name: name.trim(), message: message.trim(), image_url })
        .select("id, author_name, message, image_url, created_at")
        .single();
      if (error || !data) throw new Error("Your post wasn't saved. Please try again.");

      setPosts((current) => mergePost(current, data as Post));
      setMessage("");
      clearPhoto();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  const remaining = MAX_MESSAGE - message.length;
  const canShare = !sharing && message.trim().length > 0 && remaining >= 0 && name.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={share} className="rounded border border-[#bdc7d8] bg-white p-3" aria-label="Write on the wall">
        <label htmlFor="message" className="mb-1 block text-[13px] font-bold text-[#333]">
          Write something…
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX_MESSAGE + 20}
          rows={3}
          placeholder="What's on your mind?"
          className="w-full resize-y rounded-sm border border-[#bdc7d8] p-2 text-[13px] text-[#333] outline-none focus:border-[#3b5998]"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label htmlFor="name" className="sr-only">
            Your name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME}
            placeholder="Your name"
            autoComplete="name"
            className="w-44 rounded-sm border border-[#bdc7d8] px-2 py-1 text-[13px] outline-none focus:border-[#3b5998]"
          />
          <input
            ref={fileInput}
            id="photo"
            type="file"
            accept={PHOTO_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => choosePhoto(e.target.files?.[0])}
          />
          <label
            htmlFor="photo"
            className="cursor-pointer rounded-sm border border-[#bdc7d8] bg-[#f7f7f7] px-2 py-1 text-[12px] text-[#3b5998] hover:bg-[#eceff5]"
          >
            📷 {photo ? "Change photo" : "Add photo"}
          </label>
          {photo && (
            <span className="flex items-center gap-1 text-[12px] text-[#666]">
              {photo.name.length > 22 ? photo.name.slice(0, 20) + "…" : photo.name}
              <button type="button" onClick={clearPhoto} className="text-[#3b5998] hover:underline" aria-label="Remove photo">
                ✕
              </button>
            </span>
          )}
          <span
            className={`ml-auto text-[12px] tabular-nums ${remaining < 0 ? "font-bold text-red-600" : remaining <= 20 ? "text-amber-600" : "text-[#999]"}`}
            aria-live="polite"
          >
            {remaining}
          </span>
          <button
            type="submit"
            disabled={!canShare}
            className="rounded-sm border border-[#29447e] bg-[#5b74a8] px-4 py-1 text-[13px] font-bold text-white hover:bg-[#4e69a2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sharing ? "Sharing…" : "Share"}
          </button>
        </div>
        {formError && (
          <p role="alert" className="mt-2 text-[12px] text-red-600">
            {formError}
          </p>
        )}
      </form>

      <div className="flex items-center justify-between border-b border-[#d8dfea] pb-1">
        <h2 className="text-[13px] font-bold text-[#333]">Wall</h2>
        <span className="text-[11px] text-[#999]">
          <span className={`mr-1 inline-block h-2 w-2 rounded-full ${live ? "bg-green-500" : "bg-gray-300"}`} aria-hidden="true" />
          {live ? "Live: new posts appear automatically" : "Connecting…"}
        </span>
      </div>

      {loading ? (
        <p className="py-6 text-center text-[13px] text-[#999]">Loading the wall…</p>
      ) : loadError ? (
        <p role="alert" className="py-6 text-center text-[13px] text-red-600">{loadError}</p>
      ) : posts.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[#999]">No posts yet. Be the first to write on the wall!</p>
      ) : (
        <ul className="flex flex-col" aria-label="Wall posts">
          {posts.map((p) => (
            <li key={p.id} className="flex gap-3 border-b border-[#e9e9e9] py-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-[#d8dfea] text-[15px] font-bold text-[#3b5998]"
                aria-hidden="true"
              >
                {initials(p.author_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-[#333]">
                  <span className="font-bold text-[#3b5998]">{p.author_name}</span>{" "}
                  <span className="whitespace-pre-wrap break-words">{p.message}</span>
                </p>
                {p.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={`Photo shared by ${p.author_name}`}
                    className="mt-2 max-h-80 max-w-full rounded-sm border border-[#d8dfea]"
                    loading="lazy"
                  />
                )}
                {/* Posts only render in the browser (they load after mount), so reading the clock here is safe. */}
                <time dateTime={p.created_at} className="mt-1 block text-[11px] text-[#999]">
                  {timeAgo(p.created_at)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
