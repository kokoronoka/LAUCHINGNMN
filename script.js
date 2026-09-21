(() => {
  'use strict';

  // -------- countdown to launch: 1 Oct 2026, 20:00 Malaysia time (UTC+8) --------
  const LAUNCH_DATE = new Date('2026-10-01T20:00:00+08:00').getTime();

  const targets = [
    { d: 'cdDays', h: 'cdHours', m: 'cdMinutes', s: 'cdSeconds' },
    { d: 'cdDaysFinal', h: 'cdHoursFinal', m: 'cdMinutesFinal', s: 'cdSecondsFinal' },
    { d: 'cdDaysClose', h: 'cdHoursClose', m: 'cdMinutesClose', s: 'cdSecondsClose' }
  ];

  function pad(n) { return String(n).padStart(2, '0'); }

  function tickCountdown() {
    const now = Date.now();
    const diff = Math.max(0, LAUNCH_DATE - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    targets.forEach(t => {
      const dEl = document.getElementById(t.d);
      const hEl = document.getElementById(t.h);
      const mEl = document.getElementById(t.m);
      const sEl = document.getElementById(t.s);
      if (dEl) dEl.textContent = pad(days);
      if (hEl) hEl.textContent = pad(hours);
      if (mEl) mEl.textContent = pad(minutes);
      if (sEl) sEl.textContent = pad(seconds);
    });
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  // -------- reveal-on-scroll --------
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  // -------- animated stat counters --------
  const statNumbers = document.querySelectorAll('.stat-number[data-count]');
  const animated = new WeakSet();

  function animateStat(el) {
    if (animated.has(el)) return;
    animated.add(el);
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (statNumbers.length && 'IntersectionObserver' in window) {
    const statIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          statIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statNumbers.forEach(el => statIO.observe(el));
  }

  // -------- sticky mobile bar: hide once final CTA is in view --------
  const stickyBar = document.getElementById('stickyBar');
  const ctaSection = document.getElementById('cta');
  if (stickyBar && ctaSection && 'IntersectionObserver' in window) {
    const stickyIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        stickyBar.style.transform = entry.isIntersecting ? 'translateY(100%)' : 'translateY(0)';
      });
    }, { threshold: 0.2 });
    stickyIO.observe(ctaSection);
  }

})();
