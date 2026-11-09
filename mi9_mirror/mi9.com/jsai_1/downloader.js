window.AppVersion = (() => {
  const DOM = window.AppDOM;
  const UI = window.AppUI;

  const VALID_DEVICE_ID_REGEX = /^[a-fA-F0-9]{16}$/;

  let activeGenerateStream = null;
  let activeCompressAbortController = null;
  let isGenerating = false;

  function isValidAndroidDeviceId(deviceId) {
    return VALID_DEVICE_ID_REGEX.test(deviceId);
  }

  function parsePackageInput(input) {
    if (!input) return null;

    const trimmed = input.trim();
    const match = trimmed.match(/[?&]id=([a-zA-Z0-9_.]+)/);

    if (match && match[1]) {
      return /^[a-zA-Z0-9_.]+$/.test(match[1]) ? match[1] : null;
    }

    return /^[a-zA-Z0-9_.]+$/.test(trimmed) ? trimmed : null;
  }

  function getQueryParams() {
    return new URLSearchParams(window.location.search);
  }

  function getModalRefs() {
    return {
      button: DOM.get("aobut"),
      box: DOM.get("aobox"),
      overlay: DOM.get("aobox-overlay")
    };
  }

  function getFixedDownloaderBox() {
    return document.querySelector(".apkdl-fixed-downloader");
  }

  function getFixedPackage() {
    return getFixedDownloaderBox()?.dataset.fixedPackage?.trim() || "";
  }

  function getFixedVc() {
    return getFixedDownloaderBox()?.dataset.fixedVc?.trim() || "";
  }

  function isFixedPackageMode() {
    return getFixedPackage() !== "";
  }

  function closeActiveGenerateStream() {
    if (!activeGenerateStream) return;

    try {
      activeGenerateStream.close();
    } catch (error) {
      console.error("close generate stream error:", error);
    }

    activeGenerateStream = null;
    window.__mi9ActiveGenerateStream = null;
  }

  function abortActiveCompressRequest() {
    if (!activeCompressAbortController) return;

    try {
      activeCompressAbortController.abort();
    } catch (error) {
      console.error("abort compress request error:", error);
    }

    activeCompressAbortController = null;
  }

  function closeConfigBox() {
    const { button, box, overlay } = getModalRefs();
    UI.closeModal(box, overlay, button);
  }

  function openConfigBox() {
    const { button, box, overlay } = getModalRefs();
    UI.openModal(box, overlay, button);
  }

  function getSelectedLanguages() {
    return [...document.querySelectorAll(".lang_check")]
      .filter((el) => el.checked)
      .map((el) => el.value)
      .join(",");
  }

  function initDeviceTabs() {
    const deviceInput = DOM.get("device");
    const tabs = document.querySelectorAll(".device-tab");
    const deviceInlineBox = DOM.get("deviceInlineBox");
    const deviceTabNote = DOM.get("deviceTabNote");
    const deviceSuboptions = document.querySelector(".device-suboptions");

    if (!deviceInput || !tabs.length) return;

    function setActiveDevice(value) {
      deviceInput.value = value;

      tabs.forEach((tab) => {
        const active = tab.dataset.device === value;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });

      UI.setHidden(deviceInlineBox, true);
      UI.setHidden(deviceTabNote, true);

      if (deviceSuboptions) {
        DOM.toggleClass(deviceSuboptions, "is-hidden", value !== "phone");
      }

      if (value === "ydev") {
        UI.setHidden(deviceInlineBox, false);
        UI.setHidden(deviceTabNote, false);
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => setActiveDevice(tab.dataset.device));
    });

    setActiveDevice(deviceInput.value || "phone");
  }

  function initLanguageBox() {
    const picker = DOM.get("languagebox");
    const btn = DOM.get("langshowbtn");
    const box = DOM.get("boxlang");
    const text = DOM.get("langshowtext");
    const selectedPills = DOM.get("langSelectedPills");
    const limitMsg = DOM.get("langLimitMsg");

    if (!picker || !btn || !box || !text || !selectedPills) return;

    const checks = picker.querySelectorAll(".lang_check");
    const maxExtraLanguages = 3;

    function getSelected() {
      return [...checks]
        .filter((input) => input.checked)
        .map((input) => ({
          text: input.parentElement.querySelector("span")?.textContent.trim() || input.value,
          disabled: input.disabled
        }));
    }

    function getExtraSelectedCount() {
      return [...checks].filter((input) => input.checked && !input.disabled).length;
    }

    function updateButtonText() {
      const count = getExtraSelectedCount();
      text.textContent = count === 0 ? "English" : `English + ${count} language${count > 1 ? "s" : ""}`;
    }

    function renderSelectedPills() {
      selectedPills.innerHTML = getSelected()
        .map((item) => `<span class="lang-selected-pill">${item.text}</span>`)
        .join("");
    }

    function showLimitMessage() {
      DOM.setText(limitMsg, `You can select up to ${maxExtraLanguages} additional languages besides English.`);
      UI.setHidden(limitMsg, false);
    }

    function hideLimitMessage() {
      DOM.setText(limitMsg, "");
      UI.setHidden(limitMsg, true);
    }

    function openBox() {
      UI.setHidden(box, false);
      btn.setAttribute("aria-expanded", "true");
    }

    function closeBox() {
      UI.setHidden(box, true);
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const opened = !box.classList.contains("is-hidden");
      opened ? closeBox() : openBox();
    });

    checks.forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.disabled && input.checked && getExtraSelectedCount() > maxExtraLanguages) {
          input.checked = false;
          showLimitMessage();
          return;
        }

        hideLimitMessage();
        updateButtonText();
        renderSelectedPills();
      });
    });

    document.addEventListener("click", (e) => {
      if (!picker.contains(e.target)) closeBox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeBox();
    });

    updateButtonText();
    renderSelectedPills();
    UI.setHidden(box, true);
    UI.setHidden(limitMsg, true);
  }

  function initPackageFromUrl() {
    const packageInput = DOM.get("package");
    const errorMessage = DOM.get("error-message");
    const fixedPackage = getFixedPackage();

    if (!packageInput) {
      return;
    }

    if (fixedPackage) {
      packageInput.value = fixedPackage;
      packageInput.setAttribute("readonly", "readonly");
      packageInput.setAttribute("type", "hidden");
      packageInput.classList.remove("error");

      if (errorMessage) {
        UI.setHidden(errorMessage, true);
      }
      return;
    }

    const packageFromUrl = getQueryParams().get("package");

    if (packageFromUrl) {
      packageInput.value = packageFromUrl;
    }

    if (!errorMessage) return;

    function validatePackageField() {
      const hasValue = !!packageInput.value.trim();
      packageInput.classList.toggle("error", !hasValue);
      UI.setHidden(errorMessage, hasValue);
    }

    validatePackageField();
    packageInput.addEventListener("input", validatePackageField);
  }

  function initToggleBox() {
    const { button, box, overlay } = getModalRefs();
    const closeBtn = DOM.get("aobox-close");

    if (!button || !box) return;

    button.addEventListener("click", () => {
      box.classList.contains("open_op") ? closeConfigBox() : openConfigBox();
    });

    closeBtn?.addEventListener("click", closeConfigBox);

    overlay?.addEventListener("click", () => {
      if (window.innerWidth <= 640) closeConfigBox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && box.classList.contains("open_op")) {
        closeConfigBox();
      }
    });

    window.addEventListener("resize", () => {
      UI.syncModalState(box, overlay);
    });
  }

  function initTopAppLinks() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest(".topapp a[href^='#']");
      if (!link) return;

      event.preventDefault();

      const pkg = link.getAttribute("href").slice(1);
      const packageInput = DOM.get("package");
      const errorMessage = DOM.get("error-message");

      if (!packageInput || !pkg || isFixedPackageMode()) return;

      packageInput.value = pkg;
      packageInput.classList.remove("error");
      UI.setHidden(errorMessage, true);
      packageInput.dispatchEvent(new Event("input", { bubbles: true }));
      packageInput.focus();
    });
  }

  function validateGenerateForm() {
    const fixedPackage = getFixedPackage();
    const rawPackageValue = fixedPackage || DOM.get("package")?.value?.trim() || "";
    const packageName = parsePackageInput(rawPackageValue);

    const device = DOM.get("device")?.value || "phone";
    const deviceId = DOM.get("device_id")?.value?.trim() || "";
    const deviceIdInput = DOM.get("device_id");
    const deviceIdError = DOM.get("device_id_error");
    const agreeCheckbox = DOM.get("device-id-agree");
    const checkboxLabel = DOM.get("device-id-checkbox-label");
    const resultsContainer = DOM.get("results-container");

    if (checkboxLabel) DOM.removeClass(checkboxLabel, "error");
    if (deviceIdError) DOM.setText(deviceIdError, "");

    if (device === "ydev") {
      if (!deviceId) {
        if (deviceIdError) DOM.setText(deviceIdError, "Please enter your Device ID.");
        closeConfigBox();
        UI.setResult(
          resultsContainer,
          "warning",
          "Device ID is required",
          "You selected Your Device, so a valid Device ID is needed to generate a compatible APK."
        );
        return { valid: false };
      }

      if (!agreeCheckbox?.checked) {
        if (checkboxLabel) DOM.addClass(checkboxLabel, "error");
        closeConfigBox();
        UI.setResult(
          resultsContainer,
          "warning",
          "Confirmation required",
          "Please confirm that you want to use your Device ID before generating the download link."
        );
        return { valid: false };
      }

      if (!isValidAndroidDeviceId(deviceId)) {
        if (deviceIdError) DOM.setText(deviceIdError, "Device ID must contain 16 hexadecimal characters.");
        closeConfigBox();
        UI.setResult(
          resultsContainer,
          "error",
          "Invalid Device ID",
          "The Device ID format is not valid. Please enter a 16-character hexadecimal value."
        );
        return { valid: false };
      }

      deviceIdInput?.classList.add("is-valid");
    } else {
      deviceIdInput?.classList.remove("is-valid");
    }

    if (!packageName) {
      closeConfigBox();
      UI.setResult(
        resultsContainer,
        "error",
        "Invalid input",
        "Please enter a valid package name or Google Play URL before generating the download link."
      );
      return { valid: false };
    }

    return {
      valid: true,
      packageName,
      device,
      deviceId
    };
  }

  function buildGeneratePayload(packageName, device, deviceId) {
    return {
      package: packageName,
      vc: getFixedVc() || "",
      device,
      arch: DOM.get("arch")?.value || "",
      device_id: device === "ydev" ? deviceId : "",
      sdk: DOM.get("sdk")?.value || "default",
      hl: getSelectedLanguages(),
      timestamp: Date.now()
    };
  }

  function initGenerateLink() {
    const button = DOM.get("genlink");
    const resultsContainer = DOM.get("results-container");
    const progressContainer = DOM.get("progress-container");
    const progressBar = DOM.get("progress-bar");

    if (!button || !resultsContainer || !progressContainer || !progressBar) return;

    button.addEventListener("click", () => {
      if (isGenerating) {
        closeActiveGenerateStream();
      }

      isGenerating = true;
      closeActiveGenerateStream();

      UI.setLoadingButton(button, true, "Generating...");

      const validation = validateGenerateForm();
      if (!validation.valid) {
        UI.setLoadingButton(button, false);
        isGenerating = false;
        return;
      }

      const { packageName, device, deviceId } = validation;
      const payload = buildGeneratePayload(packageName, device, deviceId);

      closeConfigBox();
      UI.setProgressState(progressContainer, progressBar, true, 0);

      UI.setResult(
        resultsContainer,
        "info",
        "Generating download link",
        "Please wait while we prepare the APK download link for your selected configuration."
      );

      let encodedData;
      try {
        encodedData = btoa(JSON.stringify(payload));
      } catch (error) {
        console.error("payload encode error:", error);
        UI.setProgressState(progressContainer, progressBar, false, 0);
        UI.setLoadingButton(button, false);
        UI.setResult(
          resultsContainer,
          "error",
          "Encoding failed",
          "Unable to prepare request data. Please try again."
        );
        isGenerating = false;
        return;
      }

      const stream = window.AppAPI.createGenerateLinkStream({
        idToken: localStorage.getItem("google_id_token"),
        data: encodedData,
        onMessage(data, eventSource) {
          const progress = Number(data.progress ?? 0);
          const message = data.message || data.status || "Processing request...";
          const html = typeof data.html === "string" ? data.html : "";
          const type = data.type || "info";
          const title =
            data.title ||
            (type === "success"
              ? "Completed"
              : type === "warning"
              ? "Notice"
              : type === "error"
              ? "Request failed"
              : "Processing request");

          UI.setProgressState(progressContainer, progressBar, true, progress);

          if (html) {
            DOM.setHtml(resultsContainer, html);
          } else {
            UI.setResult(resultsContainer, type, title, message);
          }

          if (progress >= 100) {
            UI.setProgressState(progressContainer, progressBar, false, 0);
            UI.setLoadingButton(button, false);
            isGenerating = false;

            try {
              eventSource.close();
            } catch (error) {
              console.error("eventSource close error:", error);
            }

            if (activeGenerateStream === eventSource) {
              activeGenerateStream = null;
              window.__mi9ActiveGenerateStream = null;
            }
          }
        },
        onError(error, eventSource) {
          UI.setProgressState(progressContainer, progressBar, false, 0);
          UI.setResult(
            resultsContainer,
            "error",
            "Connection lost",
            "The connection was interrupted while generating the download link. Please try again."
          );
          UI.setLoadingButton(button, false);
          isGenerating = false;

          try {
            eventSource.close();
          } catch (closeError) {
            console.error("eventSource close error:", closeError);
          }

          if (activeGenerateStream === eventSource) {
            activeGenerateStream = null;
            window.__mi9ActiveGenerateStream = null;
          }

          console.error("get_pro stream error:", error);
        }
      });

      activeGenerateStream = stream;
      window.__mi9ActiveGenerateStream = stream;
    });
  }

  function initZipActionButtons() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest(".zip-action-btn");
      if (!button) return;

      event.preventDefault();
      zip(button);
    });
  }

  async function zip(buttonOrH, token, ip, googleId, expiration, type) {
    let button;
    let h;

    if (buttonOrH instanceof HTMLElement) {
      button = buttonOrH;
      h = button.dataset.h || "";
      token = button.dataset.token || "";
      ip = button.dataset.ip || "";
      googleId = button.dataset.googleId || "";
      expiration = button.dataset.expiration || "";
      type = button.dataset.packageType || "zip";
    } else {
      h = buttonOrH || "";
      type = type || "zip";
      button = type === "apk" ? DOM.get("downloadButtonapk") : DOM.get("downloadButtonzip");

      if (button) {
        expiration = expiration || button.dataset.expiration || "";
        type = type || button.dataset.packageType || "zip";
      }
    }

    if (!button) {
      console.error("zip button not found");
      return;
    }

    if (button.dataset.processing === "1") {
      return;
    }

    if (button.dataset.downloadUrl) {
      window.location.href = button.dataset.downloadUrl;
      return;
    }

    const originalText =
      button.dataset.originalText ||
      button.textContent.trim() ||
      (type === "apk" ? "Get APK" : "Get ZIP");

    button.dataset.originalText = originalText;

    function setProcessingState() {
      button.disabled = true;
      button.dataset.processing = "1";
      button.classList.add("processing", "btn-loading", "is-disabled");
      button.classList.remove("ready-download");
      button.innerHTML = `<span class="btn-spinner"></span>${type === "apk" ? "Processing" : "Zipping"}`;
    }

    function setReady(downloadUrl, buttonText) {
      button.disabled = false;
      button.dataset.processing = "0";
      button.classList.remove("processing", "btn-loading", "is-disabled");
      button.classList.add("ready-download");
      button.dataset.downloadUrl = downloadUrl;
      button.textContent = buttonText || (type === "apk" ? "Download APK" : "Download ZIP");
    }

    function reset() {
      button.disabled = false;
      button.dataset.processing = "0";
      button.classList.remove("processing", "ready-download", "btn-loading", "is-disabled");
      button.textContent = originalText;
    }

    abortActiveCompressRequest();
    activeCompressAbortController = new AbortController();

    UI.showToast(
      "info",
      type === "apk" ? "Creating APK file" : "Creating ZIP file",
      "Please wait while we process your file."
    );

    setProcessingState();

    try {
      const finalPayload = await window.AppAPI.streamZipCompress(
        { h, type, token, ip, googleId, expiration, signal: activeCompressAbortController.signal },
        {
          onProgress() {},
          onMessage(message, parsed) {
            const toastType = parsed?.type || "info";
            const title =
              parsed?.title ||
              (toastType === "success"
                ? "Completed"
                : toastType === "warning"
                ? "Notice"
                : toastType === "error"
                ? "Failed"
                : "Processing");

            UI.showToast(toastType, title, message || "Processing...");
          },
          onHtml() {},
          onDone(parsed) {
            if (parsed?.ok && parsed?.download_url) {
              setReady(parsed.download_url, parsed.button_text);
              UI.showToast(
                "success",
                parsed.title || "Ready to download",
                parsed.message || "Your file is ready. Click the button again to download.",
                4000
              );
            } else if (!parsed?.ok) {
              reset();
            }
          },
          onError(error) {
            if (error?.name === "AbortError") {
              reset();
              return;
            }

            UI.showToast("error", "Compression failed", error?.message || "Unknown error", 6000);
            reset();
          }
        }
      );

      if (finalPayload?.ok && finalPayload?.download_url) {
        setReady(finalPayload.download_url, finalPayload.button_text);
      } else if (!finalPayload?.ok) {
        reset();
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        UI.showToast("error", "Compression failed", error?.message || "Unknown error", 6000);
      }
      reset();
    } finally {
      activeCompressAbortController = null;
    }
  }

  function destroy() {
    closeActiveGenerateStream();
    abortActiveCompressRequest();
    isGenerating = false;
  }

  function init() {
    initGenerateLink();
    initPackageFromUrl();
    initToggleBox();
    initDeviceTabs();
    initLanguageBox();
    initTopAppLinks();
    initZipActionButtons();

    window.addEventListener("beforeunload", destroy);
  }

  return {
    init,
    zip,
    destroy,
    closeActiveGenerateStream,
    abortActiveCompressRequest
  };
})();

window.addEventListener("DOMContentLoaded", () => {
  window.AppVersion.init();
});