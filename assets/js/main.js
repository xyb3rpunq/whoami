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

  /* ─────────────────────────────────────────────────────────
     PODCAST EPISODES — kosongin buat state "segera hadir".
     Isi satu objek aja, pemutarnya langsung nyala:

       { title: 'Ep 01 — Gagal 7 kali',
         url:   'https://open.spotify.com/episode/XXXXXXXX' }

     Didukung: Spotify (episode/show), YouTube (watch/youtu.be),
     dan file audio langsung (.mp3/.m4a/.ogg/.wav).
     ───────────────────────────────────────────────────────── */
  var EPISODES = [];

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
      easter: 'Ini hal paling bodoh yang pernah gue bilang.',
      podPrompt: 'podcast --status',
      podSoon: 'Episode pertama lagi digarap',
      podBody: 'Belum ada yang tayang. Gue nggak mau rilis cuma buat rilis — pengennya episode pertama itu yang emang layak didengerin sampai habis.',
      podNow: 'Sedang diputar'
    },
    en: {
      copied: 'Address copied to clipboard',
      copyFail: 'Address selected — press Ctrl+C to copy',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      toTop: 'Back to top',
      easter: "It's the stupidest thing I've ever said.",
      podPrompt: 'podcast --status',
      podSoon: 'Episode one is in the works',
      podBody: "Nothing is out yet. I don't want to ship just to ship — I'd rather the first episode be one worth listening to all the way through.",
      podNow: 'Now playing'
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

    /* the rail is dots only — borrow each section's name from the navbar
       so screen readers get a real label in the active language */
    $$('.rail a[href^="#"]').forEach(function (a) {
      var href = a.getAttribute('href');
      var twin = $('#navLinks a[href="' + href + '"]');
      var label = twin ? twin.textContent.trim()
                       : (lang === 'id' ? 'Beranda' : 'Home');
      a.setAttribute('aria-label', label);
      a.setAttribute('title', label);
    });

    renderPodcast();
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

  /* ── podcast player ────────────────────────────────────── */
  function embedFor(url) {
    var m;
    if ((m = url.match(/open\.spotify\.com\/(?:embed\/)?(episode|show|track|playlist)\/([A-Za-z0-9]+)/))) {
      return { type: 'iframe', src: 'https://open.spotify.com/embed/' + m[1] + '/' + m[2] + '?theme=0', height: 232 };
    }
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/))) {
      return { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + m[1], height: 315 };
    }
    if (/\.(mp3|m4a|ogg|wav|aac)(\?|$)/i.test(url)) return { type: 'audio', src: url };
    return { type: 'link', src: url };
  }

  function renderPodcast() {
    var host = $('#podPlayer');
    if (!host) return;

    while (host.firstChild) host.removeChild(host.firstChild);

    /* ── nothing published yet: designed empty state ── */
    if (!EPISODES.length) {
      host.setAttribute('data-empty', 'true');

      var box = document.createElement('div');
      box.className = 'pod-console';

      var l1 = document.createElement('p');
      l1.className = 'l1';
      l1.appendChild(document.createTextNode('~ $ '));
      var b = document.createElement('b');
      b.textContent = t('podPrompt');
      l1.appendChild(b);

      var l2 = document.createElement('p');
      l2.className = 'l2';
      l2.textContent = t('podSoon');

      var l3 = document.createElement('p');
      l3.className = 'l3';
      l3.textContent = t('podBody');

      var wave = document.createElement('div');
      wave.className = 'pod-wave';
      wave.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 26; i++) {
        var bar = document.createElement('i');
        bar.style.animationDelay = (i * 0.07).toFixed(2) + 's';
        bar.style.animationDuration = (0.9 + (i % 5) * 0.22).toFixed(2) + 's';
        wave.appendChild(bar);
      }

      box.appendChild(l1);
      box.appendChild(l2);
      box.appendChild(l3);
      box.appendChild(wave);
      host.appendChild(box);
      return;
    }

    /* ── episodes configured: real player ── */
    host.removeAttribute('data-empty');
    var stage = document.createElement('div');
    stage.className = 'pod-stage';
    host.appendChild(stage);

    var list = document.createElement('ul');
    list.className = 'pod-list';
    var buttons = [];

    function play(index) {
      var ep = EPISODES[index];
      var e = embedFor(ep.url);
      while (stage.firstChild) stage.removeChild(stage.firstChild);

      if (e.type === 'iframe') {
        var f = document.createElement('iframe');
        f.className = 'pod-embed';
        f.src = e.src;
        f.height = e.height;
        f.title = ep.title;
        f.loading = 'lazy';
        f.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture';
        f.setAttribute('allowfullscreen', '');
        f.referrerPolicy = 'no-referrer-when-downgrade';
        stage.appendChild(f);
      } else if (e.type === 'audio') {
        var a = document.createElement('audio');
        a.className = 'pod-embed';
        a.controls = true;
        a.preload = 'none';
        a.src = e.src;
        stage.appendChild(a);
      } else {
        var link = document.createElement('a');
        link.className = 'btn btn-primary';
        link.href = e.src;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = ep.title;
        stage.appendChild(link);
      }

      buttons.forEach(function (btn, i) {
        btn.classList.toggle('is-playing', i === index);
        btn.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    EPISODES.forEach(function (ep, i) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pod-ep';
      var num = document.createElement('b');
      num.textContent = String(i + 1).padStart(2, '0');
      btn.appendChild(num);
      btn.appendChild(document.createTextNode(ep.title));
      btn.addEventListener('click', function () { play(i); });
      buttons.push(btn);
      li.appendChild(btn);
      list.appendChild(li);
    });

    host.appendChild(list);
    play(0);
  }

  /* ── hero terminal line ────────────────────────────────── */
  (function () {
    var el = $('#termCmd');
    if (!el) return;
    var cmds = ['whoami', 'cat manifesto.md', 'ls ~/focus', 'git log --oneline'];

    if (reduced) { el.textContent = cmds[0]; return; }

    var ci = 0, pos = 0, deleting = false;
    (function tick() {
      var word = cmds[ci];
      pos += deleting ? -1 : 1;
      el.textContent = word.slice(0, pos);

      var wait = deleting ? 34 : 66;
      if (!deleting && pos === word.length) { deleting = true; wait = 1900; }
      else if (deleting && pos === 0) { deleting = false; ci = (ci + 1) % cmds.length; wait = 420; }

      setTimeout(tick, wait);
    })();
  })();

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
  $$('#navLinks a[href^="#"], .rail a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    (linkFor[id] = linkFor[id] || []).push(a);
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
          linkFor[key].forEach(function (a) { a.classList.toggle('is-active', key === id); });
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
    $$('.card, .proj').forEach(function (card) {
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
