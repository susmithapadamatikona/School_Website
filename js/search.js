/* ==========================================================================
   Site search overlay (Ctrl/⌘ + K). Indexes pages, faculty, events, posts,
   programs and FAQs. Keyboard navigable.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const { $, $$, esc } = EDU.utils;
    let overlay, input, results, index = [], focusIdx = -1;

    const PAGES = [
        ['Home', 'index.html', 'fa-house'], ['About School', 'about.html', 'fa-school'], ['Principal\'s Message', 'principal.html', 'fa-user-tie'],
        ['Vision & Mission', 'vision-mission.html', 'fa-bullseye'], ['Academics', 'academics.html', 'fa-book-open-reader'], ['Departments', 'departments.html', 'fa-sitemap'],
        ['Faculty Directory', 'faculty.html', 'fa-chalkboard-user'], ['Admissions', 'admissions.html', 'fa-door-open'], ['Admission Process', 'admission-process.html', 'fa-list-check'],
        ['Apply Online', 'apply.html', 'fa-pen-to-square'], ['Fee Structure', 'fees.html', 'fa-indian-rupee-sign'], ['Campus Tour', 'campus.html', 'fa-building-columns'],
        ['Facilities', 'facilities.html', 'fa-flask'], ['Student Life', 'student-life.html', 'fa-children'], ['Sports', 'sports.html', 'fa-futbol'],
        ['Clubs & Activities', 'activities.html', 'fa-people-group'], ['Events', 'events.html', 'fa-calendar-days'], ['Gallery', 'gallery.html', 'fa-images'],
        ['Achievements & Awards', 'achievements.html', 'fa-trophy'], ['Alumni', 'alumni.html', 'fa-user-graduate'], ['Transportation', 'transportation.html', 'fa-bus'],
        ['Library', 'library.html', 'fa-book'], ['News', 'news.html', 'fa-newspaper'], ['Blog', 'blog.html', 'fa-pen-nib'], ['FAQ', 'faq.html', 'fa-circle-question'],
        ['Contact Us', 'contact.html', 'fa-envelope'], ['Login', 'login.html', 'fa-right-to-bracket'], ['Register', 'register.html', 'fa-user-plus']
    ];

    function build() {
        const C = EDU.content;
        index = [
            ...PAGES.map(([t, h, i]) => ({ group: 'Pages', title: t, sub: h.replace('.html', ''), href: h, icon: i })),
            ...C.programs.map((p) => ({ group: 'Programs', title: p.name, sub: p.grades, href: `academics.html#${p.id}`, icon: p.icon, extra: p.desc })),
            ...EDU.db.all('teachers').map((t) => ({ group: 'Faculty', title: t.name, sub: t.designation, href: `faculty.html?q=${encodeURIComponent(t.name)}`, icon: 'fa-user', extra: t.department + ' ' + t.subjects.join(' ') })),
            ...EDU.db.all('events').map((e) => ({ group: 'Events', title: e.title, sub: `${EDU.utils.fmtDate(e.date)} · ${e.location}`, href: `event-details.html?id=${e.id}`, icon: 'fa-calendar-day', extra: e.category })),
            ...C.posts.map((p) => ({ group: 'News & Blog', title: p.title, sub: p.cat, href: `blog-details.html?id=${p.id}`, icon: 'fa-newspaper', extra: p.tags.join(' ') })),
            ...C.faqs.map((f) => ({ group: 'FAQs', title: f.q, sub: f.cat, href: 'faq.html', icon: 'fa-circle-question', extra: f.a }))
        ];
    }

    const highlight = (text, q) => { const t = esc(text); if (!q) return t; const i = t.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? t : t.slice(0, i) + '<mark>' + t.slice(i, i + q.length) + '</mark>' + t.slice(i + q.length); };

    function render(q = '') {
        q = q.trim();
        const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
        let list = !q ? index.filter((x) => ['Apply Online', 'Admissions', 'Events', 'Faculty Directory', 'Fee Structure', 'Contact Us'].includes(x.title))
            : index.filter((x) => { const hay = `${x.title} ${x.sub} ${x.extra || ''}`.toLowerCase(); return terms.every((t) => hay.includes(t)); }).slice(0, 24);
        focusIdx = -1;
        if (!list.length) { results.innerHTML = EDU.utils.empty('No results found', `Try "admission", "science", "football" or a teacher's name.`, 'fa-magnifying-glass'); return; }
        const groups = {};
        list.forEach((x) => { (groups[x.group] = groups[x.group] || []).push(x); });
        results.innerHTML = (q ? '' : '<div class="search-group-title">Quick links</div>') + Object.entries(groups).map(([g, items]) => `
            ${q ? `<div class="search-group-title">${g}</div>` : ''}
            ${items.map((x) => `<a class="search-result" href="${x.href}"><span class="icon-box"><i class="fa-solid ${x.icon}"></i></span><span><strong>${highlight(x.title, q)}</strong><small>${esc(x.sub)}</small></span></a>`).join('')}`).join('');
    }

    function open() {
        if (!overlay) create();
        build(); render(input.value);
        overlay.classList.add('open');
        document.body.classList.add('no-scroll');
        setTimeout(() => input.focus(), 50);
    }
    function close() { overlay.classList.remove('open'); document.body.classList.remove('no-scroll'); }

    function create() {
        overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Search');
        overlay.innerHTML = `<div class="search-box">
            <div class="search-input-row"><i class="fa-solid fa-magnifying-glass"></i>
                <label for="siteSearch" class="sr-only">Search</label>
                <input id="siteSearch" type="search" placeholder="Search programs, teachers, events, articles…" autocomplete="off">
                <kbd>ESC</kbd></div>
            <div class="search-results" role="listbox"></div></div>`;
        document.body.appendChild(overlay);
        input = $('#siteSearch', overlay);
        results = $('.search-results', overlay);
        input.addEventListener('input', EDU.utils.debounce(() => render(input.value), 120));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        overlay.addEventListener('keydown', (e) => {
            const items = $$('.search-result', results);
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                focusIdx = (focusIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
                items.forEach((it, i) => it.classList.toggle('focused', i === focusIdx));
                items[focusIdx] && items[focusIdx].scrollIntoView({ block: 'nearest' });
            }
            if (e.key === 'Enter' && focusIdx >= 0 && items[focusIdx]) { e.preventDefault(); location.href = items[focusIdx].getAttribute('href'); }
        });
    }

    EDU.search = {
        open, close,
        init() {
            document.addEventListener('click', (e) => { if (e.target.closest('[data-search-open]')) { e.preventDefault(); open(); } });
            document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); } });
        }
    };
})(window.EDU);
