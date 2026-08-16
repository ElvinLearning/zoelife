/* ============================================================
   ZOE LIFE — interactions & scroll choreography
   gsap + ScrollTrigger + Lenis (all vendored, no CDN)
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* shared scroll state — read every frame by the WebGL scene (js/scene.js) */
  window.ZOE = window.ZOE || {};
  window.ZOE.reduced = reduced;
  window.ZOE.scroll = { hero: 0, verseIn: 0, verseOut: 0 };

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (!reduced && typeof Lenis !== 'undefined' && hasGsap) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollTo(target) {
    var el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- word splitting ---------- */
  function splitWords(el) {
    var process = function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.replace(/[\n\r\t ]+/g, ' ').split(/( )/).forEach(function (part) {
          if (!part) return;
          if (part === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w';
          var wi = document.createElement('span'); wi.className = 'wi';
          wi.textContent = part;
          w.appendChild(wi); frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        Array.prototype.slice.call(node.childNodes).forEach(process);
      }
    };
    Array.prototype.slice.call(el.childNodes).forEach(process);
    return $$('.wi', el);
  }

  var heroWords = [];
  $$('[data-split]').forEach(function (el) {
    var words = splitWords(el);
    if (el.closest('#hero')) { heroWords = heroWords.concat(words); return; }
    if (!hasGsap || reduced) return;
    gsap.to(words, {
      y: 0, duration: 1.15, ease: 'power4.out', stagger: 0.045,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* ---------- reveal-on-scroll (everything except the hero) ---------- */
  var heroReveals = $$('#hero .reveal');
  var otherReveals = $$('.reveal').filter(function (el) { return !el.closest('#hero'); });
  if (reduced || !('IntersectionObserver' in window)) {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    otherReveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- preloader & hero intro ---------- */
  var loader = $('#loader');
  function heroIn() {
    var gl = $('#gl');
    if (gl) gl.classList.add('on');
    if (hasGsap && !reduced && heroWords.length) {
      gsap.to(heroWords, { y: 0, duration: 1.3, ease: 'power4.out', stagger: 0.06, delay: 0.1 });
    }
    heroReveals.forEach(function (el, i) {
      el.style.transitionDelay = (0.45 + i * 0.14) + 's';
      el.classList.add('in');
      setTimeout(function () { el.style.transitionDelay = ''; }, 2600);
    });
  }
  if (loader && hasGsap && !reduced) {
    document.documentElement.style.overflow = 'hidden';
    var count = { n: 0 };
    var countEl = $('#loadCount');
    gsap.timeline({
      onComplete: function () {
        document.documentElement.style.overflow = '';
        loader.style.display = 'none';
        ScrollTrigger.refresh();
      }
    })
      .to(count, {
        n: 100, duration: 1.5, ease: 'power2.inOut',
        onUpdate: function () { if (countEl) countEl.textContent = Math.round(count.n); }
      })
      .to('.loader-inner', { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in' }, '-=0.1')
      .to('.loader-panel', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.15')
      .add(heroIn, '-=0.75');
  } else {
    if (loader) loader.style.display = 'none';
    heroIn();
    if (reduced) {
      heroReveals.forEach(function (el) { el.classList.add('in'); });
    } else if (!hasGsap) {
      $$('[data-split] .wi').forEach(function (w) { w.style.transform = 'none'; });
    }
  }

  /* ---------- scroll progress state for the 3D scene ---------- */
  if (hasGsap && !reduced) {
    ScrollTrigger.create({
      trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: function (self) { window.ZOE.scroll.hero = self.progress; }
    });
    ScrollTrigger.create({
      trigger: '#verse', start: 'top bottom', end: 'center center', scrub: true,
      onUpdate: function (self) { window.ZOE.scroll.verseIn = self.progress; }
    });
    ScrollTrigger.create({
      trigger: '#verse', start: 'center center', end: 'bottom top', scrub: true,
      onUpdate: function (self) { window.ZOE.scroll.verseOut = self.progress; }
    });
  }

  /* ---------- top progress bar ---------- */
  var bar = $('#progressBar');
  if (bar && hasGsap) {
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) { bar.style.transform = 'scaleX(' + self.progress + ')'; }
    });
  }

  /* ---------- nav: shade + hide on scroll down ---------- */
  var nav = $('#nav');
  var lastY = 0;
  function onScrollY(y) {
    if (!nav) return;
    nav.classList.toggle('scrolled', y > 60);
    if (y > lastY + 6 && y > 200) nav.classList.add('hidden');
    else if (y < lastY - 4) nav.classList.remove('hidden');
    lastY = y;
  }
  if (lenis) lenis.on('scroll', function (e) { onScrollY(e.scroll); });
  else window.addEventListener('scroll', function () { onScrollY(window.scrollY); }, { passive: true });

  /* ---------- anchor links ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = $(id);
      if (!el) return;
      ev.preventDefault();
      closeMenu();
      scrollTo(el);
    });
  });

  /* ---------- mobile menu ---------- */
  var burger = $('#burger');
  var menu = $('#menu');
  function closeMenu() {
    if (!menu || !menu.classList.contains('open')) return;
    menu.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
  }

  /* ---------- pinned horizontal rail ---------- */
  var track = $('#railTrack');
  if (track && hasGsap && !reduced) {
    gsap.to(track, {
      x: function () { return -(track.scrollWidth - window.innerWidth); },
      ease: 'none',
      scrollTrigger: {
        trigger: '#coming',
        start: 'top top',
        end: function () { return '+=' + (track.scrollWidth - window.innerWidth); },
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
  }

  /* ---------- 3D book scrub ---------- */
  var book = $('#book3d');
  if (book && hasGsap && !reduced) {
    gsap.fromTo(book,
      { rotationY: -46, rotationX: 6 },
      {
        rotationY: 18, rotationX: 2, ease: 'none',
        scrollTrigger: { trigger: '#book', start: 'top 85%', end: 'bottom 20%', scrub: 1.2 }
      });
  }

  /* ---------- magnetic buttons ---------- */
  var fine = window.matchMedia('(pointer: fine)').matches;
  if (fine && hasGsap && !reduced) {
    $$('[data-magnet]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.45);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- custom cursor ---------- */
  var cursor = $('.cursor');
  if (fine && cursor && !reduced) {
    var dot = $('.cursor-dot'), ring = $('.cursor-ring');
    var mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', function (e) {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, input, select, textarea'));
    });
  }

  /* ---------- "coming at launch" links ---------- */
  var toast = $('#toast');
  var toastTimer = null;
  $$('a[data-soon]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!toast) return;
      toast.textContent = 'This link goes live with the book — end of August ✦';
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
    });
  });

  /* ---------- contact form (concept wiring) ---------- */
  var form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var btn = $('button[type="submit"]', form);
      var done = $('#formDone');
      if (btn) { btn.disabled = true; btn.textContent = 'Sent ✦'; }
      if (done) done.hidden = false;
    });
  }

  /* ---------- keep triggers honest after fonts/layout settle ---------- */
  window.addEventListener('load', function () {
    if (hasGsap) ScrollTrigger.refresh();
  });
})();
