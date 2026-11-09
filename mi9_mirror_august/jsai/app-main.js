(() => {
  const body = document.body;
  const html = document.documentElement;
  const header = document.querySelector(".header-container");
  const menuToggle = document.getElementById("menuToggle") || document.getElementById("mobile-toggle");
  const themeToggle = document.getElementById("theme-toggle");
  const input = document.getElementById("search-input");
  const suggestBox = document.getElementById("suggestions-box");
  const searchForm = document.querySelector(".search-box");
  const accountBox = document.getElementById("account-box");

  const cache = Object.create(null);
  let debounceTimer = null;
  let abortController = null;

  const escapeHTML = (str) =>
    String(str || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));

  const setHidden = (el, hidden = true) => {
    if (!el) return;

    el.classList.toggle("is-hidden", hidden);
    el.setAttribute("aria-hidden", hidden ? "true" : "false");

    if (el === suggestBox && input) {
      input.setAttribute("aria-expanded", hidden ? "false" : "true");
    }
  };

  function syncThemeToBody() {
    body.classList.toggle("dark-mode", html.classList.contains("dark-mode"));
    body.classList.toggle("light-mode", html.classList.contains("light-mode"));
  }

  function setTheme(mode) {
    const safeMode = mode === "dark-mode" ? "dark-mode" : "light-mode";

    html.classList.remove("dark-mode", "light-mode");
    html.classList.add(safeMode);

    localStorage.setItem("theme", safeMode);
    syncThemeToBody();
  }

  function initTheme() {
    if (!html.classList.contains("dark-mode") && !html.classList.contains("light-mode")) {
      setTheme(localStorage.getItem("theme") === "dark-mode" ? "dark-mode" : "light-mode");
      return;
    }

    syncThemeToBody();

    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
      const isDark = html.classList.contains("dark-mode");
      setTheme(isDark ? "light-mode" : "dark-mode");
    });
  }

  async function initUserState() {
    if (!accountBox) return;

    try {
      const res = await fetch("/api/user-state/", {
        credentials: "include",
        cache: "no-store"
      });

      if (!res.ok) return;

      const data = await res.json();

      if (!data || !data.logged_in) return;

      const currentUrl = location.pathname + location.search;

      accountBox.innerHTML = `
        <div class="user-menu">
          <img id="user-avatar"
               src="${escapeHTML(data.picture)}"
               alt="User avatar"
               width="24"
               height="24">

          <div id="logout-box" class="is-hidden" aria-hidden="true">
            <form method="post" action="/logout">
              <input type="hidden" name="redirect" value="${escapeHTML(currentUrl)}">
              <button type="submit" class="logout-button">Logout</button>
            </form>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("User state error:", error);
    }
  }

  function renderSuggestions(items) {
    if (!suggestBox) return;

    if (!items || !items.length) {
      suggestBox.innerHTML = "";
      setHidden(suggestBox, true);
      return;
    }

    suggestBox.innerHTML = items
      .map((item) => `
        <li class="suggestion-item"
            role="option"
            data-value="${escapeHTML(item)}">
          ${escapeHTML(item)}
        </li>
      `)
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

      if (!res.ok) {
        renderSuggestions([]);
        return;
      }

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

    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");

    if (suggestBox) {
      suggestBox.setAttribute("role", "listbox");
      suggestBox.setAttribute("aria-hidden", "true");

      if (!suggestBox.id) {
        suggestBox.id = "suggestions-box";
      }

      input.setAttribute("aria-controls", suggestBox.id);
      setHidden(suggestBox, true);
    }

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
        if (input) input.value = suggestionItem.dataset.value || suggestionItem.textContent.trim() || "";
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

      const avatar = target.closest("#user-avatar");
      const logoutBox = document.getElementById("logout-box");

      if (avatar) {
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
    initUserState();
    initGlobalClick();
  }

  init();
})();