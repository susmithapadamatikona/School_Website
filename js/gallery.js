/* ==========================================================================
   Gallery — masonry filtering + lightbox (zoom, next/prev, fullscreen,
   keyboard & swipe). Any element with [data-lightbox="group"] and
   data-src / data-title opens the lightbox.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const { $, $$, esc, img } = EDU.utils;
    let lb, items = [], cur = 0;

    function build() {
        lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.setAttribute('role', 'dialog');
        lb.setAttribute('aria-modal', 'true');
        lb.setAttribute('aria-label', 'Image viewer');
        lb.innerHTML = `
            <div class="lb-top"><span class="lb-count"></span>
                <div class="lb-actions">
                    <button data-lb="zoom" aria-label="Zoom image"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
                    <button data-lb="full" aria-label="Toggle fullscreen"><i class="fa-solid fa-expand"></i></button>
                    <button data-lb="close" aria-label="Close viewer"><i class="fa-solid fa-xmark"></i></button>
                </div></div>
            <div class="lb-stage">
                <button class="lb-nav lb-prev" data-lb="prev" aria-label="Previous image"><i class="fa-solid fa-chevron-left"></i></button>
                <img alt="">
                <button class="lb-nav lb-next" data-lb="next" aria-label="Next image"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
            <div class="lb-caption"><strong></strong><small></small></div>`;
        document.body.appendChild(lb);
        const image = $('img', lb);
        lb.addEventListener('click', (e) => {
            const a = e.target.closest('[data-lb]');
            if (e.target === $('.lb-stage', lb)) return close();
            if (!a) return;
            ({ prev: () => show(cur - 1), next: () => show(cur + 1), close, zoom: () => image.classList.toggle('zoomed'), full: fullscreen })[a.dataset.lb]();
        });
        image.addEventListener('click', () => image.classList.toggle('zoomed'));
        document.addEventListener('keydown', (e) => {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') show(cur - 1);
            if (e.key === 'ArrowRight') show(cur + 1);
        });
        let sx = 0;
        lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', (e) => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); });
    }

    function fullscreen() {
        if (!document.fullscreenElement) lb.requestFullscreen && lb.requestFullscreen().catch(() => {});
        else document.exitFullscreen && document.exitFullscreen();
    }

    function show(i) {
        cur = (i + items.length) % items.length;
        const it = items[cur];
        const image = $('img', lb);
        image.classList.add('swap');
        image.classList.remove('zoomed');
        setTimeout(() => {
            image.src = it.src; image.alt = it.title;
            image.onload = () => image.classList.remove('swap');
            image.onerror = () => { image.src = EDU.utils.PLACEHOLDER; image.classList.remove('swap'); };
        }, 150);
        $('.lb-caption strong', lb).textContent = it.title;
        $('.lb-caption small', lb).textContent = it.cat || '';
        $('.lb-count', lb).textContent = `${cur + 1} / ${items.length}`;
    }

    function open(list, index) {
        if (!lb) build();
        items = list; lb.classList.add('open');
        document.body.classList.add('no-scroll');
        show(index);
        setTimeout(() => $('[data-lb="close"]', lb).focus(), 50);
    }
    function close() {
        lb.classList.remove('open');
        document.body.classList.remove('no-scroll');
        if (document.fullscreenElement) document.exitFullscreen();
    }

    /* Delegate: any [data-lightbox] trigger */
    function bindTriggers() {
        document.addEventListener('click', (e) => {
            const t = e.target.closest('[data-lightbox]');
            if (!t) return;
            e.preventDefault();
            const group = t.dataset.lightbox;
            const all = $$(`[data-lightbox="${group}"]`).filter((x) => x.offsetParent !== null || x === t);
            open(all.map((x) => ({ src: x.dataset.src, title: x.dataset.title || '', cat: x.dataset.cat || '' })), Math.max(0, all.indexOf(t)));
        });
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-lightbox]:not(a):not(button)')) { e.preventDefault(); e.target.click(); }
        });
    }

    /* Gallery page: <div data-gallery> with filter chips [data-gallery-filter] */
    function initGallery() {
        const grid = $('[data-gallery]');
        if (!grid) return;
        const data = EDU.content.gallery;
        const cats = ['All', ...new Set(data.map((g) => g.cat))];
        const chips = $('[data-gallery-filter]');
        let active = 'All';
        const render = () => {
            const list = active === 'All' ? data : data.filter((g) => g.cat === active);
            grid.innerHTML = list.map((g, i) => {
                const h = [520, 700, 600, 800, 560, 660][i % 6];
                return `<div class="masonry-item" role="button" tabindex="0" data-lightbox="gallery" data-src="${img(g.img)}" data-title="${esc(g.title)}" data-cat="${esc(g.cat)}" style="animation-delay:${i * 40}ms" aria-label="View ${esc(g.title)}">
                    <img src="${img(g.img)}" alt="${esc(g.title)}" loading="lazy" width="600" height="${h}">
                    <span class="zoom-ico"><i class="fa-solid fa-expand"></i></span>
                    <span class="cap"><strong>${esc(g.title)}</strong><small>${esc(g.cat)}</small></span></div>`;
            }).join('');
        };
        if (chips) {
            chips.innerHTML = cats.map((c) => `<button class="chip${c === active ? ' active' : ''}" aria-pressed="${c === active}" data-cat="${esc(c)}">${esc(c)} <span class="count">${c === 'All' ? data.length : data.filter((g) => g.cat === c).length}</span></button>`).join('');
            chips.addEventListener('click', (e) => {
                const b = e.target.closest('.chip'); if (!b) return;
                active = b.dataset.cat;
                $$('.chip', chips).forEach((c) => { c.classList.toggle('active', c === b); c.setAttribute('aria-pressed', String(c === b)); });
                render();
            });
        }
        render();
    }

    EDU.gallery = { open, init() { bindTriggers(); initGallery(); } };
})(window.EDU);
