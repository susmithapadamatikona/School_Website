/* ==========================================================================
   Sliders — generic carousel (testimonials, events, campus) + hero fader
   Markup:
   <div class="slider" data-slider data-per="3" data-per-md="2" data-per-sm="1" data-autoplay="6000">
     <div class="slider-viewport"><div class="slider-track"> ...slides... </div></div>
     <div class="slider-controls"><div class="slider-dots"></div><div class="slider-arrows">
       <button class="slider-arrow" data-prev>…</button><button class="slider-arrow" data-next>…</button></div></div>
   </div>
   ========================================================================== */
(function (EDU) {
    'use strict';
    const { $, $$ } = EDU.utils;

    function carousel(root) {
        if (root.dataset.bound) return;
        root.dataset.bound = '1';
        const track = $('.slider-track', root);
        const slides = () => Array.from(track.children);
        const dotsWrap = $('.slider-dots', root);
        const prev = $('[data-prev]', root), next = $('[data-next]', root);
        let index = 0, timer = null, startX = 0, dx = 0, dragging = false;

        const perView = () => {
            const w = window.innerWidth;
            if (w < 768) return +(root.dataset.perSm || 1);
            if (w < 1180) return +(root.dataset.perMd || Math.min(2, +root.dataset.per || 1));
            return +(root.dataset.per || 3);
        };
        const maxIndex = () => Math.max(0, slides().length - perView());

        const update = () => {
            const per = perView();
            root.style.setProperty('--per', per);
            index = Math.min(index, maxIndex());
            const slide = slides()[0];
            if (!slide) return;
            const gap = parseFloat(getComputedStyle(slide).marginRight) || 0;
            track.style.transform = `translateX(${-index * (slide.offsetWidth + gap)}px)`;
            if (dotsWrap) {
                const pages = maxIndex() + 1;
                if (dotsWrap.children.length !== pages) {
                    dotsWrap.innerHTML = Array.from({ length: pages }, (_, i) => `<button aria-label="Go to slide ${i + 1}"></button>`).join('');
                    $$('button', dotsWrap).forEach((b, i) => b.addEventListener('click', () => { go(i); restart(); }));
                }
                $$('button', dotsWrap).forEach((b, i) => { b.classList.toggle('active', i === index); b.setAttribute('aria-current', i === index ? 'true' : 'false'); });
            }
            if (prev) prev.disabled = !root.dataset.loop && index === 0;
            if (next) next.disabled = !root.dataset.loop && index >= maxIndex();
            slides().forEach((s, i) => s.setAttribute('aria-hidden', String(i < index || i >= index + per)));
        };
        const go = (i) => {
            const m = maxIndex();
            index = i < 0 ? (root.dataset.loop ? m : 0) : i > m ? (root.dataset.loop ? 0 : m) : i;
            update();
        };
        const auto = +root.dataset.autoplay || 0;
        const restart = () => { clearInterval(timer); if (auto) timer = setInterval(() => go(index >= maxIndex() ? 0 : index + 1), auto); };

        prev && prev.addEventListener('click', () => { go(index - 1); restart(); });
        next && next.addEventListener('click', () => { go(index + 1); restart(); });
        root.addEventListener('mouseenter', () => clearInterval(timer));
        root.addEventListener('mouseleave', restart);
        root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(index - 1); if (e.key === 'ArrowRight') go(index + 1); });

        // Touch / pointer swipe
        const vp = $('.slider-viewport', root);
        vp.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; dragging = true; startX = e.clientX; dx = 0; });
        vp.addEventListener('pointermove', (e) => { if (dragging) dx = e.clientX - startX; });
        const end = () => { if (!dragging) return; dragging = false; if (Math.abs(dx) > 50) { go(index + (dx < 0 ? 1 : -1)); restart(); } };
        vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end);

        window.addEventListener('resize', EDU.utils.debounce(update, 120));
        root.refresh = () => { index = 0; dotsWrap && (dotsWrap.innerHTML = ''); update(); };
        update(); restart();
        return root;
    }

    /* Cross-fading hero slides */
    function fader(root) {
        const slides = $$('.hero-slide', root);
        const dots = $('.hero-slide-dots', root);
        if (slides.length < 2) return;
        let i = 0;
        if (dots) {
            dots.innerHTML = slides.map((_, k) => `<button aria-label="Show image ${k + 1}"></button>`).join('');
            $$('button', dots).forEach((b, k) => b.addEventListener('click', () => { show(k); restart(); }));
        }
        const show = (k) => {
            i = k;
            slides.forEach((s, n) => s.classList.toggle('active', n === k));
            dots && $$('button', dots).forEach((b, n) => b.classList.toggle('active', n === k));
        };
        let t;
        const restart = () => { clearInterval(t); t = setInterval(() => show((i + 1) % slides.length), 5500); };
        const prev = $('[data-fader-prev]', root), next = $('[data-fader-next]', root);
        prev && prev.addEventListener('click', () => { show((i - 1 + slides.length) % slides.length); restart(); });
        next && next.addEventListener('click', () => { show((i + 1) % slides.length); restart(); });
        show(0); restart();
    }

    EDU.slider = {
        carousel, fader,
        init(root = document) {
            $$('[data-slider]', root).forEach(carousel);
            $$('[data-fader]', root).forEach(fader);
        }
    };
})(window.EDU);
