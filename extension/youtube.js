(() => {
  if (window.__littlePlaneYouTubeBridgeInstalled) return;
  window.__littlePlaneYouTubeBridgeInstalled = true;

  const $ = (selector) => document.querySelector(selector);
  const seconds = (value) => Number.isFinite(value) && value > 0 ? value : 0;

  function getVideoId() {
    const url = new URL(location.href);
    return url.searchParams.get("v") ||
      url.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] ||
      "";
  }

  function getArtworkCandidate() {
    const candidates = [
      $("ytmusic-player-bar img.image")?.src,
      $("ytmusic-player-bar .thumbnail img")?.src,
      $("ytmusic-player .thumbnail img")?.src,
      $("ytmusic-player .image img")?.src,
      $("meta[property='og:image']")?.content,
      $("link[itemprop='thumbnailUrl']")?.href
    ].filter(Boolean);

    // Ignore generic logos/avatars; only accept likely artwork/thumbnail hosts.
    return candidates.find((src) => {
      try {
        const url = new URL(src, location.href);
        const host = url.hostname.toLowerCase();
        const isImageHost = host === "i.ytimg.com" ||
          host.endsWith(".ytimg.com") ||
          host === "lh3.googleusercontent.com" ||
          host.endsWith(".googleusercontent.com");
        const looksGeneric = /logo|avatar|default|youtube_icon|yt_icon/i.test(url.pathname);
        return isImageHost && !looksGeneric;
      } catch (_) {
        return false;
      }
    }) || "";
  }

  function getState() {
    const video = $("video.html5-main-video") || $("video");
    const title = ($("h1.ytd-watch-metadata yt-formatted-string")?.textContent ||
      $("ytmusic-player-bar .title")?.textContent ||
      $("ytmusic-player-bar .title yt-formatted-string")?.textContent ||
      $("meta[property='og:title']")?.content ||
      $("title")?.textContent?.replace(/\s*-\s*YouTube.*$/i, "") || "").trim();
    const channel = ($("#owner #channel-name a")?.textContent ||
      $("ytmusic-player-bar .byline a")?.textContent ||
      $("ytmusic-player-bar .subtitle yt-formatted-string")?.textContent ||
      $("ytd-channel-name a")?.textContent || "").trim();

    const videoId = getVideoId();
    // Prefer the thumbnail tied to the currently playing video. The broad
    // YouTube Music image selectors can accidentally return a logo/avatar.
    const videoThumbnail = videoId
      ? "https://i.ytimg.com/vi/" + encodeURIComponent(videoId) + "/hqdefault.jpg"
      : "";
    const thumbnail = videoThumbnail || getArtworkCandidate();

    return {
      available: !!title && !!video,
      title: title || "",
      artist: channel || "YouTube",
      source: location.hostname.includes("music.youtube.com") ? "YouTube Music" : "YouTube",
      coverUrl: thumbnail,
      position: video ? seconds(video.currentTime) : 0,
      duration: video ? seconds(video.duration) : 0,
      isPlaying: !!video && !video.paused && !video.ended,
      playbackRate: video?.playbackRate || 1,
      videoUrl: location.href
    };
  }

  function clickFirst(selectors) {
    for (const selector of selectors) {
      const button = $(selector);
      if (button && !button.disabled) {
        button.click();
        return true;
      }
    }
    return false;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "LP_YT_GET_STATE") {
      sendResponse(getState());
      return false;
    }
    if (message?.type === "LP_YT_ACTION") {
      const video = $("video.html5-main-video") || $("video");
      if (message.action === "toggle" && video) {
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      } else if (message.action === "next") {
        clickFirst([".ytp-next-button", "ytmusic-player-bar .next-button"]);
      } else if (message.action === "previous") {
        clickFirst([".ytp-prev-button", "ytmusic-player-bar .previous-button"]);
      }
      sendResponse({ ok: true });
      return false;
    }
  });
})();