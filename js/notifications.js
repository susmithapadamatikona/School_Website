/* ==========================================================================
   Notification system — bell dropdown, counters, mark read / clear all,
   full notifications view, and a simulated real-time push stream.
   Each notification targets a user id, "role:<role>" or "all". Read and
   cleared state is tracked per user (readBy / clearedBy).
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, timeAgo } = U;
    EDU.views = EDU.views || {};

    const TYPE = {
        homework: ['fa-book', ''], assignment: ['fa-file-pen', 'purple'], exam: ['fa-file-signature', 'red'], result: ['fa-chart-line', 'green'],
        fee: ['fa-indian-rupee-sign', 'gold'], meeting: ['fa-people-arrows', 'teal'], notice: ['fa-bullhorn', 'sky'], message: ['fa-envelope', ''],
        attendance: ['fa-user-check', 'green'], bus: ['fa-bus', 'gold'], library: ['fa-book-bookmark', 'pink'], event: ['fa-calendar-check', 'purple'],
        admission: ['fa-user-plus', 'teal'], class: ['fa-video', 'red']
    };

    const me = () => EDU.auth.user();
    const targets = (u) => [u.id, 'role:' + u.role, 'all'];
    const isRead = (n, u) => n.read === true || (n.readBy || []).includes(u.id);

    const notify = {
        TYPE,
        list(u = me()) {
            if (!u) return [];
            const t = targets(u);
            return EDU.db.all('notifications').filter((n) => t.includes(n.target) && !(n.clearedBy || []).includes(u.id)).sort((a, b) => b.time.localeCompare(a.time));
        },
        unread(u = me()) { return notify.list(u).filter((n) => !isRead(n, u)).length; },
        isRead,
        push(target, text, type = 'notice', link = '', opts = {}) {
            const n = { id: U.uid('NT'), target, text, type, link, time: new Date().toISOString(), read: false, readBy: [], clearedBy: [] };
            EDU.db.insert('notifications', n);
            const u = me();
            if (u && targets(u).includes(target) && !opts.silent) notify.toast(n);
            return n;
        },
        toast(n) {
            EDU.toast.info('New notification', n.text, 5200);
            $$('.bell-btn').forEach((b) => { b.classList.remove('bell-shake'); void b.offsetWidth; b.classList.add('bell-shake'); });
        },
        markRead(id, u = me()) { EDU.db.update('notifications', id, (n) => ({ ...n, readBy: [...new Set([...(n.readBy || []), u.id])] })); },
        markAll(u = me()) {
            const ids = new Set(notify.list(u).map((n) => n.id));
            EDU.store.set('notifications', EDU.db.all('notifications').map((n) => ids.has(n.id) ? { ...n, readBy: [...new Set([...(n.readBy || []), u.id])] } : n));
        },
        clearAll(u = me()) {
            const ids = new Set(notify.list(u).map((n) => n.id));
            EDU.store.set('notifications', EDU.db.all('notifications').map((n) => ids.has(n.id) ? { ...n, clearedBy: [...new Set([...(n.clearedBy || []), u.id])] } : n));
        },
        item(n, u = me()) {
            const [icon, box] = TYPE[n.type] || TYPE.notice;
            return `<div class="notif-item${isRead(n, u) ? '' : ' unread'}" data-nid="${n.id}" data-link="${esc(n.link || '')}" role="button" tabindex="0">
                <span class="icon-box ${box}"><i class="fa-solid ${icon}"></i></span>
                <div><p>${esc(n.text)}</p><small>${timeAgo(n.time)}</small></div></div>`;
        },

        /* Bell dropdown in topbar */
        mountBell(wrap) {
            const u = me();
            const render = () => {
                const list = notify.list(u);
                const unread = notify.unread(u);
                $$('[data-notif-count]').forEach((c) => { c.textContent = unread || ''; c.dataset.count = unread; });
                const panel = $('.notif-list', wrap);
                if (panel) panel.innerHTML = list.length ? list.slice(0, 8).map((n) => notify.item(n, u)).join('') : U.empty('You\'re all caught up', 'No notifications right now.', 'fa-bell-slash');
            };
            wrap.innerHTML = `
                <button class="btn-icon bell-btn" aria-label="Notifications" aria-haspopup="true" aria-expanded="false"><i class="fa-regular fa-bell"></i><span class="count" data-notif-count></span></button>
                <div class="dropdown-panel notif-panel" role="menu">
                    <div class="notif-head"><h4>Notifications</h4><button class="btn btn-xs btn-soft" data-mark-all><i class="fa-solid fa-check-double"></i> Mark all read</button></div>
                    <div class="notif-list"></div>
                    <div class="notif-foot"><button class="btn btn-xs btn-ghost" data-clear-all><i class="fa-solid fa-trash-can"></i> Clear all</button><a class="btn btn-xs btn-primary" href="notifications.html">View all</a></div>
                </div>`;
            const btn = $('.bell-btn', wrap);
            btn.addEventListener('click', (e) => { e.stopPropagation(); const open = !wrap.classList.contains('open'); EDU.portal && EDU.portal.closeDropdowns(); wrap.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); });
            wrap.addEventListener('click', (e) => {
                if (e.target.closest('[data-mark-all]')) { notify.markAll(u); EDU.toast.success('Done', 'All notifications marked as read.'); }
                if (e.target.closest('[data-clear-all]')) { notify.clearAll(u); EDU.toast.success('Cleared', 'Notifications cleared.'); }
                const it = e.target.closest('.notif-item');
                if (it) { notify.markRead(it.dataset.nid, u); if (it.dataset.link) location.href = it.dataset.link; }
            });
            wrap.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('notif-item')) e.target.click(); });
            EDU.bus.on('db:notifications', render);
            render();
            setInterval(render, 60000); // refresh "x min ago"
        },

        /* Simulated server push — random, role-relevant events */
        startStream() {
            const u = me();
            if (!u) return;
            const pools = {
                student: [
                    ['Your Mathematics assignment is due tomorrow.', 'homework', 'homework.html'],
                    ['Science exam starts at 10:00 AM — carry your admit card.', 'exam', 'exams.html'],
                    ['New study material uploaded: "Half-Yearly Practice Paper Set B".', 'assignment', 'assignments.html'],
                    ['Live class "Physics — Refraction" starts in 5 minutes.', 'class', 'online-classes.html'],
                    ['New announcement from the school.', 'notice', 'notices.html'],
                    ['Library: "Wings of Fire" is due tomorrow.', 'library', 'library-dashboard.html']
                ],
                parent: [
                    ['Parent-Teacher Meeting scheduled for Friday.', 'meeting', 'notices.html'],
                    ['Fee payment is due in 3 days.', 'fee', 'fees-dashboard.html'],
                    ['Bus BUS-01 is 5 minutes away from KPHB Colony.', 'bus', 'bus-tracking.html'],
                    ['Ananya scored A+ in the Science worksheet.', 'result', 'results.html'],
                    ['New announcement from the school.', 'notice', 'notices.html']
                ],
                teacher: [
                    ['Aarav Sharma submitted "Quadratic Equations — Exercise 4.3".', 'homework', 'homework.html'],
                    ['Staff meeting at 3:45 PM in the Conference Hall.', 'meeting', 'notices.html'],
                    ['Reminder: Mark attendance for 10-B (Period 3).', 'attendance', 'attendance.html'],
                    ['New message from a parent.', 'message', 'messages.html']
                ],
                admin: [
                    ['New admission application received — Grade 6.', 'admission', 'admin-dashboard.html#admissions'],
                    ['Online fee payment received: ₹40,000 (STU2026017).', 'fee', 'fees-dashboard.html'],
                    ['BUS-04 reported a 10-minute delay on Route 4.', 'bus', 'bus-tracking.html'],
                    ['Attendance for Grade 9 marked by all class teachers.', 'attendance', 'attendance.html']
                ]
            };
            const pool = pools[u.role] || [];
            const tick = () => {
                const [text, type, link] = pool[Math.floor(Math.random() * pool.length)];
                notify.push(u.id, text, type, link);
                setTimeout(tick, 45000 + Math.random() * 30000);
            };
            setTimeout(tick, 20000 + Math.random() * 10000);
            // Cross-tab: toast when a notification for me appears from another tab/user action
            EDU.bus.on('remote-change', (key) => {
                if (key !== 'notifications') return;
                const latest = notify.list(u)[0];
                if (latest && !isRead(latest, u) && Date.now() - new Date(latest.time).getTime() < 8000) notify.toast(latest);
            });
        }
    };

    /* ---------------- Full notifications view ---------------- */
    EDU.views.notifications = {
        title: 'Notifications', icon: 'fa-bell',
        render: () => `
            <div class="page-head"><div><h2>Notifications</h2><p>Real-time alerts about classes, exams, fees, transport and announcements.</p></div>
                <div class="actions"><button class="btn btn-soft btn-sm" data-act="all"><i class="fa-solid fa-check-double"></i> Mark all as read</button><button class="btn btn-soft-danger btn-sm" data-act="clear"><i class="fa-solid fa-trash-can"></i> Clear all</button></div></div>
            <div class="panel"><div class="panel-head"><div class="tabs-list" role="tablist"><button class="tab-btn" aria-selected="true" data-f="all">All <span class="badge" id="nAll"></span></button><button class="tab-btn" aria-selected="false" data-f="unread">Unread <span class="badge badge-primary" id="nUnread"></span></button></div>
            <span class="flex items-center gap-8 small text-muted"><span class="live-dot green"></span> Live</span></div>
            <div class="panel-body flush" id="nList"></div></div>`,
        mount(el, ctx) {
            let f = 'all';
            const draw = () => {
                const list = notify.list(ctx.user);
                const shown = f === 'unread' ? list.filter((n) => !isRead(n, ctx.user)) : list;
                $('#nAll', el).textContent = list.length;
                $('#nUnread', el).textContent = list.filter((n) => !isRead(n, ctx.user)).length;
                $('#nList', el).innerHTML = shown.length ? shown.map((n) => notify.item(n, ctx.user).replace('</div></div>', `</div><div class="flex gap-4" style="margin-left:auto">${isRead(n, ctx.user) ? '' : `<button class="btn btn-xs btn-soft" data-read="${n.id}">Mark read</button>`}</div></div>`)).join('') : U.empty('You\'re all caught up!', 'New notifications will appear here instantly.', 'fa-bell-slash');
            };
            el.addEventListener('click', (e) => {
                const t = e.target.closest('.tab-btn');
                if (t) { f = t.dataset.f; $$('.tab-btn', el).forEach((b) => b.setAttribute('aria-selected', String(b === t))); draw(); return; }
                const r = e.target.closest('[data-read]');
                if (r) { e.stopPropagation(); notify.markRead(r.dataset.read, ctx.user); return; }
                const a = e.target.closest('[data-act]');
                if (a && a.dataset.act === 'all') { notify.markAll(ctx.user); EDU.toast.success('All caught up', 'Every notification is marked as read.'); }
                if (a && a.dataset.act === 'clear') EDU.modal.confirm({ title: 'Clear all notifications?', text: 'This removes them from your list.', confirmText: 'Clear all', danger: true }).then((ok) => { if (ok) { notify.clearAll(ctx.user); EDU.toast.success('Cleared', 'Your notification list is empty.'); } });
                const it = e.target.closest('.notif-item');
                if (it && !r) { notify.markRead(it.dataset.nid, ctx.user); if (it.dataset.link && !it.dataset.link.includes('notifications')) location.href = it.dataset.link; }
            });
            ctx.on('db:notifications', draw);
            draw();
        }
    };

    EDU.notify = notify;
})(window.EDU);
