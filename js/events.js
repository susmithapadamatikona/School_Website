/* ==========================================================================
   Events — public listing (search, category, date, upcoming/past),
   event details (countdown, schedule, speakers, gallery, registration),
   portal events view and admin "create event".
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, img, fmtDate, fmtTime } = U;
    EDU.views = EDU.views || {};
    const CATS = ['Academic', 'Sports', 'Cultural', 'Competitions', 'Parent Meetings', 'Workshops', 'Seminars', 'School Trips', 'Celebrations'];

    const startOf = (e) => { const d = U.parse(e.date); const [h, m] = e.start.split(':').map(Number); d.setHours(h, m); return d; };

    /* ---------------- Public listing ---------------- */
    function initList() {
        const grid = $('#evGrid');
        if (!grid) return;
        const all = () => EDU.db.all('events').map((e) => ({ ...e, _when: U.diffDays(e.date) >= 0 ? 'upcoming' : 'past' }));
        $('#evCats').innerHTML = ['all', ...CATS].map((c, i) => `<button class="chip${i ? '' : ' active'}" data-value="${c}" aria-pressed="${!i}">${c === 'all' ? 'All Events' : c}</button>`).join('');
        const ctrl = EDU.listing({
            container: grid, items: all, render: EDU.components.T.event, pageSize: 6, pager: $('#evPager'), count: $('#evCount'),
            searchInput: $('#evSearch'), searchFields: ['title', 'desc', 'category', 'location'],
            filters: [
                { el: $('#evCats'), key: 'category' },
                { el: $('#evWhen'), key: '_when' },
                { el: $('#evDate'), key: 'range', match: (e, v) => { const d = U.diffDays(e.date); return v === 'week' ? d >= 0 && d <= 7 : v === 'month' ? d >= 0 && d <= 31 : v === 'quarter' ? d >= 0 && d <= 92 : true; } }
            ],
            sorters: { date: (a, b) => (a._when === b._when ? (a._when === 'upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) : a._when === 'upcoming' ? -1 : 1) }, defaultSort: 'date'
        });
        ctrl.set('_when', 'upcoming');
        // Featured event with countdown
        const f = EDU.db.all('events').filter((e) => U.diffDays(e.date) >= 0).sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.date.localeCompare(b.date))[0];
        const fe = $('#featuredEvent');
        if (f && fe) {
            fe.innerHTML = `<div class="live-class-card" style="padding:0;overflow:hidden;grid-template-columns:1.1fr 1fr;background:var(--dark)">
                <div style="padding:clamp(28px,4vw,48px)"><span class="badge badge-gold"><i class="fa-solid fa-star"></i> Featured Event · ${esc(f.category)}</span><h3 style="font-size:clamp(1.4rem,2.6vw,2rem)">${esc(f.title)}</h3>
                    <p class="mb-24">${fmtDate(f.date, { long: true })} · ${fmtTime(f.start)} · ${esc(f.location)}</p><div id="featCd" class="mb-24">${EDU.exams ? '' : ''}<div class="countdown glass-cd">${['Days', 'Hours', 'Minutes', 'Seconds'].map((l) => `<div class="cd-box"><strong>00</strong><small>${l}</small></div>`).join('')}</div></div>
                    <div class="btn-group"><a class="btn btn-light" href="event-details.html?id=${f.id}#register">Register Now <i class="fa-solid fa-arrow-right"></i></a><a class="btn btn-outline-light" href="event-details.html?id=${f.id}">Event Details</a></div></div>
                <div style="position:relative;min-height:280px"><img src="${img(f.img)}" alt="${esc(f.title)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div></div>`;
            runCountdown($('#featCd'), startOf(f).getTime());
        }
        EDU.bus.on('db:events', () => ctrl.draw());
    }

    function runCountdown(el, target) {
        const boxes = $$('.cd-box strong', el);
        const tick = () => {
            const ms = Math.max(0, target - Date.now());
            [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60].forEach((v, i) => { if (boxes[i]) boxes[i].textContent = String(v).padStart(2, '0'); });
        };
        tick();
        EDU.realtime.subscribe('clock', tick);
    }

    /* ---------------- Details ---------------- */
    function initDetails() {
        const banner = $('#evBanner');
        if (!banner) return;
        const events = EDU.db.all('events');
        const e = events.find((x) => x.id === U.qs('id')) || events.find((x) => x.featured) || events[0];
        const past = U.diffDays(e.date) < 0;
        document.title = `${e.title} | Events · EDUCARE`;
        banner.innerHTML = `<img src="${img(e.img)}" alt="">
            <div class="container"><nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a href="index.html">Home</a></li><li><a href="events.html">Events</a></li><li aria-current="page">${esc(e.category)}</li></ol></nav>
                <span class="badge badge-gold mb-16">${esc(e.category)}</span><h1>${esc(e.title)}</h1>
                <div class="event-banner-meta"><span><i class="fa-regular fa-calendar"></i>${fmtDate(e.date, { long: true })}</span><span><i class="fa-regular fa-clock"></i>${fmtTime(e.start)} – ${fmtTime(e.end)}</span><span><i class="fa-solid fa-location-dot"></i>${esc(e.location)}</span><span><i class="fa-solid fa-user-tie"></i>${esc(e.organizer)}</span></div></div>`;
        const gallery = ['audience', 'celebration', 'studyGroup', 'concert', 'kidsGroup', 'scienceLab'];
        $('#evContent').innerHTML = `
            <section class="mb-48"><h2>About this event</h2><p class="lead">${esc(e.desc)}</p><p>Open to students, parents and invited guests. Please arrive 15 minutes early; entry is through Gate 2 with your registration QR code (sent by email after you register). Refreshments will be served.</p>
                <div class="grid grid-3 mt-24" style="gap:16px">${[['fa-users', `${U.num(e.registered)} registered`], ['fa-chair', `${Math.max(0, e.capacity - e.registered)} seats left`], ['fa-ticket', 'Free entry']].map(([i, t]) => `<div class="card" style="padding:18px;display:flex;gap:12px;align-items:center"><span class="icon-box sm"><i class="fa-solid ${i}"></i></span><strong>${t}</strong></div>`).join('')}</div></section>
            ${e.schedule && e.schedule.length ? `<section class="mb-48"><h2>Schedule</h2><div class="card" style="padding:8px 26px"><ul class="schedule-list">${e.schedule.map(([t, title, where]) => `<li><time>${fmtTime(t)}</time><div><h4>${esc(title)}</h4><p><i class="fa-solid fa-location-dot"></i> ${esc(where)}</p></div></li>`).join('')}</ul></div></section>` : ''}
            ${e.speakers && e.speakers.length ? `<section class="mb-48"><h2>Speakers & Guests</h2><div class="grid grid-3" style="gap:16px">${e.speakers.map(([n, r, p]) => `<div class="card speaker">${U.avatar({ name: n, photo: p }, 'lg')}<div><h4>${esc(n)}</h4><small>${esc(r)}</small></div></div>`).join('')}</div></section>` : ''}
            <section><h2>Gallery</h2><p>Moments from previous editions.</p><div class="masonry" style="columns:3 180px">${gallery.map((g, i) => `<div class="masonry-item" role="button" tabindex="0" data-lightbox="ev" data-src="${img(g)}" data-title="${esc(e.title)} — photo ${i + 1}"><img src="${img(g)}" alt="Event photo ${i + 1}" loading="lazy"><span class="zoom-ico"><i class="fa-solid fa-expand"></i></span></div>`).join('')}</div></section>`;
        const aside = $('#evAside');
        aside.innerHTML = `
            <div class="card" style="padding:26px">${past ? `<h3 class="mb-8"><i class="fa-solid fa-flag-checkered text-primary"></i> Event completed</h3><p class="mb-0">This event took place on ${fmtDate(e.date)}. Browse the gallery or explore upcoming events.</p><a class="btn btn-primary btn-block mt-16" href="events.html">Upcoming events</a>` : `<h3 class="mb-16">Event Starts In</h3><div id="dCd"><div class="countdown">${['Days', 'Hours', 'Minutes', 'Seconds'].map((l) => `<div class="cd-box"><strong>00</strong><small>${l}</small></div>`).join('')}</div></div>
                <div class="seat-bar mt-24"><div class="row"><span>${U.num(e.registered)} registered</span><span>${Math.round((e.registered / e.capacity) * 100)}% full</span></div><div class="progress"><span data-width="${Math.round((e.registered / e.capacity) * 100)}"></span></div></div>`}</div>
            ${past ? '' : `<div class="card" style="padding:26px" id="register"><h3 class="mb-8">Register for this event</h3><p class="small">Secure your seat — confirmation is sent instantly.</p>
                <form id="regForm" novalidate><div class="form-group mb-16"><label class="form-label" for="rName">Full name <span class="req">*</span></label><input class="form-control" id="rName" name="name" required data-rule="name"></div>
                <div class="form-group mb-16"><label class="form-label" for="rEmail">Email <span class="req">*</span></label><input class="form-control" type="email" id="rEmail" name="email" required></div>
                <div class="form-group mb-16"><label class="form-label" for="rPhone">Phone <span class="req">*</span></label><input class="form-control" id="rPhone" name="phone" required data-rule="phone"></div>
                <div class="form-group mb-16"><label class="form-label" for="rType">I am a</label><select class="form-control" id="rType" name="type"><option>Parent</option><option>Student</option><option>Alumni</option><option>Guest</option></select></div>
                <div class="form-group mb-16"><label class="form-label" for="rCount">Attendees</label><select class="form-control" id="rCount" name="count"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
                <button class="btn btn-primary btn-block" type="submit"><i class="fa-solid fa-ticket"></i> Confirm Registration</button></form></div>`}
            <div class="card" style="padding:26px"><h4>Event Information</h4><div class="info-list">
                <div class="info-item"><span class="icon-box sm"><i class="fa-regular fa-calendar"></i></span><div><h4>Date</h4><p>${fmtDate(e.date, { long: true })}</p></div></div>
                <div class="info-item"><span class="icon-box sm teal"><i class="fa-regular fa-clock"></i></span><div><h4>Time</h4><p>${fmtTime(e.start)} – ${fmtTime(e.end)}</p></div></div>
                <div class="info-item"><span class="icon-box sm gold"><i class="fa-solid fa-location-dot"></i></span><div><h4>Venue</h4><p>${esc(e.location)}</p></div></div>
                <div class="info-item"><span class="icon-box sm purple"><i class="fa-solid fa-user-tie"></i></span><div><h4>Organizer</h4><p>${esc(e.organizer)}</p></div></div></div>
                <button class="btn btn-soft btn-block mt-16" id="addCal"><i class="fa-solid fa-calendar-plus"></i> Add to calendar</button></div>`;
        if (!past) runCountdown($('#dCd'), startOf(e).getTime());
        const related = $('#relatedEvents');
        if (related) related.innerHTML = events.filter((x) => x.id !== e.id && U.diffDays(x.date) >= 0).slice(0, 3).map(EDU.components.T.event).join('');
        $('#addCal').addEventListener('click', () => {
            const dt = (d, t) => d.replace(/-/g, '') + 'T' + t.replace(':', '') + '00';
            U.download(`${U.slug(e.title)}.ics`, `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//EDUCARE//Events//EN\nBEGIN:VEVENT\nUID:${e.id}@educare.edu\nDTSTART:${dt(e.date, e.start)}\nDTEND:${dt(e.date, e.end)}\nSUMMARY:${e.title}\nLOCATION:${e.location}\nDESCRIPTION:${e.desc}\nEND:VEVENT\nEND:VCALENDAR`, 'text/calendar');
            EDU.toast.success('Calendar file downloaded', 'Open it to add the event to your calendar.');
        });
        const form = $('#regForm');
        if (form) {
            const u = EDU.auth.user();
            if (u) { form.name.value = u.name; form.email.value = EDU.auth.email(u); form.phone.value = u.phone || ''; form.type.value = U.cap(u.role) === 'Admin' ? 'Guest' : U.cap(u.role); }
            EDU.validate.attach(form);
            form.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                if (!EDU.validate.form(form)) return;
                const cur = EDU.db.find('events', e.id);
                if ((cur.registrations || []).some((r) => r.email.toLowerCase() === form.email.value.trim().toLowerCase())) return EDU.toast.warning('Already registered', 'This email is already registered for the event.');
                const btn = form.querySelector('[type=submit]'); btn.classList.add('loading');
                await U.sleep(900);
                const ticket = 'TKT-' + Math.floor(100000 + Math.random() * 899999);
                EDU.db.update('events', e.id, (x) => ({ ...x, registered: x.registered + +form.count.value, registrations: [...(x.registrations || []), { name: form.name.value.trim(), email: form.email.value.trim(), phone: form.phone.value.trim(), type: form.type.value, count: +form.count.value, ticket, date: new Date().toISOString(), userId: u ? u.id : null }] }));
                btn.classList.remove('loading');
                EDU.modal.success({ title: 'You\'re registered!', text: `See you at "${e.title}" on ${fmtDate(e.date)}.`, html: `<div class="app-id-box"><i class="fa-solid fa-ticket"></i>${ticket}</div><p class="small">A confirmation with your QR entry pass has been sent to ${esc(form.email.value)}.</p>` });
                form.reset();
                $$('.is-valid', form).forEach((x) => x.classList.remove('is-valid'));
            });
        }
        if (location.hash === '#register') setTimeout(() => { const r = $('#register'); r && r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 400);
    }

    /* ---------------- Admin create ---------------- */
    function openCreate() {
        const m = EDU.modal.open({
            title: '<i class="fa-solid fa-calendar-plus text-primary"></i> Create Event', size: 'lg',
            body: `<form id="evForm" class="form-grid" novalidate>
                <div class="form-group span-2"><label class="form-label" for="eTitle">Event title <span class="req">*</span></label><input class="form-control" id="eTitle" required></div>
                <div class="form-group"><label class="form-label" for="eCat">Category</label><select class="form-control" id="eCat">${CATS.map((c) => `<option>${c}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label" for="eDate">Date <span class="req">*</span></label><input class="form-control" type="date" id="eDate" required min="${U.rel(0)}" value="${U.rel(20)}"></div>
                <div class="form-group"><label class="form-label" for="eStart">Start</label><input class="form-control" type="time" id="eStart" value="10:00"></div>
                <div class="form-group"><label class="form-label" for="eEnd">End</label><input class="form-control" type="time" id="eEnd" value="13:00"></div>
                <div class="form-group"><label class="form-label" for="eLoc">Location <span class="req">*</span></label><input class="form-control" id="eLoc" required value="Main Auditorium"></div>
                <div class="form-group"><label class="form-label" for="eCap">Capacity</label><input class="form-control" type="number" id="eCap" value="300" min="10"></div>
                <div class="form-group span-2"><label class="form-label" for="eDesc">Description <span class="req">*</span></label><textarea class="form-control" id="eDesc" required rows="4" data-rule="min:20"></textarea></div></form>`,
            footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="eSave"><i class="fa-solid fa-paper-plane"></i> Publish Event</button>'
        });
        EDU.validate.attach($('#evForm', m.el));
        $('#eSave', m.el).addEventListener('click', () => {
            if (!EDU.validate.form($('#evForm', m.el))) return;
            const imgs = { Sports: 'running', Cultural: 'concert', Workshops: 'coding', Seminars: 'conference', 'School Trips': 'trip', Celebrations: 'celebration', 'Parent Meetings': 'teacherKids', Competitions: 'scienceLab', Academic: 'studyGroup' };
            const cat = $('#eCat', m.el).value;
            const e = { id: U.uid('EV'), title: $('#eTitle', m.el).value.trim(), category: cat, date: $('#eDate', m.el).value, start: $('#eStart', m.el).value, end: $('#eEnd', m.el).value, location: $('#eLoc', m.el).value.trim(), img: imgs[cat], desc: $('#eDesc', m.el).value.trim(), organizer: 'EDUCARE Events Committee', capacity: +$('#eCap', m.el).value, registered: 0, registrations: [], schedule: [], speakers: [] };
            EDU.db.insert('events', e);
            EDU.notify.push('all', `New event: ${e.title} on ${fmtDate(e.date)}.`, 'event', `event-details.html?id=${e.id}`, { silent: true });
            m.close();
            EDU.toast.success('Event published', 'It is now live on the public website and all portals.');
        });
    }

    /* ---------------- Portal view ---------------- */
    EDU.views.events = {
        title: 'Events',
        render: (c) => `${EDU.ui.pageHead('School Events', 'Register for upcoming events and relive past ones.', c.role === 'admin' ? '<button class="btn btn-primary" data-create><i class="fa-solid fa-plus"></i> Create Event</button>' : '<a class="btn btn-soft" href="events.html"><i class="fa-solid fa-globe"></i> Public events page</a>')}
            <div class="toolbar"><div class="chip-group" id="peWhen"><button class="chip active" data-value="upcoming">Upcoming</button><button class="chip" data-value="past">Past</button><button class="chip" data-value="mine">My registrations</button></div>
            <div class="search-field"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="peSearch" placeholder="Search events…" aria-label="Search events"></div></div>
            <div class="grid grid-3" id="peGrid"></div><div class="pagination" id="pePager"></div>`,
        mount(el, c) {
            const mine = (e) => (e.registrations || []).some((r) => r.userId === c.user.id);
            const items = () => EDU.db.all('events').map((e) => ({ ...e, _when: U.diffDays(e.date) >= 0 ? 'upcoming' : 'past' })).sort((a, b) => a.date.localeCompare(b.date));
            const render = (e) => { const html = EDU.components.T.event(e); const reg = mine(e); return html.replace(/<a class="btn btn-primary btn-sm" href="event-details[^"]*#register">Register <i class="fa-solid fa-arrow-right"><\/i><\/a>/, `<button class="btn ${reg ? 'btn-soft-success' : 'btn-primary'} btn-sm" data-reg="${e.id}">${reg ? '<i class="fa-solid fa-check"></i> Registered' : 'Register'}</button>`) + (c.role === 'admin' ? '' : ''); };
            const ctrl = EDU.listing({ container: $('#peGrid', el), items, render, pageSize: 9, pager: $('#pePager', el), searchInput: $('#peSearch', el), searchFields: ['title', 'category', 'location'], filters: [{ el: $('#peWhen', el), key: '_when', match: (e, v) => v === 'mine' ? mine(e) : e._when === v }] });
            ctrl.set('_when', 'upcoming');
            el.addEventListener('click', async (ev) => {
                if (ev.target.closest('[data-create]')) return openCreate();
                const b = ev.target.closest('[data-reg]');
                if (!b) return;
                const e = EDU.db.find('events', b.dataset.reg);
                if (mine(e)) {
                    if (!(await EDU.modal.confirm({ title: 'Cancel registration?', text: `You will lose your seat for "${e.title}".`, confirmText: 'Cancel registration', danger: true }))) return;
                    EDU.db.update('events', e.id, (x) => ({ ...x, registered: Math.max(0, x.registered - 1), registrations: x.registrations.filter((r) => r.userId !== c.user.id) }));
                    EDU.toast.info('Registration cancelled');
                } else {
                    EDU.db.update('events', e.id, (x) => ({ ...x, registered: x.registered + 1, registrations: [...(x.registrations || []), { userId: c.user.id, name: c.user.name, email: EDU.auth.email(c.user), count: 1, ticket: 'TKT-' + Math.floor(1e5 + Math.random() * 9e5), date: new Date().toISOString() }] }));
                    EDU.toast.success('Registered!', `You're attending "${e.title}". Your e-pass has been emailed.`);
                }
            });
            c.on('db:events', () => ctrl.draw());
        }
    };

    EDU.eventsUI = { openCreate, runCountdown };
    EDU.bus.on('ready', () => { initList(); initDetails(); });
})(window.EDU);
