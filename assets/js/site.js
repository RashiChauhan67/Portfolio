/* Rashi Chauhan portfolio: shared behaviour and per-page animations */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var page = doc.body.getAttribute("data-page") || "";
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var noIO = !("IntersectionObserver" in window);

  /* ---------- shared: theme ---------- */
  var themeBtn = $("#theme");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    var m = doc.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", next === "dark" ? "#0a0c12" : "#f7f6f2");
    if (page === "home" && reduce && window.__drawNet) setTimeout(window.__drawNet, 0);
  });
  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- shared: scroll progress ---------- */
  var bar = $("#progress"), rail = $("#rail"), tl = $("#timeline");
  function onScroll() {
    var h = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ")";
    if (tl && rail) {
      var r = tl.getBoundingClientRect();
      var p = (window.innerHeight * 0.6 - r.top) / r.height;
      rail.style.height = Math.max(0, Math.min(1, p)) * 100 + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- shared: reveal on scroll ---------- */
  var reveals = $$(".reveal, .eyebrow, .job, .ringcard, .yearchart");
  if (reduce || noIO) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- shared: card spotlight + cursor glow ---------- */
  if (fine && !reduce) {
    var glow = $("#glow");
    doc.addEventListener("pointermove", function (e) {
      if (glow) { glow.style.opacity = "1"; glow.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)"; }
      var c = e.target.closest ? e.target.closest(".card") : null;
      if (c) { var r = c.getBoundingClientRect(); c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px"); }
    }, { passive: true });
    doc.addEventListener("pointerleave", function () { if (glow) glow.style.opacity = "0"; });
  }

  /* ---------- shared: count-up numbers ---------- */
  function fmt(n, d) { return n.toFixed(d || 0); }
  function setFinal(el) {
    var end = parseFloat(el.dataset.count), d = parseInt(el.dataset.decimals || "0", 10);
    el.textContent = (el.dataset.prefix || "") + fmt(end, d) + (el.dataset.suffix || "");
  }
  function runCount(el) {
    var end = parseFloat(el.dataset.count), d = parseInt(el.dataset.decimals || "0", 10);
    var pre = el.dataset.prefix || "", suf = el.dataset.suffix || "", t0 = null, dur = 1600;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(end * e, d) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$("[data-count]");
  if (reduce || noIO) { counters.forEach(setFinal); }
  else if (counters.length) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) {
      c.textContent = (c.dataset.prefix || "") + fmt(0, parseInt(c.dataset.decimals || "0", 10)) + (c.dataset.suffix || "");
      co.observe(c);
    });
  }

  /* ---------- HOME: name entrance, typed line, network canvas ---------- */
  if (page === "home") {
    if (!reduce) {
      $$("h1.name .w").forEach(function (w, i) {
        w.animate([{ transform: "translateY(110%)" }, { transform: "none" }],
          { duration: 900, delay: 120 + i * 140, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" });
      });
      var typedEl = $("#typed"), phrases = ["forecasting pipelines", "customer churn models", "retrieval systems (RAG)", "medical-imaging networks", "ETL at scale"];
      var pi = 0, ci = 0, del = false;
      (function tick() {
        var full = phrases[pi]; typedEl.textContent = full.slice(0, ci);
        var wait = del ? 28 : 62;
        if (!del && ci === full.length) { del = true; wait = 1500; }
        else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 350; }
        else ci += del ? -1 : 1;
        setTimeout(tick, wait);
      })();
    }
    var cv = $("#net");
    if (cv && cv.getContext) {
      var ctx = cv.getContext("2d"), nodes = [], W = 0, H = 0, mouse = { x: -999, y: -999 }, running = true, raf = 0;
      var size = function () {
        var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
        W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var count = Math.round(Math.min(90, Math.max(28, (W * H) / 16000))); nodes = [];
        for (var i = 0; i < count; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32, r: Math.random() * 1.6 + 0.8 });
      };
      var draw = function () {
        ctx.clearRect(0, 0, W, H);
        var col = getComputedStyle(root).getPropertyValue("--node").trim() || "150,180,255", maxD = 140, i, j, a, b, dx, dy, d;
        for (i = 0; i < nodes.length; i++) {
          a = nodes[i];
          if (!reduce) {
            a.x += a.vx; a.y += a.vy;
            if (a.x < 0 || a.x > W) a.vx *= -1;
            if (a.y < 0 || a.y > H) a.vy *= -1;
            dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
            if (d < 120 && d > 0) { a.x += (dx / d) * 0.6; a.y += (dy / d) * 0.6; }
          }
          for (j = i + 1; j < nodes.length; j++) {
            b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
            if (d < maxD) { ctx.strokeStyle = "rgba(" + col + "," + (0.22 * (1 - d / maxD)).toFixed(3) + ")"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          }
          ctx.fillStyle = "rgba(" + col + ",0.75)"; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
        }
        if (!reduce && running) raf = requestAnimationFrame(draw);
      };
      window.__drawNet = draw;
      size(); draw();
      window.addEventListener("resize", function () { size(); if (reduce) draw(); });
      cv.parentNode.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
      cv.parentNode.addEventListener("pointerleave", function () { mouse.x = mouse.y = -999; });
      if (!reduce && !noIO) {
        new IntersectionObserver(function (es) { running = es[0].isIntersecting; cancelAnimationFrame(raf); if (running) draw(); }).observe(cv);
        doc.addEventListener("visibilitychange", function () { running = !doc.hidden; cancelAnimationFrame(raf); if (running) draw(); });
      }
    }
  }

  /* ---------- EXPERIENCE: ring gauges count their labels up ---------- */
  /* (ring fill is CSS-driven; the numbers use the shared count-up) */

  /* ---------- RESEARCH: publication filter ---------- */
  if (page === "research") {
    var chips = $$(".chip"), pubs = $$(".pub"), status = $("#filter-status");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.dataset.f, n = 0;
        chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        pubs.forEach(function (p) {
          var show = f === "all" || p.dataset.c.split(" ").indexOf(f) !== -1;
          p.hidden = !show; p.classList.remove("pop");
          if (show) { p.classList.add("in"); p.style.setProperty("--d", (n * 0.05) + "s"); n++; void p.offsetWidth; if (!reduce) p.classList.add("pop"); }
        });
        if (status) status.textContent = n + " publication" + (n === 1 ? "" : "s") + " shown";
      });
    });
  }

  /* ---------- PROJECTS: filter, 3D tilt, one-open-at-a-time ---------- */
  if (page === "projects") {
    var pchips = $$(".chip"), projs = $$(".proj"), pstatus = $("#filter-status");
    pchips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.dataset.f, n = 0;
        pchips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        projs.forEach(function (p) {
          var show = f === "all" || p.dataset.c.split(" ").indexOf(f) !== -1;
          p.hidden = !show; p.classList.remove("pop");
          if (show) { p.classList.add("in"); p.style.setProperty("--d", (n * 0.05) + "s"); n++; void p.offsetWidth; if (!reduce) p.classList.add("pop"); }
        });
        if (pstatus) pstatus.textContent = n + " project" + (n === 1 ? "" : "s") + " shown";
      });
    });
    projs.forEach(function (p) {
      p.addEventListener("toggle", function () {
        if (p.open) projs.forEach(function (o) { if (o !== p) o.open = false; });
      });
    });
    if (fine && !reduce) {
      projs.forEach(function (p) {
        p.addEventListener("pointermove", function (e) {
          var r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          p.style.setProperty("--ry", (x * 7).toFixed(2) + "deg"); p.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg");
        });
        p.addEventListener("pointerleave", function () { p.style.setProperty("--rx", "0deg"); p.style.setProperty("--ry", "0deg"); });
      });
    }
  }

  /* ---------- RESUME: table of contents highlight + print ---------- */
  if (page === "resume") {
    var tocLinks = $$(".toc a"), secs = tocLinks.map(function (a) { return $(a.getAttribute("href")); });
    var onTocScroll = function () {
      var cur = -1, y = window.innerHeight * 0.3;
      secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= y) cur = i; });
      tocLinks.forEach(function (a, i) { a.classList.toggle("on", i === cur); });
    };
    window.addEventListener("scroll", onTocScroll, { passive: true }); onTocScroll();
    var pb = $("#print"); if (pb) pb.addEventListener("click", function () { window.print(); });
  }

  /* ---------- CONTACT: copy email with toast ---------- */
  if (page === "contact") {
    var toast = $("#toast"), copyBtn = $("#copy");
    var show = function (msg) { toast.textContent = msg; toast.classList.add("show"); setTimeout(function () { toast.classList.remove("show"); }, 2200); };
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var addr = copyBtn.getAttribute("data-copy");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(function () { show("Email address copied"); }, function () { show("Press Ctrl/Cmd+C to copy"); });
      } else { show("Press Ctrl/Cmd+C to copy"); }
    });
  }
})();
