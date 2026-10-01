/* ==========================================================================
   Homework & assignment engine (shared). EDU.work.view(type) builds a
   portal view for either "homework" or "assignments":
     - Students: filter by status, view details, upload & submit, feedback
     - Parents : read-only view of the selected child's work
     - Teachers: create work, review submissions, grade & give feedback
     - Admin   : overview of all classes
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, fmtDate } = U;
    EDU.views = EDU.views || {};
    const D = () => EDU.data;

    const CFG = {
        homework: { title: 'Homework', single: 'Homework', icon: 'fa-book', prefix: 'HW', marks: false, page: 'homework.html' },
        assignments: { title: 'Assignments', single: 'Assignment', icon: 'fa-file-pen', prefix: 'AS', marks: true, page: 'assignments.html' }
    };

    function card(item, cfg, c, sid) {
        const sub = D().subject(item.subject);
        const t = D().teacher(item.teacher);
        const status = sid ? D().workStatus(item, sid) : null;
        const s = sid ? (item.submissions || {})[sid] : null;
        const subs = Object.keys(item.submissions || {}).length;
        const strength = D().studentsOf(item.class).length;
        const due = U.diffDays(item.due);
        return `<article class="card work-card" style="--c:${sub.color}">
            <div class="top"><div><span class="subject"><i class="fa-solid ${sub.icon}"></i>${esc(item.subject)} · ${esc(item.class)}</span><h4 class="mt-8">${esc(item.title)}</h4></div>${status ? U.statusBadge(status) : `<span class="badge badge-info">${subs}/${strength} submitted</span>`}</div>
            <p class="clamp-2">${esc(item.description)}</p>
            <div class="meta"><span><i class="fa-solid fa-user"></i>${esc(t.name)}</span><span><i class="fa-regular fa-calendar-plus"></i>Assigned ${fmtDate(item.assigned, { short: true })}</span><span class="${due < 0 && status !== 'completed' && status !== 'submitted' ? 'text-danger' : due <= 1 ? 'text-warning' : ''}"><i class="fa-regular fa-calendar-check"></i>Due ${U.relLabel(item.due)}</span>${cfg.marks ? `<span><i class="fa-solid fa-star"></i>${item.maxMarks} marks</span>` : ''}</div>
            ${s && (s.feedback || s.grade) && status === 'completed' ? `<div class="feedback-box"><strong><i class="fa-solid fa-comment-dots"></i> ${cfg.marks ? `Marks: ${s.marks}/${item.maxMarks}` : `Grade: ${esc(s.grade)}`}</strong>${s.feedback ? ` — ${esc(s.feedback)}` : ''}</div>` : ''}
            <div class="foot"><small class="text-muted">${s ? `<i class="fa-solid fa-paperclip"></i> ${esc(s.file)} · ${fmtDate(s.date, { short: true })}` : `${item.id}`}</small>
                <div class="flex gap-8">
                    <button class="btn btn-xs btn-ghost" data-view-item="${item.id}">View</button>
                    ${c.role === 'student' && ['pending', 'overdue'].includes(status) ? `<button class="btn btn-xs btn-primary" data-submit="${item.id}"><i class="fa-solid fa-upload"></i> Submit</button>` : ''}
                    ${c.role === 'teacher' ? `<button class="btn btn-xs btn-primary" data-review="${item.id}"><i class="fa-solid fa-list-check"></i> Review</button>` : ''}
                </div></div></article>`;
    }

    function detailModal(item, cfg, c, sid) {
        const t = D().teacher(item.teacher);
        const s = sid ? (item.submissions || {})[sid] : null;
        const status = sid ? D().workStatus(item, sid) : null;
        EDU.modal.open({
            title: `<i class="fa-solid ${cfg.icon} text-primary"></i> ${esc(item.title)}`, size: 'lg',
            body: `<div class="flex gap-8 flex-wrap mb-16"><span class="badge badge-primary">${esc(item.subject)}</span><span class="badge">${esc(item.class)}</span>${status ? U.statusBadge(status) : ''}${cfg.marks ? `<span class="badge badge-purple">${item.maxMarks} marks</span>` : ''}</div>
                <p style="white-space:pre-line">${esc(item.description)}</p>
                <div class="detail-list mt-24"><div><small>Teacher</small><strong>${esc(t.name)}</strong></div><div><small>Assigned</small><strong>${fmtDate(item.assigned, { long: true })}</strong></div><div><small>Due date</small><strong>${fmtDate(item.due, { long: true })}</strong></div><div><small>Reference</small><strong>${item.id}</strong></div></div>
                ${(item.attachments || []).length ? `<div class="mt-16">${item.attachments.map((a) => `<span class="attachment"><i class="fa-solid fa-file-pdf"></i>${esc(a)}</span>`).join('')}</div>` : ''}
                ${s ? `<hr><h4>Your submission</h4><p class="mb-8"><i class="fa-solid fa-paperclip"></i> ${esc(s.file)} · submitted ${fmtDate(s.date)}</p>${s.note ? `<p class="small">Note: ${esc(s.note)}</p>` : ''}${s.feedback || (s.grade && s.grade !== 'graded') ? `<div class="feedback-box"><strong>Teacher feedback${cfg.marks && s.marks != null ? ` · ${s.marks}/${item.maxMarks}` : s.grade ? ` · Grade ${esc(s.grade)}` : ''}</strong><br>${esc(s.feedback || 'Well done!')}</div>` : '<div class="badge badge-info">Awaiting teacher review</div>'}` : ''}`,
            footer: `<button class="btn btn-ghost" data-close>Close</button>${c.role === 'student' && ['pending', 'overdue'].includes(status) ? `<button class="btn btn-primary" id="goSubmit"><i class="fa-solid fa-upload"></i> Submit now</button>` : ''}`,
            onOpen: (m, api) => { const b = $('#goSubmit', m); b && b.addEventListener('click', () => { api.close(); submitModal(item, cfg, c, sid); }); }
        });
    }

    function submitModal(item, cfg, c, sid) {
        const m = EDU.modal.open({
            title: `<i class="fa-solid fa-upload text-primary"></i> Submit ${cfg.single}`,
            body: `<p class="mb-16"><strong>${esc(item.title)}</strong><br><small class="text-muted">${esc(item.subject)} · due ${fmtDate(item.due)}${U.diffDays(item.due) < 0 ? ' · <span class="text-danger">late submission</span>' : ''}</small></p>
                <form id="subForm" novalidate>
                <div class="form-group mb-16"><div class="dropzone" id="subDrop"><input type="file" id="subFile" required data-max-mb="10" accept=".pdf,.doc,.docx,.jpg,.png,.zip,.py,.txt" aria-label="Upload your work" data-msg="Please attach your work"><i class="fa-solid fa-cloud-arrow-up"></i><p><strong>Drag & drop</strong> your file here or <span class="text-primary fw-600">browse</span><br><small class="text-muted">PDF, DOC, JPG, PNG, ZIP · max 10 MB</small></p><div class="file-name" id="subName" hidden></div></div></div>
                <div class="form-group"><label class="form-label" for="subNote">Note to teacher (optional)</label><textarea class="form-control" id="subNote" rows="3" placeholder="Anything your teacher should know?"></textarea></div>
                <div class="progress mt-16" id="upProg" hidden><span></span></div></form>`,
            footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="subGo"><i class="fa-solid fa-paper-plane"></i> Submit</button>'
        });
        const f = $('#subFile', m.el), drop = $('#subDrop', m.el);
        ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.add('dragover')));
        ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('dragover')));
        f.addEventListener('change', () => { const x = f.files[0]; $('#subName', m.el).hidden = !x; if (x) $('#subName', m.el).innerHTML = `<i class="fa-solid fa-circle-check"></i> ${esc(x.name)} (${Math.ceil(x.size / 1024)} KB)`; drop.classList.toggle('has-file', !!x); EDU.validate.check(f); });
        $('#subGo', m.el).addEventListener('click', async (e) => {
            if (!EDU.validate.form($('#subForm', m.el))) return;
            const btn = e.currentTarget; btn.classList.add('loading');
            const prog = $('#upProg', m.el); prog.hidden = false;
            for (let p = 0; p <= 100; p += 20) { prog.firstElementChild.style.width = p + '%'; await U.sleep(160); }
            const col = cfg === CFG.homework ? 'homework' : 'assignments';
            EDU.db.update(col, item.id, (it) => ({ ...it, submissions: { ...(it.submissions || {}), [sid]: { date: U.rel(0), file: f.files[0].name, note: $('#subNote', m.el).value.trim(), grade: null, marks: null, feedback: null } } }));
            EDU.notify.push('role:teacher', `${D().student(sid).name} submitted "${item.title}".`, 'homework', cfg.page, { silent: true });
            m.close();
            EDU.toast.success(`${cfg.single} submitted`, `Your teacher has been notified. Status: Submitted.`);
        });
    }

    function reviewModal(item, cfg, c) {
        const col = cfg === CFG.homework ? 'homework' : 'assignments';
        const students = D().studentsOf(item.class);
        const rows = () => { const it = EDU.db.find(col, item.id); return students.map((s) => { const sub = (it.submissions || {})[s.id]; return `<tr><td><div class="cell-user">${U.avatar(s, 'sm')}<div><strong>${esc(s.name)}</strong><small>${s.id}</small></div></div></td>
            <td>${sub ? `<span class="small"><i class="fa-solid fa-paperclip"></i> ${esc(sub.file)}</span><br><small class="text-muted">${fmtDate(sub.date, { short: true })}</small>` : `<span class="badge badge-${U.diffDays(item.due) < 0 ? 'danger' : 'warning'}">${U.diffDays(item.due) < 0 ? 'Missing' : 'Not yet'}</span>`}</td>
            <td>${sub ? (cfg.marks ? `<input class="form-control sm" type="number" min="0" max="${item.maxMarks}" data-mk="${s.id}" value="${sub.marks ?? ''}" style="width:80px" aria-label="Marks for ${esc(s.name)}">` : `<select class="form-control sm" data-gr="${s.id}" style="width:90px" aria-label="Grade for ${esc(s.name)}"><option value="">—</option>${['A+', 'A', 'B+', 'B', 'C', 'D'].map((g) => `<option ${sub.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select>`) : '—'}</td>
            <td>${sub ? `<input class="form-control sm" data-fb="${s.id}" value="${esc(sub.feedback || '')}" placeholder="Feedback…" aria-label="Feedback for ${esc(s.name)}">` : ''}</td></tr>`; }).join(''); };
        const m = EDU.modal.open({
            title: `<i class="fa-solid fa-list-check text-primary"></i> Review · ${esc(item.title)}`, size: 'xl',
            body: `<div class="flex gap-8 flex-wrap mb-16"><span class="badge badge-primary">${esc(item.class)}</span><span class="badge">Due ${fmtDate(item.due)}</span><span class="badge badge-info">${Object.keys(item.submissions || {}).length}/${students.length} submitted</span></div>
                <div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Submission</th><th>${cfg.marks ? `Marks /${item.maxMarks}` : 'Grade'}</th><th>Feedback</th></tr></thead><tbody id="rvRows">${rows()}</tbody></table></div>`,
            footer: '<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-soft" id="rvRemind"><i class="fa-solid fa-bell"></i> Remind pending</button><button class="btn btn-primary" id="rvSave"><i class="fa-solid fa-floppy-disk"></i> Save grades</button>'
        });
        $('#rvSave', m.el).addEventListener('click', async (e) => {
            e.currentTarget.classList.add('loading'); await U.sleep(600);
            let n = 0;
            EDU.db.update(col, item.id, (it) => {
                const subs = { ...(it.submissions || {}) };
                Object.keys(subs).forEach((sid) => {
                    const fb = $(`[data-fb="${sid}"]`, m.el); const mk = $(`[data-mk="${sid}"]`, m.el); const gr = $(`[data-gr="${sid}"]`, m.el);
                    const patch = { feedback: fb ? fb.value.trim() || null : subs[sid].feedback };
                    if (mk && mk.value !== '') { patch.marks = U.clamp(+mk.value, 0, item.maxMarks); patch.grade = 'graded'; }
                    if (gr && gr.value) patch.grade = gr.value;
                    if ((patch.marks != null || (patch.grade && patch.grade !== subs[sid].grade)) && !subs[sid].feedback && !subs[sid].marks) n++;
                    subs[sid] = { ...subs[sid], ...patch };
                    const u = EDU.db.all('users').find((x) => x.studentId === sid);
                    if (u && (patch.marks != null || gr && gr.value)) EDU.notify.push(u.id, `Your ${cfg.single.toLowerCase()} "${item.title}" was graded.`, 'result', cfg.page, { silent: true });
                });
                return { ...it, submissions: subs };
            });
            m.close();
            EDU.toast.success('Grades saved', 'Students can now see their feedback.');
        });
        $('#rvRemind', m.el).addEventListener('click', () => { EDU.notify.push('role:student', `Reminder: "${item.title}" (${item.subject}) is due ${U.relLabel(item.due).toLowerCase()}.`, 'homework', cfg.page, { silent: true }); EDU.toast.success('Reminder sent', 'Students with pending work were notified.'); });
    }

    function openCreate(type, c) {
        const cfg = CFG[type];
        const classes = c.role === 'teacher' ? D().teacherClasses(c.teacher) : EDU.db.all('classes').map((x) => x.id);
        const subject = c.role === 'teacher' ? (c.teacher.department === 'Science' ? 'Physics' : c.teacher.department) : 'Mathematics';
        const m = EDU.modal.open({
            title: `<i class="fa-solid fa-plus text-primary"></i> New ${cfg.single}`, size: 'lg',
            body: `<form id="newWork" class="form-grid" novalidate>
                <div class="form-group span-2"><label class="form-label" for="nwTitle">Title <span class="req">*</span></label><input class="form-control" id="nwTitle" required maxlength="100" placeholder="e.g. Arithmetic Progressions — Exercise 5.2"></div>
                <div class="form-group"><label class="form-label" for="nwClass">Class <span class="req">*</span></label><select class="form-control" id="nwClass" required>${classes.map((x) => `<option>${x}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label" for="nwSubject">Subject <span class="req">*</span></label><select class="form-control" id="nwSubject" required>${Object.keys(EDU.ref.SUBJECTS).filter((x) => x !== 'Clubs & Activities').map((x) => `<option ${x === subject ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label" for="nwDue">Due date <span class="req">*</span></label><input class="form-control" type="date" id="nwDue" required min="${U.rel(0)}" value="${U.rel(cfg.marks ? 7 : 2)}"></div>
                ${cfg.marks ? '<div class="form-group"><label class="form-label" for="nwMax">Maximum marks <span class="req">*</span></label><input class="form-control" type="number" id="nwMax" required min="5" max="100" value="25"></div>' : '<div class="form-group"><label class="form-label" for="nwType">Type</label><select class="form-control" id="nwType"><option>Written</option><option>Worksheet</option><option>Reading</option><option>Practical</option></select></div>'}
                <div class="form-group span-2"><label class="form-label" for="nwDesc">Instructions <span class="req">*</span></label><textarea class="form-control" id="nwDesc" required rows="5" data-rule="min:15" placeholder="Describe the task, expectations and submission format…"></textarea></div>
                <div class="form-group span-2"><div class="dropzone"><input type="file" id="nwFile" multiple aria-label="Attach reference files"><i class="fa-solid fa-paperclip"></i><p>Attach reference files (optional)</p></div></div>
            </form>`,
            footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="nwSave"><i class="fa-solid fa-paper-plane"></i> Publish ${cfg.single}</button>`
        });
        const form = $('#newWork', m.el);
        EDU.validate.attach(form);
        $('#nwSave', m.el).addEventListener('click', async (e) => {
            if (!EDU.validate.form(form)) return;
            e.currentTarget.classList.add('loading'); await U.sleep(700);
            const item = { id: `${cfg.prefix}-${Math.floor(500 + Math.random() * 400)}`, class: $('#nwClass', m.el).value, subject: $('#nwSubject', m.el).value, teacher: c.teacher ? c.teacher.id : 'T001', title: $('#nwTitle', m.el).value.trim(), description: $('#nwDesc', m.el).value.trim(), assigned: U.rel(0), due: $('#nwDue', m.el).value, submissions: {}, attachments: Array.from($('#nwFile', m.el).files).map((f) => f.name) };
            if (cfg.marks) item.maxMarks = +$('#nwMax', m.el).value;
            EDU.db.insert(type, item);
            EDU.notify.push('role:student', `New ${cfg.single.toLowerCase()} in ${item.subject}: "${item.title}" — due ${fmtDate(item.due)}.`, type === 'homework' ? 'homework' : 'assignment', cfg.page, { silent: true });
            EDU.notify.push('role:parent', `New ${cfg.single.toLowerCase()} for ${item.class}: "${item.title}".`, 'homework', cfg.page, { silent: true });
            m.close();
            EDU.toast.success(`${cfg.single} published`, `Students of ${item.class} and their parents were notified.`);
        });
    }

    function view(type) {
        const cfg = CFG[type];
        return {
            title: cfg.title,
            render(c) {
                const staff = c.role === 'teacher' || c.role === 'admin';
                const sub = staff ? (c.role === 'teacher' ? `Manage ${cfg.title.toLowerCase()} for ${D().teacherClasses(c.teacher).join(', ')}` : 'All classes') : `${esc(c.student.name)} · Grade ${c.student.class}`;
                return `${EDU.ui.pageHead(cfg.title, sub, staff ? `<button class="btn btn-primary" data-new><i class="fa-solid fa-plus"></i> New ${cfg.single}</button>` : '')}
                    <div class="kpi-grid" id="wKpis"></div>
                    <div class="toolbar"><div class="chip-group" id="wFilter" role="group" aria-label="Filter by status"></div>
                        <div class="toolbar-group"><div class="search-field"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="wSearch" placeholder="Search ${cfg.title.toLowerCase()}…" aria-label="Search"></div>
                        <select class="form-control sm" id="wSort" style="width:auto" aria-label="Sort"><option value="due">Sort: Due date</option><option value="new">Sort: Newest</option><option value="subject">Sort: Subject</option></select></div></div>
                    <div class="grid grid-2" id="wList" style="gap:20px"></div>
                    <div class="pagination" id="wPager"></div>`;
            },
            mount(el, c) {
                const staff = c.role === 'teacher' || c.role === 'admin';
                const sid = staff ? null : c.student.id;
                const items = () => {
                    let l = EDU.db.all(type);
                    if (c.role === 'teacher') l = l.filter((x) => x.teacher === c.teacher.id || D().teacherClasses(c.teacher).includes(x.class) && x.subject === 'Mathematics');
                    else if (c.role !== 'admin') l = l.filter((x) => x.class === c.student.class);
                    return l.map((x) => ({ ...x, _status: sid ? D().workStatus(x, sid) : (U.diffDays(x.due) < 0 ? 'closed' : 'open') }));
                };
                const statuses = sid ? ['all', 'pending', 'submitted', 'overdue', 'completed'] : ['all', 'open', 'closed'];
                const kpis = () => {
                    const l = items();
                    const cnt = (s) => l.filter((x) => x._status === s).length;
                    $('#wKpis', el).innerHTML = sid
                        ? [EDU.ui.kpi({ label: 'Pending', value: cnt('pending'), icon: 'fa-hourglass-half', box: 'gold' }), EDU.ui.kpi({ label: 'Submitted', value: cnt('submitted'), icon: 'fa-paper-plane', box: 'sky' }), EDU.ui.kpi({ label: 'Overdue', value: cnt('overdue'), icon: 'fa-triangle-exclamation', box: 'red' }), EDU.ui.kpi({ label: 'Completed', value: cnt('completed'), icon: 'fa-circle-check', box: 'green' })].join('')
                        : [EDU.ui.kpi({ label: 'Active', value: cnt('open'), icon: 'fa-hourglass-half', box: 'gold' }), EDU.ui.kpi({ label: 'Closed', value: cnt('closed'), icon: 'fa-lock', box: '' }), EDU.ui.kpi({ label: 'Submissions', value: l.reduce((a, x) => a + Object.keys(x.submissions || {}).length, 0), icon: 'fa-inbox', box: 'sky' }), EDU.ui.kpi({ label: 'To Review', value: l.reduce((a, x) => a + Object.values(x.submissions || {}).filter((s) => !s.feedback && s.marks == null && (!s.grade || s.grade === 'graded' && s.marks == null)).length, 0), icon: 'fa-list-check', box: 'purple' })].join('');
                    $('#wFilter', el).innerHTML = statuses.map((s, i) => `<button class="chip${i ? '' : ' active'}" data-value="${s}" aria-pressed="${!i}">${U.cap(s)} <span class="count">${s === 'all' ? l.length : cnt(s)}</span></button>`).join('');
                };
                kpis();
                let ctrl = EDU.listing({
                    container: $('#wList', el), items, pageSize: 8, pager: $('#wPager', el),
                    render: (x) => card(x, cfg, c, sid), searchInput: $('#wSearch', el), searchFields: ['title', 'subject', 'description', 'class'],
                    filters: [{ el: $('#wFilter', el), key: '_status' }], sortSelect: $('#wSort', el), defaultSort: 'due',
                    sorters: { due: (a, b) => (sid ? (['overdue', 'pending', 'submitted', 'completed'].indexOf(a._status) - ['overdue', 'pending', 'submitted', 'completed'].indexOf(b._status)) : 0) || a.due.localeCompare(b.due), new: (a, b) => b.assigned.localeCompare(a.assigned), subject: (a, b) => a.subject.localeCompare(b.subject) },
                    onEmpty: () => `<div style="grid-column:1/-1">${U.empty(`No ${cfg.title.toLowerCase()} found`, 'Try another filter.', cfg.icon)}</div>`
                });
                el.addEventListener('click', (e) => {
                    const find = (id) => EDU.db.find(type, id);
                    const v = e.target.closest('[data-view-item]'); if (v) return detailModal(find(v.dataset.viewItem), cfg, c, sid);
                    const s = e.target.closest('[data-submit]'); if (s) return submitModal(find(s.dataset.submit), cfg, c, sid);
                    const r = e.target.closest('[data-review]'); if (r) return reviewModal(find(r.dataset.review), cfg, c);
                    if (e.target.closest('[data-new]')) openCreate(type, c);
                });
                c.on('db:' + type, () => { const active = ($('#wFilter .chip.active', el) || {}).dataset; kpis(); if (active && active.value) { const b = $(`#wFilter [data-value="${active.value}"]`, el); if (b) { $$('#wFilter .chip', el).forEach((x) => x.classList.remove('active')); b.classList.add('active'); } } ctrl.draw(); });
            }
        };
    }

    EDU.work = { view, openCreate, CFG };
    EDU.views.homework = view('homework');
})(window.EDU);
