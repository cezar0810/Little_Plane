(() => {
  if (window.__littlePlaneExtensionInstalled) return;
  window.__littlePlaneExtensionInstalled = true;

  const CHANNEL = "LITTLE_PLANE_YT_EXTENSION";
  let bridgeInstallInFlight = false;
  let bridgeInstalled = false;
  let pollTimer = null;

  function installPageBridge() {
    if (bridgeInstallInFlight) return;
    bridgeInstallInFlight = true;

    chrome.runtime.sendMessage({type: "LP_GAME_INSTALL_BRIDGE"}, result => {
      bridgeInstallInFlight = false;

      if (chrome.runtime.lastError || !result?.ok) {
        const reason = chrome.runtime.lastError?.message || result?.reason || "Falha ao instalar a ponte.";
        console.warn("[Little Plane Rádio] Ponte principal não instalada:", reason);
        setTimeout(installPageBridge, 2000);
        return;
      }

      bridgeInstalled = true;
      // Envia o estado novamente depois que a ponte estiver pronta.
      poll();
    });
  }

  function ensureLobbyNotice() {
    const lobby = document.getElementById("lobbyScreen");
    if (!lobby || document.getElementById("littlePlaneRadioInstall")) return;

    const notice = document.createElement("aside");
    notice.id = "littlePlaneRadioInstall";
    notice.innerHTML = `
      <div class="lp-radio-install-icon" aria-hidden="true">♫</div>
      <div class="lp-radio-install-copy">
        <strong>RÁDIO DO YOUTUBE</strong>
        <span id="lpRadioInstallText">Conecte sua música e jogue ouvindo sua playlist.</span>
      </div>
      <button id="lpRadioInstallAction" type="button">COMO ATIVAR</button>`;

    const style = document.createElement("style");
    style.id = "littlePlaneRadioInstallStyle";
    style.textContent = `
      #littlePlaneRadioInstall{position:absolute;left:50%;top:15%;transform:translateX(-50%);z-index:80;display:flex;align-items:center;gap:11px;width:min(420px,calc(100vw - 28px));box-sizing:border-box;padding:11px 13px;border:1px solid #67e8f955;border-radius:17px;color:#eafaff;background:linear-gradient(120deg,#0b1728ee,#15223cee);box-shadow:0 12px 35px #0007,0 0 24px #22d3ee16;font-family:system-ui,sans-serif;backdrop-filter:blur(12px)}
      .lp-radio-install-icon{flex:0 0 37px;width:37px;height:37px;display:grid;place-items:center;border-radius:12px;background:#22d3ee18;color:#67e8f9;font-size:24px;font-weight:900}
      .lp-radio-install-copy{min-width:0;flex:1}.lp-radio-install-copy strong{display:block;font-size:10px;letter-spacing:.13em;color:#67e8f9}.lp-radio-install-copy span{display:block;margin-top:3px;font-size:11px;line-height:1.3;color:#cbd5e1}
      #lpRadioInstallAction{border:0;border-radius:10px;padding:9px 10px;background:#67e8f9;color:#082032;font-size:10px;font-weight:900;white-space:nowrap;cursor:pointer}
      @media(max-width:520px){#littlePlaneRadioInstall{top:11%;gap:8px;padding:9px}.lp-radio-install-icon{display:none}#lpRadioInstallAction{font-size:9px;padding:8px}}
      @media(max-height:620px){#littlePlaneRadioInstall{top:9%;transform:translateX(-50%) scale(.9);transform-origin:top center}}`;
    (document.head || document.documentElement).appendChild(style);
    lobby.appendChild(notice);

    notice.querySelector("#lpRadioInstallAction").addEventListener("click", () => {
      const text = "Para ativar a Rádio do YouTube no Little Plane:\n1. Baixe o repositório do jogo pelo GitHub (Code > Download ZIP).\n2. Extraia o ZIP.\n3. No Chrome, abra chrome://extensions e ative o Modo do desenvolvedor.\n4. Clique em Carregar sem compactação e selecione a pasta extension dentro do projeto.\n5. Recarregue o Little Plane e a aba do YouTube.\n\nProjeto: https://github.com/cezar0810/Little_Plane/tree/main/extension";
      window.open("https://github.com/cezar0810/Little_Plane/tree/main/extension", "_blank", "noopener");
      alert(text);
    });
  }

  // Não deduplicar mensagens: uma resposta enviada antes da injeção da ponte
  // poderia ser descartada e deixar o player desconectado até o estado mudar.
  function sendState(state) {
    window.postMessage({channel: CHANNEL, type: "STATE", state: state || {available: false, source: "YouTube"}}, location.origin);
  }

  function poll() {
    chrome.runtime.sendMessage({type: "LP_GAME_GET_STATE"}, state => {
      if (chrome.runtime.lastError) return;

      const currentState = state || {available: false, source: "YouTube"};
      sendState(currentState);

      const label = document.getElementById("lpRadioInstallText");
      if (label && currentState.available) {
        label.textContent = "Conectado: " + currentState.title + " — a rádio aparece durante o Voo Livre.";
      } else if (label) {
        label.textContent = "Abra uma aba do YouTube ou YouTube Music para conectar sua música.";
      }
    });
  }

  window.addEventListener("message", event => {
    if (event.source !== window || event.data?.channel !== CHANNEL || event.data.type !== "ACTION") return;

    chrome.runtime.sendMessage({type: "LP_GAME_ACTION", action: event.data.action}, result => {
      window.postMessage({
        channel: CHANNEL,
        type: "ACTION_RESULT",
        id: event.data.id,
        result: result || {ok: false}
      }, location.origin);
    });
  });

  ensureLobbyNotice();
  installPageBridge();
  poll();
  pollTimer = setInterval(() => {
    ensureLobbyNotice();
    poll();
    if (!bridgeInstalled) installPageBridge();
  }, 1800);
})();