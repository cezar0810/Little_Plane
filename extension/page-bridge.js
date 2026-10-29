(() => {
  if (window.__littlePlanePageBridgeInstalled) return;
  window.__littlePlanePageBridgeInstalled = true;
  let latest = {available:false,source:"Extensão do YouTube"};
  const pendingActions = new Map();
  let nextActionId = 1;

  window.addEventListener("message",event => {
    if (event.source !== window || event.data?.channel !== "LITTLE_PLANE_YT_EXTENSION") return;
    const message = event.data;
    if (message.type === "STATE") {
      latest = message.state || {available:false,source:"YouTube"};
      window.dispatchEvent(new CustomEvent("littleplane:media-state",{detail:latest}));
    }
    if (message.type === "ACTION_RESULT" && pendingActions.has(message.id)) {
      pendingActions.get(message.id)(message.result);
      pendingActions.delete(message.id);
    }
  });

  function sendAction(action) {
    return new Promise(resolve => {
      const id = nextActionId++;
      pendingActions.set(id,resolve);
      window.postMessage({channel:"LITTLE_PLANE_YT_EXTENSION",type:"ACTION",id,action},"*");
      setTimeout(() => {
        if (pendingActions.has(id)) { pendingActions.delete(id); resolve({ok:false,timeout:true}); }
      },1800);
    });
  }

  window.LittlePlaneMediaBridge = {
    getState:async () => latest,
    previous:() => sendAction("previous"),
    toggle:() => sendAction("toggle"),
    next:() => sendAction("next")
  };
})();