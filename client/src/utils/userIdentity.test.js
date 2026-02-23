import { describe, expect, it } from "vitest";
import { getUserDisplayName, getUserInitials } from "./userIdentity";

describe("userIdentity utils", () => {
  it("prefers explicit name for display and initials", () => {
    const user = { name: "Muna Lanke", email: "muna.lanke@gmail.com" };

    expect(getUserDisplayName(user, "User")).toBe("Muna Lanke");
    expect(getUserInitials(user, "U")).toBe("ML");
  });

  it("falls back to username when name is missing", () => {
    const user = { username: "support team" };

    expect(getUserDisplayName(user, "User")).toBe("support team");
    expect(getUserInitials(user, "U")).toBe("ST");
  });

  it("derives name and initials from email local part", () => {
    const user = { email: "chaisri.pollawat@gmail.com" };

    expect(getUserDisplayName(user, "User")).toBe("Chaisri Pollawat");
    expect(getUserInitials(user, "U")).toBe("CP");
  });

  it("uses first two letters for a single token", () => {
    const user = { name: "Admin" };

    expect(getUserInitials(user, "U")).toBe("AD");
  });

  it("returns fallback when no identity fields exist", () => {
    expect(getUserDisplayName({}, "User")).toBe("User");
    expect(getUserInitials({}, "U")).toBe("U");
  });
});
