import { describe, expect, it } from "vitest";
import {
  FEED_LIMIT,
  MAX_MESSAGE,
  initials,
  mergePost,
  timeAgo,
  validatePhoto,
  validatePost,
  type Post,
} from "./posts";

const post = (id: string, created_at: string, message = "hi"): Post => ({
  id,
  author_name: "Rene",
  message,
  image_url: null,
  created_at,
});

describe("validatePost", () => {
  it("accepts a normal post", () => {
    expect(validatePost("Rene", "Hello wall")).toBeNull();
  });
  it("needs a name and a message", () => {
    expect(validatePost("  ", "Hello")).toMatch(/name/);
    expect(validatePost("Rene", "   ")).toMatch(/Write something/);
  });
  it("allows exactly 280 characters and rejects 281", () => {
    expect(validatePost("Rene", "a".repeat(MAX_MESSAGE))).toBeNull();
    expect(validatePost("Rene", "a".repeat(MAX_MESSAGE + 1))).toMatch(/280/);
  });
  it("rejects names longer than 40 characters", () => {
    expect(validatePost("n".repeat(41), "hi")).toMatch(/40/);
  });
});

describe("validatePhoto", () => {
  it("accepts small images", () => {
    expect(validatePhoto({ type: "image/png", size: 1000 })).toBeNull();
  });
  it("rejects other file types and large files", () => {
    expect(validatePhoto({ type: "application/pdf", size: 1000 })).toMatch(/JPG/);
    expect(validatePhoto({ type: "image/jpeg", size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
  });
});

describe("mergePost", () => {
  it("puts the newest post first", () => {
    const feed = [post("a", "2026-11-20T01:00:00Z")];
    const next = mergePost(feed, post("b", "2026-11-20T02:00:00Z"));
    expect(next.map((p) => p.id)).toEqual(["b", "a"]);
  });
  it("ignores a post that is already in the feed", () => {
    const feed = [post("a", "2026-11-20T01:00:00Z")];
    expect(mergePost(feed, post("a", "2026-11-20T01:00:00Z"))).toBe(feed);
  });
  it("keeps at most the feed limit", () => {
    const feed = Array.from({ length: FEED_LIMIT }, (_, i) =>
      post(String(i), new Date(Date.UTC(2026, 10, 20, 0, i)).toISOString())
    );
    const next = mergePost(feed, post("new", "2026-11-21T00:00:00Z"));
    expect(next).toHaveLength(FEED_LIMIT);
    expect(next[0].id).toBe("new");
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-11-20T12:00:00Z");
  it("formats recent times", () => {
    expect(timeAgo("2026-11-20T11:59:50Z", now)).toBe("a few seconds ago");
    expect(timeAgo("2026-11-20T11:59:00Z", now)).toBe("about a minute ago");
    expect(timeAgo("2026-11-20T11:30:00Z", now)).toBe("30 minutes ago");
    expect(timeAgo("2026-11-20T09:00:00Z", now)).toBe("3 hours ago");
    expect(timeAgo("2026-11-19T12:00:00Z", now)).toBe("yesterday");
  });
});

describe("initials", () => {
  it("uses the first and last name", () => {
    expect(initials("Rene Vincent Cosme")).toBe("RC");
    expect(initials("greg")).toBe("G");
    expect(initials("   ")).toBe("?");
  });
});
