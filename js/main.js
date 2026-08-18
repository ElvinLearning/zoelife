/* Zoe Life interactions. GSAP, ScrollTrigger and Lenis are vendored locally. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var $ = function (selector, context) { return (context || document).querySelector(selector); };
  var $$ = function (selector, context) { return Array.prototype.slice.call((context || document).querySelectorAll(selector)); };

  window.ZOE = window.ZOE || {};
  window.ZOE.reduced = reduced;
  window.ZOE.scroll = { hero: 0, verseIn: 0, verseOut: 0 };

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  var lenis = null;
  if (!reduced && typeof Lenis !== 'undefined' && hasGsap) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToElement(target) {
    var element = typeof target === 'string' ? $(target) : target;
    if (!element) return;
    if (lenis) lenis.scrollTo(element, { offset: -20, duration: 1.2 });
    else element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  var loader = $('#loader');
  var loadCount = $('#loadCount');
  var loaderFinished = false;

  function finishLoader() {
    if (loaderFinished) return;
    loaderFinished = true;
    if (loader) loader.style.display = 'none';
    document.documentElement.style.overflow = '';
    var canvas = $('#gl');
    if (canvas) canvas.classList.add('on');
    if (hasGsap && !reduced) {
      gsap.from('.hero-inner > *', { y: 26, opacity: 0, duration: .9, stagger: .09, ease: 'power3.out', clearProps: 'all' });
      ScrollTrigger.refresh();
    }
  }

  if (loader && hasGsap && !reduced) {
    document.documentElement.style.overflow = 'hidden';
    var counter = { value: 0 };
    gsap.timeline({ onComplete: finishLoader })
      .to(counter, { value: 100, duration: .8, ease: 'power2.inOut', onUpdate: function () { loadCount.textContent = Math.round(counter.value); } })
      .to('.loader-inner', { opacity: 0, y: -18, duration: .25 }, '-=.05')
      .to('.loader-panel', { yPercent: -100, duration: .6, ease: 'power4.inOut' }, '-=.08');
    window.setTimeout(finishLoader, 1900);
  } else {
    finishLoader();
  }

  if (hasGsap) {
    ScrollTrigger.create({ trigger: '#top', start: 'top top', end: 'bottom top', scrub: true, onUpdate: function (self) { window.ZOE.scroll.hero = self.progress; } });
    ScrollTrigger.create({ trigger: '#verse', start: 'top bottom', end: 'center center', scrub: true, onUpdate: function (self) { window.ZOE.scroll.verseIn = self.progress; } });
    ScrollTrigger.create({ trigger: '#verse', start: 'center center', end: 'bottom top', scrub: true, onUpdate: function (self) { window.ZOE.scroll.verseOut = self.progress; } });

    var progressBar = $('#progressBar');
    if (progressBar) ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (self) { progressBar.style.transform = 'scaleX(' + self.progress + ')'; } });

    var nav = $('#nav');
    if (nav) ScrollTrigger.create({ start: 60, end: 'max', onToggle: function (self) { nav.classList.toggle('scrolled', self.isActive); } });
  }

  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var target = link.getAttribute('href');
      if (!target || target.length < 2 || !$(target)) return;
      event.preventDefault();
      closeMenu();
      scrollToElement(target);
    });
  });

  var burger = $('#burger');
  var menu = $('#menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) {
      var firstLink = $('a', menu);
      if (firstLink) firstLink.focus();
    }
  }
  function closeMenu() { setMenu(false); }
  if (burger && menu) burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && menu && menu.classList.contains('open')) { closeMenu(); burger.focus(); } });

  var seasons = {
    building: {
      name: 'Building', letter: 'B', kicker: 'Foundations and first decisions',
      copy: 'Something new is taking shape: a marriage, a family rhythm, a degree, a role or a clearer life direction. This season calls for foundations you can return to.',
      path: 'Relationships and Family or Academic and Career',
      image: 'assets/current-site/about-guidance.jpg', alt: 'Adults gathered around an open Bible'
    },
    waiting: {
      name: 'Waiting', letter: 'W', kicker: 'Patience and preparation',
      copy: 'Not every season moves on your preferred timeline. Waiting can still hold reflection, preparation, honest questions and faithful next actions.',
      path: 'Faith and Life Resources',
      image: 'assets/current-site/coaching-zoe-life.jpg', alt: 'Two women in a coaching conversation'
    },
    growing: {
      name: 'Growing', letter: 'G', kicker: 'Practice and steady change',
      copy: 'Growth often looks ordinary while it is happening. It can take shape through better habits, stronger relationships, deeper faith and more thoughtful choices.',
      path: 'Choose the pathway closest to your current focus',
      image: 'assets/current-site/services-professional.jpg', alt: 'People in a professional conversation'
    },
    healing: {
      name: 'Healing', letter: 'H', kicker: 'Care and a gentler pace',
      copy: 'Some seasons call for space to reflect, rebuild trust and choose wise support. Zoe Life coaching is practical and faith-centered, and it does not replace professional mental health care.',
      path: 'Relationships and Family or Faith and Life Resources',
      image: 'assets/current-site/coaching-zoe-life.jpg', alt: 'Two women in a coaching conversation'
    },
    leading: {
      name: 'Leading', letter: 'L', kicker: 'Responsibility and influence',
      copy: 'Leadership reaches beyond a title. It includes how you serve, make decisions, build trust, steward resources and help other people grow.',
      path: 'Academic and Career or Faith and Life Resources',
      image: 'assets/current-site/services-professional.jpg', alt: 'People in a professional conversation'
    }
  };

  var seasonPanel = $('#season-panel');
  var seasonPhoto = $('#season-photo');
  function selectSeason(key, syncPathfinder) {
    var item = seasons[key];
    if (!item || !seasonPanel) return;
    $$('.season-option').forEach(function (button) { button.setAttribute('aria-selected', String(button.dataset.season === key)); });
    seasonPanel.classList.add('changing');
    window.setTimeout(function () {
      $('#season-name').textContent = item.name;
      $('#season-kicker').textContent = item.kicker;
      $('#season-copy').textContent = item.copy;
      $('#season-path').textContent = item.path;
      seasonPanel.setAttribute('data-letter', item.letter);
      seasonPanel.querySelector('.season-content').setAttribute('data-letter', item.letter);
      seasonPhoto.src = item.image;
      seasonPhoto.alt = item.alt;
      seasonPanel.classList.remove('changing');
    }, reduced ? 0 : 160);
    if (syncPathfinder) {
      var pathRadio = $('input[name="path-season"][value="' + key + '"]');
      if (pathRadio) pathRadio.checked = true;
      updatePathfinder();
    }
  }

  $$('.season-option').forEach(function (button) {
    button.addEventListener('click', function () { selectSeason(button.dataset.season, true); });
    button.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      var buttons = $$('.season-option');
      var index = buttons.indexOf(button);
      var next = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? index + 1 : index - 1;
      buttons[(next + buttons.length) % buttons.length].focus();
    });
  });

  var pathTitles = { spiritual: 'Faith and Life Resources', relational: 'Relationships and Family', personal: 'Faith and Life Resources', professional: 'Academic and Career' };
  var seasonPhrases = {
    building: 'In a building season, begin with the foundations and decisions that will support what comes next.',
    waiting: 'In a waiting season, guidance can create room for preparation, perspective and faithful action.',
    growing: 'In a growing season, practical resources can help new insight become a steady pattern.',
    healing: 'In a healing season, begin with care, wise boundaries and support that fits the need.',
    leading: 'In a leading season, consider the habits, relationships and responsibilities that shape your influence.'
  };
  var focusPhrases = {
    spiritual: ' This pathway centers biblical resources, spiritual growth and faith in everyday life.',
    relational: ' This pathway centers marriage, family, parenting and healthy relationships.',
    personal: ' This pathway centers reflection, purpose, character, resilience and practical growth.',
    professional: ' This pathway centers education, careers, leadership, stewardship and work.'
  };
  function updatePathfinder() {
    var seasonInput = $('input[name="path-season"]:checked');
    var focusInput = $('input[name="path-focus"]:checked');
    if (!seasonInput || !focusInput) return;
    $('#path-result-title').textContent = pathTitles[focusInput.value];
    $('#path-result-copy').textContent = seasonPhrases[seasonInput.value] + focusPhrases[focusInput.value];
  }
  $$('input[name="path-season"], input[name="path-focus"]').forEach(function (input) {
    input.addEventListener('change', function () {
      if (input.name === 'path-season') selectSeason(input.value, false);
      updatePathfinder();
    });
  });

  var bookStage = $('#book-stage');
  $$('.book-selector button').forEach(function (button) {
    button.addEventListener('click', function () {
      $$('.book-selector button').forEach(function (item) { item.setAttribute('aria-selected', 'false'); });
      button.setAttribute('aria-selected', 'true');
      if (bookStage) bookStage.setAttribute('data-active', button.dataset.book);
    });
  });

  var form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      $('#formStatus').textContent = 'Thank you. This is a mockup, so nothing was sent or stored.';
    });
  }

  window.addEventListener('load', function () {
    finishLoader();
    if (hasGsap) ScrollTrigger.refresh();
  }, { once: true });
}());
