document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------------------------------- */
  /* 1. MOBILE MENU & OVERLAY INTERACTION                                      */
  /* -------------------------------------------------------------------------- */
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-sign-in');

  function openMenu() {
    document.body.classList.add('menu-open');
    burgerBtn.setAttribute('aria-expanded', 'true');
    mobileOverlay.classList.remove('hidden');
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    burgerBtn.setAttribute('aria-expanded', 'false');
    mobileOverlay.classList.add('hidden');
  }

  if (burgerBtn && mobileOverlay) {
    burgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = document.body.classList.contains('menu-open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on backdrop click (click outside menu sheet)
    mobileOverlay.addEventListener('click', (e) => {
      if (e.target === mobileOverlay) {
        closeMenu();
      }
    });

    // Close on link click
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => closeMenu());
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        closeMenu();
      }
    });

    // Close on resize > 720px
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720 && document.body.classList.contains('menu-open')) {
        closeMenu();
      }
    });
  }

  /* -------------------------------------------------------------------------- */
  /* 2. STATS COUNT-UP JS MECHANIC (easeOutCubic, IntersectionObserver)         */
  /* -------------------------------------------------------------------------- */
  const statItems = document.querySelectorAll('.stat-item');

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateStat(item, index) {
    const targetVal = parseFloat(item.getAttribute('data-target') || '0');
    const decimals = parseInt(item.getAttribute('data-decimals') || '0', 10);
    const suffix = item.getAttribute('data-suffix') || '';
    const startOffset = parseInt(item.getAttribute('data-start-offset') || '0', 10);
    const duration = 1500 + index * 80;

    const valueEl = item.querySelector('.stat-value');
    if (!valueEl) return;

    setTimeout(() => {
      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easedProgress = easeOutCubic(progress);
        const currentVal = targetVal * easedProgress;

        valueEl.textContent = currentVal.toFixed(decimals) + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          valueEl.textContent = targetVal.toFixed(decimals) + suffix;
        }
      }

      requestAnimationFrame(step);
    }, startOffset);
  }

  // IntersectionObserver to trigger count-up once when stats section enters viewport
  if ('IntersectionObserver' in window && statItems.length > 0) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          statItems.forEach((item, i) => animateStat(item, i));
          obs.disconnect(); // Trigger once only
        }
      });
    }, { threshold: 0.25 });

    const statsFooter = document.querySelector('.stats-footer');
    if (statsFooter) {
      observer.observe(statsFooter);
    } else {
      statItems.forEach((item, i) => animateStat(item, i));
    }
  } else {
    // Fallback if IntersectionObserver is unsupported
    statItems.forEach((item, i) => animateStat(item, i));
  }

});
