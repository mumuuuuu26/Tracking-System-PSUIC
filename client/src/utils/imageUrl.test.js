import { describe, expect, it } from "vitest";
import { getImageUrl } from "./imageUrl";

describe("getImageUrl", () => {
  it("returns default profile path when input is empty", () => {
    expect(getImageUrl(null)).toMatch(/default-profile\.svg$/);
    expect(getImageUrl("")).toMatch(/default-profile\.svg$/);
  });

  it("keeps absolute http/https URL unchanged", () => {
    const url = "https://example.com/image.jpg";
    expect(getImageUrl(url)).toBe(url);
  });

  it("keeps upload file suffix for upload paths", () => {
    const resolved = getImageUrl("/uploads/image.jpg");
    expect(resolved).toContain("/uploads/image.jpg");
  });
});
