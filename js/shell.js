/* Shared page shell for every page: theme (Automatic / Light / Dark), the header's popover menus,
   the mobile menu, and the signed-in user's name. Loaded before page scripts. */
(function () {
  "use strict";

  var C = window.CONTENT || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  // ---------- Theme ----------
  // Two controls set the same preference: Appearance in the avatar menu and the footer switch.
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var THEME_INPUTS = 'input[name="theme"], input[name="theme-footer"]';
  function applyTheme() {
    var pref = store("gr-theme") || "auto";
    var dark = pref === "dark" || (pref === "auto" && mq.matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    $$(THEME_INPUTS).forEach(function (r) { r.checked = r.value === pref; });
  }
  $$(THEME_INPUTS).forEach(function (r) {
    r.addEventListener("change", function () { store("gr-theme", r.value); applyTheme(); });
  });
  if (mq.addEventListener) mq.addEventListener("change", applyTheme); else if (mq.addListener) mq.addListener(applyTheme);
  applyTheme();

  // ---------- User ----------
  if (C.user) {
    $$(".avatar").forEach(function (a) { a.setAttribute("data-initials", C.user.initials); });
    $$("[data-user-name]").forEach(function (el) { el.textContent = C.user.name; });
    $$("[data-user-link]").forEach(function (el) { el.href = C.user.profileUrl; });
    var userId = (C.user.profileUrl.match(/(\d+)/) || [])[1];
    if (userId) $$("[data-shelf-link]").forEach(function (el) { el.href = "https://www.goodreads.com/review/list/" + userId + "?shelf=currently-reading"; });
  }

  // ---------- Popovers (My Books, profile menu, time range) ----------
  var openPop = null;
  function closePop(focusButton) {
    if (!openPop) return;
    openPop.menu.hidden = true;
    openPop.button.setAttribute("aria-expanded", "false");
    if (focusButton) openPop.button.focus();
    openPop = null;
  }
  $$("[data-popover]").forEach(function (button) {
    var menu = document.getElementById(button.getAttribute("data-popover"));
    button.addEventListener("click", function (e) {
      e.stopPropagation();
      var wasOpen = openPop && openPop.menu === menu;
      closePop();
      if (wasOpen) return;
      menu.hidden = false;
      button.setAttribute("aria-expanded", "true");
      openPop = { button: button, menu: menu };
      var first = $('[aria-checked="true"], input:checked, a, button', menu);
      if (first && e.detail === 0) first.focus(); // keyboard open: move focus into the menu
    });
    menu.addEventListener("click", function (e) { if (!e.target.closest("a")) e.stopPropagation(); });
    // Close when keyboard focus moves out of the menu and its button.
    [button, menu].forEach(function (el) {
      el.addEventListener("focusout", function (e) {
        var to = e.relatedTarget;
        if (openPop && openPop.menu === menu && to && !menu.contains(to) && to !== button) closePop();
      });
    });
  });
  document.addEventListener("click", function () { closePop(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(true); });

  // ---------- Mobile menu ----------
  var menuBtn = $(".menu-button");
  var nav = $("#mobile-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  window.Shell = { closePop: closePop, store: store };
})();
