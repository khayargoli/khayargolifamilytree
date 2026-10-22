import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

describe("environment configuration", () => {
  it("accepts a configured PostgreSQL connection", () => {
    expect(
      parseEnv({
        DATABASE_URL: "postgresql://localhost/family-tree",
        NODE_ENV: "test",
      }),
    ).toEqual({
      DATABASE_URL: "postgresql://localhost/family-tree",
      NODE_ENV: "test",
    });
  });

  it("rejects a missing database connection", () => {
    expect(() => parseEnv({ NODE_ENV: "test" })).toThrow();
  });
});
