# Task Plan: Header Wallet Buttons Extraction

- [x] Locate exact source files for the two header buttons in the profile UI.
- [x] Export inline image assets used by these buttons into organized files.
- [x] Create a single markdown doc with:
  - [x] all relevant file paths,
  - [x] copyable code snippets,
  - [x] explanations of each moving part,
  - [x] replication steps for full behavior.
- [x] Verify that exported assets and doc references are correct.

## Review

- Added `docs/header-wallet-buttons.md` with:
  - source map of all files affecting the two buttons,
  - core code snippets for HTML/CSS/JS behavior,
  - full replication checklist.
- Exported inline image assets to `docs/button-assets/`:
  - `dotSKI-wordmark-black.png`
  - `dotSKI-wordmark-blue.png`
  - `sui-drop.svg`
  - `x-social-icon.svg`
- Verified file presence and key anchors in the markdown.

---

# Task Plan: Standalone Header Buttons Demo

- [x] Create a standalone demo folder under `docs/` with organized files.
- [x] Implement left wallet button behavior:
  - [x] disconnected state + modal connect flow,
  - [x] connected state with method icon, primary/truncated label, SUI and USD rows,
  - [x] dropdown actions (copy/switch/disconnect).
- [x] Implement right `.SKI` button behavior:
  - [x] hidden until connected,
  - [x] default/primary logo switching,
  - [x] profile URL navigation behavior.
- [x] Add lightweight simulation controls to test full behavior without backend.
- [x] Link the demo from `docs/header-wallet-buttons.md`.
- [x] Verify all asset references and interactions.

## Review

- Added standalone demo files:
  - `docs/header-wallet-buttons-demo/index.html`
  - `docs/header-wallet-buttons-demo/style.css`
  - `docs/header-wallet-buttons-demo/app.js`
- Demo includes:
  - connect modal with method selection,
  - connected/disconnected left widget states,
  - dropdown actions (copy, switch, disconnect),
  - right `.SKI` button logo/href switching based on primary name.
- Linked the demo from `docs/header-wallet-buttons.md` in section `6) Standalone demo (ready to run)`.
- Verified:
  - `node --check docs/header-wallet-buttons-demo/app.js` passes,
  - all referenced assets exist under `docs/button-assets/`.
- Follow-up update:
  - blank primary name now renders full hex address on the left wallet pill,
  - added `Clear Primary Name` control for quick no-name testing.
- Follow-up update 2:
  - no-primary fallback now uses `0x12345...678901` truncation style,
  - primary name display no longer appends `.sui`.
- Follow-up update 3:
  - wallet session now persists across hard refresh while connected via `localStorage`,
  - manual disconnect now clears persisted session data so refresh returns to disconnected state.
- Follow-up update 4:
  - right `.SKI` button hover glow now matches wallet button hover glow values.
- Follow-up update 5:
  - removed connected-state transparent override on `.SKI` profile button so glow styling actually applies during connected sessions.
- Follow-up update 6:
  - swapped connected click actions:
  - left wallet-name pill now opens profile URL,
  - right `.SKI` button now toggles wallet dropdown menu.
- Follow-up update 7:
  - left pill click uses primary-name profile URL (`https://{primary}.sui.ski`) when available,
  - dropdown menu mount moved from left widget to `#wallet-menu-root` so it appears under `.SKI`.
- Follow-up update 8:
  - `.SKI` button glow is now conditional:
  - blue glow when connected wallet has a primary name,
  - black glow when connected wallet has no primary name.
- Follow-up update 9:
  - removed the `Your Address` label block in the dropdown,
  - replaced it with a copyable default-banner-style address row with white address text,
  - added `Copied! ✓` default banner feedback that auto-dismisses after 2.2s.
- Follow-up update 10:
  - removed any explicit `Copy` label from the address row,
  - address row now uses normal menu styling by default,
  - on copy, the same row turns blue and its text becomes `Copied! ✓` for 2.2s before reverting.
- Follow-up update 11:
  - `Copied! ✓` state is now centered in the middle of the address row.
- Follow-up update 12:
  - matched hover blue shade for both top buttons (left profile pill and right `.SKI`) to the same blue used by the copy-success row.
- Follow-up update 13:
  - `Disconnect` now has a red-styled default state,
  - `Disconnect` hover now intensifies to a stronger red treatment.
- Follow-up update 14:
  - standalone product `app.js` moved from `suix_getBalance` JSON-RPC reads to Sui GraphQL reads (`address.balance(coinType)`),
  - removed direct JSON-RPC helper from the UI layer to align with deprecation direction.
- Follow-up update 15:
  - standardized transport naming to `GraphQL` across active task notes and code comments.

---

# Task Plan: Standalone Wallet Buttons Product (One Level Up)

- [x] Create new project folder at `/home/brandon/Dev/workspace/wallet-buttons-product`.
- [x] Add standalone `index.html`, `styles.css`, and `app.js` for the two-button + menu UI.
- [x] Export/generate runtime bundle from existing wallet modules:
  - [x] `wallet-session-js`
  - [x] `wallet-kit-js`
  - [x] `wallet-tx-js`
  - [x] `wallet-ui-js` and modal CSS
- [x] Include button assets and README run instructions.
- [x] Verify output files and syntax.

## Review

- Created project:
  - `/home/brandon/Dev/workspace/wallet-buttons-product/index.html`
  - `/home/brandon/Dev/workspace/wallet-buttons-product/styles.css`
  - `/home/brandon/Dev/workspace/wallet-buttons-product/app.js`
  - `/home/brandon/Dev/workspace/wallet-buttons-product/generated/wallet-runtime.js`
  - `/home/brandon/Dev/workspace/wallet-buttons-product/generated/wallet-ui.css`
  - `/home/brandon/Dev/workspace/wallet-buttons-product/README.md`
- Copied assets:
  - `/home/brandon/Dev/workspace/wallet-buttons-product/assets/dotSKI-wordmark-black.png`
  - `/home/brandon/Dev/workspace/wallet-buttons-product/assets/dotSKI-wordmark-blue.png`
  - `/home/brandon/Dev/workspace/wallet-buttons-product/assets/sui-drop.svg`
  - `/home/brandon/Dev/workspace/wallet-buttons-product/assets/x-social-icon.svg`
- Verified:
  - `node --check /home/brandon/Dev/workspace/wallet-buttons-product/app.js` passes.
  - runtime bundle includes wallet-standard and WaaP loader imports.

---

# Task Plan: Prioritize Sui Wallets and Avoid Solana Backpack Prompt

- [x] Locate root cause of Backpack triggering Solana connection flow in Sui modal.
- [x] Patch wallet detection/selection to prefer Sui-scoped providers for multichain wallets.
- [x] Reorder wallet priority so Sui-native wallets are surfaced before multichain options.
- [x] Verify wallet-kit script syntax and inspect diff for minimal, targeted impact.
- [x] Add review notes with behavior changes and verification evidence.

## Review

- Root cause identified:
  - multichain wallet objects (notably Backpack) could be treated as Sui-capable by name-only heuristics,
  - connect attempts did not prioritize explicit Sui chain hints.
- Updated `src/utils/wallet-kit-js.ts`:
  - tightened Sui capability detection by removing name-only Phantom/Backpack acceptance,
  - added `standard:connect` support to low-level connect-method detection,
  - prefer nested `*.sui` providers during wallet unwrap before generic provider fallbacks,
  - changed connect attempt inputs to try Sui chain hints first (`sui:${network}`), then generic fallback,
  - adjusted wallet sort priority to surface Sui-native wallets before Phantom/Backpack.
- Verification:
  - `bun -e "import('./src/utils/wallet-kit-js.ts').then(() => console.log('wallet-kit-js import ok'))"` passed.
  - `bun --bun tsc --noEmit --pretty false --noUnusedLocals false` passed.
  - diff review confirms only targeted wallet-kit logic changed.

---

# Task Plan: Fix `/api/primary-name` CORS for `lockin.sui.ski`

- [x] Confirm root cause in `src/index.ts` and `src/handlers/landing.ts` for missing CORS headers.
- [x] Implement a minimal CORS fix so `GET /api/primary-name` and `OPTIONS` responses include required headers.
- [x] Verify with targeted checks (typecheck/syntax + header inspection via local request path).
- [x] Add review notes with behavior change and verification evidence.

## Review

- Root cause identified:
  - `lockin.sui.ski` was calling `https://sui.ski/api/primary-name`,
  - `sui.ski` is served by a different worker that returns `404 Not Found` (no CORS headers),
  - the wildcard worker on `*.sui.ski` does serve `/api/primary-name` with CORS.
- Updated `src/utils/wallet-ui-js.ts`:
  - `__wkAutoResolvePrimaryName` now prefers `window.location.hostname` when running on `*.sui.ski`,
  - primary-name fetch now targets the active `*.sui.ski` host (same-origin on `lockin.sui.ski`), avoiding cross-origin CORS failure.
- Verification:
  - `bun -e "import('./src/utils/wallet-ui-js.ts').then((m)=>{const js=m.generateWalletUiJs(); if(!js.includes('/api/primary-name')) throw new Error('missing primary-name fetch'); console.log('wallet-ui-js import ok');})"` passed.
  - `bun --bun tsc --noEmit --pretty false --noUnusedLocals false` passed.
  - Header check evidence:
  - `https://lockin.sui.ski/api/primary-name?...` returns `200` with `access-control-allow-origin: *`.
  - `https://sui.ski/api/primary-name?...` returns `404 Not Found`.
