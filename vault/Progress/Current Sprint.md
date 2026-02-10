---
tags: [progress, sprint, active]
---

# Current Sprint

Active work items and recent focus areas as of 2026-02-08.

## Recent Focus

The last 5 commits show focus on:

1. **Marketplace polish** - Caching, sold price display, activity normalization
2. **Mobile wallet stability** - Phantom race conditions, in-app browser detection
3. **Performance** - 60s TTL caching on indexer API responses

## Active Status

| Area | Status | Notes |
|------|--------|-------|
| Build | Passing | `bun run typecheck` clean |
| Tests | 30/30 | All passing |
| Lint | Clean | Zero warnings |
| Production | Deployed | sui.ski live |

## In Progress

Nothing currently in active development (clean git status).

## Recently Completed

- [x] Cache marketplace API responses (60s TTL)
- [x] NFT sold price display and accept_bid tracking
- [x] Color-coded NFT tags
- [x] Phantom wallet double-connect fix (#12)
- [x] In-app browser detection narrowing
- [x] GitHub Actions CI/CD pipeline

## Up Next

See [[Backlog]] for pending items.

## Related
- [[Changelog]]
- [[Backlog]]
