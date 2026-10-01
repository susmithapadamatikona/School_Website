/* ==========================================================================
   Filter / search / sort / pagination controller + faculty directory
   EDU.listing({ container, items, render, pageSize, searchInput, searchFields,
                 filters: [{ el, key, match? }], sortSelect, sorters, pager, onEmpty })
   ========================================================================== */
(function (EDU) {
    'use strict';
    const { $, $$, esc, img, debounce, empty } = EDU.utils;

    function pagination(el, page, pages, total, from, to, onGo) {
        if (!el) return;
        if (pages <= 1) { el.innerHTML = total ? `<span class="info">Showing ${total} result${total > 1 ? 's' : ''}</span>` : ''; return; }
        const nums = [];
        for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
        el.innerHTML = `<span class="info">Showing ${from}–${to} of ${total}</span><div class="pages">
            <button class="page-btn" data-go="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page"><i class="fa-solid fa-chevron-left"></i></button>
            ${nums.map((n) => n === '…' ? '<span class="page-btn" style="border:0">…</span>' : `<button class="page-btn${n === page ? ' active' : ''}" data-go="${n}" aria-label="Page ${n}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`).join('')}
            <button class="page-btn" data-go="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next page"><i class="fa-solid fa-chevron-right"></i></button></div>`;
        el.onclick = (e) => { const b = e.target.closest('[data-go]'); if (b && !b.disabled) onGo(+b.dataset.go); };
    }

    function listing(opts) {
        const state = { q: '', page: 1, filters: {}, sort: opts.defaultSort || null };
        const o = Object.assign({ pageSize: 9, searchFields: ['name', 'title'], filters: [], sorters: {} }, opts);

        const apply = () => {
            let list = typeof o.items === 'function' ? o.items() : o.items.slice();
            if (state.q) {
                const terms = state.q.toLowerCase().split(/\s+/);
                list = list.filter((it) => { const hay = o.searchFields.map((f) => [].concat(it[f] ?? '').join(' ')).join(' ').toLowerCase(); return terms.every((t) => hay.includes(t)); });
            }
            o.filters.forEach((f) => {
                const v = state.filters[f.key];
                if (v && v !== 'all') list = list.filter((it) => (f.match ? f.match(it, v) : String(it[f.key]) === v));
            });
            if (state.sort && o.sorters[state.sort]) list.sort(o.sorters[state.sort]);
            return list;
        };

        const draw = () => {
            const list = apply();
            const pages = Math.max(1, Math.ceil(list.length / o.pageSize));
            state.page = Math.min(state.page, pages);
            const start = (state.page - 1) * o.pageSize;
            const slice = list.slice(start, start + o.pageSize);
            o.container.innerHTML = slice.length ? slice.map(o.render).join('') : (o.onEmpty ? o.onEmpty() : `<div style="grid-column:1/-1">${empty('No matching results', 'Try a different search term or clear the filters.', 'fa-filter-circle-xmark')}</div>`);
            if (o.count) o.count.textContent = list.length;
            pagination(o.pager, state.page, pages, list.length, start + 1, start + slice.length, (p) => { state.page = p; draw(); o.container.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
            o.after && o.after(slice, list);
        };

        if (o.searchInput) {
            o.searchInput.addEventListener('input', debounce(() => { state.q = o.searchInput.value.trim(); state.page = 1; draw(); }, 180));
            if (o.initialQuery) { o.searchInput.value = o.initialQuery; state.q = o.initialQuery; }
        }
        o.filters.forEach((f) => {
            if (!f.el) return;
            if (f.el.tagName === 'SELECT') f.el.addEventListener('change', () => { state.filters[f.key] = f.el.value; state.page = 1; draw(); });
            else f.el.addEventListener('click', (e) => {
                const b = e.target.closest('[data-value]'); if (!b) return;
                $$('[data-value]', f.el).forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
                state.filters[f.key] = b.dataset.value; state.page = 1; draw();
            });
        });
        if (o.sortSelect) o.sortSelect.addEventListener('change', () => { state.sort = o.sortSelect.value; draw(); });
        draw();
        return { draw, state, set(key, v) { state.filters[key] = v; state.page = 1; draw(); } };
    }

    /* ---------------- Faculty directory ---------------- */
    function facultyCard(t) {
        return `<article class="card card-hover faculty-card" data-reveal="up">
            <div class="photo">
                <img src="${img(t.photo)}" alt="${esc(t.name)}, ${esc(t.designation)}" loading="lazy">
                <span class="badge badge-primary dept-badge" style="background:var(--card-bg)">${esc(t.department)}</span>
                <div class="socials"><a href="mailto:${t.email}" aria-label="Email ${esc(t.name)}"><i class="fa-solid fa-envelope"></i></a><a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a><a href="#" data-profile="${t.id}" aria-label="View profile"><i class="fa-solid fa-user"></i></a></div>
            </div>
            <div class="card-body">
                <h3>${esc(t.name)}</h3>
                <div class="designation">${esc(t.designation)}</div>
                <div class="faculty-info">
                    <span><i class="fa-solid fa-graduation-cap"></i>${esc(t.qualification)}</span>
                    <span><i class="fa-solid fa-book"></i>${esc(t.subjects.join(', '))}</span>
                    <span><i class="fa-solid fa-envelope"></i>${esc(t.email)}</span>
                </div>
            </div>
            <div class="card-foot"><span class="exp"><i class="fa-solid fa-briefcase text-primary"></i> ${t.experience} yrs experience</span><button class="btn btn-soft btn-xs" data-profile="${t.id}">View Profile</button></div>
        </article>`;
    }

    function profileModal(id) {
        const t = EDU.db.find('teachers', id);
        if (!t) return;
        EDU.modal.open({
            title: 'Faculty Profile', size: 'lg',
            body: `<div class="profile-modal-head"><img src="${img(t.photo)}" alt="${esc(t.name)}">
                <div><span class="badge badge-primary mb-8">${esc(t.department)}</span><h3 class="mb-0">${esc(t.name)}</h3><p class="mb-0 text-primary fw-600">${esc(t.designation)}</p>
                <div class="stars mt-8">${'<i class="fa-solid fa-star"></i>'.repeat(Math.round(t.rating))} <span class="small text-muted" style="margin-left:6px">${t.rating} student rating</span></div></div></div>
                <p>${esc(t.bio)}</p>
                <div class="profile-facts">
                    <div><small>Qualification</small><strong>${esc(t.qualification)}</strong></div>
                    <div><small>Experience</small><strong>${t.experience} years</strong></div>
                    <div><small>Subjects</small><strong>${esc(t.subjects.join(', '))}</strong></div>
                    <div><small>Classes</small><strong>${esc(t.classes.join(', '))}</strong></div>
                    <div><small>Email</small><strong>${esc(t.email)}</strong></div>
                    <div><small>Office Hours</small><strong>Mon – Fri, 2:30 – 3:30 PM</strong></div>
                </div>`,
            footer: `<button class="btn btn-ghost" data-close>Close</button><a class="btn btn-primary" href="mailto:${t.email}"><i class="fa-solid fa-envelope"></i> Contact Teacher</a>`
        });
    }

    function initFaculty() {
        const grid = $('#facultyGrid');
        if (!grid) return;
        const teachers = EDU.db.all('teachers');
        const dept = $('#fDept'), subj = $('#fSubject'), exp = $('#fExp');
        [...new Set(teachers.map((t) => t.department))].sort().forEach((d) => dept.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`));
        [...new Set(teachers.flatMap((t) => t.subjects))].sort().forEach((s) => subj.insertAdjacentHTML('beforeend', `<option value="${esc(s)}">${esc(s)}</option>`));
        listing({
            container: grid, items: teachers, render: facultyCard, pageSize: 8, pager: $('#facultyPager'), count: $('#facultyCount'),
            searchInput: $('#fSearch'), searchFields: ['name', 'department', 'designation', 'subjects', 'qualification'], initialQuery: EDU.utils.qs('q') || '',
            filters: [
                { el: dept, key: 'department' },
                { el: subj, key: 'subject', match: (t, v) => t.subjects.includes(v) },
                { el: exp, key: 'experience', match: (t, v) => { const [a, b] = v.split('-').map(Number); return t.experience >= a && t.experience <= (b || 99); } }
            ],
            sortSelect: $('#fSort'), defaultSort: 'name',
            sorters: { name: (a, b) => a.name.localeCompare(b.name), exp: (a, b) => b.experience - a.experience, rating: (a, b) => b.rating - a.rating }
        });
    }

    EDU.listing = listing;
    EDU.pagination = pagination;
    EDU.faculty = { card: facultyCard, profile: profileModal };
    EDU.filter = { init() { initFaculty(); } };
})(window.EDU);
