(() => {
  if (window.__littlePlaneExtensionInstalled) return;
  window.__littlePlaneExtensionInstalled = true;
  const CHANNEL = "LITTLE_PLANE_YT_EXTENSION";
  const DOWNLOAD_URL = "https://github.com/cezar0810/Little_Plane/raw/refs/heads/main/downloads/little-plane-radio-extension-1.1.4.zip";
  let bridgeInstallInFlight = false;

  function ensureLobbyNotice() {
    const lobby = document.getElementById("lobbyScreen");
    if (!lobby) return;
    let notice = document.getElementById("littlePlaneRadioInstall");
    if (!notice) {
      notice = document.createElement("aside");
      notice.id = "littlePlaneRadioInstall";
      notice.setAttribute("aria-label", "Rádio do YouTube");
      notice.innerHTML = [
        '<div class="lp-radio-install-icon" aria-hidden="true">♫</div>',
        '<div class="lp-radio-install-copy"><strong id="lpRadioInstallTitle">RÁDIO DO YOUTUBE</strong>',
        '<span id="lpRadioInstallText">Não conectado · abra uma aba do YouTube para usar sua música.</span></div>',
        '<button id="lpRadioInstallAction" type="button">COMO CONECTAR</button>'
      ].join("");
      lobby.appendChild(notice);
    }
    if (!document.getElementById("littlePlaneRadioInstallStyle")) {
      const style = document.createElement("style");
      style.id = "littlePlaneRadioInstallStyle";
      style.textContent = [
        '#littlePlaneRadioInstall{position:absolute;right:calc(50% + 170px);left:auto;top:15px;z-index:5;display:flex;align-items:center;gap:8px;width:min(220px,calc(50vw - 200px));min-width:185px;padding:8px 10px;box-sizing:border-box;border:1px solid #7dd3fc30;border-radius:15px;color:#eafaff;background:#08131fbd;box-shadow:0 6px 20px #0003;backdrop-filter:blur(10px);font:10px system-ui,sans-serif}',
        '.lp-radio-install-icon{flex:0 0 29px;width:29px;height:29px;display:grid;place-items:center;border-radius:9px;background:#22d3ee18;color:#67e8f9}',
        '.lp-radio-install-copy{min-width:0;flex:1}.lp-radio-install-copy strong{display:block;font-size:8px;letter-spacing:.1em;color:#a5d8e5}.lp-radio-install-copy span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;margin-top:3px;color:#cbd5e1;line-height:1.25}',
        '#lpRadioInstallAction{flex:0 0 auto;border:1px solid #7dd3fc30;border-radius:8px;padding:7px 8px;background:#67e8f914;color:#bae6fd;font-size:8px;font-weight:900;white-space:nowrap;cursor:pointer}',
        '#littlePlaneRadioInstall[data-connected="true"]{border-color:#34d39940;background:#06141cbd}#littlePlaneRadioInstall[data-connected="true"] .lp-radio-install-copy strong{color:#6ee7b7}#littlePlaneRadioInstall[data-connected="true"] #lpRadioInstallAction{display:none}',
        '@media(max-width:1000px){#littlePlaneRadioInstall,#littlePlaneRadioInstall[data-connected="true"]{right:auto;left:50%;top:184px;transform:translateX(-50%);width:min(300px,calc(100vw - 24px));min-width:0}}',
        '@media(max-width:700px){#littlePlaneRadioInstall,#littlePlaneRadioInstall[data-connected="true"]{top:184px;width:min(270px,calc(100vw - 24px));padding:7px 9px}}'
      ].join("");
      (document.head || document.documentElement).appendChild(style);
    }
    const action = notice.querySelector("#lpRadioInstallAction");
    if (action && !action.dataset.lpRadioGuideBound) {
      action.dataset.lpRadioGuideBound = "true";
      action.addEventListener("click", event => {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("littleplane:open-radio-guide"));
        setTimeout(() => {
          if (!document.getElementById("lpRadioConnectionGuide")) {
            window.open(DOWNLOAD_URL, "_blank", "noopener");
            alert("Para conectar a rádio:\n1. Baixe e extraia o ZIP.\n2. Abra chrome://extensions.\n3. Ative o Modo do desenvolvedor.\n4. Clique em Carregar sem compactação e escolha a pasta extension.\n5. Abra uma música no YouTube e atualize o Little Plane (F5).\n\nDownload da extensão: versão 1.1.4.");
          }
        }, 120);
      });
    }
    if (!notice.dataset.connected) notice.dataset.connected = "false";
  }

  function setNotice(text, connected) {
    ensureLobbyNotice();
    const notice = document.getElementById("littlePlaneRadioInstall");
    const title = document.getElementById("lpRadioInstallTitle") || notice?.querySelector(".lp-radio-install-copy strong");
    const label = document.getElementById("lpRadioInstallText");
    const action = document.getElementById("lpRadioInstallAction");
    if (notice) notice.dataset.connected = connected ? "true" : "false";
    if (title) title.textContent = connected ? "YOUTUBE CONECTADO" : "RÁDIO DO YOUTUBE";
    if (label) label.textContent = connected ? String(text || "Música conectada").replace(/^Conectado:\s*/i, "") :
      (text || "Não conectado · abra uma aba do YouTube ou YouTube Music.");
    if (action) action.textContent = "COMO CONECTAR";
  }

  function installPageBridge() {
    if (bridgeInstallInFlight) return;
    bridgeInstallInFlight = true;
    chrome.runtime.sendMessage({type:"LP_GAME_INSTALL_BRIDGE"}, result => {
      bridgeInstallInFlight = false;
      if (chrome.runtime.lastError || !result?.ok) {
        console.warn("[Little Plane Rádio] Ponte principal não instalada:", chrome.runtime.lastError?.message || result?.reason || "Falha ao instalar a ponte.");
        setTimeout(installPageBridge, 2000);
        return;
      }
      poll();
    });
  }

  function poll() {
    try {
      chrome.runtime.sendMessage({type:"LP_GAME_GET_STATE"}, state => {
        if (chrome.runtime.lastError) {
          setNotice("A extensão foi atualizada. Recarregue esta página (F5) para reconectar.", false);
          return;
        }
        window.postMessage({channel:CHANNEL,type:"STATE",state:state || {available:false,source:"YouTube"}}, location.origin);
        if (state?.available && state.title) setNotice(state.title, true);
        else setNotice(state?.reason || "Não conectado · abra uma aba do YouTube ou YouTube Music e toque uma faixa.", false);
      });
    } catch (_) {
      setNotice("A extensão foi atualizada. Recarregue esta página (F5) para reconectar.", false);
    }
  }

  window.addEventListener("message", event => {
    if (event.source !== window || event.data?.channel !== CHANNEL || event.data.type !== "ACTION") return;
    chrome.runtime.sendMessage({type:"LP_GAME_ACTION",action:event.data.action}, result => {
      window.postMessage({channel:CHANNEL,type:"ACTION_RESULT",id:event.data.id,result:result || {ok:false}}, "*");
    });
  });

  ensureLobbyNotice();
  installPageBridge();
  poll();
  setInterval(() => { ensureLobbyNotice(); poll(); }, 1800);
})();