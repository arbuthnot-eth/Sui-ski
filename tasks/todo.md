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

---

# Task Plan: New Register Page (SuiNS PTB + Sui 2.5.0)

- [x] Add a dedicated root route for register page rendering (`/register`) with name normalization.
- [x] Update register page header controls to match sui.ski top-right wallet + `.SKI` profile buttons.
- [x] Upgrade register page browser SDK imports to `@mysten/sui@2.5.0` paths and keep PTB registration flow.
- [x] Ensure the registration target remains the connected wallet sender address.
- [x] Make discounted pricing display explicit in both SUI and stable terms (NS reduction reflected).
- [x] Verify with typecheck and targeted source checks.

## Review

- Added `/register` route in `src/index.ts`:
  - accepts `?name=...`,
  - sanitizes to lowercase `[a-z0-9-]`,
  - renders `generateRegistrationPage(..., { flow: 'register2' })`,
  - shows a small fallback name form if no valid name is supplied.
- Updated `src/handlers/register2.ts`:
  - switched browser SDK imports to `@mysten/sui@2.5.0` (`jsonRpc` + `transactions` bundles),
  - replaced top-right control mount with the same `wallet-profile-btn + wk-widget` pattern used by sui.ski,
  - mounted shared wallet behavior via `generateSharedWalletMountJs(...)` for profile button href/visibility and primary-name sync,
  - kept PTB registration flow through `/api/register/build-tx` and wallet signing with connected sender address,
  - made price label explicit as stablecoin quote with discount context (e.g., `USDC/yr · 25% NS off`) and coin CTA text.
- Verification:
  - `npx biome check src/handlers/register2.ts src/index.ts` passed.
  - `bun -e "import('./src/handlers/register2.ts').then(()=>console.log('register2 import ok'))"` passed.
  - `bun --bun tsc --noEmit --pretty false --noUnusedLocals false` fails due pre-existing unrelated repo errors in `landing.ts`, `x402-register.ts`, `sui-graphql.ts`, `onchain-activity.ts`, and `transactions.ts`.

---

# Task Plan: Simplify `register2.ts` + Use `.SKI` Package Button

- [x] Replace `src/handlers/register2.ts` with a simpler implementation.
- [x] Use the same package-native `.SKI` button mount (`wallet-ski-btn`) from `sui.ski`.
- [x] Keep exports required by app routes: `generateRegistrationPage`, `handleBuildRegisterTx`, `handleRegistrationSubmission`.

---

# Task Plan: Subdomain Header Cleanup

- [x] Remove the extra far-right profile button from the `*.sui.ski` profile header so the top row only keeps the intended three controls.
- [x] Restyle the left home button to better match the darker inset/glow treatment from the approved reference.
- [x] Verify the touched profile files still parse cleanly and document the current WaaP/package split.

## Review

- Updated `src/handlers/profile.ts`:
  - removed the extra `wallet-profile-btn` from the subdomain/profile header,
  - removed the subdomain-only click/logo sync for that button,
  - kept the shared wallet mount in place for `#ski-profile`, so the wallet pill and package SKI button still render.
- Updated `src/handlers/profile.css.ts`:
  - restyled `.home-btn` with a darker gradient, slightly larger frame, stronger inset border, and a brighter hover glow closer to the approved reference.
  - removed now-unused profile-button CSS selectors for the deleted far-right control.
- Verification:
  - `bun -e "import('./src/handlers/profile.ts').then(()=>console.log('profile import ok'))"` passed.
  - `npx biome check src/handlers/profile.ts src/handlers/profile.css.ts` passed with one pre-existing warning in `src/handlers/profile.ts:11615` (`noUselessEscapeInString`), unrelated to this header change.
- WaaP/package root cause:
  - profile pages already load the published browser bundle from `https://cdn.jsdelivr.net/npm/sui.ski@0.1.77/public/dist/ski.js`,
  - but they still layer local glue on top via `generateSharedWalletMountJs(...)`, `generateWalletSessionJs()`, and custom signing/session code, so the subdomain flow is not purely package-native end to end.
- [x] Verify formatting and module import validity.

## Review

- Replaced the previous large `register2.ts` with a lean implementation:
  - simple register page UI and pricing display,
  - package-native wallet widget markup:
    - `#wk-widget`
    - `#wallet-ski-btn`
    - `#wallet-menu-root`
    - `#ski-modal-root`
  - wallet bridge usage for connect/sign flow.
- Kept server API handlers in the same file for compatibility:
  - `/api/register/build-tx` now builds a straightforward PTB path (`NS swap`, fallback to direct SUI registration),
  - `/api/register/submit` relay logic remains available.
- Verification:
  - `npx biome check src/handlers/register2.ts` passed.
  - `bun -e "import('./src/handlers/register2.ts').then(()=>console.log('register2 import ok'))"` passed.

---

# Task Plan: Profile Page ski.js Alignment

- [x] Compare the profile page header/wallet path against the root `sui.ski` ski.js integration.
- [x] Remove the profile page’s redundant shared wallet mount so ski.js owns the header widget lifecycle directly on profile pages.
- [x] Update the local ski bridge to preserve package-compatible wallet state needed by the profile page.
- [x] Run targeted verification and deploy with `npx wrangler deploy`.

## Review

- Updated `src/handlers/profile.ts`:
  - removed the profile page’s `generateSharedWalletMountJs(...)` mount path,
  - removed the profile page’s unused `generateWalletSessionJs()` injection,
  - moved wallet-connected/disconnected UI refresh onto `window._skiSubscribe(...)`, which now drives the profile page directly from ski.js events.
- Updated `src/utils/ski-embed.ts`:
  - enriched `window._skiConn` so it keeps cached primary-name state from `ski:suins:{address}`,
  - kept transaction/disconnect delegation package-native via ski.js custom events,
  - avoided inferring `session` signer mode from local storage to prevent false positives on normal connected wallets.
- Verification:
  - `bun -e "Promise.all([import('./src/handlers/profile.ts'), import('./src/utils/ski-embed.ts')]).then(()=>console.log('imports ok'))"` passed.
  - `npx biome check src/handlers/profile.ts src/handlers/profile.css.ts src/utils/ski-embed.ts` still reports one pre-existing warning in `src/handlers/profile.ts:11566` (`noUselessEscapeInString`), unrelated to this migration.
- Deploy:
  - `npx wrangler deploy` succeeded.
  - Worker version: `ecd94523-2a66-4fa1-afaf-84e794083813`.

---

# Task Plan: Profile ski.js Restore + Dot Fix

- [x] Seed ski.js preload keys from the server session on profile pages so cross-subdomain restore works again.
- [x] Ensure `#ski-dot` has the package baseline class in server-rendered markup so it never renders with raw gray browser chrome.
- [x] Verify and deploy.

## Review

- Updated `src/handlers/profile.ts`:
  - seeds `ski:last-address`, `ski:last-wallet`, and `sui_wallet_name` from the server session before ski.js boot,
  - renders `#ski-dot` with the package baseline classes in the initial markup,
  - subscribes profile wallet state directly from `window._skiSubscribe(...)` and keeps chrome updates local to ski.js state.
- Updated `src/utils/ski-embed.ts`:
  - pins the CDN version to `sui.ski@0.1.77`,
  - keeps a thin event bridge that reads cached primary names from `ski:suins:{address}` and exposes package-compatible `window._skiConn`.
- Verification:
  - `bun -e "Promise.all([import('./src/handlers/profile.ts'), import('./src/utils/ski-embed.ts')]).then(()=>console.log('imports ok'))"` passed.
  - `npx biome check src/handlers/profile.ts src/handlers/profile.css.ts src/utils/ski-embed.ts` passed except for one pre-existing warning in `src/handlers/profile.ts` (`noUselessEscapeInString`).
- Deploy:
  - not rerun in this pass.

---

# Task Plan: Bun-Only Lockfile Cleanup

- [x] Replace repo-level npm install/deploy entry points with Bun equivalents where this project owns the workflow.
- [x] Update Docker/build configs that currently copy or depend on `package-lock.json`.
- [x] Remove `package-lock.json` and verify the Bun-first workflow still passes targeted checks.

## Review

- Updated root workflow/config paths:
  - `.github/workflows/deploy.yml` now uses `oven-sh/setup-bun`, `bun install --frozen-lockfile`, and keeps deployment on `npx wrangler deploy`,
  - `package.json` keeps the deploy script on `npx wrangler deploy`,
  - `contribute/wrangler.toml` now installs with Bun during build,
  - `scripts/full-deploy.sh` now runs a single `npx wrangler deploy` instead of npm + Bun back to back.
- Updated proxy Bun ownership:
  - added `proxy/bun.lock`,
  - removed `proxy/package-lock.json`,
  - updated `proxy/Dockerfile` to use `oven/bun:1-slim`, `bun install --frozen-lockfile --production`, and `bun run index.ts`,
  - updated `proxy/README.md` local/render instructions to Bun commands.
- Removed root npm lockfile:
  - deleted `package-lock.json`,
  - kept `bun.lock` as the repo lockfile for the root package.
- Verification:
  - `bun install --frozen-lockfile` passed at repo root,
  - `bun install --frozen-lockfile` passed in `proxy/`,
  - `npx wrangler deploy --help` is the intended deploy path for this repo,
  - `npx wrangler deploy --help` in this environment is still subject to the local `snap-confine` Wrangler packaging issue, so deploy-script verification remains partially environment-limited.

---

# Task Plan: Fix Uncommitted Transport Compile Breakages

- [x] Align uncommitted Sui transport changes with the current `@mysten/sui` v2.6 type shapes.
- [x] Restore a passing repo typecheck for the touched landing/x402/GraphQL/MCP paths.
- [x] Verify imports and lint on the files fixed in this pass.

## Review

- Updated `src/handlers/landing.ts`:
  - switched gRPC owned-object pagination from `nextCursor` to the current `cursor`/`hasNextPage` shape.
- Updated `src/utils/sui-graphql.ts`:
  - added a shared transaction-result unwrap helper for the new `TransactionResult` union,
  - switched GraphQL execute/get helpers to request the includes they actually read,
  - fixed BCS serialization to pass raw bytes,
  - typed JSON-RPC event filters as `SuiEventFilter`.
- Updated `src/handlers/x402-register.ts` and `src/utils/transactions.ts`:
  - migrated GraphQL transaction handling off the removed `.transaction` property,
  - read created object IDs from `effects.changedObjects` + `objectTypes`,
  - read events from the typed `events` array.
- Updated `src/utils/onchain-activity.ts` and `src/handlers/mcp.ts`:
  - fixed Promise tuple inference in collection event fetching,
  - narrowed the MCP handler cast through `unknown` to tolerate the duplicated SDK dependency used by `agents/mcp`.
- Verification:
  - `bun --bun tsc --noEmit --pretty false --noUnusedLocals false` passed.
  - `bun -e "Promise.all([import('./src/utils/sui-graphql.ts'), import('./src/handlers/x402-register.ts'), import('./src/handlers/landing.ts')]).then(()=>console.log('imports ok'))"` passed.
  - `npx biome check --write src/handlers/landing.ts src/utils/sui-graphql.ts src/utils/onchain-activity.ts src/utils/transactions.ts src/handlers/x402-register.ts src/handlers/mcp.ts` passed.
