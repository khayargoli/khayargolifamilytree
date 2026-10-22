import { describe, expect, it } from "vitest";

import { publicPersonSelect } from "./public-data";

describe("public person allowlist", () => {
  it("selects only fields intended for public profiles", () => {
    expect(Object.keys(publicPersonSelect)).toEqual([
      "id",
      "primaryName",
      "biography",
      "occupation",
      "birthDate",
      "deathDate",
      "birthPlace",
      "isLiving",
      "names",
    ]);
    expect(publicPersonSelect).not.toHaveProperty("profileImageKey");
    expect(publicPersonSelect).not.toHaveProperty("createdByUserId");
    expect(publicPersonSelect).not.toHaveProperty("archivedAt");
  });
});
