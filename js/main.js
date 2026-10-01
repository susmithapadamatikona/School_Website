/* ==========================================================================
   EDUCARE — Application bootstrap (runs on every page, loaded last)
   ========================================================================== */
(function (EDU) {
    'use strict';
    const { $, $$ } = EDU.utils;

    /* ---------- Theme ---------- */
    const theme = {
        get: () => document.documentElement.getAttribute('data-theme') || 'light',
        set(t) {
            document.documentElement.setAttribute('data-theme', t);
            EDU.store.set('theme', t);
            $$('[data-theme-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(t === 'dark')));
            EDU.bus.emit('theme', t);
        },
        toggle() { theme.set(theme.get() === 'dark' ? 'light' : 'dark'); }
    };
    EDU.theme = theme;

    function bindTheme() {
        document.addEventListener('click', (e) => { if (e.target.closest('[data-theme-toggle]')) theme.toggle(); });
        EDU.bus.on('db:theme', (t) => { if (t && t !== theme.get()) document.documentElement.setAttribute('data-theme', t); });
    }

    /* ---------- Loader ---------- */
    // One preloader per page visit: it is in the HTML from the first paint and fades out once the page has
    // loaded, staying at least LOADER_MIN_MS so it is visible on fast loads.
    const LOADER_MIN_MS = 700;
    function hideLoader() {
        const l = $('#page-loader');
        if (!l) return;
        let hidden = false;
        const done = () => { if (hidden) return; hidden = true; setTimeout(() => l.classList.add('hidden'), Math.max(0, LOADER_MIN_MS - performance.now())); };
        if (document.readyState === 'complete') done();
        else { window.addEventListener('load', done); setTimeout(done, 2500); }
    }

    /* ---------- Scroll UI: progress bar, back-to-top, floating apply ---------- */
    function scrollUI() {
        const isPortal = document.body.classList.contains('portal-body');
        const bar = document.createElement('div');
        bar.className = 'scroll-progress';
        bar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(bar);

        const top = document.createElement('button');
        top.className = 'back-to-top';
        top.setAttribute('aria-label', 'Back to top');
        top.innerHTML = '<svg viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="23"/></svg><i class="fa-solid fa-arrow-up"></i>';
        top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        document.body.appendChild(top);
        const circle = top.querySelector('circle');

        let fab = null;
        if (!isPortal && !document.body.dataset.noFab) {
            fab = document.createElement('a');
            fab.className = 'floating-apply';
            fab.href = 'apply.html';
            fab.innerHTML = '<span class="icon"><i class="fa-solid fa-graduation-cap"></i></span><span class="label">Apply for 2026–27</span>';
            fab.setAttribute('aria-label', 'Apply for admission 2026–27');
            document.body.appendChild(fab);
        }

        const onScroll = () => {
            const h = document.documentElement.scrollHeight - window.innerHeight;
            const p = h > 0 ? window.scrollY / h : 0;
            bar.style.transform = `scaleX(${p})`;
            top.classList.toggle('show', window.scrollY > 500);
            circle.style.strokeDashoffset = 145 - 145 * p;
            if (fab) fab.classList.toggle('show', window.scrollY > 700);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- Images: fallback + lazy defaults ---------- */
    function images() {
        document.addEventListener('error', (e) => {
            const t = e.target;
            if (t.tagName === 'IMG' && !t.dataset.fallback) { t.dataset.fallback = '1'; t.src = EDU.utils.PLACEHOLDER; }
        }, true);
        $$('img:not([loading])').forEach((img) => { if (!img.closest('.hero')) img.loading = 'lazy'; });
    }

    /* ---------- Boot ---------- */
    document.addEventListener('DOMContentLoaded', () => {
        const isPortal = document.body.classList.contains('portal-body');
        bindTheme();
        images();
        if (!isPortal) {
            EDU.navbar && EDU.navbar.render();
            EDU.search && EDU.search.init();
            EDU.components && EDU.components.init();
            EDU.filter && EDU.filter.init();
            EDU.gallery && EDU.gallery.init();
            EDU.slider && EDU.slider.init();
        } else {
            EDU.gallery && EDU.gallery.init();
            EDU.portal && EDU.portal.init();
        }
        EDU.bus.emit('ready');
        EDU.anim && EDU.anim.init();
        EDU.realtime.connect();
        scrollUI();
        hideLoader();
        $$('[data-theme-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(theme.get() === 'dark')));
    });
})(window.EDU);
