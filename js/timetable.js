/* ==========================================================================
   Timetable — weekly grid (Mon–Sat, 8 AM – 3 PM), day filter, week
   navigation, live "NOW" indicator, class-detail modal, mobile scroll.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, fmtTime, fmtDate } = U;
    EDU.views = EDU.views || {};
    const D = () => EDU.data;

    function weekStart(offset) {
        const d = U.today();
        const dow = (d.getDay() + 6) % 7; // Monday = 0
        return U.addDays(d, -dow + offset * 7);
    }

    EDU.views.timetable = {
        title: 'Timetable',
        render(c) {
            const classes = EDU.db.all('classes').map((x) => x.id);
            const who = c.role === 'teacher' ? `${esc(c.teacher.name)} · ${D().teacherClasses(c.teacher).join(', ')}` : c.role === 'admin' ? 'All classes' : `${esc(c.student.name)} · Grade ${c.student.class}`;
            return `
            ${EDU.ui.pageHead('Timetable', who, `<button class="btn btn-soft btn-sm" onclick="window.print()"><i class="fa-solid fa-print"></i> Print</button>`)}
            <div class="toolbar">
                <div class="toolbar-group">
                    <button class="btn-icon bordered" data-week="-1" aria-label="Previous week"><i class="fa-solid fa-chevron-left"></i></button>
                    <strong id="weekLabel" style="min-width:210px;text-align:center"></strong>
                    <button class="btn-icon bordered" data-week="1" aria-label="Next week"><i class="fa-solid fa-chevron-right"></i></button>
                    <button class="btn btn-xs btn-soft" data-week="0">This week</button>
                    ${c.role === 'admin' ? `<select class="form-control sm" id="ttClass" style="width:auto" aria-label="Class">${classes.map((x) => `<option>${x}</option>`).join('')}</select>` : ''}
                </div>
                <div class="chip-group" id="dayChips" role="group" aria-label="Filter by day">
                    <button class="chip active" data-day="all">All days</button>${EDU.ref.WEEKDAYS.map((d) => `<button class="chip" data-day="${d}">${d.slice(0, 3)}</button>`).join('')}
                </div>
            </div>
            <section class="panel"><div class="panel-body"><div class="tt-scroll" id="ttWrap"></div></div></section>
            <div class="legend mt-16" id="ttLegend"></div>`;
        },
        mount(el, c) {
            let offset = 0, day = 'all';
            const week = () => {
                if (c.role === 'teacher') return D().teacherTimetable(c.teacher.id);
                if (c.role === 'admin') return D().timetable($('#ttClass', el).value);
                return D().timetable(c.student.class);
            };
            const draw = () => {
                const start = weekStart(offset);
                const days = EDU.ref.WEEKDAYS.filter((d) => day === 'all' || d === day);
                const w = week();
                const todayName = D().dayName();
                $('#weekLabel', el).textContent = `${fmtDate(U.toISO(start), { short: true })} – ${fmtDate(U.toISO(U.addDays(start, 5)))}`;
                let html = `<div class="tt-grid ${days.length === 1 ? 'single' : ''}" style="--days:${days.length}"><div></div>`;
                days.forEach((d, i) => {
                    const date = U.addDays(start, EDU.ref.WEEKDAYS.indexOf(d));
                    const isToday = offset === 0 && d === todayName;
                    html += `<div class="tt-head ${isToday ? 'today' : ''}">${d}<small>${fmtDate(U.toISO(date), { short: true })}</small></div>`;
                });
                EDU.ref.TIMES.forEach((t, s) => {
                    html += `<div class="tt-time">${fmtTime(t)}</div>`;
                    days.forEach((d) => {
                        const slot = (w[d] || [])[s] || { type: 'free' };
                        const isNow = offset === 0 && d === todayName && D().slotState(t) === 'now';
                        if (slot.type === 'break') { html += `<div class="tt-cell break"><i class="fa-solid fa-utensils"></i> Lunch</div>`; return; }
                        if (slot.type === 'free') { html += `<div class="tt-cell free">Free period</div>`; return; }
                        const sub = D().subject(slot.subject);
                        const teacher = slot.teacher ? D().teacher(slot.teacher).name : 'Activity mentors';
                        html += `<button class="tt-cell${isNow ? ' now' : ''}" style="--c:${sub.color}" data-d="${d}" data-s="${s}">
                            <span class="sub"><i class="fa-solid ${sub.icon}"></i>${esc(slot.subject)}</span>
                            <small><i class="fa-solid ${c.role === 'teacher' ? 'fa-users' : 'fa-user'}"></i>${esc(c.role === 'teacher' ? 'Class ' + slot.class : teacher)}</small>
                            <small><i class="fa-solid fa-door-open"></i>${esc(slot.room || '')}</small>
                            <small><i class="fa-regular fa-clock"></i>${fmtTime(t)} – ${fmtTime(EDU.ref.TIMES[s + 1] || '16:00')}</small></button>`;
                    });
                });
                $('#ttWrap', el).innerHTML = html + '</div>';
                const subjects = [...new Set(Object.values(w).flat().filter((x) => x.subject && !x.type).map((x) => x.subject))];
                $('#ttLegend', el).innerHTML = subjects.map((sName) => `<span><i style="background:${D().subject(sName).color}"></i>${esc(sName)}</span>`).join('');
            };
            el.addEventListener('click', (e) => {
                const wb = e.target.closest('[data-week]');
                if (wb) { offset = wb.dataset.week === '0' ? 0 : offset + +wb.dataset.week; draw(); return; }
                const ch = e.target.closest('[data-day]');
                if (ch) { day = ch.dataset.day; $$('[data-day]', el).forEach((x) => x.classList.toggle('active', x === ch)); draw(); return; }
                const cell = e.target.closest('.tt-cell[data-d]');
                if (cell) {
                    const slot = week()[cell.dataset.d][+cell.dataset.s];
                    const sub = D().subject(slot.subject);
                    const t = slot.teacher ? D().teacher(slot.teacher) : null;
                    EDU.modal.open({
                        title: `<i class="fa-solid ${sub.icon}" style="color:${sub.color}"></i> ${esc(slot.subject)}`, size: 'sm',
                        body: `<div class="detail-list" style="grid-template-columns:1fr 1fr">
                            <div><small>Day</small><strong>${cell.dataset.d}</strong></div><div><small>Time</small><strong>${fmtTime(slot.time)} – ${fmtTime(EDU.ref.TIMES[+cell.dataset.s + 1] || '16:00')}</strong></div>
                            <div><small>Room</small><strong>${esc(slot.room || '—')}</strong></div><div><small>${c.role === 'teacher' ? 'Class' : 'Teacher'}</small><strong>${esc(c.role === 'teacher' ? slot.class : t ? t.name : '—')}</strong></div></div>
                            ${t && c.role !== 'teacher' ? `<div class="flex items-center gap-12 mt-24 card" style="padding:14px">${U.avatar(t)}<div class="grow"><strong>${esc(t.name)}</strong><br><small class="text-muted">${esc(t.email)}</small></div></div>` : ''}`,
                        footer: `${t && c.role !== 'teacher' ? `<a class="btn btn-soft" href="messages.html?compose=${encodeURIComponent(t.email)}"><i class="fa-solid fa-envelope"></i> Message</a>` : ''}<a class="btn btn-primary" href="online-classes.html"><i class="fa-solid fa-video"></i> Online class</a>`
                    });
                }
            });
            const cls = $('#ttClass', el); cls && cls.addEventListener('change', draw);
            draw();
            c.every(60000, draw); // keep the NOW marker current
        }
    };
})(window.EDU);
