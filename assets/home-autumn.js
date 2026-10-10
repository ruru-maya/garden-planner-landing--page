(() => {
  const tabs = [...document.querySelectorAll('[data-product-tab]')];
  const selectTab = (selected) => {
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
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
    }).catch(() => {
      grid.innerHTML = '<p class="article-card__excerpt">Find more seasonal ideas in our <a class="text-link" href="/tips">gardening guides</a>.</p>';
    });
  }
})();
