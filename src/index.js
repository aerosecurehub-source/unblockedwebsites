/* =========================================================
   LINUX UNBLOCKED
   Main application logic - Standard YouTube Embed & Proxy Fallback
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------------------
    // 1. DOM ELEMENTS
    // ---------------------------------------------------------
    const homeSection = document.getElementById("home");
    const viewerIframe = document.getElementById("viewer");
    const blockedSection = document.getElementById("blocked");
    const loadingBar = document.getElementById("loadingBar");
    const statusText = document.getElementById("statusText");

    const addressBar = document.getElementById("addressBar");
    const goButton = document.getElementById("goButton");

    const homeSearch = document.getElementById("homeSearch");
    const homeGo = document.getElementById("homeGo");

    const homeButton = document.getElementById("homeButton");
    const backButton = document.getElementById("backButton");
    const forwardButton = document.getElementById("forwardButton");
    const reloadButton = document.getElementById("reloadButton");
    const openDirectButton = document.getElementById("openDirect");

    const shortcuts = document.querySelectorAll(".shortcut");

    // Disable Grammarly interference on inputs
    [addressBar, homeSearch].forEach(input => {
        if (input) {
            input.setAttribute("data-gramm", "false");
            input.setAttribute("spellcheck", "false");
        }
    });

    // ---------------------------------------------------------
    // 2. STATE MANAGEMENT & URL PARSING
    // ---------------------------------------------------------
    let currentRawUrl = "";

    function formatUrl(input) {
        let trimmed = input.trim();
        if (!trimmed) return "";

        if (/^(https?:\/\/)/i.test(trimmed)) {
            return trimmed;
        } else if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+/.test(trimmed)) {
            return `https://${trimmed}`;
        }

        return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    }

    // 🎬 FIXED YOUTUBE EMBED HANDLER
    function getProxiedUrl(targetUrl) {
        if (targetUrl.startsWith("/") || targetUrl.startsWith(window.location.origin)) {
            return targetUrl;
        }

        try {
            const urlObj = new URL(targetUrl);
            const hostname = urlObj.hostname.toLowerCase();

            // 1. Handle YouTube Watch Links -> Convert directly to Iframe Embed 🍿
            if (hostname.includes("youtube.com")) {
                const videoId = urlObj.searchParams.get("v");
                if (videoId) {
                    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
                }
            }

            // 2. Handle Short youtu.be Links -> Convert directly to Iframe Embed 🍿
            if (hostname.includes("youtu.be")) {
                const videoId = urlObj.pathname.slice(1);
                if (videoId) {
                    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
                }
            }

            // 3. Static thumbnail domains - load directly!
            if (hostname.includes("ytimg.com") || hostname.includes("ggpht.com")) {
                return targetUrl;
            }

        } catch (err) {
            console.error("URL parsing error in getProxiedUrl:", err);
        }

        // Default fallback: Route standard websites & home feeds through your proxy!
        return `/proxy?url=${encodeURIComponent(targetUrl)}`;
    }

    // ---------------------------------------------------------
    // 3. SCREEN SWITCHING & NAVIGATION
    // ---------------------------------------------------------
    function showHome() {
        homeSection.style.display = "flex";
        blockedSection.style.display = "none";
        viewerIframe.setAttribute("hidden", "");
        viewerIframe.src = "about:blank";

        addressBar.value = "";
        statusText.textContent = "Ready";
        currentRawUrl = "";
        updateNavState();
    }

    function showViewer() {
        homeSection.style.display = "none";
        blockedSection.style.display = "none";
        viewerIframe.removeAttribute("hidden");
    }

    function showBlocked() {
        homeSection.style.display = "none";
        viewerIframe.setAttribute("hidden", "");
        blockedSection.style.display = "flex";
        statusText.textContent = "Blocked";
    }

    function updateNavState() {
        backButton.disabled = homeSection.style.display === "flex";
        forwardButton.disabled = homeSection.style.display === "flex";
    }

    // ---------------------------------------------------------
    // 4. CORE LOADING LOGIC
    // ---------------------------------------------------------
    function navigateTo(userInput) {
        const targetUrl = formatUrl(userInput);
        if (!targetUrl) return;

        currentRawUrl = targetUrl;
        addressBar.value = targetUrl;

        showViewer();
        statusText.textContent = "Loading...";
        loadingBar.classList.remove("complete");
        loadingBar.classList.add("active");

        viewerIframe.src = getProxiedUrl(targetUrl);
        updateNavState();
    }

    // ---------------------------------------------------------
    // 5. IFRAME LISTENERS
    // ---------------------------------------------------------
    viewerIframe.addEventListener("load", () => {
        loadingBar.classList.remove("active");
        loadingBar.classList.add("complete");

        setTimeout(() => {
            loadingBar.classList.remove("complete");
        }, 400);

        if (viewerIframe.src === "about:blank" || !viewerIframe.src) return;

        statusText.textContent = "Loaded";
    });

    viewerIframe.addEventListener("error", () => {
        loadingBar.classList.remove("active");
        showBlocked();
    });

    // ---------------------------------------------------------
    // 6. EVENT HANDLERS
    // ---------------------------------------------------------
    goButton.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(addressBar.value);
    });

    addressBar.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            navigateTo(addressBar.value);
        }
    });

    if (homeGo) {
        homeGo.addEventListener("click", (e) => {
            e.preventDefault();
            navigateTo(homeSearch.value);
        });
    }

    if (homeSearch) {
        homeSearch.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                navigateTo(homeSearch.value);
            }
        });
    }

    shortcuts.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const targetUrl = button.getAttribute("data-url");
            if (targetUrl) navigateTo(targetUrl);
        });
    });

    homeButton.addEventListener("click", showHome);

    backButton.addEventListener("click", () => {
        try {
            viewerIframe.contentWindow.history.back();
        } catch (e) {
            console.warn("Cross-origin back navigation blocked by browser.");
        }
    });

    forwardButton.addEventListener("click", () => {
        try {
            viewerIframe.contentWindow.history.forward();
        } catch (e) {
            console.warn("Cross-origin forward navigation blocked by browser.");
        }
    });

    reloadButton.addEventListener("click", () => {
        if (currentRawUrl) navigateTo(currentRawUrl);
    });

    openDirectButton.addEventListener("click", () => {
        if (currentRawUrl) window.open(currentRawUrl, "_blank", "noopener,noreferrer");
    });
});