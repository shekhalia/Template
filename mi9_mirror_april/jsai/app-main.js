(() => {
  const body = document.body;
  const html = document.documentElement;
  const header = document.querySelector(".header-container");
  const menuToggle = document.getElementById("menuToggle") || document.getElementById("mobile-toggle");
  const themeToggle = document.getElementById("theme-toggle");
  const input = document.getElementById("search-input");
  const suggestBox = document.getElementById("suggestions-box");
  const searchForm = document.querySelector(".search-box");
  const avatar = document.getElementById("user-avatar");
  const logoutBox = document.getElementById("logout-box");

  const cache = Object.create(null);
  let debounceTimer = null;
  let abortController = null;

  const escapeHTML = (str) =>
    String(str).replace(/[&<>"]/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[m]));

  const setHidden = (el, hidden = true) => {
    if (!el) return;
    el.classList.toggle("is-hidden", hidden);
  };

  function syncThemeToBody() {
    body.classList.toggle("dark-mode", html.classList.contains("dark-mode"));
    body.classList.toggle("light-mode", html.classList.contains("light-mode"));
  }

  function setTheme(mode) {
    html.classList.remove("dark-mode", "light-mode");
    html.classList.add(mode);
    localStorage.setItem("theme", mode);
    syncThemeToBody();
  }

  function initTheme() {
    if (!html.classList.contains("dark-mode") && !html.classList.contains("light-mode")) {
      html.classList.add(localStorage.getItem("theme") || "light-mode");
    }

    syncThemeToBody();

    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
      const isDark = html.classList.contains("dark-mode");
      setTheme(isDark ? "light-mode" : "dark-mode");
    });
  }

  function renderSuggestions(items) {
    if (!suggestBox) return;

    if (!items || !items.length) {
      suggestBox.innerHTML = "";
      setHidden(suggestBox, true);
      return;
    }

    suggestBox.innerHTML = items
      .map((item) => `<li class="suggestion-item" data-value="${escapeHTML(item)}">${escapeHTML(item)}</li>`)
      .join("");

    setHidden(suggestBox, false);
  }

  async function fetchSuggestions(query) {
    const q = query.trim();

    if (!q) {
      renderSuggestions([]);
      return;
    }

    if (cache[q]) {
      renderSuggestions(cache[q]);
      return;
    }

    if (abortController) abortController.abort();
    abortController = new AbortController();

    try {
      const res = await fetch(
        `https://suggest.mi9.com/?q=${encodeURIComponent(q)}&hl=en`,
        { signal: abortController.signal }
      );

      const data = await res.json();
      cache[q] = Array.isArray(data) ? data : [];
      renderSuggestions(cache[q]);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Suggest error:", error);
      }
    }
  }

  function initSearch() {
    if (!input || !searchForm) return;

    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchSuggestions(input.value), 300);
    });

    input.addEventListener("focus", () => {
      if (input.value.trim()) fetchSuggestions(input.value);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") renderSuggestions([]);
    });
  }

  function openLoginPopup(url) {
    const w = 500;
    const h = 600;
    const left = (screen.width - w) / 2;
    const top = (screen.height - h) / 2;

    window.open(
      url,
      "GoogleLogin",
      `width=${w},height=${h},top=${top},left=${left},resizable=no,scrollbars=yes`
    );
  }

  function initGlobalClick() {
    document.addEventListener("click", (e) => {
      const target = e.target;

      const suggestionItem = target.closest(".suggestion-item");
      if (suggestionItem && suggestBox?.contains(suggestionItem)) {
        if (input) input.value = suggestionItem.dataset.value || suggestionItem.textContent || "";
        setHidden(suggestBox, true);
        searchForm?.submit();
        return;
      }

      const loginBtn = target.closest(".loginBtn");
      if (loginBtn) {
        e.preventDefault();
        openLoginPopup(loginBtn.href);
        return;
      }

      if (menuToggle?.contains(target)) {
        const isOpen = header?.classList.toggle("menu-open");
        menuToggle.classList.toggle("open", !!isOpen);
        return;
      }

      if (header?.classList.contains("menu-open") && !header.contains(target)) {
        header.classList.remove("menu-open");
        menuToggle?.classList.remove("open");
      }

      if (searchForm && !searchForm.contains(target)) {
        setHidden(suggestBox, true);
      }

      if (avatar?.contains(target)) {
        const isHidden = logoutBox?.classList.contains("is-hidden");
        setHidden(logoutBox, !isHidden);
        return;
      }

      if (logoutBox && !logoutBox.contains(target)) {
        setHidden(logoutBox, true);
      }
    });
  }

  function init() {
    initTheme();
    initSearch();
    initGlobalClick();
  }

  init();
})();