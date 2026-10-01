/* ==========================================================================
   Remaining portal views: profile, settings, subjects, children, students,
   teachers, parents, admissions, classes, lesson plans, notices, online
   classes, reports and analytics.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, fmtDate, fmtTime, img } = U;
    EDU.views = EDU.views || {};
    const D = () => EDU.data;
    const ui = () => EDU.ui;

    /* ---------------- Profile ---------------- */
    EDU.views.profile = {
        title: 'My Profile',
        render(c) {
            const u = c.user, s = c.role === 'student' ? c.student : null, t = c.teacher;
            const facts = s ? [['Student ID', s.id], ['Class', `${s.class} · Roll ${s.roll}`], ['Date of Birth', fmtDate(s.dob)], ['Gender', s.gender], ['Blood Group', s.bloodGroup], ['House', s.house], ['Parent / Guardian', s.parentName], ['Bus', `${s.busId} · ${s.area}`]]
                : t ? [['Teacher ID', t.id], ['Department', t.department], ['Designation', t.designation], ['Qualification', t.qualification], ['Experience', `${t.experience} years`], ['Classes', t.classes.join(', ')]]
                : c.role === 'parent' ? [['Parent ID', u.parentId], ['Children', (u.children || []).map((id) => D().student(id).name).join(', ')], ['Occupation', (EDU.db.find('parents', u.parentId) || {}).occupation || '—']]
                : [['Role', 'Administrator'], ['Title', u.title], ['Access', 'Full system access']];
            return `<section class="panel mb-24"><div class="profile-cover"></div><div class="profile-main">${U.avatar(u, 'xl')}<div class="grow" style="padding-bottom:6px"><h2 class="mb-0">${esc(u.name)}</h2><p class="mb-0">${esc(u.title || U.cap(c.role))} · ${esc(EDU.auth.email(u))}</p></div><span class="badge badge-success badge-dot" style="margin-bottom:10px">Active</span></div></section>
                <div class="dash-grid"><div class="col-5">${ui().panel('Details', `<div class="detail-list">${facts.map(([k, v]) => `<div><small>${k}</small><strong>${esc(v)}</strong></div>`).join('')}</div>`, { icon: 'fa-id-card' })}</div>
                <div class="col-7">${ui().panel('Edit Profile', `<form id="pf" class="form-grid" novalidate>
                    <div class="form-group"><label class="form-label" for="pfName">Full name <span class="req">*</span></label><input class="form-control" id="pfName" required data-rule="name" value="${esc(u.name)}"></div>
                    <div class="form-group"><label class="form-label" for="pfPhone">Phone <span class="req">*</span></label><input class="form-control" id="pfPhone" required data-rule="phone" value="${esc(u.phone || '')}"></div>
                    <div class="form-group span-2"><label class="form-label" for="pfEmail">Email</label><input class="form-control" id="pfEmail" type="email" value="${esc(EDU.auth.email(u))}" readonly></div>
                    <div class="form-group span-2"><label class="form-label" for="pfBio">About</label><textarea class="form-control" id="pfBio" rows="3" placeholder="A short bio…">${esc(u.bio || '')}</textarea></div>
                    <div class="span-2"><button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> Save changes</button></div></form>
                    <hr><h4>Change password</h4><form id="pw" class="form-grid" novalidate>
                    <div class="form-group"><label class="form-label" for="pwOld">Current password</label><input class="form-control" type="password" id="pwOld" required></div>
                    <div class="form-group"><label class="form-label" for="pwNew">New password</label><input class="form-control" type="password" id="pwNew" required data-rule="password"></div>
                    <div class="span-2"><button class="btn btn-soft" type="submit"><i class="fa-solid fa-key"></i> Update password</button></div></form>`, { icon: 'fa-user-pen' })}</div></div>`;
        },
        mount(el, c) {
            const pf = $('#pf', el), pw = $('#pw', el);
            EDU.validate.attach(pf); EDU.validate.attach(pw);
            pf.addEventListener('submit', async (e) => { e.preventDefault(); if (!EDU.validate.form(pf)) return; const b = pf.querySelector('[type=submit]'); b.classList.add('loading'); await EDU.api.update('users', c.user.id, { name: $('#pfName', el).value.trim(), phone: $('#pfPhone', el).value.trim(), bio: $('#pfBio', el).value.trim() }); b.classList.remove('loading'); EDU.toast.success('Profile updated', 'Your changes have been saved.'); });
            pw.addEventListener('submit', async (e) => { e.preventDefault(); if (!EDU.validate.form(pw)) return; if ($('#pwOld', el).value !== EDU.db.find('users', c.user.id).password) return EDU.toast.error('Incorrect password', 'Your current password is wrong.'); await EDU.api.update('users', c.user.id, { password: $('#pwNew', el).value }); pw.reset(); EDU.toast.success('Password updated'); });
        }
    };

    /* ---------------- Settings ---------------- */
    EDU.views.settings = {
        title: 'Settings',
        render(c) {
            const prefs = EDU.db.obj('settings').notifPrefs || {};
            const ann = EDU.db.obj('settings').announcements || [];
            return `${ui().pageHead('Settings', 'Personalise your portal experience.')}
                <div class="dash-grid"><div class="col-6">${ui().panel('Appearance', `<div class="radio-cards">${[['light', 'fa-sun', 'Light'], ['dark', 'fa-moon', 'Dark']].map(([v, i, l]) => `<div class="radio-card"><input type="radio" name="theme" id="th-${v}" value="${v}" ${EDU.theme.get() === v ? 'checked' : ''}><label for="th-${v}"><i class="fa-solid ${i}"></i>${l}</label></div>`).join('')}</div>
                    <div class="form-group mt-24"><label class="form-label" for="lang">Language</label><select class="form-control" id="lang"><option>English</option><option>हिन्दी (Hindi)</option><option>తెలుగు (Telugu)</option></select></div>`, { icon: 'fa-palette' })}
                    <div class="mt-24">${ui().panel('Notifications', `<div class="grid" style="gap:16px">${[['email', 'Email notifications'], ['sms', 'SMS alerts'], ['push', 'Push / in-app notifications'], ['digest', 'Weekly summary digest']].map(([k, l]) => `<label class="switch"><input type="checkbox" data-pref="${k}" ${prefs[k] ? 'checked' : ''}><span class="slider"></span>${l}</label>`).join('')}</div>`, { icon: 'fa-bell' })}</div></div>
                <div class="col-6">${c.role === 'admin' ? ui().panel('Announcement Bar (public website)', `<p class="small">Messages rotate in the top bar of every public page. Changes appear instantly — even in other open tabs.</p><div id="annList">${ann.map((a, i) => `<div class="flex gap-8 mb-8"><input class="form-control sm" data-ann="${i}" value="${esc(a)}" aria-label="Announcement ${i + 1}"><button class="btn-icon sm bordered" data-rm="${i}" aria-label="Remove"><i class="fa-solid fa-trash-can text-danger"></i></button></div>`).join('')}</div><div class="flex gap-8 mt-16"><button class="btn btn-soft btn-sm" id="annAdd"><i class="fa-solid fa-plus"></i> Add</button><button class="btn btn-primary btn-sm" id="annSave"><i class="fa-solid fa-floppy-disk"></i> Publish</button></div>`, { icon: 'fa-bullhorn' }) + '<div class="mt-24"></div>' : ''}
                ${ui().panel('Data & Privacy', `<p class="small">All demo data is stored in your browser's LocalStorage. Resetting restores the original sample records.</p><div class="flex gap-8 flex-wrap"><button class="btn btn-soft btn-sm" id="exportData"><i class="fa-solid fa-download"></i> Export my data</button><button class="btn btn-soft-danger btn-sm" id="resetData"><i class="fa-solid fa-rotate-left"></i> Reset demo data</button></div>`, { icon: 'fa-database' })}</div></div>`;
        },
        mount(el, c) {
            el.addEventListener('change', (e) => {
                if (e.target.name === 'theme') EDU.theme.set(e.target.value);
                if (e.target.dataset.pref) { const s = EDU.db.obj('settings'); s.notifPrefs = { ...s.notifPrefs, [e.target.dataset.pref]: e.target.checked }; EDU.store.set('settings', s); EDU.toast.success('Preference saved'); }
                if (e.target.id === 'lang') EDU.toast.info('Language', 'Translations are coming soon — English is shown for now.');
            });
            el.addEventListener('click', async (e) => {
                if (e.target.closest('#annAdd')) $('#annList', el).insertAdjacentHTML('beforeend', `<div class="flex gap-8 mb-8"><input class="form-control sm" data-ann placeholder="New announcement…"></div>`);
                const rm = e.target.closest('[data-rm]'); if (rm) rm.parentElement.remove();
                if (e.target.closest('#annSave')) { const s = EDU.db.obj('settings'); s.announcements = $$('[data-ann]', el).map((x) => x.value.trim()).filter(Boolean); EDU.store.set('settings', s); EDU.toast.success('Announcements published', 'Live on the public website.'); }
                if (e.target.closest('#exportData')) { const data = {}; EDU.store.keys().forEach((k) => { data[k] = EDU.store.get(k); }); U.download('educare-data.json', JSON.stringify(data, null, 2), 'application/json'); }
                if (e.target.closest('#resetData') && await EDU.modal.confirm({ title: 'Reset all demo data?', text: 'All changes (submissions, payments, messages…) will be lost and you will be signed out.', confirmText: 'Reset', danger: true })) { EDU.store.reset(); location.href = 'login.html'; }
            });
        }
    };

    /* ---------------- Subjects (student) & admin subjects ---------------- */
    EDU.views.subjects = {
        title: 'Subjects',
        render(c) {
            if (c.role === 'admin') {
                const rows = Object.entries(EDU.ref.SUBJECTS).filter(([k]) => k !== 'Clubs & Activities');
                return `${ui().pageHead('Subjects', 'Subjects offered across the curriculum.')}<div class="grid grid-4">${rows.map(([n, s]) => { const t = EDU.db.all('teachers').filter((x) => x.subjects.concat(x.department).join(' ').includes(n.split(' ')[0])); return `<div class="card card-hover feature-card"><span class="icon-box" style="background:${s.color}1f;color:${s.color}"><i class="fa-solid ${s.icon}"></i></span><h3>${esc(n)}</h3><p>${t.length} teacher${t.length === 1 ? '' : 's'} · ${EDU.db.all('classes').length} classes</p></div>`; }).join('')}</div>`;
            }
            const s = c.student;
            const subs = [...new Map(Object.values(D().timetable(s.class)).flat().filter((x) => x.teacher).map((x) => [x.subject, x])).values()];
            const ex = D().examNames(s.id);
            return `${ui().pageHead('My Subjects', `Grade ${s.class} · ${subs.length} subjects`)}
                <div class="grid grid-3">${subs.map((x, i) => { const sub = D().subject(x.subject), t = D().teacher(x.teacher); const r = D().resultsFor(s.id).find((y) => y.subject === x.subject && y.exam === ex[ex.length - 1]); const prog = 45 + ((i * 13) % 40);
                    return `<article class="card card-hover" style="border-top:4px solid ${sub.color}"><div class="card-body"><div class="flex items-center gap-12 mb-16"><span class="icon-box" style="background:${sub.color}1f;color:${sub.color}"><i class="fa-solid ${sub.icon}"></i></span><div><h3 class="mb-0" style="font-size:1.05rem">${esc(x.subject)}</h3><small class="text-muted">${esc(x.room)}</small></div>${r ? `<span class="badge badge-success" style="margin-left:auto">${r.grade}</span>` : ''}</div>
                    <div class="flex items-center gap-8 mb-16">${U.avatar(t, 'sm')}<small><strong>${esc(t.name)}</strong></small></div>
                    <div class="flex justify-between small mb-8"><span>Syllabus completed</span><strong>${prog}%</strong></div><div class="progress sm"><span data-width="${prog}"></span></div>
                    <div class="flex gap-8 mt-16"><a class="btn btn-xs btn-soft" href="messages.html?compose=${encodeURIComponent(t.email)}"><i class="fa-solid fa-envelope"></i> Ask teacher</a><a class="btn btn-xs btn-ghost" href="homework.html">Homework</a></div></div></article>`; }).join('')}</div>`;
        }
    };

    /* ---------------- Children (parent) ---------------- */
    EDU.views.children = {
        title: 'Children',
        render(c) {
            const kids = (c.user.children || []).map(D().student);
            return `${ui().pageHead('My Children', 'Overview of each child — switch the active child from the top bar.')}
                <div class="grid grid-2">${kids.map((k) => { const a = D().attendanceStats(k.id), ex = D().examNames(k.id), r = D().examSummary(k.id, ex[ex.length - 1]), f = D().fees(k.id); const cls = EDU.db.all('classes').find((x) => x.id === k.class);
                    return `<article class="card"><div class="card-body"><div class="flex items-center gap-16 mb-24">${U.avatar(k, 'xl')}<div><h3 class="mb-0">${esc(k.name)}</h3><p class="mb-0">Grade ${k.class} · Roll ${k.roll} · ${k.id}</p><small class="text-muted">Class teacher: ${esc(D().teacher(cls.classTeacher).name)}</small></div></div>
                    <div class="grid grid-2" style="gap:12px">${[['Attendance', a.pct + '%', 'green'], ['Overall', r ? r.pct + '%' : '—', 'purple'], ['GPA', r ? r.gpa : '—', 'gold'], ['Fees', f ? f.status : '—', f && f.status === 'Paid' ? 'green' : 'red']].map(([l, v, b]) => `<div class="card" style="padding:14px;display:flex;gap:12px;align-items:center"><span class="icon-box sm ${b}"><i class="fa-solid fa-chart-simple"></i></span><div><small class="text-muted">${l}</small><br><strong>${v}</strong></div></div>`).join('')}</div>
                    <div class="detail-list mt-24"><div><small>Date of birth</small><strong>${fmtDate(k.dob)}</strong></div><div><small>House</small><strong>${k.house}</strong></div><div><small>Bus</small><strong>${k.busId}</strong></div><div><small>Blood group</small><strong>${k.bloodGroup}</strong></div></div>
                    <button class="btn btn-primary btn-sm mt-24" data-view-child="${k.id}">${k.id === c.student.id ? '<i class="fa-solid fa-check"></i> Currently viewing' : 'Switch to ' + esc(k.name.split(' ')[0])}</button></div></article>`; }).join('')}</div>`;
        },
        mount(el, c) { el.addEventListener('click', (e) => { const b = e.target.closest('[data-view-child]'); if (b && b.dataset.viewChild !== c.student.id) { EDU.auth.update({ activeChild: b.dataset.viewChild }); c.student = D().student(b.dataset.viewChild); const cs = $('#childSwitch'); if (cs) cs.value = b.dataset.viewChild; EDU.toast.info('Switched', `Now viewing ${c.student.name}.`); c.rerender(); } }); }
    };

    /* ---------------- Generic CRUD table ---------------- */
    function crud({ title, sub, col, items, columns, fields, canEdit, idPrefix, searchFields, filterKey, filterOptions, rowActions = '' }) {
        return {
            title,
            render: () => `${ui().pageHead(title, sub, `<button class="btn btn-soft btn-sm" data-csv><i class="fa-solid fa-download"></i> Export CSV</button>${canEdit ? `<button class="btn btn-primary btn-sm" data-add><i class="fa-solid fa-plus"></i> Add</button>` : ''}`)}
                <section class="panel"><div class="panel-head"><div class="toolbar-group"><div class="search-field"><i class="fa-solid fa-magnifying-glass"></i><input type="search" data-q placeholder="Search…" aria-label="Search"></div>
                ${filterKey ? `<select class="form-control sm" data-f style="width:auto" aria-label="Filter"><option value="all">All</option>${filterOptions().map((o) => `<option>${esc(o)}</option>`).join('')}</select>` : ''}</div><span class="small text-muted"><strong data-total></strong> records</span></div>
                <div class="panel-body flush"><div class="table-wrap"><table class="table"><thead><tr>${columns.map((x) => `<th class="${x.sort ? 'sortable' : ''}" data-sort="${x.sort || ''}">${x.label}</th>`).join('')}<th class="text-right">Actions</th></tr></thead><tbody data-rows></tbody></table></div></div>
                <div class="card-foot"><div class="pagination w-100" data-pager style="padding:0"></div></div></section>`,
            mount(el, c) {
                let sortKey = null, dir = 1;
                const list = EDU.listing({
                    container: $('[data-rows]', el), items: () => { const l = items(c); return sortKey ? l.slice().sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, { numeric: true }) * dir) : l; },
                    pageSize: 10, pager: $('[data-pager]', el), count: $('[data-total]', el), searchInput: $('[data-q]', el), searchFields,
                    filters: filterKey ? [{ el: $('[data-f]', el), key: filterKey }] : [],
                    render: (r) => `<tr>${columns.map((x) => `<td>${x.render(r)}</td>`).join('')}<td><div class="actions"><button class="btn-icon sm" data-view="${r.id}" aria-label="View"><i class="fa-solid fa-eye"></i></button>${rowActions ? rowActions(r) : ''}${canEdit ? `<button class="btn-icon sm" data-edit="${r.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button><button class="btn-icon sm" data-del="${r.id}" aria-label="Delete"><i class="fa-solid fa-trash-can text-danger"></i></button>` : ''}</div></td></tr>`,
                    onEmpty: () => `<tr><td colspan="${columns.length + 1}">${U.empty('No records found')}</td></tr>`
                });
                $$('th.sortable', el).forEach((th) => th.addEventListener('click', () => { const k = th.dataset.sort; dir = sortKey === k ? -dir : 1; sortKey = k; $$('th.sortable', el).forEach((x) => x.classList.remove('sort-asc', 'sort-desc')); th.classList.add(dir > 0 ? 'sort-asc' : 'sort-desc'); list.draw(); }));
                const form = (r = {}) => `<form class="form-grid" data-form novalidate>${fields.map((f) => `<div class="form-group ${f.wide ? 'span-2' : ''}"><label class="form-label" for="f-${f.key}">${f.label}${f.required ? ' <span class="req">*</span>' : ''}</label>${f.options ? `<select class="form-control" id="f-${f.key}" ${f.required ? 'required' : ''}>${f.options().map((o) => `<option ${String(r[f.key]) === String(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input class="form-control" id="f-${f.key}" type="${f.type || 'text'}" ${f.required ? 'required' : ''} ${f.rule ? `data-rule="${f.rule}"` : ''} value="${esc(Array.isArray(r[f.key]) ? r[f.key].join(', ') : r[f.key] ?? f.default ?? '')}">`}</div>`).join('')}</form>`;
                const openForm = (r) => {
                    const m = EDU.modal.open({ title: r ? `Edit ${esc(r.name)}` : `Add ${title.replace(/s$/, '')}`, size: 'lg', body: form(r || {}), footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-save>${r ? 'Save changes' : 'Create'}</button>` });
                    const f = $('[data-form]', m.el); EDU.validate.attach(f);
                    m.el.querySelector('[data-save]').onclick = async (e) => {
                        if (!EDU.validate.form(f)) return;
                        e.currentTarget.classList.add('loading');
                        const data = {}; fields.forEach((x) => { let v = $('#f-' + x.key, m.el).value.trim(); if (x.list) v = v.split(',').map((y) => y.trim()).filter(Boolean); if (x.type === 'number') v = +v; data[x.key] = v; });
                        if (r) await EDU.api.update(col, r.id, data); else await EDU.api.create(col, { id: `${idPrefix}${Date.now().toString().slice(-5)}`, status: 'Active', ...(col === 'teachers' ? { photo: null, rating: 4.5, bio: '', subjects: [], classes: [] } : {}), ...(col === 'students' ? { attendance: 100, gpa: 0, feeStatus: 'Pending', roll: 99, house: 'Ganga' } : {}), ...data });
                        m.close(); EDU.toast.success(r ? 'Record updated' : 'Record created', data.name);
                    };
                };
                el.addEventListener('click', async (e) => {
                    if (e.target.closest('[data-add]')) openForm();
                    const ed = e.target.closest('[data-edit]'); if (ed) openForm(EDU.db.find(col, ed.dataset.edit));
                    const v = e.target.closest('[data-view]'); if (v) { const r = items(c).find((x) => x.id === v.dataset.view); EDU.modal.open({ title: esc(r.name || r.id), size: 'lg', body: `<div class="flex items-center gap-16 mb-24">${U.avatar(r, 'xl')}<div><h3 class="mb-0">${esc(r.name)}</h3><p class="mb-0">${esc(r.id)}</p></div></div><div class="detail-list">${Object.entries(r).filter(([k, x]) => !k.startsWith('_') && !['photo', 'bio', 'id', 'name'].includes(k) && typeof x !== 'object' || Array.isArray(x) && typeof x[0] !== 'object').map(([k, x]) => `<div><small>${esc(k.replace(/([A-Z])/g, ' $1'))}</small><strong>${esc(Array.isArray(x) ? x.join(', ') : x)}</strong></div>`).join('')}</div>`, footer: '<button class="btn btn-primary" data-close>Close</button>' }); }
                    const d = e.target.closest('[data-del]'); if (d) { const r = EDU.db.find(col, d.dataset.del); if (await EDU.modal.confirm({ title: `Delete ${r.name}?`, text: 'This record will be permanently removed.', confirmText: 'Delete', danger: true })) { EDU.db.remove(col, r.id); EDU.toast.success('Deleted', r.name); } }
                    if (e.target.closest('[data-csv]')) { const l = items(c); U.download(`${col}.csv`, U.toCSV([columns.map((x) => x.label), ...l.map((r) => columns.map((x) => x.csv ? x.csv(r) : ''))]), 'text/csv'); EDU.toast.success('CSV exported', `${l.length} records.`); }
                });
                c.on('db:' + col, () => list.draw());
            }
        };
    }
    const userCell = (r, subtxt) => `<div class="cell-user">${U.avatar(r, 'sm')}<div><strong>${esc(r.name)}</strong><small>${esc(subtxt)}</small></div></div>`;

    const studentsView = crud({
        title: 'Students', sub: 'Student records (demo dataset of 50 · school strength 2,548).', col: 'students', idPrefix: 'STU26', canEdit: true,
        items: (c) => c.role === 'teacher' ? EDU.db.all('students').filter((s) => D().teacherClasses(c.teacher).includes(s.class)) : EDU.db.all('students'),
        searchFields: ['name', 'id', 'class', 'parentName', 'email'], filterKey: 'class', filterOptions: () => [...new Set(EDU.db.all('students').map((s) => s.class))],
        columns: [
            { label: 'Student', sort: 'name', render: (r) => userCell(r, r.id), csv: (r) => r.name },
            { label: 'Class', sort: 'class', render: (r) => `<span class="badge badge-primary">${r.class}</span>`, csv: (r) => r.class },
            { label: 'Parent', render: (r) => `${esc(r.parentName)}<br><small class="text-muted">${esc(r.parentPhone)}</small>`, csv: (r) => r.parentName },
            { label: 'Attendance', sort: 'attendance', render: (r) => `<div class="flex items-center gap-8" style="min-width:120px"><div class="progress sm" style="flex:1"><span style="width:${r.attendance}%"></span></div>${r.attendance}%</div>`, csv: (r) => r.attendance },
            { label: 'GPA', sort: 'gpa', render: (r) => `<strong>${r.gpa}</strong>`, csv: (r) => r.gpa },
            { label: 'Fees', render: (r) => U.statusBadge(r.feeStatus), csv: (r) => r.feeStatus }
        ],
        fields: [{ key: 'name', label: 'Full name', required: true, rule: 'name' }, { key: 'class', label: 'Class', required: true, options: () => EDU.db.all('classes').map((x) => x.id) }, { key: 'gender', label: 'Gender', options: () => ['Male', 'Female', 'Other'] }, { key: 'dob', label: 'Date of birth', type: 'date', required: true }, { key: 'parentName', label: 'Parent name', required: true, rule: 'name' }, { key: 'parentPhone', label: 'Parent phone', required: true, rule: 'phone' }, { key: 'email', label: 'Email', type: 'email', required: true, wide: true }, { key: 'area', label: 'Area', default: 'Gachibowli' }, { key: 'busId', label: 'Bus', options: () => ['BUS-01', 'BUS-02', 'BUS-03', 'BUS-04', 'BUS-05', 'BUS-06'] }]
    });
    const teacherStudents = studentsView.mount;
    EDU.views.students = { ...studentsView, render: (c) => c.role === 'teacher' ? studentsView.render(c).replace(/<button class="btn btn-primary btn-sm" data-add>.*?<\/button>/, '') : studentsView.render(c), mount: teacherStudents };

    EDU.views.teachers = crud({
        title: 'Teachers', sub: 'Faculty records (16 demo profiles · 152 staff).', col: 'teachers', idPrefix: 'T', canEdit: true, items: () => EDU.db.all('teachers'),
        searchFields: ['name', 'department', 'designation', 'email', 'subjects'], filterKey: 'department', filterOptions: () => [...new Set(EDU.db.all('teachers').map((t) => t.department))],
        columns: [
            { label: 'Teacher', sort: 'name', render: (r) => userCell(r, r.email), csv: (r) => r.name },
            { label: 'Department', sort: 'department', render: (r) => esc(r.department), csv: (r) => r.department },
            { label: 'Designation', render: (r) => `<small>${esc(r.designation)}</small>`, csv: (r) => r.designation },
            { label: 'Experience', sort: 'experience', render: (r) => `${r.experience} yrs`, csv: (r) => r.experience },
            { label: 'Rating', sort: 'rating', render: (r) => `<span class="badge badge-warning"><i class="fa-solid fa-star"></i> ${r.rating}</span>`, csv: (r) => r.rating },
            { label: 'Status', render: (r) => U.statusBadge(r.status || 'Active'), csv: (r) => r.status }
        ],
        fields: [{ key: 'name', label: 'Full name', required: true, rule: 'name' }, { key: 'email', label: 'Email', type: 'email', required: true }, { key: 'department', label: 'Department', options: () => EDU.content.departments.map((d) => d.name) }, { key: 'designation', label: 'Designation', required: true }, { key: 'qualification', label: 'Qualification', required: true }, { key: 'experience', label: 'Experience (years)', type: 'number', required: true }, { key: 'phone', label: 'Phone', rule: 'phone' }, { key: 'subjects', label: 'Subjects (comma separated)', list: true, wide: true }]
    });

    EDU.views.parents = crud({
        title: 'Parents', sub: 'Parent & guardian directory.', col: 'parents', idPrefix: 'P', canEdit: false, items: () => EDU.db.all('parents'),
        searchFields: ['name', 'email', 'phone', 'occupation'],
        columns: [
            { label: 'Parent', sort: 'name', render: (r) => userCell(r, r.email), csv: (r) => r.name },
            { label: 'Phone', render: (r) => esc(r.phone), csv: (r) => r.phone },
            { label: 'Occupation', render: (r) => esc(r.occupation), csv: (r) => r.occupation },
            { label: 'Children', render: (r) => r.children.map((id) => { const s = D().student(id); return s ? `<span class="badge badge-primary" style="margin:2px">${esc(s.name.split(' ')[0])} · ${s.class}</span>` : ''; }).join(''), csv: (r) => r.children.join(' ') }
        ],
        fields: [],
        rowActions: (r) => `<a class="btn-icon sm" href="messages.html?compose=${encodeURIComponent(r.email)}" aria-label="Message"><i class="fa-solid fa-envelope"></i></a>`
    });

    /* ---------------- Admissions (admin) ---------------- */
    const STAGES = ['New', 'Under Review', 'Document Verification', 'Assessment Scheduled', 'Approved', 'Rejected'];
    EDU.views.admissions = {
        title: 'Admissions', roles: ['admin'],
        render: () => `${ui().pageHead('Admission Applications', 'Review applications submitted through the online admission form — new ones appear live.', '<a class="btn btn-soft btn-sm" href="apply.html" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open form</a>')}
            <div class="kpi-grid" id="adK"></div>
            <div class="toolbar"><div class="chip-group" id="adF">${['all', ...STAGES].map((s, i) => `<button class="chip${i ? '' : ' active'}" data-value="${s}">${s === 'all' ? 'All' : s}</button>`).join('')}</div><div class="search-field"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="adQ" placeholder="Search applicant…" aria-label="Search applications"></div></div>
            <section class="panel"><div class="panel-body flush"><div class="table-wrap"><table class="table"><thead><tr><th>Applicant</th><th>Grade</th><th>Parent</th><th>Submitted</th><th>Status</th><th class="text-right">Actions</th></tr></thead><tbody id="adRows"></tbody></table></div></div><div class="card-foot"><div class="pagination w-100" id="adP" style="padding:0"></div></div></section>`,
        mount(el, c) {
            const kp = () => { const l = EDU.db.all('admissions'); $('#adK', el).innerHTML = [['Total', l.length, 'fa-inbox', ''], ['New', l.filter((a) => a.status === 'New').length, 'fa-star', 'gold'], ['In Progress', l.filter((a) => ['Under Review', 'Document Verification', 'Assessment Scheduled'].includes(a.status)).length, 'fa-spinner', 'sky'], ['Approved', l.filter((a) => a.status === 'Approved').length, 'fa-circle-check', 'green']].map(([l2, v, i, b]) => ui().kpi({ label: l2, value: v, icon: i, box: b })).join(''); };
            kp();
            const list = EDU.listing({
                container: $('#adRows', el), items: () => EDU.db.all('admissions').map((a) => ({ ...a, name: a.student.name, grade: a.student.grade })).sort((a, b) => b.submitted.localeCompare(a.submitted)), pageSize: 10, pager: $('#adP', el),
                searchInput: $('#adQ', el), searchFields: ['name', 'id', 'grade'], filters: [{ el: $('#adF', el), key: 'status' }],
                render: (a) => `<tr><td><div class="cell-user">${U.avatar({ name: a.student.name })}<div><strong>${esc(a.student.name)}</strong><small>${a.id}</small></div></div></td><td>${esc(a.student.grade)}</td><td>${esc(a.parent.father)}<br><small class="text-muted">${esc(a.parent.phone)}</small></td><td>${U.timeAgo(a.submitted)}</td><td>${U.statusBadge(a.status)}</td><td><div class="actions"><button class="btn btn-xs btn-soft" data-open="${a.id}">Review</button></div></td></tr>`,
                onEmpty: () => `<tr><td colspan="6">${U.empty('No applications')}</td></tr>`
            });
            el.addEventListener('click', (e) => {
                const b = e.target.closest('[data-open]'); if (!b) return;
                const a = EDU.db.find('admissions', b.dataset.open);
                const block = (t, o) => `<div class="review-block"><header>${t}</header><dl>${Object.entries(o).map(([k, v]) => `<div><dt>${esc(k.replace(/([A-Z])/g, ' $1'))}</dt><dd>${esc(v || '—')}</dd></div>`).join('')}</dl></div>`;
                const m = EDU.modal.open({ title: `Application ${a.id}`, size: 'lg', body: `<div class="flex justify-between items-center mb-16 flex-wrap gap-12"><span>Submitted ${new Date(a.submitted).toLocaleString('en-IN')}</span>${U.statusBadge(a.status)}</div><div class="review-grid">${block('Student', a.student)}${block('Parents', a.parent)}${block('Address', a.address)}${block('Documents', a.documents)}</div>
                    <div class="form-group mt-24"><label class="form-label" for="adSt">Update status</label><select class="form-control" id="adSt">${STAGES.map((s) => `<option ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>`,
                    footer: '<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-primary" id="adSave">Update & notify parent</button>' });
                $('#adSave', m.el).onclick = () => { const st = $('#adSt', m.el).value; EDU.db.update('admissions', a.id, { status: st }); m.close(); EDU.toast.success('Status updated', `${a.student.name}: ${st}. Parent notified by email & SMS.`); };
            });
            c.on('db:admissions', (v) => { kp(); list.draw(); });
            c.on('remote-change', (k) => { if (k === 'admissions') EDU.toast.info('New application received', 'The list has been updated live.'); });
        }
    };

    /* ---------------- Classes ---------------- */
    EDU.views.classes = {
        title: 'Classes',
        render(c) {
            const list = EDU.db.all('classes').filter((x) => c.role !== 'teacher' || D().teacherClasses(c.teacher).includes(x.id));
            return `${ui().pageHead(c.role === 'teacher' ? 'My Classes' : 'Classes', `${list.length} ${c.role === 'teacher' ? 'classes you teach' : 'sections in the demo dataset (96 sections school-wide)'}.`)}
                <div class="grid grid-3">${list.map((cl) => { const st = D().studentsOf(cl.id); const r = EDU.db.all('results').filter((x) => x.class === cl.id && x.exam === 'Quarterly Examination'); const avg = r.length ? (r.reduce((a, x) => a + x.marks, 0) / r.length).toFixed(1) : '—'; const att = st.length ? (st.reduce((a, s) => a + s.attendance, 0) / st.length).toFixed(1) : '—';
                    return `<article class="card card-hover"><div class="card-body"><div class="flex justify-between items-center mb-16"><h3 class="mb-0">Grade ${cl.id}</h3><span class="badge badge-primary">${cl.room}</span></div>
                    <div class="flex items-center gap-12 mb-16">${U.avatar(D().teacher(cl.classTeacher), 'sm')}<small>Class teacher<br><strong>${esc(D().teacher(cl.classTeacher).name)}</strong></small></div>
                    <div class="grid grid-3" style="gap:8px;text-align:center">${[['Students', cl.strength], ['Attendance', att + '%'], ['Avg score', avg + '%']].map(([l, v]) => `<div style="padding:10px;border-radius:12px;background:var(--section-bg)"><strong>${v}</strong><br><small class="text-muted">${l}</small></div>`).join('')}</div>
                    <div class="avatar-stack mt-16">${st.slice(0, 6).map((s) => U.avatar(s, 'sm')).join('')}${st.length > 6 ? `<span class="avatar sm" style="background:var(--text-muted)">+${cl.strength - 6}</span>` : ''}</div>
                    <button class="btn btn-soft btn-sm btn-block mt-16" data-roster="${cl.id}"><i class="fa-solid fa-users"></i> View roster</button></div></article>`; }).join('')}</div>`;
        },
        mount(el) {
            el.addEventListener('click', (e) => { const b = e.target.closest('[data-roster]'); if (!b) return; const st = D().studentsOf(b.dataset.roster);
                EDU.modal.open({ title: `Class ${b.dataset.roster} roster`, size: 'lg', body: `<div class="table-wrap"><table class="table"><thead><tr><th>Roll</th><th>Student</th><th>Attendance</th><th>GPA</th></tr></thead><tbody>${st.map((s) => `<tr><td>${s.roll}</td><td>${userCell(s, s.id)}</td><td>${s.attendance}%</td><td>${s.gpa}</td></tr>`).join('')}</tbody></table></div>` }); });
        }
    };

    /* ---------------- Lesson plans (teacher) ---------------- */
    EDU.views['lesson-plans'] = {
        title: 'Lesson Plans', roles: ['teacher', 'admin'],
        render: (c) => `${ui().pageHead('Lesson Plans', 'Plan weekly lessons and track delivery.', '<button class="btn btn-primary" data-new><i class="fa-solid fa-plus"></i> New Plan</button>')}
            <div class="grid grid-3" id="lpGrid"></div>`,
        mount(el, c) {
            const draw = () => { const l = EDU.db.all('lessonPlans').filter((p) => c.role === 'admin' || p.teacher === c.teacher.id);
                $('#lpGrid', el).innerHTML = ['Planned', 'In Progress', 'Completed'].map((st) => `<section class="panel"><div class="panel-head"><h3>${st} <span class="badge">${l.filter((p) => p.status === st).length}</span></h3></div><div class="panel-body" style="display:grid;gap:12px">${l.filter((p) => p.status === st).map((p) => `<div class="card" style="padding:16px"><div class="flex justify-between mb-8"><span class="badge badge-primary">${p.class}</span><small class="text-muted">${p.week}</small></div><h5 class="mb-8">${esc(p.topic)}</h5><p class="small mb-8">${esc(p.objectives)}</p><small class="text-muted"><i class="fa-solid fa-book"></i> ${esc(p.resources)}</small>
                    ${st !== 'Completed' ? `<button class="btn btn-xs btn-soft mt-8" data-adv="${p.id}">Move to ${st === 'Planned' ? 'In Progress' : 'Completed'} <i class="fa-solid fa-arrow-right"></i></button>` : ''}</div>`).join('') || '<small class="text-muted">Nothing here.</small>'}</div></section>`).join(''); };
            draw();
            el.addEventListener('click', (e) => {
                const a = e.target.closest('[data-adv]');
                if (a) { const p = EDU.db.find('lessonPlans', a.dataset.adv); EDU.db.update('lessonPlans', p.id, { status: p.status === 'Planned' ? 'In Progress' : 'Completed' }); EDU.toast.success('Plan updated'); }
                if (e.target.closest('[data-new]')) {
                    const m = EDU.modal.open({ title: 'New Lesson Plan', body: `<form class="form-grid" id="lpF" novalidate><div class="form-group"><label class="form-label" for="lpC">Class</label><select class="form-control" id="lpC">${(c.teacher ? D().teacherClasses(c.teacher) : ['10-A']).map((x) => `<option>${x}</option>`).join('')}</select></div><div class="form-group"><label class="form-label" for="lpW">Week</label><input class="form-control" id="lpW" value="Week 16"></div><div class="form-group span-2"><label class="form-label" for="lpT">Topic <span class="req">*</span></label><input class="form-control" id="lpT" required></div><div class="form-group span-2"><label class="form-label" for="lpO">Objectives <span class="req">*</span></label><textarea class="form-control" id="lpO" required rows="3"></textarea></div><div class="form-group span-2"><label class="form-label" for="lpR">Resources</label><input class="form-control" id="lpR"></div></form>`, footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-s>Save</button>' });
                    EDU.validate.attach($('#lpF', m.el));
                    m.el.querySelector('[data-s]').onclick = () => { if (!EDU.validate.form($('#lpF', m.el))) return; EDU.db.insert('lessonPlans', { teacher: c.teacher ? c.teacher.id : 'T001', class: $('#lpC', m.el).value, subject: c.teacher ? c.teacher.department : 'Mathematics', week: $('#lpW', m.el).value, topic: $('#lpT', m.el).value, objectives: $('#lpO', m.el).value, resources: $('#lpR', m.el).value || '—', status: 'Planned' }); m.close(); EDU.toast.success('Lesson plan added'); };
                }
            });
            c.on('db:lessonPlans', draw);
        }
    };

    /* ---------------- Notices ---------------- */
    const CATS = ['Academic', 'Holiday', 'Exam', 'Parent Meeting', 'Event', 'Emergency'];
    const CAT_ICON = { Academic: ['fa-book-open', ''], Holiday: ['fa-umbrella-beach', 'purple'], Exam: ['fa-file-signature', 'red'], 'Parent Meeting': ['fa-people-arrows', 'teal'], Event: ['fa-calendar-check', 'gold'], Emergency: ['fa-triangle-exclamation', 'red'] };
    function openCreate(c) {
        const m = EDU.modal.open({ title: '<i class="fa-solid fa-bullhorn text-primary"></i> Publish Notice', size: 'lg', body: `<form id="ntF" class="form-grid" novalidate>
            <div class="form-group span-2"><label class="form-label" for="ntT">Title <span class="req">*</span></label><input class="form-control" id="ntT" required maxlength="100"></div>
            <div class="form-group"><label class="form-label" for="ntC">Category</label><select class="form-control" id="ntC">${CATS.map((x) => `<option>${x}</option>`).join('')}</select></div>
            <div class="form-group"><label class="form-label" for="ntP">Priority</label><select class="form-control" id="ntP"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
            <div class="form-group"><label class="form-label" for="ntA">Audience</label><select class="form-control" id="ntA"><option value="all">Everyone</option><option value="students">Students</option><option value="parents">Parents</option><option value="teachers">Teachers</option></select></div>
            <div class="form-group" style="justify-content:flex-end"><label class="switch"><input type="checkbox" id="ntPin"><span class="slider"></span>Pin to top</label></div>
            <div class="form-group span-2"><label class="form-label" for="ntD">Message <span class="req">*</span></label><textarea class="form-control" id="ntD" required rows="5" data-rule="min:20"></textarea></div></form>`,
            footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-s><i class="fa-solid fa-paper-plane"></i> Publish</button>' });
        EDU.validate.attach($('#ntF', m.el));
        m.el.querySelector('[data-s]').onclick = () => {
            if (!EDU.validate.form($('#ntF', m.el))) return;
            const n = { title: $('#ntT', m.el).value.trim(), category: $('#ntC', m.el).value, priority: $('#ntP', m.el).value, audience: $('#ntA', m.el).value, pinned: $('#ntPin', m.el).checked, date: U.rel(0), author: c.user.name, desc: $('#ntD', m.el).value.trim() };
            EDU.db.insert('notices', n);
            EDU.notify.push(n.audience === 'all' ? 'all' : 'role:' + n.audience.replace(/s$/, ''), `New announcement: ${n.title}`, 'notice', 'notices.html', { silent: true });
            m.close(); EDU.toast.success('Notice published', 'Delivered instantly to the selected audience.');
        };
    }
    EDU.noticesUI = { openCreate };
    EDU.views.notices = {
        title: 'Notice Board',
        render: (c) => `${ui().pageHead('Notice Board', 'Official school announcements.', ['admin', 'teacher'].includes(c.role) ? '<button class="btn btn-primary" data-new><i class="fa-solid fa-plus"></i> New Notice</button>' : '')}
            <div class="toolbar"><div class="chip-group" id="ntF2">${['all', ...CATS].map((x, i) => `<button class="chip${i ? '' : ' active'}" data-value="${x}">${x === 'all' ? 'All' : x}</button>`).join('')}</div><div class="search-field"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="ntQ" placeholder="Search notices…" aria-label="Search notices"></div></div>
            <div class="grid" id="ntList" style="gap:16px"></div><div class="pagination" id="ntPg"></div>`,
        mount(el, c) {
            const staff = ['admin', 'teacher'].includes(c.role);
            const list = EDU.listing({
                container: $('#ntList', el), pageSize: 8, pager: $('#ntPg', el), searchInput: $('#ntQ', el), searchFields: ['title', 'desc', 'category'], filters: [{ el: $('#ntF2', el), key: 'category' }],
                items: () => EDU.db.all('notices').filter((n) => staff || n.audience === 'all' || n.audience === c.role + 's').sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date)),
                render: (n) => { const [ic, bx] = CAT_ICON[n.category] || CAT_ICON.Academic; return `<article class="card" style="padding:22px;${n.pinned ? 'border-color:rgba(var(--primary-rgb),.4);' : ''}"><div class="flex gap-16"><span class="icon-box ${bx}"><i class="fa-solid ${ic}"></i></span><div class="grow">
                    <div class="flex gap-8 flex-wrap mb-8">${n.pinned ? '<span class="badge badge-primary"><i class="fa-solid fa-thumbtack"></i> Pinned</span>' : ''}${n.priority === 'High' ? '<span class="badge badge-danger"><i class="fa-solid fa-circle-exclamation"></i> Important</span>' : ''}<span class="badge">${esc(n.category)}</span><span class="badge badge-${n.priority === 'High' ? 'danger' : n.priority === 'Medium' ? 'warning' : 'info'}">${n.priority} priority</span></div>
                    <h4 class="mb-8">${esc(n.title)}</h4><p class="mb-8">${esc(n.desc)}</p><small class="text-muted"><i class="fa-regular fa-calendar"></i> ${fmtDate(n.date, { long: true })} · ${esc(n.author)} · For ${esc(n.audience)}</small></div>
                    ${staff ? `<div class="flex gap-4" style="align-self:flex-start"><button class="btn-icon sm" data-pin="${n.id}" aria-label="${n.pinned ? 'Unpin' : 'Pin'}" data-tooltip="${n.pinned ? 'Unpin' : 'Pin'}"><i class="fa-solid fa-thumbtack ${n.pinned ? 'text-primary' : ''}"></i></button><button class="btn-icon sm" data-del="${n.id}" aria-label="Delete"><i class="fa-solid fa-trash-can text-danger"></i></button></div>` : ''}</div></article>`; }
            });
            el.addEventListener('click', async (e) => {
                if (e.target.closest('[data-new]')) openCreate(c);
                const p = e.target.closest('[data-pin]'); if (p) { const n = EDU.db.find('notices', p.dataset.pin); EDU.db.update('notices', n.id, { pinned: !n.pinned }); EDU.toast.success(n.pinned ? 'Unpinned' : 'Pinned to top'); }
                const d = e.target.closest('[data-del]'); if (d && await EDU.modal.confirm({ title: 'Delete notice?', confirmText: 'Delete', danger: true })) { EDU.db.remove('notices', d.dataset.del); EDU.toast.success('Notice deleted'); }
            });
            c.on('db:notices', () => list.draw());
        }
    };

    /* ---------------- Online classes ---------------- */
    function todaysOnline(c) {
        const now = new Date();
        const base = now.getHours() * 60 + now.getMinutes();
        const subs = c.role === 'teacher' ? [['Mathematics', 'T001', '10-A'], ['Mathematics', 'T001', '9-B'], ['Mathematics', 'T001', '10-B'], ['Mathematics', 'T001', '9-A']]
            : c.student.class === '6-B' ? [['Science', 'T008'], ['English', 'T015'], ['Mathematics', 'T014'], ['Art', 'T010']] : [['Physics', 'T002'], ['Mathematics', 'T001'], ['Computer Science', 'T004'], ['English', 'T005']];
        const topics = ['Refraction through a glass slab', 'Arithmetic Progressions — sum of n terms', 'Python functions & recursion', 'Poetry analysis: "The Road Not Taken"'];
        return subs.map(([s, t, cls], i) => { const start = base - 20 + i * 75; const d = new Date(); d.setHours(0, start, 0, 0); return { subject: s, teacher: t, cls: cls || (c.student && c.student.class), topic: topics[i], start: d, end: new Date(d.getTime() + 45 * 6e4) }; });
    }
    EDU.views['online-classes'] = {
        title: 'Online Classes',
        render: () => `${ui().pageHead('Online Classes', 'Join live lessons and catch up with recordings.', '<span class="badge badge-success badge-dot">Status updates live</span>')}
            <div id="ocLive" class="mb-24"></div><div class="dash-grid"><div class="col-6">${ui().panel("Today's Classes", '<div id="ocToday" style="display:grid;gap:12px"></div>', { icon: 'fa-calendar-day' })}</div>
            <div class="col-6">${ui().panel('Upcoming This Week', `<ul class="list">${['Chemistry — Carbon compounds', 'Biology — Heredity', 'Social Studies — Nationalism in India', 'French — Les loisirs'].map((t, i) => `<li class="list-item">${ui().subjectChip(t.split(' — ')[0])}<div class="grow"><h5>${t}</h5><small>${fmtDate(U.rel(i + 1), { long: true })} · ${['9:00 AM', '11:00 AM', '2:00 PM', '10:00 AM'][i]}</small></div><button class="btn btn-xs btn-soft" data-remind>Remind me</button></li>`).join('')}</ul>`, { icon: 'fa-calendar-week' })}</div>
            <div class="col-12">${ui().panel('Recorded Classes', `<div class="grid grid-4">${[['Quadratic Equations — Full Revision', 'Mathematics', 'math', '52:14'], ['Light: Reflection Laws', 'Physics', 'scienceLab', '38:40'], ['Chemical Reactions Lab Demo', 'Chemistry', 'lab2', '24:05'], ['Python Lists & Dictionaries', 'Computer Science', 'coding', '46:30'], ['Essay Writing Masterclass', 'English', 'writing', '33:12'], ['Resources & Development', 'Social Studies', 'globe', '41:50'], ['Life Processes — Nutrition', 'Biology', 'microscope', '36:18'], ['French Pronunciation Drills', 'French', 'reading', '22:44']].map(([t, s, im, d]) => `<article class="card card-hover record-card" data-play="${esc(t)}" role="button" tabindex="0"><div class="card-img"><img src="${img(im)}" alt="" loading="lazy"><span class="play"><span><i class="fa-solid fa-play"></i></span></span><span class="dur">${d}</span></div><div class="card-body" style="padding:16px"><span class="badge badge-primary mb-8">${s}</span><h5 class="mb-0">${esc(t)}</h5></div></article>`).join('')}</div>`, { icon: 'fa-circle-play' })}</div></div>`,
        mount(el, c) {
            const draw = () => {
                const list = todaysOnline(c), now = Date.now();
                const live = list.find((x) => x.start <= now && x.end > now);
                const t = (x) => D().teacher(x.teacher);
                $('#ocLive', el).innerHTML = live ? `<div class="live-class-card"><div><span class="live-badge"><span class="live-dot"></span>LIVE NOW</span><h3>${esc(live.subject)} · ${esc(live.topic)}</h3><p>${esc(t(live).name)} · Class ${esc(live.cls)} · started ${Math.round((now - live.start) / 6e4)} min ago · ${28 + Math.floor(Math.random() * 10)} attending</p></div><button class="btn btn-danger btn-lg" data-join="${esc(live.subject)}"><i class="fa-solid fa-video"></i> ${c.role === 'teacher' ? 'Resume Class' : 'Join Class'}</button></div>` : U.empty('No live class right now', 'The next class will appear here when it starts.', 'fa-video-slash');
                $('#ocToday', el).innerHTML = list.map((x) => { const st = x.end <= now ? 'done' : x.start <= now ? 'live' : 'soon'; return `<div class="card class-tile">${ui().subjectChip(x.subject)}<div class="grow"><h4>${esc(x.subject)}</h4><small class="text-muted">${esc(t(x).name)} · ${x.start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small></div>${st === 'live' ? `<button class="btn btn-danger btn-sm" data-join="${esc(x.subject)}">Join</button>` : st === 'done' ? '<span class="badge">Ended · Recording</span>' : `<span class="badge badge-primary">Starts in ${Math.round((x.start - now) / 6e4)} min</span>`}</div>`; }).join('');
            };
            draw(); c.every(30000, draw);
            el.addEventListener('click', (e) => {
                if (e.target.closest('[data-remind]')) { e.target.closest('[data-remind]').outerHTML = '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Reminder set</span>'; EDU.toast.success('Reminder set', 'You will be notified 5 minutes before the class.'); }
                const p = e.target.closest('[data-play]'); if (p) EDU.modal.open({ title: `<i class="fa-solid fa-circle-play text-primary"></i> ${esc(p.dataset.play)}`, size: 'lg', body: `<div class="vc-stage"><img src="${p.querySelector('img').src}" alt=""><div class="vc-controls"><button aria-label="Play"><i class="fa-solid fa-play"></i></button><button aria-label="Captions"><i class="fa-solid fa-closed-captioning"></i></button><button aria-label="Fullscreen"><i class="fa-solid fa-expand"></i></button></div></div><p class="small mt-16">Demo player — in production this streams the class recording.</p>` });
                const j = e.target.closest('[data-join]');
                if (j) {
                    const m = EDU.modal.open({ title: `<span class="live-badge"><span class="live-dot"></span>LIVE</span> ${esc(j.dataset.join)}`, size: 'xl', body: `<div class="vc-room"><div class="vc-stage"><img src="${img('teacherBoard')}" alt="Teacher presenting"><div class="vc-self"><i class="fa-solid fa-user fa-2x"></i></div><div class="vc-controls"><button data-tg aria-label="Toggle microphone"><i class="fa-solid fa-microphone"></i></button><button data-tg aria-label="Toggle camera"><i class="fa-solid fa-video"></i></button><button aria-label="Raise hand" data-hand><i class="fa-solid fa-hand"></i></button><button class="off" data-close aria-label="Leave class"><i class="fa-solid fa-phone-slash"></i></button></div></div>
                        <div class="vc-chat"><div class="panel-head" style="padding:12px 14px"><h3 style="font-size:.9rem">Class chat</h3></div><div class="msgs" id="vcMsgs"><div><b>Teacher:</b> Welcome everyone! Please open page 212.</div><div><b>Diya:</b> Good morning ma'am 👋</div></div><form id="vcF"><input class="form-control sm" placeholder="Type a message…" aria-label="Chat message"><button class="btn btn-primary btn-sm" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button></form></div></div>` });
                    m.el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-tg]'); if (b) b.classList.toggle('off'); if (ev.target.closest('[data-hand]')) EDU.toast.info('Hand raised', 'The teacher has been notified.'); });
                    $('#vcF', m.el).addEventListener('submit', (ev) => { ev.preventDefault(); const i = ev.target.querySelector('input'); if (!i.value.trim()) return; $('#vcMsgs', m.el).insertAdjacentHTML('beforeend', `<div><b>You:</b> ${esc(i.value)}</div>`); i.value = ''; });
                }
            });
        }
    };

    /* ---------------- Reports (admin) ---------------- */
    EDU.views.reports = {
        title: 'Reports', roles: ['admin'],
        render: () => `${ui().pageHead('Reports', 'Generate and export operational reports.')}
            <div class="grid grid-3">${[['attendance', 'Attendance Report', 'fa-user-check', 'green', 'Daily class-wise attendance'], ['fees', 'Fee Collection Report', 'fa-wallet', 'gold', 'Dues & payments by student'], ['academic', 'Academic Report', 'fa-chart-line', 'purple', 'Results by class & subject'], ['admissions', 'Admissions Report', 'fa-user-plus', 'teal', 'Applications & status'], ['library', 'Library Report', 'fa-book', 'pink', 'Circulation & overdue books'], ['transport', 'Transport Report', 'fa-bus', 'sky', 'Fleet & route occupancy']].map(([k, t, i, b, d]) => `<article class="card card-hover feature-card"><span class="icon-box ${b}"><i class="fa-solid ${i}"></i></span><h3>${t}</h3><p>${d}</p><div class="flex gap-8 mt-16"><button class="btn btn-soft btn-sm" data-prev="${k}">Preview</button><button class="btn btn-primary btn-sm" data-csv="${k}"><i class="fa-solid fa-download"></i> CSV</button></div></article>`).join('')}</div>`,
        mount(el) {
            const rows = (k) => ({
                attendance: [['Class', 'Date', 'Present', 'Late', 'Absent'], ...EDU.db.all('attendanceLog').map((l) => { const v = Object.values(l.records); return [l.class, l.date, v.filter((x) => x === 'P').length, v.filter((x) => x === 'L').length, v.filter((x) => x === 'A').length]; })],
                fees: [['Student', 'Class', 'Status'], ...EDU.db.all('students').map((s) => [s.name, s.class, D().fees(s.id) ? D().fees(s.id).status : s.feeStatus])],
                academic: [['Student', 'Class', 'Exam', 'Subject', 'Marks', 'Grade'], ...EDU.db.all('results').map((r) => [D().student(r.studentId).name, r.class, r.exam, r.subject, r.marks, r.grade])],
                admissions: [['ID', 'Student', 'Grade', 'Status', 'Submitted'], ...EDU.db.all('admissions').map((a) => [a.id, a.student.name, a.student.grade, a.status, a.submitted.slice(0, 10)])],
                library: [['Book', 'Member', 'Issued', 'Due', 'Status'], ...EDU.db.all('loans').map((l) => [(EDU.db.find('books', l.bookId) || {}).title, l.memberId, l.issued, l.due, D().loanStatus(l)])],
                transport: [['Bus', 'Route', 'Driver', 'Students', 'Capacity'], ...EDU.db.all('buses').map((b) => [b.id, b.route, b.driver, b.students, b.capacity])]
            }[k]);
            el.addEventListener('click', (e) => {
                const c = e.target.closest('[data-csv]'); if (c) { U.download(`${c.dataset.csv}_report.csv`, U.toCSV(rows(c.dataset.csv)), 'text/csv'); EDU.toast.success('Report exported'); }
                const p = e.target.closest('[data-prev]'); if (p) { const r = rows(p.dataset.prev); EDU.modal.open({ title: 'Report preview', size: 'xl', body: `<p class="small">${r.length - 1} rows</p><div class="table-wrap"><table class="table"><thead><tr>${r[0].map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${r.slice(1, 16).map((x) => `<tr>${x.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` }); }
            });
        }
    };

    /* ---------------- Analytics (admin) ---------------- */
    EDU.views.analytics = {
        title: 'Analytics', roles: ['admin'],
        render: () => `${ui().pageHead('Analytics', 'Trends across academics, operations and engagement.')}
            <div class="dash-grid">${[['anG', 'Student Growth', 'col-6'], ['anA', 'Admissions Funnel', 'col-6'], ['anP', 'Exam Performance by Grade', 'col-4'], ['anL', 'Library Usage', 'col-4'], ['anT', 'Transport Usage (riders per route)', 'col-4'], ['anR', 'Department Ratings', 'col-6'], ['anF', 'Fee Collection Trend', 'col-6']].map(([id, t, cls]) => `<div class="${cls}">${ui().panel(t, `<div class="chart-box"><canvas id="${id}"></canvas></div>`, { icon: 'fa-chart-simple' })}</div>`).join('')}</div>`,
        mount(el) {
            const A = EDU.db.obj('analytics'), mk = (id, cfg) => EDU.charts.make($('#' + id, el), cfg);
            mk('anG', { type: 'line', data: { labels: A.studentGrowth.labels, datasets: [{ label: 'Students', data: A.studentGrowth.data }] }, options: { scales: { y: { beginAtZero: false } } } });
            mk('anA', { type: 'bar', data: { labels: A.admissions.labels, datasets: [{ label: 'Applications', data: A.admissions.applications }, { label: 'Enrolled', data: A.admissions.enrolled, color: '#159B78' }] } });
            mk('anP', { type: 'bar', data: { labels: A.performanceByGrade.labels, datasets: [{ label: 'Avg %', data: A.performanceByGrade.data, color: '#7356D8' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { min: 60 } } } });
            mk('anL', { type: 'line', data: { labels: A.libraryUsage.labels, datasets: [{ label: 'Issues', data: A.libraryUsage.data, color: '#EC4899' }] } });
            mk('anT', { type: 'doughnut', data: { labels: A.transportUsage.labels, datasets: [{ data: A.transportUsage.data }] }, options: { plugins: { legend: { position: 'bottom' } } } });
            mk('anR', { type: 'radar', data: { labels: A.teacherPerformance.labels, datasets: [{ label: 'Rating', data: A.teacherPerformance.data }] }, options: { scales: { r: { min: 4, max: 5 } } } });
            mk('anF', { type: 'line', data: { labels: A.feeCollection.labels, datasets: [{ label: 'Collected', data: A.feeCollection.collected, color: '#16A085' }, { label: 'Pending', data: A.feeCollection.pending, color: '#E74C3C', fill: false }] } });
        }
    };
})(window.EDU);
