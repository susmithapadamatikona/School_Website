/* ==========================================================================
   Attendance — student/parent calendar & analytics, teacher marking,
   admin school-wide monitor. Updates propagate live (same tab via the bus,
   other tabs via the storage event).
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, fmtDate } = U;
    EDU.views = EDU.views || {};
    const D = () => EDU.data;
    const ui = () => EDU.ui;

    const STATUS = { P: ['present', 'Present'], A: ['absent', 'Absent'], L: ['late', 'Late'], H: ['holiday', 'Holiday'] };

    function calendar(recs, year, month) {
        const first = new Date(year, month, 1);
        const days = new Date(year, month + 1, 0).getDate();
        const todayISO = U.rel(0);
        let html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<div class="cal-dow">${d}</div>`).join('');
        for (let i = 0; i < first.getDay(); i++) html += '<div class="cal-day empty"></div>';
        for (let d = 1; d <= days; d++) {
            const iso = `${year}-${U.pad(month + 1)}-${U.pad(d)}`;
            const dow = new Date(year, month, d).getDay();
            const v = recs[iso];
            const cls = v ? STATUS[v][0] : dow === 0 ? 'weekend' : '';
            const label = v ? STATUS[v][1] : dow === 0 ? 'Sunday' : iso > todayISO ? 'Upcoming' : 'No record';
            html += `<div class="cal-day ${cls}${iso === todayISO ? ' today' : ''}" title="${fmtDate(iso)} — ${label}" aria-label="${fmtDate(iso)}: ${label}">${d}</div>`;
        }
        return html;
    }

    /* ---------------- Student / parent ---------------- */
    function studentView(c) {
        const s = c.student, st = D().attendanceStats(s.id);
        const today = st.recs[U.rel(0)];
        return `
        ${ui().pageHead('Attendance', `${esc(s.name)} · Grade ${s.class} · Academic Year 2026–27`, `<button class="btn btn-soft btn-sm" id="attCsv"><i class="fa-solid fa-download"></i> Export CSV</button>`)}
        <div class="panel mb-24" style="border-left:4px solid ${today ? (today === 'A' ? 'var(--danger)' : 'var(--success)') : 'var(--primary)'}"><div class="panel-body flex items-center gap-16 flex-wrap" id="todayBox">
            <span class="live-dot ${today && today !== 'A' ? 'green' : ''}"></span>
            <div class="grow"><strong>Today · ${fmtDate(U.rel(0), { long: true })}</strong><br><small class="text-muted">${today ? `Marked <strong>${STATUS[today][1]}</strong> by the class teacher.` : 'Waiting for the class teacher to mark attendance — this card updates live.'}</small></div>
            ${today ? U.statusBadge(STATUS[today][1]) : '<span class="badge badge-info">Awaiting</span>'}</div></div>
        <div class="kpi-grid cols-5">
            ${ui().kpi({ label: 'Total Working Days', value: st.total, icon: 'fa-calendar', box: '' })}
            ${ui().kpi({ label: 'Present', value: st.present, icon: 'fa-circle-check', box: 'green' })}
            ${ui().kpi({ label: 'Absent', value: st.absent, icon: 'fa-circle-xmark', box: 'red' })}
            ${ui().kpi({ label: 'Late Arrivals', value: st.late, icon: 'fa-clock', box: 'gold' })}
            ${ui().kpi({ label: 'Attendance %', value: st.pct, suffix: '%', icon: 'fa-percent', box: 'purple', trend: st.pct >= 90 ? '<b>Excellent</b> · above 90% target' : '<b class="down">Below</b> 90% target' })}
        </div>
        <div class="dash-grid">
            <div class="col-5"><section class="panel"><div class="panel-body">
                <div class="calendar-head"><button class="btn-icon bordered sm" data-cal="-1" aria-label="Previous month"><i class="fa-solid fa-chevron-left"></i></button><h4 id="calTitle"></h4><button class="btn-icon bordered sm" data-cal="1" aria-label="Next month"><i class="fa-solid fa-chevron-right"></i></button></div>
                <div class="calendar" id="cal"></div>
                <div class="legend"><span><i style="background:var(--success)"></i>Present</span><span><i style="background:var(--danger)"></i>Absent</span><span><i style="background:var(--accent)"></i>Late</span><span><i style="background:var(--purple)"></i>Holiday</span></div>
            </div></section></div>
            <div class="col-7">${ui().panel('Monthly Attendance', '<div class="chart-box"><canvas id="cMonth"></canvas></div>', { icon: 'fa-chart-column' })}</div>
            <div class="col-6">${ui().panel('Subject Attendance', '<div class="chart-box"><canvas id="cSubj"></canvas></div>', { icon: 'fa-book' })}</div>
            <div class="col-6">${ui().panel('Attendance Trend', '<div class="chart-box"><canvas id="cTrend"></canvas></div>', { icon: 'fa-chart-line', sub: 'Cumulative % by week' })}</div>
        </div>`;
    }
    function studentMount(el, c) {
        const s = c.student;
        let st = D().attendanceStats(s.id);
        const now = new Date();
        let y = now.getFullYear(), m = now.getMonth();
        const drawCal = () => { $('#cal', el).innerHTML = calendar(st.recs, y, m); $('#calTitle', el).textContent = `${U.MONTHS_LONG[m]} ${y}`; };
        el.addEventListener('click', (e) => { const b = e.target.closest('[data-cal]'); if (!b) return; m += +b.dataset.cal; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } drawCal(); });
        drawCal();
        const months = D().monthlyAttendance(s.id);
        EDU.charts.make($('#cMonth', el), { type: 'bar', data: { labels: months.map((x) => x.label), datasets: [{ label: 'Present', data: months.map((x) => x.P), color: '#16A085' }, { label: 'Late', data: months.map((x) => x.L), color: '#F59E0B' }, { label: 'Absent', data: months.map((x) => x.A), color: '#E74C3C' }] }, options: { scales: { x: { stacked: true }, y: { stacked: true } } } });
        const subjects = [...new Set(Object.values(D().timetable(s.class)).flat().filter((x) => x.teacher).map((x) => x.subject))];
        const r = U.seeded(s.id.length * 31 + s.roll);
        EDU.charts.make($('#cSubj', el), { type: 'bar', data: { labels: subjects, datasets: [{ label: 'Attendance %', data: subjects.map(() => U.clamp(+(st.pct + (r() - .5) * 8).toFixed(1), 80, 100)), backgroundColor: subjects.map((x) => D().subject(x).color) }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { min: 70, max: 100 }, y: { grid: { display: false } } } } });
        const days = Object.entries(st.recs).filter(([, v]) => v !== 'H').sort();
        const weeks = []; let p = 0, t = 0;
        days.forEach(([d, v], i) => { t++; if (v !== 'A') p++; if (i % 6 === 5 || i === days.length - 1) weeks.push({ label: fmtDate(d, { short: true }), pct: +((p / t) * 100).toFixed(1) }); });
        EDU.charts.make($('#cTrend', el), { type: 'line', data: { labels: weeks.map((w) => w.label), datasets: [{ label: 'Cumulative %', data: weeks.map((w) => w.pct), color: '#7356D8' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { min: 85, max: 100 } } } });
        $('#attCsv', el).addEventListener('click', () => {
            U.download(`attendance_${s.id}.csv`, U.toCSV([['Date', 'Day', 'Status'], ...Object.entries(st.recs).sort().map(([d, v]) => [d, U.DAYS[U.parse(d).getDay()], STATUS[v][1]])]), 'text/csv');
            EDU.toast.success('Export ready', 'Attendance CSV downloaded.');
        });
        c.on('db:attendance', () => { const before = st.recs[U.rel(0)]; st = D().attendanceStats(s.id); if (st.recs[U.rel(0)] !== before) { EDU.toast.info('Attendance updated', `${s.name.split(' ')[0]} was marked ${STATUS[st.recs[U.rel(0)]][1].toLowerCase()} today.`); c.rerender(); } });
    }

    /* ---------------- Teacher: mark attendance ---------------- */
    function teacherView(c) {
        const classes = D().teacherClasses(c.teacher);
        return `
        ${ui().pageHead('Mark Attendance', 'Select a class and date, mark each student, then save. Parents and students see updates instantly.')}
        <div class="dash-grid">
            <div class="col-8"><section class="panel">
                <div class="panel-head"><div class="toolbar-group">
                    <label class="sr-only" for="mClass">Class</label><select class="form-control sm" id="mClass" style="width:auto">${classes.map((x) => `<option>${x}</option>`).join('')}</select>
                    <label class="sr-only" for="mDate">Date</label><input type="date" class="form-control sm" id="mDate" style="width:auto" value="${U.rel(0)}" max="${U.rel(0)}">
                    <span id="mStatus"></span></div>
                    <div class="toolbar-group"><button class="btn btn-xs btn-soft-success" data-all="P"><i class="fa-solid fa-check-double"></i> All present</button><button class="btn btn-xs btn-ghost" data-all="clear">Reset</button></div></div>
                <div class="panel-body flush" id="markList"></div>
                <div class="card-foot"><div class="flex gap-16 small" id="markCounts"></div><button class="btn btn-primary" id="saveAtt"><i class="fa-solid fa-floppy-disk"></i> Save Attendance</button></div>
            </section></div>
            <div class="col-4">
                ${ui().panel('Class Summary', '<div class="chart-box sm"><canvas id="mChart"></canvas></div>', { icon: 'fa-chart-pie' })}
                <div class="mt-24">${ui().panel('Recent Sessions', '<ul class="list" id="mHistory"></ul>', { icon: 'fa-clock-rotate-left' })}</div>
            </div>
        </div>`;
    }
    function teacherMount(el, c) {
        let marks = {}, chart;
        const cls = () => $('#mClass', el).value, date = () => $('#mDate', el).value;
        const load = () => {
            const log = EDU.db.find('attendanceLog', `${cls()}|${date()}`);
            marks = log ? { ...log.records } : {};
            $('#mStatus', el).innerHTML = log ? `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Saved at ${log.time}</span>` : '<span class="badge badge-warning">Not marked yet</span>';
            draw();
        };
        const counts = () => { const v = Object.values(marks); return { P: v.filter((x) => x === 'P').length, A: v.filter((x) => x === 'A').length, L: v.filter((x) => x === 'L').length }; };
        const draw = () => {
            const list = D().studentsOf(cls());
            $('#markList', el).innerHTML = list.map((s) => `<div class="mark-row"><span class="roll">${String(s.roll).padStart(2, '0')}</span>
                <div class="flex items-center gap-12">${U.avatar(s, 'sm')}<div><strong class="small">${esc(s.name)}</strong><br><small class="text-muted">${s.id} · ${s.attendance}% overall</small></div></div>
                <div class="mark-toggle" role="group" aria-label="Attendance for ${esc(s.name)}">${['P', 'L', 'A'].map((v) => `<button data-sid="${s.id}" data-v="${v}" aria-pressed="${marks[s.id] === v}" aria-label="${STATUS[v][1]}">${v}</button>`).join('')}</div></div>`).join('') + `<div class="mark-row" style="grid-template-columns:1fr"><small class="text-muted"><i class="fa-solid fa-circle-info"></i> Showing ${list.length} students from the demo dataset (class strength ${(EDU.db.all('classes').find((x) => x.id === cls()) || {}).strength}).</small></div>`;
            const k = counts(), total = list.length;
            $('#markCounts', el).innerHTML = `<span class="text-success fw-600">P ${k.P}</span><span class="text-warning fw-600">L ${k.L}</span><span class="text-danger fw-600">A ${k.A}</span><span class="text-muted">Unmarked ${total - k.P - k.L - k.A}</span>`;
            if (chart) { chart.data.datasets[0].data = [k.P, k.L, k.A, total - k.P - k.L - k.A]; chart.update(); }
        };
        el.addEventListener('click', (e) => {
            const b = e.target.closest('.mark-toggle button');
            if (b) { marks[b.dataset.sid] = b.dataset.v; draw(); return; }
            const a = e.target.closest('[data-all]');
            if (a) { if (a.dataset.all === 'clear') marks = {}; else D().studentsOf(cls()).forEach((s) => { marks[s.id] = 'P'; }); draw(); }
        });
        $('#mClass', el).addEventListener('change', load);
        $('#mDate', el).addEventListener('change', load);
        $('#saveAtt', el).addEventListener('click', async (e) => {
            const list = D().studentsOf(cls());
            const missing = list.filter((s) => !marks[s.id]);
            if (missing.length) { const ok = await EDU.modal.confirm({ title: `${missing.length} students unmarked`, text: 'Mark them as present and save?', confirmText: 'Mark present & save' }); if (!ok) return; missing.forEach((s) => { marks[s.id] = 'P'; }); }
            const btn = e.currentTarget; btn.classList.add('loading');
            await U.sleep(700);
            const id = `${cls()}|${date()}`;
            const rec = { id, class: cls(), date: date(), records: { ...marks }, markedBy: c.teacher.id, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) };
            if (EDU.db.find('attendanceLog', id)) EDU.db.update('attendanceLog', id, rec); else EDU.db.insert('attendanceLog', rec);
            const att = EDU.db.obj('attendance');
            Object.entries(marks).forEach(([sid, v]) => { att[sid] = att[sid] || {}; att[sid][date()] = v; });
            EDU.store.set('attendance', att);
            // Notify linked parents (demo parent account) about their children
            const parent = EDU.db.all('users').find((u) => u.role === 'parent');
            Object.entries(marks).forEach(([sid, v]) => {
                if (parent && (parent.children || []).includes(sid)) EDU.notify.push(parent.id, `${D().student(sid).name.split(' ')[0]} was marked ${STATUS[v][1].toLowerCase()} on ${fmtDate(date())} (${cls()}).`, 'attendance', 'attendance.html', { silent: true });
                const stuUser = EDU.db.all('users').find((u) => u.studentId === sid);
                if (stuUser) EDU.notify.push(stuUser.id, `Attendance marked: ${STATUS[v][1]} on ${fmtDate(date())}.`, 'attendance', 'attendance.html', { silent: true });
            });
            btn.classList.remove('loading');
            const k = counts();
            EDU.toast.success('Attendance saved', `${cls()} · ${k.P} present, ${k.L} late, ${k.A} absent. Parents notified.`);
            load(); history();
        });
        const history = () => {
            const logs = EDU.db.all('attendanceLog').filter((l) => D().teacherClasses(c.teacher).includes(l.class)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
            $('#mHistory', el).innerHTML = logs.map((l) => { const v = Object.values(l.records); const p = Math.round((v.filter((x) => x !== 'A').length / v.length) * 100); return `<li class="list-item"><span class="icon-box sm ${p >= 90 ? 'green' : 'gold'}"><i class="fa-solid fa-user-check"></i></span><div class="grow"><h5>${l.class} · ${fmtDate(l.date, { short: true })}</h5><small>${v.length} students · ${l.time}</small></div><strong>${p}%</strong></li>`; }).join('');
        };
        chart = EDU.charts.make($('#mChart', el), { type: 'doughnut', data: { labels: ['Present', 'Late', 'Absent', 'Unmarked'], datasets: [{ data: [0, 0, 0, 1], backgroundColor: ['#16A085', '#F59E0B', '#E74C3C', '#C9DCDA'] }] }, options: { plugins: { legend: { position: 'bottom' } } } });
        load(); history();
    }

    /* ---------------- Admin: school-wide ---------------- */
    function adminView() {
        return `
        ${ui().pageHead('Attendance Analytics', 'Live, school-wide attendance across classes and sections.', '<button class="btn btn-soft btn-sm" id="aCsv"><i class="fa-solid fa-download"></i> Export</button>')}
        <div class="kpi-grid cols-5" id="aKpis"></div>
        <div class="dash-grid">
            <div class="col-8">${ui().panel('Weekly Trend by Class', '<div class="chart-box"><canvas id="aTrend"></canvas></div>', { icon: 'fa-chart-line' })}</div>
            <div class="col-4">${ui().panel('Today\'s Marking Status', '<ul class="list" id="aStatus"></ul>', { icon: 'fa-list-check', actions: '<span class="flex items-center gap-8 small text-muted"><span class="live-dot green"></span>Live</span>' })}</div>
            <div class="col-12">${ui().panel('Class-wise Attendance (last marked day)', '<div class="table-wrap"><table class="table"><thead><tr><th>Class</th><th>Class Teacher</th><th>Date</th><th>Present</th><th>Late</th><th>Absent</th><th>Attendance</th></tr></thead><tbody id="aRows"></tbody></table></div>', { icon: 'fa-table', flush: true })}</div>
        </div>`;
    }
    function adminMount(el, c) {
        const draw = () => {
            const logs = EDU.db.all('attendanceLog');
            const classes = EDU.db.all('classes');
            const today = U.rel(0);
            const latest = classes.map((cl) => logs.filter((l) => l.class === cl.id).sort((a, b) => b.date.localeCompare(a.date))[0]).filter(Boolean);
            const sum = (l, k) => Object.values(l.records).filter((x) => x === k).length;
            const P = latest.reduce((a, l) => a + sum(l, 'P'), 0), L = latest.reduce((a, l) => a + sum(l, 'L'), 0), A = latest.reduce((a, l) => a + sum(l, 'A'), 0);
            const marked = classes.filter((cl) => logs.some((l) => l.class === cl.id && l.date === today)).length;
            $('#aKpis', el).innerHTML = [
                ui().kpi({ label: 'School Attendance', value: '94.6', suffix: '%', icon: 'fa-school', box: 'green', trend: 'All 96 sections (live)' }),
                ui().kpi({ label: 'Sample: Present', value: P, icon: 'fa-circle-check', box: '' }),
                ui().kpi({ label: 'Sample: Late', value: L, icon: 'fa-clock', box: 'gold' }),
                ui().kpi({ label: 'Sample: Absent', value: A, icon: 'fa-circle-xmark', box: 'red' }),
                ui().kpi({ label: 'Marked Today', value: `${marked}/${classes.length}`, icon: 'fa-list-check', box: 'purple', trend: 'Demo classes' })
            ].join('');
            $('#aStatus', el).innerHTML = classes.map((cl) => { const l = logs.find((x) => x.class === cl.id && x.date === today); return `<li class="list-item"><span class="icon-box sm ${l ? 'green' : 'gold'}"><i class="fa-solid ${l ? 'fa-circle-check' : 'fa-hourglass-half'}"></i></span><div class="grow"><h5>${cl.id}</h5><small>${esc(D().teacher(cl.classTeacher).name)}</small></div>${l ? `<span class="badge badge-success">${l.time}</span>` : '<span class="badge badge-warning">Pending</span>'}</li>`; }).join('');
            $('#aRows', el).innerHTML = latest.map((l) => { const t = Object.values(l.records).length; const pct = Math.round(((t - sum(l, 'A')) / t) * 100); const cl = classes.find((x) => x.id === l.class); return `<tr><td><strong>${l.class}</strong></td><td>${esc(D().teacher(cl.classTeacher).name)}</td><td>${fmtDate(l.date)}</td><td class="text-success fw-600">${sum(l, 'P')}</td><td class="text-warning fw-600">${sum(l, 'L')}</td><td class="text-danger fw-600">${sum(l, 'A')}</td><td style="min-width:160px"><div class="flex items-center gap-8"><div class="progress sm" style="flex:1"><span style="width:${pct}%" class=""></span></div><strong>${pct}%</strong></div></td></tr>`; }).join('');
        };
        draw();
        const logs = EDU.db.all('attendanceLog');
        const dates = [...new Set(logs.map((l) => l.date))].sort().slice(-10);
        EDU.charts.make($('#aTrend', el), { type: 'line', data: { labels: dates.map((d) => fmtDate(d, { short: true })), datasets: EDU.db.all('classes').map((cl) => ({ label: cl.id, fill: false, data: dates.map((d) => { const l = logs.find((x) => x.class === cl.id && x.date === d); if (!l) return null; const v = Object.values(l.records); return +((v.filter((x) => x !== 'A').length / v.length) * 100).toFixed(1); }) })) }, options: { scales: { y: { min: 70, max: 100 } }, spanGaps: true } });
        c.on('db:attendanceLog', () => { draw(); EDU.toast.info('Live update', 'A teacher just saved attendance.'); });
        $('#aCsv', el).addEventListener('click', () => { U.download('attendance_classes.csv', U.toCSV([['Class', 'Date', 'Student', 'Status'], ...EDU.db.all('attendanceLog').flatMap((l) => Object.entries(l.records).map(([sid, v]) => [l.class, l.date, sid, STATUS[v][1]]))]), 'text/csv'); EDU.toast.success('Export ready'); });
    }

    EDU.views.attendance = {
        title: 'Attendance',
        render: (c) => (c.role === 'teacher' ? teacherView(c) : c.role === 'admin' ? adminView(c) : studentView(c)),
        mount: (el, c) => (c.role === 'teacher' ? teacherMount(el, c) : c.role === 'admin' ? adminMount(el, c) : studentMount(el, c))
    };
    EDU.attendanceUI = { calendar };
})(window.EDU);
