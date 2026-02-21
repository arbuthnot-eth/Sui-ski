import { BLACK_DOTSKI_WORDMARK_DATA_URL } from './wallet-brand'

interface WalletUiConfig {
	showPrimaryName?: boolean
	onConnect?: string
	onDisconnect?: string
	widgetBrandLogoSrc?: string
	keepBrandLogoWhenConnected?: boolean
	primaryProfileHost?: string
}


export function generateWalletUiCss(): string {
	return `
html.wk-modal-open, body.wk-modal-open { overflow: hidden !important; }
.wk-modal-overlay {
	display: none;
	position: fixed;
	inset: 0;
	background:
		radial-gradient(circle at 20% 18%, rgba(140,180,220,0.06), transparent 38%),
		radial-gradient(circle at 78% 12%, rgba(160,200,240,0.05), transparent 34%),
		radial-gradient(circle at 52% 74%, rgba(140,180,220,0.04), transparent 44%),
		rgba(4,8,16,0.82);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	z-index: 13000;
	align-items: center;
	justify-content: center;
	padding: 10px;
	overflow: hidden;
}
.wk-modal-overlay.open { display: flex; }
.wk-modal {
	background: linear-gradient(180deg, #141820 0%, #0e1118 50%, #101520 100%);
	border: 1px solid rgba(160,200,240,0.12);
	border-radius: 12px;
	max-width: 620px;
	width: 100%;
	overflow: hidden;
	position: relative;
	box-shadow: 0 28px 84px rgba(2,6,23,0.82), 0 0 38px rgba(180,210,240,0.1), inset 0 1px 0 rgba(200,220,255,0.06);
}
.wk-modal::before {
	content: '';
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
	background:
		radial-gradient(circle at 22% 12%, rgba(180,210,240,0.14), transparent 36%),
		radial-gradient(circle at 82% 4%, rgba(200,220,245,0.1), transparent 32%),
		radial-gradient(circle at 52% 118%, rgba(160,200,235,0.08), transparent 42%);
}
.wk-modal::after {
	content: '';
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
	opacity: 0.3;
	background-image:
		radial-gradient(circle at 8% 18%, rgba(200,220,255,0.9) 0 1px, transparent 1.4px),
		radial-gradient(circle at 22% 8%, rgba(200,220,255,0.7) 0 0.8px, transparent 1.2px),
		radial-gradient(circle at 42% 28%, rgba(200,220,255,0.6) 0 0.6px, transparent 1px),
		radial-gradient(circle at 58% 14%, rgba(210,225,255,0.8) 0 1px, transparent 1.4px),
		radial-gradient(circle at 72% 22%, rgba(200,220,255,0.5) 0 0.7px, transparent 1.1px),
		radial-gradient(circle at 88% 10%, rgba(200,220,255,0.7) 0 0.8px, transparent 1.2px),
		radial-gradient(circle at 15% 42%, rgba(200,220,255,0.4) 0 0.6px, transparent 1px),
		radial-gradient(circle at 35% 52%, rgba(200,220,255,0.5) 0 0.7px, transparent 1.1px),
		radial-gradient(circle at 65% 38%, rgba(210,225,255,0.6) 0 0.8px, transparent 1.2px),
		radial-gradient(circle at 82% 48%, rgba(200,220,255,0.4) 0 0.6px, transparent 1px),
		radial-gradient(circle at 48% 62%, rgba(200,220,255,0.3) 0 0.5px, transparent 0.9px),
		radial-gradient(circle at 92% 56%, rgba(200,220,255,0.35) 0 0.6px, transparent 1px);
	animation: wk-snow-drift 8s ease-in-out infinite alternate;
}
@keyframes wk-snow-drift {
	0% { opacity: 0.3; transform: translateY(0); }
	50% { opacity: 0.2; }
	100% { opacity: 0.35; transform: translateY(3px); }
}
.wk-snow-layer {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
	overflow: hidden;
}
.wk-snow-layer::before, .wk-snow-layer::after {
	content: '';
	position: absolute;
	top: -20%;
	left: 0;
	right: 0;
	height: 140%;
	pointer-events: none;
}
.wk-snow-layer::before {
	background-image:
		radial-gradient(circle, rgba(255,255,255,0.7) 0 1px, transparent 1.2px),
		radial-gradient(circle, rgba(220,235,255,0.6) 0 0.8px, transparent 1px),
		radial-gradient(circle, rgba(255,255,255,0.5) 0 1.2px, transparent 1.5px),
		radial-gradient(circle, rgba(220,235,255,0.4) 0 0.6px, transparent 0.9px),
		radial-gradient(circle, rgba(255,255,255,0.6) 0 0.7px, transparent 1px),
		radial-gradient(circle, rgba(220,235,255,0.5) 0 0.9px, transparent 1.2px);
	background-size: 140px 180px, 120px 160px, 160px 200px, 100px 140px, 130px 170px, 150px 190px;
	background-position: 10px 0, 60px 30px, 30px 60px, 90px 20px, 50px 80px, 110px 50px;
	animation: wk-snowfall 12s linear infinite;
}
.wk-snow-layer::after {
	background-image:
		radial-gradient(circle, rgba(255,255,255,0.4) 0 0.5px, transparent 0.8px),
		radial-gradient(circle, rgba(220,235,255,0.35) 0 0.6px, transparent 0.9px),
		radial-gradient(circle, rgba(255,255,255,0.3) 0 0.7px, transparent 1px),
		radial-gradient(circle, rgba(220,235,255,0.25) 0 0.5px, transparent 0.8px);
	background-size: 180px 220px, 160px 200px, 200px 240px, 140px 180px;
	background-position: 20px 10px, 80px 40px, 40px 70px, 100px 30px;
	animation: wk-snowfall 18s linear infinite;
	opacity: 0.6;
}
@keyframes wk-snowfall {
	from { transform: translateY(-30%); }
	to { transform: translateY(30%); }
}
.wk-modal > * {
	position: relative;
	z-index: 1;
}
@keyframes wk-modal-in {
	from { opacity: 0; transform: scale(0.95) translateY(10px); }
	to { opacity: 1; transform: scale(1) translateY(0); }
}
.wk-modal-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 16px 14px 8px;
	max-width: 520px;
	width: 100%;
	margin: 0 auto;
}
.wk-modal-header-left {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0;
	flex: 1;
	min-width: 0;
}
.wk-modal-brand-row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	align-items: flex-end;
	column-gap: 0;
	width: 100%;
	min-width: 0;
}
.wk-modal-title-wrap {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: flex-end;
	gap: 4px;
	min-height: 92px;
	min-width: 0;
	justify-self: start;
}
.wk-modal-logo {
	width: 132px;
	height: 92px;
	justify-self: end;
	transform: translateX(4px);
	border-radius: 10px;
	overflow: hidden;
	border: none;
	background: transparent;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-shadow: none;
	isolation: isolate;
}
.wk-modal-logo-img {
	width: 100%;
	height: 100%;
	object-fit: contain;
	object-position: center bottom;
	display: block;
	filter: none;
	forced-color-adjust: none;
	color-scheme: only light;
}
.wk-modal-header h3 {
	font-size: 2.02rem;
	font-weight: 800;
	margin: 0;
	color: #ffffff;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	letter-spacing: -0.02em;
	line-height: 0.96;
	white-space: nowrap;
}
.wk-modal-subtitle {
	padding: 0;
	margin: 0;
	width: auto;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0;
	text-align: left;
	color: #ffffff;
	font-size: 1.16rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	font-weight: 700;
	letter-spacing: 0.01em;
	line-height: 0.95;
	text-shadow: 0 0 14px rgba(226,232,240,0.28);
	pointer-events: none;
}
.wk-modal-subtitle span {
	display: block;
	white-space: nowrap;
}
.wk-modal-close {
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.06);
	color: #5e5e74;
	font-size: 1.15rem;
	cursor: pointer;
	padding: 0;
	line-height: 1;
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 6px;
	transition: all 0.15s;
	margin-right: 52px;
}
.wk-modal-close:hover {
	background: rgba(239,68,68,0.2);
	border-color: rgba(248,113,113,0.55);
	color: #fecaca;
}

.wk-social-section {
	padding: 0 16px;
	max-width: 446px;
	margin: 0 auto;
}
.wk-social-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(116px, 128px));
	justify-content: center;
	gap: 7px;
}
.wk-social-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 7px;
	padding: 8px 7px 7px;
	background: rgba(255,255,255,0.025);
	border: 1px solid rgba(255,255,255,0.06);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	color: #8e8ea4;
	font-size: 0.52rem;
	font-weight: 500;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	letter-spacing: 0.02em;
	min-height: 98px;
}
.wk-social-btn:hover {
	background: rgba(255,255,255,0.06);
	border-color: rgba(255,255,255,0.14);
	color: #d8d8ec;
	transform: translateY(-1px);
	box-shadow: 0 6px 18px rgba(0,0,0,0.3);
}
.wk-social-btn:active {
	transform: translateY(0);
	transition-duration: 0.05s;
}
.wk-social-btn svg,
.wk-social-btn .wk-social-x-icon {
	width: 40px;
	height: 40px;
	flex-shrink: 0;
	forced-color-adjust: none;
	color-scheme: only light;
	filter: none !important;
	-webkit-filter: none !important;
}
.wk-social-x-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: #000000 !important;
	border: 1px solid rgba(255,255,255,0.14);
	border-radius: 8px;
	overflow: hidden;
}
.wk-social-x-glyph {
	display: block;
	color: #ffffff;
	font-size: 33px;
	line-height: 0.84;
	font-weight: 700;
	font-family: 'STIX Two Math', 'Cambria Math', 'Noto Sans Math', 'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Apple Symbols', 'Arial Unicode MS', system-ui, sans-serif;
}
.wk-social-btn svg * {
	forced-color-adjust: none;
}
.wk-social-btn.wk-sep-left {
	border-left: 1px solid rgba(255,255,255,0.06);
	margin-left: 2px;
	padding-left: 8px;
}
.wk-modal-wrap {
	display: block;
	max-width: 620px;
	width: 100%;
	max-height: none;
	overflow: visible;
	animation: wk-modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.wk-modal-main {
	display: grid;
	grid-template-columns: minmax(244px, 296px) minmax(210px, 236px);
	gap: 12px;
	padding: 8px 14px 14px;
	max-width: 520px;
	width: 100%;
	margin: 0 auto;
	justify-content: center;
}
.wk-waap-column {
	grid-column: 2;
	grid-row: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 12px 8px;
	background: rgba(8,12,20,0.56);
	border: 1px solid rgba(160,200,240,0.12);
	border-radius: 10px;
	min-height: 236px;
	width: 100%;
	position: relative;
}
.wk-qr-link {
	display: block;
	padding: 10px;
	background: rgba(10,14,24,0.9);
	border: 1px solid rgba(160,200,240,0.1);
	border-radius: 8px;
	box-shadow: 0 4px 20px rgba(0,0,0,0.3);
	transition: transform 0.18s, box-shadow 0.18s;
	position: relative;
}
.wk-qr-link:hover {
	transform: scale(1.04);
	box-shadow: 0 6px 28px rgba(0,0,0,0.4), 0 0 24px rgba(99,102,241,0.12);
}
.wk-qr-link svg {
	width: 100%;
	height: 100%;
	display: block;
	color: #6366f1;
}
.wk-qr-link .wk-qr-center-logo {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	border-radius: 6px;
	background: rgba(10,14,24,0.95);
	padding: 3px;
	box-shadow: 0 0 8px rgba(0,0,0,0.4);
}
.wk-qr-link .wk-qr-center-logo img {
	display: block;
	border-radius: 4px;
}
.wk-waap-column .wk-qr-link {
	width: 148px;
	height: 148px;
	z-index: 1;
}
.wk-waap-column .wk-qr-center-logo { width: 34px; height: 34px; }
.wk-waap-column .wk-qr-center-logo img { width: 28px; height: 28px; }
.wk-qr-copy {
	background: none;
	border: none;
	color: rgba(255,255,255,0.45);
	cursor: pointer;
	padding: 4px;
	transition: color 0.15s;
	z-index: 1;
	line-height: 1;
}
.wk-qr-copy:hover {
	color: rgba(255,255,255,0.8);
}
.wk-qr-copy svg {
	width: 16px;
	height: 16px;
	display: block;
}
.wk-trad-column {
	grid-column: 1;
	grid-row: 1;
	min-width: 0;
	background: rgba(8,12,20,0.4);
	border: 1px solid rgba(160,200,240,0.08);
	border-radius: 10px;
	display: flex;
	flex-direction: column;
}
.wk-trad-column .wk-divider {
	padding: 10px 14px 6px;
}
.wk-trad-column .wk-wallet-list {
	padding: 4px 10px 10px;
	max-height: 250px;
	overflow-x: hidden;
}
@media (min-width: 641px) and (max-height: 860px) {
	.wk-modal-overlay {
		padding: 10px;
	}
	.wk-modal-wrap {
		max-height: none;
	}
	.wk-modal-header {
		padding: 10px 10px 4px;
		max-width: 478px;
	}
	.wk-modal-brand-row {
		column-gap: 0;
	}
	.wk-modal-logo {
		width: 104px;
		height: 72px;
		transform: translateX(3px);
	}
	.wk-modal-title-wrap {
		min-height: 72px;
	}
	.wk-modal-header h3 {
		font-size: 1.68rem;
	}
	.wk-modal-subtitle {
		font-size: 0.96rem;
	}
	.wk-modal-close {
		margin-right: 42px;
	}
	.wk-social-section {
		padding: 0 12px;
		max-width: 420px;
	}
	.wk-social-grid {
		grid-template-columns: repeat(3, minmax(104px, 118px));
		gap: 6px;
	}
	.wk-social-btn {
		min-height: 82px;
		gap: 4px;
		padding: 6px;
	}
	.wk-social-btn svg,
	.wk-social-btn .wk-social-x-icon {
		width: 32px;
		height: 32px;
	}
	.wk-social-x-glyph {
		font-size: 27px;
	}
	.wk-powered-pill {
		padding: 3px 10px;
		margin: 2px auto 0;
		font-size: 0.58rem;
	}
	.wk-modal-main {
		grid-template-columns: minmax(228px, 276px) minmax(192px, 220px);
		gap: 10px;
		padding: 6px 12px 10px;
		max-width: 478px;
	}
	.wk-waap-column {
		min-height: 208px;
		gap: 8px;
		padding: 8px 6px;
	}
	.wk-waap-column .wk-qr-link {
		width: 132px;
		height: 132px;
	}
	.wk-trad-column .wk-divider {
		padding: 8px 12px 4px;
	}
	.wk-trad-column .wk-wallet-list {
		max-height: 208px;
		padding: 2px 8px 8px;
	}
	.wk-wallet-item {
		padding: 8px 12px;
		font-size: 0.84rem;
	}
	.wk-wallet-item img {
		width: 24px;
		height: 24px;
	}
}
@media (max-width: 640px) {
	.wk-modal-overlay {
		align-items: flex-start;
		padding: 10px 10px 14px;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}
	.wk-modal-wrap {
		max-width: 100%;
		width: min(100%, 560px);
		margin: 0 auto;
	}
	.wk-social-grid {
		grid-template-columns: repeat(3, minmax(84px, 1fr));
		gap: 5px;
	}
	.wk-social-btn {
		min-height: 84px;
		gap: 5px;
	}
	.wk-social-btn svg,
	.wk-social-btn .wk-social-x-icon {
		width: 30px;
		height: 30px;
	}
	.wk-social-x-glyph {
		font-size: 26px;
	}
	.wk-modal {
		border-radius: 12px !important;
	}
	.wk-modal-header {
		max-width: none;
		padding: 12px 12px 6px;
	}
	.wk-modal-close {
		margin-right: 0;
	}
	.wk-modal-main {
		grid-template-columns: 1fr;
		max-width: none;
		padding: 8px 12px 12px;
	}
	.wk-trad-column {
		grid-column: auto;
		grid-row: auto;
	}
	.wk-waap-column {
		grid-column: auto;
		grid-row: auto;
		min-height: 0;
		padding: 10px 8px;
	}
	.wk-waap-column .wk-qr-link {
		width: 120px;
		height: 120px;
	}
	.wk-modal-header h3 {
		font-size: 1.42rem;
	}
	.wk-modal-subtitle {
		font-size: 0.94rem;
		margin-top: 0;
		width: auto;
	}
	.wk-modal-title-wrap {
		min-height: 82px;
	}
	.wk-modal-logo {
		width: 116px;
		height: 82px;
		transform: translateX(2px);
	}
}
.wk-powered-pill {
	display: flex;
	width: max-content;
	align-items: center;
	justify-content: center;
	gap: 5px;
	padding: 4px 12px;
	margin: 4px auto 0;
	background: rgba(255,255,255,0.08);
	border: 1px solid rgba(255,255,255,0.12);
	border-radius: 8px;
	color: rgba(255,255,255,0.8);
	font-size: 0.62rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	text-decoration: none;
	transition: all 0.18s;
}
.wk-powered-pill:hover {
	background: rgba(255,255,255,0.14);
	border-color: rgba(255,255,255,0.2);
	color: #fff;
}
.wk-powered-pill img {
	width: 14px;
	height: 14px;
	border-radius: 3px;
	opacity: 0.9;
}
.wk-divider {
	display: flex;
	align-items: center;
	padding: 10px 24px 6px;
	gap: 14px;
}
.wk-divider::before, .wk-divider::after {
	content: '';
	flex: 1;
	height: 1px;
	background: rgba(200,220,240,0.1);
}
.wk-divider span {
	color: rgba(255,255,255,0.7);
	font-size: 0.68rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	white-space: nowrap;
	letter-spacing: 0.06em;
	text-transform: uppercase;
}

.wk-wallet-list {
	padding: 4px 14px 18px;
	display: flex;
	flex-direction: column;
	gap: 2px;
	max-height: 270px;
	overflow-y: auto;
	overflow-x: hidden;
	scrollbar-width: thin;
	scrollbar-color: rgba(255,255,255,0.95) rgba(255,255,255,0.12);
}
.wk-wallet-list::-webkit-scrollbar { width: 4px; }
.wk-wallet-list::-webkit-scrollbar-track { background: transparent; }
.wk-wallet-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.95); border-radius: 2px; }
.wk-wallet-list.wk-wallet-list-no-scroll {
	max-height: none;
	overflow-y: visible;
}
.wk-wallet-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 14px;
	background: transparent;
	border: 1px solid transparent;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.18s;
	color: #b0b0c8;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	font-size: 0.88rem;
	font-weight: 500;
	width: 100%;
	min-width: 0;
	text-align: left;
	letter-spacing: -0.005em;
}
.wk-wallet-item:hover {
	background: rgba(255,255,255,0.04);
	border-color: rgba(255,255,255,0.07);
	color: #e8e8f5;
}
.wk-wallet-item:active {
	background: rgba(255,255,255,0.06);
	transform: scale(0.99);
	transition-duration: 0.05s;
}
.wk-wallet-item img {
	width: 28px;
	height: 28px;
	border-radius: 8px;
	flex-shrink: 0;
}
.wk-wallet-item .wk-wallet-name {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.wk-wallet-item .wk-recent-badge {
	flex-shrink: 0;
	font-size: 0.62rem;
	font-weight: 600;
	color: #60a5fa;
	background: rgba(96,165,250,0.1);
	border: 1px solid rgba(96,165,250,0.15);
	padding: 2px 7px;
	border-radius: 6px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

.wk-no-wallets {
	text-align: center;
	padding: 24px 20px;
	color: #5a5a6e;
	font-size: 0.85rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	line-height: 1.5;
}
.wk-no-wallets a {
	display: inline-block;
	margin-top: 8px;
	color: #60a5fa;
	text-decoration: none;
	font-size: 0.82rem;
}
.wk-no-wallets a:hover { text-decoration: underline; }
.wk-detecting {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 28px;
	color: #5a5a6e;
	font-size: 0.85rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}
.wk-spinner {
	width: 20px;
	height: 20px;
	border: 2px solid rgba(96,165,250,0.12);
	border-top-color: #60a5fa;
	border-radius: 50%;
	animation: wk-spin 0.8s linear infinite;
}
@keyframes wk-spin { to { transform: rotate(360deg); } }
.wk-retry-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 10px 24px;
	margin-top: 12px;
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.1);
	border-radius: 10px;
	color: #b0b0c8;
	font-size: 0.82rem;
	font-weight: 500;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	cursor: pointer;
	transition: all 0.15s;
}
.wk-retry-btn:hover {
	background: rgba(255,255,255,0.08);
	border-color: rgba(255,255,255,0.16);
	color: #e0e0f0;
}

.wk-widget { position: relative; display: inline-block; }
.wk-widget-btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: rgba(255,255,255,0.06);
	border: 1px solid rgba(255,255,255,0.1);
	border-radius: 10px;
	color: #e4e4e7;
	font-size: 0.85rem;
	font-weight: 600;
	font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
	cursor: pointer;
	min-height: 38px;
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	box-shadow: 0 4px 18px rgba(2, 6, 23, 0.36);
	transition: background 0.16s, border-color 0.16s, transform 0.16s, box-shadow 0.16s;
	forced-color-adjust: none;
}
.wk-widget-btn:hover {
	background: rgba(96,165,250,0.12);
	border-color: rgba(96,165,250,0.3);
	transform: translateY(-1px);
	box-shadow: 0 8px 22px rgba(30, 64, 175, 0.22);
}
.wk-widget-btn:not(.connected) {
	background: linear-gradient(135deg, rgba(5,8,14,0.96), rgba(10,14,24,0.92));
	border-color: rgba(255,255,255,0.38);
	color: #fff;
	font-size: 1rem;
	font-weight: 700;
	padding: 5px 10px;
	min-height: 29px;
	letter-spacing: 0;
	line-height: 0;
	text-shadow: none;
	box-shadow: 0 4px 20px rgba(2,6,23,0.52), 0 0 20px rgba(255,255,255,0.08);
}
.wk-widget-btn .wk-widget-brand-logo {
	width: 98px;
	height: auto;
	max-height: 26px;
	display: block;
	max-width: 100%;
	object-fit: contain;
	object-position: center;
	background: transparent;
	border-radius: 6px;
	filter: none !important;
	-webkit-filter: none !important;
	forced-color-adjust: none;
	mix-blend-mode: normal;
}
.wk-widget-btn .wk-widget-brand-wordmark {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
	font-size: 1.02rem;
	font-weight: 800;
	letter-spacing: 0.02em;
	color: #f8fbff;
	font-family: 'Avenir Next', 'Segoe UI', system-ui, sans-serif;
	text-shadow: 0 0 8px rgba(96,165,250,0.42);
}
.wk-widget-btn .wk-widget-brand-dot {
	color: #60a5fa;
	margin-right: 1px;
}
.wk-widget-btn.connected {
	background: linear-gradient(135deg, rgba(8,8,14,0.72), rgba(16,16,24,0.68));
	border-color: rgba(100,110,135,0.32);
	color: #c8cde0;
	width: auto;
	max-width: 280px;
	gap: 6px;
	padding: 6px 10px;
	justify-content: flex-start;
	position: relative;
	overflow: hidden;
}
.wk-widget-btn.connected::before {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(110deg, transparent 20%, rgba(160,170,200,0.06) 40%, rgba(200,210,235,0.1) 50%, rgba(160,170,200,0.06) 60%, transparent 80%);
	background-size: 250% 100%;
	animation: wk-liquid 6s ease-in-out infinite;
	pointer-events: none;
}
@keyframes wk-liquid {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}
.wk-widget-btn.connected .wk-widget-icon {
	width: 18px;
	height: 18px;
	border-radius: 5px;
	flex-shrink: 0;
	filter: none !important;
	-webkit-filter: none !important;
	forced-color-adjust: none;
}
.wk-widget-btn.connected .wk-waap-badge {
	width: 18px;
	height: 18px;
	border-radius: 5px;
	flex-shrink: 0;
}
.wk-widget-btn.connected .wk-waap-badge + .wk-widget-icon,
.wk-widget-btn.connected .wk-waap-badge + .wk-widget-icon-fallback {
	margin-left: -6px;
	opacity: 0.85;
}
.wk-widget-btn.connected .wk-widget-icon-fallback {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	filter: none !important;
	-webkit-filter: none !important;
	forced-color-adjust: none;
}
.wk-widget-btn.connected .wk-widget-method-icon {
	width: 18px;
	height: 18px;
	border-radius: 4px;
	display: block;
	flex-shrink: 0;
	filter: none !important;
	-webkit-filter: none !important;
	forced-color-adjust: none;
}
.wk-widget-btn.connected .wk-widget-method-icon .wk-social-x-glyph {
	font-size: 16px;
	line-height: 0.82;
	transform: translate(1px, 1px);
}
.wk-widget-btn.connected .wk-widget-label-wrap {
	min-width: 0;
	flex: 1;
	display: inline-flex;
	align-items: center;
}
.wk-widget-btn.connected .wk-widget-title {
	display: block;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: #e8ecf4;
	font-weight: 700;
	font-size: 0.78rem;
}
.wk-widget-btn.connected .wk-widget-primary-name {
	color: #c8d0e0;
	font-weight: 700;
}
.wk-widget-btn.connected .wk-widget-balance-wrap {
	display: inline-flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 1px;
	flex-shrink: 0;
}
.wk-widget-btn.connected .wk-widget-token-row {
	font-size: 0.58rem;
	line-height: 1.15;
	color: rgba(255,255,255,0.96);
	white-space: nowrap;
}
.wk-widget-btn.connected .wk-widget-usd-row {
	font-size: 0.58rem;
	line-height: 1.1;
	color: rgba(255,232,160,0.92);
	white-space: nowrap;
}
@media (max-width: 640px) {
	.wk-widget-btn.connected {
		max-width: 220px;
	}
	.wk-widget-btn.connected .wk-widget-token-row,
	.wk-widget-btn.connected .wk-widget-usd-row {
		font-size: 0.56rem;
	}
}
.wk-widget-btn.session-only {
	background: linear-gradient(135deg, rgba(96,165,250,0.1), rgba(139,92,246,0.1));
	border: 1px dashed rgba(96,165,250,0.35);
}
.wk-dropdown {
	display: block;
	visibility: hidden;
	opacity: 0;
	pointer-events: none;
	transform: translateY(-4px) scale(0.985);
	transform-origin: top right;
	transition: opacity 0.16s ease, transform 0.16s ease, visibility 0s linear 0.16s;
	position: absolute;
	right: 0;
	top: calc(100% + 6px);
	min-width: 198px;
	max-width: min(90vw, 320px);
	padding: 6px;
	background:
		linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98)),
		radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 55%);
	border: 1px solid rgba(96, 165, 250, 0.26);
	border-radius: 14px;
	box-shadow: 0 18px 44px rgba(2, 6, 23, 0.62), inset 0 1px 0 rgba(148, 163, 184, 0.12);
	z-index: 9999;
}
.wk-dropdown.open {
	visibility: visible;
	opacity: 1;
	pointer-events: auto;
	transform: translateY(0) scale(1);
	transition-delay: 0s;
}
.wk-dropdown-item {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 9px 10px;
	background: none;
	border: 1px solid transparent;
	border-radius: 10px;
	color: #e2e8f0;
	font-size: 0.82rem;
	font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
	cursor: pointer;
	transition: background 0.16s, border-color 0.16s, color 0.16s, transform 0.16s;
	text-decoration: none;
	text-align: left;
}
.wk-dropdown-item + .wk-dropdown-item {
	margin-top: 4px;
}
.wk-dropdown-item:hover {
	background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(30, 64, 175, 0.14));
	border-color: rgba(96, 165, 250, 0.32);
	color: #f8fafc;
	transform: translateY(-1px);
}
.wk-dropdown-item svg {
	width: 16px;
	height: 16px;
	flex-shrink: 0;
	opacity: 0.82;
	color: #93c5fd;
}
.wk-dropdown-item.disconnect {
	color: #fca5a5;
}
.wk-dropdown-item.disconnect svg {
	color: #f87171;
}
.wk-dropdown-item.disconnect:hover {
	background: linear-gradient(135deg, rgba(127, 29, 29, 0.36), rgba(69, 10, 10, 0.28));
	border-color: rgba(248, 113, 113, 0.34);
	color: #fee2e2;
}
.wk-copied-flash {
	position: absolute;
	right: 14px;
	top: 50%;
	transform: translateY(-50%);
	color: #34d399;
	font-size: 0.75rem;
	font-weight: 600;
	pointer-events: none;
	animation: wk-fade 1.5s ease forwards;
}
@keyframes wk-fade {
	0% { opacity: 1; }
	70% { opacity: 1; }
	100% { opacity: 0; }
}
#waap-wallet-iframe-container {
	z-index: 13001 !important;
	background-color: rgba(0,0,0,0.7) !important;
}
#waap-wallet-iframe-wrapper {
	height: 480px !important;
	max-height: 80vh !important;
	background: transparent !important;
	overflow: hidden !important;
	border-radius: 16px !important;
}
#waap-wallet-iframe {
	height: 480px !important;
	max-height: 80vh !important;
	border-radius: 16px !important;
	box-shadow: 0 12px 48px rgba(0,0,0,0.7) !important;
	background: #1a1a1a !important;
	color-scheme: dark !important;
}
#waap-wallet-iframe-container div[style*="background"] {
	background: transparent !important;
	background-color: transparent !important;
}
`
}

export function generateWalletUiJs(config?: WalletUiConfig): string {
	const showPrimaryName = config?.showPrimaryName ?? true
	const onConnect = config?.onConnect ?? ''
	const onDisconnect = config?.onDisconnect ?? ''
	const widgetBrandLogoSrc = config?.widgetBrandLogoSrc ?? BLACK_DOTSKI_WORDMARK_DATA_URL
	const keepBrandLogoWhenConnected = config?.keepBrandLogoWhenConnected ?? false
	const primaryProfileHost = config?.primaryProfileHost ?? 'sui.ski'

	return `
    function __wkTruncAddr(addr) {
      return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
    }

		function __wkNormalizeSuiAddress(addr) {
			var value = typeof addr === 'string' ? addr.trim() : '';
			if (!value) return '';
			if (value.indexOf('0x') !== 0 && /^[0-9a-fA-F]+$/.test(value)) {
				return '0x' + value;
			}
			return value;
		}

		function __wkIsValidSuiAddress(addr) {
			var normalized = __wkNormalizeSuiAddress(addr);
			return /^0x[0-9a-fA-F]{1,64}$/.test(normalized);
		}

		function __wkGetPrimaryNameSlug(value) {
			var slug = typeof value === 'string' ? value.trim().toLowerCase() : '';
			if (!slug) return '';
			slug = slug.replace(/^@+/, '').replace(/\\.sui$/i, '');
			if (!slug) return '';
			return slug;
		}

		function __wkGetPrimaryProfileHref(conn) {
			var slug = __wkGetPrimaryNameSlug(conn && conn.primaryName);
			if (!slug) return '';
			return 'https://' + encodeURIComponent(slug) + '.' + __wkPrimaryProfileHost;
		}

	    var __wkModalContainer = null;
	    var __wkWidgetContainer = null;
	    var __wkModalUnsub = null;
	    var __wkModalWalletsUnsub = null;
	    var __wkWidgetUnsub = null;
	    var __wkWidgetDocClickBound = false;
	    var __wkWidgetBtnMarkup = '';
	    var __wkWidgetBtnStateClass = '';
	    var __wkWidgetDropdownMarkup = '';
	    var __wkLastWalletKey = 'sui_ski_last_wallet';
	    var __wkShowPrimaryName = ${showPrimaryName ? 'true' : 'false'};
	    var __wkKeepBrandLogoWhenConnected = ${keepBrandLogoWhenConnected ? 'true' : 'false'};
	    var __wkPrimaryProfileHost = ${JSON.stringify(primaryProfileHost)};
	    var __wkWidgetBrandLogoSrc = ${JSON.stringify(widgetBrandLogoSrc)};
	    var __wkWidgetDefaultMarkup = '<img src="' + __wkWidgetBrandLogoSrc + '" class="wk-widget-brand-logo" alt=".SKI" draggable="false">';
	    if (${JSON.stringify(widgetBrandLogoSrc)}) {
	      __wkWidgetBrandLogoSrc = ${JSON.stringify(widgetBrandLogoSrc)};
	      __wkWidgetDefaultMarkup = '<img src="' + __wkWidgetBrandLogoSrc + '" class="wk-widget-brand-logo" alt=".SKI" draggable="false">';
	    }

	    var __wkPortfolioTimer = null;
	    var __wkPortfolioData = null;
	    var __wkPortfolioRealtimeBound = false;
	    var __wkExpandedL1 = {};
	    var __wkLocalWalletMap = {};
	    var __wkBridgeWalletCache = {};
	    var __wkBridgeWalletOrder = [];
	    var __wkLastBridgeHintSignature = '';
	    var __wkBridgeHiddenStyle = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;z-index:-1;background:transparent';
	    var __wkDetectedWalletCacheKey = 'sui_ski_detected_wallets_v1';
	    var __wkBridgeDetectedWalletCacheKey = 'sui_ski_bridge_detected_wallets_v1';
	    var __wkDetectedWalletCacheMaxAgeMs = 1000 * 60 * 60 * 24 * 14;

	    function __wkResetBridgeWalletCache() {
	      __wkBridgeWalletCache = {};
	      __wkBridgeWalletOrder = [];
	    }

	    function __wkGetBridgeWalletSnapshot() {
	      var out = [];
	      for (var i = 0; i < __wkBridgeWalletOrder.length; i++) {
	        var key = __wkBridgeWalletOrder[i];
	        if (__wkBridgeWalletCache[key]) out.push(__wkBridgeWalletCache[key]);
	      }
	      return out;
	    }

	    function __wkMergeBridgeWallets(wallets) {
	      var list = Array.isArray(wallets) ? wallets : [];
	      for (var i = 0; i < list.length; i++) {
	        var wallet = list[i];
	        if (!wallet || !wallet.name) continue;
	        var key = __wkWalletNameKey(wallet.name);
	        if (!key) key = 'wallet-' + i;
	        var existing = __wkBridgeWalletCache[key];
	        if (!existing) {
	          __wkBridgeWalletCache[key] = {
	            name: String(wallet.name),
	            icon: wallet.icon ? String(wallet.icon) : '',
	            __isPasskey: !!wallet.__isPasskey,
	          };
	          __wkBridgeWalletOrder.push(key);
	          continue;
	        }
	        if (!existing.icon && wallet.icon) {
	          existing.icon = String(wallet.icon);
	        }
	        if (existing.__isPasskey && !wallet.__isPasskey) {
	          existing.__isPasskey = false;
	        }
	      }
	      return __wkGetBridgeWalletSnapshot();
	    }

	    function __wkSerializeWalletForCache(wallet) {
	      if (!wallet || !wallet.name) return null;
	      return {
	        name: String(wallet.name),
	        icon: wallet.icon ? String(wallet.icon) : '',
	        __isPasskey: !!wallet.__isPasskey,
	      };
	    }

	    function __wkReadDetectedWalletCache(keyOverride) {
	      try {
	        var cacheKey = keyOverride || __wkDetectedWalletCacheKey;
	        var raw = localStorage.getItem(cacheKey);
	        if (!raw) return [];
	        var parsed = JSON.parse(raw);
	        if (!parsed || typeof parsed !== 'object') return [];
	        var ts = Number(parsed.ts || 0);
	        if (!Number.isFinite(ts) || ts <= 0) return [];
	        if ((Date.now() - ts) > __wkDetectedWalletCacheMaxAgeMs) return [];
	        var wallets = Array.isArray(parsed.wallets) ? parsed.wallets : [];
	        var out = [];
	        for (var i = 0; i < wallets.length; i++) {
	          var serialized = __wkSerializeWalletForCache(wallets[i]);
	          if (serialized) out.push(serialized);
	        }
	        return out;
	      } catch (_e) {
	        return [];
	      }
	    }

	    function __wkWriteDetectedWalletCache(wallets, keyOverride) {
	      try {
	        var cacheKey = keyOverride || __wkDetectedWalletCacheKey;
	        var list = Array.isArray(wallets) ? wallets : [];
	        var serialized = [];
	        for (var i = 0; i < list.length; i++) {
	          var item = __wkSerializeWalletForCache(list[i]);
	          if (item) serialized.push(item);
	        }
	        localStorage.setItem(cacheKey, JSON.stringify({
	          ts: Date.now(),
	          wallets: serialized,
	        }));
	      } catch (_e) {}
	    }

	    function __wkFormatBalance(sui) {
	      if (sui < 0.01) return '< 0.01';
	      if (sui < 10000) {
	        var snapped = Math.round(sui);
	        if (Math.abs(sui - snapped) <= 0.05) return String(snapped);
	      }
	      if (sui < 100) {
	        return sui.toFixed(2).replace(/\\.?0+$/, '');
	      }
	      if (sui < 10000) return sui.toFixed(1);
	      if (sui < 1000000) return (sui / 1000).toFixed(1) + 'k';
	      return (sui / 1000000).toFixed(1) + 'M';
	    }

    function __wkFormatUsd(usd) {
      if (usd < 0.01) return '< $0.01';
      if (usd < 100) return '$' + usd.toFixed(2);
      if (usd < 10000) return '$' + usd.toFixed(0);
      if (usd < 1000000) return '$' + (usd / 1000).toFixed(1) + 'k';
      return '$' + (usd / 1000000).toFixed(1) + 'M';
    }

    function __wkNormalizeHoldingSymbol(name) {
      return String(name || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    function __wkHoldingBucket(symbol) {
      if (!symbol) return '';
      if (symbol === 'SUI' || symbol === 'WSUI') return 'SUI';
      if (symbol === 'ETH' || symbol === 'WETH') return 'ETH';
      if (symbol === 'SOL' || symbol === 'WSOL') return 'SOL';
      return '';
    }

    function __wkIsStablecoin(symbol) {
      if (!symbol) return false;
      var s = symbol.toUpperCase();
      return s === 'USDC' || s === 'USDT' || s === 'DAI' || s === 'AUSD' || s === 'BUCK' || s === 'FDUSD' || s === 'WUSDC' || s === 'WUSDT';
    }

    function __wkGetStablecoinTotal(portfolioData) {
      if (!portfolioData || !Array.isArray(portfolioData.holdings)) return 0;
      var total = 0;
      for (var i = 0; i < portfolioData.holdings.length; i++) {
        var holding = portfolioData.holdings[i];
        var symbol = __wkNormalizeHoldingSymbol(holding && holding.name);
        if (!__wkIsStablecoin(symbol)) continue;
        var amount = Number(holding && holding.balance);
        if (Number.isFinite(amount) && amount > 0) total += amount;
      }
      return total;
    }

    function __wkFormatTokenAmount(value) {
      if (!Number.isFinite(value) || value <= 0) return '0';
      if (value < 0.0001) return '<0.0001';
      if (value < 1) return value.toFixed(4).replace(/\\.?0+$/, '');
      if (value < 100) return value.toFixed(3).replace(/\\.?0+$/, '');
      if (value < 10000) return value.toFixed(2).replace(/\\.?0+$/, '');
      if (value < 1000000) return (value / 1000).toFixed(1) + 'k';
      return (value / 1000000).toFixed(1) + 'M';
    }

    function __wkGetNonL1Holdings(portfolioData) {
      if (!portfolioData || !Array.isArray(portfolioData.holdings)) return [];
      var merged = {};
      for (var i = 0; i < portfolioData.holdings.length; i++) {
        var holding = portfolioData.holdings[i];
        var symbol = __wkNormalizeHoldingSymbol(holding && holding.name);
        if (!symbol || __wkHoldingBucket(symbol)) continue;
        var amount = Number(holding && holding.balance);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        var suiValue = Number(holding && holding.suiValue);
        if (!merged[symbol]) {
          merged[symbol] = { name: symbol, balance: 0, suiValue: 0 };
        }
        merged[symbol].balance += amount;
        if (Number.isFinite(suiValue) && suiValue > 0) {
          merged[symbol].suiValue += suiValue;
        }
      }
      return Object.keys(merged)
        .map(function(key) { return merged[key]; })
        .sort(function(a, b) { return b.suiValue - a.suiValue; });
    }

    var __wkL1Order = ['SUI', 'ETH', 'SOL'];

    var __wkL1Icons = {
      SUI: '<svg viewBox="0 0 300 384" width="14" height="18" style="display:inline-block;vertical-align:-3px;fill:#4DA2FF;"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z"></path></svg>',
      ETH: '<svg viewBox="0 0 256 417" width="10" height="18" style="display:inline-block;vertical-align:-3px;"><path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fill="#627EEA"/><path d="M127.962 0L0 212.32l127.962 75.639V154.158z" fill="#8C8FE6"/><path d="M127.961 312.187l-1.575 1.92V414.79l1.575 4.6L256 236.587z" fill="#627EEA"/><path d="M127.962 419.39V312.187L0 236.587z" fill="#8C8FE6"/><path d="M127.961 287.958l127.96-75.637-127.96-58.162z" fill="#3C3C94"/><path d="M0 212.32l127.96 75.639V154.159z" fill="#627EEA"/></svg>',
      SOL: '<svg viewBox="0 0 398 312" width="16" height="14" style="display:inline-block;vertical-align:-2px;"><defs><linearGradient id="sol-a" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient><linearGradient id="sol-b" x1="264.829" y1="401.601" x2="45.163" y2="-19.148" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient><linearGradient id="sol-c" x1="312.548" y1="376.688" x2="92.882" y2="-44.061" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient></defs><path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1z" fill="url(#sol-a)"/><path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1z" fill="url(#sol-b)"/><path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1z" fill="url(#sol-c)"/></svg>'
    };

    function __wkGetL1Holdings(portfolioData) {
      if (!portfolioData || !Array.isArray(portfolioData.holdings)) return [];
      var buckets = {};
      for (var i = 0; i < portfolioData.holdings.length; i++) {
        var holding = portfolioData.holdings[i];
        var symbol = __wkNormalizeHoldingSymbol(holding && holding.name);
        var bucket = __wkHoldingBucket(symbol);
        if (!bucket) continue;
        var amount = Number(holding && holding.balance);
        if (!Number.isFinite(amount)) amount = 0;
        var suiValue = Number(holding && holding.suiValue);
        if (!Number.isFinite(suiValue)) suiValue = 0;
        if (!buckets[bucket]) {
          buckets[bucket] = { name: bucket, balance: 0, suiValue: 0 };
        }
        buckets[bucket].balance += amount;
        buckets[bucket].suiValue += suiValue;
      }
      var result = [];
      for (var o = 0; o < __wkL1Order.length; o++) {
        var key = __wkL1Order[o];
        if (buckets[key] && buckets[key].balance > 0) {
          result.push(buckets[key]);
        }
      }
      return result;
    }

    function __wkGetL1SubTokens(l1Name, portfolioData) {
      if (l1Name === 'SUI') return __wkGetNonL1Holdings(portfolioData);
      if (!portfolioData || !Array.isArray(portfolioData.holdings)) return [];
      var entries = [];
      for (var i = 0; i < portfolioData.holdings.length; i++) {
        var holding = portfolioData.holdings[i];
        var symbol = __wkNormalizeHoldingSymbol(holding && holding.name);
        if (__wkHoldingBucket(symbol) !== l1Name || symbol === l1Name) continue;
        var amount = Number(holding && holding.balance);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        var suiValue = Number(holding && holding.suiValue);
        entries.push({ name: symbol, balance: amount, suiValue: Number.isFinite(suiValue) ? suiValue : 0 });
      }
      return entries.sort(function(a, b) { return b.suiValue - a.suiValue; });
    }

    async function __wkFetchPortfolio(address) {
      try {
        var suiClient = typeof getSuiClient === 'function' ? getSuiClient() : null;
        if (!suiClient) return null;

        var SUI_TYPE = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
        var suiBal = await suiClient.getBalance({ owner: address, coinType: SUI_TYPE }).catch(function() { return { totalBalance: '0' }; });
        var suiAmount = Number(BigInt(suiBal.totalBalance)) / 1e9;
        var totalSui = suiAmount;
        var holdings = [{ name: 'SUI', balance: suiAmount, suiValue: suiAmount }];

        var poolsRaw = await fetch('/api/deepbook-pools').then(function(r) { return r.json(); }).catch(function() { return []; });
        var pools = [];
        if (Array.isArray(poolsRaw) && poolsRaw.length) {
          var poolByCoinType = {};
          for (var p = 0; p < poolsRaw.length; p++) {
            var pool = poolsRaw[p];
            if (!pool || typeof pool.coinType !== 'string' || !pool.coinType) continue;
            var existing = poolByCoinType[pool.coinType];
            if (!existing) {
              poolByCoinType[pool.coinType] = pool;
              continue;
            }
            if (!existing.isDirect && pool.isDirect) {
              poolByCoinType[pool.coinType] = pool;
              continue;
            }
            var nextRate = Number(pool.suiPerToken || 0);
            var existingRate = Number(existing.suiPerToken || 0);
            if (Number.isFinite(nextRate) && nextRate > existingRate) {
              poolByCoinType[pool.coinType] = pool;
            }
          }
          pools = Object.values(poolByCoinType);
        }
        if (pools.length) {
          var balances = await Promise.all(
            pools.map(function(p) {
              return suiClient.getBalance({ owner: address, coinType: p.coinType }).catch(function() { return { totalBalance: '0' }; });
            })
          );
          for (var i = 0; i < pools.length; i++) {
            var bal = Number(BigInt(balances[i].totalBalance));
            if (bal <= 0) continue;
            var tokenAmount = bal / Math.pow(10, pools[i].decimals);
            var suiValue = tokenAmount * pools[i].suiPerToken * 0.95;
            totalSui += suiValue;
            holdings.push({ name: pools[i].name, balance: tokenAmount, suiValue: suiValue });
          }
        }

        var usdcData = await fetch('/api/usdc-price').then(function(r) { return r.json(); }).catch(function() { return null; });
        var usdcPerSui = usdcData && usdcData.usdcPerSui ? usdcData.usdcPerSui : 0;

        return { totalSui: totalSui, usdcPerSui: usdcPerSui, holdings: holdings };
      } catch (e) {
        return null;
      }
    }

	    function __wkRefreshPortfolio(address) {
	      if (!address) return;
	      __wkFetchPortfolio(address).then(function(data) {
	        if (data) {
	          __wkPortfolioData = data;
	          __wkUpdateWidget(SuiWalletKit.$connection.value);
	        }
	      });
	    }

	    function __wkCurrentConnectedAddress() {
	      var conn = SuiWalletKit && SuiWalletKit.$connection ? SuiWalletKit.$connection.value : null;
	      var rawAddr = conn && (conn.status === 'connected' || conn.status === 'session') ? conn.address : '';
	      var normalized = __wkNormalizeSuiAddress(rawAddr || '');
	      return __wkIsValidSuiAddress(normalized) ? normalized : '';
	    }

	    function __wkStartPortfolioPolling(address) {
	      __wkStopPortfolioPolling();
	      function poll() {
	        __wkRefreshPortfolio(address);
	      }
	      poll();
	      __wkPortfolioTimer = setInterval(poll, 30000);
	      if (!__wkPortfolioRealtimeBound) {
	        __wkPortfolioRealtimeBound = true;
	        window.addEventListener('wk:tx-success', function() {
	          var addr = __wkCurrentConnectedAddress();
	          if (!addr) return;
	          __wkRefreshPortfolio(addr);
	          setTimeout(function() {
	            __wkRefreshPortfolio(addr);
	          }, 1800);
	        });
	        window.addEventListener('focus', function() {
	          var addr = __wkCurrentConnectedAddress();
	          if (!addr) return;
	          __wkRefreshPortfolio(addr);
	        });
	        document.addEventListener('visibilitychange', function() {
	          if (document.visibilityState !== 'visible') return;
	          var addr = __wkCurrentConnectedAddress();
	          if (!addr) return;
	          __wkRefreshPortfolio(addr);
	        });
	      }
	    }

    function __wkStopPortfolioPolling() {
      if (__wkPortfolioTimer) {
        clearInterval(__wkPortfolioTimer);
        __wkPortfolioTimer = null;
      }
      __wkPortfolioData = null;
    }

    function __wkDefaultIcon() {
      return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle fill="#818cf8" cx="16" cy="16" r="16"/></svg>');
    }

    var __wkWaaPIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNjM2NmYxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYTg1NWY3Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9InVybCgjZykiIHJ4PSIyNCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE0LDE0KSBzY2FsZSgxKSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik02Mi4xOCAwQzY3LjYzIDAgNzEuNjUgMy4xIDc0LjQ4IDcuMDljMi41OCAzLjY0IDQuMzcgOC4yNiA1LjY0IDEyLjc3IDQuNTEgMS4yNiA5LjEzIDMuMDQgMTIuNzcgNS42MiAzLjk5IDIuODMgNy4xIDYuODUgNy4xIDEyLjMgMCA1LjAyLTIuNTUgOS4wNy02Ljg4IDEyLjIgNC4zMyAzLjEzIDYuODggNy4xOCA2Ljg5IDEyLjIgMCA1LjQ1LTMuMSA5LjQ3LTcuMDkgMTIuMy0zLjY0IDIuNTgtOC4yNiA0LjM3LTEyLjc3IDUuNjQtMS4yNiA0LjUyLTMuMDQgOS4xNC01LjYyIDEyLjc4LTIuODMgMy45OS02Ljg1IDcuMS0xMi4zIDcuMS01LjAyIDAtOS4wNy0yLjU1LTEyLjItNi44OC0zLjEzIDQuMzMtNy4xOCA2Ljg4LTEyLjIgNi44OS01LjQ1IDAtOS40Ny0zLjEtMTIuMy03LjA5LTIuNTgtMy42NC00LjM3LTguMjYtNS42NC0xMi43Ny00LjUxLTEuMjYtOS4xMy0zLjA1LTEyLjc3LTUuNjJDMy4xMiA3MS42OSAwIDY3LjY3IDAgNjIuMjJjMC01LjAyIDIuNTUtOS4wNyA2Ljg5LTEyLjJDMi41NiA0Ni44OSAwIDQyLjg0IDAgMzcuODIgMCAzMi4zNyAzLjEgMjguMzUgNy4wOSAyNS41MmMzLjY0LTIuNTggOC4yNi00LjM3IDEyLjc3LTUuNjQgMS4yNi00LjUyIDMuMDQtOS4xNCA1LjYyLTEyLjc4QzI4LjMxIDMuMTEgMzIuMzMgMC4wMSAzNy43OCAwLjAxYzUuMDIgMCA5LjA3IDIuNTUgMTIuMiA2Ljg4QzUzLjExIDIuNTYgNTcuMTYgMCA2Mi4xOCAwem0wIDUuNjJjLTMuMjcgMC02LjMyIDEuODQtOS4wMyA2Ljc2LTEuMzcgMi40OC00Ljk1IDIuNDgtNi4zMiAwLTIuNzItNC45Mi01Ljc4LTYuNzYtOS4wNC02Ljc2LTMuMDEgMC01LjUyIDEuNjMtNy43MiA0LjczLTIuMjMgMy4xNC0zLjg5IDcuNS01LjA0IDEyLjEtLjMzIDEuMjUtMS4zIDIuMjItMi41NCAyLjU1LTQuNiAxLjIxLTguOTUgMi44Ny0xMi4xIDUuMUM3LjI0IDMyLjMgNS42MiAzNC44MSA1LjYyIDM3LjgyYzAgMy4yNyAxLjg0IDYuMzIgNi43NiA5LjA0IDIuNDggMS4zNyAyLjQ4IDQuOTUgMCA2LjMyLTQuOTIgMi43Mi02Ljc2IDUuNzgtNi43NiA5LjA0IDAgMy4wMSAxLjYzIDUuNTIgNC43MyA3LjcyIDMuMTQgMi4yMyA3LjUgMy44OSAxMi4xIDUuMDggMS4xNy4zIDIuMSAxLjE4IDIuNDggMi4zMWwuMDcuMjMuMjMuODZjMS4xOSA0LjI4IDIuNzggOC4yOSA0Ljg3IDExLjI0IDIuMiAzLjEgNC43MSA0LjcyIDcuNzIgNC43MiAzLjI3IDAgNi4zMi0xLjg0IDkuMDQtNi43N2wuMTMtLjIyYzEuNDEtMi4xOCA0LjY0LTIuMTggNi4wNSAwbC4xMy4yMi4yNi40NWMyLjY1IDQuNTggNS42MiA2LjMxIDguNzggNi4zMSAzLjAxIDAgNS41Mi0xLjYzIDcuNzItNC43MiAyLjIzLTMuMTQgMy44OS03LjUgNS4wOC0xMi4xLjMzLTEuMjUgMS4zLTIuMjIgMi41NC0yLjU1IDQuNi0xLjIxIDguOTUtMi44NyAxMi4xLTUuMSAzLjEtMi4yIDQuNzItNC43MSA0LjcyLTcuNzIgMC0zLjI3LTEuODQtNi4zMi02Ljc3LTkuMDQtMi40OC0xLjM3LTIuNDgtNC45NSAwLTYuMzJsLjQ1LS4yNmM0LjU4LTIuNjUgNi4zMS01LjYyIDYuMzEtOC43OCAwLTMuMDEtMS42My01LjUyLTQuNzMtNy43Mi0zLjE0LTIuMjMtNy41LTMuODktMTIuMS01LjA0LTEuMjUtLjMyLTIuMjItMS4zLTIuNTQtMi41NC0xLjIxLTQuNi0yLjg3LTguOTUtNS4xLTEyLjEtMi4yLTMuMS00LjcxLTQuNzItNy43Mi00LjcyeiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNNjIuNjcgNjMuMTVjLjk1LTEuMjMgMi43MS0xLjQ2IDMuOTQtLjUxIDEuMjMuOTUgMS40NiAyLjcxLjUxIDMuOTQtMy4xOSA0LjE1LTguOTggNi45Ni0xNS4xNSA3LjQ4LTYuMjcuNTMtMTMuMjYtMS4yNy0xOC44NS02Ljc5LTEuMS0xLjA5LTEuMTEtMi44Ny0uMDItMy45NyAxLjA5LTEuMSAyLjg3LTEuMTEgMy45Ny0uMDIgNC4yNyA0LjIxIDkuNTcgNS42IDE0LjQzIDUuMTkgNC45Ni0uNDIgOS4xNC0yLjY3IDExLjE3LTUuMzJ6IiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0zOS42NiAzMC44NGMxLjQ0IDAgMi41NS43MyAzLjI4IDEuNDguNzIuNzQgMS4yNCAxLjY3IDEuNjIgMi41OS43NiAxLjg1IDEuMTcgNC4yMSAxLjE3IDYuNjcgMCAyLjQ2LS40IDQuODMtMS4xNiA2LjY4LS4zOC45Mi0uOSAxLjg1LTEuNjIgMi41OS0uNzMuNzUtMS44NCAxLjQ4LTMuMjggMS40OC0xLjQ0IDAtMi41NS0uNzItMy4yOC0xLjQ3LS43Mi0uNzQtMS4yNC0xLjY3LTEuNjItMi41OS0uNzYtMS44NS0xLjE3LTQuMjEtMS4xNy02LjY3IDAtMi40Ni40LTQuODMgMS4xNi02LjY4LjM4LS45Mi45LTEuODUgMS42Mi0yLjU5LjczLS43NSAxLjg0LTEuNDggMy4yOC0xLjQ4eiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNNjAuMzMgMzAuODRsLjI3LjAxYzEuMzEuMDggMi4zMy43NiAzLjAxIDEuNDcuNzIuNzQgMS4yNCAxLjY3IDEuNjIgMi41OS43NiAxLjg1IDEuMTcgNC4yMSAxLjE3IDYuNjcgMCAyLjQ2LS40IDQuODMtMS4xNiA2LjY4LS4zOC45Mi0uOSAxLjg1LTEuNjIgMi41OS0uNzMuNzUtMS44NCAxLjQ4LTMuMjggMS40OC0xLjQ0IDAtMi41NS0uNzItMy4yOC0xLjQ3LS43Mi0uNzQtMS4yNC0xLjY3LTEuNjItMi41OS0uNzYtMS44NS0xLjE3LTQuMjEtMS4xNy02LjY3IDAtMi40Ni40LTQuODMgMS4xNi02LjY4LjM4LS45Mi45LTEuODUgMS42Mi0yLjU5LjczLS43NSAxLjg0LTEuNDggMy4yOC0xLjQ4eiIgZmlsbD0id2hpdGUiLz48L2c+PC9zdmc+Cg==';

	    var __wkSocialIcons = {
	      google: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>',
      github: '<svg viewBox="0 0 24 24" width="24" height="24" fill="#8e8ea4"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>',
      email: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#8e8ea4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/></svg>',
      phone: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#8e8ea4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2"/></svg>',
      x: '<span class="wk-social-x-icon" aria-hidden="true"><span class="wk-social-x-glyph">𝕏</span></span>',
      discord: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#8e8ea4"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
	      coinbase: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><circle cx="12" cy="12" r="11" stroke="#8e8ea4" stroke-width="1.5"/><path d="M14.5 10.5h-5v3h5v-3z" fill="#8e8ea4" rx="0.5"/></svg>'
	    };

	    function __wkWidgetMethodIconSvg(method) {
	      var key = __wkNormalizeWaaPMethod(method);
	      if (!key) return '';
	      if (key === 'x') {
	        return '<span class="wk-widget-method-icon wk-social-x-icon" aria-hidden="true"><span class="wk-social-x-glyph">𝕏</span></span>';
	      }
	      return __wkSocialIcons[key]
	        ? __wkSocialIcons[key].replace(/width="\\d+"/, 'width="18"').replace(/height="\\d+"/, 'height="18"').replace(/fill="[^"]*"/, 'fill="#e2e8f0"')
	        : '';
	    }
	    var __wkLogoSvg = '<svg class="wk-modal-logo-img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 363" fill="none" role="img" aria-label=".SKI"><image href="data:image/webp;base64,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" width="520" height="363" preserveAspectRatio="xMidYMid meet"/></svg>';

    var __wkQrSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29"><path d="M0,0h7v1h-7zM9,0h3v1h-3zM15,0h1v1h-1zM18,0h2v1h-2zM22,0h7v1h-7zM0,1h1v1h-1zM6,1h1v1h-1zM8,1h2v1h-2zM11,1h3v1h-3zM15,1h1v1h-1zM17,1h2v1h-2zM22,1h1v1h-1zM28,1h1v1h-1zM0,2h1v1h-1zM2,2h3v1h-3zM6,2h1v1h-1zM8,2h1v1h-1zM10,2h3v1h-3zM15,2h3v1h-3zM19,2h1v1h-1zM22,2h1v1h-1zM24,2h3v1h-3zM28,2h1v1h-1zM0,3h1v1h-1zM2,3h3v1h-3zM6,3h1v1h-1zM9,3h1v1h-1zM11,3h1v1h-1zM14,3h3v1h-3zM18,3h3v1h-3zM22,3h1v1h-1zM24,3h3v1h-3zM28,3h1v1h-1zM0,4h1v1h-1zM2,4h3v1h-3zM6,4h1v1h-1zM8,4h2v1h-2zM11,4h1v1h-1zM13,4h4v1h-4zM18,4h1v1h-1zM22,4h1v1h-1zM24,4h3v1h-3zM28,4h1v1h-1zM0,5h1v1h-1zM6,5h1v1h-1zM8,5h1v1h-1zM10,5h1v1h-1zM14,5h2v1h-2zM17,5h3v1h-3zM22,5h1v1h-1zM28,5h1v1h-1zM0,6h7v1h-7zM8,6h1v1h-1zM10,6h1v1h-1zM12,6h1v1h-1zM14,6h1v1h-1zM16,6h1v1h-1zM18,6h1v1h-1zM20,6h1v1h-1zM22,6h7v1h-7zM8,7h1v1h-1zM10,7h3v1h-3zM14,7h1v1h-1zM17,7h1v1h-1zM19,7h2v1h-2zM0,8h2v1h-2zM3,8h1v1h-1zM6,8h2v1h-2zM11,8h3v1h-3zM16,8h1v1h-1zM18,8h3v1h-3zM22,8h3v1h-3zM26,8h2v1h-2zM1,9h1v1h-1zM3,9h1v1h-1zM5,9h1v1h-1zM8,9h2v1h-2zM12,9h1v1h-1zM14,9h1v1h-1zM18,9h1v1h-1zM21,9h3v1h-3zM25,9h1v1h-1zM28,9h1v1h-1zM0,10h1v1h-1zM3,10h1v1h-1zM5,10h2v1h-2zM13,10h1v1h-1zM19,10h1v1h-1zM21,10h2v1h-2zM24,10h4v1h-4zM4,11h2v1h-2zM7,11h7v1h-7zM16,11h1v1h-1zM18,11h5v1h-5zM26,11h2v1h-2zM0,12h4v1h-4zM5,12h2v1h-2zM10,12h4v1h-4zM15,12h3v1h-3zM19,12h5v1h-5zM25,12h1v1h-1zM27,12h2v1h-2zM1,13h3v1h-3zM5,13h1v1h-1zM8,13h2v1h-2zM12,13h1v1h-1zM14,13h1v1h-1zM17,13h4v1h-4zM0,14h3v1h-3zM4,14h5v1h-5zM10,14h2v1h-2zM13,14h2v1h-2zM18,14h1v1h-1zM20,14h1v1h-1zM22,14h1v1h-1zM24,14h5v1h-5zM2,15h1v1h-1zM4,15h2v1h-2zM7,15h1v1h-1zM9,15h1v1h-1zM11,15h5v1h-5zM17,15h2v1h-2zM22,15h2v1h-2zM25,15h1v1h-1zM27,15h1v1h-1zM2,16h2v1h-2zM5,16h4v1h-4zM10,16h3v1h-3zM15,16h1v1h-1zM17,16h1v1h-1zM20,16h2v1h-2zM27,16h1v1h-1zM1,17h2v1h-2zM7,17h2v1h-2zM10,17h5v1h-5zM16,17h2v1h-2zM22,17h2v1h-2zM25,17h1v1h-1zM28,17h1v1h-1zM0,18h1v1h-1zM3,18h1v1h-1zM6,18h3v1h-3zM10,18h1v1h-1zM14,18h1v1h-1zM17,18h2v1h-2zM21,18h4v1h-4zM27,18h2v1h-2zM5,19h1v1h-1zM10,19h3v1h-3zM14,19h6v1h-6zM22,19h2v1h-2zM27,19h2v1h-2zM0,20h1v1h-1zM2,20h1v1h-1zM4,20h3v1h-3zM8,20h3v1h-3zM12,20h4v1h-4zM20,20h5v1h-5zM26,20h1v1h-1zM8,21h3v1h-3zM16,21h1v1h-1zM20,21h1v1h-1zM24,21h1v1h-1zM26,21h3v1h-3zM0,22h7v1h-7zM8,22h1v1h-1zM12,22h2v1h-2zM16,22h1v1h-1zM18,22h1v1h-1zM20,22h1v1h-1zM22,22h1v1h-1zM24,22h1v1h-1zM27,22h1v1h-1zM0,23h1v1h-1zM6,23h1v1h-1zM10,23h1v1h-1zM12,23h5v1h-5zM18,23h1v1h-1zM20,23h1v1h-1zM24,23h3v1h-3zM28,23h1v1h-1zM0,24h1v1h-1zM2,24h3v1h-3zM6,24h1v1h-1zM9,24h1v1h-1zM13,24h1v1h-1zM16,24h3v1h-3zM20,24h5v1h-5zM28,24h1v1h-1zM0,25h1v1h-1zM2,25h3v1h-3zM6,25h1v1h-1zM8,25h1v1h-1zM12,25h2v1h-2zM20,25h1v1h-1zM22,25h5v1h-5zM0,26h1v1h-1zM2,26h3v1h-3zM6,26h1v1h-1zM11,26h1v1h-1zM14,26h1v1h-1zM17,26h1v1h-1zM19,26h2v1h-2zM24,26h3v1h-3zM28,26h1v1h-1zM0,27h1v1h-1zM6,27h1v1h-1zM8,27h6v1h-6zM17,27h6v1h-6zM24,27h1v1h-1zM27,27h1v1h-1zM0,28h7v1h-7zM8,28h1v1h-1zM12,28h1v1h-1zM15,28h1v1h-1zM17,28h1v1h-1zM19,28h3v1h-3zM23,28h2v1h-2zM27,28h1v1h-1z" fill="currentColor"/></svg>';

    function __wkGetLastWallet() {
      try { return localStorage.getItem(__wkLastWalletKey) || ''; } catch (_e) { return ''; }
    }

	    function __wkSetLastWallet(name) {
	      try { localStorage.setItem(__wkLastWalletKey, name); } catch (_e) {}
	    }

	    function __wkWalletNameKey(name) {
	      var normalized = String(name || '').trim().toLowerCase();
	      if (!normalized) return '';
	      normalized = normalized.replace(/[^a-z0-9]+/g, ' ').trim();
	      if (!normalized) return '';
	      if (normalized.slice(-7) === ' wallet') {
	        normalized = normalized.slice(0, -7).trim();
	      }
	      return normalized.replace(/\\s+/g, '');
	    }

	    var __wkKnownAliasGroups = [
	      ['slush', 'sui', 'suiwallet', 'slushwallet', 'mystenwallet'],
	      ['suiet', 'suietwallet'],
	      ['phantom', 'phantomwallet'],
	      ['backpack', 'backpackwallet'],
	    ];

	    function __wkWalletKeysRelated(a, b) {
	      if (!a || !b) return false;
	      if (a === b) return true;
	      for (var g = 0; g < __wkKnownAliasGroups.length; g++) {
	        var group = __wkKnownAliasGroups[g];
	        var hasA = false, hasB = false;
	        for (var i = 0; i < group.length; i++) {
	          if (group[i] === a) hasA = true;
	          if (group[i] === b) hasB = true;
	        }
	        if (hasA && hasB) return true;
	      }
	      if (a.length >= 5 && b.length >= 5) {
	        return a.indexOf(b) !== -1 || b.indexOf(a) !== -1;
	      }
	      return false;
	    }

	    var __wkWaaPMethodByAddressKey = 'sui_ski_waap_method_by_address_v1';
	    var __wkPendingWaaPMethod = '';
	    var __wkWaaPMethodLabels = {
	      x: 'X',
	      phone: 'Phone',
	      email: 'Email',
	      google: 'Google',
	      coinbase: 'Coinbase',
	      discord: 'Discord',
	    };

	    function __wkNormalizeWaaPMethod(method) {
	      var key = String(method || '').trim().toLowerCase();
	      return __wkWaaPMethodLabels[key] ? key : '';
	    }

	    function __wkRememberPendingWaaPMethod(method) {
	      __wkPendingWaaPMethod = __wkNormalizeWaaPMethod(method);
	    }

	    function __wkReadSessionWalletName() {
	      try {
	        if (typeof getWalletSession !== 'function') return '';
	        var session = getWalletSession();
	        return session && session.walletName ? String(session.walletName) : '';
	      } catch (_e) {
	        return '';
	      }
	    }

	    function __wkGetConnectionWalletName(conn) {
	      if (conn && conn.wallet && conn.wallet.name) return String(conn.wallet.name);
	      if (SuiWalletKit.__sessionWalletName) return String(SuiWalletKit.__sessionWalletName);
	      return __wkReadSessionWalletName();
	    }

	    function __wkGetWaaPMethodMap() {
	      try {
	        var raw = localStorage.getItem(__wkWaaPMethodByAddressKey);
	        if (!raw) return {};
	        var parsed = JSON.parse(raw);
	        return parsed && typeof parsed === 'object' ? parsed : {};
	      } catch (_e) {
	        return {};
	      }
	    }

	    function __wkSetWaaPMethodMap(map) {
	      try {
	        localStorage.setItem(__wkWaaPMethodByAddressKey, JSON.stringify(map || {}));
	      } catch (_e) {}
	    }

	    function __wkSaveWaaPMethodForAddress(address, method) {
	      var normalizedAddress = __wkNormalizeSuiAddress(address).toLowerCase();
	      var normalizedMethod = __wkNormalizeWaaPMethod(method);
	      if (!normalizedAddress || !normalizedMethod) return;
	      var map = __wkGetWaaPMethodMap();
	      map[normalizedAddress] = normalizedMethod;
	      __wkSetWaaPMethodMap(map);
	    }

	    function __wkGetWaaPMethodForAddress(address) {
	      var normalizedAddress = __wkNormalizeSuiAddress(address).toLowerCase();
	      if (!normalizedAddress) return '';
	      var map = __wkGetWaaPMethodMap();
	      return __wkNormalizeWaaPMethod(map[normalizedAddress]);
	    }

	    var __wkWaaPLabelByAddressKey = 'sui_ski_waap_label_by_address_v1';

	    function __wkGetWaaPLabelMap() {
	      try {
	        var raw = localStorage.getItem(__wkWaaPLabelByAddressKey);
	        if (!raw) return {};
	        var parsed = JSON.parse(raw);
	        return parsed && typeof parsed === 'object' ? parsed : {};
	      } catch (_e) {
	        return {};
	      }
	    }

	    function __wkSaveWaaPLabelForAddress(address, label) {
	      var normalizedAddress = __wkNormalizeSuiAddress(address).toLowerCase();
	      if (!normalizedAddress || !label) return;
	      try {
	        var map = __wkGetWaaPLabelMap();
	        map[normalizedAddress] = String(label).trim();
	        localStorage.setItem(__wkWaaPLabelByAddressKey, JSON.stringify(map));
	      } catch (_e) {}
	    }

	    function __wkGetWaaPLabelForAddress(address) {
	      var normalizedAddress = __wkNormalizeSuiAddress(address).toLowerCase();
	      if (!normalizedAddress) return '';
	      var map = __wkGetWaaPLabelMap();
	      return typeof map[normalizedAddress] === 'string' ? map[normalizedAddress] : '';
	    }

	    function __wkPersistPendingWaaPMethod(address) {
	      if (!__wkPendingWaaPMethod) return;
	      __wkSaveWaaPMethodForAddress(address, __wkPendingWaaPMethod);
	      __wkPendingWaaPMethod = '';
	    }

	    function __wkMethodFromWaaPLabel(label) {
	      var raw = String(label || '').trim().toLowerCase();
	      if (!raw) return '';
	      if (raw === 'x' || raw === 'twitter' || raw.indexOf(' x ') !== -1 || raw.indexOf('twitter') !== -1) return 'x';
	      if (raw.indexOf('google') !== -1 || raw.indexOf('gmail') !== -1) return 'google';
	      if (raw.indexOf('discord') !== -1) return 'discord';
	      if (raw.indexOf('coinbase') !== -1) return 'coinbase';
	      if (raw.indexOf('email') !== -1 || raw.indexOf('mail') !== -1) return 'email';
	      if (raw.indexOf('phone') !== -1 || raw.indexOf('sms') !== -1) return 'phone';
	      return '';
	    }

	    function __wkResolveWaaPMethod(conn) {
	      if (!conn || !conn.address) return __wkPendingWaaPMethod || '';
	      var method = __wkGetWaaPMethodForAddress(conn.address) || __wkPendingWaaPMethod;
	      if (method) return method;
	      var liveLabel = (conn.account && typeof conn.account.label === 'string') ? conn.account.label : '';
	      method = __wkMethodFromWaaPLabel(liveLabel);
	      if (method) {
	        __wkSaveWaaPMethodForAddress(conn.address, method);
	        return method;
	      }
	      var savedLabel = __wkGetWaaPLabelForAddress(conn.address);
	      method = __wkMethodFromWaaPLabel(savedLabel);
	      if (method) {
	        __wkSaveWaaPMethodForAddress(conn.address, method);
	        return method;
	      }
	      return '';
	    }

	    function __wkGetWaaPConnectionHint(conn) {
	      var walletName = __wkGetConnectionWalletName(conn).trim().toLowerCase();
	      if (walletName !== 'waap') return '';
	      var method = __wkResolveWaaPMethod(conn);
	      var methodLabel = method ? (__wkWaaPMethodLabels[method] || '') : '';
	      return methodLabel ? ('WaaP via ' + methodLabel) : 'WaaP connected';
	    }

    function __wkHasPasskeySupport() {
      try {
        return typeof window.PublicKeyCredential !== 'undefined'
          && !!navigator.credentials
          && typeof navigator.credentials.create === 'function';
      } catch (e) {
        return false;
      }
    }

    function __wkInstallLinksHtml() {
      return '<div class="wk-no-wallets">'
        + 'No wallets detected.'
        + '</div>';
    }

    function __wkEnsureSocialSectionStructure(container) {
      if (!container) return null;
      var socialEl = container.querySelector('.wk-social-section');
      if (!socialEl) return null;
      var grid = socialEl.querySelector('.wk-social-grid');
      if (!grid) {
        socialEl.innerHTML = '<div class="wk-social-grid"></div>'
          + '<a class="wk-powered-pill" href="https://waap.sui.ski" target="_blank" rel="noopener"><img src="' + __wkWaaPIcon + '" alt="WaaP"> powered by WaaP</a>';
      }
      return socialEl;
    }

    function __wkFormatConnectError(err, walletName) {
      var message = '';
      if (err && typeof err.message === 'string' && err.message) {
        message = String(err.message);
      } else if (typeof err === 'string') {
        message = err;
      } else if (err && typeof err.name === 'string' && err.name) {
        message = err.name;
      } else {
        message = 'Connection failed';
      }
      var lower = message.toLowerCase();
      if (
        lower.indexOf('not been authorized') !== -1
        || lower.indexOf('not authorized') !== -1
        || lower.indexOf('unauthorized') !== -1
        || lower.indexOf('something went wrong') !== -1
      ) {
        if (walletName === 'Phantom') {
          return 'Phantom has not authorized Sui accounts for this site yet. Open Phantom app permissions for this site, allow Sui account access, then retry.';
        }
      }
      if (
        walletName === 'Passkey Wallet'
        && (
        lower.indexOf('unexpected') !== -1
        || lower.indexOf('notallowederror') !== -1
        || lower.indexOf('invalidstateerror') !== -1
        )
      ) {
        return 'Passkey setup failed. Use a supported browser profile with passkeys enabled and try again.';
      }
      return message;
    }

    function __wkShowConnectError(containerEl, err, walletName) {
      containerEl.innerHTML = '<div class="wk-detecting" style="color:#f87171;text-align:center;font-size:0.82rem;line-height:1.5;">'
        + __wkFormatConnectError(err, walletName)
        + '<br><button type="button" class="wk-retry-btn">Try Again</button>'
        + '</div>';
      var retryBtn = containerEl.querySelector('.wk-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          __wkEnsureSocialSectionStructure(__wkModalContainer);
          __wkPopulateModal();
        });
      }
    }

    function __wkFindWaaPWallet() {
      var sources = [SuiWalletKit.$wallets.value || []];
      try {
        var api = typeof getWallets === 'function' ? getWallets() : null;
        if (api) sources.push(api.get());
      } catch (e) {}
      for (var s = 0; s < sources.length; s++) {
        var list = sources[s];
        for (var i = 0; i < list.length; i++) {
          var name = list[i].name ? String(list[i].name).toLowerCase() : '';
          if (name === 'waap') return list[i];
        }
      }
      return null;
    }

	    function __wkConnectWaaPSocial(wallets, waapMethod) {
	      __wkRememberPendingWaaPMethod(waapMethod);
	      if (__wkIsSubdomain()) {
	        __wkConnectWaaPViaBridge(waapMethod);
	        return;
	      }
      var waapWallet = __wkFindWaaPWallet();
      if (!waapWallet) {
        var socialSection = __wkModalContainer && __wkModalContainer.querySelector('.wk-social-section');
        if (socialSection) {
          __wkShowConnectError(socialSection, { message: 'WaaP wallet is still loading, please try again' }, 'WaaP');
        }
        return;
      }
	      SuiWalletKit.closeModal();
	      SuiWalletKit.connect(waapWallet).then(function() {
	        var conn = SuiWalletKit.$connection.value || null;
	        if (conn && conn.address) {
	          __wkPersistPendingWaaPMethod(conn.address);
	          if (conn.account && typeof conn.account.label === 'string' && conn.account.label.trim()) {
	            __wkSaveWaaPLabelForAddress(conn.address, conn.account.label.trim());
	          }
	        }
	        __wkSetLastWallet('WaaP');
	      }).catch(function(err) {
	        __wkPendingWaaPMethod = '';
	        SuiWalletKit.openModal();
	        setTimeout(function() {
	          var socialSection = __wkModalContainer && __wkModalContainer.querySelector('.wk-social-section');
          if (socialSection) {
            __wkShowConnectError(socialSection, err, 'WaaP');
          }
        }, 100);
      });
    }

	    function __wkConnectWaaPViaBridge(waapMethod) {
	      __wkRememberPendingWaaPMethod(waapMethod);
	      SuiWalletKit.closeModal();
      var bridge = SuiWalletKit.__skiSignFrame;
      var bridgeReady = SuiWalletKit.__skiSignReady;
      if (!bridge) {
        SuiWalletKit.__initSignBridge();
        bridge = SuiWalletKit.__skiSignFrame;
        bridgeReady = SuiWalletKit.__skiSignReady;
      }
      var requestId = 'waap-' + Date.now();
      (bridgeReady || Promise.resolve(true)).then(function(ready) {
        if (!ready || !bridge || !bridge.contentWindow) {
          SuiWalletKit.openModal();
          return;
        }
	        bridge.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:13001;border:none;background:transparent;';
        bridge.contentWindow.postMessage({
          type: 'ski:connect-waap',
          requestId: requestId
        }, 'https://sui.ski');
        var timeout = setTimeout(function() {
          cleanup();
          bridge.style.cssText = __wkBridgeHiddenStyle;
          SuiWalletKit.openModal();
        }, 120000);
        function cleanup() {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
        }
        function handleResponse(ev) {
          if (ev.origin !== 'https://sui.ski') return;
          if (!ev.data || ev.data.requestId !== requestId) return;
	          if (ev.data.type === 'ski:connected') {
	            cleanup();
	            bridge.style.cssText = __wkBridgeHiddenStyle;
	            SuiWalletKit.initFromSession(ev.data.address, 'WaaP');
	            __wkPersistPendingWaaPMethod(ev.data.address);
	            __wkSetLastWallet('WaaP');
	            if (typeof connectWalletSession === 'function') {
	              connectWalletSession('WaaP', ev.data.address);
	            }
	          } else if (ev.data.type === 'ski:connect-error') {
	            __wkPendingWaaPMethod = '';
	            cleanup();
	            bridge.style.cssText = __wkBridgeHiddenStyle;
	            SuiWalletKit.openModal();
            setTimeout(function() {
              var socialSection = __wkModalContainer && __wkModalContainer.querySelector('.wk-social-section');
              if (socialSection) {
                __wkShowConnectError(socialSection, { message: ev.data.error }, 'WaaP');
              }
            }, 100);
          }
        }
        window.addEventListener('message', handleResponse);
      });
    }

    function __wkRenderSocialSection(container, wallets) {
      var dividerEl = container.querySelector('.wk-divider');
      var socialEl = __wkEnsureSocialSectionStructure(container);
      if (!socialEl) return;

      socialEl.style.display = '';
      if (dividerEl) dividerEl.style.display = '';

      var grid = socialEl.querySelector('.wk-social-grid');
      if (!grid) return;

      var socialOptions = [
        { key: 'x', label: 'X', sep: false },
        { key: 'google', label: 'Google', sep: false },
        { key: 'email', label: 'Email', sep: true },
        { key: 'discord', label: 'Discord', sep: false },
        { key: 'coinbase', label: 'Coinbase', sep: false },
        { key: 'phone', label: 'Phone', sep: true }
      ];

      grid.innerHTML = '';
      for (var s = 0; s < socialOptions.length; s++) {
        (function(opt) {
          var btn = document.createElement('button');
          btn.className = 'wk-social-btn' + (opt.sep ? ' wk-sep-left' : '');
          btn.innerHTML = (__wkSocialIcons[opt.key] || '') + '<span>' + opt.label + '</span>';
          btn.addEventListener('click', function() {
            var waapLoading = typeof __wkWaaPLoading !== 'undefined' ? __wkWaaPLoading : (window.__wkWaaPLoading || null);
            if (waapLoading) {
              btn.disabled = true;
              btn.style.opacity = '0.6';
              waapLoading.then(function() {
                btn.disabled = false;
                btn.style.opacity = '';
	                __wkConnectWaaPSocial(SuiWalletKit.$wallets.value || wallets, opt.key);
	              }).catch(function() {
	                btn.disabled = false;
	                btn.style.opacity = '';
	              });
	            } else {
	              __wkConnectWaaPSocial(wallets, opt.key);
	            }
	          });
          grid.appendChild(btn);
        })(socialOptions[s]);
      }
    }

	    function __wkSortWithRecent(wallets) {
	      var lastWalletName = __wkWalletNameKey(__wkGetLastWallet());
	      if (!lastWalletName) return wallets;
      var recent = [];
      var rest = [];
      for (var i = 0; i < wallets.length; i++) {
        var wName = __wkWalletNameKey(wallets[i].name);
        if (wName === lastWalletName) {
          recent.push(wallets[i]);
        } else {
          rest.push(wallets[i]);
        }
      }
	      return recent.concat(rest);
	    }

	    var __wkKnownWalletRows = [
	      {
	        key: 'phantom',
	        name: 'Phantom',
	        installUrl: 'https://phantom.app/download',
	        icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b6a4ff"/><stop offset="1" stop-color="#7c6dff"/></linearGradient></defs><rect width="40" height="40" rx="12" fill="url(#p)"/><path fill="#fff" d="M9 20c0-4.8 3.9-8.7 8.7-8.7H26c2.8 0 5 2.2 5 5v9.5c0 1.6-1.3 2.9-2.9 2.9H17.7C12.9 28.7 9 24.8 9 20z"/></svg>'),
	      },
	      {
	        key: 'backpack',
	        name: 'Backpack',
	        installUrl: 'https://backpack.app',
	        icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="12" fill="#ef4444"/><path fill="#111827" d="M14 14h12a4 4 0 014 4v10H10V18a4 4 0 014-4z"/><rect x="16" y="10" width="8" height="4" rx="2" fill="#111827"/><rect x="14" y="20" width="12" height="2.4" rx="1.2" fill="#9ca3af"/></svg>'),
	      },
	      {
	        key: 'slush',
	        name: 'Slush',
	        installUrl: 'https://slush.app',
	        icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="12" fill="#0b1022"/><circle cx="20" cy="20" r="12" fill="#111827" stroke="#9ca3af" stroke-width="1.5"/><path d="M14 23c2.8 3.6 9.2 3.1 12-0.4M14 17.4c2.8-3.6 9.2-3.1 12 0.4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>'),
	      },
	      {
	        key: 'slushwallet',
	        name: 'Slush Wallet',
	        installUrl: 'https://slush.app',
	        icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="12" fill="#0b1022"/><circle cx="20" cy="20" r="12" fill="#111827" stroke="#9ca3af" stroke-width="1.5"/><path d="M14 23c2.8 3.6 9.2 3.1 12-0.4M14 17.4c2.8-3.6 9.2-3.1 12 0.4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>'),
	      },
	      {
	        key: 'suiet',
	        name: 'Suiet',
	        installUrl: 'https://suiet.app',
	        icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5fb8ff"/><stop offset="1" stop-color="#2b7fff"/></linearGradient></defs><rect width="40" height="40" rx="12" fill="url(#s)"/><circle cx="20" cy="20" r="11" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M12.5 23.5c2-1.3 3.8-1.3 5.8 0 2-1.3 3.8-1.3 5.8 0 2-1.3 3.8-1.3 5.8 0" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>'),
	      },
	    ];

	    function __wkKnownWalletIconByName(name) {
	      var key = __wkWalletNameKey(name);
	      if (!key) return '';
	      for (var i = 0; i < __wkKnownWalletRows.length; i++) {
	        if (__wkKnownWalletRows[i].key === key) return __wkKnownWalletRows[i].icon;
	      }
	      return '';
	    }

	    function __wkFindDetectedWalletByKey(targetKey) {
	      if (!targetKey) return null;
	      var sources = [
	        SuiWalletKit.$wallets.value || [],
	        __wkReadDetectedWalletCache(__wkDetectedWalletCacheKey),
	        __wkReadDetectedWalletCache(__wkBridgeDetectedWalletCacheKey),
	        __wkGetBridgeWalletSnapshot(),
	      ];
	      var best = null;
	      for (var s = 0; s < sources.length; s++) {
	        var list = Array.isArray(sources[s]) ? sources[s] : [];
	        for (var i = 0; i < list.length; i++) {
	          var wallet = list[i];
	          if (!wallet || !wallet.name) continue;
	          var key = __wkWalletNameKey(wallet.name);
	          if (!key || !__wkWalletKeysRelated(key, targetKey)) continue;
	          var candidate = {
	            name: String(wallet.name),
	            icon: wallet.icon ? String(wallet.icon) : '',
	          };
	          if (key === targetKey && candidate.icon) return candidate;
	          if (!best || (!best.icon && candidate.icon) || (key === targetKey && !best.keyExact)) {
	            best = {
	              name: candidate.name,
	              icon: candidate.icon,
	              keyExact: key === targetKey,
	            };
	          }
	        }
	      }
	      if (!best) return null;
	      return {
	        name: best.name,
	        icon: best.icon,
	      };
	    }

	    function __wkResolveWidgetWallet(conn) {
	      var walletName = __wkGetConnectionWalletName(conn);
	      var walletIcon = conn && conn.wallet && conn.wallet.icon ? String(conn.wallet.icon) : '';
	      var walletKey = __wkWalletNameKey(walletName);
	      if (walletKey) {
	        var matched = __wkFindDetectedWalletByKey(walletKey);
	        if (matched) {
	          if (!walletName && matched.name) walletName = matched.name;
	          if (!walletIcon && matched.icon) walletIcon = matched.icon;
	        }
	      } else {
	        var remembered = __wkGetLastWallet();
	        var rememberedKey = __wkWalletNameKey(remembered);
	        if (rememberedKey) {
	          var rememberedMatch = __wkFindDetectedWalletByKey(rememberedKey);
	          if (rememberedMatch) {
	            walletName = rememberedMatch.name || remembered;
	            if (!walletIcon && rememberedMatch.icon) walletIcon = rememberedMatch.icon;
	          } else {
	            walletName = remembered;
	          }
	        }
	      }
	      if (!walletIcon && walletName) {
	        walletIcon = __wkKnownWalletIconByName(walletName);
	      }
	      return {
	        name: walletName,
	        icon: walletIcon,
	      };
	    }

	    function __wkResolveWalletIcon(wallet) {
	      var name = wallet && wallet.name ? String(wallet.name) : '';
	      var knownIcon = __wkKnownWalletIconByName(name);
	      var walletIcon = wallet && wallet.icon ? String(wallet.icon) : '';
	      return walletIcon || knownIcon || __wkDefaultIcon();
	    }

	    function __wkBuildWalletDisplayList(wallets) {
	      var input = Array.isArray(wallets) ? wallets : [];
	      var byKey = {};
	      var order = [];
	      for (var i = 0; i < input.length; i++) {
	        var wallet = input[i];
	        if (!wallet || !wallet.name) continue;
	        var key = __wkWalletNameKey(wallet.name);
	        if (!key) key = 'wallet-' + i;
	        var existing = byKey[key];
	        if (!existing) {
	          byKey[key] = wallet;
	          order.push(key);
	          continue;
	        }
	        if ((!existing.icon || String(existing.icon).trim() === '') && wallet.icon) {
	          existing.icon = wallet.icon;
	        }
	      }
	      var rows = [];
	      for (var o = 0; o < order.length; o++) {
	        if (byKey[order[o]]) rows.push(byKey[order[o]]);
	      }
	      return rows;
	    }

	    function __wkCombineWalletSources(localWallets, bridgeWallets) {
	      var local = Array.isArray(localWallets) ? localWallets : [];
	      var bridge = Array.isArray(bridgeWallets) ? bridgeWallets : [];
	      if (local.length === 0) return __wkBuildWalletDisplayList(bridge);
	      if (bridge.length === 0) return __wkBuildWalletDisplayList(local);
	      return __wkBuildWalletDisplayList(local.concat(bridge));
	    }

	    function __wkRememberDetectedWallets(wallets, bridgeOnly) {
	      var current = Array.isArray(wallets) ? wallets : [];
	      if (current.length === 0) return;
	      var cacheKey = bridgeOnly ? __wkBridgeDetectedWalletCacheKey : __wkDetectedWalletCacheKey;
	      var cached = __wkReadDetectedWalletCache(cacheKey);
	      var merged = __wkCombineWalletSources(current, cached);
	      __wkWriteDetectedWalletCache(merged, cacheKey);
	    }

	    function __wkCollectBridgeWalletHints(walletsInput) {
	      var out = [];
	      var byKey = {};
	      var sources = [];
	      if (Array.isArray(walletsInput)) sources.push(walletsInput);
	      sources.push(SuiWalletKit.$wallets.value || []);
	      sources.push(__wkReadDetectedWalletCache(__wkDetectedWalletCacheKey));
	      for (var s = 0; s < sources.length; s++) {
	        var list = Array.isArray(sources[s]) ? sources[s] : [];
	        for (var i = 0; i < list.length; i++) {
	          var wallet = list[i];
	          if (!wallet || !wallet.name) continue;
	          var name = String(wallet.name);
	          var key = __wkWalletNameKey(name);
	          if (!key) key = 'wallet-' + s + '-' + i;
	          var icon = wallet.icon ? String(wallet.icon) : '';
	          if (!icon) icon = __wkKnownWalletIconByName(name);
	          var existing = byKey[key];
	          if (!existing) {
	            existing = {
	              name: name,
	              icon: icon,
	              __isPasskey: !!wallet.__isPasskey,
	            };
	            byKey[key] = existing;
	            out.push(existing);
	            continue;
	          }
	          if (!existing.icon && icon) existing.icon = icon;
	          if (existing.__isPasskey && !wallet.__isPasskey) existing.__isPasskey = false;
	        }
	      }
	      return out;
	    }

	    function __wkBridgeWalletHintSignature(wallets) {
	      var list = Array.isArray(wallets) ? wallets : [];
	      var parts = [];
	      for (var i = 0; i < list.length; i++) {
	        var wallet = list[i];
	        if (!wallet || !wallet.name) continue;
	        parts.push(
	          __wkWalletNameKey(wallet.name)
	          + '|' + String(wallet.icon || '')
	          + '|' + (wallet.__isPasskey ? '1' : '0')
	        );
	      }
	      return parts.join(',');
	    }

	    function __wkSendBridgeWalletHints(walletsInput, force) {
	      if (!__wkIsSubdomain()) return [];
	      var hints = __wkCollectBridgeWalletHints(walletsInput);
	      if (hints.length === 0) return [];
	      var signature = __wkBridgeWalletHintSignature(hints);
	      if (!force && signature && signature === __wkLastBridgeHintSignature) return hints;
	      var bridge = SuiWalletKit.__skiSignFrame;
	      var bridgeReady = SuiWalletKit.__skiSignReady;
	      if (!bridge) {
	        SuiWalletKit.__initSignBridge();
	        bridge = SuiWalletKit.__skiSignFrame;
	        bridgeReady = SuiWalletKit.__skiSignReady;
	      }
	      (bridgeReady || Promise.resolve(true)).then(function(ready) {
	        if (!ready || !bridge || !bridge.contentWindow) return;
	        __wkLastBridgeHintSignature = signature;
	        bridge.contentWindow.postMessage({
	          type: 'ski:wallet-hints',
	          wallets: hints,
	        }, 'https://sui.ski');
	      }).catch(function() {});
	      return hints;
	    }

	    function __wkFetchWalletsViaBridge() {
      var bridge = SuiWalletKit.__skiSignFrame;
      var bridgeReady = SuiWalletKit.__skiSignReady;
      if (!bridge) {
        SuiWalletKit.__initSignBridge();
        bridge = SuiWalletKit.__skiSignFrame;
        bridgeReady = SuiWalletKit.__skiSignReady;
      }
      var walletHints = __wkSendBridgeWalletHints();
      var requestId = 'wallets-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      return new Promise(function(resolve, reject) {
        (bridgeReady || Promise.resolve(true)).then(function(ready) {
          if (!ready || !bridge || !bridge.contentWindow) {
            reject(new Error('Bridge not available'));
            return;
          }
          var timeout = setTimeout(function() {
            cleanup();
            reject(new Error('Wallet discovery timed out'));
          }, 12000);
          function cleanup() {
            clearTimeout(timeout);
            window.removeEventListener('message', handleResponse);
          }
          function handleResponse(ev) {
            if (ev.origin !== 'https://sui.ski') return;
            if (!ev.data || ev.data.requestId !== requestId) return;
            if (ev.data.type === 'ski:wallets-result') {
              cleanup();
              resolve(Array.isArray(ev.data.wallets) ? ev.data.wallets : []);
            } else if (ev.data.type === 'ski:wallets-error') {
              cleanup();
              reject(new Error(ev.data.error || 'Wallet discovery failed'));
            }
          }
          window.addEventListener('message', handleResponse);
          bridge.contentWindow.postMessage({
            type: 'ski:wallets',
            requestId: requestId,
            walletHints: walletHints,
          }, 'https://sui.ski');
        }).catch(reject);
      });
    }

    function __wkRenderWalletItems(listEl, wallets) {
      if (!wallets || wallets.length === 0) {
        try {
          listEl.classList.add('wk-wallet-list-no-scroll');
          listEl.classList.remove('wk-wallet-list-scroll');
        } catch (_e) {}
        listEl.innerHTML = __wkInstallLinksHtml();
        return;
      }
      var lastWalletName = __wkWalletNameKey(__wkGetLastWallet());
      var sorted = __wkBuildWalletDisplayList(__wkSortWithRecent(wallets));
      var shouldScrollWallets = sorted.length >= 5;
      try {
        listEl.classList.toggle('wk-wallet-list-no-scroll', !shouldScrollWallets);
        listEl.classList.toggle('wk-wallet-list-scroll', shouldScrollWallets);
      } catch (_e) {}
      var isSubdomain = __wkIsSubdomain();
      listEl.innerHTML = '';
      for (var i = 0; i < sorted.length; i++) {
        (function(wallet) {
          var item = document.createElement('button');
          item.className = 'wk-wallet-item';
          var name = wallet.name || 'Unknown';
          var iconSrc = __wkResolveWalletIcon(wallet);
          var fallbackIcon = __wkKnownWalletIconByName(name) || __wkDefaultIcon();
          var isRecent = lastWalletName && __wkWalletNameKey(name) === lastWalletName;
	          item.innerHTML = '<img alt="">'
	            + '<span class="wk-wallet-name">' + name + '</span>'
	            + (isRecent ? '<span class="wk-recent-badge">Recent</span>' : '');
	          var iconEl = item.querySelector('img');
	          if (iconEl) {
	            iconEl.src = iconSrc;
	            iconEl.addEventListener('error', function() {
	              if (iconEl.getAttribute('data-fallback') === '1') {
	                iconEl.style.display = 'none';
	                return;
	              }
	              iconEl.setAttribute('data-fallback', '1');
	              iconEl.src = fallbackIcon;
	            });
	          }
				          item.addEventListener('click', function() {
				            listEl.innerHTML = '<div class="wk-detecting"><div class="wk-spinner"></div> Connecting...</div>';
				            var targetKey = __wkWalletNameKey(name);
				            var isSlushFamily = __wkWalletKeysRelated(targetKey, 'slush');
				            var connectWithTarget = function(targetWallet) {
				              SuiWalletKit.connect(targetWallet).then(function() {
				                __wkSetLastWallet(name);
				              }).catch(function(err) {
				                __wkShowConnectError(listEl, err, name);
				              });
				            };
				            var pickTargetFromCurrentWallets = function() {
				              var target = wallet;
				              var currentWallets = SuiWalletKit.$wallets.value || [];
				              for (var cw = 0; cw < currentWallets.length; cw++) {
				                var cwKey = __wkWalletNameKey(currentWallets[cw].name);
				                if (cwKey && targetKey && __wkWalletKeysRelated(cwKey, targetKey)) {
				                  target = currentWallets[cw];
				                  break;
				                }
				              }
				              return target;
				            };
				            if (!isSlushFamily) {
				              connectWithTarget(pickTargetFromCurrentWallets());
				              return;
				            }
				            Promise.resolve().then(function() {
				              return typeof SuiWalletKit.detectWallets === 'function'
				                ? SuiWalletKit.detectWallets().catch(function() { return []; })
				                : [];
				            }).then(function() {
				              var localTarget = pickTargetFromCurrentWallets();
				              var localTargetKey = __wkWalletNameKey(localTarget && localTarget.name ? localTarget.name : '');
				              if (localTargetKey && __wkWalletKeysRelated(localTargetKey, 'slush')) {
				                connectWithTarget(localTarget);
				                return;
				              }
				              var provider = (window.slush && (window.slush.sui || window.slush.wallet || window.slush))
				                || ((window.sui && !window.sui.isPhantom) ? window.sui : null);
				              if (!provider || typeof provider !== 'object') {
				                throw new Error('Slush extension not detected in this page context');
				              }
				              var source = provider.sui && typeof provider.sui === 'object' ? provider.sui : provider;
				              var connectFeature = source.features && source.features['standard:connect']
				                ? source.features['standard:connect']
				                : (typeof source.connect === 'function'
				                    ? { connect: source.connect.bind(source) }
				                    : (typeof source.requestAccounts === 'function'
				                        ? { connect: source.requestAccounts.bind(source) }
				                        : (typeof source.requestAccount === 'function'
				                            ? { connect: source.requestAccount.bind(source) }
				                            : undefined)));
				              if (!connectFeature) {
				                throw new Error('Slush extension detected but no connect method is available');
				              }
				              connectWithTarget({
				                name: name,
				                icon: source.icon || iconSrc || fallbackIcon,
				                chains: ['sui:mainnet', 'sui:testnet', 'sui:devnet'],
				                features: {
				                  'standard:connect': connectFeature,
				                  'standard:disconnect': typeof source.disconnect === 'function'
				                    ? { disconnect: source.disconnect.bind(source) }
				                    : undefined,
				                  'sui:signAndExecuteTransaction': typeof source.signAndExecuteTransaction === 'function'
				                    ? { signAndExecuteTransaction: source.signAndExecuteTransaction.bind(source) }
				                    : undefined,
				                  'sui:signAndExecuteTransactionBlock': typeof source.signAndExecuteTransactionBlock === 'function'
				                    ? { signAndExecuteTransactionBlock: source.signAndExecuteTransactionBlock.bind(source) }
				                    : undefined,
				                  'sui:signTransaction': typeof source.signTransaction === 'function'
				                    ? { signTransaction: source.signTransaction.bind(source) }
				                    : undefined,
				                  'sui:signPersonalMessage': typeof source.signPersonalMessage === 'function'
				                    ? { signPersonalMessage: source.signPersonalMessage.bind(source) }
				                    : undefined,
				                },
				                get accounts() {
				                  return Array.isArray(source.accounts) ? source.accounts : [];
				                },
				                _raw: source,
				              });
				            }).catch(function(err) {
				              __wkShowConnectError(listEl, err, name);
				            });
				          });
			          listEl.appendChild(item);
			        })(sorted[i]);
			      }
	    }

	    function __wkRenderSplit(wallets, options) {
	      if (!__wkModalContainer) return;
	      var listEl = __wkModalContainer.querySelector('.wk-wallet-list');
	      if (!listEl) return;
	      var bridgeOnly = !!(options && options.bridgeOnly);
	      if (Array.isArray(wallets) && wallets.length > 0) {
	        __wkRememberDetectedWallets(wallets, bridgeOnly);
	      }

      var nonWaaPWallets = [];
      for (var i = 0; i < wallets.length; i++) {
        var name = wallets[i].name ? String(wallets[i].name).toLowerCase() : '';
        if (name !== 'waap') {
          nonWaaPWallets.push(wallets[i]);
        }
      }

	      __wkRenderSocialSection(__wkModalContainer, wallets);
	      __wkRenderWalletItems(listEl, nonWaaPWallets);
	    }

	    function __wkIsModalOpen() {
	      if (!__wkModalContainer) return false;
	      var overlayEl = __wkModalContainer.querySelector('.wk-modal-overlay');
	      return !!(overlayEl && overlayEl.classList.contains('open'));
	    }

	    function __wkPopulateModal() {
	      if (!__wkModalContainer) return;
	      var listEl = __wkModalContainer.querySelector('.wk-wallet-list');
      if (!listEl) return;
      listEl.innerHTML = '<div class="wk-detecting"><div class="wk-spinner"></div> Detecting wallets...</div>';
      var isSubdomain = __wkIsSubdomain();
      var immediate = SuiWalletKit.$wallets.value;
      if (isSubdomain) {
        __wkSendBridgeWalletHints(Array.isArray(immediate) ? immediate : [], true);
      }
	      var cached = isSubdomain
	        ? __wkReadDetectedWalletCache(__wkBridgeDetectedWalletCacheKey)
	        : __wkReadDetectedWalletCache();
	      var warmWallets = isSubdomain
	        ? __wkBuildWalletDisplayList(cached)
	        : __wkCombineWalletSources(Array.isArray(immediate) ? immediate : [], cached);
	      __wkRenderSocialSection(__wkModalContainer, Array.isArray(immediate) ? immediate : []);
      if (isSubdomain && typeof SuiWalletKit.__initSignBridge === 'function') {
        try { SuiWalletKit.__initSignBridge(); } catch (_e) {}
      }
      if (isSubdomain && typeof SuiWalletKit.detectWallets === 'function') {
        SuiWalletKit.detectWallets().then(function(localWallets) {
          var hints = __wkSendBridgeWalletHints(localWallets, true);
          if (!__wkIsModalOpen()) return;
          if (hints.length > 0) {
            var hintMerged = __wkMergeBridgeWallets(hints);
            var hintAvailable = __wkBuildWalletDisplayList(hintMerged);
            if (hintAvailable.length > 0) {
              __wkRenderSplit(hintAvailable, { bridgeOnly: true });
            }
          }
        }).catch(function() {});
      }

	      if (warmWallets.length > 0 && !isSubdomain) {
	        __wkRenderSplit(warmWallets);
	      }
	      if (isSubdomain) {
	        __wkResetBridgeWalletCache();
	        var bridgeAttempts = 0;
	        function __wkPollBridge(initialAttempt) {
	          if (!__wkIsModalOpen()) return;
	          __wkFetchWalletsViaBridge().then(function(wallets) {
	            if (!__wkIsModalOpen()) return;
	            var merged = __wkMergeBridgeWallets(wallets);
	            var available = __wkBuildWalletDisplayList(merged);
	            if (available.length > 0) {
	              __wkRenderSplit(available, { bridgeOnly: true });
	            } else if (initialAttempt) {
	              listEl.innerHTML = __wkInstallLinksHtml();
	            }
	          }).catch(function() {
	            if (!__wkIsModalOpen()) return;
	            var snapshot = __wkGetBridgeWalletSnapshot();
	            var available = __wkBuildWalletDisplayList(snapshot);
	            if (available.length > 0) {
	              __wkRenderSplit(available, { bridgeOnly: true });
	            } else if (initialAttempt) {
	              listEl.innerHTML = __wkInstallLinksHtml();
	            }
	          }).finally(function() {
	            bridgeAttempts++;
	            if (bridgeAttempts < 6 && __wkIsModalOpen()) {
	              setTimeout(function() {
	                __wkPollBridge(false);
	              }, 500);
	            }
	          });
	        }
	        __wkPollBridge(true);
	        return;
	      }
	      SuiWalletKit.detectWallets().then(function(wallets) {
        if (wallets && wallets.length > 0) {
          __wkRenderSplit(wallets);
        } else if (warmWallets.length === 0) {
          listEl.innerHTML = __wkInstallLinksHtml();
        }
      }).catch(function() {
        if (warmWallets.length === 0) {
          listEl.innerHTML = __wkInstallLinksHtml();
        }
      });
    }

    SuiWalletKit.renderModal = function renderModal(containerId) {
      var container = document.getElementById(containerId);
      if (!container) throw new Error('Modal container not found: ' + containerId);
      __wkModalContainer = container;

      var __wkQrUrl = 'https://waap.sui.ski?ref=ski-keyin&src=wallet-modal';
      container.innerHTML = '<div class="wk-modal-overlay" id="__wk-overlay">'
        + '<div class="wk-modal-wrap">'
        + '<div class="wk-modal">'
        + '<div class="wk-snow-layer"></div>'
        + '<div class="wk-modal-header">'
        + '<div class="wk-modal-header-left">'
        + '<div class="wk-modal-brand-row">'
        + '<span class="wk-modal-logo">' + __wkLogoSvg + '</span>'
        + '<div class="wk-modal-title-wrap">'
        + '<h3>.Sui Key-In</h3>'
        + '<div class="wk-modal-subtitle"><span>once,</span><span>everywhere</span></div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<button class="wk-modal-close" id="__wk-close">\\u00D7</button>'
        + '</div>'
        + '<div class="wk-social-section" style="display:none">'
        + '<div class="wk-social-grid"></div>'
        + '<a class="wk-powered-pill" href="https://waap.sui.ski" target="_blank" rel="noopener"><img src="' + __wkWaaPIcon + '" alt="WaaP"> powered by WaaP</a>'
        + '</div>'
        + '<div class="wk-modal-main">'
        + '<div class="wk-waap-column">'
        + '<a class="wk-qr-link" href="' + __wkQrUrl + '" target="_blank" rel="noopener">'
        + __wkQrSvg
        + '<div class="wk-qr-center-logo"><img src="' + __wkWaaPIcon + '" alt="WaaP"></div>'
        + '</a>'
        + '<button class="wk-qr-copy" id="__wk-qr-copy" title="Copy WaaP link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>'
        + '</div>'
        + '<div class="wk-trad-column">'
        + '<div class="wk-divider" style="display:none"><span>Trad Wallet</span></div>'
        + '<div class="wk-wallet-list"></div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';

      var overlay = document.getElementById('__wk-overlay');
      var closeBtn = document.getElementById('__wk-close');

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) SuiWalletKit.closeModal();
      });
      closeBtn.addEventListener('click', function() {
        SuiWalletKit.closeModal();
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.body.classList.contains('wk-modal-open')) {
          SuiWalletKit.closeModal();
        }
      });

      var __wkCopyIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      var __wkCheckIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      function __wkBindCopy(btn) {
        if (!btn) return;
        btn.addEventListener('click', function() {
          navigator.clipboard.writeText(__wkQrUrl).then(function() {
            btn.innerHTML = __wkCheckIcon;
            btn.style.color = '#4ade80';
            setTimeout(function() { btn.innerHTML = __wkCopyIcon; btn.style.color = ''; }, 1500);
          }).catch(function() {});
        });
      }
      __wkBindCopy(document.getElementById('__wk-qr-copy'));

      if (__wkModalUnsub) __wkModalUnsub();
      __wkModalUnsub = SuiWalletKit.subscribe(SuiWalletKit.$connection, function(conn) {
        if (conn && (conn.status === 'connected' || conn.status === 'session')) {
          SuiWalletKit.closeModal();
          ${onConnect ? `if (typeof window['${onConnect}'] === 'function') window['${onConnect}']();` : ''}
        }
        if (conn && conn.status === 'disconnected') {
          ${onDisconnect ? `if (typeof window['${onDisconnect}'] === 'function') window['${onDisconnect}']();` : ''}
        }
      });
	      if (__wkModalWalletsUnsub) __wkModalWalletsUnsub();
		      __wkModalWalletsUnsub = SuiWalletKit.subscribe(SuiWalletKit.$wallets, function(wallets) {
		        if (!__wkModalContainer) return;
		        if (!__wkIsModalOpen()) return;
		        var connState = SuiWalletKit.$connection.value;
		        if (connState && connState.status === 'connecting') return;
		        if (__wkIsSubdomain()) {
		          __wkSendBridgeWalletHints(Array.isArray(wallets) ? wallets : [], true);
		          __wkFetchWalletsViaBridge().then(function(remoteWallets) {
		            if (!__wkIsModalOpen()) return;
		            var merged = __wkMergeBridgeWallets(remoteWallets);
		            var available = __wkBuildWalletDisplayList(merged);
		            if (available.length > 0) {
		              __wkRenderSplit(available, { bridgeOnly: true });
		              return;
		            }
		            var snapshot = __wkGetBridgeWalletSnapshot();
		            if (snapshot.length > 0) {
		              __wkRenderSplit(__wkBuildWalletDisplayList(snapshot), { bridgeOnly: true });
		            }
		          }).catch(function() {
		            if (!__wkIsModalOpen()) return;
		            var snapshot = __wkGetBridgeWalletSnapshot();
		            if (snapshot.length > 0) {
		              __wkRenderSplit(__wkBuildWalletDisplayList(snapshot), { bridgeOnly: true });
		            }
		          });
		          return;
		        }
	        __wkRenderSplit(Array.isArray(wallets) ? wallets : []);
	      });
	    };

	    function __wkIsSubdomain() {
	      var host = window.location.hostname;
	      return host !== 'sui.ski' && host.endsWith('.sui.ski');
	    }

	    SuiWalletKit.openModal = function openModal() {
	      if (!__wkModalContainer) return;
	      var overlay = __wkModalContainer.querySelector('.wk-modal-overlay');
	      if (overlay) {
	        overlay.classList.add('open');
	        try { document.body.classList.add('wk-modal-open'); } catch (_e) {}
	        try { document.documentElement.classList.add('wk-modal-open'); } catch (_e) {}
	        __wkPopulateModal();
	      }
	    };

	    SuiWalletKit.closeModal = function closeModal() {
	      if (!__wkModalContainer) return;
	      var overlay = __wkModalContainer.querySelector('.wk-modal-overlay');
	      if (overlay) overlay.classList.remove('open');
	      try { document.body.classList.remove('wk-modal-open'); } catch (_e) {}
	      try { document.documentElement.classList.remove('wk-modal-open'); } catch (_e) {}
	    };

		    function __wkBuildDropdownHtml(conn) {
	      var rawAddr = conn && conn.address ? conn.address : '';
	      var normalizedAddr = __wkNormalizeSuiAddress(rawAddr);
	      var addr = normalizedAddr || rawAddr;
	      var primaryName = ${showPrimaryName} ? (conn && conn.primaryName ? conn.primaryName : null) : null;
	      var connectionHint = __wkGetWaaPConnectionHint(conn);
	      var html = '';

      if (addr) {
        html += '<div style="padding:6px 10px 6px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px;cursor:pointer;" id="__wk-dd-addr-display" title="Click to copy full address">';
        html += '<div style="font-size:0.65rem;color:#e2e8f0;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px">Your Address</div>';
        html += '<div style="font-size:0.68rem;color:#94a3b8;word-break:break-all;line-height:1.35;font-family:SF Mono,Fira Code,monospace">' + __wkEscapeHtml(addr) + '</div>';
	        if (connectionHint) {
	          html += '<div style="font-size:0.62rem;margin-top:4px;color:#cbd5e1;">' + __wkEscapeHtml(connectionHint) + '</div>';
	        }
	        html += '</div>';
	      }

      if (__wkPortfolioData && __wkPortfolioData.holdings && __wkPortfolioData.holdings.length > 0) {
        var l1Holdings = __wkGetL1Holdings(__wkPortfolioData);
        if (l1Holdings.length > 0) {
          html += '<div style="padding:4px 4px 2px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px;">';
          for (var l = 0; l < l1Holdings.length; l++) {
            var l1 = l1Holdings[l];
            var l1BalFmt = __wkFormatTokenAmount(l1.balance);
            var l1UsdVal = __wkPortfolioData.usdcPerSui > 0 ? __wkFormatUsd(l1.suiValue * __wkPortfolioData.usdcPerSui) : '';
            var l1Icon = __wkL1Icons[l1.name] || '';
            var subTokens = __wkGetL1SubTokens(l1.name, __wkPortfolioData);
            var hasSubTokens = subTokens.length > 0;
            var isExpanded = !!__wkExpandedL1[l1.name];
            html += '<button class="wk-dropdown-item' + (hasSubTokens ? ' __wk-dd-l1-toggle' : '') + '" data-l1="' + __wkEscapeHtml(l1.name) + '" style="padding:6px 8px;font-size:0.76rem;justify-content:space-between;' + (hasSubTokens ? 'cursor:pointer;' : 'cursor:default;') + '">';
            html += '<span style="display:flex;align-items:center;gap:8px;">';
            html += '<span style="width:18px;text-align:center;flex-shrink:0;">' + l1Icon + '</span>';
            html += '<span style="color:#e2e8f0;font-weight:700;">' + __wkEscapeHtml(l1.name) + '</span>';
            if (hasSubTokens) {
              html += '<span style="opacity:0.5;font-size:0.6rem;margin-left:2px;">' + (isExpanded ? '\\u25B2' : '\\u25BC') + '</span>';
            }
            html += '</span>';
            html += '<span style="display:flex;flex-direction:column;align-items:flex-end;gap:1px;">';
            html += '<span style="color:#e2e8f0;font-weight:600;">' + __wkEscapeHtml(l1BalFmt) + '</span>';
            if (l1UsdVal) {
              html += '<span style="font-size:0.58rem;color:#94a3b8;">~' + __wkEscapeHtml(l1UsdVal) + '</span>';
            }
            html += '</span>';
            html += '</button>';
            if (hasSubTokens && isExpanded) {
              html += '<div style="margin:0 0 2px 28px;display:flex;flex-direction:column;gap:1px;">';
              for (var s = 0; s < subTokens.length; s++) {
                var sub = subTokens[s];
                var subBalFmt = __wkFormatTokenAmount(sub.balance);
                var subSuiVal = __wkFormatBalance(sub.suiValue);
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 8px 3px 0;font-size:0.7rem;color:#9fb0c7;">';
                html += '<span>' + __wkEscapeHtml(sub.name) + '</span>';
                html += '<span style="color:#cbd5e1;">' + __wkEscapeHtml(subBalFmt) + ' <span style="opacity:0.5;">(' + __wkEscapeHtml(subSuiVal) + __wkSuiIconSvg + ')</span></span>';
                html += '</div>';
              }
              html += '</div>';
            }
          }
          html += '</div>';
        }
      }

      html += '<button class="wk-dropdown-item" id="__wk-dd-copy" style="position:relative;">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
        + 'Copy Address</button>';

      html += '<button class="wk-dropdown-item" id="__wk-dd-switch">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>'
        + 'Switch Wallet</button>';

      html += '<button class="wk-dropdown-item disconnect" id="__wk-dd-disconnect">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
        + 'Disconnect</button>';

	      return html;
	    }

		    function __wkEscapeHtml(value) {
		      var text = String(value || '');
		      return text
		        .replace(/&/g, '&amp;')
		        .replace(/</g, '&lt;')
		        .replace(/>/g, '&gt;')
		        .replace(/"/g, '&quot;')
		        .replace(/'/g, '&#39;');
		    }

		    var __wkSuiIconSvg = '<svg viewBox="0 0 300 384" width="10" height="13" aria-hidden="true" focusable="false" style="display:inline-block;vertical-align:-2px;margin-left:4px;fill:#4DA2FF;"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z"></path></svg>';

	    function __wkBindDropdownEvents(conn) {
      var copyBtn = document.getElementById('__wk-dd-copy');
      var addrDisplay = document.getElementById('__wk-dd-addr-display');
      var l1Toggles = document.querySelectorAll('.__wk-dd-l1-toggle');
      var switchBtn = document.getElementById('__wk-dd-switch');
      var disconnectBtn = document.getElementById('__wk-dd-disconnect');

      function __wkCopyAddress(targetEl) {
        var rawAddr = conn && conn.address ? conn.address : '';
        var normalizedAddr = __wkNormalizeSuiAddress(rawAddr);
        var addr = __wkIsValidSuiAddress(normalizedAddr) ? normalizedAddr : rawAddr;
        if (!addr) return;
        navigator.clipboard.writeText(addr).then(function() {
          var flash = document.createElement('span');
          flash.className = 'wk-copied-flash';
          flash.textContent = 'Copied!';
          targetEl.appendChild(flash);
          setTimeout(function() { flash.remove(); }, 1500);
        });
      }
      if (copyBtn) {
        copyBtn.addEventListener('click', function() { __wkCopyAddress(copyBtn); });
      }
      if (addrDisplay) {
        addrDisplay.addEventListener('click', function() { __wkCopyAddress(addrDisplay); });
      }
      for (var t = 0; t < l1Toggles.length; t++) {
        (function(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var l1Name = btn.getAttribute('data-l1');
            if (!l1Name) return;
            var wasOpen = false;
            var dropdown = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-dropdown');
            if (dropdown && dropdown.classList.contains('open')) wasOpen = true;
            __wkExpandedL1[l1Name] = !__wkExpandedL1[l1Name];
            __wkUpdateWidget(SuiWalletKit.$connection.value);
            if (wasOpen) {
              var nextDropdown = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-dropdown');
              if (nextDropdown) nextDropdown.classList.add('open');
            }
          });
        })(l1Toggles[t]);
      }
      if (switchBtn) {
        switchBtn.addEventListener('click', function() {
          var dropdown = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-dropdown');
          if (dropdown) dropdown.classList.remove('open');
          var bridge = SuiWalletKit.__skiSignFrame;
          if (bridge && bridge.contentWindow) {
            bridge.contentWindow.postMessage({ type: 'ski:disconnect' }, 'https://sui.ski');
          }
          SuiWalletKit.disconnect();
          setTimeout(function() { SuiWalletKit.openModal(); }, 120);
        });
      }
      if (disconnectBtn) {
        disconnectBtn.addEventListener('click', function() {
          var dropdown = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-dropdown');
          if (dropdown) dropdown.classList.remove('open');
          var bridge = SuiWalletKit.__skiSignFrame;
          if (bridge && bridge.contentWindow) {
            bridge.contentWindow.postMessage({ type: 'ski:disconnect' }, 'https://sui.ski');
          }
          SuiWalletKit.disconnect();
        });
      }
    }

	    	    function __wkUpdateWidget(conn) {
	      if (!__wkWidgetContainer) return;
	      var widget = __wkWidgetContainer.querySelector('.wk-widget');
	      if (!widget) return;
	      var btn = widget.querySelector('.wk-widget-btn');
	      var dropdown = widget.querySelector('.wk-dropdown');
	      if (!btn || !dropdown) return;

	      var isActive = conn && (conn.status === 'connected' || conn.status === 'session') && conn.address;
	      if (isActive) {
	        if (__wkKeepBrandLogoWhenConnected) {
	          if (__wkWidgetBtnMarkup !== __wkWidgetDefaultMarkup) {
	            btn.innerHTML = __wkWidgetDefaultMarkup;
	            __wkWidgetBtnMarkup = __wkWidgetDefaultMarkup;
	          }
	          if (__wkWidgetBtnStateClass) {
	            btn.classList.remove('connected', 'session-only');
	            __wkWidgetBtnStateClass = '';
	          }
	          if (__wkWidgetDropdownMarkup) {
	            dropdown.innerHTML = '';
	            __wkWidgetDropdownMarkup = '';
	          }
	          dropdown.classList.remove('open');
	          return;
	        }
	        var normalizedAddress = __wkNormalizeSuiAddress(conn.address);
	        var hasValidAddress = __wkIsValidSuiAddress(normalizedAddress);
	        var addressForLabel = hasValidAddress ? normalizedAddress : String(conn.address || '');
	        var isPrimaryName = ${showPrimaryName} && conn.primaryName;
	        var label = isPrimaryName ? conn.primaryName : __wkTruncAddr(addressForLabel);
	        var safeLabel = isPrimaryName
	          ? '<span class="wk-widget-primary-name">' + __wkEscapeHtml(label) + '</span>'
	          : __wkEscapeHtml(label);
	        var widgetWallet = __wkResolveWidgetWallet(conn);
	        var walletIcon = widgetWallet.icon;
	        var connectionHint = __wkGetWaaPConnectionHint(conn);
	        var waapMethod = connectionHint ? __wkResolveWaaPMethod(conn) : '';
	        var methodSvg = (connectionHint && waapMethod) ? __wkWidgetMethodIconSvg(waapMethod) : '';
	        var balanceLine = '';
	        if (__wkPortfolioData) {
	          var suiSummary = __wkFormatBalance(__wkPortfolioData.totalSui);
	          var stableTotal = __wkGetStablecoinTotal(__wkPortfolioData);
	          var stableSummary = stableTotal >= 0.01 ? __wkFormatUsd(stableTotal) : '';
	          if (suiSummary || stableSummary) {
	            balanceLine = '<span class="wk-widget-balance-wrap">';
	            if (suiSummary) {
	              balanceLine += '<span class="wk-widget-token-row">' + __wkEscapeHtml(suiSummary) + __wkSuiIconSvg + '</span>';
	            }
	            if (stableSummary) {
	              balanceLine += '<span class="wk-widget-usd-row">' + __wkEscapeHtml(stableSummary) + '</span>';
	            }
	            balanceLine += '</span>';
	          }
	        }
	        var labelMarkup = '<span class="wk-widget-label-wrap"><span class="wk-widget-title">' + safeLabel + '</span></span>';
	        var nextBtnMarkup = '';
	        var waapBadge = connectionHint ? '<img src="' + __wkWaaPIcon + '" class="wk-widget-icon wk-waap-badge" alt="WaaP" onerror="this.style.display=\\'none\\'">' : '';
	        if (connectionHint) {
	          if (methodSvg) {
	            nextBtnMarkup = waapBadge + '<span class="wk-widget-icon-fallback">' + methodSvg + '</span>' + labelMarkup + balanceLine;
	          } else {
	            nextBtnMarkup = waapBadge + labelMarkup + balanceLine;
	          }
	        } else if (walletIcon) {
	          nextBtnMarkup = '<img src="' + walletIcon + '" class="wk-widget-icon" alt="" onerror="this.style.display=\\'none\\'">' + labelMarkup + balanceLine;
	        } else if (conn.status === 'session') {
	          nextBtnMarkup = '<span class="wk-widget-icon-fallback"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>' + labelMarkup + balanceLine;
	        } else {
	          nextBtnMarkup = labelMarkup + balanceLine;
	        }
	        if (__wkWidgetBtnMarkup !== nextBtnMarkup) {
	          btn.innerHTML = nextBtnMarkup;
	          __wkWidgetBtnMarkup = nextBtnMarkup;
	        }
	        var nextBtnStateClass = 'connected';
	        if (__wkWidgetBtnStateClass !== nextBtnStateClass) {
	          btn.classList.remove('connected', 'session-only');
	          btn.classList.add(nextBtnStateClass);
	          __wkWidgetBtnStateClass = nextBtnStateClass;
	        }
	        var nextDropdownMarkup = __wkBuildDropdownHtml(conn);
	        if (__wkWidgetDropdownMarkup !== nextDropdownMarkup) {
	          dropdown.innerHTML = nextDropdownMarkup;
	          __wkWidgetDropdownMarkup = nextDropdownMarkup;
	          __wkBindDropdownEvents(conn);
	        }
	      } else {
	        __wkStopPortfolioPolling();
	        if (__wkWidgetBtnMarkup !== __wkWidgetDefaultMarkup) {
	          btn.innerHTML = __wkWidgetDefaultMarkup;
	          __wkWidgetBtnMarkup = __wkWidgetDefaultMarkup;
	        }
	        if (__wkWidgetBtnStateClass) {
	          btn.classList.remove('connected', 'session-only');
	          __wkWidgetBtnStateClass = '';
	        }
	        if (__wkWidgetDropdownMarkup) {
	          dropdown.innerHTML = '';
	          __wkWidgetDropdownMarkup = '';
	        }
	        dropdown.classList.remove('open');
	      }
	    }


	    var __wkResolvingPrimaryAddr = null;
	    function __wkAutoResolvePrimaryName(addr) {
	      if (__wkResolvingPrimaryAddr === addr) return;
	      __wkResolvingPrimaryAddr = addr;
	      var url = 'https://' + __wkPrimaryProfileHost + '/api/primary-name?address=' + encodeURIComponent(addr);
	      fetch(url).then(function(res) {
	        if (!res.ok) throw new Error('HTTP ' + res.status);
	        return res.json();
	      }).then(function(data) {
	        if (__wkResolvingPrimaryAddr !== addr) return;
	        __wkResolvingPrimaryAddr = null;
	        if (data && data.name) {
	          SuiWalletKit.setPrimaryName(data.name);
	        }
	      }).catch(function() {
	        if (__wkResolvingPrimaryAddr === addr) __wkResolvingPrimaryAddr = null;
	      });
	    }

	    SuiWalletKit.renderWidget = function renderWidget(containerId) {
	      var container = document.getElementById(containerId);
	      if (!container) throw new Error('Widget container not found: ' + containerId);
	      __wkWidgetContainer = container;

	      var widget = container.querySelector('.wk-widget');
	      if (!widget) {
	        container.innerHTML = '<div class="wk-widget">'
	          + '<button class="wk-widget-btn" data-wk-role="toggle">' + __wkWidgetDefaultMarkup + '</button>'
	          + '<div class="wk-dropdown"></div>'
	          + '</div>';
	        widget = container.querySelector('.wk-widget');
	        __wkWidgetBtnMarkup = '';
	        __wkWidgetBtnStateClass = '';
	        __wkWidgetDropdownMarkup = '';
	      }

	      var btn = container.querySelector('.wk-widget-btn');
	      if (btn && container.dataset.wkWidgetBound !== '1') {
	        container.dataset.wkWidgetBound = '1';
	        btn.addEventListener('click', function() {
	          var activeWidget = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-widget');
	          var dropdown = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-dropdown');
	          if (!activeWidget || !dropdown) return;
	          var conn = SuiWalletKit.$connection.value;
	          if (conn && (conn.status === 'connected' || conn.status === 'session')) {
	            if (__wkKeepBrandLogoWhenConnected) {
	              var profileHref = __wkGetPrimaryProfileHref(conn);
	              window.location.href = profileHref || ('https://' + __wkPrimaryProfileHost);
	              return;
	            }
	            dropdown.classList.toggle('open');
	          } else {
	            var modalOpen = document.body && document.body.classList.contains('wk-modal-open');
	            if (modalOpen) { SuiWalletKit.closeModal(); } else { SuiWalletKit.openModal(); }
	          }
	        });
	      }
	      if (btn) {
	        try { window.__wkWidgetButton = btn; } catch (_) {}
	        try {
	          window.getWalletWidgetButton = window.getWalletWidgetButton || function() {
	            return document.querySelector('#wk-widget > div > button') || document.querySelector('#wk-widget .wk-widget-btn');
	          };
	        } catch (_) {}
	        try { window.dispatchEvent(new CustomEvent('wk-widget-ready')); } catch (_) {}
	      }

	      if (!__wkWidgetDocClickBound) {
	        __wkWidgetDocClickBound = true;
	        document.addEventListener('click', function(e) {
	          var activeContainer = __wkWidgetContainer;
	          if (!activeContainer) return;
	          var activeWidget = activeContainer.querySelector('.wk-widget');
	          var dropdown = activeContainer.querySelector('.wk-dropdown');
	          if (activeWidget && dropdown && !activeWidget.contains(e.target)) {
	            dropdown.classList.remove('open');
	          }
	        });
	      }

	      if (__wkWidgetUnsub) __wkWidgetUnsub();
	      var __wkLastPollingAddr = null;
	      __wkWidgetUnsub = SuiWalletKit.subscribe(SuiWalletKit.$connection, function(conn) {
	        var rawAddr = conn && (conn.status === 'connected' || conn.status === 'session') ? conn.address : null;
	        var normalizedAddr = __wkNormalizeSuiAddress(rawAddr || '');
	        var addr = __wkIsValidSuiAddress(normalizedAddr) ? normalizedAddr : null;
	        if (addr && addr !== __wkLastPollingAddr) {
	          __wkLastPollingAddr = addr;
	          __wkStartPortfolioPolling(addr);
	        } else if (!addr && __wkLastPollingAddr) {
	          __wkLastPollingAddr = null;
	          __wkStopPortfolioPolling();
	        }
	        if (${showPrimaryName} && addr && !conn.primaryName) {
	          __wkAutoResolvePrimaryName(addr);
	        }
	        __wkUpdateWidget(conn);
	      });

	      var initConn = SuiWalletKit.$connection.value;
	      if (initConn && (initConn.status === 'connected' || initConn.status === 'session') && initConn.address) {
	        var initAddr = __wkNormalizeSuiAddress(initConn.address || '');
	        if (__wkIsValidSuiAddress(initAddr)) {
	          __wkLastPollingAddr = initAddr;
	          __wkStartPortfolioPolling(initAddr);
	        }
	      }
	      __wkUpdateWidget(initConn);
	    };
	  `
}
