// Keep in sync with node_modules/sui.ski/package.json version
const SKISKI_VERSION = '0.1.18'
const CDN = `https://cdn.jsdelivr.net/npm/sui.ski@${SKISKI_VERSION}/public`

export function skiStyleTag(): string {
	return `<link rel="stylesheet" href="${CDN}/styles.css">`
}

export function skiScriptTag(): string {
	return `<script type="module" src="${CDN}/dist/ski.js"></script>`
}

export function skiWidgetMarkup(): string {
	return `<div id="wallet-widget"></div>\n<div id="ski-modal-root"></div>`
}

/**
 * Generates the inline JS wallet bridge: Wallet Standard discovery + signing helpers.
 * Must be placed inside a plain <script> block (not type="module").
 *
 * Provides:
 *   _skiAddr    — connected address string (null when disconnected)
 *   _skiConn    — { address, walletName, wallet, account } (null when disconnected)
 *   _skiWallets — all discovered Sui wallet-standard objects
 *   _skiConnect(name)                         — programmatic connect
 *   _skiDisconnect()                          — programmatic disconnect
 *   _skiSignAndExecute(txOrBytes, chain?, account?)  — sign + execute tx
 *   _skiSignTransaction(txOrBytes, chain?, account?) — sign only
 *   _skiSignPersonalMessage(messageBytes)     — sign personal message
 *   _skiSubscribe(onConnect, onDisconnect)    — subscribe to state changes
 */
export function skiWalletBridge(opts: { network?: string } = {}): string {
	const network = opts.network || 'mainnet'
	const chain = `sui:${network}`
	return `// ─── .SKI Wallet Bridge (Wallet Standard) ───────────────────────────────
var _skiAddr = null;
var _skiConn = null;
var _skiWallets = [];
(function(){
  function _skiReg(){
    for(var i=0;i<arguments.length;i++){
      var w=arguments[i];
      if(!w||typeof w!=='object')continue;
      var ch=w.chains;
      if(!Array.isArray(ch)||!ch.some(function(c){return typeof c==='string'&&c.indexOf('sui:')===0;}))continue;
      var dup=false;for(var j=0;j<_skiWallets.length;j++){if(_skiWallets[j]===w){dup=true;break;}}
      if(!dup)_skiWallets.push(w);
    }
  }
  var _skiApi={register:_skiReg};
  window.addEventListener('wallet-standard:register-wallet',function(e){
    if(typeof e.detail==='function'){try{e.detail(_skiApi);}catch(_){}}
  });
  try{window.dispatchEvent(Object.assign(new Event('wallet-standard:app-ready'),{detail:_skiApi}));}catch(_){}
}());
window.addEventListener('ski:wallet-connected',function(e){
  var d=(e&&e.detail)||{};
  _skiAddr=d.address||'';
  var name=d.walletName||'';
  var wallet=null;
  for(var i=0;i<_skiWallets.length;i++){if(_skiWallets[i]&&_skiWallets[i].name===name){wallet=_skiWallets[i];break;}}
  var acct=null;
  if(wallet){
    var accs=wallet.accounts||[];
    for(var j=0;j<accs.length;j++){if(accs[j]&&accs[j].address===_skiAddr){acct=accs[j];break;}}
    if(!acct&&accs.length)acct=accs[0];
  }
  _skiConn={address:_skiAddr,walletName:name,wallet:wallet,account:acct};
});
window.addEventListener('ski:wallet-disconnected',function(){_skiAddr=null;_skiConn=null;});
async function _skiConnect(walletName){
  var wallet=null;
  for(var i=0;i<_skiWallets.length;i++){if(_skiWallets[i]&&_skiWallets[i].name===walletName){wallet=_skiWallets[i];break;}}
  if(!wallet)throw new Error('Wallet not found: '+walletName);
  var cf=wallet.features&&wallet.features['standard:connect'];
  if(!cf)throw new Error('Wallet does not support connect');
  var res=await cf.connect({silent:true});
  if(!res.accounts.length)res=await cf.connect();
  if(!res.accounts.length)throw new Error('No accounts authorized');
  var acct=res.accounts[0];
  _skiAddr=acct.address;
  _skiConn={address:acct.address,walletName:wallet.name,wallet:wallet,account:acct};
  return _skiConn;
}
async function _skiDisconnect(){
  if(_skiConn&&_skiConn.wallet){
    var df=_skiConn.wallet.features&&_skiConn.wallet.features['standard:disconnect'];
    if(df&&typeof df.disconnect==='function'){try{await df.disconnect();}catch(_){}}
  }
  _skiAddr=null;_skiConn=null;
}
async function _skiSignAndExecute(txOrBytes,chainOverride,accountOverride){
  if(!_skiConn||!_skiConn.wallet)throw new Error('No wallet connected');
  var wallet=_skiConn.wallet;
  var acct=accountOverride||_skiConn.account;
  var chain=chainOverride||'${chain}';
  var f=wallet.features||{};
  if(f['sui:signAndExecuteTransaction']&&typeof f['sui:signAndExecuteTransaction'].signAndExecuteTransaction==='function'){
    return f['sui:signAndExecuteTransaction'].signAndExecuteTransaction({transaction:txOrBytes,account:acct,chain:chain});
  }
  if(f['sui:signAndExecuteTransactionBlock']&&typeof f['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock==='function'){
    return f['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock({transactionBlock:txOrBytes,account:acct,chain:chain});
  }
  throw new Error('Wallet does not support signAndExecuteTransaction');
}
async function _skiSignTransaction(txOrBytes,chainOverride,accountOverride){
  if(!_skiConn||!_skiConn.wallet)throw new Error('No wallet connected');
  var wallet=_skiConn.wallet;
  var acct=accountOverride||_skiConn.account;
  var chain=chainOverride||'${chain}';
  var f=wallet.features||{};
  if(f['sui:signTransaction']&&typeof f['sui:signTransaction'].signTransaction==='function'){
    return f['sui:signTransaction'].signTransaction({transaction:txOrBytes,account:acct,chain:chain});
  }
  if(f['sui:signTransactionBlock']&&typeof f['sui:signTransactionBlock'].signTransactionBlock==='function'){
    return f['sui:signTransactionBlock'].signTransactionBlock({transactionBlock:txOrBytes,account:acct,chain:chain});
  }
  throw new Error('Wallet does not support signTransaction');
}
async function _skiSignPersonalMessage(messageBytes){
  if(!_skiConn||!_skiConn.wallet)throw new Error('No wallet connected');
  var wallet=_skiConn.wallet;
  var acct=_skiConn.account;
  var sf=wallet.features&&wallet.features['sui:signPersonalMessage'];
  if(!sf||typeof sf.signPersonalMessage!=='function')throw new Error('Wallet does not support signPersonalMessage');
  return sf.signPersonalMessage({message:messageBytes,account:acct});
}
function _skiSubscribe(onConnect,onDisconnect){
  window.addEventListener('ski:wallet-connected',function(){if(onConnect)onConnect(_skiConn);});
  window.addEventListener('ski:wallet-disconnected',function(){if(onDisconnect)onDisconnect(null);});
}
// ─── End .SKI Wallet Bridge ───────────────────────────────────────────────────`
}

/**
 * Bridges old onConnect/onDisconnect string callbacks to new CustomEvents.
 * Emits: ski:wallet-connected → { address, walletName }, ski:wallet-disconnected
 */
export function skiEventBridge(opts: { onConnect?: string; onDisconnect?: string } = {}): string {
	const { onConnect, onDisconnect } = opts
	const lines: string[] = []
	if (onConnect) {
		lines.push(
			`window.addEventListener('ski:wallet-connected',function(e){var d=e&&e.detail||{};(${onConnect})(d.address,d.walletName);});`,
		)
	}
	if (onDisconnect) {
		lines.push(
			`window.addEventListener('ski:wallet-disconnected',function(){(${onDisconnect})();});`,
		)
	}
	return lines.join('\n')
}
