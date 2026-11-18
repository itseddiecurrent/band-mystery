# Web implementation plan

## GitHub Pages deployment

Publish the game as a static site. GitHub Pages serves the same HTML, CSS, JavaScript, and images to every player. Each browser runs the game and saves its own progress locally. For this repository, the default project URL would be `https://itseddiecurrent.github.io/band-mystery/` once Pages is enabled. Keep code and asset URLs relative so they resolve under `/band-mystery/` as well as on `localhost`. [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## Session lifecycle

| Player action | Expected behavior |
| --- | --- |
| Opens the public game link | The page generates a UUID with `crypto.randomUUID()` and adds `?session_id=<uuid>` to the address using `history.replaceState()`. The page stays on the title screen. |
| Plays or refreshes in the same tab | The tab keeps its UUID. Progress, clues, choices, and play history are available through Continue after a refresh. |
| Opens the public link in a second tab, browser, or device | The new tab gets a fresh UUID and a clean game. Each tab writes to its own storage. |
| Opens a copied session URL in a fresh tab or browser | Without a matching local session record, the page replaces the supplied ID with a new UUID and starts fresh. Sharing the link carries no progress. |
| Confirms New Game | Replace the saved playthrough while keeping the tab's session ID. |
| Confirms Exit | Remove the session record and `session_id` from the URL, then return to the title screen. Starting again creates a new UUID. |
| Closes the tab or window | A fresh visit starts over. Browser features such as Reopen Closed Tab and session restore can bring the original page session back. Exit explicitly clears its progress before closing. |

The browser partitions `sessionStorage` by origin and tab. That partition isolates one player's state from another's, even if they open the same URL. A browser's Duplicate Tab command can copy the original tab's ID and progress as a snapshot. The two tabs then save independently. Use `rel="noopener"` on any game links that open a new tab to avoid copying storage through an opener. [MDN on `sessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)

## Implementation

1. At startup in `src/main.mjs`, read a single app-specific record from `sessionStorage`, for example `band-mystery.web-session.v1`. Store a UUID and the versioned game state together. An initialized session may have a `null` game state until New Game is selected.
2. Resume only when the URL's `session_id` matches the UUID in the tab's valid record. For a missing or unmatched ID, initialize a new record and rewrite the current URL. Use `URL` and `searchParams.set()` to preserve the project path, unrelated query parameters, and any hash. Use HTTPS in production and `localhost` for local testing. [MDN on `crypto.randomUUID()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
3. Reuse `parseSave()` and the existing save, Continue, New Game, and Exit paths. Keep the current game state structure, including rewind checkpoints and play history. On rollout, migrate a valid legacy save under `band-mystery.opening.v1` from the same tab if no new session record exists. Remove the legacy key after migration succeeds.
4. Keep the UUID, state, and history in the browser. Treat `session_id` as a public identifier. If storage is unavailable or full, continue in memory and show that refresh may lose progress. Let the browser handle the page session lifecycle so a refresh does not accidentally clear it.

## Acceptance checks

- Open the published project URL in two independent browser sessions. Confirm distinct UUIDs, then play in both and verify that progress and discovered clues remain independent.
- Refresh one tab and verify that Continue restores its exact dialogue line, clues, and history under the same UUID.
- Paste a session URL into a fresh tab and verify that it receives a fresh UUID and starts clean. Duplicate a tab through the browser and verify that later play in each tab saves independently.
- Confirm New Game resets progress. Confirm Exit clears the tab's session and that starting again generates a new ID. Verify that an ordinary close and fresh visit start clean.
- Verify that the game and its assets load at both `http://localhost:8000/` and the deployed `/band-mystery/` URL with `session_id` present.
