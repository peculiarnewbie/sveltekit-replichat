import type { Config } from "drizzle-kit";

export default {
	schema: "./src/lib/drizzle/schema.ts",
	out: "./src/lib/drizzle/migrations",
	driver: "turso",
	dbCredentials: {
		url: process.env.TURSO_DB_URL as string,
		authToken: process.env.TURSO_DB_AUTH_TOKEN as string
	}
} satisfies Config;
