/* kristoferdeyoung.com — small progressive enhancements. No dependencies. */
(function () {
  "use strict";

  /* ---- Theme -----------------------------------------------------------
     Default is the visitor's OS preference (handled in CSS). The toggle
     writes an explicit choice to localStorage where that is available and
     falls back to memory-only for the current page otherwise.            */
  var KEY = "kdy-theme";
  var root = document.documentElement;

  function store(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* private mode */ }
  }
  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var media = window.matchMedia("(prefers-color-scheme: dark)");
      var current = root.getAttribute("data-theme") || (media.matches ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      toggle.setAttribute("aria-label", next === "dark" ? "Switch to light theme" : "Switch to dark theme");
      store(next);
    });
  }

  /* ---- Sticky header hairline ---------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Reveal on scroll ----------------------------------------------- */
  var targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    for (var i = 0; i < targets.length; i++) targets[i].classList.add("is-in");
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

  targets.forEach(function (el) { io.observe(el); });
})();

/* kristoferdeyoung.com — gallery lightbox. Loaded on every page; exits early
   when there is no gallery on the page. */
(function () {
  "use strict";

  var dataEl = document.getElementById("gallery-data");
  var box = document.getElementById("lightbox");
  if (!dataEl || !box) return;

  var shots;
  try { shots = JSON.parse(dataEl.textContent); } catch (e) { return; }
  if (!shots || !shots.length) return;

  var img = document.getElementById("lb-img");
  var cap = document.getElementById("lb-cap");
  var inner = box.querySelector(".lightbox-inner");
  var closeBtn = box.querySelector(".lb-close");
  var prevBtn = box.querySelector(".lb-prev");
  var nextBtn = box.querySelector(".lb-next");
  var index = 0;
  var lastFocus = null;

  function show(i) {
    index = (i + shots.length) % shots.length;
    var s = shots[index];
    img.src = s.src;
    img.alt = s.cap;
    cap.textContent = s.cap;
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    document.body.classList.add("lb-open");
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    document.body.classList.remove("lb-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll(".shot-btn"), function (btn) {
    btn.addEventListener("click", function () {
      open(parseInt(btn.getAttribute("data-index"), 10) || 0);
    });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", function () { show(index - 1); });
  nextBtn.addEventListener("click", function () { show(index + 1); });

  /* Click the backdrop, but not the picture itself. */
  box.addEventListener("click", function (e) {
    if (e.target === box || e.target === inner) close();
  });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowLeft") { show(index - 1); return; }
    if (e.key === "ArrowRight") { show(index + 1); return; }
    /* keep focus inside the dialog */
    if (e.key === "Tab") {
      var f = [closeBtn, prevBtn, nextBtn];
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  /* Swipe on touch devices. */
  var x0 = null;
  box.addEventListener("touchstart", function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
})();
