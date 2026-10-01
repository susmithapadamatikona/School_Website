/* ==========================================================================
   Results — student/parent report dashboard (overall %, GPA, grade, rank,
   subject performance, term comparison, growth), downloadable & printable
   report card; teacher/admin class result analysis.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, fmtDate } = U;
    EDU.views = EDU.views || {};
    const D = () => EDU.data;

    function reportCardHTML(s, exam) {
        const sum = D().examSummary(s.id, exam);
        const rank = D().classRank(s.id, exam);
        const att = D().attendanceStats(s.id);
        const cls = EDU.db.all('classes').find((x) => x.id === s.class) || {};
        return `<div class="doc-sheet" id="reportCard">
            <div class="doc-head"><div style="display:flex;gap:14px;align-items:center"><div style="width:54px;height:54px;border-radius:14px;background:linear-gradient(135deg,#013431,#159B78);color:#fff;display:grid;place-items:center;font-size:1.5rem">🎓</div>
                <div><h3 style="margin:0">EDUCARE International School</h3><p style="margin:0;font-size:.8rem">Gachibowli, Hyderabad · CBSE Affiliation No. 3630412</p></div></div>
                <div style="text-align:right"><strong style="color:#013431">REPORT CARD</strong><p style="margin:0;font-size:.8rem">${esc(exam)} · 2026–27</p></div></div>
            <table class="table table-plain" style="min-width:0;margin-bottom:18px"><tbody>
                <tr><td><small>Student</small><br><strong>${esc(s.name)}</strong></td><td><small>Student ID</small><br><strong>${s.id}</strong></td><td><small>Class</small><br><strong>${s.class} · Roll ${s.roll}</strong></td></tr>
                <tr><td><small>Date of Birth</small><br><strong>${fmtDate(s.dob)}</strong></td><td><small>Parent / Guardian</small><br><strong>${esc(s.parentName)}</strong></td><td><small>Class Teacher</small><br><strong>${esc(D().teacher(cls.classTeacher).name)}</strong></td></tr></tbody></table>
            <table class="table" style="min-width:0"><thead><tr><th>Subject</th><th>Marks</th><th>Max</th><th>Grade</th><th>Remarks</th></tr></thead><tbody>
                ${sum.rows.map((r) => `<tr><td>${esc(r.subject)}</td><td><strong>${r.marks}</strong></td><td>${r.max}</td><td>${r.grade}</td><td style="font-size:.82rem">${esc(r.remarks)}</td></tr>`).join('')}
                <tr style="background:#EDF4F3"><td><strong>Total</strong></td><td><strong>${sum.total}</strong></td><td>${sum.max}</td><td><strong>${sum.grade}</strong></td><td><strong>${sum.pct}% · GPA ${sum.gpa}</strong></td></tr></tbody></table>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0">
                ${[['Percentage', sum.pct + '%'], ['GPA', sum.gpa + ' / 10'], ['Class Rank', `${rank.rank} / ${rank.of}`], ['Attendance', att.pct + '%']].map(([l, v]) => `<div style="padding:12px;border-radius:12px;background:#F5FAFA;text-align:center"><small style="color:#526B72">${l}</small><br><strong style="font-size:1.15rem;color:#002522">${v}</strong></div>`).join('')}</div>
            <p style="font-size:.85rem"><strong>Class teacher's remarks:</strong> ${sum.pct >= 90 ? `${esc(s.name.split(' ')[0])} is a diligent and curious learner who consistently performs at an outstanding level. Keep aiming high!` : `${esc(s.name.split(' ')[0])} shows steady progress. Regular revision will help reach the next level.`}</p>
            <div style="display:flex;justify-content:space-between;margin-top:36px;font-size:.8rem;color:#526B72"><div>______________________<br>Class Teacher</div><div>______________________<br>Parent / Guardian</div><div style="text-align:right">______________________<br>Dr. Meera Krishnan, Principal</div></div>
            <p style="font-size:.7rem;color:#84959A;margin-top:18px">Grading: A1 91–100 · A2 81–90 · B1 71–80 · B2 61–70 · C1 51–60 · C2 41–50 · D 33–40 · E below 33. Generated ${new Date().toLocaleString('en-IN')}.</p></div>`;
    }

    function printHTML(html, title) {
        const w = window.open('', '_blank', 'width=900,height=1000');
        if (!w) { EDU.toast.warning('Pop-up blocked', 'Allow pop-ups to print, or use Download instead.'); return; }
        w.document.write(`<!DOCTYPE html><html><head><title>${esc(title)}</title><style>body{font-family:Inter,Arial,sans-serif;padding:30px;color:#173B43}table{width:100%;border-collapse:collapse}th,td{padding:8px 10px;border-bottom:1px solid #DDE9E8;text-align:left}th{background:#F5FAFA;font-size:.75rem;text-transform:uppercase;color:#526B72}.doc-head{display:flex;justify-content:space-between;border-bottom:2px solid #013431;padding-bottom:14px;margin-bottom:14px}h3{margin:0}.paid-stamp{display:inline-block;padding:6px 16px;border:3px solid #16A085;color:#16A085;border-radius:10px;font-weight:800;transform:rotate(-8deg)}</style></head><body>${html}<script>window.onload=function(){window.print()}<\/script></body></html>`);
        w.document.close();
    }
    const downloadHTML = (html, name, title) => U.download(name, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Inter,Arial,sans-serif;padding:30px;color:#173B43;max-width:900px;margin:auto}table{width:100%;border-collapse:collapse}th,td{padding:8px 10px;border-bottom:1px solid #DDE9E8;text-align:left}th{background:#F5FAFA;font-size:.75rem;text-transform:uppercase;color:#526B72}.doc-head{display:flex;justify-content:space-between;border-bottom:2px solid #013431;padding-bottom:14px;margin-bottom:14px}h3{margin:0}.paid-stamp{display:inline-block;padding:6px 16px;border:3px solid #16A085;color:#16A085;border-radius:10px;font-weight:800}</style></head><body>${html}</body></html>`, 'text/html');

    /* ---------------- Student / parent ---------------- */
    function studentView(c) {
        const s = c.student, ex = D().examNames(s.id);
        return `${EDU.ui.pageHead('Academic Results', `${esc(s.name)} · Grade ${s.class}`, `<label class="sr-only" for="rExam">Exam</label><select class="form-control sm" id="rExam" style="width:auto">${ex.slice().reverse().map((e) => `<option>${esc(e)}</option>`).join('')}</select><button class="btn btn-soft btn-sm" id="rPrint"><i class="fa-solid fa-print"></i> Print Result</button><button class="btn btn-primary btn-sm" id="rDl"><i class="fa-solid fa-file-arrow-down"></i> Download Report Card</button>`)}
            <div id="rBody"></div>`;
    }
    function studentMount(el, c) {
        const s = c.student;
        const draw = () => {
            EDU.charts.destroyAll();
            const exam = $('#rExam', el).value, sum = D().examSummary(s.id, exam), rank = D().classRank(s.id, exam);
            const ex = D().examNames(s.id);
            const classAvg = (subject) => { const r = EDU.db.all('results').filter((x) => x.class === s.class && x.exam === exam && x.subject === subject); return r.length > 1 ? +(r.reduce((a, x) => a + x.marks, 0) / r.length).toFixed(1) : null; };
            const best = sum.rows.slice().sort((a, b) => b.marks - a.marks)[0], weak = sum.rows.slice().sort((a, b) => a.marks - b.marks)[0];
            $('#rBody', el).innerHTML = `
                <div class="kpi-grid">
                    <div class="kpi" style="flex-direction:row;align-items:center;gap:18px"><div class="ring" style="--val:${sum.pct};--size:92px;--thick:10px"><div><strong style="font-size:1.2rem">${sum.pct}%</strong></div></div><div><span class="label">Overall Percentage</span><div class="small text-muted mt-8">${sum.total} / ${sum.max} marks</div></div></div>
                    ${EDU.ui.kpi({ label: 'GPA', value: sum.gpa, suffix: '/ 10', icon: 'fa-award', box: 'purple', trend: 'CBSE 10-point scale' })}
                    ${EDU.ui.kpi({ label: 'Overall Grade', value: sum.grade, icon: 'fa-star', box: 'gold', trend: sum.pct >= 91 ? '<b>Outstanding</b>' : sum.pct >= 81 ? '<b>Excellent</b>' : 'Good' })}
                    ${EDU.ui.kpi({ label: 'Class Rank', value: rank.rank, suffix: `of ${rank.of}`, icon: 'fa-ranking-star', box: 'teal', trend: `Top ${Math.max(1, Math.round((rank.rank / rank.of) * 100))}% of class` })}
                </div>
                <div class="dash-grid">
                    <div class="col-7">${EDU.ui.panel('Subject Performance', `<div class="table-wrap"><table class="table"><thead><tr><th>Subject</th><th>Marks</th><th style="min-width:110px">Score</th><th>Class Avg</th><th>Grade</th></tr></thead><tbody>${sum.rows.map((r) => { const avg = classAvg(r.subject); return `<tr><td><div class="cell-user">${EDU.ui.subjectChip(r.subject)}<div><strong>${esc(r.subject)}</strong><small>${esc(D().teacher(r.teacher).name)}</small></div></div></td><td><strong>${r.marks}</strong>/${r.max}</td><td><div class="progress sm ${r.marks >= 81 ? 'success' : r.marks >= 61 ? '' : 'warning'}"><span data-width="${r.marks}"></span></div></td><td>${avg ?? '—'}${avg ? (r.marks >= avg ? ' <i class="fa-solid fa-arrow-up text-success"></i>' : ' <i class="fa-solid fa-arrow-down text-danger"></i>') : ''}</td><td><span class="badge badge-${r.marks >= 81 ? 'success' : r.marks >= 61 ? 'primary' : 'warning'}">${r.grade}</span></td></tr>`; }).join('')}</tbody></table></div>`, { icon: 'fa-table', flush: true })}</div>
                    <div class="col-5">${EDU.ui.panel('Subject Marks', '<div class="chart-box lg"><canvas id="rSubj"></canvas></div>', { icon: 'fa-chart-column' })}</div>
                    <div class="col-6">${EDU.ui.panel('Term Comparison', '<div class="chart-box"><canvas id="rTerm"></canvas></div>', { icon: 'fa-layer-group' })}</div>
                    <div class="col-6">${EDU.ui.panel('Performance Growth', '<div class="chart-box"><canvas id="rGrowth"></canvas></div>', { icon: 'fa-arrow-trend-up' })}</div>
                    <div class="col-12">${EDU.ui.panel('Insights', `<div class="grid grid-3" style="gap:16px">
                        <div class="card" style="padding:18px"><span class="icon-box sm green mb-8"><i class="fa-solid fa-trophy"></i></span><h5 class="mb-0">Strongest subject</h5><p class="mb-0 small">${esc(best.subject)} — ${best.marks}% (${best.grade})</p></div>
                        <div class="card" style="padding:18px"><span class="icon-box sm gold mb-8"><i class="fa-solid fa-bullseye"></i></span><h5 class="mb-0">Focus area</h5><p class="mb-0 small">${esc(weak.subject)} — ${weak.marks}%. ${esc(weak.remarks)}</p></div>
                        <div class="card" style="padding:18px"><span class="icon-box sm purple mb-8"><i class="fa-solid fa-chart-line"></i></span><h5 class="mb-0">Trend</h5><p class="mb-0 small">${ex.length > 1 ? `${(sum.pct - D().examSummary(s.id, ex[Math.max(0, ex.indexOf(exam) - 1)]).pct >= 0 ? '+' : '')}${(sum.pct - D().examSummary(s.id, ex[Math.max(0, ex.indexOf(exam) - 1)]).pct).toFixed(1)}% vs previous exam` : 'First exam of the year'}</p></div></div>`, { icon: 'fa-lightbulb' })}</div>
                </div>`;
            EDU.charts.make($('#rSubj', el), { type: 'bar', data: { labels: sum.rows.map((r) => r.subject.replace('Computer Science', 'Comp. Sci').replace('Social Studies', 'Soc. St.')), datasets: [{ label: 'Your marks', data: sum.rows.map((r) => r.marks) }, { label: 'Class average', data: sum.rows.map((r) => classAvg(r.subject) || 0), color: '#C9DCDA' }] }, options: { indexAxis: 'y', scales: { x: { max: 100 }, y: { grid: { display: false } } } } });
            const subs = sum.rows.map((r) => r.subject);
            EDU.charts.make($('#rTerm', el), { type: 'bar', data: { labels: subs.map((x) => x.split(' ')[0]), datasets: ex.map((e) => ({ label: e, data: subs.map((sub) => (D().resultsFor(s.id).find((r) => r.exam === e && r.subject === sub) || {}).marks || 0) })) }, options: { scales: { y: { min: 40, max: 100 } } } });
            EDU.charts.make($('#rGrowth', el), { type: 'line', data: { labels: ex, datasets: [{ label: 'Overall %', data: ex.map((e) => D().examSummary(s.id, e).pct) }, { label: 'GPA × 10', data: ex.map((e) => D().examSummary(s.id, e).gpa * 10), color: '#F59E0B', fill: false, borderDash: [6, 4] }] }, options: { scales: { y: { min: 60, max: 100 } } } });
        };
        $('#rExam', el).addEventListener('change', draw);
        $('#rDl', el).addEventListener('click', () => {
            const exam = $('#rExam', el).value;
            const m = EDU.modal.open({ title: '<i class="fa-solid fa-file-lines text-primary"></i> Report Card Preview', size: 'lg', body: reportCardHTML(s, exam), footer: '<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-soft" id="rcPrint"><i class="fa-solid fa-print"></i> Print</button><button class="btn btn-primary" id="rcDl"><i class="fa-solid fa-download"></i> Download</button>' });
            $('#rcDl', m.el).addEventListener('click', () => { downloadHTML(reportCardHTML(s, exam), `ReportCard_${s.id}_${U.slug(exam)}.html`, 'Report Card'); EDU.toast.success('Report card downloaded', 'Open the file in any browser to view or save as PDF.'); });
            $('#rcPrint', m.el).addEventListener('click', () => printHTML(reportCardHTML(s, exam), 'Report Card'));
        });
        $('#rPrint', el).addEventListener('click', () => printHTML(reportCardHTML(s, $('#rExam', el).value), 'Result'));
        draw();
        c.on('db:results', () => { const cur = $('#rExam', el).value; c.rerender(); setTimeout(() => { const x = $('#rExam'); if (x) { x.value = cur; } }, 10); });
    }

    /* ---------------- Teacher / admin ---------------- */
    function staffView(c) {
        const classes = c.role === 'teacher' ? D().teacherClasses(c.teacher) : EDU.db.all('classes').map((x) => x.id);
        const exams = [...new Set(EDU.db.all('results').map((r) => r.exam))];
        const subjects = [...new Set(EDU.db.all('results').map((r) => r.subject))];
        return `${EDU.ui.pageHead('Results Analysis', 'Class-wise performance, grade distribution and toppers.', '<button class="btn btn-soft btn-sm" id="sCsv"><i class="fa-solid fa-download"></i> Export CSV</button><button class="btn btn-primary btn-sm" data-marks><i class="fa-solid fa-pen-to-square"></i> Enter Marks</button>')}
            <div class="toolbar"><div class="toolbar-group">
                <select class="form-control sm" id="sClass" style="width:auto" aria-label="Class">${classes.map((x) => `<option>${x}</option>`).join('')}</select>
                <select class="form-control sm" id="sExam" style="width:auto" aria-label="Exam">${exams.map((x) => `<option ${x === 'Quarterly Examination' ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
                <select class="form-control sm" id="sSubj" style="width:auto" aria-label="Subject">${subjects.map((x) => `<option ${c.teacher && x === c.teacher.department ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div></div>
            <div class="kpi-grid" id="sKpis"></div>
            <div class="dash-grid"><div class="col-8">${EDU.ui.panel('Student Results', '<div class="table-wrap"><table class="table"><thead><tr><th>Rank</th><th>Student</th><th>Marks</th><th>Grade</th><th>Remarks</th></tr></thead><tbody id="sRows"></tbody></table></div>', { icon: 'fa-table', flush: true })}</div>
            <div class="col-4">${EDU.ui.panel('Grade Distribution', '<div class="chart-box lg"><canvas id="sDist"></canvas></div>', { icon: 'fa-chart-pie' })}</div></div>`;
    }
    function staffMount(el, c) {
        let chart;
        const rows = () => EDU.db.all('results').filter((r) => r.class === $('#sClass', el).value && r.exam === $('#sExam', el).value && r.subject === $('#sSubj', el).value).sort((a, b) => b.marks - a.marks);
        const draw = () => {
            const r = rows();
            const m = r.map((x) => x.marks);
            $('#sKpis', el).innerHTML = [
                EDU.ui.kpi({ label: 'Students', value: r.length, icon: 'fa-users' }),
                EDU.ui.kpi({ label: 'Class Average', value: m.length ? (m.reduce((a, b) => a + b, 0) / m.length).toFixed(1) : '—', suffix: '%', icon: 'fa-chart-simple', box: 'teal' }),
                EDU.ui.kpi({ label: 'Highest', value: m.length ? Math.max(...m) : '—', suffix: '%', icon: 'fa-arrow-up', box: 'green' }),
                EDU.ui.kpi({ label: 'Pass Rate', value: m.length ? Math.round((m.filter((x) => x >= 33).length / m.length) * 100) : '—', suffix: '%', icon: 'fa-circle-check', box: 'purple' })
            ].join('');
            $('#sRows', el).innerHTML = r.length ? r.map((x, i) => { const st = D().student(x.studentId); return `<tr><td>${i < 3 ? `<span class="badge badge-gold">#${i + 1}</span>` : '#' + (i + 1)}</td><td><div class="cell-user">${U.avatar(st, 'sm')}<div><strong>${esc(st.name)}</strong><small>${st.id}</small></div></div></td><td><strong>${x.marks}</strong>/100</td><td><span class="badge badge-${x.marks >= 81 ? 'success' : x.marks >= 51 ? 'primary' : 'warning'}">${x.grade}</span></td><td class="small">${esc(x.remarks)}</td></tr>`; }).join('') : `<tr><td colspan="5">${U.empty('No results for this selection', 'Use "Enter Marks" to add them.', 'fa-square-poll-vertical')}</td></tr>`;
            const grades = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E'];
            const data = grades.map((g) => r.filter((x) => x.grade === g).length);
            if (chart) { chart.data.datasets[0].data = data; chart.update(); }
            else chart = EDU.charts.make($('#sDist', el), { type: 'doughnut', data: { labels: grades, datasets: [{ data, backgroundColor: ['#16A085', '#159B78', '#013431', '#2196F3', '#7356D8', '#F59E0B', '#EC4899', '#E74C3C'] }] }, options: { plugins: { legend: { position: 'bottom' } } } });
        };
        ['#sClass', '#sExam', '#sSubj'].forEach((s) => $(s, el).addEventListener('change', draw));
        el.addEventListener('click', (e) => { if (e.target.closest('[data-marks]')) EDU.exams.openMarks(c, { class: $('#sClass', el).value, subject: $('#sSubj', el).value }); });
        $('#sCsv', el).addEventListener('click', () => { U.download(`results_${$('#sClass', el).value}.csv`, U.toCSV([['Student ID', 'Name', 'Exam', 'Subject', 'Marks', 'Grade', 'Remarks'], ...rows().map((x) => [x.studentId, D().student(x.studentId).name, x.exam, x.subject, x.marks, x.grade, x.remarks])]), 'text/csv'); EDU.toast.success('CSV exported'); });
        c.on('db:results', draw);
        draw();
    }

    EDU.views.results = {
        title: 'Results',
        render: (c) => (['teacher', 'admin'].includes(c.role) ? staffView(c) : studentView(c)),
        mount: (el, c) => (['teacher', 'admin'].includes(c.role) ? staffMount(el, c) : studentMount(el, c))
    };
    EDU.docs = { printHTML, downloadHTML, reportCardHTML };
})(window.EDU);
