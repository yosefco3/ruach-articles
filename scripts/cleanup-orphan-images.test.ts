import { describe, it, expect } from "vitest";
import { extractReferencedKeys } from "./cleanup-orphan-images";

describe("extractReferencedKeys", () => {
  it("extracts a key from a bare fileUrl and a /uploads/ URL", () => {
    expect(extractReferencedKeys("/uploads/attachments/abc123.jpg")).toEqual([
      "attachments/abc123.jpg",
    ]);
    expect(extractReferencedKeys("attachments/def456.webp")).toEqual([
      "attachments/def456.webp",
    ]);
  });

  it("extracts keys from inline <img> inside an HTML body", () => {
    const body =
      '<p>hi</p><img src="/uploads/attachments/inline-1.png"><img src="https://cdn.test/attachments/inline-2.jpg">';
    expect(extractReferencedKeys(body).sort()).toEqual([
      "attachments/inline-1.png",
      "attachments/inline-2.jpg",
    ]);
  });

  it("ignores text with no storage keys", () => {
    expect(extractReferencedKeys("just some prose, no images here")).toEqual([]);
    expect(extractReferencedKeys("")).toEqual([]);
  });

  it("finds multiple keys in a stringified row", () => {
    const row = JSON.stringify({
      coverImage: "/uploads/attachments/cover.jpg",
      body: '<img src="/uploads/attachments/body.png">',
    });
    expect(extractReferencedKeys(row).sort()).toEqual([
      "attachments/body.png",
      "attachments/cover.jpg",
    ]);
  });
});
