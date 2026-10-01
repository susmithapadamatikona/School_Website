/* ==========================================================================
   Public website section renderers.
   Any element with data-render="<name>" is filled from EDU.content / EDU.db.
   Optional data-limit="n" limits the number of items.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, img, fmtDate, fmtTime, parse, MONTHS } = U;
    const C = () => EDU.content;

    const stars = (n) => Array.from({ length: 5 }, (_, i) => `<i class="fa-${i < n ? 'solid' : 'regular'} fa-star"></i>`).join('');
    const teacher = (id) => EDU.db.find('teachers', id) || { name: 'EDUCARE Team', photo: null };
    const delay = (i, step = 80) => `data-delay="${(i % 4) * step}"`;

    /* ---------- Shared card templates ---------- */
    const T = {
        program: (p, i) => `<article class="card card-hover program-card" data-reveal="up" ${delay(i)} id="card-${p.id}">
            <div class="card-img"><img src="${img(p.img)}" alt="${esc(p.name)} students at EDUCARE" loading="lazy"><span class="grade-tag">${esc(p.grades)}</span><span class="program-age">${esc(p.age)}</span></div>
            <div class="card-body"><h3 class="card-title">${esc(p.name)}</h3><p>${esc(p.desc)}</p>
                <div class="program-meta"><div><i class="fa-solid fa-book-open"></i><span><strong>Curriculum:</strong> ${esc(p.curriculum)}</span></div><div><i class="fa-solid fa-palette"></i><span><strong>Activities:</strong> ${esc(p.activities)}</span></div></div>
                <a class="link-arrow" href="academics.html#${p.id}" aria-label="Learn more about ${esc(p.name)}">Learn More <i class="fa-solid fa-arrow-right"></i></a></div></article>`,

        event: (e, i = 0) => {
            const d = parse(e.date), past = U.diffDays(e.date) < 0;
            const pct = Math.round((e.registered / e.capacity) * 100);
            return `<article class="card card-hover event-card${past ? ' past' : ''}" data-reveal="up" ${delay(i)}>
                <div class="card-img"><img src="${img(e.img)}" alt="${esc(e.title)}" loading="lazy">
                    <div class="event-date-badge"><strong>${d.getDate()}</strong><small>${MONTHS[d.getMonth()]}</small></div>
                    <span class="badge ${past ? 'badge-dark' : 'badge-primary'} cat-badge" style="${past ? '' : 'background:var(--card-bg)'}">${past ? 'Completed' : esc(e.category)}</span></div>
                <div class="card-body"><h3 class="card-title"><a href="event-details.html?id=${e.id}">${esc(e.title)}</a></h3>
                    <div class="event-info"><span><i class="fa-regular fa-clock"></i>${fmtTime(e.start)} – ${fmtTime(e.end)}</span><span><i class="fa-solid fa-location-dot"></i>${esc(e.location)}</span></div>
                    <p class="clamp-2">${esc(e.desc)}</p>
                    ${past ? '' : `<div class="seat-bar"><div class="row"><span>${U.num(e.registered)} registered</span><span>${Math.max(0, e.capacity - e.registered)} seats left</span></div><div class="progress sm"><span data-width="${pct}"></span></div></div>`}
                    <div class="flex gap-8"><a class="btn btn-soft btn-sm" href="404.html">Details</a>${past ? '' : `<a class="btn btn-primary btn-sm" href="404.html">Register <i class="fa-solid fa-arrow-right"></i></a>`}</div></div></article>`;
        },

        post: (p, i = 0) => {
            const a = teacher(p.author);
            return `<article class="card card-hover post-card" data-reveal="up" ${delay(i)}>
                <div class="card-img"><img src="${img(p.img)}" alt="${esc(p.title)}" loading="lazy"><span class="badge badge-primary cat" style="background:var(--card-bg)">${esc(p.cat)}</span></div>
                <div class="card-body"><div class="card-meta mb-8"><span><i class="fa-regular fa-calendar"></i>${fmtDate(p.date)}</span><span><i class="fa-regular fa-clock"></i>${p.read} min read</span></div>
                    <h3 class="card-title"><a href="blog-details.html?id=${p.id}">${esc(p.title)}</a></h3><p class="clamp-3">${esc(p.excerpt)}</p>
                    <div class="flex items-center justify-between mt-8"><span class="post-author">${U.avatar(a, 'sm')}<strong>${esc(a.name)}</strong></span><a class="link-arrow" href="blog-details.html?id=${p.id}" aria-label="Read ${esc(p.title)}">Read <i class="fa-solid fa-arrow-right"></i></a></div></div></article>`;
        },

        imageCard: (x, i = 0, extra = '') => `<article class="image-card" data-reveal="up" ${delay(i)}>
            <img src="${img(x.img)}" alt="${esc(x.name)} at EDUCARE" loading="lazy">
            <div class="content"><span class="icon-box"><i class="fa-solid ${x.icon}"></i></span><h3>${esc(x.name)}</h3><p>${esc(x.desc)}</p>${extra}</div></article>`
    };

    /* ---------- Renderers ---------- */
    const R = {
        programs: (el, n) => C().programs.slice(0, n).map(T.program).join(''),

        'programs-bento': () => C().programs.map((p, i) => `<a class="pb-card${i === 0 ? ' pb-feature' : ''}" href="404.html" data-reveal="up" data-delay="${i * 90}" aria-label="${esc(p.name)} — ${esc(p.grades)}">
            <img src="${img(p.img)}" srcset="${img(p.img)} 1x, ${img(p.img)} 2x" alt="${esc(p.name)} students at EDUCARE" loading="lazy" decoding="async">
            <span class="pb-top"><span class="pb-num">0${i + 1}</span><span class="pb-age"><i class="fa-regular fa-clock"></i> ${esc(p.age)}</span></span>
            <span class="pb-body">
                <span class="pb-grade"><i class="fa-solid ${p.icon}"></i> ${esc(p.grades)}</span>
                <span class="pb-title">${esc(p.name)}</span>
                <span class="pb-desc">${esc(p.desc)}</span>
                <span class="pb-foot"><span class="pb-curr"><i class="fa-solid fa-book-open"></i> ${esc(p.curriculum)}</span><span class="pb-go" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span></span>
            </span></a>`).join(''),

        'programs-rows': () => C().programs.map((p) => `<div class="program-row" id="${p.id}">
            <div class="program-row-media" data-reveal="zoom"><img src="${img(p.img)}" alt="${esc(p.name)} classroom" loading="lazy"></div>
            <div data-reveal="up"><span class="eyebrow"><i class="fa-solid ${p.icon}"></i> ${esc(p.grades)} · Ages ${esc(p.age)}</span>
                <h2>${esc(p.name)}</h2><p class="lead">${esc(p.desc)}</p>
                <ul class="check-list"><li><span><strong>Curriculum:</strong> ${esc(p.curriculum)}</span></li><li><span><strong>Activities:</strong> ${esc(p.activities)}</span></li><li><span>Maximum 30 students per section with dedicated class mentors</span></li></ul>
                <div class="pill-list">${p.subjects.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>
                <div class="btn-group mt-24"><a class="btn btn-primary" href="404.html">Apply for ${esc(p.name)}</a><a class="btn btn-ghost" href="404.html">View Fees</a></div></div></div>`).join(''),

        departments: (el, n) => C().departments.slice(0, n).map((d, i) => `<article class="card card-hover dept-card" style="--dept-color:${d.color}" data-reveal="up" ${delay(i, 60)}>
            <div class="top"><span class="icon-box ${d.box}"><i class="fa-solid ${d.icon}"></i></span><span class="badge">${d.faculty} Faculty</span></div>
            <h3>${esc(d.name)}</h3><p>${esc(d.desc)}</p>
            <div class="dept-foot"><span class="faculty-count"><i class="fa-solid fa-user-tie"></i> HOD: ${esc(d.hod)}</span><a class="link-arrow" href="faculty.html?q=${encodeURIComponent(d.name === 'Science' ? 'Science' : d.name)}" aria-label="${esc(d.name)} faculty">Learn More <i class="fa-solid fa-arrow-right"></i></a></div></article>`).join(''),

        why: (el, n) => C().why.slice(0, n).map((w, i) => `<article class="card card-hover why-item" data-reveal="up" ${delay(i, 60)}>
            <span class="icon-box ${w.box}"><i class="fa-solid ${w.icon}"></i></span><div><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></div></article>`).join(''),

        'why-side': (el) => {
            const left = el.dataset.side === 'left';
            return C().why.slice(left ? 0 : 5, left ? 5 : 10).map((w, i) => `<div class="why-row" data-reveal="${left ? 'left' : 'right'}" data-delay="${i * 80}">
                <span class="why-ico ${w.box}"><i class="fa-solid ${w.icon}"></i></span>
                <div><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></div></div>`).join('');
        },

        'facility-explorer': () => {
            const pick = ['main-campus', 'smart-classrooms', 'science-labs', 'computer-labs', 'library', 'sports', 'pool', 'auditorium'];
            const list = pick.map((id) => C().facilities.find((f) => f.id === id)).filter(Boolean);
            const src = (f, w, h, q) => img(f.img);
            return `<div class="fx-tabs" role="tablist" aria-label="Facilities">${list.map((f, i) => `
                <button class="fx-tab${i ? '' : ' active'}" role="tab" id="fx-tab-${i}" aria-selected="${!i}" aria-controls="fx-stage" data-fx="${i}" tabindex="${i ? -1 : 0}">
                    <span class="fx-tab-ico"><i class="fa-solid ${f.icon}"></i></span>
                    <span class="fx-tab-text"><strong>${esc(f.name)}</strong><small>${esc(f.stats[0][0])} ${esc(f.stats[0][1])}</small></span>
                    <i class="fa-solid fa-chevron-right fx-tab-arrow" aria-hidden="true"></i>
                    <span class="fx-progress" aria-hidden="true"></span>
                </button>`).join('')}</div>
            <div class="fx-stage" id="fx-stage" role="tabpanel" aria-live="polite">
                <div class="fx-media">${list.map((f, i) => `<img class="${i ? '' : 'active'}" src="${src(f, 1400, 900, 85)}" srcset="${src(f, 1400, 900, 85)} 1x, ${src(f, 2200, 1414, 80)} 2x" alt="${esc(f.name)} at EDUCARE" loading="${i ? 'lazy' : 'eager'}" decoding="async">`).join('')}</div>
                <div class="fx-info">${list.map((f, i) => `
                    <div class="fx-panel${i ? '' : ' active'}" data-panel="${i}">
                        <span class="fx-chip"><i class="fa-solid ${f.icon}"></i> Facility ${String(i + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}</span>
                        <h3>${esc(f.name)}</h3>
                        <p>${esc(f.desc)}</p>
                        <div class="fx-stats">${f.stats.map(([v, l]) => `<div><strong>${esc(v)}</strong><small>${esc(l)}</small></div>`).join('')}</div>
                        <div class="fx-actions"><a class="btn btn-gold btn-sm" href="404.html">Learn more <i class="fa-solid fa-arrow-right"></i></a>
                        <a class="btn btn-outline-light btn-sm" href="404.html"><i class="fa-solid fa-expand"></i> View photo</a></div>
                    </div>`).join('')}</div>
                <div class="fx-nav"><button class="fx-arrow" data-fx-step="-1" aria-label="Previous facility"><i class="fa-solid fa-arrow-left"></i></button><button class="fx-arrow" data-fx-step="1" aria-label="Next facility"><i class="fa-solid fa-arrow-right"></i></button><button class="fx-arrow" data-fx-pause aria-label="Pause slideshow"><i class="fa-solid fa-pause"></i></button></div>
            </div>`;
        },

        facilities: (el, n) => C().facilities.slice(0, n).map((f, i) => `<article class="card card-hover" data-reveal="up" ${delay(i)}>
            <div class="card-img"><img src="${img(f.img)}" alt="${esc(f.name)}" loading="lazy"></div>
            <div class="card-body"><div class="flex items-center gap-12 mb-8"><span class="icon-box sm"><i class="fa-solid ${f.icon}"></i></span><h3 class="card-title mb-0">${esc(f.name)}</h3></div>
            <p class="small mb-0">${esc(f.desc)}</p></div></article>`).join(''),

        'campus-bento': () => {
            const pick = ['main-campus', 'library', 'science-labs', 'sports', 'auditorium', 'pool', 'computer-labs'];
            const cls = ['big', '', '', 'tall', '', 'wide', ''];
            return pick.map((id, i) => { const f = C().facilities.find((x) => x.id === id); return `<div class="bento-item ${cls[i]}" data-reveal="zoom" ${delay(i, 60)} role="button" tabindex="0" data-lightbox="campus" data-src="${img(f.img)}" data-title="${esc(f.name)}" aria-label="View ${esc(f.name)}">
                <img src="${img(f.img)}" alt="${esc(f.name)}" loading="lazy"><span class="zoom"><i class="fa-solid fa-expand"></i></span>
                <div class="content"><h3>${esc(f.name)}</h3><p>${esc(f.desc.split('.')[0])}.</p></div></div>`; }).join('');
        },

        'campus-features': () => C().facilities.map((f) => `<div class="campus-feature" id="${f.id}">
            <div class="campus-media" data-reveal="zoom" role="button" tabindex="0" data-lightbox="campus" data-src="${img(f.img)}" data-title="${esc(f.name)}" aria-label="Enlarge ${esc(f.name)} photo">
                <img src="${img(f.img)}" alt="${esc(f.name)}" loading="lazy"><span class="count-tag"><i class="fa-solid fa-magnifying-glass-plus"></i> Click to zoom</span></div>
            <div data-reveal="up"><span class="icon-box lg solid mb-16"><i class="fa-solid ${f.icon}"></i></span><h2>${esc(f.name)}</h2><p class="lead">${esc(f.desc)}</p>
                <div class="facility-stats">${f.stats.map(([v, l]) => `<div><strong>${esc(v)}</strong><small>${esc(l)}</small></div>`).join('')}</div></div></div>`).join(''),

        'campus-slides': () => C().facilities.slice(0, 8).map((f) => `<div class="campus-slide" role="button" tabindex="0" data-lightbox="campus-slider" data-src="${img(f.img)}" data-title="${esc(f.name)}"><img src="${img(f.img)}" alt="${esc(f.name)}" loading="lazy"><div class="caption"><h3>${esc(f.name)}</h3></div></div>`).join(''),

        'faculty-highlights': (el, n = 4) => EDU.db.all('teachers').filter((t) => t.designation.startsWith('Head') || t.rating >= 4.9).slice(0, n).map((t, i) => `<article class="card card-hover faculty-highlight" data-reveal="up" ${delay(i)}>
            <span class="avatar"><img src="${img(t.photo)}" alt="${esc(t.name)}" loading="lazy"></span>
            <h3>${esc(t.name)}</h3><small>${esc(t.designation)}</small>
            <p class="small mt-8 clamp-2">${esc(t.bio)}</p><div class="flex justify-center gap-8 mt-16"><span class="badge badge-teal">${t.experience} yrs</span><span class="badge badge-warning"><i class="fa-solid fa-star"></i> ${t.rating}</span></div>
            <a class="btn btn-soft btn-sm mt-16" href="404.html">View Profile</a></article>`).join(''),

        'student-life': (el, n) => C().studentLife.slice(0, n).map((x, i) => T.imageCard(x, i, `<div class="meta"><span><i class="fa-solid fa-users"></i> ${U.num(x.members)} students</span></div>`)).join(''),

        sports: (el, n) => C().sports.slice(0, n).map((x, i) => T.imageCard(x, i, `<div class="meta"><span><i class="fa-solid fa-user-tie"></i> ${esc(x.coach)}</span><span><i class="fa-solid fa-trophy"></i> ${esc(x.achievements)}</span></div>`)).join(''),

        'events-upcoming': (el, n = 3) => {
            const list = EDU.db.all('events').filter((e) => U.diffDays(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);
            return list.length ? list.map(T.event).join('') : U.empty('No upcoming events', 'Check back soon!', 'fa-calendar');
        },

        'news-latest': (el, n = 3) => C().posts.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, n).map(T.post).join(''),

        testimonials: () => C().testimonials.map((t) => `<article class="card testimonial-card">
            <i class="fa-solid fa-quote-right quote-icon" aria-hidden="true"></i>
            <div class="stars" aria-label="${t.rating} out of 5 stars">${stars(t.rating)}</div>
            <blockquote>“${esc(t.text)}”</blockquote>
            <div class="testimonial-author">${U.avatar(t, 'lg')}<div><h4>${esc(t.name)}</h4><small><span class="badge ${t.role === 'Parent' ? 'badge-primary' : 'badge-teal'}" style="margin-right:6px">${esc(t.role)}</span>${esc(t.grade)}</small></div></div></article>`).join(''),

        'achievements-timeline': () => C().achievements.map((a, i) => `<div class="tl-item" data-reveal="${i % 2 ? 'right' : 'left'}"><div class="card tl-card"><span class="tl-year"><i class="fa-solid ${a.icon}"></i> ${a.year}</span><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div></div>`).join(''),

        awards: () => C().awards.map((a, i) => `<article class="card card-hover feature-card text-center" data-reveal="up" ${delay(i, 60)}>
            <span class="icon-box lg ${a.box}" style="margin:0 auto 18px"><i class="fa-solid ${a.icon}"></i></span>
            <div class="stat-light" style="padding:0 0 8px"><strong data-count="${a.count}" data-suffix="+">0</strong></div>
            <h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p></article>`).join(''),

        alumni: () => C().alumni.map((a, i) => `<article class="card card-hover alumni-card" data-reveal="up" ${delay(i)}>
            <div class="top">${U.avatar(a, 'lg')}<div><h3 class="mb-0" style="font-size:1.05rem">${esc(a.name)}</h3><span class="batch">${esc(a.batch)}</span></div></div>
            <p class="mb-0"><strong>${esc(a.role)}</strong></p><p class="mb-0" style="font-style:italic">“${esc(a.quote)}”</p></article>`).join(''),

        leadership: () => C().leadership.map((p, i) => `<article class="card card-hover person-card" data-reveal="up" ${delay(i)}>
            <div class="photo"><img src="${img(p.photo)}" alt="${esc(p.name)}" loading="lazy"></div>
            <div class="card-body"><h3>${esc(p.name)}</h3><span class="role">${esc(p.role)}</span></div></article>`).join(''),

        partners: () => { const row = C().partners.map((p) => `<span class="partner"><i class="fa-solid ${p.icon}"></i>${esc(p.name)}</span>`).join(''); return `<div class="marquee-track">${row}${row}</div>`; },

        faqs: (el) => {
            const cat = el.dataset.cat;
            return C().faqs.filter((f) => !cat || f.cat === cat).map((f, i) => `<div class="acc-item${i === 0 && !el.dataset.closed ? ' open' : ''}" data-cat="${esc(f.cat)}">
                <button class="acc-head" aria-expanded="${i === 0 && !el.dataset.closed}"><span>${esc(f.q)}</span><span class="acc-icon"><i class="fa-solid fa-plus"></i></span></button>
                <div class="acc-body"><div><p>${esc(f.a)}</p></div></div></div>`).join('');
        },

        'fee-table': () => {
            const rows = C().feeStructure;
            return `<div class="table-wrap"><table class="table fee-table"><caption class="sr-only">Annual fee structure 2026–27</caption>
                <thead><tr><th>Grade</th><th>Admission Fee<br><small>(one-time)</small></th><th>Annual Tuition</th><th>Activity & Lab</th><th>Transport<br><small>(optional)</small></th><th>Total (Year 1)</th></tr></thead>
                <tbody>${rows.map((r) => `<tr><td><strong>${esc(r.grade)}</strong></td><td>${U.money(r.admission)}</td><td>${U.money(r.tuition)}</td><td>${U.money(r.activity)}</td><td>${U.money(r.transport)}</td><td><strong class="text-primary">${U.money(r.admission + r.tuition + r.activity)}</strong></td></tr>`).join('')}</tbody>
                <tfoot><tr><td colspan="6" style="text-align:left">Instalments: 3 terms (Apr, Jul, Oct) · 3% discount on annual payment · 10% sibling concession on tuition</td></tr></tfoot></table></div>`;
        },

        'admission-dates': () => C().admissionDates.map((d, i) => { const x = parse(d.date); return `<div class="card card-hover date-card" data-reveal="up" ${delay(i, 60)}>
            <div class="date-box"><small>${MONTHS[x.getMonth()]} ${String(x.getFullYear()).slice(2)}</small><strong>${x.getDate()}</strong></div><div><h4>${esc(d.title)}</h4><p>${esc(d.text)}</p></div></div>`; }).join(''),

        documents: () => C().documents.map((d, i) => `<div class="doc-item" data-reveal="up" ${delay(i, 50)}><span class="icon-box sm teal"><i class="fa-solid ${d.icon}"></i></span><div><h4>${esc(d.name)}</h4><small>${esc(d.note)}</small></div></div>`).join(''),

        'age-table': () => `<div class="table-wrap"><table class="table table-plain age-table"><thead><tr><th>Grade</th><th>Minimum age (as on 31 March 2027)</th></tr></thead><tbody>${C().ageRequirements.map(([g, a]) => `<tr><td>${g}</td><td>${a}</td></tr>`).join('')}</tbody></table></div>`,

        'process-steps': () => [
            ['fa-laptop', 'Online Registration', 'Create an account and fill in the basic enquiry form.'],
            ['fa-file-signature', 'Application Submission', 'Complete the application and upload documents.'],
            ['fa-folder-open', 'Document Verification', 'Our admissions team verifies records within 3 working days.'],
            ['fa-pen-ruler', 'Entrance Assessment', 'Age-appropriate assessment in English, Maths & reasoning.'],
            ['fa-people-arrows', 'Parent Interaction', 'Meet the principal and coordinators on campus.'],
            ['fa-circle-check', 'Admission Confirmation', 'Receive the offer and confirm by paying the admission fee.']
        ].map(([icon, t, d], i) => `<div class="process-step" data-reveal="up" data-delay="${i * 90}"><div class="step-num"><i class="fa-solid ${icon}"></i><b>${i + 1}</b></div><h3>${t}</h3><p>${d}</p></div>`).join(''),

        'library-catalog': () => '',
        'notice-board': (el, n = 5) => EDU.db.all('notices').filter((x) => x.audience === 'all' || x.audience === 'parents').sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date)).slice(0, n).map((x) => `<div class="notice-item">
            <span class="icon-box sm ${x.priority === 'High' ? 'red' : x.priority === 'Medium' ? 'gold' : ''}"><i class="fa-solid ${x.pinned ? 'fa-thumbtack' : 'fa-bullhorn'}"></i></span>
            <div><h5>${esc(x.title)}</h5><small>${fmtDate(x.date)} · ${esc(x.category)}</small></div></div>`).join('')
    };

    function renderAll(root = document) {
        $$('[data-render]', root).forEach((el) => {
            const fn = R[el.dataset.render];
            if (!fn) return;
            try { el.innerHTML = fn(el, el.dataset.limit ? +el.dataset.limit : undefined); }
            catch (e) { console.error('Render failed:', el.dataset.render, e); el.innerHTML = U.empty('Content unavailable', 'Please refresh the page.', 'fa-triangle-exclamation'); }
        });
    }

    /* ---------- Accordion & tabs (global) ---------- */
    function bindAccordions() {
        document.addEventListener('click', (e) => {
            const head = e.target.closest('.acc-head');
            if (!head) return;
            const item = head.closest('.acc-item');
            const open = !item.classList.contains('open');
            if (item.parentElement.dataset.single !== undefined) $$('.acc-item.open', item.parentElement).forEach((x) => { x.classList.remove('open'); x.querySelector('.acc-head').setAttribute('aria-expanded', 'false'); });
            item.classList.toggle('open', open);
            head.setAttribute('aria-expanded', String(open));
        });
    }
    function bindTabs(root = document) {
        $$('[data-tabs]', root).forEach((wrap) => {
            if (wrap.dataset.bound) return; wrap.dataset.bound = '1';
            const btns = $$('.tab-btn', wrap).filter((b) => b.closest('[data-tabs]') === wrap);
            const activate = (btn) => {
                btns.forEach((b) => { const on = b === btn; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; const p = $('#' + b.getAttribute('aria-controls')); p && p.classList.toggle('active', on); });
            };
            btns.forEach((b, i) => {
                b.setAttribute('role', 'tab');
                b.addEventListener('click', () => activate(b));
                b.addEventListener('keydown', (e) => { if (['ArrowRight', 'ArrowLeft'].includes(e.key)) { const n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length]; n.focus(); activate(n); } });
            });
            activate(btns.find((b) => b.getAttribute('aria-selected') === 'true') || btns[0]);
        });
    }

    /* Home: facility explorer (tabs + auto-advancing showcase) */
    function bindFacilityExplorer() {
        const root = $('.fx-explorer');
        if (!root) return;
        const tabs = $$('.fx-tab', root), imgs = $$('.fx-media img', root), panels = $$('.fx-panel', root);
        const DURATION = 6500;
        let cur = 0, timer = null, paused = false;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const show = (i, focus) => {
            cur = (i + tabs.length) % tabs.length;
            tabs.forEach((t, k) => { const on = k === cur; t.classList.toggle('active', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; t.classList.remove('running'); });
            imgs.forEach((im, k) => im.classList.toggle('active', k === cur));
            panels.forEach((p, k) => p.classList.toggle('active', k === cur));
            $('#fx-stage', root).setAttribute('aria-labelledby', tabs[cur].id);
            if (focus) tabs[cur].focus();
            if (window.innerWidth < 992) tabs[cur].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
            restart();
        };
        const restart = () => {
            clearTimeout(timer);
            if (paused || reduce) return;
            const t = tabs[cur];
            t.style.setProperty('--fx-dur', DURATION + 'ms');
            void t.offsetWidth; t.classList.add('running');
            timer = setTimeout(() => show(cur + 1), DURATION);
        };
        tabs.forEach((t, i) => {
            t.addEventListener('click', () => show(i));
            t.addEventListener('keydown', (e) => {
                if (['ArrowDown', 'ArrowRight'].includes(e.key)) { e.preventDefault(); show(i + 1, true); }
                if (['ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); show(i - 1, true); }
            });
        });
        root.addEventListener('click', (e) => {
            const s = e.target.closest('[data-fx-step]'); if (s) show(cur + +s.dataset.fxStep);
            const p = e.target.closest('[data-fx-pause]');
            if (p) {
                paused = !paused;
                p.innerHTML = `<i class="fa-solid ${paused ? 'fa-play' : 'fa-pause'}"></i>`;
                p.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
                if (paused) { clearTimeout(timer); tabs[cur].classList.remove('running'); } else restart();
            }
        });
        // Pause while the user is reading/hovering the showcase
        const stage = $('#fx-stage', root);
        stage.addEventListener('mouseenter', () => { if (!paused) { clearTimeout(timer); tabs[cur].classList.add('hold'); } });
        stage.addEventListener('mouseleave', () => { tabs[cur].classList.remove('hold'); restart(); });
        // Only run while visible
        if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { if (en.isIntersecting) restart(); else clearTimeout(timer); }, { threshold: 0.3 }).observe(root);
        else restart();
    }

    /* FAQ page category filter */
    function bindFaqFilter() {
        const chips = $('[data-faq-filter]');
        if (!chips) return;
        const cats = ['All', ...new Set(C().faqs.map((f) => f.cat))];
        chips.innerHTML = cats.map((c, i) => `<button class="chip${i ? '' : ' active'}" data-value="${c}" aria-pressed="${!i}">${c}</button>`).join('');
        const search = $('#faqSearch');
        const apply = () => {
            const active = $('.chip.active', chips).dataset.value;
            const q = (search && search.value.trim().toLowerCase()) || '';
            let shown = 0;
            $$('.acc-item', $('#faqList')).forEach((it) => { const ok = (active === 'All' || it.dataset.cat === active) && (!q || it.textContent.toLowerCase().includes(q)); it.hidden = !ok; if (ok) shown++; });
            $('#faqEmpty').hidden = shown > 0;
        };
        chips.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; $$('.chip', chips).forEach((c) => { c.classList.toggle('active', c === b); c.setAttribute('aria-pressed', String(c === b)); }); apply(); });
        search && search.addEventListener('input', U.debounce(apply, 150));
    }

    /* ---------- News & blog listing ---------- */
    function initBlog() {
        const grid = $('#postGrid');
        if (!grid) return;
        const type = grid.dataset.type; // news | blog | ''
        const all = C().posts.filter((p) => !type || p.type === type).sort((a, b) => b.date.localeCompare(a.date));
        const featured = all.find((p) => p.featured) || all[0];
        const fEl = $('#featuredPost');
        if (fEl && featured) {
            const a = teacher(featured.author);
            fEl.innerHTML = `<article class="card featured-post" data-reveal="up"><div class="card-img"><img src="${img(featured.img)}" alt="${esc(featured.title)}"></div>
                <div class="card-body"><span class="badge badge-gold mb-16" style="align-self:flex-start"><i class="fa-solid fa-star"></i> Featured · ${esc(featured.cat)}</span>
                <h2><a href="blog-details.html?id=${featured.id}" style="color:inherit">${esc(featured.title)}</a></h2><p>${esc(featured.excerpt)}</p>
                <div class="card-meta mb-16"><span><i class="fa-regular fa-calendar"></i>${fmtDate(featured.date)}</span><span><i class="fa-regular fa-clock"></i>${featured.read} min read</span></div>
                <div class="flex items-center justify-between flex-wrap gap-12"><span class="post-author">${U.avatar(a)}<span><strong>${esc(a.name)}</strong><br><small>${esc(a.designation || '')}</small></span></span><a class="btn btn-primary btn-sm" href="blog-details.html?id=${featured.id}">Read Article <i class="fa-solid fa-arrow-right"></i></a></div></div></article>`;
        }
        const cats = [...new Set(all.map((p) => p.cat))];
        const catList = $('#catList');
        if (catList) catList.innerHTML = `<li><button class="active" data-value="all">All Posts <span>${all.length}</span></button></li>` + cats.map((c) => `<li><button data-value="${esc(c)}">${esc(c)} <span>${all.filter((p) => p.cat === c).length}</span></button></li>`).join('');
        const pop = $('#popularPosts');
        if (pop) pop.innerHTML = all.slice().sort((a, b) => b.read - a.read).slice(0, 4).map((p) => `<div class="mini-post"><img src="${img(p.img)}" alt="" loading="lazy"><div><h5><a href="blog-details.html?id=${p.id}">${esc(p.title)}</a></h5><small>${fmtDate(p.date)}</small></div></div>`).join('');
        const tags = $('#tagCloud');
        if (tags) tags.innerHTML = [...new Set(all.flatMap((p) => p.tags))].map((t) => `<button class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join('');
        const ctrl = EDU.listing({
            container: grid, items: all.filter((p) => p !== featured), render: T.post, pageSize: 6, pager: $('#postPager'),
            searchInput: $('#postSearch'), searchFields: ['title', 'excerpt', 'cat', 'tags'],
            filters: [{ el: catList, key: 'cat' }, { key: 'tag', match: (p, v) => p.tags.includes(v) }]
        });
        catList && catList.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('button', catList).forEach((x) => x.classList.toggle('active', x === b)); });
        tags && tags.addEventListener('click', (e) => {
            const b = e.target.closest('[data-tag]'); if (!b) return;
            const on = !b.classList.contains('active');
            $$('.tag', tags).forEach((x) => x.classList.remove('active'));
            b.classList.toggle('active', on);
            b.style.cssText = on ? 'background:var(--primary);color:#fff' : '';
            $$('.tag', tags).forEach((x) => { if (x !== b) x.style.cssText = ''; });
            ctrl.set('tag', on ? b.dataset.tag : 'all');
        });
    }

    function initBlogDetails() {
        const el = $('#article');
        if (!el) return;
        const posts = C().posts;
        const p = posts.find((x) => x.id === U.qs('id')) || posts[3];
        const a = teacher(p.author);
        document.title = `${p.title} | EDUCARE Blog`;
        $('#articleTitle').textContent = p.title;
        $('#articleCrumb').textContent = p.cat;
        $('#articleMeta').innerHTML = `<span class="badge badge-primary">${esc(p.cat)}</span><span><i class="fa-regular fa-calendar"></i> ${fmtDate(p.date, { long: true })}</span><span><i class="fa-regular fa-clock"></i> ${p.read} min read</span><span><i class="fa-regular fa-user"></i> ${esc(a.name)}</span>`;
        el.innerHTML = `
            <div class="article-cover"><img src="${img(p.img)}" alt="${esc(p.title)}"></div>
            <p class="lead"><strong>${esc(p.excerpt)}</strong></p>
            <p>At EDUCARE International School, we believe that meaningful learning happens when curiosity meets structure. This article is part of our ongoing series in which teachers, counsellors and students share practical insights from our classrooms and community.</p>
            <h2>Why this matters</h2>
            <p>Research from the OECD and CBSE's own competency-based framework shows that students thrive when they understand the <em>why</em> behind what they learn. Across grades, our faculty design experiences that connect concepts to real life — whether that is measuring the school garden's growth in Mathematics or debating ethics in Social Studies.</p>
            <blockquote>“Education is not the filling of a pail, but the lighting of a fire.” — W.B. Yeats</blockquote>
            <h2>Practical steps</h2>
            <ul><li>Set a consistent daily routine with focused 25–30 minute study blocks.</li><li>Use active recall: close the book and explain the concept aloud or on paper.</li><li>Review with spaced repetition — revisit topics after 1, 3 and 7 days.</li><li>Talk regularly with teachers through the student and parent portals.</li><li>Protect sleep, exercise and screen-free family time.</li></ul>
            <h2>How EDUCARE supports families</h2>
            <p>Every student has a class mentor, access to subject clinics after school and a personalised dashboard showing attendance, homework and results in real time. Parents receive instant notifications and can message teachers directly from the parent portal.</p>
            <p>Have questions or ideas for our next article? Write to us at <a href="mailto:info@educare.edu">info@educare.edu</a>.</p>
            <div class="tag-cloud mt-24">${p.tags.map((t) => `<a class="tag" href="blog.html">#${esc(t)}</a>`).join('')}</div>
            <div class="share-row"><strong>Share:</strong>
                <a class="btn-icon bordered sm" href="#" aria-label="Share on Facebook"><i class="fa-brands fa-facebook-f"></i></a>
                <a class="btn-icon bordered sm" href="#" aria-label="Share on X"><i class="fa-brands fa-x-twitter"></i></a>
                <a class="btn-icon bordered sm" href="#" aria-label="Share on LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
                <a class="btn-icon bordered sm" href="#" aria-label="Share on WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
                <button class="btn btn-soft btn-sm" id="copyLink"><i class="fa-solid fa-link"></i> Copy link</button></div>
            <div class="card author-box">${U.avatar(a, 'xl')}<div><small class="text-muted">Written by</small><h3 class="mb-0">${esc(a.name)}</h3><p class="text-primary fw-600 small">${esc(a.designation || '')}</p><p class="mb-0 small">${esc(a.bio || '')}</p></div></div>`;
        $('#copyLink').addEventListener('click', () => { (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(() => EDU.toast.success('Link copied', 'Share it with friends and family.')).catch(() => EDU.toast.info('Copy this link', location.href)); });
        const related = $('#relatedPosts');
        if (related) related.innerHTML = posts.filter((x) => x.id !== p.id && (x.cat === p.cat || x.tags.some((t) => p.tags.includes(t)))).concat(posts.filter((x) => x.id !== p.id)).filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 3).map(T.post).join('');
        const pop = $('#popularPosts');
        if (pop) pop.innerHTML = posts.filter((x) => x.id !== p.id).slice(0, 4).map((x) => `<div class="mini-post"><img src="${img(x.img)}" alt="" loading="lazy"><div><h5><a href="blog-details.html?id=${x.id}">${esc(x.title)}</a></h5><small>${fmtDate(x.date)}</small></div></div>`).join('');
    }

    /* ---------- Forms: newsletter & contact ---------- */
    function bindForms() {
        document.addEventListener('submit', async (e) => {
            const f = e.target;
            if (f.matches('[data-newsletter]')) {
                e.preventDefault();
                const input = f.querySelector('input[type=email]');
                if (!EDU.validate.RULES.email(input.value.trim()) || EDU.validate.RULES.email(input.value.trim()) !== true) { EDU.toast.error('Invalid email', 'Please enter a valid email address.'); input.focus(); return; }
                const list = EDU.db.all('newsletter');
                if (list.some((x) => x.email === input.value.trim())) { EDU.toast.info('Already subscribed', 'You are already on our mailing list.'); return; }
                EDU.db.insert('newsletter', { email: input.value.trim(), date: new Date().toISOString() });
                input.value = '';
                EDU.toast.success('Subscribed!', 'You will receive our monthly newsletter.');
            }
            if (f.matches('[data-contact-form]')) {
                e.preventDefault();
                if (!EDU.validate.form(f)) return EDU.toast.error('Please check the form', 'Some fields need your attention.');
                const btn = f.querySelector('[type=submit]'); btn.classList.add('loading');
                const data = Object.fromEntries(new FormData(f).entries());
                await EDU.api.create('inquiries', { ...data, date: new Date().toISOString(), status: 'New' });
                EDU.db.insert('notifications', { id: U.uid('NT'), target: 'role:admin', text: `New ${data.type || 'general'} inquiry from ${data.name}: "${data.subject}"`, type: 'message', time: new Date().toISOString(), read: false, link: 'admin-dashboard.html#messages' });
                btn.classList.remove('loading');
                f.reset(); $$('.is-valid', f).forEach((x) => x.classList.remove('is-valid'));
                EDU.modal.success({ title: 'Message sent!', text: `Thank you, ${data.name.split(' ')[0]}. Our ${data.type || 'admissions'} team will respond within one working day. Reference: INQ-${Date.now().toString().slice(-6)}` });
            }
        });
        $$('[data-contact-form]').forEach((f) => EDU.validate.attach(f));
    }

    /* Virtual tour modal (hero CTA) */
    function bindTour() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('[data-virtual-tour]')) return;
            e.preventDefault();
            const f = C().facilities;
            let i = 0;
            const m = EDU.modal.open({
                title: '<i class="fa-solid fa-vr-cardboard text-primary"></i> Virtual Campus Tour', size: 'xl',
                body: `<div class="tour-viewer"><img id="tourImg" src="${img(f[0].img)}" alt="${esc(f[0].name)}"><button class="tour-nav prev" aria-label="Previous stop"><i class="fa-solid fa-chevron-left"></i></button><button class="tour-nav next" aria-label="Next stop"><i class="fa-solid fa-chevron-right"></i></button><div class="tour-caption"><h4 id="tourTitle"></h4><p id="tourText"></p></div></div>
                    <div class="tour-thumbs">${f.map((x, k) => `<button data-k="${k}" aria-label="${esc(x.name)}"><img src="${img(x.img)}" alt=""></button>`).join('')}</div>`,
                footer: `<span class="small text-muted" style="margin-right:auto">Use ← → keys to navigate · <span id="tourStep"></span></span><a class="btn btn-primary" href="contact.html">Book an In-Person Visit</a>`
            });
            const show = (k) => {
                i = (k + f.length) % f.length;
                const im = m.el.querySelector('#tourImg'); im.style.opacity = 0;
                setTimeout(() => { im.src = img(f[i].img); im.alt = f[i].name; im.style.opacity = 1; }, 180);
                im.style.transition = 'opacity .3s';
                m.el.querySelector('#tourTitle').textContent = `${i + 1}. ${f[i].name}`;
                m.el.querySelector('#tourText').textContent = f[i].desc;
                m.el.querySelector('#tourStep').textContent = `Stop ${i + 1} of ${f.length}`;
                $$('.tour-thumbs button', m.el).forEach((b, n) => b.classList.toggle('active', n === i));
            };
            m.el.querySelector('.prev').onclick = () => show(i - 1);
            m.el.querySelector('.next').onclick = () => show(i + 1);
            m.el.querySelector('.tour-thumbs').onclick = (ev) => { const b = ev.target.closest('[data-k]'); if (b) show(+b.dataset.k); };
            m.el.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowLeft') show(i - 1); if (ev.key === 'ArrowRight') show(i + 1); });
            show(0);
        });
    }

    EDU.components = {
        T, R, renderAll,
        init() {
            renderAll();
            bindAccordions(); bindTabs(); bindFaqFilter(); bindFacilityExplorer(); initBlog(); initBlogDetails(); bindForms(); bindTour();
            document.addEventListener('click', (e) => { const b = e.target.closest('[data-profile]'); if (b && EDU.faculty) { e.preventDefault(); EDU.faculty.profile(b.dataset.profile); } });
        },
        bindTabs
    };
})(window.EDU);
