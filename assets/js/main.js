/* ORRERY HOUSE — main.js
   Theme (oh-theme), nav, reveal fallback, dial sweep, tick chime,
   demo forms. No frameworks, no third-party requests. */
(function () {
  'use strict';
  var d = document;
  var root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */
  var KEY = 'oh-theme';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'nightwork' || saved === 'ivory') root.setAttribute('data-theme', saved);
  var toggle = d.querySelector('.theme-toggle');
  if (toggle) {
    var label = function () {
      toggle.textContent = root.getAttribute('data-theme') === 'nightwork' ? 'Ivory hours' : 'Nightwork';
      toggle.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'nightwork' ? 'true' : 'false');
    };
    label();
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'nightwork' ? 'ivory' : 'nightwork';
      if (next === 'ivory') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      label();
    });
  }

  /* ---------- mobile nav ---------- */
  var navToggle = d.querySelector('.nav-toggle');
  var nav = d.querySelector('.main-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- scroll progress (escapement bar) ---------- */
  var bar = d.querySelector('.progress');
  if (bar && !reduce) {
    var onScroll = function () {
      var h = d.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
    };
    d.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- reveal: IntersectionObserver + fallback ---------- */
  var items = [].slice.call(d.querySelectorAll('.rv'));
  var supportsNative = false;
  try { supportsNative = CSS.supports('animation-timeline: view()'); } catch (e) {}
  if (!supportsNative && 'IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- sweep-second-hand dial follows scroll ---------- */
  var dial = d.querySelector('.dial .hand');
  if (dial && !reduce) {
    var setHand = function () {
      var h = d.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var deg = max > 0 ? (h.scrollTop / max) * 360 : 0;
      dial.style.transform = 'rotate(' + deg + 'deg)';
    };
    d.addEventListener('scroll', setHand, { passive: true });
    setHand();
  }

  /* ---------- page transition veil on internal nav ---------- */
  var veil = d.querySelector('.veil');
  if (veil && !reduce) {
    d.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || a.target === '_blank' || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      if (/^https?:/i.test(href) && href.indexOf(location.host) === -1) return;
      if (href.charAt(0) === '#') return;
      ev.preventDefault();
      veil.classList.add('on');
      setTimeout(function () { location.href = href; }, 260);
    });
  }

  /* ---------- tick chime (press T) ---------- */
  var audioCtx = null;
  function tick() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      var t = audioCtx.currentTime;
      [1568, 2093].forEach(function (f, i) {
        var o = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(i ? 0.03 : 0.06, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(g).connect(audioCtx.destination);
        o.start(t); o.stop(t + 0.3);
      });
    } catch (e) {}
  }
  d.addEventListener('keydown', function (ev) {
    if (ev.key === 't' || ev.key === 'T') {
      if (/^(input|textarea|select)$/i.test(d.activeElement.tagName)) return;
      tick();
      toast('Tick. The escapement approves.');
    }
  });

  /* ---------- toast ---------- */
  var toastEl = d.querySelector('.toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }
  window.ohToast = toast;

  /* ---------- demo forms ---------- */
  [].slice.call(d.querySelectorAll('form[data-demo]')).forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var bad = false;
      [].slice.call(form.querySelectorAll('[required]')).forEach(function (f) {
        var empty = !f.value.trim();
        var mail = f.type === 'email' && f.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value);
        if (empty || mail) {
          f.setAttribute('aria-invalid', 'true');
          var m = f.closest('.field') && f.closest('.field').querySelector('.error-msg');
          if (m) m.setAttribute('data-show', '');
          bad = true;
        } else {
          f.removeAttribute('aria-invalid');
          var mm = f.closest('.field') && f.closest('.field').querySelector('.error-msg');
          if (mm) mm.removeAttribute('data-show');
        }
      });
      if (bad) { toast('A few fields need attention.'); return; }
      toast('This is a demonstration form. Nothing was sent.');
      form.reset();
    });
  });

  /* ---------- footer year ---------- */
  var y = d.querySelector('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());
})();
