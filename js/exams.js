/* ==========================================================================
   Examinations — schedule, live countdown, status, latest results,
   performance chart; teachers/admin schedule exams and enter marks.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, fmtDate, fmtTime } = U;
    EDU.views = EDU.views || {};
    const D = () => EDU.data;

    const examStatus = (e) => {
        const d = U.diffDays(e.date);
        if (d < 0) return 'Completed';
        if (d === 0) { const st = D().slotState(e.start); return st === 'next' ? 'Scheduled' : 'Ongoing'; }
        return 'Scheduled';
    };

    function countdown(el, target) {
        const tick = () => {
            const ms = Math.max(0, target - Date.now());
            const v = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
            $$('.cd-box strong', el).forEach((b, i) => { b.textContent = String(v[i]).padStart(2, '0'); });
        };
        tick();
        return tick;
    }
    const cdHTML = (glass) => `<div class="countdown ${glass ? 'glass-cd' : ''}">${['Days', 'Hours', 'Minutes', 'Seconds'].map((l) => `<div class="cd-box"><strong>00</strong><small>${l}</small></div>`).join('')}</div>`;

    function openMarks(c, pre = {}) {
        const classes = c.role === 'teacher' ? D().teacherClasses(c.teacher) : EDU.db.all('classes').map((x) => x.id);
        const exams = ['Half-Yearly Examination', 'Quarterly Examination', 'Unit Test 2', 'Unit Test 1'];
        const subjDefault = c.role === 'teacher' && c.teacher.department === 'Mathematics' ? 'Mathematics' : 'English';
        const m = EDU.modal.open({
            title: '<i class="fa-solid fa-pen-to-square text-primary"></i> Enter Marks', size: 'xl',
            body: `<div class="form-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">
                    <div class="form-group"><label class="form-label" for="emExam">Exam</label><select class="form-control" id="emExam">${exams.map((x) => `<option ${pre.exam === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
                    <div class="form-group"><label class="form-label" for="emClass">Class</label><select class="form-control" id="emClass">${classes.map((x) => `<option ${pre.class === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
                    <div class="form-group"><label class="form-label" for="emSubj">Subject</label><select class="form-control" id="emSubj">${Object.keys(EDU.ref.SUBJECTS).filter((x) => !['Clubs & Activities'].includes(x)).map((x) => `<option ${x === (pre.subject || subjDefault) ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
                    <div class="form-group"><label class="form-label" for="emMax">Max marks</label><input class="form-control" type="number" id="emMax" value="100" min="10" max="100"></div></div>
                <div class="table-wrap mt-24"><table class="table"><thead><tr><th>Roll</th><th>Student</th><th>Marks</th><th>%</th><th>Grade</th><th>Remarks</th></tr></thead><tbody id="emRows"></tbody></table></div>
                <div class="flex gap-16 mt-16 small" id="emStats"></div>`,
            footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="emSave"><i class="fa-solid fa-floppy-disk"></i> Save & Publish</button>'
        });
        const q = (s) => $(s, m.el);
        const draw = () => {
            const list = D().studentsOf(q('#emClass').value);
            const existing = EDU.db.all('results').filter((r) => r.exam === q('#emExam').value && r.subject === q('#emSubj').value);
            q('#emRows').innerHTML = list.map((s) => { const r = existing.find((x) => x.studentId === s.id); return `<tr data-sid="${s.id}"><td>${s.roll}</td><td><div class="cell-user">${U.avatar(s, 'sm')}<strong>${esc(s.name)}</strong></div></td>
                <td><input class="form-control sm" type="number" min="0" data-m value="${r ? Math.round((r.marks / r.max) * q('#emMax').value) : ''}" style="width:90px" aria-label="Marks for ${esc(s.name)}"></td><td data-p>—</td><td data-g>—</td>
                <td><input class="form-control sm" data-r value="${esc(r ? r.remarks : '')}" placeholder="Remarks" aria-label="Remarks for ${esc(s.name)}"></td></tr>`; }).join('');
            calc();
        };
        const calc = () => {
            const max = +q('#emMax').value || 100;
            const vals = [];
            $$('tr[data-sid]', m.el).forEach((tr) => {
                const inp = $('[data-m]', tr); const v = inp.value === '' ? null : U.clamp(+inp.value, 0, max);
                inp.classList.toggle('is-invalid', inp.value !== '' && (+inp.value > max || +inp.value < 0));
                const p = v == null ? null : Math.round((v / max) * 100);
                $('[data-p]', tr).textContent = p == null ? '—' : p + '%';
                $('[data-g]', tr).innerHTML = p == null ? '—' : `<span class="badge badge-${p >= 81 ? 'success' : p >= 51 ? 'primary' : p >= 33 ? 'warning' : 'danger'}">${D().gradeOf(p)}</span>`;
                if (p != null) vals.push(p);
            });
            q('#emStats').innerHTML = vals.length ? `<span>Entered <strong>${vals.length}</strong></span><span>Average <strong>${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)}%</strong></span><span>Highest <strong>${Math.max(...vals)}%</strong></span><span>Pass rate <strong>${Math.round((vals.filter((x) => x >= 33).length / vals.length) * 100)}%</strong></span>` : '<span class="text-muted">Enter marks to see live statistics.</span>';
        };
        ['#emExam', '#emClass', '#emSubj'].forEach((s) => q(s).addEventListener('change', draw));
        q('#emMax').addEventListener('input', calc);
        m.el.addEventListener('input', (e) => { if (e.target.matches('[data-m]')) calc(); });
        q('#emSave').addEventListener('click', async (e) => {
            if ($$('[data-m].is-invalid', m.el).length) return EDU.toast.error('Invalid marks', 'Some marks exceed the maximum.');
            e.currentTarget.classList.add('loading'); await U.sleep(700);
            const max = +q('#emMax').value || 100, exam = q('#emExam').value, subject = q('#emSubj').value, cls = q('#emClass').value;
            const results = EDU.db.all('results');
            let n = 0;
            $$('tr[data-sid]', m.el).forEach((tr) => {
                const v = $('[data-m]', tr).value; if (v === '') return;
                const pct = Math.round((U.clamp(+v, 0, max) / max) * 100);
                const id = `R-${tr.dataset.sid}-${U.slug(exam)}-${U.slug(subject)}`;
                const rec = { id, studentId: tr.dataset.sid, class: cls, exam, date: U.rel(0), subject, marks: pct, max: 100, grade: D().gradeOf(pct), remarks: $('[data-r]', tr).value.trim() || (pct >= 81 ? 'Very good work.' : pct >= 51 ? 'Good effort — keep practising.' : 'Needs improvement.'), teacher: c.teacher ? c.teacher.id : null };
                const i = results.findIndex((r) => r.id === id);
                if (i >= 0) results[i] = { ...results[i], ...rec, date: results[i].date }; else results.push(rec);
                n++;
                const u = EDU.db.all('users').find((x) => x.studentId === tr.dataset.sid);
                if (u) EDU.notify.push(u.id, `${subject} marks published for ${exam}: ${pct}% (${D().gradeOf(pct)}).`, 'result', 'results.html', { silent: true });
            });
            EDU.store.set('results', results);
            m.close();
            EDU.toast.success('Marks published', `${n} results saved for ${cls} · ${subject}.`);
        });
        draw();
    }

    function openSchedule(c) {
        const classes = c.role === 'teacher' ? D().teacherClasses(c.teacher) : EDU.db.all('classes').map((x) => x.id);
        const m = EDU.modal.open({
            title: '<i class="fa-solid fa-calendar-plus text-primary"></i> Schedule Exam',
            body: `<form id="exForm" class="form-grid" novalidate>
                <div class="form-group span-2"><label class="form-label" for="xName">Exam name <span class="req">*</span></label><input class="form-control" id="xName" required value="Unit Test 3"></div>
                <div class="form-group"><label class="form-label" for="xClass">Class</label><select class="form-control" id="xClass">${classes.map((x) => `<option>${x}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label" for="xSubj">Subject</label><select class="form-control" id="xSubj">${Object.keys(EDU.ref.SUBJECTS).filter((x) => x !== 'Clubs & Activities').map((x) => `<option ${c.teacher && x === c.teacher.department ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label" for="xDate">Date <span class="req">*</span></label><input class="form-control" type="date" id="xDate" required min="${U.rel(0)}" value="${U.rel(14)}"></div>
                <div class="form-group"><label class="form-label" for="xTime">Start time</label><input class="form-control" type="time" id="xTime" value="10:00"></div>
                <div class="form-group"><label class="form-label" for="xDur">Duration (minutes)</label><input class="form-control" type="number" id="xDur" value="60" min="15" max="240"></div>
                <div class="form-group"><label class="form-label" for="xRoom">Room <span class="req">*</span></label><input class="form-control" id="xRoom" required value="Exam Hall A"></div></form>`,
            footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="xSave">Schedule</button>'
        });
        EDU.validate.attach($('#exForm', m.el));
        $('#xSave', m.el).addEventListener('click', () => {
            if (!EDU.validate.form($('#exForm', m.el))) return;
            const [h, mi] = $('#xTime', m.el).value.split(':').map(Number);
            const endM = h * 60 + mi + (+$('#xDur', m.el).value || 60);
            const e = { id: U.uid('EX'), name: $('#xName', m.el).value.trim(), term: 'Term 1', class: $('#xClass', m.el).value, subject: $('#xSubj', m.el).value, date: $('#xDate', m.el).value, start: $('#xTime', m.el).value, end: `${U.pad(Math.floor(endM / 60))}:${U.pad(endM % 60)}`, room: $('#xRoom', m.el).value.trim(), maxMarks: 100, teacher: c.teacher ? c.teacher.id : null };
            EDU.db.insert('exams', e);
            EDU.notify.push('role:student', `${e.subject} ${e.name} scheduled on ${fmtDate(e.date)} at ${fmtTime(e.start)} (${e.room}).`, 'exam', 'exams.html', { silent: true });
            m.close();
            EDU.toast.success('Exam scheduled', 'Students and parents have been notified.');
        });
    }

    EDU.views.exams = {
        title: 'Exams',
        render(c) {
            const staff = c.role === 'teacher' || c.role === 'admin';
            if (staff) return `${EDU.ui.pageHead('Examination Management', c.role === 'teacher' ? `Exams for ${D().teacherClasses(c.teacher).join(', ')}` : 'All classes', '<button class="btn btn-soft" data-sched><i class="fa-solid fa-calendar-plus"></i> Schedule Exam</button><button class="btn btn-primary" data-marks><i class="fa-solid fa-pen-to-square"></i> Enter Marks</button>')}
                <div class="kpi-grid" id="xKpis"></div>
                <div class="dash-grid"><div class="col-8">${EDU.ui.panel('Exam Schedule', '<div class="table-wrap"><table class="table"><thead><tr><th>Exam</th><th>Class</th><th>Subject</th><th>Date</th><th>Time</th><th>Room</th><th>Status</th></tr></thead><tbody id="xRows"></tbody></table></div>', { icon: 'fa-calendar-days', flush: true, actions: '<select class="form-control sm" id="xFilter" style="width:auto" aria-label="Filter"><option value="upcoming">Upcoming</option><option value="all">All</option><option value="done">Completed</option></select>' })}</div>
                <div class="col-4">${EDU.ui.panel('Class Averages', '<div class="chart-box lg"><canvas id="xAvg"></canvas></div>', { icon: 'fa-chart-column', sub: 'Quarterly Examination' })}</div></div>`;
            const s = c.student;
            const up = D().upcomingExams(s.class, 60);
            const ex = D().examNames(s.id), last = ex[ex.length - 1], sum = D().examSummary(s.id, last);
            return `${EDU.ui.pageHead('Examinations', `${esc(s.name)} · Grade ${s.class}`, '<button class="btn btn-soft btn-sm" onclick="window.print()"><i class="fa-solid fa-print"></i> Print date sheet</button>')}
                ${up[0] ? `<div class="live-class-card mb-24" style="background:var(--primary-gradient)"><div><span class="badge" style="background:rgba(255,255,255,.2);color:#fff"><i class="fa-solid fa-hourglass-half"></i> Next exam</span><h3>${esc(up[0].subject)} — ${esc(up[0].name)}</h3><p>${fmtDate(up[0].date, { long: true })} · ${fmtTime(up[0].start)} – ${fmtTime(up[0].end)} · ${esc(up[0].room)}</p></div><div id="xCd" style="min-width:300px">${cdHTML(true)}</div></div>` : ''}
                <div class="dash-grid">
                    <div class="col-7">${EDU.ui.panel('Exam Schedule', `<div class="table-wrap"><table class="table"><thead><tr><th>Subject</th><th>Exam</th><th>Date</th><th>Time</th><th>Room</th><th>Status</th></tr></thead><tbody>${D().examsFor(s.class).filter((e) => U.diffDays(e.date) >= -3).map((e) => `<tr><td><div class="cell-user">${EDU.ui.subjectChip(e.subject)}<strong>${esc(e.subject)}</strong></div></td><td>${esc(e.name)}</td><td class="nowrap">${fmtDate(e.date)}<br><small class="text-muted">${U.relLabel(e.date)}</small></td><td class="nowrap">${fmtTime(e.start)} – ${fmtTime(e.end)}</td><td>${esc(e.room)}</td><td>${U.statusBadge(examStatus(e))}</td></tr>`).join('')}</tbody></table></div>`, { icon: 'fa-calendar-days', flush: true })}</div>
                    <div class="col-5">${EDU.ui.panel('Performance', '<div class="chart-box lg"><canvas id="xPerf"></canvas></div>', { icon: 'fa-chart-line', sub: 'Last two exams' })}</div>
                    <div class="col-12">${EDU.ui.panel(`Latest Results · ${esc(last || '')}`, sum ? `<div class="table-wrap"><table class="table"><thead><tr><th>Subject</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Teacher Remarks</th></tr></thead><tbody>${sum.rows.map((r) => `<tr><td><div class="cell-user">${EDU.ui.subjectChip(r.subject)}<strong>${esc(r.subject)}</strong></div></td><td><strong>${r.marks}</strong> / ${r.max}</td><td style="min-width:160px"><div class="flex items-center gap-8"><div class="progress sm" style="flex:1"><span data-width="${r.marks}"></span></div>${r.marks}%</div></td><td><span class="badge badge-${r.marks >= 81 ? 'success' : r.marks >= 61 ? 'primary' : 'warning'}">${r.grade}</span></td><td class="small">${esc(r.remarks)}</td></tr>`).join('')}</tbody></table></div>` : U.empty('No results yet'), { icon: 'fa-square-poll-vertical', flush: true, actions: '<a class="btn btn-xs btn-primary" href="results.html">Full report</a>' })}</div>
                </div>`;
        },
        mount(el, c) {
            const staff = c.role === 'teacher' || c.role === 'admin';
            if (!staff) {
                const s = c.student, up = D().upcomingExams(s.class, 60);
                if (up[0]) { const [h, m] = up[0].start.split(':').map(Number); const t = U.parse(up[0].date); t.setHours(h, m); const tick = countdown($('#xCd', el), t.getTime()); c.every(1000, tick); }
                const ex = D().examNames(s.id).slice(-2);
                const subs = [...new Set(D().resultsFor(s.id).map((r) => r.subject))];
                EDU.charts.make($('#xPerf', el), { type: 'radar', data: { labels: subs.map((x) => x.replace('Computer Science', 'CS').replace('Social Studies', 'SST')), datasets: ex.map((e, i) => ({ label: e, data: subs.map((sub) => (D().resultsFor(s.id).find((r) => r.exam === e && r.subject === sub) || {}).marks || 0), color: i ? '#013431' : '#159B78' })) }, options: { scales: { r: { min: 40, max: 100 } } } });
                return;
            }
            const classes = c.role === 'teacher' ? D().teacherClasses(c.teacher) : EDU.db.all('classes').map((x) => x.id);
            const draw = () => {
                const f = $('#xFilter', el).value;
                let list = EDU.db.all('exams').filter((e) => classes.includes(e.class) && (c.role === 'admin' || e.teacher === c.teacher.id));
                if (f === 'upcoming') list = list.filter((e) => U.diffDays(e.date) >= 0);
                if (f === 'done') list = list.filter((e) => U.diffDays(e.date) < 0);
                list.sort((a, b) => a.date.localeCompare(b.date));
                $('#xRows', el).innerHTML = list.length ? list.map((e) => `<tr><td><strong>${esc(e.name)}</strong></td><td>${e.class}</td><td><div class="cell-user">${EDU.ui.subjectChip(e.subject)}${esc(e.subject)}</div></td><td class="nowrap">${fmtDate(e.date)}</td><td class="nowrap">${fmtTime(e.start)} – ${fmtTime(e.end)}</td><td>${esc(e.room)}</td><td>${U.statusBadge(examStatus(e))}</td></tr>`).join('') : `<tr><td colspan="7">${U.empty('No exams in this view')}</td></tr>`;
                const all = EDU.db.all('exams').filter((e) => classes.includes(e.class) && (c.role === 'admin' || e.teacher === c.teacher.id));
                $('#xKpis', el).innerHTML = [
                    EDU.ui.kpi({ label: 'Upcoming', value: all.filter((e) => U.diffDays(e.date) >= 0).length, icon: 'fa-calendar-days', box: '' }),
                    EDU.ui.kpi({ label: 'This Week', value: all.filter((e) => U.diffDays(e.date) >= 0 && U.diffDays(e.date) < 7).length, icon: 'fa-hourglass-half', box: 'gold' }),
                    EDU.ui.kpi({ label: 'Completed', value: all.filter((e) => U.diffDays(e.date) < 0).length, icon: 'fa-circle-check', box: 'green' }),
                    EDU.ui.kpi({ label: 'Results Published', value: new Set(EDU.db.all('results').filter((r) => classes.includes(r.class)).map((r) => r.exam + r.class + r.subject)).size, icon: 'fa-square-poll-vertical', box: 'purple' })
                ].join('');
            };
            $('#xFilter', el).addEventListener('change', draw);
            draw();
            const subj = c.role === 'teacher' ? 'Mathematics' : null;
            const avg = classes.map((cls) => { const r = EDU.db.all('results').filter((x) => x.class === cls && x.exam === 'Quarterly Examination' && (!subj || x.subject === subj)); return r.length ? +(r.reduce((a, x) => a + x.marks, 0) / r.length).toFixed(1) : 0; });
            EDU.charts.make($('#xAvg', el), { type: 'bar', data: { labels: classes, datasets: [{ label: 'Average %', data: avg, backgroundColor: EDU.charts.SERIES }] }, options: { plugins: { legend: { display: false } }, scales: { y: { max: 100 } } } });
            el.addEventListener('click', (e) => { if (e.target.closest('[data-marks]')) openMarks(c); if (e.target.closest('[data-sched]')) openSchedule(c); });
            c.on('db:exams', draw);
        }
    };

    EDU.exams = { openMarks, openSchedule, countdown, cdHTML, examStatus };
})(window.EDU);
