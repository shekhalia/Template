(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  const setHidden = (el, hidden = true) => {
    if (!el) return;
    el.classList.toggle("hidden", hidden);
  };

  /* ================= DESCRIPTION ================= */
  function initDescriptionToggle() {
    const toggleBtn = $("#toggle-description");
    const wrapper = $("#description-wrapper");
    const fadeOverlay = $("#fade-overlay");
    const collapsedHeight = 180;

    if (!toggleBtn || !wrapper || !fadeOverlay) return;

    let expanded = false;

    const updateState = () => {
      wrapper.classList.toggle("expanded", expanded);
      wrapper.style.maxHeight = expanded ? "none" : `${collapsedHeight}px`;
      setHidden(fadeOverlay, expanded);
      toggleBtn.innerHTML = expanded
        ? 'Show Less <span class="arrow">&#x25B2;</span>'
        : 'Show More <span class="arrow">&#x25BC;</span>';
    };

    const setup = () => {
      if (wrapper.scrollHeight <= collapsedHeight) {
        toggleBtn.style.display = "none";
        fadeOverlay.style.display = "none";
        wrapper.style.maxHeight = "none";
        return;
      }

      toggleBtn.style.display = "";
      fadeOverlay.style.display = "";
      updateState();
    };

    toggleBtn.addEventListener("click", () => {
      expanded = !expanded;
      updateState();
    });

    setup();

    window.addEventListener("resize", () => {
      if (!expanded) setup();
    });
  }

  /* ================= LIGHTBOX ================= */
  function initLightbox() {
    const lightbox = $("#lightbox");
    const lightboxImg = $("#lightbox-img");

    if (!lightbox || !lightboxImg) return;

    const closeBtn = $(".close", lightbox);
    const prevBtn = $(".prev", lightbox);
    const nextBtn = $(".next", lightbox);
    const thumbs = $$(".gallery img");

    if (!closeBtn || !prevBtn || !nextBtn || !thumbs.length) return;

    /* ===== LOAD IMAGE LIST ===== */
    let images = Array.isArray(window.__LB_IMAGES__) ? window.__LB_IMAGES__ : [];

    images = images
      .map((item) => ({
        large: typeof item === "string" ? item : item?.large || ""
      }))
      .filter((item) => item.large);

    if (!images.length) {
      images = thumbs
        .map((img) => ({
          large:
            img.getAttribute("data-large") ||
            img.getAttribute("data-src") ||
            img.currentSrc ||
            img.src ||
            ""
        }))
        .filter((item) => item.large);
    }

    if (!images.length) return;

    let currentIndex = 0;
    let touchStartX = 0;
    const swipeThreshold = 30;

    const normalizeIndex = (index) => {
      if (index < 0) return images.length - 1;
      if (index >= images.length) return 0;
      return index;
    };

    const setImage = (index) => {
      currentIndex = normalizeIndex(index);
      const src = images[currentIndex]?.large;
      if (!src) return false;

      lightboxImg.removeAttribute("src");
      lightboxImg.alt = "";
      lightboxImg.src = src;

      return true;
    };

    const open = (index) => {
      if (!setImage(index)) return;

      lightbox.hidden = false;
      lightbox.style.display = "flex";
      document.body.classList.add("no-scroll");
    };

    const close = () => {
      lightbox.style.display = "none";
      lightbox.hidden = true;
      lightboxImg.removeAttribute("src");
      document.body.classList.remove("no-scroll");
    };

    const showPrev = () => setImage(currentIndex - 1);
    const showNext = () => setImage(currentIndex + 1);

    thumbs.forEach((img, index) => {
      img.addEventListener("click", () => open(index));
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", showPrev);
    nextBtn.addEventListener("click", showNext);

    /* ===== TOUCH SWIPE ===== */
    lightbox.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );

    lightbox.addEventListener(
      "touchend",
      (e) => {
        const diff = e.changedTouches[0].screenX - touchStartX;

        if (diff <= -swipeThreshold) showNext();
        else if (diff >= swipeThreshold) showPrev();
      },
      { passive: true }
    );

    /* ===== CLICK OUTSIDE ===== */
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });

    /* ===== KEYBOARD ===== */
    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;

      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    });

    /* ===== ERROR HANDLING ===== */
    lightboxImg.addEventListener("error", () => {
      lightboxImg.removeAttribute("src");
      lightboxImg.alt = "Image could not be loaded";
    });
  }

  /* ================= INIT ================= */
  function init() {
    initDescriptionToggle();
    initLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();