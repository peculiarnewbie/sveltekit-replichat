<script lang="ts">
	import "../../app.css";
	import { Replicache, dropAllDatabases, type WriteTransaction } from "replicache";
	import { env } from "$env/dynamic/public";
	import { onMount } from "svelte";
	import type { Message, MessageWithID } from "$lib/types";
	import { nanoid } from "nanoid";
	import { PUBLIC_SOKETI_PUSHER_HOST, PUBLIC_SOKETI_PUSHER_KEY } from "$env/static/public";
	import Pusher from "pusher-js";
	import Cookies from "js-cookie";
	import { goto } from "$app/navigation";

	let rep: Replicache;
	let pusher: Pusher;
	let name = "dbName";
	let sharedList = [] as [string, Message][];

	let userValue = "";
	let messageValue = "";
	let clearModal = false;

	let chatWindow: HTMLElement;

	function getCookie(cname: string) {
		let name = cname + "=";
		let decodedCookie = decodeURIComponent(document.cookie);
		let ca = decodedCookie.split(";");
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == " ") {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	const submitMessage = (e: SubmitEvent) => {
		e.preventDefault();
		// console.log("message button");

		const last = sharedList.length && sharedList[sharedList.length - 1][1];
		const order = (last?.order ?? 0) + 1;

		rep.mutate.createMessage({
			id: nanoid(),
			from: userValue,
			content: messageValue,
			order: order
		});
		messageValue = "";
		setTimeout(() => {
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}, 0);
	};

	const clearAll = () => {
		/*
		sharedList.forEach((message) => {
			rep.mutate.deleteMessage({ id: message[0] });
		});
		*/
		console.log("clearing");
		rep.mutate.deleteMessage();
		clearModal = false;
	};

	onMount(() => {
		let nameCookie = getCookie("chatName");
		if (!nameCookie) {
			goto("/");
			return;
		}
		userValue = getCookie("chatName");

		if (!rep) {
			console.log("build rep client");
			let userId = Cookies.get("userId");
			if (!userId) {
				userId = nanoid();
				Cookies.set("userId", userId);
			}
			rep = new Replicache({
				name: "chat-user-id",
				licenseKey: env.PUBLIC_REPLICACHE_LICENSE_KEY ?? "empty",
				pushURL: "/api/replicache/test-push",
				pullURL: "/api/replicache/test-pull",
				mutators: {
					async deleteMessage(tx: WriteTransaction) {
						let tasks: Promise<boolean>[] = [];
						sharedList.forEach(([id]) => {
							// ("deleting", id);
							tasks.push(tx.del(id));
						});
						const res = await Promise.all(tasks);
						console.log("deleted: ", res);
					},
					async createMessage(tx: WriteTransaction, { id, from, content, order }: MessageWithID) {
						console.log("creating message", id);
						await tx.put(`message/${id}`, {
							from,
							content,
							order
						});
						// console.log("message put");
					}
				}
			});

			if (rep) {
				name = "Replichat, realtime local-first chat app demo";

				rep.subscribe(
					async (tx) =>
						(await tx.scan({ prefix: "message/" }).entries().toArray()) as [string, Message][],
					{
						onData: (list) => {
							const isAtBottom =
								chatWindow.scrollTop > chatWindow.scrollHeight - chatWindow.clientHeight - 200
									? true
									: false;
							if (list.length < 1) {
								sharedList = [];
							} else {
								list.sort(([, { order: a }], [, { order: b }]) => a - b);
								sharedList = list;
							}
							if (isAtBottom) {
								setTimeout(() => {
									chatWindow.scrollTop = chatWindow.scrollHeight;
								}, 0);
							}
						}
					}
				);

				console.log("listening");

				pusher = new Pusher(PUBLIC_SOKETI_PUSHER_KEY, {
					wsHost: PUBLIC_SOKETI_PUSHER_HOST,
					cluster: "Sveltekit-Replichat",
					forceTLS: true,
					disableStats: true,
					enabledTransports: ["ws", "wss"]
				});
				const channel = pusher.subscribe("chat");
				channel.bind("poke", () => {
					console.log("got poked");
					rep.pull();
				});

				setTimeout(() => {
					chatWindow.scrollTop = chatWindow.scrollHeight;
				}, 100);
			}
			return () => {
				rep.close();
				pusher.disconnect();
			};
		}
	});
</script>

<div class="flex w-screen flex-col items-center justify-center gap-2 p-4 text-slate-200">
	{name}
	<div class="p-1"></div>
	<div bind:this={chatWindow} class="h-[800px] w-96 overflow-y-scroll rounded-lg bg-slate-800">
		<div class="flex w-full flex-col gap-4 p-4">
			{#each sharedList as [item, message]}
				<div class={` w-64  ${userValue == message.from ? " self-end" : "self-start"}`}>
					<p class="text-sm">{message.from}</p>
					<p class="rounded-md bg-slate-600 p-2">{message.content}</p>
				</div>
			{/each}
		</div>
	</div>
	<form on:submit={submitMessage} class="flex gap-3">
		<input class="w-80 rounded-md p-2 text-slate-800" type="text" bind:value={messageValue} />

		<button>Send</button>
	</form>
	<button
		on:click={() => {
			clearModal = true;
		}}>clear</button
	>
	{#if clearModal}
		<div class="fixed flex flex-col justify-center gap-2 rounded-lg bg-slate-900 px-24 py-8">
			<p>Clear all messages for all users?</p>
			<div class="flex justify-center gap-4">
				<button
					on:click={() => {
						clearModal = false;
					}}
					class="w-24 rounded-md bg-slate-500 p-2">Cancel</button
				>
				<button on:click={clearAll} class="w-24 rounded-md bg-red-700 p-2">Yes</button>
			</div>
		</div>
	{/if}
</div>
