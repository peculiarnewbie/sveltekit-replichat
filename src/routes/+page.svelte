<script lang="ts">
	import { onMount } from "svelte";
	import "../app.css";

	let personName: string = "";
	let warning: string = "";

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

	const createRoom = async () => {
		const result = await fetch("../api/createRoom", {
			method: "POST"
		});

		console.log(result);
	};

	const joinRoom = async (e: SubmitEvent) => {
		e.preventDefault();
		if (personName == "Bolt" || personName == "bolt") {
			warning = "No u ain't. Enter a different name :)";
			return;
		} else {
			warning = "";
		}

		document.cookie = `chatName=${personName};`;
		window.location.href = "/chat";
	};

	onMount(() => {
		personName = getCookie("chatName");
	});
</script>

<div class="flex h-screen w-screen flex-col items-center bg-black p-12 text-slate-200">
	<h1 class="text-xl font-semibold">Enter your name</h1>
	<!--
	-->
	<div class="p-2"></div>

	{#if warning != ""}
		<p class=" text-red-400">{warning}</p>
	{/if}
	<form on:submit={joinRoom}>
		<input
			class="rounded-md p-2 text-slate-600"
			type="text"
			name="chatName"
			bind:value={personName}
		/>
		<button class="rounded-md bg-slate-800 px-6 py-2"> Enter </button>
	</form>
</div>
