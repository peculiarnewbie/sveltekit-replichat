import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
	uniqueIndex
} from "drizzle-orm/sqlite-core";

export const replicache_server = sqliteTable("replicache_server", {
	id: integer("id").notNull().primaryKey(),
	version: integer("version"),
	last_deleted: integer("last_deleted")
});

export const replicache_client = sqliteTable("replicache_client", {
	id: text("id").notNull().primaryKey(),
	client_group_id: text("client_group_id").notNull(),
	last_mutation_id: integer("last_mutation_id").notNull(),
	version: integer("version").notNull()
});

export const test_messages = sqliteTable("test_messages", {
	id: text("id").notNull().primaryKey(),
	sender: text("sender").notNull(),
	content: text("content").notNull(),
	order: integer("order").notNull(),
	version: integer("version").notNull()
});

export const analytics = sqliteTable("analytics", {
	id: text("id").notNull().primaryKey(),
	location: text("location").notNull(),
	month: text("month").notNull(),
	qty: integer("qty")
});

export type ReplicacheServer = typeof replicache_server.$inferSelect;

export type ReplicacheClient = typeof replicache_client.$inferSelect;
export type InsertReplicacheClient = typeof replicache_client.$inferInsert;

export type TestMessages = typeof test_messages.$inferSelect;
export type InsertTestMessages = typeof test_messages.$inferInsert;

export type InsertAnalytics = typeof analytics.$inferInsert;
