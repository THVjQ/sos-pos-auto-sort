# SOS POS — Auto Sort

**Version:** 17.1 · **Site:** app.sospos.com.au

Automatically sorts the **Ticket Storage** board by status priority then ticket number on every page load. No manual dragging needed — the board is always in the right order.

---

## How It Works

On every page load of the Ticket Storage view, the script fetches all tickets via the SOS POS API, sorts them by the priority order below, then sends a batch update to reorder the board.

---

## Status Priority Order

| Priority | Status |
|----------|--------|
| 0 (top) | Pick up ready |
| 1 | Part arrived |
| 2 | Part paid |
| 3 | Part ordered |
| 4 | Part not ordered |
| 5 | Waiting on parts |
| 6 | Waiting on CX |
| 7 | Repairing |
| 8 | No fix - in store |
| 9 | Quote sent |
| 10 | On hold |

Tickets with the same status are sorted by ticket number (ascending).

---

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome
2. Click **Raw** on the `.user.js` file in this repo
3. Tampermonkey will prompt to install — click **Install**
4. Open SOS POS — the board sorts automatically on every load

---

## Notes

- Only runs on the Storage board view — no effect on Today or other views
- Uses your active SOS POS session — no extra API keys needed

---

## Using Multiple Scripts

If you are using several of the THVjQ Tampermonkey scripts, check the **Issues** tab — a multi-script addon with live updates across all scripts is in progress. Leave a comment there and it will be prioritised.
