# Private playtest analytics

Run the dashboard from the repository root with Node.js 24:

```sh
node scripts/analytics-dashboard.mjs
```

Open http://127.0.0.1:8787. This is a local dashboard, not a deployed website. It binds only to your computer and reads aggregates from the Supabase `game-stats` project. Its owner token stays in the local server; it is never sent to the dashboard browser or bundled with the game. The game needs only the public collection endpoint in `src/analytics-config.mjs`.

## What is counted

- **Starts:** clicking New Game creates a fresh analytics run. Continue/refresh resumes it. Continuing a save created before analytics was introduced starts tracking from that point, marked `existing-save`; earlier progress cannot be recovered.
- **Estimated players:** a random ID in browser local storage. It cannot identify a person across devices or browser-data resets. No account, name, email, or dialogue transcript is collected.
- **Completion:** a started run reaches any ending, counted once per run. Each distinct ending can still be recorded for the endings breakdown. Future story routes should set `game.progress.endingId` to a stable ending ID when setting `finished = true`; the current ending is `beta-final-silence`.
- **Checkpoints:** scene + dialogue ID (or investigation). Individual dialogue lines are included in periodic progress snapshots, not sent on every advance. Revisited checkpoints count once in reach statistics.
- **Actions:** successful game actions other than dialogue advance/back/rewind, plus rejected accusations. These include investigations, not just branching story choices. Counts are distinct runs, so repeatedly clicking an action does not increase its count.
- **Active time:** visible gameplay, stopping after 90 seconds without keyboard or pointer activity. Finished screens do not add time. This is an estimate, not exact reading time.
- **Last checkpoints:** unfinished runs, using their highest event sequence number so delayed delivery cannot move them backward. “Inactive” means no recorded activity in seven days, not proven abandonment.
- **Filters:** start cohorts over 7/30/90/365 days or all time, and game version. All subsequent events for those runs count, including later completions. Daily chart dates use UTC. The version identifies the build that started a run.

Player sharing is optional via the title-screen checkbox. Localhost gameplay is excluded by default; use `?analytics=on` for an intentional local test or `?analytics=off` to disable a deployed session. Unsent events are kept in session storage, retried with the same event IDs, and capped at 300. Closing the tab can lose unsent events, particularly offline; events older than seven days are discarded. Opting out clears pending events but cannot recall events already delivered.

## Supabase setup and security

The collector is the deployed `game-analytics` Edge Function (`verify_jwt = false` because players do not sign in). It accepts bounded event batches and validates allowed fields, timestamps, UUIDs, and lengths. An atomic database counter limits each salted IP hash to 240 events/minute. The counter stores no raw IP; old buckets are cleaned as requests arrive. This deters basic spam but anonymous client telemetry cannot be made tamper-proof.

`analytics/schema.sql` records the schema deployed to the project's default `postgres` database. Supabase's managed REST API and Edge Function environment use that database; the manually created `bandmystery` database is left untouched. All four `bandmystery_*` tables have RLS enabled with no public read/write access. The ingestion and summary functions run as the invoker and can only be executed by `service_role`, used inside the Edge Function. The service key never goes into client code.

The summary route additionally verifies the owner's token against a SHA-256 hash in `bandmystery_settings`. `.env` contains the token as `ANALYTICS_DASHBOARD_TOKEN`; `.env` and related secret files are ignored by Git. The existing database password is not needed by the game or dashboard. Never publish `.env` or copy the owner token into frontend files.

To rotate the owner token, generate at least 32 random bytes, update `.env`, and replace the matching `dashboard_token_sha256` setting through Supabase administration. Restart the local dashboard afterward. Changing the project URL alone does not redeploy the collector or database schema.

The existing GitHub Pages workflow copies `src/`, so the tracking code is included in the next game deployment. It does not copy the local dashboard or secrets. Analytics cannot observe older deployed builds until they are updated. Change `version` in `src/analytics-config.mjs` for each materially different beta release.

## Version history

The current build tag is `v0`, visible on the title screen and game header. `bandmystery_versions` stores each version, its description, and creation time. The first entry is exactly `beta- single storyline with danzai being the murderer`. Descriptions appear only in the private dashboard; the public game shows just the tag.

For a later release, add its version and description in Supabase, then update `src/analytics-config.mjs` to match:

```sql
insert into public.bandmystery_versions (version, description)
values ('v1', 'Describe the new routes and endings here');
```

Keep old entries so the dashboard can compare releases. A build tag stays attached to its analytics run; continuing a save on a different build begins a new tracked run, marked as an existing save.

## Verification

```sh
node --test
```

Tests cover replay identity, refresh/resume, idle/hidden time, ending deduplication, blocked storage, opt-out, offline retries, queue bounds, and collector validation. Live verification should use an isolated version such as `qa-analytics`, then remove only those test records through administration.
