# Lessons Learned

## 2026-02-22

- Pattern: if a wallet label depends on primary name, demo controls must make the no-primary state explicit and easy to test.
- Rule: always include a direct way to clear primary name and verify that fallback label behavior is visible without extra manual steps.
- Pattern: display formatting details matter for trust in wallet UI mocks (name suffixes and address truncation shape).
- Rule: match exact display spec for labels: no forced `.sui` suffix in UI text and address fallback must use the agreed `0x12345...678901` style.
- Pattern: wallet session lifecycle expectations include refresh persistence and explicit teardown behavior.
- Rule: when implementing connect/disconnect demos, persist connected session state on load/refresh and guarantee disconnect removes all session storage.
- Pattern: visual parity requests often target specific hover metrics, not just "similar" styling.
- Rule: when matching hover effects between controls, copy the same hover border and glow values exactly unless told to intentionally diverge.
- Pattern: state-specific overrides can silently cancel global style fixes.
- Rule: after any style parity change, inspect connected/disconnected selectors for overrides that negate the intended effect in the active state.
- Pattern: role swap requests can break interaction flows if handlers are reused without checking disconnected/connected branches.
- Rule: for button responsibility swaps, update both click handlers and UI labels together, then verify both connected and disconnected paths still work.
- Pattern: moving UI mount points can introduce runtime regressions from stale variables in surrounding render paths.
- Rule: after relocating a component mount (like dropdown root), re-run a pass for dependent render vars and ensure both placement and state-driven icon logic still resolve.
- Pattern: visual state must follow wallet identity state, not a single static hover style.
- Rule: when a button reflects primary-name status, tie hover/glow classes to that status in render logic and test both branches.
- Pattern: copy UX requests often require both interaction simplification and explicit transient feedback timing.
- Rule: for copy actions in dropdowns, make the primary displayed value directly copyable and provide a timed success banner with deterministic duration.
- Pattern: users may want copy confirmation to reuse the same component surface instead of adding a second feedback element.
- Rule: default interactive rows to baseline menu styling, then apply temporary success styling/text on the same row for copy confirmation.
- Pattern: success feedback in button-like rows should be centered when it replaces original content.
- Rule: when a transient success label replaces row content, center both layout and text for the feedback state.
- Pattern: color-consistency requests may require reusing exact RGBA values across separate components.
- Rule: when asked to match a shade, copy the same color tokens/values from the reference state (not approximate variants) for all targeted hover states.
- Pattern: destructive actions need distinct baseline styling, not only hover emphasis.
- Rule: for destructive menu actions, define a red default background/border and a stronger red hover state that overrides generic hover colors.
- Pattern: wallet-modal compatibility still depends on wallet-standard runtimes that may internally use JSON-RPC today.
- Rule: keep wallet connection plumbing on `SuiWalletKit`, but avoid introducing new direct JSON-RPC calls in app-level read paths.

## 2026-02-23

- Pattern: Sui JSON-RPC deprecation means new frontend read paths should avoid adding fresh JSON-RPC dependencies.
- Rule: default new wallet UI reads (balances/profile metadata) to Sui GraphQL, and only keep JSON-RPC where third-party wallet runtime internals still require it.
- Pattern: inconsistent transport naming creates avoidable confusion during implementation decisions.
- Rule: always use the explicit term `GraphQL` in code/docs/status updates unless a specific product name says otherwise.

## 2026-02-24

- Pattern: multichain wallet providers can expose non-Sui default connect flows unless Sui-scoped providers and chain hints are explicitly preferred.
- Rule: for Sui-only UX, never rely on wallet-name-only capability checks for multichain wallets (e.g., Backpack/Phantom); require Sui signals or route through `*.sui` providers and attempt connect with `sui:${network}` hints first.
