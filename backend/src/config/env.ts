import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
    OLLAMA_HOST: z.string().url().default("http://localhost:11434"),
    OLLAMA_MODEL: z.string().min(1).default("llama3.1:8b"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    CHAT_PROVIDER: z.enum(["ollama", "anthropic"]).default("ollama"),
    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().default("claude-3-5-haiku-latest"),
  })
  .superRefine((value, ctx) => {
    if (value.CHAT_PROVIDER === "anthropic" && !value.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ANTHROPIC_API_KEY"],
        message: "ANTHROPIC_API_KEY is required when CHAT_PROVIDER is 'anthropic'",
      });
    }
  });

export const env = envSchema.parse(process.env);
