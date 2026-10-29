const GAME_MATCHES = [
  /^https:\/\/little-plane\.cezaraugust76\.workers\.dev\//,
  /^https:\/\/little-plane-test\.pages\.dev\//,
  /^http:\/\/localhost(?::\d+)?\//,
  /^http:\/\/127\.0\.0\.1(?::\d+)?\//
];

async function findYouTubeTab() {
  const tabs = await chrome.tabs.query({url: [
    "https://www.youtube.com/*",
    "https://music.youtube.com/*"
  ]});
  if (!tabs.length) return null;
  const active = tabs.find(tab => tab.active);
  return active || tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
}

async function readYouTubeState() {
  const tab = await findYouTubeTab();
  if (!tab || tab.id == null) return {available:false, source:"YouTube"};
  try {
    const state = await chrome.tabs.sendMessage(tab.id, {type:"LP_YT_GET_STATE"});
    return {...state, available:!!(state && state.title), source:tab.url?.includes("music.youtube.com") ? "YouTube Music" : "YouTube", tabId:tab.id};
  } catch (_) {
    return {available:false, source:"YouTube", reason:"A aba do YouTube ainda está carregando."};
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "LP_GAME_INSTALL_BRIDGE") {
    const tabId = sender.tab?.id;
    if (tabId == null || !sender.url || !GAME_MATCHES.some(re => re.test(sender.url))) {
      sendResponse({ok:false, reason:"Solicitação fora da página do jogo."});
      return false;
    }
    chrome.scripting.executeScript({
      target: {tabId},
      files: ["page-bridge.js"],
      world: "MAIN"
    }).then(() => {
      sendResponse({ok:true});
    }).catch(error => {
      sendResponse({ok:false, reason:error?.message || String(error)});
    });
    return true;
  }
  if (message?.type === "LP_GAME_GET_STATE") {
    readYouTubeState().then(sendResponse).catch(() => sendResponse({available:false,source:"YouTube"}));
    return true;
  }
  if (message?.type === "LP_GAME_ACTION") {
    findYouTubeTab().then(tab => {
      if (!tab?.id) return sendResponse({ok:false});
      chrome.tabs.sendMessage(tab.id, {type:"LP_YT_ACTION", action:message.action})
        .then(() => sendResponse({ok:true})).catch(() => sendResponse({ok:false}));
    }).catch(() => sendResponse({ok:false}));
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && GAME_MATCHES.some(re => re.test(tab.url))) {
    // O script do jogo consulta o estado da mídia periodicamente.
  }
});