const GAME_MATCHES = [
  /^https:\/\/little-plane\.cezaraugust76\.workers\.dev\//,
  /^https:\/\/little-plane-test\.pages\.dev\//,
  /^http:\/\/localhost(?::\d+)?\//,
  /^http:\/\/127\.0\.0\.1(?::\d+)?\//
];

async function findYouTubeTab() {
  const tabs = await chrome.tabs.query({url:["https://www.youtube.com/*","https://music.youtube.com/*"]});
  if (!tabs.length) return null;
  const active = tabs.find(tab => tab.active);
  return active || tabs.sort((a,b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
}

async function askYouTube(tab, message) {
  try { return await chrome.tabs.sendMessage(tab.id, message); }
  catch (_) {
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:["youtube.js"]});
    return await chrome.tabs.sendMessage(tab.id, message);
  }
}

async function readYouTubeState() {
  const tab = await findYouTubeTab();
  if (!tab || tab.id == null) return {available:false,source:"YouTube",reason:"Nenhuma aba do YouTube ou YouTube Music encontrada neste perfil do Chrome."};
  try {
    const state = await askYouTube(tab,{type:"LP_YT_GET_STATE"});
    return {...state,available:!!(state && state.title),source:tab.url?.includes("music.youtube.com") ? "YouTube Music" : "YouTube",tabId:tab.id};
  } catch (error) {
    return {available:false,source:"YouTube",reason:"Não consegui ler a aba do YouTube. Recarregue-a (F5). " + (error?.message || "")};
  }
}

chrome.runtime.onMessage.addListener((message,sender,sendResponse) => {
  if (message?.type === "LP_GAME_INSTALL_BRIDGE") {
    const tabId = sender.tab?.id;
    if (tabId == null || !sender.url || !GAME_MATCHES.some(re => re.test(sender.url))) {
      sendResponse({ok:false,reason:"Solicitação fora da página do jogo."}); return false;
    }
    chrome.scripting.executeScript({target:{tabId},files:["page-bridge.js"],world:"MAIN"}).then(
      () => sendResponse({ok:true}),
      error => sendResponse({ok:false,reason:error?.message || String(error)})
    );
    return true;
  }
  if (message?.type === "LP_GAME_GET_STATE") {
    readYouTubeState().then(sendResponse).catch(() => sendResponse({available:false,source:"YouTube"}));
    return true;
  }
  if (message?.type === "LP_GAME_ACTION") {
    findYouTubeTab().then(tab => {
      if (!tab?.id) { sendResponse({ok:false}); return; }
      askYouTube(tab,{type:"LP_YT_ACTION",action:message.action,nonce:Date.now() + ":" + Math.random()})
        .then(() => sendResponse({ok:true})).catch(() => sendResponse({ok:false}));
    }).catch(() => sendResponse({ok:false}));
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId,changeInfo,tab) => {
  if (changeInfo.status === "complete" && tab.url && GAME_MATCHES.some(re => re.test(tab.url))) {
    // A aba do jogo consulta o estado da mídia periodicamente.
  }
});