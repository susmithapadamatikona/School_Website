/* ==========================================================================
   Library — digital catalogue, member dashboard (my books, due soon,
   overdue, renew, reserve) and admin management (add / edit / delete
   books, issue & return, members). Also powers the public library page.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, fmtDate } = U;
    EDU.views = EDU.views || {};
    const D = () => EDU.data;

    const available = (b) => b.copies - EDU.db.all('loans').filter((l) => l.bookId === b.id && !l.returned).length;
    const cover = (b, lg) => `<div class="book-cover ${lg ? 'lg' : ''}" style="background:linear-gradient(160deg, ${b.color}, ${b.color}cc)"><span>${esc(b.title)}</span></div>`;
    const memberName = (id) => { const s = EDU.db.find('students', id); if (s) return `${s.name} (${s.class})`; const t = EDU.db.find('teachers', id); return t ? `${t.name} (Staff)` : id; };

    function bookCard(b, actions = true) {
        const a = available(b);
        return `<article class="card card-hover book-card">${cover(b)}
            <div class="grow" style="min-width:0"><h4 class="clamp-2">${esc(b.title)}</h4><small>${esc(b.author)} · ${b.year}</small>
            <div class="flex gap-8 flex-wrap mt-8"><span class="badge">${esc(b.category)}</span><span class="badge ${a > 0 ? 'badge-success' : 'badge-danger'}">${a > 0 ? `${a} available` : 'All issued'}</span></div>
            ${actions ? `<div class="flex gap-8 mt-16"><button class="btn btn-xs btn-soft" data-book="${b.id}">Details</button>${a > 0 ? `<button class="btn btn-xs btn-primary" data-reserve="${b.id}">Reserve</button>` : `<button class="btn btn-xs btn-ghost" data-waitlist="${b.id}">Join waitlist</button>`}</div>` : ''}</div></article>`;
    }

    function bookModal(id, c) {
        const b = EDU.db.find('books', id);
        const a = available(b);
        EDU.modal.open({
            title: 'Book Details', size: 'lg',
            body: `<div class="flex gap-24 flex-wrap">${cover(b, true)}<div class="grow" style="min-width:240px"><span class="badge badge-primary mb-8">${esc(b.category)}</span><h3 class="mb-0">${esc(b.title)}</h3><p class="mb-8">by <strong>${esc(b.author)}</strong> · ${b.year}</p>
                <div class="stars mb-16">${'<i class="fa-solid fa-star"></i>'.repeat(Math.round(b.rating))} <span class="small text-muted" style="margin-left:6px">${b.rating} / 5</span></div><p>${esc(b.desc)}</p>
                <div class="detail-list"><div><small>ISBN</small><strong>${b.isbn}</strong></div><div><small>Shelf</small><strong>${b.shelf}</strong></div><div><small>Copies</small><strong>${b.copies}</strong></div><div><small>Available</small><strong class="${a ? 'text-success' : 'text-danger'}">${a}</strong></div></div></div></div>`,
            footer: `<button class="btn btn-ghost" data-close>Close</button>${c && c.role !== 'admin' && a > 0 ? `<button class="btn btn-primary" data-reserve="${b.id}" data-close><i class="fa-solid fa-bookmark"></i> Reserve for pickup</button>` : ''}`
        });
    }

    function reserve(id, c) {
        const b = EDU.db.find('books', id);
        if (!c) { EDU.toast.info('Sign in to reserve', 'Log in to the student portal to reserve books.'); return; }
        EDU.notify.push(c.user.id, `"${b.title}" is reserved for you. Collect it from the library desk within 2 days.`, 'library', 'library-dashboard.html', { silent: true });
        EDU.toast.success('Book reserved', `Pick up "${b.title}" at the library desk (Shelf ${b.shelf}).`);
    }

    /* Catalogue list used by both portal and public page */
    function catalog(root, c) {
        const books = () => EDU.db.all('books').map((b) => ({ ...b, _avail: available(b) > 0 ? 'available' : 'issued' }));
        const cats = ['all', ...new Set(EDU.db.all('books').map((b) => b.category))];
        root.innerHTML = `<div class="toolbar"><div class="chip-group" id="libCats">${cats.map((x, i) => `<button class="chip${i ? '' : ' active'}" data-value="${esc(x)}">${x === 'all' ? 'All' : esc(x)}</button>`).join('')}</div>
            <div class="toolbar-group"><div class="search-field"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="libSearch" placeholder="Search title, author, ISBN…" aria-label="Search books"></div>
            <select class="form-control sm" id="libAvail" style="width:auto" aria-label="Availability"><option value="all">All books</option><option value="available">Available now</option><option value="issued">Currently issued</option></select>
            <select class="form-control sm" id="libSort" style="width:auto" aria-label="Sort"><option value="title">Title A–Z</option><option value="rating">Top rated</option><option value="new">Newest</option></select></div></div>
            <div class="grid grid-3" id="libGrid" style="gap:18px"></div><div class="pagination" id="libPager"></div>`;
        return EDU.listing({
            container: $('#libGrid', root), items: books, render: (b) => bookCard(b), pageSize: 9, pager: $('#libPager', root),
            searchInput: $('#libSearch', root), searchFields: ['title', 'author', 'isbn', 'category'],
            filters: [{ el: $('#libCats', root), key: 'category' }, { el: $('#libAvail', root), key: '_avail' }],
            sortSelect: $('#libSort', root), defaultSort: 'title',
            sorters: { title: (a, b) => a.title.localeCompare(b.title), rating: (a, b) => b.rating - a.rating, new: (a, b) => b.year - a.year }
        });
    }

    /* ---------------- Member view ---------------- */
    function memberView(c) {
        const id = c.student ? c.student.id : c.teacher.id;
        const loans = D().loans(id);
        const active = loans.filter((l) => !l.returned);
        const st = (s) => active.filter((l) => D().loanStatus(l) === s).length;
        return `${EDU.ui.pageHead('Library', 'Borrow, renew and discover books from our 28,000+ collection.', '')}
            <div class="kpi-grid">
                ${EDU.ui.kpi({ label: 'Borrowed', value: active.length, icon: 'fa-book-open', box: '' })}
                ${EDU.ui.kpi({ label: 'Due Soon', value: st('Due Soon'), icon: 'fa-hourglass-half', box: 'gold' })}
                ${EDU.ui.kpi({ label: 'Overdue', value: st('Overdue'), icon: 'fa-triangle-exclamation', box: 'red', trend: st('Overdue') ? `Fine: <b class="down">₹${active.filter((l) => D().loanStatus(l) === 'Overdue').reduce((a, l) => a + -U.diffDays(l.due) * 5, 0)}</b>` : 'No fines' })}
                ${EDU.ui.kpi({ label: 'Books Read (Year)', value: loans.filter((l) => l.returned).length + 9, icon: 'fa-trophy', box: 'purple', trend: 'Read-a-thon rank #12' })}
            </div>
            <div class="dash-grid">
                <div class="col-12">${EDU.ui.panel('My Books', active.length ? `<div class="grid grid-3" style="gap:16px">${active.map((l) => { const b = EDU.db.find('books', l.bookId); const s = D().loanStatus(l); return `<article class="card book-card">${cover(b)}<div class="grow" style="min-width:0"><h4 class="clamp-2">${esc(b.title)}</h4><small>${esc(b.author)}</small>
                    <div class="mt-8">${U.statusBadge(s)}</div><small class="${s === 'Overdue' ? 'text-danger' : ''}" style="display:block;margin-top:8px"><i class="fa-regular fa-calendar"></i> Due ${fmtDate(l.due)} (${U.relLabel(l.due)})</small>
                    <div class="flex gap-8 mt-16"><button class="btn btn-xs btn-soft" data-renew="${l.id}" ${s === 'Overdue' ? 'disabled title="Return overdue books before renewing"' : ''}><i class="fa-solid fa-rotate"></i> Renew</button><button class="btn btn-xs btn-ghost" data-book="${b.id}">Details</button></div></div></article>`; }).join('')}</div>` : U.empty('No borrowed books', 'Explore the catalogue below.', 'fa-book'), { icon: 'fa-book-bookmark' })}</div>
                <div class="col-12">${EDU.ui.panel('Reading History', `<div class="table-wrap"><table class="table"><thead><tr><th>Book</th><th>Issued</th><th>Returned</th></tr></thead><tbody>${loans.filter((l) => l.returned).map((l) => { const b = EDU.db.find('books', l.bookId); return `<tr><td><strong>${esc(b.title)}</strong><br><small class="text-muted">${esc(b.author)}</small></td><td>${fmtDate(l.issued)}</td><td>${fmtDate(l.returned)}</td></tr>`; }).join('') || `<tr><td colspan="3">${U.empty('No history yet')}</td></tr>`}</tbody></table></div>`, { icon: 'fa-clock-rotate-left', flush: true })}</div>
                <div class="col-12">${EDU.ui.panel('Catalogue', '<div id="libCatalog"></div>', { icon: 'fa-magnifying-glass' })}</div>
            </div>`;
    }
    function memberMount(el, c) {
        catalog($('#libCatalog', el), c);
        el.addEventListener('click', (e) => {
            const r = e.target.closest('[data-renew]');
            if (r && !r.disabled) { const l = EDU.db.find('loans', r.dataset.renew); EDU.db.update('loans', l.id, { due: U.toISO(U.addDays(U.parse(l.due), 7)) }); EDU.toast.success('Book renewed', `New due date: ${fmtDate(U.toISO(U.addDays(U.parse(l.due), 7)))}.`); }
        });
        c.on('db:loans', () => c.rerender());
    }

    /* ---------------- Admin view ---------------- */
    function adminView() {
        const loans = EDU.db.all('loans');
        const active = loans.filter((l) => !l.returned);
        return `${EDU.ui.pageHead('Library Management', 'Catalogue, circulation and members.', '<button class="btn btn-soft" data-issue><i class="fa-solid fa-arrow-right-from-bracket"></i> Issue Book</button><button class="btn btn-primary" data-add><i class="fa-solid fa-plus"></i> Add Book</button>')}
            <div class="kpi-grid">
                ${EDU.ui.kpi({ label: 'Titles (demo)', value: EDU.db.all('books').length, icon: 'fa-book', trend: '28,412 volumes in total' })}
                ${EDU.ui.kpi({ label: 'Issued', value: active.length, icon: 'fa-arrow-right-from-bracket', box: 'gold' })}
                ${EDU.ui.kpi({ label: 'Overdue', value: active.filter((l) => D().loanStatus(l) === 'Overdue').length, icon: 'fa-triangle-exclamation', box: 'red' })}
                ${EDU.ui.kpi({ label: 'Members', value: '2,700', icon: 'fa-id-card', box: 'teal', trend: 'Students & staff' })}
            </div>
            <div data-tabs><div class="tabs-list mb-24" role="tablist"><button class="tab-btn" aria-controls="tCat" aria-selected="true"><i class="fa-solid fa-book"></i> Catalogue</button><button class="tab-btn" aria-controls="tLoans"><i class="fa-solid fa-right-left"></i> Circulation</button><button class="tab-btn" aria-controls="tMem"><i class="fa-solid fa-users"></i> Members</button><button class="tab-btn" aria-controls="tUse"><i class="fa-solid fa-chart-line"></i> Usage</button></div>
            <div class="tab-panel" id="tCat" role="tabpanel"><section class="panel"><div class="panel-head"><div class="search-field"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="bkSearch" placeholder="Search catalogue…" aria-label="Search catalogue"></div></div><div class="panel-body flush"><div class="table-wrap"><table class="table"><thead><tr><th>Book</th><th>Category</th><th>ISBN</th><th>Copies</th><th>Available</th><th class="text-right">Actions</th></tr></thead><tbody id="bkRows"></tbody></table></div></div><div class="card-foot"><div class="pagination w-100" id="bkPager" style="padding:0"></div></div></section></div>
            <div class="tab-panel" id="tLoans" role="tabpanel"><section class="panel"><div class="panel-body flush"><div class="table-wrap"><table class="table"><thead><tr><th>Book</th><th>Member</th><th>Issued</th><th>Due</th><th>Status</th><th class="text-right">Action</th></tr></thead><tbody id="lnRows"></tbody></table></div></div></section></div>
            <div class="tab-panel" id="tMem" role="tabpanel"><section class="panel"><div class="panel-body flush"><div class="table-wrap"><table class="table"><thead><tr><th>Member</th><th>Type</th><th>Books issued</th><th>Overdue</th></tr></thead><tbody id="mbRows"></tbody></table></div></div></section></div>
            <div class="tab-panel" id="tUse" role="tabpanel">${EDU.ui.panel('Monthly Issues', '<div class="chart-box"><canvas id="libUse"></canvas></div>', { icon: 'fa-chart-line' })}</div></div>`;
    }
    function bookForm(b = {}) {
        const cats = [...new Set(EDU.db.all('books').map((x) => x.category))];
        return `<form id="bkForm" class="form-grid" novalidate>
            <div class="form-group span-2"><label class="form-label" for="bTitle">Title <span class="req">*</span></label><input class="form-control" id="bTitle" required value="${esc(b.title || '')}"></div>
            <div class="form-group"><label class="form-label" for="bAuthor">Author <span class="req">*</span></label><input class="form-control" id="bAuthor" required value="${esc(b.author || '')}"></div>
            <div class="form-group"><label class="form-label" for="bCat">Category</label><select class="form-control" id="bCat">${cats.map((x) => `<option ${x === b.category ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
            <div class="form-group"><label class="form-label" for="bYear">Year <span class="req">*</span></label><input class="form-control" type="number" id="bYear" required min="1500" max="${new Date().getFullYear()}" value="${b.year || 2024}"></div>
            <div class="form-group"><label class="form-label" for="bCopies">Copies <span class="req">*</span></label><input class="form-control" type="number" id="bCopies" required min="1" max="200" value="${b.copies || 3}"></div>
            <div class="form-group span-2"><label class="form-label" for="bDesc">Description</label><textarea class="form-control" id="bDesc" rows="3">${esc(b.desc || '')}</textarea></div></form>`;
    }
    function adminMount(el, c) {
        EDU.components.bindTabs(el);
        const ctrl = EDU.listing({
            container: $('#bkRows', el), items: () => EDU.db.all('books'), pageSize: 8, pager: $('#bkPager', el), searchInput: $('#bkSearch', el), searchFields: ['title', 'author', 'isbn', 'category'],
            render: (b) => `<tr><td><div class="cell-user"><div class="book-cover" style="width:34px;height:46px;padding:0;background:${b.color}"></div><div><strong>${esc(b.title)}</strong><small>${esc(b.author)} · ${b.year}</small></div></div></td><td>${esc(b.category)}</td><td class="small">${b.isbn}</td><td>${b.copies}</td><td><span class="badge ${available(b) ? 'badge-success' : 'badge-danger'}">${available(b)}</span></td>
                <td><div class="actions"><button class="btn-icon sm" data-edit="${b.id}" aria-label="Edit ${esc(b.title)}"><i class="fa-solid fa-pen"></i></button><button class="btn-icon sm" data-del="${b.id}" aria-label="Delete ${esc(b.title)}"><i class="fa-solid fa-trash-can text-danger"></i></button></div></td></tr>`,
            onEmpty: () => `<tr><td colspan="6">${U.empty('No books found')}</td></tr>`
        });
        const drawLoans = () => {
            const loans = EDU.db.all('loans').slice().sort((a, b) => (!!a.returned - !!b.returned) || a.due.localeCompare(b.due));
            $('#lnRows', el).innerHTML = loans.map((l) => { const b = EDU.db.find('books', l.bookId) || { title: 'Deleted book' }; const s = D().loanStatus(l); return `<tr><td><strong>${esc(b.title)}</strong></td><td>${esc(memberName(l.memberId))}</td><td>${fmtDate(l.issued)}</td><td>${fmtDate(l.due)}</td><td>${U.statusBadge(s)}</td><td><div class="actions">${l.returned ? `<small class="text-muted">${fmtDate(l.returned)}</small>` : `<button class="btn btn-xs btn-soft-success" data-return="${l.id}">Return</button>`}</div></td></tr>`; }).join('');
            const members = {};
            EDU.db.all('loans').filter((l) => !l.returned).forEach((l) => { members[l.memberId] = members[l.memberId] || { n: 0, o: 0 }; members[l.memberId].n++; if (D().loanStatus(l) === 'Overdue') members[l.memberId].o++; });
            $('#mbRows', el).innerHTML = Object.entries(members).map(([id, v]) => `<tr><td><strong>${esc(memberName(id))}</strong><br><small class="text-muted">${id}</small></td><td>${id.startsWith('T') ? '<span class="badge badge-purple">Staff</span>' : '<span class="badge badge-primary">Student</span>'}</td><td>${v.n}</td><td>${v.o ? `<span class="badge badge-danger">${v.o}</span>` : '0'}</td></tr>`).join('');
        };
        drawLoans();
        const A = EDU.db.obj('analytics');
        EDU.charts.make($('#libUse', el), { type: 'line', data: { labels: A.libraryUsage.labels, datasets: [{ label: 'Books issued', data: A.libraryUsage.data, color: '#EC4899' }] } });
        const save = (m, id) => {
            const form = $('#bkForm', m.el);
            if (!EDU.validate.form(form)) return;
            const data = { title: $('#bTitle', m.el).value.trim(), author: $('#bAuthor', m.el).value.trim(), category: $('#bCat', m.el).value, year: +$('#bYear', m.el).value, copies: +$('#bCopies', m.el).value, desc: $('#bDesc', m.el).value.trim() };
            if (id) EDU.db.update('books', id, data);
            else { const n = EDU.db.all('books').length + 1; EDU.db.insert('books', { id: 'BK' + String(n + 100).padStart(3, '0'), ...data, isbn: '978-' + Math.floor(1e9 + Math.random() * 9e9), shelf: data.category.slice(0, 3).toUpperCase() + '-' + n, color: EDU.utils.PALETTE[n % 8], rating: 4.5 }); }
            m.close(); EDU.toast.success(id ? 'Book updated' : 'Book added', data.title);
        };
        el.addEventListener('click', async (e) => {
            if (e.target.closest('[data-add]')) { const m = EDU.modal.open({ title: 'Add Book', body: bookForm(), footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-save>Add Book</button>' }); EDU.validate.attach($('#bkForm', m.el)); m.el.querySelector('[data-save]').onclick = () => save(m); }
            const ed = e.target.closest('[data-edit]');
            if (ed) { const b = EDU.db.find('books', ed.dataset.edit); const m = EDU.modal.open({ title: 'Edit Book', body: bookForm(b), footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-save>Save changes</button>' }); EDU.validate.attach($('#bkForm', m.el)); m.el.querySelector('[data-save]').onclick = () => save(m, b.id); }
            const del = e.target.closest('[data-del]');
            if (del) { const b = EDU.db.find('books', del.dataset.del); if (await EDU.modal.confirm({ title: 'Delete this book?', text: `"${b.title}" will be removed from the catalogue.`, confirmText: 'Delete', danger: true })) { EDU.db.remove('books', b.id); EDU.toast.success('Book deleted'); } }
            const ret = e.target.closest('[data-return]');
            if (ret) { EDU.db.update('loans', ret.dataset.return, { returned: U.rel(0) }); EDU.toast.success('Book returned', 'Copy is back on the shelf.'); }
            if (e.target.closest('[data-issue]')) {
                const members = [...EDU.db.all('students'), ...EDU.db.all('teachers')];
                const books = EDU.db.all('books').filter((b) => available(b) > 0);
                const m = EDU.modal.open({ title: '<i class="fa-solid fa-arrow-right-from-bracket text-primary"></i> Issue Book', body: `<form id="isForm" class="form-grid" novalidate>
                    <div class="form-group span-2"><label class="form-label" for="isMember">Member <span class="req">*</span></label><select class="form-control" id="isMember" required><option value="">Select member…</option>${members.map((x) => `<option value="${x.id}">${esc(x.name)} — ${x.class || 'Staff'} (${x.id})</option>`).join('')}</select></div>
                    <div class="form-group span-2"><label class="form-label" for="isBook">Book <span class="req">*</span></label><select class="form-control" id="isBook" required><option value="">Select book…</option>${books.map((b) => `<option value="${b.id}">${esc(b.title)} (${available(b)} available)</option>`).join('')}</select></div>
                    <div class="form-group"><label class="form-label" for="isDue">Due date</label><input class="form-control" type="date" id="isDue" value="${U.rel(14)}" min="${U.rel(1)}"></div></form>`, footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-go>Issue</button>' });
                EDU.validate.attach($('#isForm', m.el));
                m.el.querySelector('[data-go]').onclick = () => {
                    if (!EDU.validate.form($('#isForm', m.el))) return;
                    EDU.db.insert('loans', { id: U.uid('LN'), bookId: $('#isBook', m.el).value, memberId: $('#isMember', m.el).value, issued: U.rel(0), due: $('#isDue', m.el).value, returned: null });
                    const u = EDU.db.all('users').find((x) => x.studentId === $('#isMember', m.el).value);
                    if (u) EDU.notify.push(u.id, `Book issued: "${EDU.db.find('books', $('#isBook', m.el).value).title}" — due ${fmtDate($('#isDue', m.el).value)}.`, 'library', 'library-dashboard.html', { silent: true });
                    m.close(); EDU.toast.success('Book issued', memberName($('#isMember', m.el).value));
                };
            }
        });
        c.on('db:books', () => ctrl.draw());
        c.on('db:loans', () => { ctrl.draw(); drawLoans(); });
    }

    EDU.views.library = {
        title: 'Library',
        render: (c) => (c.role === 'admin' ? adminView(c) : c.role === 'parent' ? memberView({ ...c }) : memberView(c)),
        mount: (el, c) => { if (c.role === 'admin') adminMount(el, c); else memberMount(el, c); el.addEventListener('click', (e) => { const b = e.target.closest('[data-book]'); if (b) bookModal(b.dataset.book, c); const r = e.target.closest('[data-reserve]'); if (r) reserve(r.dataset.reserve, c); const w = e.target.closest('[data-waitlist]'); if (w) EDU.toast.info('Added to waitlist', 'We will notify you when a copy is returned.'); }); }
    };

    /* Public library page */
    EDU.bus.on('ready', () => {
        const root = $('#publicCatalog');
        if (!root) return;
        catalog(root, null);
        root.addEventListener('click', (e) => { const b = e.target.closest('[data-book]'); if (b) bookModal(b.dataset.book, null); const r = e.target.closest('[data-reserve]'); if (r) reserve(r.dataset.reserve, EDU.auth.user() ? { user: EDU.auth.user(), role: EDU.auth.user().role } : null); const w = e.target.closest('[data-waitlist]'); if (w) EDU.toast.info('Sign in required', 'Log in to join the waitlist.'); });
    });
    EDU.library = { catalog, available };
})(window.EDU);
