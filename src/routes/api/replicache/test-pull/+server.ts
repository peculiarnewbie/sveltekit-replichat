import { json, type RequestEvent } from "@sveltejs/kit";
import { db, serverId } from "$lib/drizzle/dbClient";
import type { PatchOperation, PullRequestV1, PullResponseV1 } from "replicache";
import { replicache_client, replicache_server, test_messages } from "$lib/drizzle/schema";
import { and, eq, gt } from "drizzle-orm";

export async function POST({ request }: RequestEvent) {
	const pull: PullRequestV1 = await request.json();

	console.log(`Processing pull`, JSON.stringify(pull));

	const groupId = pull.clientGroupID;
	const fromVersion = (pull.cookie ?? 0) as number;
	const t0 = Date.now();

	try {
		const response = await db.transaction(async (tx) => {
			const server = (
				await db
					.select({
						version: replicache_server.version,
						lastDeleted: replicache_server.last_deleted
					})
					.from(replicache_server)
					.where(eq(replicache_server.id, serverId))
			)[0];

			const currentVersion = server.version;
			const lastDeleted = server.lastDeleted ?? 0;

			console.log("from: ", fromVersion, "current: ", currentVersion);

			if (currentVersion) {
				if (fromVersion > currentVersion) {
					throw new Error(
						`fromVersion ${fromVersion} is from the future - aborting. This can happen in development if the server restarts. In that case, clear application data in browser and refresh.`
					);
				}
				/*
				else if (fromVersion == currentVersion) {
					return {
						lastMutationIDChanges: {},
						cookie: currentVersion,
						patch: []
					};
				}
				*/
			}

			const changesRow = await db
				.select({
					id: replicache_client.id,
					lastMutationId: replicache_client.last_mutation_id
				})
				.from(replicache_client)
				.where(
					and(
						eq(replicache_client.client_group_id, groupId),
						gt(replicache_client.version, fromVersion)
					)
				);

			let lastMutationIdChanges:
				| {
						[k: string]: any;
				  }
				| undefined;
			if (changesRow[0]) {
				if (changesRow.length == 1) {
					lastMutationIdChanges = { [changesRow[0].id]: changesRow[0].lastMutationId };
				} else {
					lastMutationIdChanges = Object.fromEntries(
						//@ts-ignore
						changesRow.map((r) => {
							[r.id, r.lastMutationId];
						})
					);
				}
			}

			const changed = await db
				.select()
				.from(test_messages)
				.where(and(gt(test_messages.version, fromVersion), gt(test_messages.version, lastDeleted)));

			console.log("changed: ", changed);

			const patch: PatchOperation[] = [];

			if (lastDeleted > fromVersion) {
				patch.push({
					op: "clear"
				});
			}

			for (const row of changed) {
				patch.push({
					op: "put",
					key: `message/${row.id}`,
					value: {
						from: row.sender,
						content: row.content,
						order: row.order
					}
				});
			}

			console.log("lastMutationIDChanges: ", lastMutationIdChanges);
			console.log("responseCookie: ", currentVersion);

			const body: PullResponseV1 = {
				lastMutationIDChanges: lastMutationIdChanges ?? {},
				cookie: currentVersion,
				patch: patch
			};

			return body;
		});

		return json(response);
	} catch (e) {
		console.error(e);
		return json({ body: JSON.stringify(e) }, { status: 500 });
	} finally {
		console.log("Processed pull in ", Date.now(), t0);
	}
}
