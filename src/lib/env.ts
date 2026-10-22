import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const parseEnv = (input: NodeJS.ProcessEnv) =>
  envSchema.parse({
    DATABASE_URL: input.DATABASE_URL,
    NODE_ENV: input.NODE_ENV,
  });
