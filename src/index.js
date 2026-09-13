export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/proxy") {
      const targetUrlStr = url.searchParams.get("url");
      if (!targetUrlStr) {
        return new Response("Missing target URL", { status: 400 });
      }

      try {
        const targetUrl = new URL(targetUrlStr);

        const originalResponse = await fetch(targetUrl.toString(), {
          headers: {
            "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": request.headers.get("Accept") || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
          },
          redirect: "follow"
        });

        const newHeaders = new Headers(originalResponse.headers);
        newHeaders.delete("X-Frame-Options");
        newHeaders.delete("Content-Security-Policy");
        newHeaders.delete("Content-Security-Policy-Report-Only");
        newHeaders.set("Access-Control-Allow-Origin", "*");

        const contentType = newHeaders.get("content-type") || "";

        if (contentType.includes("text/html")) {
          let htmlText = await originalResponse.text();
          const baseTag = `<base href="${targetUrl.origin}${targetUrl.pathname}">`;
          htmlText = htmlText.replace(/<head[^>]*>/i, `$&${baseTag}`);

          return new Response(htmlText, {
            status: originalResponse.status,
            headers: newHeaders
          });
        }

        return new Response(originalResponse.body, {
          status: originalResponse.status,
          headers: newHeaders
        });

      } catch (err) {
        return new Response("Failed to fetch target URL: " + err.message, { status: 500 });
      }
    }

    return new Response(HTML, {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    });
  }
};

const HTML = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#202124">
<title>Wen Browser</title>
<style>
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #202124; color: #e8eaed; }
body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
.app { width: 100%; height: 100%; display: flex; flex-direction: column; }
.topbar { padding: 8px 10px; background: #202124; border-bottom: 1px solid #3c4043; }
.toolbar { display: flex; align-items: center; gap: 6px; max-width: 1400px; margin: auto; }
.nav-button { width: 42px; height: 42px; min-width: 42px; border: none; border-radius: 50%; background: transparent; color: #e8eaed; font-size: 23px; cursor: pointer; }
.nav-button:active { background: #3c4043; }
.nav-button:disabled { opacity: 0.35; }
.address-wrapper { flex: 1; min-width: 0; height: 44px; display: flex; align-items: center; padding: 0 6px 0 15px; background: #303134; border: 1px solid #5f6368; border-radius: 24px; }
.address-icon { margin-right: 8px; color: #9aa0a6; }
.address { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: #e8eaed; font-size: 16px; }
.address::placeholder { color: #9aa0a6; }
.go-button { height: 34px; padding: 0 15px; border: none; border-radius: 18px; background: #8ab4f8; color: #202124; font-weight: 700; cursor: pointer; }
.browser { position: relative; flex: 1; min-height: 0; background: #ffffff; }
.loading-bar { position: absolute; top: 0; left: 0; width: 0; height: 3px; background: #8ab4f8; transition: width 0.3s ease; z-index: 10; }
.loading-bar.active { width: 80%; }
.viewer { width: 100%; height: 100%; border: none; background: white; }
.home { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 25px; background: radial-gradient(circle at top, #303134, #202124 65%); }
.home-card { width: min(720px, 100%); text-align: center; }
.logo { margin: 0 0 25px; font-size: clamp(42px, 8vw, 70px); font-weight: 700; letter-spacing: -3px; }
.home-search-wrapper { display: flex; height: 54px; background: #303134; border: 1px solid #5f6368; border-radius: 28px; overflow: hidden; }
.home-search { flex: 1; min-width: 0; padding: 0 20px; border: none; outline: none; background: transparent; color: white; font-size: 16px; }
.home-go { margin: 6px; padding: 0 18px; border: none; border-radius: 22px; background: #8ab4f8; color: #202124; font-weight: bold; cursor: pointer; }
.shortcuts { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
.shortcut { padding: 10px 16px; border: 1px solid #5f6368; border-radius: 20px; background: #303134; color: #e8eaed; cursor: pointer; }
.shortcut:active { background: #3c4043; }
.info { margin-top: 25px; color: #9aa0a6; font-size: 13px; line-height: 1.6; }
.blocked { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; padding: 25px; background: #202124; z-index: 20; }
.blocked-card { max-width: 500px; text-align: center; }
.blocked h2 { font-size: 28px; }
.blocked p { color: #9aa0a6; line-height: 1.6; }
.open-direct { margin-top: 15px; padding: 13px 22px; border: none; border-radius: 24px; background: #8ab4f8; color: #202124; font-weight: bold; font-size: 15px; cursor: pointer; }
@media (max-width: 700px) {
  .topbar { padding: 6px; }
  .toolbar { gap: 3px; }
  .nav-button { width: 38px; min-width: 38px; height: 40px; }
  .address-wrapper { height: 42px; }
  .address-icon { display: none; }
  .go-button { padding: 0 11px; }
  input { font-size: 16px !important; }
}
</style>
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="toolbar">
      <button class="nav-button" id="homeButton" title="Home">⌂</button>
      <button class="nav-button" id="backButton" disabled title="Back">‹</button>
      <button class="nav-button" id="forwardButton" disabled title="Forward">›</button>
      <button class="nav-button" id="reloadButton" title="Reload">↻</button>
      <div class="address-wrapper">
        <span class="address-icon">🔒</span>
        <input id="addressBar" class="address" type="text" inputmode="url" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Search or enter a web address">
        <button id="goButton" class="go-button">GO</button>
      </div>
    </div>
  </header>
  <main class="browser">
    <div id="loadingBar" class="loading-bar"></div>
    <section id="home" class="home">
      <div class="home-card">
        <h1 class="logo">Wen Browser</h1>
        <div class="home-search-wrapper">
          <input id="homeSearch" class="home-search" type="text" inputmode="url" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Search or enter a web address">
          <button id="homeGo" class="home-go">Search</button>
        </div>
        <div class="shortcuts">
          <button class="shortcut" data-url="https://www.google.com/">Google</button>
          <button class="shortcut" data-url="https://www.youtube.com/">YouTube</button>
          <button class="shortcut" data-url="https://www.nicovideo.jp/">Niconico</button>
        </div>
        <div class="info">Enter a web address or search the web.</div>
      </div>
    </section>
    <iframe id="viewer" class="viewer" hidden title="Web Viewer"></iframe>
    <section id="blocked" class="blocked">
      <div class="blocked-card">
        <h2>This website may not support embedding</h2>
        <p>Some websites prevent themselves from being displayed inside another website for security reasons.</p>
        <button id="openDirect" class="open-direct">Open Website Directly ↗</button>
      </div>
    </section>
  </main>
</div>
<script>
const addressBar = document.getElementById("addressBar");
const homeSearch = document.getElementById("homeSearch");
const viewer = document.getElementById("viewer");
const home = document.getElementById("home");
const blocked = document.getElementById("blocked");
const loadingBar = document.getElementById("loadingBar");
const homeButton = document.getElementById("homeButton");
const backButton = document.getElementById("backButton");
const forwardButton = document.getElementById("forwardButton");
const reloadButton = document.getElementById("reloadButton");
const goButton = document.getElementById("goButton");
const homeGo = document.getElementById("homeGo");
const openDirect = document.getElementById("openDirect");

let historyList = [];
let historyPosition = -1;
let currentURL = "";

function normalizeURL(input) {
  input = input.trim();
  if (!input) return "";
  if (input.startsWith("https://") || input.startsWith("http://")) return input;
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(input)) return "https://" + input;
  return "https://www.google.com/search?q=" + encodeURIComponent(input);
}

function updateButtons() {
  backButton.disabled = historyPosition <= 0;
  forwardButton.disabled = historyPosition >= historyList.length - 1;
}

function startLoading() { loadingBar.classList.add("active"); }
function stopLoading() {
  loadingBar.style.width = "100%";
  setTimeout(() => {
    loadingBar.classList.remove("active");
    loadingBar.style.width = "0";
  }, 300);
}

function loadWebsite(input, addHistory = true) {
  const url = normalizeURL(input);
  if (!url) return;

  currentURL = url;
  addressBar.value = url;

  if (addHistory) {
    historyList = historyList.slice(0, historyPosition + 1);
    historyList.push(url);
    historyPosition++;
  }

  home.style.display = "none";
  blocked.style.display = "none";
  viewer.hidden = false;

  startLoading();
  viewer.src = "/proxy?url=" + encodeURIComponent(url);
  updateButtons();
}

function submit(input) {
  const value = input.value.trim();
  if (value) loadWebsite(value);
}

goButton.addEventListener("click", () => submit(addressBar));
homeGo.addEventListener("click", () => submit(homeSearch));

[addressBar, homeSearch].forEach(input => {
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit(input);
      input.blur();
    }
  });
});

document.querySelectorAll("[data-url]").forEach(button => {
  button.addEventListener("click", () => loadWebsite(button.dataset.url));
});

homeButton.addEventListener("click", () => {
  viewer.hidden = true;
  viewer.src = "";
  blocked.style.display = "none";
  home.style.display = "flex";
  addressBar.value = "";
  currentURL = "";
});

backButton.addEventListener("click", () => {
  if (historyPosition > 0) {
    historyPosition--;
    currentURL = historyList[historyPosition];
    loadWebsite(currentURL, false);
  }
});

forwardButton.addEventListener("click", () => {
  if (historyPosition < historyList.length - 1) {
    historyPosition++;
    currentURL = historyList[historyPosition];
    loadWebsite(currentURL, false);
  }
});

reloadButton.addEventListener("click", () => {
  if (currentURL) {
    startLoading();
    viewer.src = "/proxy?url=" + encodeURIComponent(currentURL);
  }
});

viewer.addEventListener("load", () => stopLoading());
openDirect.addEventListener("click", () => {
  if (currentURL) window.location.href = currentURL;
});

updateButtons();
</script>
</body>
</html>`;
