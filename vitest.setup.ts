import { config } from "dotenv";
import path from "path";

// The dev/start scripts load env via `node --env-file=.env.local`, but Vitest
// does not. Without this, importing any app module that reads `server/_core/env.ts`
// triggers its `process.exit(1)` on failed validation and kills the whole suite
// (see auth.logout.test.ts). Load .env.local first, then fall back to .env.
// Vitest forces NODE_ENV="test", which the app's env schema (development|production)
// rejects. Drop it so .env.local's NODE_ENV=development is applied below.
if (process.env.NODE_ENV === "test") delete process.env.NODE_ENV;

config({ path: path.resolve(import.meta.dirname, ".env.local") });
config({ path: path.resolve(import.meta.dirname, ".env") });
