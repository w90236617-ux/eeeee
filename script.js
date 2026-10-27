/* Abdul Wahab — Portfolio
   Vanilla JS: loader, theme, mobile nav, scroll reveal, active nav link,
   project tabs, tilt effect, cursor ring, contact form validation. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Loader (never gets stuck: CSS also hides it after ~3.7s) ---------- */
  function finishLoader() {
    root.classList.add('loader-done');
    try { sessionStorage.setItem('aw-loaded', '1'); } catch (e) {}
  }
  if (root.classList.contains('is-loading')) {
    var minShow = reduceMotion ? 300 : 1700;
    var started = Date.now();
    var done = false;
    var end = function () {
      if (done) return;
      done = true;
      setTimeout(finishLoader, Math.max(0, minShow - (Date.now() - started)));
    };
    if (document.readyState === 'complete') end();
    else window.addEventListener('load', end);
    setTimeout(function () { done = true; finishLoader(); }, 3000); // hard cap
  }

  /* ---------- Theme ---------- */
  var themeBtn = $('#theme-toggle');
  function applyTheme(t, persist) {
    root.setAttribute('data-theme', t);
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
      themeBtn.setAttribute('aria-label', t === 'dark' ? 'Dark mode on. Switch to light mode' : 'Light mode on. Switch to dark mode');
    }
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0b0f17' : '#f1f5fa');
    if (persist) { try { localStorage.setItem('aw-theme', t); } catch (e) {} }
  }
  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ---------- Header + mobile menu ---------- */
  var header = $('#site-header');
  var navToggle = $('#nav-toggle');
  var navMenu = $('#nav-menu');

  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    navMenu.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  navToggle.addEventListener('click', function () { setMenu(navToggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', navMenu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') { setMenu(false); navToggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (navToggle.getAttribute('aria-expanded') === 'true' && !header.contains(e.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  /* ---------- Smooth scroll for in-page links (also updates the URL hash safely) ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (history.pushState) history.pushState(null, '', id);
    });
  });

  /* ---------- Active nav link ---------- */
  var navLinks = $$('.nav-link');
  var sections = $$('main section[data-nav]');
  if ('IntersectionObserver' in window) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
      var best = null, bestVal = 0;
      sections.forEach(function (s) { if ((visible[s.id] || 0) > bestVal) { bestVal = visible[s.id]; best = s; } });
      if (best) {
        var key = best.getAttribute('data-nav');
        navLinks.forEach(function (l) {
          var on = l.getAttribute('data-nav') === key;
          l.classList.toggle('is-active', on);
          if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
        });
      }
    }, { rootMargin: '-30% 0px -45% 0px', threshold: [0, .1, .25, .5, .75, 1] });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Scroll reveal (each element animates once) ---------- */
  var revealEls = $$('.reveal, [data-stagger]');
  // Stagger delays for grid children and chip lists
  $$('[data-stagger]').forEach(function (list) {
    $$(':scope > li', list).forEach(function (li, i) { li.style.setProperty('--d', (i * 0.06) + 's'); });
  });
  $$('#panel-css .project').forEach(function (p, i) { p.style.setProperty('--d', ((i % 3) * 0.08) + 's'); });

  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Project tabs ---------- */
  var tabs = $$('.seg-btn');
  var panels = { 'tab-css': $('#panel-css'), 'tab-js': $('#panel-js') };
  var switching = false;

  function numberCards(panel) { $$('.project', panel).forEach(function (p, i) { p.style.setProperty('--n', i); }); }

  function showTab(tab, focus) {
    if (switching || tab.getAttribute('aria-selected') === 'true') { if (focus) tab.focus(); return; }
    var current = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
    var from = panels[current.id], to = panels[tab.id];
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tab.focus();

    var swap = function () {
      from.hidden = true;
      from.classList.remove('is-leaving');
      to.hidden = false;
      // Cards inside the incoming panel must be visible even if their scroll-reveal never fired
      $$('.reveal', to).forEach(function (el) { el.classList.add('is-visible'); });
      numberCards(to);
      to.classList.remove('is-entering');
      void to.offsetWidth; // restart animation
      to.classList.add('is-entering');
      switching = false;
    };
    if (reduceMotion) { swap(); return; }
    switching = true;
    from.classList.add('is-leaving');
    setTimeout(swap, 230);
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showTab(t, false); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (k === 'Home') n = tabs[0];
      else if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); showTab(n, true); }
    });
  });
  numberCards(panels['tab-css']);

  /* ---------- 3D tilt (mouse devices only, no tilt for reduced motion) ---------- */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt-max')) || 6;
      var raf = null;
      el.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - .5;
          var py = (e.clientY - r.top) / r.height - .5;
          el.style.transform = 'perspective(900px) rotateX(' + (-py * max).toFixed(2) + 'deg) rotateY(' + (px * max).toFixed(2) + 'deg) translateZ(0)';
        });
      });
      el.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.style.transform = '';
      });
    });

    /* Cursor ring: subtle, never intercepts clicks (pointer-events: none) */
    var ring = $('#cursor-ring');
    if (ring) {
      root.classList.add('has-cursor');
      var x = 0, y = 0, rx = 0, ry = 0, running = false;
      var loop = function () {
        rx += (x - rx) * .22; ry += (y - ry) * .22;
        ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
        if (Math.abs(x - rx) > .3 || Math.abs(y - ry) > .3) requestAnimationFrame(loop); else running = false;
      };
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        x = e.clientX; y = e.clientY;
        ring.classList.add('is-on');
        if (!running) { running = true; requestAnimationFrame(loop); }
      }, { passive: true });
      document.addEventListener('mouseleave', function () { ring.classList.remove('is-on'); });
      document.addEventListener('pointerover', function (e) {
        ring.classList.toggle('is-link', !!(e.target.closest && e.target.closest('a, button, [role="tab"]')));
      });
    }
  }

  /* ---------- Whole project card clickable (opens Live View / View Source link) ---------- */
  $$('.project-card').forEach(function (card) {
    var link = card.querySelector('.card-body a.btn-card');
    if (!link) return;

    var url = link.getAttribute('href');
    if (!url) return;

    link.tabIndex = -1; // avoid duplicate tab-stop; whole card is now the focusable element

    card.classList.add('project-card-clickable');
    card.tabIndex = 0;
    card.setAttribute('role', 'link');

    var titleEl = card.querySelector('.card-body h4');
    card.setAttribute('aria-label', (titleEl ? titleEl.textContent.trim() : 'Project') + ', opens in a new tab');

    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return; // let the real link handle its own click normally
      window.open(url, '_blank', 'noopener,noreferrer');
    });

    card.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) {
        e.preventDefault();
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  });

  /* ---------- Toasts ---------- */
  var toastRegion = $('#toast-region');
  function toast(type, message) {
    var icon = type === 'success' ? 'i-check' : type === 'error' ? 'i-alert' : 'i-mail';
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#' + icon + '"/></svg><span></span>' +
      '<button class="toast-close" type="button" aria-label="Dismiss notification"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>';
    $('span', el).textContent = message;
    var remove = function () {
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 300);
    };
    $('.toast-close', el).addEventListener('click', remove);
    toastRegion.appendChild(el);
    setTimeout(remove, 7000);
  }

  /* ---------- Contact form ----------
     There is no backend or email service configured, so the message is NOT sent
     anywhere. After validation the form opens the visitor's own email app with a
     pre-filled message to w90236617@gmail.com (mailto), and says so honestly. */
  var form = $('#contact-form');
  var EMAIL = 'wahababbasi752@gmail.com';
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(input, msg) {
    var field = input.closest('.field');
    var err = $('#' + input.getAttribute('aria-describedby'));
    field.classList.toggle('has-error', !!msg);
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    err.textContent = msg || '';
  }
  function validateField(input) {
    var v = input.value.trim(), msg = '';
    if (input.name === 'name') { if (!v) msg = 'Please enter your name.'; }
    else if (input.name === 'email') { if (!v) msg = 'Please enter your email address.'; else if (!emailRe.test(v)) msg = 'Please enter a valid email address.'; }
    else if (input.name === 'message') { if (!v) msg = 'Please write a message.'; }
    setError(input, msg);
    return !msg;
  }
  var inputs = $$('input, textarea', form);
  inputs.forEach(function (i) {
    i.addEventListener('blur', function () { validateField(i); });
    i.addEventListener('input', function () { if (i.closest('.field').classList.contains('has-error')) validateField(i); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var results = inputs.map(validateField);
    if (results.indexOf(false) !== -1) {
      toast('error', 'Please fix the highlighted fields and try again.');
      var firstBad = inputs[results.indexOf(false)];
      firstBad.focus();
      return;
    }
    var name = $('#cf-name').value.trim(), from = $('#cf-email').value.trim(), msg = $('#cf-message').value.trim();
    var subject = 'Portfolio message from ' + name;
    var body = msg + '\n\n— ' + name + ' (' + from + ')';
    toast('info', 'Opening your email app. Your message has not been sent yet; press Send there to deliver it to ' + EMAIL + '.');
    window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    form.reset();
  });
})();