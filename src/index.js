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

const statusText = document.getElementById("statusText");

let historyList = [];
let historyPosition = -1;
let currentURL = "";


/* =========================
   URL HANDLING
========================= */

function normalizeURL(input) {
    const value = input.trim();

    if (!value) return "";

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    /*
     * Treat something that looks like a domain
     * as a website.
     */
    if (
        /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(value)
    ) {
        return `https://${value}`;
    }

    /*
     * Otherwise use a search engine.
     */
    return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}


/* =========================
   UI
========================= */

function setStatus(text) {
    statusText.textContent = text;
}

function startLoading() {
    loadingBar.classList.remove("complete");
    loadingBar.classList.add("active");
}

function stopLoading() {
    loadingBar.classList.remove("active");
    loadingBar.classList.add("complete");

    setTimeout(() => {
        loadingBar.classList.remove("complete");
    }, 250);
}

function updateNavigation() {
    backButton.disabled = historyPosition <= 0;

    forwardButton.disabled =
        historyPosition >= historyList.length - 1;
}


/* =========================
   HISTORY
========================= */

function addToHistory(url) {
    historyList = historyList.slice(
        0,
        historyPosition + 1
    );

    historyList.push(url);
    historyPosition = historyList.length - 1;

    updateNavigation();
}


/* =========================
   LOAD WEBSITE
========================= */

function loadWebsite(input, addHistory = true) {
    const url = normalizeURL(input);

    if (!url) return;

    currentURL = url;
    addressBar.value = url;

    if (addHistory) {
        addToHistory(url);
    }

    home.style.display = "none";
    blocked.style.display = "none";
    viewer.hidden = false;

    setStatus("Loading…");
    startLoading();

    viewer.src = url;
}


/* =========================
   SUBMIT
========================= */

function submit(input) {
    const value = input.value.trim();

    if (!value) return;

    loadWebsite(value);

    input.blur();
}


/* =========================
   SEARCH
========================= */

goButton.addEventListener("click", () => {
    submit(addressBar);
});

homeGo.addEventListener("click", () => {
    submit(homeSearch);
});


[addressBar, homeSearch].forEach(input => {
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            submit(input);
        }
    });
});


/* =========================
   SHORTCUTS
========================= */

document
    .querySelectorAll("[data-url]")
    .forEach(button => {
        button.addEventListener("click", () => {
            loadWebsite(button.dataset.url);
        });
    });


/* =========================
   HOME
========================= */

homeButton.addEventListener("click", () => {
    viewer.hidden = true;
    viewer.src = "";

    blocked.style.display = "none";
    home.style.display = "flex";

    addressBar.value = "";
    currentURL = "";

    setStatus("Ready");
});


/* =========================
   BACK
========================= */

backButton.addEventListener("click", () => {
    if (historyPosition <= 0) return;

    historyPosition--;

    loadWebsite(
        historyList[historyPosition],
        false
    );

    updateNavigation();
});


/* =========================
   FORWARD
========================= */

forwardButton.addEventListener("click", () => {
    if (
        historyPosition >=
        historyList.length - 1
    ) {
        return;
    }

    historyPosition++;

    loadWebsite(
        historyList[historyPosition],
        false
    );

    updateNavigation();
});


/* =========================
   RELOAD
========================= */

reloadButton.addEventListener("click", () => {
    if (!currentURL) return;

    setStatus("Reloading…");
    startLoading();

    viewer.src = currentURL;
});


/* =========================
   IFRAME EVENTS
========================= */

viewer.addEventListener("load", () => {
    stopLoading();

    setStatus("Loaded");

    /*
     * We cannot inspect the iframe's actual page
     * because of browser same-origin security.
     *
     * Some websites may still refuse embedding.
     */
});


viewer.addEventListener("error", () => {
    stopLoading();

    setStatus("Unable to load");

    blocked.style.display = "flex";
});


/* =========================
   DIRECT OPEN
========================= */

openDirect.addEventListener("click", () => {
    if (!currentURL) return;

    window.open(
        currentURL,
        "_blank",
        "noopener,noreferrer"
    );
});


/* =========================
   KEYBOARD SHORTCUTS
========================= */

document.addEventListener("keydown", event => {
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "l"
    ) {
        event.preventDefault();

        addressBar.focus();
        addressBar.select();
    }

    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "r"
    ) {
        event.preventDefault();

        reloadButton.click();
    }
});


/* =========================
   INITIAL STATE
========================= */

updateNavigation();
setStatus("Ready");