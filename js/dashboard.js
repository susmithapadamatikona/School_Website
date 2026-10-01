/* ==========================================================================
   Portal shell (sidebar, topbar, router) + shared data helpers + the four
   role dashboards (student, teacher, parent, admin).
   Views register themselves on EDU.views[key] = { title, render(ctx), mount(el, ctx) }.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, fmtDate, fmtTime, img } = U;
    EDU.views = EDU.views || {};

    /* ======================================================================
       Data helpers shared by all portal modules
       ====================================================================== */
    const data = {
        subject: (name) => EDU.ref.SUBJECTS[name] || { icon: 'fa-book', color: '#013431' },
        teacher: (id) => EDU.db.find('teachers', id) || { name: '—', photo: null },
        student: (id) => EDU.db.find('students', id),
        studentsOf: (cls) => EDU.db.all('students').filter((s) => s.class === cls).sort((a, b) => a.roll - b.roll),
        dayName: (d = new Date()) => U.DAYS[d.getDay()],

        attendanceStats(sid) {
            const recs = EDU.db.obj('attendance')[sid] || {};
            let P = 0, A = 0, L = 0, H = 0;
            Object.values(recs).forEach((v) => { if (v === 'P') P++; else if (v === 'A') A++; else if (v === 'L') L++; else if (v === 'H') H++; });
            const total = P + A + L;
            return { recs, total, present: P, absent: A, late: L, holidays: H, pct: total ? +(((P + L) / total) * 100).toFixed(1) : 0 };
        },
        monthlyAttendance(sid) {
            const recs = EDU.db.obj('attendance')[sid] || {};
            const months = {};
            Object.entries(recs).forEach(([d, v]) => {
                if (v === 'H') return;
                const k = d.slice(0, 7);
                months[k] = months[k] || { P: 0, A: 0, L: 0 };
                months[k][v]++;
            });
            return Object.entries(months).sort().map(([k, v]) => ({ key: k, label: U.MONTHS[+k.slice(5) - 1], ...v, pct: +(((v.P + v.L) / (v.P + v.A + v.L)) * 100).toFixed(1) }));
        },
        timetable: (cls) => EDU.db.obj('timetable')[cls] || {},
        teacherTimetable(tid) {
            const tt = EDU.db.obj('timetable');
            const out = {};
            EDU.ref.WEEKDAYS.forEach((day) => {
                out[day] = EDU.ref.TIMES.map((time, s) => {
                    if (s === 4) return { time, type: 'break', subject: 'Lunch Break' };
                    for (const [cls, week] of Object.entries(tt)) {
                        const slot = (week[day] || [])[s];
                        if (slot && slot.teacher === tid) return { ...slot, class: cls };
                    }
                    return { time, type: 'free', subject: 'Free Period' };
                });
            });
            return out;
        },
        todaySlots(ctx) {
            const day = data.dayName();
            const week = ctx.role === 'teacher' ? data.teacherTimetable(ctx.teacher.id) : data.timetable(ctx.student.class);
            return (week[day] || []).filter((s) => s.type !== 'free');
        },
        slotState(time) {
            const [h, m] = time.split(':').map(Number);
            const now = new Date(); const mins = now.getHours() * 60 + now.getMinutes(); const start = h * 60 + m;
            return mins >= start + 60 ? 'done' : mins >= start ? 'now' : 'next';
        },
        workStatus(item, sid) {
            const s = (item.submissions || {})[sid];
            if (s) return (s.grade && s.grade !== 'graded') || s.marks != null ? 'completed' : 'submitted';
            return U.diffDays(item.due) < 0 ? 'overdue' : 'pending';
        },
        homeworkFor: (cls) => EDU.db.all('homework').filter((h) => h.class === cls),
        assignmentsFor: (cls) => EDU.db.all('assignments').filter((h) => h.class === cls),
        examsFor: (cls) => EDU.db.all('exams').filter((e) => e.class === cls).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
        upcomingExams: (cls, days = 30) => data.examsFor(cls).filter((e) => { const d = U.diffDays(e.date); return d >= 0 && d <= days; }),
        resultsFor: (sid) => EDU.db.all('results').filter((r) => r.studentId === sid),
        examNames(sid) { const seen = []; data.resultsFor(sid).sort((a, b) => a.date.localeCompare(b.date)).forEach((r) => { if (!seen.includes(r.exam)) seen.push(r.exam); }); return seen; },
        examSummary(sid, exam) {
            const rows = data.resultsFor(sid).filter((r) => r.exam === exam);
            if (!rows.length) return null;
            const total = rows.reduce((a, r) => a + r.marks, 0), max = rows.reduce((a, r) => a + r.max, 0);
            const pct = +((total / max) * 100).toFixed(1);
            const gp = { A1: 10, A2: 9, B1: 8, B2: 7, C1: 6, C2: 5, D: 4, E: 0 };
            const gpa = +(rows.reduce((a, r) => a + (gp[r.grade] || 0), 0) / rows.length).toFixed(1);
            return { rows, total, max, pct, gpa, grade: data.gradeOf(pct) };
        },
        gradeOf: (p) => p >= 91 ? 'A1' : p >= 81 ? 'A2' : p >= 71 ? 'B1' : p >= 61 ? 'B2' : p >= 51 ? 'C1' : p >= 41 ? 'C2' : p >= 33 ? 'D' : 'E',
        classRank(sid, exam) {
            const s = data.student(sid);
            const peers = data.studentsOf(s.class).map((p) => ({ id: p.id, sum: data.examSummary(p.id, exam) })).filter((x) => x.sum);
            peers.sort((a, b) => b.sum.pct - a.sum.pct);
            const i = peers.findIndex((x) => x.id === sid);
            const strength = (EDU.db.all('classes').find((c) => c.id === s.class) || {}).strength || peers.length;
            return { rank: i < 0 ? '—' : i + 1, of: strength };
        },
        fees(sid) {
            const acc = EDU.db.obj('fees')[sid];
            if (!acc) return null;
            const items = acc.items.map((it) => ({ ...it, balance: it.amount - it.paid, status: it.paid >= it.amount ? 'Paid' : U.diffDays(it.due) < 0 ? 'Overdue' : it.paid > 0 ? 'Partial' : 'Pending' }));
            const total = items.reduce((a, i) => a + i.amount, 0), paid = items.reduce((a, i) => a + i.paid, 0);
            const open = items.filter((i) => i.balance > 0).sort((a, b) => a.due.localeCompare(b.due));
            const status = !open.length ? 'Paid' : open.some((i) => i.status === 'Overdue') ? 'Overdue' : 'Pending';
            return { ...acc, items, total, paid, pending: total - paid, nextDue: open[0] ? open[0].due : null, status };
        },
        loans: (member) => EDU.db.all('loans').filter((l) => l.memberId === member),
        loanStatus: (l) => l.returned ? 'Returned' : U.diffDays(l.due) < 0 ? 'Overdue' : U.diffDays(l.due) <= 2 ? 'Due Soon' : 'Issued',
        teacherClasses: (t) => (t.classes || []).filter((c) => EDU.db.all('classes').some((x) => x.id === c))
    };
    EDU.data = data;

    /* ======================================================================
       UI helpers
       ====================================================================== */
    const ui = {
        kpi: ({ label, value, icon, box = '', trend = '', spark, id = '', suffix = '' }) => `
            <div class="kpi" ${id ? `id="${id}"` : ''}>
                <div class="top"><span class="label">${label}</span><span class="icon-box sm ${box}"><i class="fa-solid ${icon}"></i></span></div>
                <div class="value" data-kpi-value>${value}${suffix ? `<small> ${suffix}</small>` : ''}</div>
                ${trend ? `<span class="trend">${trend}</span>` : ''}${spark || ''}</div>`,
        panel: (title, body, { icon = '', actions = '', cls = '', flush = false, sub = '' } = {}) => `
            <section class="panel ${cls}"><div class="panel-head"><h3>${icon ? `<i class="fa-solid ${icon}"></i>` : ''}${title}${sub ? ` <span class="sub">${sub}</span>` : ''}</h3>${actions}</div>
            <div class="panel-body${flush ? ' flush' : ''}">${body}</div></section>`,
        subjectChip: (name) => { const s = data.subject(name); return `<span class="icon-box sm" style="background:${s.color}1f;color:${s.color}"><i class="fa-solid ${s.icon}"></i></span>`; },
        pageHead: (title, sub, actions = '') => `<div class="page-head"><div><h2>${title}</h2><p>${sub}</p></div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`,
        schedule(slots) {
            if (!slots.length) return U.empty('No classes today', 'Enjoy your day off!', 'fa-mug-hot');
            return `<ul class="schedule-timeline">${slots.map((s) => {
                if (s.type === 'break') return `<li class="sched-item ${data.slotState(s.time)}"><time>${fmtTime(s.time)}</time><div><h5><i class="fa-solid fa-utensils text-muted"></i> Lunch Break</h5><small>Cafeteria</small></div><span></span></li>`;
                const st = data.slotState(s.time); const sub = data.subject(s.subject);
                return `<li class="sched-item ${st}"><time>${fmtTime(s.time)}</time><div><h5><i class="fa-solid ${sub.icon}" style="color:${sub.color}"></i> ${esc(s.subject)}${s.class ? ` · ${esc(s.class)}` : ''}</h5><small>${s.teacher ? esc(data.teacher(s.teacher).name) + ' · ' : ''}${esc(s.room || '')}</small></div>
                    ${st === 'now' ? '<span class="live-badge"><span class="live-dot"></span>NOW</span>' : st === 'done' ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<span class="badge">Upcoming</span>'}</li>`;
            }).join('')}</ul>`;
        },
        weekMini(week) {
            const days = EDU.ref.WEEKDAYS, today = data.dayName();
            return `<div class="table-wrap"><table class="table table-compact" style="min-width:760px"><thead><tr><th>Day</th>${EDU.ref.TIMES.map((t) => `<th>${fmtTime(t)}</th>`).join('')}</tr></thead><tbody>
                ${days.map((d) => `<tr ${d === today ? 'style="background:var(--tint-primary)"' : ''}><td><strong>${d.slice(0, 3)}</strong>${d === today ? ' <span class="badge badge-primary">Today</span>' : ''}</td>${(week[d] || []).map((s) => {
                    if (s.type === 'break') return '<td class="text-muted small">Lunch</td>';
                    if (s.type === 'free') return '<td class="text-muted small">—</td>';
                    const sub = data.subject(s.subject);
                    return `<td><span class="badge" style="background:${sub.color}1a;color:${sub.color}" title="${esc(s.subject)}${s.class ? ' · ' + s.class : ''}">${esc(s.subject.length > 12 ? s.subject.split(' ').map((w) => w[0]).join('') : s.subject)}${s.class ? ' · ' + s.class : ''}</span></td>`;
                }).join('')}</tr>`).join('')}</tbody></table></div>`;
        },
        noticeList(n = 4, role) {
            const list = EDU.db.all('notices').filter((x) => x.audience === 'all' || !role || x.audience === role + 's' || role === 'admin' || role === 'teacher').sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date)).slice(0, n);
            return `<ul class="list">${list.map((x) => `<li class="list-item"><span class="icon-box sm ${x.priority === 'High' ? 'red' : x.priority === 'Medium' ? 'gold' : 'sky'}"><i class="fa-solid ${x.pinned ? 'fa-thumbtack' : 'fa-bullhorn'}"></i></span>
                <div class="grow"><h5 class="truncate">${esc(x.title)}</h5><small>${fmtDate(x.date)} · ${esc(x.category)}</small></div>${x.priority === 'High' ? '<span class="badge badge-danger">Important</span>' : ''}</li>`).join('')}</ul>`;
        },
        eventList(n = 3) {
            const list = EDU.db.all('events').filter((e) => U.diffDays(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);
            return `<ul class="list">${list.map((e) => { const d = U.parse(e.date); return `<li class="list-item"><div style="width:48px;text-align:center;border-radius:12px;background:var(--tint-primary);padding:6px 0;flex-shrink:0"><strong style="display:block;font:800 1.1rem var(--font-head);color:var(--primary)">${d.getDate()}</strong><small style="color:var(--primary);font-weight:700;font-size:.66rem">${U.MONTHS[d.getMonth()].toUpperCase()}</small></div>
                <div class="grow"><h5 class="truncate"><a href="event-details.html?id=${e.id}" style="color:inherit">${esc(e.title)}</a></h5><small>${fmtTime(e.start)} · ${esc(e.location)}</small></div></li>`; }).join('')}</ul>`;
        },
        notifList(ctx, n = 5) {
            const list = EDU.notify.list(ctx.user).slice(0, n);
            return list.length ? list.map((x) => EDU.notify.item(x, ctx.user)).join('') : U.empty('No notifications', '', 'fa-bell-slash');
        }
    };
    EDU.ui = ui;

    /* ======================================================================
       Menus
       ====================================================================== */
    const PAGES = { attendance: 'attendance.html', timetable: 'timetable.html', homework: 'homework.html', assignments: 'assignments.html', exams: 'exams.html', results: 'results.html', fees: 'fees-dashboard.html', notices: 'notices.html', messages: 'messages.html', notifications: 'notifications.html', 'online-classes': 'online-classes.html', library: 'library-dashboard.html', transport: 'bus-tracking.html' };
    const I = (key, label, icon, group) => ({ key, label, icon, group });
    const MENUS = {
        student: [I('dashboard', 'Dashboard', 'fa-gauge-high', 'Main'), I('profile', 'My Profile', 'fa-user', 'Main'), I('attendance', 'Attendance', 'fa-user-check', 'Academics'), I('timetable', 'Timetable', 'fa-calendar-week', 'Academics'), I('homework', 'Homework', 'fa-book', 'Academics'), I('assignments', 'Assignments', 'fa-file-pen', 'Academics'), I('exams', 'Exams', 'fa-file-signature', 'Academics'), I('results', 'Results', 'fa-chart-line', 'Academics'), I('subjects', 'Subjects', 'fa-shapes', 'Academics'), I('online-classes', 'Online Classes', 'fa-video', 'Academics'), I('library', 'Library', 'fa-book-bookmark', 'Campus'), I('fees', 'Fees', 'fa-wallet', 'Campus'), I('events', 'Events', 'fa-calendar-days', 'Campus'), I('transport', 'Bus Tracking', 'fa-bus', 'Campus'), I('messages', 'Messages', 'fa-envelope', 'Communication'), I('notifications', 'Notifications', 'fa-bell', 'Communication'), I('notices', 'Notice Board', 'fa-bullhorn', 'Communication'), I('settings', 'Settings', 'fa-gear', 'Account')],
        teacher: [I('dashboard', 'Dashboard', 'fa-gauge-high', 'Main'), I('classes', 'My Classes', 'fa-chalkboard', 'Main'), I('students', 'Students', 'fa-user-graduate', 'Main'), I('attendance', 'Attendance', 'fa-user-check', 'Teaching'), I('timetable', 'Timetable', 'fa-calendar-week', 'Teaching'), I('homework', 'Homework', 'fa-book', 'Teaching'), I('assignments', 'Assignments', 'fa-file-pen', 'Teaching'), I('exams', 'Exams', 'fa-file-signature', 'Teaching'), I('results', 'Results', 'fa-chart-line', 'Teaching'), I('lesson-plans', 'Lesson Plans', 'fa-clipboard-list', 'Teaching'), I('online-classes', 'Online Classes', 'fa-video', 'Teaching'), I('messages', 'Messages', 'fa-envelope', 'Communication'), I('notifications', 'Notifications', 'fa-bell', 'Communication'), I('notices', 'Notice Board', 'fa-bullhorn', 'Communication'), I('events', 'Events', 'fa-calendar-days', 'Communication'), I('profile', 'Profile', 'fa-user', 'Account'), I('settings', 'Settings', 'fa-gear', 'Account')],
        parent: [I('dashboard', 'Dashboard', 'fa-gauge-high', 'Main'), I('children', 'Children', 'fa-children', 'Main'), I('attendance', 'Attendance', 'fa-user-check', 'Academics'), I('timetable', 'Timetable', 'fa-calendar-week', 'Academics'), I('homework', 'Homework', 'fa-book', 'Academics'), I('exams', 'Exams', 'fa-file-signature', 'Academics'), I('results', 'Results', 'fa-chart-line', 'Academics'), I('fees', 'Fees', 'fa-wallet', 'Campus'), I('events', 'Events', 'fa-calendar-days', 'Campus'), I('transport', 'Transport', 'fa-bus', 'Campus'), I('messages', 'Messages', 'fa-envelope', 'Communication'), I('notifications', 'Notifications', 'fa-bell', 'Communication'), I('notices', 'Notice Board', 'fa-bullhorn', 'Communication'), I('profile', 'Profile', 'fa-user', 'Account'), I('settings', 'Settings', 'fa-gear', 'Account')],
        admin: [I('dashboard', 'Dashboard', 'fa-gauge-high', 'Main'), I('analytics', 'Analytics', 'fa-chart-pie', 'Main'), I('reports', 'Reports', 'fa-file-export', 'Main'), I('students', 'Students', 'fa-user-graduate', 'People'), I('teachers', 'Teachers', 'fa-chalkboard-user', 'People'), I('parents', 'Parents', 'fa-people-roof', 'People'), I('admissions', 'Admissions', 'fa-user-plus', 'People'), I('classes', 'Classes', 'fa-chalkboard', 'Academics'), I('subjects', 'Subjects', 'fa-shapes', 'Academics'), I('attendance', 'Attendance', 'fa-user-check', 'Academics'), I('timetable', 'Timetable', 'fa-calendar-week', 'Academics'), I('exams', 'Exams', 'fa-file-signature', 'Academics'), I('results', 'Results', 'fa-chart-line', 'Academics'), I('homework', 'Homework', 'fa-book', 'Academics'), I('assignments', 'Assignments', 'fa-file-pen', 'Academics'), I('fees', 'Fees', 'fa-wallet', 'Operations'), I('events', 'Events', 'fa-calendar-days', 'Operations'), I('library', 'Library', 'fa-book-bookmark', 'Operations'), I('transport', 'Transportation', 'fa-bus', 'Operations'), I('notices', 'Notices', 'fa-bullhorn', 'Communication'), I('messages', 'Messages', 'fa-envelope', 'Communication'), I('notifications', 'Notifications', 'fa-bell', 'Communication'), I('settings', 'Settings', 'fa-gear', 'Account')]
    };
    const BOTTOM = { student: ['dashboard', 'timetable', 'homework', 'results'], teacher: ['dashboard', 'attendance', 'homework', 'students'], parent: ['dashboard', 'attendance', 'fees', 'transport'], admin: ['dashboard', 'students', 'admissions', 'fees'] };
    const ROLE_LABEL = { student: 'Student Portal', teacher: 'Teacher Portal', parent: 'Parent Portal', admin: 'Admin Console' };

    /* ======================================================================
       Shell
       ====================================================================== */
    let ctx = null, currentKey = null, cleanups = [];

    const hrefFor = (role, key) => (PAGES[key] || `${role}-dashboard.html#${key}`);
    const isDashPage = () => /-dashboard\.html$/.test(location.pathname) && !/fees-dashboard|library-dashboard/.test(location.pathname);

    function shell(user) {
        const role = user.role;
        const menu = MENUS[role];
        const groups = [...new Set(menu.map((m) => m.group))];
        const parent = role === 'parent';
        const kids = parent ? (user.children || []).map(data.student).filter(Boolean) : [];
        return `
        <a class="skip-link" href="#view">Skip to content</a>
        <div class="portal">
            <aside class="sidebar" id="sidebar" aria-label="${ROLE_LABEL[role]} navigation">
                <div class="sidebar-head">
                    <a class="logo" href="index.html" aria-label="Stackly home"><img class="logo-img logo-img-dark" src="assets/images/stackly-logo-dark.webp" alt="Stackly" width="320" height="132"><img class="logo-img logo-img-light" src="assets/images/stackly-logo-light.webp" alt="" aria-hidden="true" width="320" height="132"><small class="logo-role">${ROLE_LABEL[role]}</small></a>
                    <button class="btn-icon sidebar-close" aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="sidebar-role">${U.avatar(user)}<div><strong>${esc(user.name)}</strong><small>${esc(role === 'student' ? `Grade ${ctx.student.class} · ${ctx.student.id}` : user.title || U.cap(role))}</small><small class="sidebar-email" title="${esc(EDU.auth.email(user))}"><i class="fa-regular fa-envelope"></i> ${esc(EDU.auth.email(user))}</small></div></div>
                <nav class="sidebar-nav">
                    ${groups.map((g) => `<div class="side-label">${g}</div>${menu.filter((m) => m.group === g).map((m) => `<a class="side-link" data-key="${m.key}" href="${hrefFor(role, m.key)}"><i class="fa-solid ${m.icon}"></i><span>${m.label}</span>${m.key === 'messages' ? '<span class="side-count" data-msg-count></span>' : m.key === 'notifications' ? '<span class="side-count" data-notif-count></span>' : ''}</a>`).join('')}`).join('')}
                    <a class="side-link" href="index.html"><i class="fa-solid fa-globe"></i><span>Public Website</span></a>
                    <button class="side-link logout w-100" data-logout><i class="fa-solid fa-right-from-bracket"></i><span>Logout</span></button>
                </nav>
                <div class="sidebar-foot"><div class="sidebar-promo"><strong><i class="fa-solid fa-headset"></i> Need help?</strong>IT helpdesk: ext. 204 · support@educare.edu</div></div>
            </aside>
            <div class="sidebar-overlay"></div>
            <div class="portal-main">
                <header class="topbar">
                    <button class="btn-icon bordered topbar-toggle" aria-label="Open navigation" aria-controls="sidebar"><i class="fa-solid fa-bars"></i></button>
                    <div class="topbar-title"><small>${ROLE_LABEL[role]}</small><h1 id="viewTitle">Dashboard</h1></div>
                    <div class="search-field topbar-search"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="portalSearch" placeholder="Jump to… (e.g. results, fees)" aria-label="Search portal sections" list="portalSections"><datalist id="portalSections">${menu.map((m) => `<option value="${m.label}">`).join('')}</datalist></div>
                    <div class="topbar-actions">
                        ${parent && kids.length > 1 ? `<div class="child-switch"><label for="childSwitch" class="sr-only">Select child</label><select class="form-control" id="childSwitch">${kids.map((k) => `<option value="${k.id}" ${k.id === ctx.student.id ? 'selected' : ''}>${esc(k.name.split(' ')[0])} · ${esc(k.class)}</option>`).join('')}</select></div>` : ''}
                        <span class="live-clock" aria-live="off"><i class="fa-regular fa-clock"></i><span id="liveClock"></span></span>
                        <button class="btn-icon theme-toggle" data-theme-toggle aria-label="Toggle dark mode"><i class="fa-solid fa-moon"></i><i class="fa-solid fa-sun"></i></button>
                        <a class="btn-icon" href="messages.html" aria-label="Messages"><i class="fa-regular fa-envelope"></i><span class="count" data-msg-count></span></a>
                        <div class="dropdown" id="bellWrap"></div>
                        <div class="dropdown" id="profileWrap">
                            <button class="profile-btn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">${U.avatar(user, 'sm')}<span class="meta"><strong>${esc(user.name.split(' ')[0])}</strong><small>${role}</small></span><i class="fa-solid fa-chevron-down small text-muted"></i></button>
                            <div class="dropdown-panel" role="menu">
                                <div class="profile-panel-head">${U.avatar(user)}<div><strong>${esc(user.name)}</strong><small>${esc(EDU.auth.email(user))}</small></div></div>
                                <div style="padding:6px 0">
                                    <a class="dropdown-item" href="${hrefFor(role, 'profile')}"><i class="fa-regular fa-user"></i> My Profile</a>
                                    <a class="dropdown-item" href="${hrefFor(role, 'settings')}"><i class="fa-solid fa-gear"></i> Settings</a>
                                    <a class="dropdown-item" href="messages.html"><i class="fa-regular fa-envelope"></i> Messages</a>
                                    <a class="dropdown-item" href="index.html"><i class="fa-solid fa-globe"></i> Public Website</a>
                                    <div class="dropdown-divider"></div>
                                    <button class="dropdown-item text-danger" data-logout><i class="fa-solid fa-right-from-bracket text-danger"></i> Sign out</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <main class="portal-content" id="main"><div class="view" id="view" tabindex="-1"></div></main>
            </div>
        </div>
        <nav class="bottom-nav" aria-label="Quick navigation">
            ${BOTTOM[role].map((k) => { const m = menu.find((x) => x.key === k); return `<a href="${hrefFor(role, k)}" data-key="${k}"><i class="fa-solid ${m.icon}"></i>${m.label.replace('My ', '')}</a>`; }).join('')}
            <button data-more><i class="fa-solid fa-grip"></i>More</button>
        </nav>`;
    }

    function closeDropdowns() { $$('.topbar .dropdown.open').forEach((d) => { d.classList.remove('open'); const b = d.querySelector('[aria-expanded]'); b && b.setAttribute('aria-expanded', 'false'); }); }

    function bindShell() {
        const sb = $('#sidebar'), ov = $('.sidebar-overlay');
        const setSb = (open) => { sb.classList.toggle('open', open); ov.classList.toggle('open', open); document.body.classList.toggle('no-scroll', open && window.innerWidth < 1180); };
        $('.topbar-toggle').addEventListener('click', () => setSb(true));
        $('.sidebar-close').addEventListener('click', () => setSb(false));
        ov.addEventListener('click', () => setSb(false));
        $('[data-more]').addEventListener('click', () => setSb(true));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setSb(false); closeDropdowns(); } });

        const pw = $('#profileWrap');
        pw.querySelector('.profile-btn').addEventListener('click', (e) => { e.stopPropagation(); const open = !pw.classList.contains('open'); closeDropdowns(); pw.classList.toggle('open', open); e.currentTarget.setAttribute('aria-expanded', String(open)); });
        document.addEventListener('click', (e) => { if (!e.target.closest('.topbar .dropdown')) closeDropdowns(); });
        document.addEventListener('click', async (e) => {
            if (!e.target.closest('[data-logout]')) return;
            if (await EDU.modal.confirm({ title: 'Sign out?', text: 'You will need to sign in again to access the portal.', confirmText: 'Sign out', icon: 'fa-right-from-bracket' })) EDU.auth.logout();
        });

        // Hash links inside the same dashboard switch view without reload
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href]');
            if (!a) return;
            const url = new URL(a.getAttribute('href'), location.href);
            if (url.pathname === location.pathname && url.hash) { e.preventDefault(); history.pushState(null, '', url.hash); route(); setSb(false); }
        }, true);
        window.addEventListener('popstate', route);
        window.addEventListener('hashchange', route);

        const cs = $('#childSwitch');
        cs && cs.addEventListener('change', () => { EDU.auth.update({ activeChild: cs.value }); ctx.student = data.student(cs.value); EDU.toast.info('Switched child', `Now viewing ${ctx.student.name}'s records.`); route(true); });

        const ps = $('#portalSearch');
        ps.addEventListener('change', () => {
            const m = MENUS[ctx.role].find((x) => x.label.toLowerCase() === ps.value.trim().toLowerCase() || x.key.includes(ps.value.trim().toLowerCase()));
            if (m) location.href = hrefFor(ctx.role, m.key); else EDU.toast.warning('No section found', `Try one of: ${MENUS[ctx.role].slice(0, 4).map((x) => x.label).join(', ')}…`);
        });

        EDU.realtime.subscribe('clock', (d) => { const c = $('#liveClock'); if (c) c.textContent = d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }); });
        const msgCount = () => { const n = EDU.messages.unread(ctx.user); $$('[data-msg-count]').forEach((c) => { c.textContent = n || ''; c.dataset.count = n; }); };
        EDU.bus.on('db:messages', msgCount); msgCount();
        EDU.notify.mountBell($('#bellWrap'));
        EDU.bus.on('theme', () => route(true));
        EDU.bus.on('remote-change', (key) => { if (['session', 'users'].includes(key)) return; });
    }

    function route(force) {
        const key = (isDashPage() && location.hash.slice(1)) || document.body.dataset.view || 'dashboard';
        const viewKey = key === 'dashboard' ? `dashboard-${ctx.role}` : key;
        if (!force && viewKey === currentKey) return;
        const view = EDU.views[viewKey];
        const el = $('#view');
        cleanups.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
        cleanups = [];
        EDU.charts && EDU.charts.destroyAll();
        currentKey = viewKey;
        const menuItem = MENUS[ctx.role].find((m) => m.key === key);
        $$('.side-link[data-key], .bottom-nav [data-key]').forEach((a) => { const on = a.dataset.key === key; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
        if (!view || (view.roles && !view.roles.includes(ctx.role))) {
            el.innerHTML = `<div class="panel"><div class="panel-body">${U.empty('Section unavailable', 'This section is not available for your role.', 'fa-lock')}<div class="text-center"><a class="btn btn-primary" href="${EDU.auth.DASH[ctx.role]}">Back to dashboard</a></div></div></div>`;
            return;
        }
        const title = (menuItem && menuItem.label) || view.title;
        $('#viewTitle').textContent = title;
        document.title = `${title} | ${ROLE_LABEL[ctx.role]} · EDUCARE`;
        // Skeleton while "fetching"
        el.innerHTML = `<div class="kpi-grid">${'<div class="skeleton" style="height:120px;border-radius:20px"></div>'.repeat(4)}</div><div class="dash-grid"><div class="col-8 skeleton" style="height:320px;border-radius:20px"></div><div class="col-4 skeleton" style="height:320px;border-radius:20px"></div></div>`;
        const token = currentKey;
        setTimeout(() => {
            if (token !== currentKey) return;
            try {
                el.innerHTML = view.render(ctx);
                view.mount && view.mount(el, ctx);
            } catch (err) {
                console.error(err);
                el.innerHTML = `<div class="panel"><div class="panel-body"><div class="empty-state error"><div class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><h4>Something went wrong</h4><p>${esc(err.message)}</p><button class="btn btn-primary" onclick="location.reload()">Reload</button></div></div></div>`;
            }
            el.focus({ preventScroll: true });
            window.scrollTo({ top: 0 });
        }, force === true ? 0 : 260);
    }

    function makeCtx(user) {
        const s = EDU.auth.session() || {};
        const c = {
            user, role: user.role, session: s,
            student: user.role === 'student' ? data.student(user.studentId) : user.role === 'parent' ? data.student(s.activeChild || (user.children || [])[0]) : null,
            teacher: user.role === 'teacher' ? data.teacher(user.teacherId) : null,
            on(evt, fn) { const off = EDU.bus.on(evt, fn); cleanups.push(off); return off; },
            every(ms, fn) { const t = setInterval(fn, ms); cleanups.push(() => clearInterval(t)); return t; },
            sub(channel, fn) { const off = EDU.realtime.subscribe(channel, fn); cleanups.push(off); return off; },
            rerender: () => route(true),
            go: (key) => { location.href = hrefFor(user.role, key); }
        };
        return c;
    }

    EDU.portal = {
        MENUS, PAGES, hrefFor, closeDropdowns,
        get ctx() { return ctx; },
        init() {
            const page = location.pathname.split('/').pop();
            const roleOfPage = (page.match(/^(student|teacher|parent|admin)-dashboard/) || [])[1];
            const user = EDU.auth.require(roleOfPage ? [roleOfPage] : null);
            if (!user) return;
            ctx = makeCtx(user);
            document.getElementById('app').innerHTML = shell(user);
            bindShell();
            route(true);
            EDU.notify.startStream();
            if (EDU.transport && EDU.transport.startSim) EDU.transport.startSim();
        }
    };

    /* ======================================================================
       Dashboards
       ====================================================================== */
    const bar = (label, pct, cls = '') => `<div class="mb-16"><div class="flex justify-between small mb-8"><span>${label}</span><strong>${pct}%</strong></div><div class="progress ${cls}"><span data-width="${pct}"></span></div></div>`;

    /* ---------- STUDENT ---------- */
    EDU.views['dashboard-student'] = {
        title: 'Dashboard',
        render(c) {
            const s = c.student, att = data.attendanceStats(s.id);
            const hw = data.homeworkFor(s.class), asg = data.assignmentsFor(s.class);
            const pending = [...hw, ...asg].filter((x) => ['pending', 'overdue'].includes(data.workStatus(x, s.id)));
            const exams = data.upcomingExams(s.class, 21);
            const exNames = data.examNames(s.id);
            const last = data.examSummary(s.id, exNames[exNames.length - 1]);
            const fee = data.fees(s.id);
            const books = data.loans(s.id).filter((l) => !l.returned);
            const slots = data.todaySlots(c);
            const next = slots.find((x) => x.type !== 'break' && data.slotState(x.time) !== 'done');
            return `
            <div class="welcome-banner">
                <div><h2>${U.greet()}, ${esc(s.name.split(' ')[0])}! 👋</h2>
                    <p>${next ? `Your next class is <strong style="color:#fff">${esc(next.subject)}</strong> at ${fmtTime(next.time)} in ${esc(next.room)}.` : 'You have no more classes today. Great job!'} ${pending.length ? `You have ${pending.length} pending tasks.` : ''}</p>
                    <div class="wb-chips"><span class="wb-chip"><i class="fa-solid fa-id-badge"></i> ${s.id}</span><span class="wb-chip"><i class="fa-solid fa-school"></i> Grade ${s.class} · Roll ${s.roll}</span><span class="wb-chip"><i class="fa-solid fa-flag"></i> ${s.house} House</span><span class="wb-chip"><i class="fa-regular fa-calendar"></i> ${fmtDate(U.rel(0), { long: true })}</span></div></div>
                <div class="wb-illus"><i class="fa-solid fa-user-graduate"></i></div>
            </div>
            <div class="kpi-grid cols-3">
                ${ui.kpi({ label: 'Attendance', value: att.pct, suffix: '%', icon: 'fa-user-check', box: 'green', trend: `<b>${att.present}</b> present · ${att.absent} absent`, spark: EDU.charts.spark(data.monthlyAttendance(s.id).map((m) => m.pct), '#16A085') })}
                ${ui.kpi({ label: 'Upcoming Exams', value: exams.length, icon: 'fa-file-signature', box: 'red', trend: exams[0] ? `Next: ${esc(exams[0].subject)} · ${U.relLabel(exams[0].date)}` : 'No exams scheduled' })}
                ${ui.kpi({ label: 'Pending Assignments', value: pending.length, icon: 'fa-list-check', box: 'gold', trend: `<b class="down">${pending.filter((x) => data.workStatus(x, s.id) === 'overdue').length}</b> overdue` })}
                ${ui.kpi({ label: 'Current GPA', value: last ? last.gpa : '—', suffix: '/ 10', icon: 'fa-award', box: 'purple', trend: last ? `<b>${last.grade}</b> · ${last.pct}% in ${esc(exNames[exNames.length - 1])}` : '' })}
                ${ui.kpi({ label: 'Fee Status', value: fee ? U.money(fee.pending) : '—', icon: 'fa-wallet', box: fee && fee.status === 'Overdue' ? 'red' : 'teal', trend: fee ? U.statusBadge(fee.status) : '' })}
                ${ui.kpi({ label: 'Library Books', value: books.length, icon: 'fa-book-bookmark', box: 'pink', trend: `${books.filter((l) => data.loanStatus(l) === 'Overdue').length} overdue · ${books.filter((l) => data.loanStatus(l) === 'Due Soon').length} due soon` })}
            </div>
            <div class="dash-grid">
                <div class="col-4">${ui.panel("Today's Schedule", ui.schedule(slots), { icon: 'fa-clock', actions: `<a class="btn btn-xs btn-soft" href="timetable.html">Full timetable</a>` })}</div>
                <div class="col-4">${ui.panel('Attendance Overview', `<div class="chart-box sm"><canvas id="cAtt" aria-label="Attendance breakdown chart"></canvas></div>`, { icon: 'fa-chart-pie', actions: `<a class="btn btn-xs btn-soft" href="attendance.html">Details</a>` })}</div>
                <div class="col-4">${ui.panel('Upcoming Exams', exams.length ? `<ul class="list">${exams.slice(0, 5).map((e) => `<li class="list-item">${ui.subjectChip(e.subject)}<div class="grow"><h5>${esc(e.subject)}</h5><small>${esc(e.name)} · ${fmtTime(e.start)} · ${esc(e.room)}</small></div><span class="badge badge-${U.diffDays(e.date) <= 3 ? 'danger' : 'primary'}">${U.relLabel(e.date)}</span></li>`).join('')}</ul>` : U.empty('No upcoming exams'), { icon: 'fa-file-signature', actions: `<a class="btn btn-xs btn-soft" href="exams.html">All exams</a>` })}</div>
                <div class="col-12">${ui.panel('Weekly Timetable', ui.weekMini(data.timetable(s.class)), { icon: 'fa-calendar-week', flush: true, actions: `<a class="btn btn-xs btn-soft" href="timetable.html">Open planner</a>` })}</div>
                <div class="col-7">${ui.panel('Recent Homework', `<ul class="list">${hw.slice().sort((a, b) => b.assigned.localeCompare(a.assigned)).slice(0, 5).map((h) => `<li class="list-item">${ui.subjectChip(h.subject)}<div class="grow"><h5 class="truncate">${esc(h.title)}</h5><small>${esc(h.subject)} · Due ${U.relLabel(h.due)}</small></div>${U.statusBadge(data.workStatus(h, s.id))}</li>`).join('')}</ul>`, { icon: 'fa-book', actions: `<a class="btn btn-xs btn-soft" href="homework.html">View all</a>` })}</div>
                <div class="col-5">${ui.panel('Recent Results', `<div class="chart-box sm"><canvas id="cRes" aria-label="Recent results chart"></canvas></div>`, { icon: 'fa-chart-column', sub: esc(exNames[exNames.length - 1] || ''), actions: `<a class="btn btn-xs btn-soft" href="results.html">Report card</a>` })}</div>
                <div class="col-4">${ui.panel('Announcements', ui.noticeList(4, 'student'), { icon: 'fa-bullhorn', actions: `<a class="btn btn-xs btn-soft" href="notices.html">All</a>` })}</div>
                <div class="col-4">${ui.panel('Upcoming Events', ui.eventList(4), { icon: 'fa-calendar-days', actions: `<a class="btn btn-xs btn-soft" href="${hrefFor('student', 'events')}">All</a>` })}</div>
                <div class="col-4">${ui.panel('Notifications', `<div id="dashNotifs" style="margin:-20px -22px">${ui.notifList(c, 4)}</div>`, { icon: 'fa-bell', actions: `<span class="flex items-center gap-8 small text-muted"><span class="live-dot green"></span>Live</span>` })}</div>
            </div>`;
        },
        mount(el, c) {
            const s = c.student, att = data.attendanceStats(s.id);
            EDU.charts.make($('#cAtt', el), { type: 'doughnut', data: { labels: ['Present', 'Late', 'Absent'], datasets: [{ data: [att.present, att.late, att.absent], backgroundColor: ['#16A085', '#F59E0B', '#E74C3C'] }] }, options: { plugins: { legend: { position: 'bottom' } } } });
            const ex = data.examNames(s.id), sum = data.examSummary(s.id, ex[ex.length - 1]);
            if (sum) EDU.charts.make($('#cRes', el), { type: 'bar', data: { labels: sum.rows.map((r) => r.subject.replace('Computer Science', 'Comp. Sci').replace('Social Studies', 'Soc. St.')), datasets: [{ label: 'Marks', data: sum.rows.map((r) => r.marks), backgroundColor: sum.rows.map((r) => data.subject(r.subject).color) }] }, options: { plugins: { legend: { display: false } }, scales: { y: { max: 100 } } } });
            c.on('db:notifications', () => { const d = $('#dashNotifs', el); if (d) d.innerHTML = ui.notifList(c, 4); });
            c.on('db:attendance', () => c.rerender());
        }
    };

    /* ---------- TEACHER ---------- */
    EDU.views['dashboard-teacher'] = {
        title: 'Dashboard',
        render(c) {
            const t = c.teacher;
            const classes = data.teacherClasses(t);
            const allClasses = EDU.db.all('classes').filter((x) => classes.includes(x.id));
            const students = allClasses.reduce((a, x) => a + x.strength, 0);
            const slots = data.todaySlots(c);
            const teaching = slots.filter((s) => s.type !== 'break' && s.type !== 'activity');
            const toReview = [...EDU.db.all('homework'), ...EDU.db.all('assignments')].filter((w) => w.teacher === t.id).reduce((a, w) => a + Object.values(w.submissions || {}).filter((s) => !s.grade && s.marks == null).length, 0) + 6;
            const log = EDU.db.all('attendanceLog').filter((l) => classes.includes(l.class));
            const today = U.rel(0);
            const todayLogs = log.filter((l) => l.date === today);
            const pctOf = (l) => { const v = Object.values(l.records); return v.length ? (v.filter((x) => x !== 'A').length / v.length) * 100 : 0; };
            const attPct = todayLogs.length ? (todayLogs.reduce((a, l) => a + pctOf(l), 0) / todayLogs.length).toFixed(1) : (log.slice(-4).reduce((a, l) => a + pctOf(l), 0) / Math.max(1, log.slice(-4).length)).toFixed(1);
            const exams = EDU.db.all('exams').filter((e) => e.teacher === t.id && U.diffDays(e.date) >= 0 && U.diffDays(e.date) <= 21);
            const mats = EDU.db.all('materials').filter((m) => m.teacher === t.id);
            const submissions = [...EDU.db.all('homework'), ...EDU.db.all('assignments')].filter((w) => w.teacher === t.id).flatMap((w) => Object.entries(w.submissions || {}).map(([sid, sub]) => ({ w, sid, sub }))).sort((a, b) => b.sub.date.localeCompare(a.sub.date));
            return `
            <div class="welcome-banner">
                <div><h2>${U.greet()}, ${esc(t.name.split(' ')[0])}! ☀️</h2>
                    <p>You have <strong style="color:#fff">${teaching.length} classes</strong> today${teaching.find((s) => data.slotState(s.time) !== 'done') ? `. Next: ${esc(teaching.find((s) => data.slotState(s.time) !== 'done').class)} at ${fmtTime(teaching.find((s) => data.slotState(s.time) !== 'done').time)}` : ''}. ${toReview} submissions are waiting for review.</p>
                    <div class="wb-chips"><span class="wb-chip"><i class="fa-solid fa-id-badge"></i> ${t.id}</span><span class="wb-chip"><i class="fa-solid fa-sitemap"></i> ${esc(t.department)}</span><span class="wb-chip"><i class="fa-solid fa-chalkboard"></i> ${classes.join(', ')}</span><span class="wb-chip"><i class="fa-regular fa-calendar"></i> ${fmtDate(U.rel(0), { long: true })}</span></div></div>
                <div class="wb-illus"><i class="fa-solid fa-chalkboard-user"></i></div>
            </div>
            <div class="kpi-grid cols-5">
                ${ui.kpi({ label: 'Total Students', value: students, icon: 'fa-user-graduate', box: '', trend: `Across ${classes.length} classes` })}
                ${ui.kpi({ label: 'Classes Today', value: teaching.length, icon: 'fa-chalkboard', box: 'teal', trend: `${teaching.filter((s) => data.slotState(s.time) === 'done').length} completed` })}
                ${ui.kpi({ label: 'Pending Reviews', value: toReview, icon: 'fa-list-check', box: 'gold', trend: 'Homework & assignments', id: 'kReview' })}
                ${ui.kpi({ label: todayLogs.length ? "Today's Attendance" : 'Avg. Attendance', value: attPct, suffix: '%', icon: 'fa-user-check', box: 'green', trend: `${todayLogs.length}/${classes.length} classes marked today`, id: 'kAtt' })}
                ${ui.kpi({ label: 'Upcoming Exams', value: exams.length, icon: 'fa-file-signature', box: 'red', trend: exams[0] ? `${esc(exams[0].class)} · ${U.relLabel(exams[0].date)}` : '' })}
            </div>
            <div class="dash-grid">
                <div class="col-5">${ui.panel("Today's Classes", ui.schedule(slots).replace(/<span class="badge">Upcoming<\/span>/g, '<a class="btn btn-xs btn-soft" href="attendance.html">Attendance</a>'), { icon: 'fa-clock', actions: `<a class="btn btn-xs btn-soft" href="timetable.html">Week view</a>` })}</div>
                <div class="col-7">${ui.panel('Quick Actions', `<div class="quick-actions">
                    <a class="qa-btn" href="attendance.html"><span class="icon-box green"><i class="fa-solid fa-user-check"></i></span>Mark Attendance</a>
                    <button class="qa-btn" data-qa="homework"><span class="icon-box"><i class="fa-solid fa-book"></i></span>Add Homework</button>
                    <button class="qa-btn" data-qa="assignment"><span class="icon-box purple"><i class="fa-solid fa-file-pen"></i></span>Create Assignment</button>
                    <button class="qa-btn" data-qa="marks"><span class="icon-box red"><i class="fa-solid fa-pen-to-square"></i></span>Enter Marks</button>
                    <a class="qa-btn" href="teacher-dashboard.html#students"><span class="icon-box sky"><i class="fa-solid fa-chart-line"></i></span>Student Performance</a>
                    <button class="qa-btn" data-qa="material"><span class="icon-box teal"><i class="fa-solid fa-cloud-arrow-up"></i></span>Upload Material</button>
                    <a class="qa-btn" href="teacher-dashboard.html#classes"><span class="icon-box gold"><i class="fa-solid fa-chalkboard"></i></span>Manage Classes</a>
                    <button class="qa-btn" data-qa="notice"><span class="icon-box pink"><i class="fa-solid fa-bullhorn"></i></span>Send Announcement</button></div>`, { icon: 'fa-bolt' })}
                    <div class="mt-24">${ui.panel('Class Performance', `<div class="chart-box sm"><canvas id="cPerf"></canvas></div>`, { icon: 'fa-chart-column', sub: 'Quarterly Examination · Mathematics' })}</div></div>
                <div class="col-6">${ui.panel('Recent Submissions', submissions.length ? `<ul class="list">${submissions.slice(0, 6).map(({ w, sid, sub }) => { const st = data.student(sid); return `<li class="list-item">${U.avatar(st, 'sm')}<div class="grow"><h5 class="truncate">${esc(st.name)} <small class="text-muted">· ${esc(st.class)}</small></h5><small class="truncate" style="display:block">${esc(w.title)}</small></div>${sub.grade || sub.marks != null ? U.statusBadge('graded') : `<a class="btn btn-xs btn-primary" href="${w.id.startsWith('AS') ? 'assignments' : 'homework'}.html">Review</a>`}</li>`; }).join('')}</ul>` : U.empty('No submissions yet'), { icon: 'fa-inbox' })}</div>
                <div class="col-6">${ui.panel('Study Materials', `<ul class="list" id="matList">${mats.map((m) => `<li class="list-item"><span class="icon-box sm ${m.type === 'Video' ? 'red' : m.type === 'Link' ? 'sky' : 'teal'}"><i class="fa-solid ${m.type === 'Video' ? 'fa-film' : m.type === 'Link' ? 'fa-link' : 'fa-file-pdf'}"></i></span><div class="grow"><h5 class="truncate">${esc(m.title)}</h5><small>${esc(m.class)} · ${esc(m.type)} · ${esc(m.size)} · ${fmtDate(m.date)}</small></div><span class="badge"><i class="fa-solid fa-download"></i> ${m.downloads}</span></li>`).join('')}</ul>`, { icon: 'fa-folder-open', actions: '<button class="btn btn-xs btn-primary" data-qa="material"><i class="fa-solid fa-plus"></i> Upload</button>' })}</div>
                <div class="col-6">${ui.panel('Notice Board', ui.noticeList(4, 'teacher'), { icon: 'fa-bullhorn', actions: `<a class="btn btn-xs btn-soft" href="notices.html">All</a>` })}</div>
                <div class="col-6">${ui.panel('Upcoming Events', ui.eventList(4), { icon: 'fa-calendar-days' })}</div>
            </div>`;
        },
        mount(el, c) {
            const classes = data.teacherClasses(c.teacher);
            const avg = classes.map((cls) => { const r = EDU.db.all('results').filter((x) => x.class === cls && x.subject === 'Mathematics' && x.exam === 'Quarterly Examination'); return r.length ? +(r.reduce((a, x) => a + x.marks, 0) / r.length).toFixed(1) : 0; });
            const top = classes.map((cls) => { const r = EDU.db.all('results').filter((x) => x.class === cls && x.subject === 'Mathematics' && x.exam === 'Quarterly Examination'); return r.length ? Math.max(...r.map((x) => x.marks)) : 0; });
            EDU.charts.make($('#cPerf', el), { type: 'bar', data: { labels: classes, datasets: [{ label: 'Class average', data: avg }, { label: 'Highest', data: top, color: '#159B78' }] }, options: { scales: { y: { max: 100 } } } });
            el.addEventListener('click', (e) => {
                const b = e.target.closest('[data-qa]'); if (!b) return;
                const k = b.dataset.qa;
                if (k === 'homework') EDU.work.openCreate('homework', c);
                if (k === 'assignment') EDU.work.openCreate('assignments', c);
                if (k === 'marks') EDU.exams.openMarks(c);
                if (k === 'notice') EDU.noticesUI.openCreate(c);
                if (k === 'material') uploadMaterial(c);
            });
            c.on('db:materials', () => c.rerender());
        }
    };

    function uploadMaterial(c) {
        const classes = data.teacherClasses(c.teacher);
        const m = EDU.modal.open({
            title: '<i class="fa-solid fa-cloud-arrow-up text-primary"></i> Upload Study Material',
            body: `<form id="matForm" class="form-grid" novalidate>
                <div class="form-group span-2"><label class="form-label" for="mTitle">Title <span class="req">*</span></label><input class="form-control" id="mTitle" required placeholder="e.g. Arithmetic Progressions — Notes"></div>
                <div class="form-group"><label class="form-label" for="mClass">Class <span class="req">*</span></label><select class="form-control" id="mClass" required>${classes.map((x) => `<option>${x}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label" for="mType">Type</label><select class="form-control" id="mType"><option>PDF</option><option>Video</option><option>Link</option><option>Notebook</option></select></div>
                <div class="form-group span-2"><div class="dropzone" id="mDrop"><input type="file" id="mFile" required aria-label="Choose file" data-msg="Please choose a file to upload"><i class="fa-solid fa-cloud-arrow-up"></i><p>Drop a file here or <strong class="text-primary">browse</strong></p><div class="file-name" id="mName" hidden></div></div></div>
            </form>`,
            footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="mSave"><i class="fa-solid fa-upload"></i> Upload</button>'
        });
        const f = $('#mFile', m.el);
        f.addEventListener('change', () => { const x = f.files[0]; $('#mName', m.el).hidden = !x; if (x) $('#mName', m.el).innerHTML = `<i class="fa-solid fa-circle-check"></i> ${esc(x.name)}`; $('#mDrop', m.el).classList.toggle('has-file', !!x); });
        EDU.validate.attach($('#matForm', m.el));
        $('#mSave', m.el).addEventListener('click', async (e) => {
            if (!EDU.validate.form($('#matForm', m.el))) return;
            e.currentTarget.classList.add('loading');
            await U.sleep(900);
            const file = f.files[0];
            EDU.db.insert('materials', { id: U.uid('MT'), teacher: c.teacher.id, class: $('#mClass', m.el).value, subject: c.teacher.department, title: $('#mTitle', m.el).value.trim(), type: $('#mType', m.el).value, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, date: U.rel(0), downloads: 0 });
            EDU.notify.push('role:student', `New study material uploaded by ${c.teacher.name}: "${$('#mTitle', m.el).value.trim()}"`, 'assignment', 'assignments.html', { silent: true });
            m.close();
            EDU.toast.success('Material uploaded', 'Students in the class have been notified.');
        });
    }
    EDU.portalActions = { uploadMaterial };

    /* ---------- PARENT ---------- */
    EDU.views['dashboard-parent'] = {
        title: 'Dashboard',
        render(c) {
            const kids = (c.user.children || []).map(data.student).filter(Boolean);
            const s = c.student, att = data.attendanceStats(s.id);
            const hw = data.homeworkFor(s.class);
            const pend = hw.filter((h) => ['pending', 'overdue'].includes(data.workStatus(h, s.id)));
            const exams = data.upcomingExams(s.class, 21);
            const ex = data.examNames(s.id), last = data.examSummary(s.id, ex[ex.length - 1]);
            const fee = data.fees(s.id);
            const bus = EDU.db.find('buses', s.busId);
            return `
            <div class="grid grid-2 mb-24" style="gap:16px">${kids.map((k) => `<div class="card child-card ${k.id === s.id ? 'active' : ''}" data-child="${k.id}" role="button" tabindex="0" aria-pressed="${k.id === s.id}">
                ${U.avatar(k, 'lg')}<div class="grow"><h4 class="mb-0">${esc(k.name)}</h4><small class="text-muted">Grade ${k.class} · Roll ${k.roll} · ${k.id}</small>
                <div class="flex gap-8 mt-8"><span class="badge badge-success">${data.attendanceStats(k.id).pct}% attendance</span><span class="badge badge-purple">GPA ${(data.examSummary(k.id, data.examNames(k.id).slice(-1)[0]) || {}).gpa || '—'}</span></div></div>
                ${k.id === s.id ? '<span class="badge badge-primary">Viewing</span>' : '<span class="btn btn-xs btn-soft">Switch</span>'}</div>`).join('')}</div>
            <div class="welcome-banner">
                <div><h2>${U.greet()}, ${esc(c.user.name.split(' ')[0])}!</h2><p>Here is today's snapshot for <strong style="color:#fff">${esc(s.name)}</strong> (Grade ${s.class}). ${att.recs[U.rel(0)] ? `Marked <strong style="color:#fff">${att.recs[U.rel(0)] === 'A' ? 'absent' : 'present'}</strong> today.` : 'Attendance for today will appear here live once the class teacher marks it.'}</p>
                <div class="wb-chips"><span class="wb-chip"><i class="fa-solid fa-user-tie"></i> Class teacher: ${esc(data.teacher((EDU.db.all('classes').find((x) => x.id === s.class) || {}).classTeacher).name)}</span><span class="wb-chip"><i class="fa-solid fa-bus"></i> ${esc(s.busId)} · ${esc(s.area)}</span><span class="wb-chip"><i class="fa-regular fa-calendar"></i> ${fmtDate(U.rel(0), { long: true })}</span></div></div>
                <div class="wb-illus"><i class="fa-solid fa-people-roof"></i></div></div>
            <div class="kpi-grid cols-5">
                ${ui.kpi({ label: 'Attendance', value: att.pct, suffix: '%', icon: 'fa-user-check', box: 'green', trend: `${att.absent} absences this term` })}
                ${ui.kpi({ label: 'Academic Performance', value: last ? last.pct : '—', suffix: '%', icon: 'fa-chart-line', box: 'purple', trend: last ? `Grade <b>${last.grade}</b> · GPA ${last.gpa}` : '' })}
                ${ui.kpi({ label: 'Fee Status', value: fee ? U.money(fee.pending) : '—', icon: 'fa-wallet', box: fee && fee.status === 'Overdue' ? 'red' : 'teal', trend: fee ? `${U.statusBadge(fee.status)} ${fee.nextDue ? '· due ' + U.relLabel(fee.nextDue) : ''}` : '' })}
                ${ui.kpi({ label: 'Pending Homework', value: pend.length, icon: 'fa-book', box: 'gold', trend: `${hw.length} assigned this fortnight` })}
                ${ui.kpi({ label: 'Upcoming Exams', value: exams.length, icon: 'fa-file-signature', box: 'red', trend: exams[0] ? `From ${fmtDate(exams[0].date, { short: true })}` : '' })}
            </div>
            <div class="dash-grid">
                <div class="col-6">${ui.panel('Attendance Trend', `<div class="chart-box"><canvas id="pAtt"></canvas></div>`, { icon: 'fa-chart-area', actions: '<a class="btn btn-xs btn-soft" href="attendance.html">Calendar</a>' })}</div>
                <div class="col-6">${ui.panel('Academic Performance', `<div class="chart-box"><canvas id="pPerf"></canvas></div>`, { icon: 'fa-chart-column', actions: '<a class="btn btn-xs btn-soft" href="results.html">Report card</a>' })}</div>
                <div class="col-4">${ui.panel('Homework', `<ul class="list">${hw.slice().sort((a, b) => b.due.localeCompare(a.due)).slice(0, 5).map((h) => `<li class="list-item">${ui.subjectChip(h.subject)}<div class="grow"><h5 class="truncate">${esc(h.title)}</h5><small>Due ${U.relLabel(h.due)}</small></div>${U.statusBadge(data.workStatus(h, s.id))}</li>`).join('')}</ul>`, { icon: 'fa-book', actions: '<a class="btn btn-xs btn-soft" href="homework.html">All</a>' })}</div>
                <div class="col-4">${ui.panel('Upcoming Exams', exams.length ? `<ul class="list">${exams.slice(0, 5).map((e) => `<li class="list-item">${ui.subjectChip(e.subject)}<div class="grow"><h5>${esc(e.subject)}</h5><small>${fmtDate(e.date)} · ${fmtTime(e.start)}</small></div><span class="badge badge-primary">${U.relLabel(e.date)}</span></li>`).join('')}</ul>` : U.empty('No exams scheduled'), { icon: 'fa-file-signature' })}</div>
                <div class="col-4">${ui.panel('School Bus — Live', bus ? `<div id="busMini"></div>` : U.empty('No transport'), { icon: 'fa-bus', actions: '<span class="flex items-center gap-8 small text-muted"><span class="live-dot green"></span>Live</span>' })}</div>
                <div class="col-4">${ui.panel('Fee Summary', fee ? `<div class="flex items-center gap-16 mb-16"><div class="ring" style="--val:${Math.round((fee.paid / fee.total) * 100)};--size:96px;--thick:10px;--col:var(--success)"><div><strong style="font-size:1.1rem">${Math.round((fee.paid / fee.total) * 100)}%</strong><small class="xsmall text-muted">paid</small></div></div>
                    <div><small class="text-muted">Pending amount</small><h3 class="mb-0">${U.money(fee.pending)}</h3>${fee.nextDue ? `<small>Due ${fmtDate(fee.nextDue)}</small>` : ''}</div></div>
                    ${fee.pending ? '<a class="btn btn-primary btn-block" href="fees-dashboard.html"><i class="fa-solid fa-credit-card"></i> Pay Now</a>' : '<div class="badge badge-success">All fees paid — thank you!</div>'}` : U.empty('No fee record'), { icon: 'fa-wallet' })}</div>
                <div class="col-4">${ui.panel('School Announcements', ui.noticeList(4, 'parent'), { icon: 'fa-bullhorn', actions: '<a class="btn btn-xs btn-soft" href="notices.html">All</a>' })}</div>
                <div class="col-4">${ui.panel('Events', ui.eventList(4), { icon: 'fa-calendar-days' })}</div>
            </div>`;
        },
        mount(el, c) {
            const s = c.student;
            const m = data.monthlyAttendance(s.id);
            EDU.charts.make($('#pAtt', el), { type: 'line', data: { labels: m.map((x) => x.label), datasets: [{ label: 'Attendance %', data: m.map((x) => x.pct), color: '#16A085' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { min: 70, max: 100 } } } });
            const ex = data.examNames(s.id);
            const subjects = [...new Set(data.resultsFor(s.id).map((r) => r.subject))];
            EDU.charts.make($('#pPerf', el), { type: 'bar', data: { labels: subjects.map((x) => x.replace('Computer Science', 'Comp. Sci').replace('Social Studies', 'Soc. St.')), datasets: ex.slice(-2).map((e, i) => ({ label: e, data: subjects.map((sub) => (data.resultsFor(s.id).find((r) => r.exam === e && r.subject === sub) || {}).marks || 0), color: i ? '#013431' : '#84959A' })) }, options: { scales: { y: { max: 100 } } } });
            el.addEventListener('click', (e) => {
                const k = e.target.closest('[data-child]');
                if (k && k.dataset.child !== c.student.id) { EDU.auth.update({ activeChild: k.dataset.child }); c.student = data.student(k.dataset.child); const cs = $('#childSwitch'); if (cs) cs.value = k.dataset.child; EDU.toast.info('Switched child', `Now viewing ${c.student.name}.`); c.rerender(); }
            });
            const busMini = $('#busMini', el);
            const drawBus = () => {
                const b = EDU.transport ? EDU.transport.get(s.busId) : EDU.db.find('buses', s.busId); if (!b || !busMini) return;
                const st = EDU.transport ? EDU.transport.status(b) : 'On Route';
                const stop = b.stops.find((x) => x.name === s.area) || b.stops[1];
                busMini.innerHTML = `<div class="flex items-center gap-12 mb-16"><span class="icon-box gold"><i class="fa-solid fa-bus"></i></span><div class="grow"><h5 class="mb-0">${esc(b.id)} · ${esc(b.number)}</h5><small class="text-muted">${esc(b.route)}</small></div>${U.statusBadge(st)}</div>
                    ${bar('Route progress', Math.round(b.progress * 100), st === 'Delayed' ? 'danger' : 'success')}
                    <div class="flex justify-between small"><span><i class="fa-solid fa-user"></i> ${esc(b.driver)}</span><span><i class="fa-solid fa-location-dot"></i> Stop: ${esc(stop.name)} · ${fmtTime(stop.time)}</span></div>
                    <a class="btn btn-soft btn-sm btn-block mt-16" href="bus-tracking.html"><i class="fa-solid fa-map-location-dot"></i> Track on map</a>`;
            };
            drawBus();
            c.sub('buses', drawBus);
            c.on('db:attendance', () => c.rerender());
            el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset.child) e.target.click(); });
        }
    };

    /* ---------- ADMIN ---------- */
    EDU.views['dashboard-admin'] = {
        title: 'Dashboard',
        render(c) {
            const st = EDU.ref.SCHOOL.stats;
            const A = EDU.db.obj('analytics');
            const apps = EDU.db.all('admissions');
            const newApps = apps.filter((a) => ['New', 'Under Review', 'Document Verification', 'Assessment Scheduled'].includes(a.status)).length;
            const exams = [...new Set(EDU.db.all('exams').filter((e) => U.diffDays(e.date) >= 0 && U.diffDays(e.date) <= 30).map((e) => e.name + e.class))].length;
            const events = EDU.db.all('events').filter((e) => U.diffDays(e.date) >= 0).length;
            return `
            <div class="page-head"><div><h2>${U.greet()}, ${esc(c.user.name.split(' ')[0])}</h2><p>School-wide overview · ${fmtDate(U.rel(0), { long: true })} · <span class="flex items-center gap-8" style="display:inline-flex"><span class="live-dot green"></span> <span id="onlineNow">412</span> users online</span></p></div>
                <div class="actions"><a class="btn btn-soft btn-sm" href="admin-dashboard.html#reports"><i class="fa-solid fa-file-export"></i> Reports</a><button class="btn btn-primary btn-sm" data-qa="notice"><i class="fa-solid fa-bullhorn"></i> New Notice</button></div></div>
            <div class="kpi-grid cols-4">
                ${ui.kpi({ label: 'Total Students', value: U.num(st.students), icon: 'fa-user-graduate', trend: '<b>+5.7%</b> vs last year', spark: EDU.charts.spark(A.studentGrowth.data) })}
                ${ui.kpi({ label: 'Total Teachers', value: st.teachers, icon: 'fa-chalkboard-user', box: 'teal', trend: 'Ratio 17 : 1', spark: EDU.charts.spark([138, 141, 144, 146, 149, 152], '#159B78') })}
                ${ui.kpi({ label: 'Total Parents', value: U.num(st.parents), icon: 'fa-people-roof', box: 'purple', trend: '<b>92%</b> portal adoption' })}
                ${ui.kpi({ label: 'New Admissions', value: 186 + newApps, icon: 'fa-user-plus', box: 'gold', trend: `<b>${newApps}</b> awaiting action`, id: 'kAdm' })}
                ${ui.kpi({ label: 'Attendance Rate', value: '94.6', suffix: '%', icon: 'fa-user-check', box: 'green', trend: '<span class="live-dot green" style="width:7px;height:7px"></span> Live today', id: 'kAtt' })}
                ${ui.kpi({ label: 'Pending Fees', value: '₹38.6L', icon: 'fa-wallet', box: 'red', trend: '<b class="down">214</b> students with dues', id: 'kFee' })}
                ${ui.kpi({ label: 'Upcoming Exams', value: exams, icon: 'fa-file-signature', box: 'sky', trend: 'Next 30 days' })}
                ${ui.kpi({ label: 'Events', value: events, icon: 'fa-calendar-days', box: 'pink', trend: 'Scheduled this term' })}
            </div>
            <div class="dash-grid">
                <div class="col-8">${ui.panel('Student Growth', '<div class="chart-box"><canvas id="aGrowth"></canvas></div>', { icon: 'fa-arrow-trend-up', sub: '2019 – 2026' })}</div>
                <div class="col-4">${ui.panel('Admissions by Stage', '<div class="chart-box"><canvas id="aAdmGrade"></canvas></div>', { icon: 'fa-chart-pie', sub: '2026–27 cycle' })}</div>
                <div class="col-4">${ui.panel('Attendance Analytics', '<div class="chart-box"><canvas id="aAtt"></canvas></div>', { icon: 'fa-user-check', sub: 'This week' })}</div>
                <div class="col-8">${ui.panel('Fee Collection', '<div class="chart-box"><canvas id="aFee"></canvas></div>', { icon: 'fa-indian-rupee-sign', sub: '₹ in lakhs · FY 2026–27' })}</div>
                <div class="col-6">${ui.panel('Admission Analytics', '<div class="chart-box"><canvas id="aAdm"></canvas></div>', { icon: 'fa-user-plus', sub: 'Applications vs enrolled' })}</div>
                <div class="col-6">${ui.panel('Academic Performance', '<div class="chart-box"><canvas id="aPerf"></canvas></div>', { icon: 'fa-graduation-cap', sub: 'Average % by grade' })}</div>
                <div class="col-12">${ui.panel('Recent Admission Applications', `<div class="table-wrap"><table class="table"><thead><tr><th>Application</th><th>Grade</th><th>Submitted</th><th>Status</th><th class="text-right">Actions</th></tr></thead><tbody id="admRows"></tbody></table></div>`, { icon: 'fa-inbox', flush: true, actions: '<a class="btn btn-xs btn-soft" href="admin-dashboard.html#admissions">View all</a>' })}</div>
                <div class="col-4">${ui.panel('Live Activity', '<ul class="feed" id="feed"></ul>', { icon: 'fa-wave-square', actions: '<span class="flex items-center gap-8 small text-muted"><span class="live-dot green"></span>Streaming</span>' })}</div>
                <div class="col-4">${ui.panel('Teacher Performance', '<div class="chart-box"><canvas id="aTeach"></canvas></div>', { icon: 'fa-star', sub: 'Avg. student feedback (5)' })}</div>
                <div class="col-4">${ui.panel('Quick Actions', `<div class="quick-actions">
                    <a class="qa-btn" href="admin-dashboard.html#students"><span class="icon-box"><i class="fa-solid fa-user-plus"></i></span>Add Student</a>
                    <a class="qa-btn" href="admin-dashboard.html#teachers"><span class="icon-box teal"><i class="fa-solid fa-chalkboard-user"></i></span>Manage Teachers</a>
                    <button class="qa-btn" data-qa="notice"><span class="icon-box pink"><i class="fa-solid fa-bullhorn"></i></span>Publish Notice</button>
                    <button class="qa-btn" data-qa="event"><span class="icon-box purple"><i class="fa-solid fa-calendar-plus"></i></span>Create Event</button>
                    <a class="qa-btn" href="library-dashboard.html"><span class="icon-box gold"><i class="fa-solid fa-book"></i></span>Library</a>
                    <a class="qa-btn" href="bus-tracking.html"><span class="icon-box sky"><i class="fa-solid fa-bus"></i></span>Fleet Tracking</a></div>`, { icon: 'fa-bolt' })}</div>
            </div>`;
        },
        mount(el, c) {
            const A = EDU.db.obj('analytics');
            EDU.charts.make($('#aGrowth', el), { type: 'line', data: { labels: A.studentGrowth.labels, datasets: [{ label: 'Students', data: A.studentGrowth.data }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } } });
            EDU.charts.make($('#aAdmGrade', el), { type: 'doughnut', data: { labels: A.admissionsByGrade.labels, datasets: [{ data: A.admissionsByGrade.data }] }, options: { plugins: { legend: { position: 'bottom' } } } });
            EDU.charts.make($('#aAtt', el), { type: 'bar', data: { labels: A.attendanceWeek.labels, datasets: [{ label: 'Attendance %', data: A.attendanceWeek.data, color: '#16A085' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { min: 80, max: 100 } } } });
            EDU.charts.make($('#aFee', el), { type: 'bar', data: { labels: A.feeCollection.labels, datasets: [{ label: 'Collected', data: A.feeCollection.collected }, { label: 'Pending', data: A.feeCollection.pending, color: '#F59E0B' }] } });
            EDU.charts.make($('#aAdm', el), { type: 'line', data: { labels: A.admissions.labels, datasets: [{ label: 'Applications', data: A.admissions.applications }, { label: 'Enrolled', data: A.admissions.enrolled, color: '#159B78' }] } });
            EDU.charts.make($('#aPerf', el), { type: 'bar', data: { labels: A.performanceByGrade.labels, datasets: [{ label: 'Average %', data: A.performanceByGrade.data, color: '#7356D8' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { min: 60, max: 100 } } } });
            EDU.charts.make($('#aTeach', el), { type: 'bar', data: { labels: A.teacherPerformance.labels, datasets: [{ label: 'Rating', data: A.teacherPerformance.data, color: '#F59E0B' }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { min: 4, max: 5, grid: { color: 'rgba(132, 149, 154,.2)' } }, y: { grid: { display: false } } } } });

            const drawApps = () => {
                const rows = EDU.db.all('admissions').slice().sort((a, b) => b.submitted.localeCompare(a.submitted)).slice(0, 6);
                $('#admRows', el).innerHTML = rows.map((a) => `<tr><td><div class="cell-user">${U.avatar({ name: a.student.name })}<div><strong>${esc(a.student.name)}</strong><small>${a.id}</small></div></div></td><td>${esc(a.student.grade)}</td><td>${U.timeAgo(a.submitted)}</td><td>${U.statusBadge(a.status)}</td>
                    <td><div class="actions">${['Approved', 'Rejected'].includes(a.status) ? `<a class="btn btn-xs btn-ghost" href="admin-dashboard.html#admissions">View</a>` : `<button class="btn btn-xs btn-soft-success" data-app="${a.id}" data-st="Approved">Approve</button><button class="btn btn-xs btn-soft-danger" data-app="${a.id}" data-st="Rejected">Reject</button>`}</div></td></tr>`).join('');
            };
            drawApps();
            c.on('db:admissions', drawApps);
            el.addEventListener('click', async (e) => {
                const b = e.target.closest('[data-app]');
                if (b) {
                    const ok = await EDU.modal.confirm({ title: `${b.dataset.st === 'Approved' ? 'Approve' : 'Reject'} application?`, text: `Application ${b.dataset.app} will be marked as ${b.dataset.st}. The parent will be notified by email and SMS.`, confirmText: b.dataset.st === 'Approved' ? 'Approve' : 'Reject', danger: b.dataset.st === 'Rejected' });
                    if (ok) { EDU.db.update('admissions', b.dataset.app, { status: b.dataset.st }); EDU.toast.success(`Application ${b.dataset.st.toLowerCase()}`, 'The applicant has been notified.'); addFeed(`Application ${b.dataset.app} ${b.dataset.st.toLowerCase()} by ${c.user.name}`, b.dataset.st === 'Approved' ? '#16A085' : '#E74C3C'); }
                }
                const q = e.target.closest('[data-qa]');
                if (q && q.dataset.qa === 'notice') EDU.noticesUI.openCreate(c);
                if (q && q.dataset.qa === 'event') EDU.eventsUI.openCreate(c);
            });

            // Live activity feed + live KPIs (simulated stream)
            const feed = $('#feed', el);
            const addFeed = (text, color = '#013431') => {
                if (!feed) return;
                feed.insertAdjacentHTML('afterbegin', `<li><span class="dot" style="background:${color}"></span><div><p>${esc(text)}</p><small>${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</small></div></li>`);
                while (feed.children.length > 12) feed.lastChild.remove();
            };
            const EVENTS = [
                ['Attendance marked for 9-B by Fatima Sheikh', '#16A085'], ['Fee payment ₹40,000 received — STU2026017', '#F59E0B'], ['New admission application — Grade 1', '#159B78'],
                ['BUS-02 arrived at campus', '#013431'], ['Library: 3 books issued', '#EC4899'], ['Homework published — Physics 10-B', '#7356D8'],
                ['Parent logged in: Karan Kapoor', '#2196F3'], ['Result entered: Mathematics 9-A (41 students)', '#7356D8'], ['Visitor checked in at Gate 2', '#84959A']
            ];
            ['Admin console connected to live stream', 'Morning attendance sync completed (96 sections)', 'Fee reconciliation job finished'].forEach((t) => addFeed(t, '#84959A'));
            let att = 94.6, online = 412;
            c.every(4000, () => {
                const [t, col] = EVENTS[Math.floor(Math.random() * EVENTS.length)];
                addFeed(t, col);
                att = U.clamp(+(att + (Math.random() - .45) * .3).toFixed(1), 92, 97.5);
                online = Math.max(300, online + Math.round((Math.random() - .45) * 14));
                const k = $('#kAtt', el); if (k) { k.querySelector('[data-kpi-value]').innerHTML = `${att}<small> %</small>`; k.classList.remove('pulse'); void k.offsetWidth; k.classList.add('pulse'); }
                const o = $('#onlineNow', el); if (o) o.textContent = online;
            });
            c.on('db:attendanceLog', () => addFeed('Live: attendance updated by a teacher', '#16A085'));
            c.on('db:admissions', () => { const k = $('#kAdm', el); if (k) { k.classList.remove('pulse'); void k.offsetWidth; k.classList.add('pulse'); } });
        }
    };
})(window.EDU);
