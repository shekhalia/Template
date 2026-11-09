window.AppDOM = (() => {
  const get = (id) => document.getElementById(id);
  const show = (el, display = "block") => el && (el.style.display = display);
  const hide = (el) => el && (el.style.display = "none");
  const setHtml = (el, html) => el && (el.innerHTML = html);
  const setText = (el, text) => el && (el.textContent = text);
  const addClass = (el, className) => el && el.classList.add(className);
  const removeClass = (el, className) => el && el.classList.remove(className);
  const toggleClass = (el, className, force) => el && el.classList.toggle(className, force);

  function setProgress(el, percent) {
    if (!el) return;
    const safe = Math.max(0, Math.min(100, Number(percent) || 0));
    el.style.width = safe + "%";
  }

  return {
    get,
    show,
    hide,
    setHtml,
    setText,
    addClass,
    removeClass,
    toggleClass,
    setProgress
  };
})();