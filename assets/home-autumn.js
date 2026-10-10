(() => {
  const christmasTeaser = document.getElementById('christmas-gift');
  if (christmasTeaser && Date.now() >= Date.parse(christmasTeaser.dataset.offerEnds)) {
    christmasTeaser.hidden = true;
  }
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealSelector = '.christmas-teaser__card, .section-heading, .benefit, .product-tabs, .product-panel__image, .product-panel__copy, .plant-guide, .step, .magazine__card, .articles__header, .article-card, .faq > div, .final-cta__inner';
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      revealObserver.unobserve(target);
      target.dataset.revealState = 'done';
      if (!motionPreference.matches) target.classList.add('is-revealing');
    });
  }, { rootMargin: '0px 0px 40px 0px', threshold: 0.05 }) : null;

  const prepareReveals = (root = document) => {
    if (!revealObserver || motionPreference.matches) return;
    root.querySelectorAll(revealSelector).forEach((element) => {
      if (element.dataset.revealState) return;
      const bounds = element.getBoundingClientRect();
      if (bounds.height && bounds.top < window.innerHeight && bounds.bottom > 0) {
        element.dataset.revealState = 'done';
        return;
      }
      if (element.matches('.benefit, .step, .article-card')) {
        const index = [...element.parentElement.children].indexOf(element);
        element.style.setProperty('--reveal-delay', `${Math.min(index, 2) * 90}ms`);
      }
      element.dataset.revealState = 'ready';
      revealObserver.observe(element);
    });
  };

  document.addEventListener('animationend', (event) => {
    if (event.animationName === 'cozy-reveal') event.target.classList.remove('is-revealing', 'intro-enter');
    if (event.animationName === 'cozy-panel-enter') event.target.classList.remove('panel-entering');
  });
  document.addEventListener('focusin', (event) => {
    if (!event.target.matches(':focus-visible')) return;
    event.target.closest('.is-revealing, .intro-enter, .panel-entering')?.classList.remove('is-revealing', 'intro-enter', 'panel-entering');
  });
  motionPreference.addEventListener?.('change', () => {
    if (motionPreference.matches) {
      document.querySelectorAll('.is-revealing, .intro-enter, .panel-entering').forEach((element) => {
        element.classList.remove('is-revealing', 'intro-enter', 'panel-entering');
      });
    } else {
      prepareReveals();
    }
  });
  if (!motionPreference.matches) {
    document.querySelectorAll('.hero__copy, .hero__visual').forEach((element) => element.classList.add('intro-enter'));
  }
  prepareReveals();

  const tabs = [...document.querySelectorAll('[data-product-tab]')];
  const selectTab = (selected) => {
    const changed = selected.getAttribute('aria-selected') !== 'true';
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      panel.hidden = !active;
      panel.classList.toggle('panel-entering', active && changed && !motionPreference.matches);
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });
  document.querySelectorAll('[data-magazine-open]').forEach((button) => {
    button.addEventListener('click', () => window.CozyGrowAutumnMagazine?.open());
  });
  const grid = document.getElementById('homeArticlesGrid');
  if (window.CozyGrowBlog && grid) {
    window.CozyGrowBlog.renderGrid('#homeArticlesGrid', {
      limit: 2, headingLevel: 3, showReadTime: false, excerptLength: 110
    }).then(() => prepareReveals(grid)).catch(() => {
      grid.innerHTML = '<p class="article-card__excerpt">Find more seasonal ideas in our <a class="text-link" href="/tips">gardening guides</a>.</p>';
    });
  }
})();
