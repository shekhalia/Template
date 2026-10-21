(() => {
  const input = document.getElementById("search-input");
  const suggestBox = document.getElementById("suggestions-box");
  const searchForm = document.querySelector("form[action='/search']");

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
    el.style.display = hidden ? "none" : "block";
  };

  function renderSuggestions(items) {
    if (!suggestBox) return;

    if (!items || !items.length) {
      suggestBox.innerHTML = "";
      setHidden(suggestBox, true);
      return;
    }

    suggestBox.innerHTML = items
      .map((item) => `<li class="suggestion-item" data-value="${escapeHTML(item)}" style="display: flex; align-items: center; width: 100%; box-sizing: border-box; padding: 12px 16px; margin: 0; font-size: 15px; line-height: 1.45; color: var(--text-dark, #202124); background: transparent; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(item)}</li>`)
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

      if (searchForm && !searchForm.contains(target)) {
        setHidden(suggestBox, true);
      }
    });
  }

  function init() {
    initSearch();
    initGlobalClick();
  }

  init();
})();
