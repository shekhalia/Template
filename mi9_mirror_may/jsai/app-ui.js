window.AppUI = (() => {
  const DOM = window.AppDOM;
  let toastTimer = null;
  let activeToast = null;

  function renderResult(type, title, text) {
    return `
      <div class="result-message result-message--${type}">
        <div class="result-message__body">
          <div class="result-message__title">${title}</div>
          <p class="result-message__text">${text}</p>
        </div>
      </div>
    `;
  }

  function setResult(container, type, title, text) {
    if (!container) return;
    DOM.setHtml(container, renderResult(type, title, text));
  }

  function ensureToastContainer() {
    let container = DOM.get("toast-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "true");
      document.body.appendChild(container);
    } else if (container.parentNode !== document.body) {
      document.body.appendChild(container);
    }

    return container;
  }

  function clearToastTimer() {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
  }

  function removeToast(toast) {
    if (!toast) return;

    toast.classList.remove("show");
    toast.classList.add("hide");

    setTimeout(() => {
      toast.parentNode?.removeChild(toast);
      if (activeToast === toast) activeToast = null;
    }, 280);
  }

  function showToast(typeClass, title, message, autoHideDelay = 0) {
    const container = ensureToastContainer();

    clearToastTimer();

    if (activeToast) removeToast(activeToast);

    const toast = document.createElement("div");
    toast.className = "toast-message toast-message--" + (typeClass || "info");
    toast.innerHTML = `
      <div class="toast-message__inner">
        <button type="button" class="toast-message__close" aria-label="Close notification">×</button>
        <div class="toast-message__title">${title || "Notice"}</div>
        <p class="toast-message__text">${message || ""}</p>
      </div>
    `;

    const closeBtn = toast.querySelector(".toast-message__close");
    closeBtn?.addEventListener("click", () => {
      clearToastTimer();
      removeToast(toast);
    });

    toast.addEventListener("mouseenter", clearToastTimer);

    toast.addEventListener("mouseleave", () => {
      if (autoHideDelay > 0) {
        toastTimer = setTimeout(() => removeToast(toast), autoHideDelay);
      }
    });

    container.appendChild(toast);
    activeToast = toast;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add("show");
      });
    });

    if (autoHideDelay > 0) {
      toastTimer = setTimeout(() => removeToast(toast), autoHideDelay);
    }

    return toast;
  }

  function isMobileModal() {
    return window.innerWidth <= 640;
  }

  function openModal(box, overlay, button) {
    box?.classList.add("open_op");
    box?.setAttribute("aria-hidden", "false");
    button?.setAttribute("aria-expanded", "true");

    if (isMobileModal()) {
      overlay?.classList.add("open_op");
      document.body.classList.add("body-modal-open");
    }
  }

  function closeModal(box, overlay, button) {
    box?.classList.remove("open_op");
    box?.setAttribute("aria-hidden", "true");
    button?.setAttribute("aria-expanded", "false");
    overlay?.classList.remove("open_op");
    document.body.classList.remove("body-modal-open");
  }

  function syncModalState(box, overlay) {
    if (!box?.classList.contains("open_op")) {
      overlay?.classList.remove("open_op");
      document.body.classList.remove("body-modal-open");
      return;
    }

    if (isMobileModal()) {
      overlay?.classList.add("open_op");
      document.body.classList.add("body-modal-open");
    } else {
      overlay?.classList.remove("open_op");
      document.body.classList.remove("body-modal-open");
    }
  }

  function setLoadingButton(button, loading, loadingText = "Loading...") {
    if (!button) return;

    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent.trim();
      }
      button.disabled = true;
      button.classList.add("is-disabled", "btn-loading");
      button.innerHTML = `<span class="btn-spinner"></span>${loadingText}`;
      return;
    }

    button.disabled = false;
    button.classList.remove("is-disabled", "btn-loading");
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }

  function setProgressState(container, bar, active, percent = 0) {
    if (!container || !bar) return;
    DOM.toggleClass(container, "is-hidden", !active);
    DOM.setProgress(bar, percent);
  }

  function setHidden(el, hidden = true) {
    if (!el) return;
    DOM.toggleClass(el, "is-hidden", hidden);
  }

  return {
    renderResult,
    setResult,
    showToast,
    openModal,
    closeModal,
    syncModalState,
    setLoadingButton,
    setProgressState,
    setHidden
  };
})();