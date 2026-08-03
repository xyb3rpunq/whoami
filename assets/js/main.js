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
      cmdkPlaceholder: 'Ketik buat nyari…',
      cmdkOpen: 'Buka panel perintah',
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
      cmdkPlaceholder: 'Type to search…',
      cmdkOpen: 'Open command palette',
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

    var cmdkInput = $('#cmdkInput');
    if (cmdkInput) cmdkInput.setAttribute('placeholder', t('cmdkPlaceholder'));
    var cmdkOpen = $('#cmdkOpen');
    if (cmdkOpen) cmdkOpen.setAttribute('aria-label', t('cmdkOpen'));

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
    renderProjectStats();
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

  /* ── live project stats ────────────────────────────────────
     Diisi .github/workflows/refresh-projects.yml tiap hari. Kalau
     berkasnya belum ada atau gagal diambil, kartu tetap tampil apa
     adanya — tidak ada yang rusak. */
  var projectStats = null;

  function relTime(iso) {
    var then = new Date(iso).getTime();
    if (!then) return '';
    var days = Math.floor((Date.now() - then) / 86400000);
    var id = lang === 'id';
    if (days <= 0) return id ? 'hari ini' : 'today';
    if (days === 1) return id ? 'kemarin' : 'yesterday';
    if (days < 30) return id ? days + ' hari lalu' : days + ' days ago';
    var months = Math.floor(days / 30);
    if (months < 12) return id ? months + ' bulan lalu' : months + (months === 1 ? ' month ago' : ' months ago');
    var years = Math.floor(months / 12);
    return id ? years + ' tahun lalu' : years + (years === 1 ? ' year ago' : ' years ago');
  }

  function renderProjectStats() {
    if (!projectStats || !projectStats.repos) return;
    $$('.proj[data-repo]').forEach(function (card) {
      var info = projectStats.repos[card.getAttribute('data-repo')];
      if (!info || !info.pushedAt) return;

      var line = card.querySelector('.proj-live');
      if (!line) {
        line = document.createElement('p');
        line.className = 'proj-live';
        var tags = card.querySelector('.tags');
        if (tags && tags.parentNode) tags.parentNode.insertBefore(line, tags.nextSibling);
        else card.appendChild(line);
      }
      while (line.firstChild) line.removeChild(line.firstChild);

      var dot = document.createElement('i');
      dot.setAttribute('aria-hidden', 'true');
      line.appendChild(dot);

      var txt = (lang === 'id' ? 'diperbarui ' : 'updated ') + relTime(info.pushedAt);
      /* nol bintang lebih baik tidak ditampilkan sama sekali */
      if (info.stars > 0) txt += ' · ★ ' + info.stars;
      line.appendChild(document.createTextNode(txt));
    });
  }

  fetch('assets/data/projects.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) { projectStats = data; renderProjectStats(); })
    .catch(function () { /* offline atau berkas belum ada — abaikan */ });

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

  /* ── command palette (Ctrl/⌘+K) ────────────────────────── */
  (function () {
    var root = $('#cmdk'), input = $('#cmdkInput'), list = $('#cmdkList'),
        empty = $('#cmdkEmpty'), opener = $('#cmdkOpen'), scrim = $('#cmdkScrim');
    if (!root || !input || !list) return;

    var ICON = {
      jump: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
      out: '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>',
      down: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 10.5L12 15l4.5-4.5M4 19.5h16"/></svg>',
      copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5.5 15H4.6A1.6 1.6 0 0 1 3 13.4V4.6A1.6 1.6 0 0 1 4.6 3h8.8A1.6 1.6 0 0 1 15 4.6v.9"/></svg>',
      lang: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15 0 18M12 3c-2.5 2.7-2.5 15 0 18"/></svg>',
      up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>'
    };

    /* labels come straight from the page so they always match the
       active language without a second translation table */
    function textOf(sel, fallback) {
      var el = $(sel);
      return el ? el.textContent.trim() : fallback;
    }

    function commands() {
      var goLabel = lang === 'id' ? 'Buka' : 'Go to';
      var out = [];

      $$('#navLinks a[href^="#"]').forEach(function (a) {
        out.push({
          group: lang === 'id' ? 'Bagian' : 'Sections',
          label: goLabel + ' ' + a.textContent.trim(),
          hint: a.getAttribute('href'),
          icon: ICON.jump,
          run: function () { jumpTo(a.getAttribute('href')); }
        });
      });

      [['Instagram', 'https://www.instagram.com/danielxyz_/', '@danielxyz_'],
       ['X', 'https://x.com/xyb3rpunk', '@xyb3rpunk'],
       ['LinkedIn', 'https://www.linkedin.com/in/daniel-hutajulu23/', 'daniel-hutajulu23'],
       ['GitHub', 'https://github.com/xyb3rpunq', 'xyb3rpunq']
      ].forEach(function (s) {
        out.push({
          group: lang === 'id' ? 'Sosial' : 'Social',
          label: (lang === 'id' ? 'Buka ' : 'Open ') + s[0],
          hint: s[2],
          icon: ICON.out,
          run: function () { window.open(s[1], '_blank', 'noopener,noreferrer'); }
        });
      });

      out.push({
        group: lang === 'id' ? 'Aksi' : 'Actions',
        label: lang === 'id' ? 'Unduh CV' : 'Download CV',
        hint: 'PDF',
        icon: ICON.down,
        run: function () {
          var a = document.createElement('a');
          a.href = 'assets/cv/Daniel-Hutajulu-CV.pdf';
          a.download = 'Daniel-Hutajulu-CV.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });

      [['addr-btc', 'BTC'], ['addr-trc', 'USDT TRC20'], ['addr-erc', 'USDT ERC20']].forEach(function (a) {
        out.push({
          group: lang === 'id' ? 'Aksi' : 'Actions',
          label: (lang === 'id' ? 'Salin alamat ' : 'Copy ') + a[1] + (lang === 'id' ? '' : ' address'),
          hint: lang === 'id' ? 'clipboard' : 'clipboard',
          icon: ICON.copy,
          run: function () {
            var btn = $('.copy[data-copy="' + a[0] + '"]');
            jumpTo('#support');
            if (btn) btn.click();
          }
        });
      });

      out.push({
        group: lang === 'id' ? 'Aksi' : 'Actions',
        label: lang === 'id' ? 'Ganti bahasa ke English' : 'Switch language to Indonesia',
        hint: lang === 'id' ? 'EN' : 'ID',
        icon: ICON.lang,
        run: function () { if (langSwitch) langSwitch.click(); }
      });

      out.push({
        group: lang === 'id' ? 'Aksi' : 'Actions',
        label: lang === 'id' ? 'Kembali ke atas' : 'Back to top',
        hint: 'home',
        icon: ICON.up,
        run: function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); }
      });

      return out;
    }

    function jumpTo(hash) {
      var target = document.querySelector(hash);
      if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }

    var all = [], shown = [], cursor = 0, lastFocus = null;

    function score(cmd, q) {
      var hay = (cmd.label + ' ' + cmd.hint + ' ' + cmd.group).toLowerCase();
      if (!q) return 1;
      if (hay.indexOf(q) === 0) return 3;
      if (hay.indexOf(q) > -1) return 2;
      /* loose subsequence match so "prj" still finds "Buka Proyek" */
      var i = 0;
      for (var c = 0; c < hay.length && i < q.length; c++) if (hay[c] === q[i]) i++;
      return i === q.length ? 1 : 0;
    }

    function render() {
      var q = input.value.trim().toLowerCase();
      shown = all
        .map(function (c) { return { c: c, s: score(c, q) }; })
        .filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .map(function (x) { return x.c; });

      while (list.firstChild) list.removeChild(list.firstChild);
      cursor = 0;

      var group = '';
      shown.forEach(function (cmd, i) {
        if (cmd.group !== group && !q) {
          group = cmd.group;
          var head = document.createElement('li');
          head.className = 'cmdk-group';
          head.setAttribute('role', 'presentation');
          head.textContent = group;
          list.appendChild(head);
        }
        var li = document.createElement('li');
        li.setAttribute('role', 'presentation');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cmdk-item';
        btn.setAttribute('role', 'option');
        btn.id = 'cmdk-opt-' + i;
        btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');

        var ico = document.createElement('span');
        ico.className = 'cmdk-ico';
        ico.setAttribute('aria-hidden', 'true');
        ico.innerHTML = cmd.icon;

        var txt = document.createElement('span');
        txt.className = 'cmdk-txt';
        txt.textContent = cmd.label;

        var hint = document.createElement('span');
        hint.className = 'cmdk-hint';
        hint.textContent = cmd.hint;

        btn.appendChild(ico);
        btn.appendChild(txt);
        btn.appendChild(hint);
        btn.addEventListener('click', function () { close(); cmd.run(); });
        btn.addEventListener('mousemove', function () { move(i - cursor); });
        li.appendChild(btn);
        list.appendChild(li);
      });

      empty.hidden = shown.length > 0;
      sync();
    }

    function items() { return $$('.cmdk-item', list); }

    function sync() {
      var els = items();
      els.forEach(function (el, i) { el.setAttribute('aria-selected', i === cursor ? 'true' : 'false'); });
      if (els[cursor]) {
        input.setAttribute('aria-activedescendant', els[cursor].id);
        els[cursor].scrollIntoView({ block: 'nearest' });
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    function move(delta) {
      var n = items().length;
      if (!n) return;
      cursor = (cursor + delta + n) % n;
      sync();
    }

    function open() {
      if (!root.hidden) return;
      lastFocus = document.activeElement;
      all = commands();
      input.value = '';
      root.hidden = false;
      document.body.style.overflow = 'hidden';
      render();
      input.focus();
    }

    function close() {
      if (root.hidden) return;
      root.hidden = true;
      /* the mobile drawer locks scroll too — don't unlock it out from under it */
      var drawer = $('#navLinks');
      if (!drawer || !drawer.classList.contains('is-open')) document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    input.addEventListener('input', render);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Home') { e.preventDefault(); cursor = 0; sync(); }
      else if (e.key === 'End') { e.preventDefault(); cursor = Math.max(0, items().length - 1); sync(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var cmd = shown[cursor];
        if (cmd) { close(); cmd.run(); }
      } else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
    });

    if (scrim) scrim.addEventListener('click', close);
    if (opener) opener.addEventListener('click', open);

    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) ||
                   e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        root.hidden ? open() : close();
      } else if (e.key === '/' && !typing && root.hidden) {
        e.preventDefault();
        open();
      }
    });
  })();

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
