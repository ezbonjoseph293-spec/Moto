import { config } from "dotenv";

// Vitest doesn't load .env the way Next.js does — load it explicitly so
// integration tests (e.g. tenancy isolation) can reach the real database.
config();
