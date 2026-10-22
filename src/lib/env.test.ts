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
      AUTH_SECRET: undefined,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      BOOTSTRAP_ADMIN_EMAILS: "",
    });
  });

  it("rejects a missing database connection", () => {
    expect(() => parseEnv({ NODE_ENV: "test" })).toThrow();
  });
});
