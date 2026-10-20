/* =========================================================
   Fenara — interactions & motion
   GSAP 3.13 (ScrollTrigger, SplitText) + Lenis smooth scroll.
   Every interactive feature works without GSAP; motion is layered on top.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  // ?motion=1 forces animations even when the OS asks for reduced motion (demo / review)
  const forceMotion = /[?&]motion=1\b/.test(location.search);
  const reduce = !forceMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = !!(window.gsap && window.ScrollTrigger);
  const motion = G && !reduce;

  window.__fenaraReady = true;
  if (!motion) root.classList.add('no-anim');
  if (G) gsap.registerPlugin(ScrollTrigger, ...(window.SplitText ? [SplitText] : []));

  /* ---------- button label roll (pure CSS hover, JS builds the markup) ---------- */
  $$('.btn__label').forEach((el) => {
    const t = el.dataset.label || el.textContent.trim();
    el.innerHTML = `<span>${t}</span><span aria-hidden="true">${t}</span>`;
  });

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToTarget = (target) => {
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#' || a.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
      const target = id === '#top' ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) closeMenu(false);
      scrollToTarget(id === '#top' ? 0 : target);
    });
  });

  /* ---------- mobile menu ---------- */
  const menu = $('#menu');
  const openBtn = $('[data-menu-open]');
  let menuOpen = false;
  const openMenu = () => {
    menuOpen = true;
    menu.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    lenis && lenis.stop();
    document.body.style.overflow = 'hidden';
    if (motion) {
      gsap.timeline()
        .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' })
        .fromTo($$('.menu__list a', menu), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.35)
        .fromTo($$('.menu__top, .menu__foot', menu), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.45);
    }
    $('[data-menu-close]', menu).focus();
  };
  const closeMenu = (animate = true) => {
    menuOpen = false;
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    lenis && lenis.start();
    const done = () => { menu.hidden = true; openBtn.focus({ preventScroll: true }); };
    if (motion && animate) gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut', onComplete: done });
    else done();
  };
  openBtn.addEventListener('click', openMenu);
  $('[data-menu-close]', menu).addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) closeMenu(); });

  /* ---------- services: tabs + thumbnails ---------- */
  const services = $('[data-services]');
  const tabs = $$('[data-tab]', services);
  const thumbs = $$('[data-thumb]', services);
  const panels = $$('.panel', services);
  const imgs = $$('[data-panel-img]', services);
  let serviceIndex = 0;
  const setService = (i, focus = false) => {
    if (i === serviceIndex) return;
    const prevImg = imgs[serviceIndex];
    const nextImg = imgs[i];
    tabs.forEach((t, k) => { const on = k === i; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    thumbs.forEach((t, k) => t.classList.toggle('is-active', k === i));
    panels.forEach((p, k) => { p.hidden = k !== i; p.classList.toggle('is-active', k === i); });
    if (focus) tabs[i].focus();
    if (motion) {
      gsap.killTweensOf([prevImg, nextImg]);
      nextImg.classList.add('is-active');
      gsap.set(nextImg, { zIndex: 2, autoAlpha: 1 });
      gsap.set(prevImg, { zIndex: 1 });
      gsap.fromTo(nextImg, { clipPath: 'inset(0 0 0 100%)', scale: 1.15 }, { clipPath: 'inset(0 0 0 0%)', scale: 1, duration: 1.1, ease: 'expo.inOut', onComplete: () => { prevImg.classList.remove('is-active'); gsap.set(prevImg, { autoAlpha: 0, zIndex: 0 }); } });
      gsap.fromTo(panels[i].children, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: 'expo.out', delay: 0.15 });
    } else {
      prevImg.classList.remove('is-active');
      nextImg.classList.add('is-active');
    }
    serviceIndex = i;
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => setService(i));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); setService((serviceIndex + 1) % tabs.length, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setService((serviceIndex - 1 + tabs.length) % tabs.length, true); }
    });
  });
  thumbs.forEach((t, i) => t.addEventListener('click', () => setService(i)));

  /* ---------- compare slider ---------- */
  const compare = $('[data-compare]');
  const handle = $('[data-compare-handle]', compare);
  let pos = 50;
  const setPos = (p) => {
    pos = Math.max(0, Math.min(100, p));
    compare.style.setProperty('--pos', pos + '%');
    handle.setAttribute('aria-valuenow', Math.round(pos));
  };
  const fromEvent = (e) => { const r = compare.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
  let dragging = false;
  compare.addEventListener('pointerdown', (e) => {
    dragging = true; compare.classList.add('is-dragging');
    compare.setPointerCapture(e.pointerId);
    if (G) gsap.killTweensOf(proxy);
    setPos(fromEvent(e));
  });
  compare.addEventListener('pointermove', (e) => { if (dragging) setPos(fromEvent(e)); });
  const stopDrag = () => { dragging = false; compare.classList.remove('is-dragging'); };
  compare.addEventListener('pointerup', stopDrag);
  compare.addEventListener('pointercancel', stopDrag);
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setPos(pos - 5); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setPos(pos + 5); }
    if (e.key === 'Home') { e.preventDefault(); setPos(0); }
    if (e.key === 'End') { e.preventDefault(); setPos(100); }
  });
  const proxy = { p: 50 };
  const sweep = () => {
    if (!motion) return;
    gsap.timeline()
      .to(proxy, { p: 18, duration: 1.1, ease: 'power3.inOut', onUpdate: () => setPos(proxy.p) })
      .to(proxy, { p: 72, duration: 1.3, ease: 'power3.inOut', onUpdate: () => setPos(proxy.p) })
      .to(proxy, { p: 50, duration: 1, ease: 'power3.inOut', onUpdate: () => setPos(proxy.p) });
  };

  /* ---------- work pager (3 projects) ---------- */
  const projects = [
    { title: 'Siedziba studia<br>Lasowa Atelier', meta: ['Budynek komercyjny', 'Stare Babice k. Warszawy'], before: 'pavilion-bw', after: 'pavilion', alt: 'Biurowiec z fasadą z aluminium i szkła',
      goal: 'Reprezentacyjna, nowoczesna elewacja, która od pierwszego spojrzenia buduje wizerunek marki.',
      solution: 'Fasada słupowo-ryglowa z aluminium i szkła, zaprojektowana pod nietypową, wysuniętą bryłę dachu.' },
    { title: 'Dom Zmierzch', meta: ['Dom jednorodzinny', 'Mazury'], before: 'hero-dusk-bw', after: 'hero-dusk', alt: 'Dom o czarnej elewacji z przeszkleniami oświetlonymi o zmierzchu',
      goal: 'Jak najwięcej widoku na jezioro — bez utraty ciepła w zimowe wieczory.',
      solution: 'Przesuwne systemy HS o wysokości 3 m, trzyszybowe pakiety i ciepłe ramki dystansowe.' },
    { title: 'Ogród zimowy<br>Pod Lipami', meta: ['Rozbudowa domu', 'Konstancin-Jeziorna'], before: 'conservatory-bw', after: 'conservatory', alt: 'Ogród zimowy z czarnymi ramami i jesiennym ogrodem za szybą',
      goal: 'Całoroczna przestrzeń dzienna, która otwiera dom na ogród.',
      solution: 'Konstrukcja słupowo-ryglowa z przeszklonym dachem, wentylacją grawitacyjną i żaluzjami plisowanymi.' },
  ];
  let workIndex = 0;
  const w = {
    before: $('[data-work-before]'), after: $('[data-work-after]'), title: $('[data-work-title]'), meta: $('[data-work-meta]'),
    goal: $('[data-work-goal]'), solution: $('[data-work-solution]'), index: $('[data-work-index]'), info: $('[data-work-info]'),
  };
  const renderProject = (i) => {
    const p = projects[i];
    w.before.src = `assets/img/${p.before}.webp`;
    w.after.src = `assets/img/${p.after}.webp`;
    w.after.alt = p.alt;
    w.title.innerHTML = p.title;
    w.meta.innerHTML = `<span>${p.meta[0]}</span><i></i><span>${p.meta[1]}</span>`;
    w.goal.textContent = p.goal;
    w.solution.textContent = p.solution;
    w.index.textContent = String(i + 1).padStart(2, '0');
  };
  const goProject = (dir) => {
    workIndex = (workIndex + dir + projects.length) % projects.length;
    if (!motion) { renderProject(workIndex); setPos(50); return; }
    const imgsW = [w.before, w.after];
    gsap.timeline()
      .to(imgsW, { autoAlpha: 0, scale: 1.04, duration: 0.45, ease: 'power2.in' }, 0)
      .to(w.info.children, { y: -12, autoAlpha: 0, duration: 0.35, stagger: 0.04, ease: 'power2.in' }, 0)
      .add(() => { renderProject(workIndex); setPos(50); proxy.p = 50; })
      .fromTo(imgsW, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 1, ease: 'expo.out' })
      .fromTo(w.info.children, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: 'expo.out' }, '<0.1')
      .add(sweep, '<0.2');
  };
  $('[data-work-prev]').addEventListener('click', () => goProject(-1));
  $('[data-work-next]').addEventListener('click', () => goProject(1));
  projects.forEach((p) => { const im = new Image(); im.src = `assets/img/${p.after}.webp`; });

  /* ---------- form validation (demo, static hosting) ---------- */
  const form = $('[data-form]');
  const success = $('[data-success]');
  const rules = {
    name: (v) => v.trim().length >= 2 || 'Podaj imię i nazwisko',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Podaj pełny adres e-mail, np. jan@firma.pl',
    phone: (v) => !v.trim() || v.replace(/\D/g, '').length >= 9 || 'Numer telefonu jest za krótki',
  };
  let submitted = false;
  const validateField = (input) => {
    const rule = rules[input.name];
    if (!rule) return true;
    const res = rule(input.value);
    const field = input.closest('.field');
    const err = $('.field__error', field);
    const ok = res === true;
    field.classList.toggle('is-invalid', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    err.textContent = ok ? '' : res;
    return ok;
  };
  $$('input', form).forEach((inp) => inp.addEventListener('input', () => submitted && validateField(inp)));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitted = true;
    const inputs = $$('input[name="name"], input[name="email"], input[name="phone"]', form);
    const results = inputs.map(validateField);
    const consent = $('input[name="consent"]', form);
    const check = consent.closest('.check');
    check.classList.toggle('is-invalid', !consent.checked);
    const valid = results.every(Boolean) && consent.checked;
    if (!valid) {
      const firstBad = inputs.find((i, k) => !results[k]) || consent;
      firstBad.focus({ preventScroll: true });
      if (motion) gsap.fromTo($$('.is-invalid', form), { x: -6 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)' });
      return;
    }
    const show = () => { form.hidden = true; success.hidden = false; $('h3', success).setAttribute('tabindex', '-1'); $('h3', success).focus({ preventScroll: true }); };
    if (motion) {
      gsap.timeline()
        .to(form, { autoAlpha: 0, y: -12, duration: 0.4, ease: 'power2.in' })
        .add(show)
        .fromTo(success.children, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.07, ease: 'expo.out' })
        .fromTo($('.form-success__icon', success), { scale: 0.4 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.5)' }, '<');
    } else show();
  });
  $('[data-form-reset]').addEventListener('click', () => {
    form.reset(); submitted = false;
    $$('.is-invalid', form).forEach((n) => n.classList.remove('is-invalid'));
    $$('.field__error', form).forEach((n) => (n.textContent = ''));
    success.hidden = true; form.hidden = false;
    if (motion) gsap.fromTo(form, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' });
    else form.style.opacity = '';
  });

  /* ---------- counters (static fallback already shows final values) ---------- */
  const fmt = (n, el) => (el.dataset.format === 'space' ? Math.round(n).toLocaleString('pl-PL').replace(/ |,/g, ' ') : Math.round(n));

  /* ---------- marquee clones (needed for static too) ---------- */
  const rows = $$('[data-marquee-row]');
  rows.forEach((row) => {
    [...row.children].forEach((n) => {
      const c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      $$('a, button', c).forEach((x) => (x.tabIndex = -1));
      row.appendChild(c);
    });
  });

  if (!motion) {
    $$('[data-benefit]').forEach((b) => b.classList.add('is-active'));
    // still update the header on scroll without GSAP
    const header = $('[data-header]');
    const onScroll = () => header.classList.toggle('is-solid', window.scrollY > window.innerHeight * 0.8);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    return;
  }

  /* =========================================================
     MOTION
     ========================================================= */
  const header = $('[data-header]');
  const hero = $('.hero');

  /* --- intro --- */
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
  intro
    .fromTo('[data-hero-card]', { clipPath: 'inset(7% 5% 7% 5% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.7, ease: 'expo.inOut' }, 0)
    .fromTo('.hero__img', { scale: 1.3 }, { scale: 1, duration: 2.4 }, 0)
    .fromTo('.hero__title .line > span', { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.3, stagger: 0.09 }, 0.75)
    .fromTo('[data-hero-item]', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }, 1.0)
    .fromTo(header, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 1.1 }, 1.0);

  /* --- hero on scroll --- */
  gsap.to('.hero__img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('[data-hero-content]', { y: -90, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '55% top', scrub: true } });
  gsap.to('[data-hero-card]', { scale: 0.94, borderRadius: 40, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

  /* --- header: solid after hero, hide on scroll down, progress bar --- */
  const bar = $('.progress__bar');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle('is-solid', y > hero.offsetHeight - 90);
      header.classList.toggle('is-hidden', !menuOpen && self.direction === 1 && y > window.innerHeight * 0.9);
      bar.style.transform = `scaleX(${self.progress})`;
    },
  });
  // current section in nav
  $$('.nav__link').forEach((link) => {
    const sec = $(link.getAttribute('href'));
    if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', toggleClass: { targets: link, className: 'is-current' } });
  });

  /* --- generic reveals --- */
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%', once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', overwrite: true }),
  });
  $$('[data-reveal-img]').forEach((el) => {
    const inner = $$('img', el).filter((i) => !i.closest('.thumbs'));
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(10% 6% 10% 6% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' })
      .fromTo(inner, { scale: 1.2 }, { scale: 1, duration: 1.9, ease: 'expo.out' }, 0.1);
    if (el.matches('.work__card')) tl.add(sweep, 0.9);
  });
  gsap.set('.contact__card', { clipPath: 'inset(0 0 0 0 round 28px)' });
  gsap.fromTo('.contact__card', { clipPath: 'inset(8% 4% 0% 4% round 40px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top 95%', end: 'top 35%', scrub: true },
  });

  /* --- parallax --- */
  $$('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* --- counters --- */
  $$('[data-count]').forEach((el) => {
    const target = +el.dataset.count;
    const o = { v: 0 };
    el.textContent = fmt(0, el);
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: target, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v, el)) }),
    });
  });

  /* --- split-text headings & manifest (after fonts load) --- */
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => {
    if (window.SplitText) {
      $$('[data-split]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 105, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
        });
      });
      const manifest = $('[data-words]');
      SplitText.create(manifest, {
        type: 'words', autoSplit: true,
        onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.12 }, { opacity: 1, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: manifest, start: 'top 80%', end: 'bottom 50%', scrub: true } }),
      });
      const word = $('[data-footer-word]');
      const split = SplitText.create(word, { type: 'chars', charsClass: 'char' });
      gsap.from(split.chars, { yPercent: 105, duration: 1.4, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: word, start: 'top 95%', once: true } });
    }
    ScrollTrigger.refresh();
  });

  /* --- process: pinned horizontal scroll on desktop --- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const section = $('[data-process]');
    const track = $('[data-process-track]');
    const barEl = $('[data-process-bar]');
    const idx = $('[data-process-index]');
    const steps = $$('.step', track);
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: section, start: 'top top', end: () => '+=' + (distance() + window.innerHeight * 0.25),
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => {
          barEl.style.transform = `scaleX(${0.25 + self.progress * 0.75})`;
          idx.textContent = '0' + Math.min(steps.length, Math.floor(self.progress * steps.length) + 1);
        },
      },
    });
    steps.forEach((step) => {
      gsap.fromTo($('img', step), { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      gsap.from(step, { y: 60, autoAlpha: 0, rotate: 2, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 95%', once: true } });
    });
    return () => gsap.set(track, { clearProps: 'x' });
  });
  mm.add('(max-width: 900px)', () => {
    gsap.utils.toArray('.step').forEach((step) => gsap.from(step, { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: step, start: 'top 90%', once: true } }));
  });

  /* --- benefits: page turns dark, items light up --- */
  const benefits = $('[data-dark]');
  ScrollTrigger.create({
    trigger: benefits, start: 'top 55%', end: 'bottom 45%',
    onToggle: (self) => document.body.classList.toggle('theme-dark', self.isActive),
  });
  mm.add('(min-width: 901px)', () => {
    $$('[data-benefit]').forEach((b) => ScrollTrigger.create({ trigger: b, start: 'top 62%', end: 'bottom 38%', toggleClass: 'is-active' }));
  });

  /* --- marquee: endless rows, pause on hover, speed up with scroll velocity --- */
  let boost = 0;
  ScrollTrigger.create({ trigger: '[data-marquee]', start: 'top bottom', end: 'bottom top', onUpdate: (self) => { boost = Math.min(Math.abs(self.getVelocity()) / 600, 6); } });
  rows.forEach((row) => {
    const dir = +row.dataset.direction || -1;
    let half = row.scrollWidth / 2;
    let x = dir < 0 ? 0 : -half;
    let speed = 1, target = 1;
    window.addEventListener('resize', () => { half = row.scrollWidth / 2; });
    row.addEventListener('mouseenter', () => (target = 0));
    row.addEventListener('mouseleave', () => (target = 1));
    const setX = gsap.quickSetter(row, 'x', 'px');
    gsap.ticker.add((time, dt) => {
      speed += (target - speed) * 0.06;
      const v = 0.55 * (dt / 16.67) * (speed + boost * speed);
      x += v * dir;
      if (x <= -half) x += half;
      if (x >= 0) x -= half;
      setX(x);
    });
  });
  gsap.ticker.add(() => { boost *= 0.92; });

  /* --- magnetic buttons --- */
  if (finePointer) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      const host = el.closest('.cta') || el;
      host.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      host.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });

    /* --- contextual cursor label --- */
    const cursor = $('.cursor');
    const label = $('.cursor__label', cursor);
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-active'); });
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
