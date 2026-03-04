import { describe, expect, it } from "vitest";
import { getTicketRatingLink } from "./ratingFormUrl";

describe("getTicketRatingLink", () => {
  it("returns app-prefixed fallback path when external URL is invalid", () => {
    const result = getTicketRatingLink(
      { id: 3 },
      { externalFormUrl: "not-a-url", baseUrl: "/app/" }
    );

    expect(result).toEqual({
      url: "/app/user/ticket/3",
      isExternal: false,
    });
  });

  it("falls back to default google form when external URL is omitted", () => {
    const result = getTicketRatingLink({ id: 3 }, { baseUrl: "/app/" });

    expect(result.isExternal).toBe(true);
    expect(result.url).toContain("docs.google.com/forms");
    expect(result.url).toContain("ticketId=3");
  });

  it("returns external form URL with ticketId query when configured", () => {
    const result = getTicketRatingLink(
      { id: 3 },
      {
        externalFormUrl: "https://forms.example.com/rating",
        baseUrl: "/app/",
      }
    );

    expect(result.isExternal).toBe(true);
    expect(result.url).toContain("https://forms.example.com/rating");
    expect(result.url).toContain("ticketId=3");
  });

  it("fills template placeholders when configured as URL template", () => {
    const result = getTicketRatingLink(
      {
        id: 7,
        title: "Network issue",
        room: { roomNumber: "1210", floor: 12 },
      },
      {
        externalFormUrl:
          "https://forms.example.com/rating?ticket={{ticketId}}&title={{ticketTitle}}&room={{roomNumber}}",
      }
    );

    expect(result).toEqual({
      url: "https://forms.example.com/rating?ticket=7&title=Network%20issue&room=1210",
      isExternal: true,
    });
  });
});
