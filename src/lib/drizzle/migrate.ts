import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { env } from "$env/dynamic/private";

export const client = createClient({
	url: env.TURSO_DB_URL as string,
	authToken: env.TURSO_DB_AUTH_TOKEN as string
});

export const db = drizzle(client);

async function main() {
	try {
		await migrate(db, {
			migrationsFolder: "src/lib/drizzle/migrations"
		});
		console.log("why are you migrating buddy");
		process.exit(0);
	} catch (error) {
		console.error("Error performing migration: ", error);
		process.exit(1);
	}
}

main();
