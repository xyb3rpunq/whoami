/* ═══════════════════════════════════════════════════════════
   Daniel Hutajulu — @xyb3rpunk
   Vanilla JS. No dependencies, no trackers, no build step.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     WALLET ADDRESSES — ganti di sini / edit here.
     Ganti nilai placeholder di bawah dengan alamat asli lo,
     lalu commit. Nggak ada tempat lain yang perlu diubah.
     ───────────────────────────────────────────────────────── */
  var WALLETS = {
    'addr-btc': 'bc1q0000placeholder0000address0000000000000',
    'addr-trc': 'T0000PLACEHOLDER0000ADDRESS00000000',
    'addr-erc': '0x0000000000000000000000000000000000000000'
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── inject wallet addresses ───────────────────────────── */
  Object.keys(WALLETS).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = WALLETS[id];
  });

  /* ── i18n ──────────────────────────────────────────────── */
  var COPY = {
    id: {
      copied: 'Alamat tersalin ke clipboard',
      copyFail: 'Alamat udah diseleksi — tekan Ctrl+C buat nyalin',
      menuOpen: 'Buka menu',
      menuClose: 'Tutup menu',
      toTop: 'Kembali ke atas',
      easter: 'Ini hal paling bodoh yang pernah gue bilang.'
    },
    en: {
      copied: 'Address copied to clipboard',
      copyFail: 'Address selected — press Ctrl+C to copy',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      toTop: 'Back to top',
      easter: "It's the stupidest thing I've ever said."
    }
  };

  var html = document.documentElement;
  var lang = 'id';
  try {
    var saved = localStorage.getItem('dh-lang');
    if (saved === 'id' || saved === 'en') lang = saved;
    else if ((navigator.language || '').slice(0, 2).toLowerCase() !== 'id') lang = 'en';
  } catch (e) { /* storage blocked — stay on default */ }

  function t(key) { return (COPY[lang] || COPY.id)[key]; }

  function applyLang() {
    html.setAttribute('lang', lang);
    html.setAttribute('data-lang', lang);

    $$('[data-i18n]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val != null) el.innerHTML = val;
    });

    $$('.copy').forEach(function (btn) {
      if (btn.classList.contains('is-done')) return;
      var label = btn.getAttribute('data-label-' + lang);
      var span = $('span', btn);
      if (span && label) span.textContent = label;
    });

    var sw = $('#langSwitch');
    if (sw) sw.setAttribute('aria-checked', lang === 'en' ? 'true' : 'false');

    var burger = $('#burger');
    if (burger) {
      burger.setAttribute('aria-label',
        burger.getAttribute('aria-expanded') === 'true' ? t('menuClose') : t('menuOpen'));
    }

    var top = $('#toTop');
    if (top) top.setAttribute('aria-label', t('toTop'));

    var skip = $('.skip-link');
    if (skip) skip.textContent = lang === 'id' ? 'Langsung ke konten' : 'Skip to content';

    var easter = $('.footer-easter');
    if (easter) easter.setAttribute('title', t('easter'));
  }

  applyLang();

  var langSwitch = $('#langSwitch');
  if (langSwitch) {
    langSwitch.addEventListener('click', function () {
      lang = lang === 'id' ? 'en' : 'id';
      try { localStorage.setItem('dh-lang', lang); } catch (e) {}
      applyLang();
    });
  }

  /* ── toast ─────────────────────────────────────────────── */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg, isErr) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('is-err', !!isErr);
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  }

  /* ── nav: stuck state, burger, scrim ───────────────────── */
  var nav = $('#nav');
  var navLinks = $('#navLinks');
  var burger = $('#burger');
  var scrim = $('#navScrim');

  function setMenu(open) {
    if (!navLinks || !burger) return;
    navLinks.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? t('menuClose') : t('menuOpen'));
    if (scrim) scrim.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  $$('#navLinks a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 820) setMenu(false);
  });

  /* ── scroll: progress bar, stuck nav, to-top ───────────── */
  var bar = $('#progressBar');
  var toTop = $('#toTop');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('is-stuck', y > 12);
    if (toTop) toTop.classList.toggle('is-on', y > 520);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('pageshow', onScroll);
  /* rAF is frozen while the tab is hidden — resync once it comes back */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) onScroll();
  });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ── reveal on scroll ──────────────────────────────────── */
  var revealables = $$('.reveal');
  function revealAll() {
    revealables.forEach(function (el) {
      el.style.transitionDelay = '0ms';
      el.classList.add('is-in');
    });
  }

  if (reduced || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var siblings = $$('.reveal', entry.target.parentNode);
        var i = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = Math.min(i < 0 ? 0 : i, 6) * 60 + 'ms';
        entry.target.classList.add('is-in');
        ro.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { ro.observe(el); });

    /* safety net: if the observer never fires (background tab, throttled
       renderer, odd embedded webview), show everything anyway */
    setTimeout(function () {
      if (!document.querySelector('.reveal.is-in')) revealAll();
    }, 1500);
  }

  /* ── active section in nav ─────────────────────────────── */
  var sections = $$('main section[id]');
  var linkFor = {};
  $$('#navLinks a[href^="#"]').forEach(function (a) {
    linkFor[a.getAttribute('href').slice(1)] = a;
  });

  if ('IntersectionObserver' in window && sections.length) {
    var current = '';
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        if (id === current) return;
        current = id;
        Object.keys(linkFor).forEach(function (key) {
          linkFor[key].classList.toggle('is-active', key === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { so.observe(s); });
  }

  /* ── donate tabs ───────────────────────────────────────── */
  var tabs = $$('.dtab');
  function selectTab(tab, focus) {
    tabs.forEach(function (other) {
      var on = other === tab;
      other.classList.toggle('is-active', on);
      other.setAttribute('aria-selected', on ? 'true' : 'false');
      other.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(other.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ── copy to clipboard ─────────────────────────────────── */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  $$('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = document.getElementById(btn.getAttribute('data-copy'));
      if (!src) return;
      var text = src.textContent.trim();

      var done = function () {
        var span = $('span', btn);
        var prev = span ? span.textContent : '';
        btn.classList.add('is-done');
        if (span) span.textContent = lang === 'id' ? 'Tersalin' : 'Copied';
        toast(t('copied'));
        setTimeout(function () {
          btn.classList.remove('is-done');
          if (span) span.textContent = btn.getAttribute('data-label-' + lang) || prev;
        }, 2000);
      };
      /* last resort: select the address so the user only has to hit Ctrl+C */
      var fail = function () {
        try {
          var range = document.createRange();
          range.selectNodeContents(src);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) { /* selection unavailable — the toast still explains */ }
        toast(t('copyFail'), true);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () {
          legacyCopy(text) ? done() : fail();
        });
      } else {
        legacyCopy(text) ? done() : fail();
      }
    });
  });

  /* ── card spotlight ────────────────────────────────────── */
  if (!reduced && window.matchMedia('(hover:hover)').matches) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    /* portrait parallax */
    var portrait = $('#portrait');
    var portraitImg = portrait ? $('img', portrait) : null;
    if (portraitImg) {
      window.addEventListener('pointermove', function (e) {
        var dx = (e.clientX / window.innerWidth - 0.5) * 16;
        var dy = (e.clientY / window.innerHeight - 0.5) * 16;
        portraitImg.style.setProperty('--px', dx.toFixed(2) + 'px');
        portraitImg.style.setProperty('--py', dy.toFixed(2) + 'px');
      }, { passive: true });
    }
  }

  /* ── footer year ───────────────────────────────────────── */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ── background: particle mesh ─────────────────────────── */
  (function () {
    var canvas = $('#bgCanvas');
    if (!canvas || reduced) { if (canvas) canvas.style.display = 'none'; return; }

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var w = 0, h = 0, nodes = [], raf = null, paused = false;

    function count() {
      var area = window.innerWidth * window.innerHeight;
      return Math.max(26, Math.min(78, Math.round(area / 20000)));
    }

    function size() {
      var de = document.documentElement;
      w = window.innerWidth || de.clientWidth || 0;
      h = window.innerHeight || de.clientHeight || 0;
      if (!w || !h) return false;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    function seed() {
      var n = count();
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.3 + 0.5
        });
      }
    }

    var LINK = 132;
    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;

        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          var alpha = (1 - Math.sqrt(d2) / LINK) * 0.24;
          ctx.strokeStyle = 'rgba(120,190,235,' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(160,215,245,.5)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (raf || paused) return;
      raf = window.requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    }

    /* the viewport can still report 0 while the page is being set up
       (hidden tab, embedded webview) — keep trying until it is real */
    function boot(attempt) {
      if (size()) { seed(); start(); return; }
      if (attempt < 40) setTimeout(function () { boot(attempt + 1); }, 150);
    }
    boot(0);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (size()) seed(); }, 180);
    });

    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
      if (paused) { stop(); return; }
      if (!canvas.width && size()) seed();
      start();
    });
  })();
})();
