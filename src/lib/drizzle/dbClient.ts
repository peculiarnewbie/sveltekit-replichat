import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { env } from "$env/dynamic/private";

export const client = createClient({
	url: env.TURSO_DB_URL as string,
	authToken: env.TURSO_DB_AUTH_TOKEN as string
});

export const db = drizzle(client, { schema });

export const serverId = 1;
