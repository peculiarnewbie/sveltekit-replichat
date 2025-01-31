# Sveltekit Replichat

example app to try out local-first app using Replicache.
With Sveltekit as the frontend framework, TursoDB and drizzle ORM to manage the database, deployed on Cloudflare Pages, and sockets using Soketi on Cloudflare workers

check the demo [here](https://replichat.peculiarnewbie.com)

> [!WARNING]  
> This demo no longer works. I turned off the durable objects for it

___
somehow this repo occasionally still get stars. I want to call out some things i would've done differently as of early 2025:
- should use durable object's websocket hibernation
- deploy to cloudflare worker with static assets instead of pages
- just use d1
- remove soketi
