/* ==========================================================================
   Animations — scroll reveal, animated counters, progress bars, parallax
   Works automatically for elements added later (MutationObserver).
   ========================================================================== */
(function (EDU) {
    'use strict';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function animateCount(el) {
        if (el.dataset.counted) return;
        el.dataset.counted = '1';
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || (String(el.dataset.count).split('.')[1] || '').length, 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = +el.dataset.duration || 1800;
        const fmt = (v) => prefix + (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-IN')) + suffix;
        if (reduce) { el.textContent = fmt(target); return; }
        const start = performance.now();
        const step = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = fmt(target * eased);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            if (el.hasAttribute('data-reveal')) {
                const delay = +el.dataset.delay || 0;
                setTimeout(() => el.classList.add('revealed'), delay);
            }
            if (el.hasAttribute('data-count')) animateCount(el);
            if (el.dataset.width != null) el.style.width = el.dataset.width + '%';
            io.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;

    function observe(root = document) {
        const els = root.querySelectorAll ? root.querySelectorAll('[data-reveal]:not(.revealed), [data-count]:not([data-counted]):not(.count):not(.side-count), [data-width]') : [];
        els.forEach((el) => {
            if (!io) { el.classList.add('revealed'); if (el.dataset.count) animateCount(el); if (el.dataset.width) el.style.width = el.dataset.width + '%'; return; }
            io.observe(el);
        });
    }

    /* Auto-observe dynamically injected content */
    function watch() {
        if (!('MutationObserver' in window)) return;
        let queued = false;
        new MutationObserver(() => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => { queued = false; observe(document); });
        }).observe(document.body, { childList: true, subtree: true });
    }

    /* Parallax: [data-parallax="0.15"] moves on scroll, [data-depth] follows the mouse inside .hero */
    function parallax() {
        if (reduce) return;
        const scrollEls = Array.from(document.querySelectorAll('[data-parallax]'));
        if (scrollEls.length) {
            let ticking = false;
            window.addEventListener('scroll', () => {
                if (ticking) return; ticking = true;
                requestAnimationFrame(() => {
                    const y = window.scrollY;
                    scrollEls.forEach((el) => { el.style.transform = `translate3d(0, ${y * parseFloat(el.dataset.parallax)}px, 0)`; });
                    ticking = false;
                });
            }, { passive: true });
        }
        const hero = document.querySelector('.hero');
        const depthEls = hero ? Array.from(hero.querySelectorAll('[data-depth]')) : [];
        if (hero && depthEls.length && window.matchMedia('(pointer: fine)').matches) {
            hero.addEventListener('mousemove', (e) => {
                const r = hero.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                depthEls.forEach((el) => { const d = parseFloat(el.dataset.depth); el.style.translate = `${x * d * 40}px ${y * d * 40}px`; });
            });
            hero.addEventListener('mouseleave', () => depthEls.forEach((el) => { el.style.translate = '0 0'; }));
        }
    }

    EDU.anim = {
        observe, animateCount, parallax,
        init() { observe(document); watch(); parallax(); }
    };
})(window.EDU);
