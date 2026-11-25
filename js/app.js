/* Reading Stats dashboard: renders the page from window.GOODREADS (your export) and window.CONTENT,
   and wires up every interaction. No framework, no build step. */
(function () {
  "use strict";

  var G = window.GOODREADS;
  var C = window.CONTENT;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Helpers ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }
  function yearOf(b) { return (b.dateRead || b.dateAdded || "").slice(0, 4); }
  function parseDate(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function shortDate(s) { var d = parseDate(s); return MONTHS[d.getMonth()] + " " + d.getDate(); }

  var bookByKey = {};
  G.books.concat(G.currentlyReading).forEach(function (b) {
    bookByKey[norm(b.title)] = bookByKey[norm(b.title)] || b;
    bookByKey[norm(b.fullTitle)] = bookByKey[norm(b.fullTitle)] || b;
  });
  var coverKeys = Object.keys(G.covers);

  function findBook(title) { return bookByKey[norm(title)] || null; }
  function coverFor(title) {
    var b = findBook(title);
    if (b && b.cover) return b.cover;
    var k = norm(title);
    if (G.covers[k]) return G.covers[k];
    for (var i = 0; i < coverKeys.length; i++) if (coverKeys[i].indexOf(k) === 0) return G.covers[coverKeys[i]];
    return "";
  }
  function bookUrl(title) {
    var b = findBook(title);
    return b ? "https://www.goodreads.com/book/show/" + b.id : "https://www.goodreads.com/search?q=" + encodeURIComponent(title);
  }
  function coverHtml(title, src) {
    src = src === undefined ? coverFor(title) : src;
    if (!src) return '<div class="cover cover--placeholder" aria-hidden="true">' + esc(title) + "</div>";
    return '<div class="cover"><img src="' + esc(src) + '" alt="" loading="lazy" decoding="async"></div>';
  }
  function starsHtml(n) {
    var out = '<span class="stars" aria-label="' + n + ' of 5 stars">';
    for (var i = 1; i <= 5; i++) out += i <= n ? "★" : '<span class="off">★</span>';
    return out + "</span>";
  }
  function bookTile(title, meta) {
    return '<a class="book-tile" href="' + esc(bookUrl(title)) + '" target="_blank" rel="noopener">' +
      coverHtml(title) + '<span class="book-tile__title">' + esc(title) + "</span>" +
      (meta ? '<span class="book-tile__meta">' + meta + "</span>" : "") + "</a>";
  }

  // ---------- Toast ----------
  var toastEl = $("[data-toast]");
  var toastTimer;
  function toast(msg) {
    toastEl.innerHTML = '<div class="toast__inner"><span class="toast__check" aria-hidden="true">✓</span>' + esc(msg) + "</div>";
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 2400);
  }
  function hideToast() { toastEl.hidden = true; }
  toastEl.addEventListener("click", hideToast);

  // ---------- Theme ----------
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  function applyTheme() {
    var pref = store("gr-theme") || "auto";
    var dark = pref === "dark" || (pref === "auto" && mq.matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    $$('input[name="theme"]').forEach(function (r) { r.checked = r.value === pref; });
  }
  $$('input[name="theme"]').forEach(function (r) {
    r.addEventListener("change", function () { store("gr-theme", r.value); applyTheme(); });
  });
  if (mq.addEventListener) mq.addEventListener("change", applyTheme); else if (mq.addListener) mq.addListener(applyTheme);
  applyTheme();

  // ---------- User ----------
  $$(".avatar").forEach(function (a) { a.setAttribute("data-initials", C.user.initials); });
  $("[data-user-name]").textContent = C.user.name;
  $("[data-user-link]").href = C.user.profileUrl;
  var userId = (C.user.profileUrl.match(/(\d+)/) || [])[1];
  if (userId) $("[data-shelf-link]").href = "https://www.goodreads.com/review/list/" + userId + "?shelf=currently-reading";

  // ---------- Popovers (profile menu and time range) ----------
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
    menu.addEventListener("click", function (e) { e.stopPropagation(); });
  });
  document.addEventListener("click", function () { closePop(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(true); });

  // Mobile menu
  var menuBtn = $(".menu-button");
  var nav = $("#mobile-nav");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  // ---------- Time range ----------
  var RANGES = [
    { key: "30d", label: "Last 30 days", days: 30 },
    { key: "3m", label: "Last 3 months", days: 91 },
    { key: "ytd", label: "Year to date" },
    { key: "12m", label: "Last 12 months", days: 365 },
    { key: "all", label: "All time" }
  ];
  var range = store("gr-range") || "all";
  if (!RANGES.some(function (r) { return r.key === range; })) range = "all";

  function booksInRange() {
    if (range === "all") return G.books;
    var r = RANGES.filter(function (x) { return x.key === range; })[0];
    var now = new Date();
    var start = r.key === "ytd" ? new Date(now.getFullYear(), 0, 1) : new Date(now.getTime() - r.days * 864e5);
    return G.books.filter(function (b) { return b.dateRead && parseDate(b.dateRead) >= start; });
  }

  var rangeOptions = $("[data-time-range-options]");
  function renderRangeOptions() {
    rangeOptions.innerHTML = RANGES.map(function (r) {
      return '<button class="option" type="button" role="radio" data-range="' + r.key + '" aria-checked="' + (r.key === range) + '" tabindex="' + (r.key === range ? 0 : -1) + '">' + esc(r.label) + "</button>";
    }).join("");
    $("[data-time-range-label]").textContent = RANGES.filter(function (r) { return r.key === range; })[0].label;
  }
  rangeOptions.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-range]");
    if (!btn) return;
    range = btn.getAttribute("data-range");
    store("gr-range", range);
    renderRangeOptions();
    renderHero();
    renderRatings();
    closePop(true);
  });
  rangeOptions.addEventListener("keydown", function (e) {
    if (["ArrowDown", "ArrowUp"].indexOf(e.key) < 0) return;
    e.preventDefault();
    var opts = $$("[data-range]", rangeOptions);
    var i = opts.indexOf(document.activeElement);
    opts[(i + (e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length].focus();
  });

  // ---------- Hero ----------
  var YEAR = C.challenge.year;
  var firstYear = Math.min.apply(null, G.books.map(function (b) { return +yearOf(b) || 9999; }));

  function renderHero() {
    var books = booksInRange();
    var pages = books.reduce(function (s, b) { return s + b.pages; }, 0);
    var rated = books.filter(function (b) { return b.rating > 0; });
    var avg = rated.length ? rated.reduce(function (s, b) { return s + b.rating; }, 0) / rated.length : 0;
    var label = RANGES.filter(function (r) { return r.key === range; })[0].label.toLowerCase();
    $("[data-hero-stats]").innerHTML =
      '<div class="stat stat--hero"><span class="stat__value">' + fmt(books.length) + '</span><span class="stat__label">books read' + (range === "all" ? "" : ", " + esc(label)) + "</span></div>" +
      '<div class="hero__grid">' +
        '<div class="stat"><span class="stat__value">' + fmt(pages) + '</span><span class="stat__label">pages</span></div>' +
        '<div class="stat"><span class="stat__value">' + (avg ? avg.toFixed(2) : "–") + '</span><span class="stat__label">average rating</span></div>' +
        '<div class="stat"><span class="stat__value">' + fmt(C.hoursListened) + '</span><span class="stat__label">hours listened</span></div>' +
        '<div class="stat"><span class="stat__value">' + (new Date().getFullYear() - firstYear) + '</span><span class="stat__label">years tracked</span></div>' +
        (range === "all" ? "" : '<p class="hero__note">Hours listened and years tracked always cover all time.</p>') +
      "</div>";
  }

  // ---------- Reading challenge ----------
  function goal() { return +(store("gr-goal") || C.challenge.goal); }
  function renderChallenge() {
    var done = G.books.filter(function (b) { return yearOf(b) === String(YEAR); }).length;
    var g = goal();
    var pct = Math.min(1, done / g);
    var now = new Date();
    var dayOfYear = now.getFullYear() === YEAR ? (now - new Date(YEAR, 0, 1)) / 864e5 : 365;
    var expected = Math.floor(g * Math.min(1, dayOfYear / 365));
    var pace = done >= g ? "Goal reached. Nice work!" :
      done >= expected ? "You're on track." :
      (expected - done) + (expected - done === 1 ? " book" : " books") + " behind schedule";
    var r = 60, circ = 2 * Math.PI * r, a = 2 * Math.PI * pct;
    $("[data-challenge]").innerHTML =
      '<div class="ring" role="img" aria-label="' + done + " of " + g + ' books">' +
        '<svg viewBox="0 0 140 140" aria-hidden="true">' +
          '<circle class="ring__track" cx="70" cy="70" r="' + r + '" fill="none" stroke-width="12"/>' +
          '<circle class="ring__arc" cx="70" cy="70" r="' + r + '" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + circ + '" data-target="' + circ * (1 - pct) + '"/>' +
          (pct > 0 ? '<circle cx="' + (70 + r * Math.cos(a)) + '" cy="' + (70 + r * Math.sin(a)) + '" r="9" fill="var(--bg-surface)" stroke="var(--data-primary)" stroke-width="4"/>' : "") +
        "</svg>" +
        '<div class="ring__center"><span class="ring__count">' + done + '</span><span class="ring__of">of ' + g + "</span></div>" +
      "</div>" +
      "<div>" +
        '<p class="eyebrow">' + YEAR + " Reading Challenge</p>" +
        '<p class="challenge__title">Goal: ' + g + " books in " + YEAR + "</p>" +
        '<p class="challenge__meta">' + Math.max(0, g - done) + " to go · " + Math.round(pct * 100) + "% complete<br>" + esc(pace) + "</p>" +
        '<div class="challenge__actions">' +
          '<button class="button button--secondary button--small" type="button" data-edit-goal>Edit goal</button>' +
          '<a class="button button--primary button--small" href="#for-you">Find a new read</a>' +
        "</div>" +
      "</div>";
    var arc = $(".ring__arc");
    requestAnimationFrame(function () { requestAnimationFrame(function () { arc.style.strokeDashoffset = arc.getAttribute("data-target"); }); });
    $("[data-edit-goal]").addEventListener("click", openGoalDialog);
  }

  // ---------- Dialogs ----------
  function setupDialog(dlg) {
    $$("[data-close]", dlg).forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); }); // click on the scrim
  }
  var goalDlg = $("#goal-dialog");
  var progressDlg = $("#progress-dialog");
  setupDialog(goalDlg);
  setupDialog(progressDlg);

  function openGoalDialog() {
    $("[data-goal-year]").textContent = YEAR;
    goalDlg.querySelector('input[name="goal"]').value = goal();
    goalDlg.showModal();
    goalDlg.querySelector("input").select();
  }
  $("[data-goal-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = Math.round(+e.target.goal.value);
    if (!v || v < 1) return;
    store("gr-goal", String(v));
    goalDlg.close();
    renderChallenge();
    toast("Goal updated to " + v + " books");
  });

  // ---------- Currently reading ----------
  var current = G.currentlyReading.map(function (b) {
    var x = C.currentlyReading[b.title] || {};
    return {
      id: b.id, title: b.title, author: x.author || b.author, pages: b.pages, cover: b.cover,
      format: x.format || (/audio/i.test(b.binding) ? "Audio" : /kindle|ebook/i.test(b.binding) ? "Ebook" : "Print"),
      rating: x.rating, count: x.count, added: x.added || shortDate(b.dateAdded), defaultPage: x.page || 0
    };
  });
  function pageOf(b) { var p = store("gr-progress-" + b.id); return p == null ? b.defaultPage : +p; }
  var formatFilter = "All";

  function renderFormatChips() {
    var fmts = ["All", "Audio", "Print"];
    current.forEach(function (b) { if (fmts.indexOf(b.format) < 0) fmts.push(b.format); });
    $("[data-format-filter]").innerHTML = fmts.map(function (f) {
      var n = f === "All" ? current.length : current.filter(function (b) { return b.format === f; }).length;
      return '<button class="chip" type="button" data-format="' + f + '" aria-pressed="' + (f === formatFilter) + '">' + f + " (" + n + ")</button>";
    }).join("");
  }
  $("[data-format-filter]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-format]");
    if (!b) return;
    formatFilter = b.getAttribute("data-format");
    renderFormatChips();
    renderCurrent();
  });

  function renderCurrent() {
    var list = current.filter(function (b) { return formatFilter === "All" || b.format === formatFilter; });
    if (!list.length) {
      $("[data-current-list]").innerHTML = '<p class="empty">No ' + formatFilter.toLowerCase() + " books in progress right now.</p>";
      return;
    }
    $("[data-current-list]").innerHTML = list.map(function (b) {
      var p = pageOf(b), pct = b.pages ? Math.round((p / b.pages) * 100) : 0;
      return '<article class="current">' +
        '<a href="' + esc(bookUrl(b.title)) + '" target="_blank" rel="noopener">' + coverHtml(b.title, b.cover) + "</a>" +
        "<div>" +
          '<h3 class="current__title">' + esc(b.title) + "</h3>" +
          '<p class="current__author">by ' + esc(b.author) + " · " + esc(b.format) + "</p>" +
          (b.rating ? '<p class="rating-line"><span class="star" aria-hidden="true">★</span><strong>' + b.rating.toFixed(2) + "</strong> · " + esc(b.count) + " ratings</p>" : "") +
          '<div class="progress"><div class="progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Progress"><div class="progress__fill" style="width:' + pct + '%"></div></div>' +
          '<p class="progress__label">' + (p ? "Page " + p + " of " + b.pages + " · " + pct + "%" : "Not started · added " + esc(b.added)) + "</p></div>" +
          '<button class="button button--secondary button--small" type="button" data-update="' + b.id + '">Update progress</button>' +
        "</div></article>";
    }).join("");
  }
  var activeBook = null;
  $("[data-current-list]").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-update]");
    if (!btn) return;
    activeBook = current.filter(function (b) { return b.id === btn.getAttribute("data-update"); })[0];
    $("[data-progress-book]").innerHTML = coverHtml(activeBook.title, activeBook.cover) +
      "<div><strong>" + esc(activeBook.title) + "</strong><span>by " + esc(activeBook.author) + "</span></div>";
    var input = progressDlg.querySelector('input[name="page"]');
    input.value = pageOf(activeBook);
    input.max = activeBook.pages;
    input.removeAttribute("aria-invalid");
    $("[data-progress-total]").textContent = "of " + activeBook.pages;
    $("[data-progress-error]").hidden = true;
    progressDlg.showModal();
    input.select();
  });
  $("[data-progress-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = e.target.page, v = Math.round(+input.value), err = $("[data-progress-error]");
    if (input.value === "" || v < 0 || v > activeBook.pages) {
      err.textContent = "Enter a page from 0 to " + activeBook.pages + ".";
      err.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    store("gr-progress-" + activeBook.id, String(v));
    progressDlg.close();
    renderCurrent();
    toast(v >= activeBook.pages ? "Finished! Progress saved" : "Progress saved");
  });

  // ---------- Carousels ----------
  // A scroll-snap track with drag, pills that follow the scroll position, and a counter with Prev/Next on phones.
  function Carousel(root) {
    this.root = root;
    root.innerHTML = '<div class="carousel__track" tabindex="0"></div>' +
      '<div class="pager"><button class="pager__btn" type="button" data-prev aria-label="Previous">‹</button>' +
      '<span class="pills"></span><span class="pager__counter" aria-live="polite"></span>' +
      '<button class="pager__btn" type="button" data-next aria-label="Next">›</button></div>';
    this.track = $(".carousel__track", root);
    this.pills = $(".pills", root);
    this.counter = $(".pager__counter", root);
    this.prev = $("[data-prev]", root);
    this.next = $("[data-next]", root);
    var self = this;
    this.track.addEventListener("scroll", function () { self.sync(); }, { passive: true });
    this.prev.addEventListener("click", function () { self.go(self.page - 1); });
    this.next.addEventListener("click", function () { self.go(self.page + 1); });
    this.pills.addEventListener("click", function (e) {
      var p = e.target.closest("[data-page]");
      if (p) self.go(+p.getAttribute("data-page"));
    });
    this.track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); self.go(self.page + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); self.go(self.page - 1); }
    });
    this.drag();
    window.addEventListener("resize", function () { self.layout(); });
  }
  Carousel.prototype.set = function (html) {
    this.track.innerHTML = html;
    this.track.scrollLeft = 0;
    this.layout();
  };
  Carousel.prototype.layout = function () {
    if (!this.root.isConnected) return;
    var items = this.track.children;
    this.count = items.length;
    if (!this.count) { this.pills.innerHTML = ""; this.counter.textContent = ""; return; }
    var gap = parseFloat(getComputedStyle(this.track).columnGap) || 0;
    this.step = items[0].getBoundingClientRect().width + gap;
    this.perView = Math.max(1, Math.round((this.track.clientWidth + gap) / this.step));
    this.pages = Math.max(1, Math.ceil(this.count / this.perView));
    var html = "";
    for (var i = 0; i < this.pages; i++) html += '<button class="pill" type="button" data-page="' + i + '" aria-label="Page ' + (i + 1) + " of " + this.pages + '"></button>';
    this.pills.innerHTML = html;
    this.root.querySelector(".pager").hidden = this.pages < 2;
    this.page = -1;
    this.sync();
  };
  Carousel.prototype.sync = function () {
    var t = this.track, max = t.scrollWidth - t.clientWidth;
    var p = t.scrollLeft >= max - 2 ? this.pages - 1 : Math.round(t.scrollLeft / (this.step * this.perView));
    p = Math.max(0, Math.min(this.pages - 1, p));
    if (p === this.page) return;
    this.page = p;
    $$(".pill", this.pills).forEach(function (el, i) { el.setAttribute("aria-current", String(i === p)); });
    var first = Math.min(p * this.perView, Math.max(0, this.count - this.perView)) + 1;
    this.counter.textContent = first + "–" + Math.min(first + this.perView - 1, this.count) + " of " + this.count;
    this.prev.disabled = p === 0;
    this.next.disabled = p === this.pages - 1;
  };
  Carousel.prototype.go = function (p) {
    p = Math.max(0, Math.min(this.pages - 1, p));
    this.track.scrollTo({ left: p * this.perView * this.step, behavior: reduceMotion ? "auto" : "smooth" });
  };
  Carousel.prototype.drag = function () {
    var t = this.track, self = this, startX, startLeft, moved = false, down = false;
    t.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return; // touch already scrolls natively
      down = true; moved = false; startX = e.clientX; startLeft = t.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; t.classList.add("is-dragging"); }
      if (moved) t.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", function (e) {
      if (!down) return;
      down = false;
      if (!moved) return;
      t.classList.remove("is-dragging");
      var dx = e.clientX - startX, pageW = self.step * self.perView;
      var target = Math.round(startLeft / pageW) + (Math.abs(dx) > self.step / 3 ? (dx < 0 ? 1 : -1) : 0);
      self.go(target);
    });
    // A drag shouldn't count as a click on the book underneath it.
    t.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    t.addEventListener("dragstart", function (e) { e.preventDefault(); });
  };

  // ---------- Books per year ----------
  var years = {};
  G.books.forEach(function (b) { var y = yearOf(b); if (y) (years[y] = years[y] || []).push(b); });
  var yearList = Object.keys(years).sort();
  var maxYear = Math.max.apply(null, yearList.map(function (y) { return years[y].length; }));
  var selectedYear = yearList.indexOf(String(YEAR - 1)) >= 0 ? String(YEAR - 1) : yearList[yearList.length - 1];
  var yearCarousel = new Carousel($('[data-carousel="year"]'));

  function renderYears() {
    var chart = $("[data-year-chart]");
    chart.innerHTML = yearList.map(function (y, i) {
      var n = years[y].length;
      return '<button class="year-bar' + (y === String(YEAR) ? " year-bar--current" : "") + '" type="button" data-year="' + y + '" aria-pressed="' + (y === selectedYear) + '" aria-label="' + y + ": " + n + ' books">' +
        '<span class="year-bar__count">' + n + "</span>" +
        '<span class="year-bar__fill" style="--h:' + Math.max(4, (n / maxYear) * 100) + "%;animation-delay:" + i * 40 + 'ms"></span>' +
        '<span class="year-bar__year">' + (y === String(YEAR) ? y + "*" : y) + "</span></button>";
    }).join("");
    if (!$(".legend-inline", chart.parentNode)) {
      chart.insertAdjacentHTML("afterend", '<p class="legend-inline"><span><i class="swatch" style="background:var(--data-primary)"></i>Selected year</span><span><i class="swatch swatch--striped"></i>' + YEAR + "* so far</span></p>");
    }
  }
  function renderYearBooks() {
    $("[data-year-heading]").textContent = "Books from " + selectedYear + " (" + years[selectedYear].length + ")";
    var list = years[selectedYear].slice().sort(function (a, b) {
      return (b.dateRead || b.dateAdded).localeCompare(a.dateRead || a.dateAdded);
    });
    yearCarousel.set(list.map(function (b) { return bookTile(b.title, b.rating ? starsHtml(b.rating) : "Not rated"); }).join(""));
  }
  $("[data-year-chart]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-year]");
    if (!b) return;
    selectedYear = b.getAttribute("data-year");
    $$("[data-year]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    renderYearBooks();
  });

  // ---------- Genres ----------
  var genreIdx = Math.max(0, C.genres.map(function (g) { return g.name; }).indexOf(C.defaultGenre));
  var genreCarousel;
  var maxGenre = Math.max.apply(null, C.genres.map(function (g) { return g.count; }));

  function renderGenreTabs() {
    $("[data-genre-hint]").textContent = "Pick a genre to see your highest-rated books in it.";
    $("[data-genre-list]").innerHTML = C.genres.map(function (g, i) {
      return '<button class="genre-tab" type="button" role="tab" id="genre-tab-' + i + '" data-genre="' + i + '" aria-selected="' + (i === genreIdx) + '" tabindex="' + (i === genreIdx ? 0 : -1) + '">' +
        '<span class="genre-tab__name">' + esc(g.name) + '</span><span class="genre-tab__count">' + g.count + " books</span>" +
        '<span class="genre-tab__bar" aria-hidden="true"><span style="--w:' + (g.count / maxGenre) * 100 + "%;animation-delay:" + i * 40 + 'ms"></span></span></button>';
    }).join("");
  }
  function renderGenrePanel(animate) {
    var g = C.genres[genreIdx], panel = $("[data-genre-panel]");
    panel.setAttribute("aria-labelledby", "genre-tab-" + genreIdx);
    panel.innerHTML =
      '<p class="eyebrow">' + esc(g.name) + " · " + g.count + " books</p>" +
      '<p class="genre-panel__lead">' + esc(g.insight) + "</p>" +
      '<h3 class="subheading">Your highest-rated ' + esc(g.short) + "</h3>" +
      '<div class="carousel" data-carousel="genre"></div>' +
      '<div class="genre-panel__actions">' +
        '<a class="button button--primary" href="#for-you" data-rec-jump="deeper">Go deeper in ' + esc(g.short) + "</a>" +
        '<a class="button button--secondary" href="#for-you" data-rec-jump="adjacent">Try something adjacent</a>' +
      "</div>";
    genreCarousel = new Carousel($('[data-carousel="genre"]', panel));
    genreCarousel.set(g.books.map(function (t) {
      var b = findBook(t);
      return bookTile(b ? b.title : t, b && b.rating ? starsHtml(b.rating) : "");
    }).join(""));
    if (animate) { panel.classList.remove("is-switching"); void panel.offsetWidth; panel.classList.add("is-switching"); }
  }
  function selectGenre(i, focus) {
    genreIdx = i;
    $$("[data-genre]").forEach(function (t, j) {
      t.setAttribute("aria-selected", String(j === i));
      t.tabIndex = j === i ? 0 : -1;
      if (j === i && focus) t.focus();
    });
    renderGenrePanel(true);
  }
  $("[data-genre-list]").addEventListener("click", function (e) {
    var t = e.target.closest("[data-genre]");
    if (t) selectGenre(+t.getAttribute("data-genre"));
  });
  $("[data-genre-list]").addEventListener("keydown", function (e) {
    var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!k) return;
    e.preventDefault();
    selectGenre((genreIdx + k + C.genres.length) % C.genres.length, true);
  });
  $("[data-genre-panel]").addEventListener("click", function (e) {
    var a = e.target.closest("[data-rec-jump]");
    if (a) setRecFilter(a.getAttribute("data-rec-jump"));
  });

  // ---------- Recommendations ----------
  var REC_FILTERS = [
    { key: "all", label: "All" },
    { key: "deeper", label: "Go deeper" },
    { key: "adjacent", label: "Adjacent genres" },
    { key: "short", label: "Short reads" }
  ];
  var recFilter = "all";
  var recCarousel = new Carousel($('[data-carousel="recs"]'));
  $("[data-recs-genre]").textContent = C.recsGenre;

  function renderRecChips() {
    $("[data-rec-filter]").innerHTML = REC_FILTERS.map(function (f) {
      return '<button class="chip" type="button" data-rec="' + f.key + '" aria-pressed="' + (f.key === recFilter) + '">' + f.label + "</button>";
    }).join("");
  }
  function renderRecs() {
    var list = C.recs.filter(function (r) { return recFilter === "all" || r.tags.indexOf(recFilter) >= 0; });
    recCarousel.set(list.map(function (r) {
      return '<a class="rec" href="https://www.goodreads.com/search?q=' + encodeURIComponent(r.title + " " + r.author) + '" target="_blank" rel="noopener">' +
        coverHtml(r.title) +
        '<p class="rec__title">' + esc(r.title) + "</p>" +
        '<p class="rec__author">' + esc(r.author) + "</p>" +
        '<p class="rating-line"><span class="star" aria-hidden="true">★</span><strong>' + r.rating.toFixed(2) + "</strong> · " + esc(r.count) + "</p>" +
        '<p class="rec__reason">' + esc(r.reason) + "</p></a>";
    }).join(""));
  }
  function setRecFilter(key) {
    recFilter = key;
    renderRecChips();
    renderRecs();
  }
  $("[data-rec-filter]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-rec]");
    if (b) setRecFilter(b.getAttribute("data-rec"));
  });

  // ---------- Ratings ----------
  function renderRatings() {
    var rated = booksInRange().filter(function (b) { return b.rating > 0; });
    var counts = [5, 4, 3, 2, 1].map(function (s) { return rated.filter(function (b) { return b.rating === s; }).length; });
    var max = Math.max.apply(null, counts) || 1;
    var top = counts.indexOf(max);
    var avg = rated.length ? rated.reduce(function (s, b) { return s + b.rating; }, 0) / rated.length : 0;
    var fives = counts[0];
    $("[data-ratings]").innerHTML =
      '<div class="avg"><span class="stat__value">' + (avg ? avg.toFixed(2) : "–") + '</span><span class="avg__sub">across ' + rated.length + " rated books</span></div>" +
      '<div class="dist">' + counts.map(function (n, i) {
        return '<div class="dist__row' + (i === top && n ? " dist__row--top" : "") + '"><span class="dist__label">' + (5 - i) + ' <span class="star" aria-hidden="true">★</span></span>' +
          '<span class="dist__bar" aria-hidden="true"><span style="--w:' + (n / max) * 100 + "%;animation-delay:" + i * 40 + 'ms"></span></span>' +
          '<span class="dist__count">' + n + "</span></div>";
      }).join("") + "</div>" +
      (rated.length ? '<p class="insight">You rate ' + (5 - top) + " stars most often. <strong>" + fives + "</strong> books earned 5 stars" +
        (range === "all" ? ", led by Harry Potter, Dungeon Crawler Carl and Skunk Works." : ".") + "</p>" : '<p class="insight">No rated books in this time range.</p>');
  }

  // ---------- Formats ----------
  function renderFormats() {
    var total = C.formats.reduce(function (s, f) { return s + f.count; }, 0);
    $("[data-formats]").innerHTML =
      '<div class="split" role="img" aria-label="' + C.formats.map(function (f) { return f.count + " " + f.label; }).join(", ") + '">' +
      C.formats.map(function (f, i) { return '<span style="width:' + (f.count / total) * 100 + "%;background:" + f.color + ";animation-delay:" + i * 60 + 'ms"></span>'; }).join("") + "</div>" +
      '<ul class="legend">' + C.formats.map(function (f) {
        return '<li><span class="dot" style="background:' + f.color + '"></span><span>' + esc(f.label.charAt(0).toUpperCase() + f.label.slice(1)) + "</span><span><strong>" + f.count + "</strong><em>" + Math.round((f.count / total) * 100) + "%</em></span></li>";
      }).join("") + "</ul>" +
      '<p class="insight">' + esc(C.formatInsight) + "</p>";
  }

  // ---------- Listening clock ----------
  function polar(r, deg) { var a = (deg * Math.PI) / 180; return [140 + r * Math.cos(a), 140 + r * Math.sin(a)]; }
  function wedge(r0, r1, a0, a1) {
    var p1 = polar(r1, a0), p2 = polar(r1, a1), p3 = polar(r0, a1), p4 = polar(r0, a0);
    return "M" + p1 + "A" + r1 + "," + r1 + " 0 0 1 " + p2 + "L" + p3 + "A" + r0 + "," + r0 + " 0 0 0 " + p4 + "Z";
  }
  function renderListening() {
    var peakHours = [15, 16, 17];
    var wedges = C.listening.map(function (v, h) {
      if (!v) return "";
      var a0 = -90 + h * 15 + 1;
      return '<path class="clock__wedge' + (peakHours.indexOf(h) >= 0 ? " clock__wedge--peak" : "") + '" d="' + wedge(44, 44 + v * 92, a0, a0 + 13) + '" style="animation-delay:' + h * 15 + 'ms"/>';
    }).join("");
    var labels = [["12a", 0], ["6a", 6], ["12p", 12], ["6p", 18]].map(function (l) {
      var p = polar(152, -90 + l[1] * 15);
      return '<text class="clock__label" x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle" dominant-baseline="middle">' + l[0] + "</text>";
    }).join("");
    $("[data-listening]").innerHTML =
      '<div class="clock"><svg viewBox="-24 -24 328 328" role="img" aria-label="Listening by hour. Peak at ' + esc(C.listeningPeak.hour) + '.">' +
        '<circle class="clock__track" cx="140" cy="140" r="136"/>' + wedges + labels +
        '<text class="clock__center-value" x="140" y="136" text-anchor="middle">' + esc(C.listeningPeak.hour) + "</text>" +
        '<text class="clock__center-label" x="140" y="154" text-anchor="middle">peak</text>' +
      "</svg></div>" +
      '<p class="legend-inline"><span><i class="swatch" style="background:var(--data-primary)"></i>3 to 6 pm</span><span><i class="swatch" style="background:var(--data-primary-soft)"></i>Other hours</span></p>' +
      '<div class="clock-stats"><div><strong>' + esc(C.listeningPeak.share) + "</strong><span>of listening is " + esc(C.listeningPeak.window) + "</span></div>" +
        "<div><strong>" + fmt(C.hoursListened) + "</strong><span>hours listened</span></div></div>" +
      '<p class="insight">' + esc(C.listeningInsight) + "</p>";
  }

  // ---------- Section rail (≥1280 px) ----------
  var sections = $$("[data-section]");
  var rail = $("[data-section-rail]");
  rail.innerHTML = sections.map(function (s, i) {
    return '<button class="rail-item" type="button" data-target="' + i + '"><span class="rail-item__label">' + esc(s.getAttribute("data-section")) + '</span><span class="rail-item__square" aria-hidden="true"></span></button>';
  }).join("");
  $$(".rail-item", rail).forEach(function (b, i) {
    b.setAttribute("aria-label", "Jump to " + sections[i].getAttribute("data-section"));
    b.addEventListener("click", function () { sections[i].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); });
  });
  var railTick = false;
  function spy() {
    railTick = false;
    var line = window.innerHeight * 0.4, cur = 0;
    sections.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) cur = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = sections.length - 1;
    $$(".rail-item", rail).forEach(function (b, i) {
      var d = Math.abs(i - cur);
      b.style.setProperty("--s", (d === 0 ? 40 : d === 1 ? 30 : 20) + "px");
      b.setAttribute("aria-current", String(d === 0));
    });
  }
  window.addEventListener("scroll", function () { if (!railTick) { railTick = true; requestAnimationFrame(spy); } }, { passive: true });

  // ---------- Render ----------
  document.body.classList.add("is-loading");
  renderRangeOptions();
  renderHero();
  renderChallenge();
  renderFormatChips();
  renderCurrent();
  renderYears();
  renderYearBooks();
  renderGenreTabs();
  renderGenrePanel(false);
  renderRecChips();
  renderRecs();
  renderRatings();
  renderFormats();
  renderListening();
  spy();
  setTimeout(function () { document.body.classList.remove("is-loading"); }, 1200);
  // Fonts change text widths, so re-measure carousels once they load.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { window.dispatchEvent(new Event("resize")); });
})();
