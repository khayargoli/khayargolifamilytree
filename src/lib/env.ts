import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required").optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  BOOTSTRAP_ADMIN_EMAILS: z.string().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const parseEnv = (input: NodeJS.ProcessEnv) =>
  envSchema.parse({
    DATABASE_URL: input.DATABASE_URL,
    AUTH_SECRET: input.AUTH_SECRET,
    GOOGLE_CLIENT_ID: input.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: input.GOOGLE_CLIENT_SECRET,
    BOOTSTRAP_ADMIN_EMAILS: input.BOOTSTRAP_ADMIN_EMAILS,
    CLOUDINARY_CLOUD_NAME: input.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: input.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: input.CLOUDINARY_API_SECRET,
    NODE_ENV: input.NODE_ENV,
  });
