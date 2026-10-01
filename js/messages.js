/* ==========================================================================
   Messaging — inbox / sent / starred, search, compose with attachments UI,
   read/unread state, simulated replies (real-time), unread counters.
   Messages are addressed by email so every portal user can talk to any
   other (admin, teacher, student, parent).
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, timeAgo } = U;
    EDU.views = EDU.views || {};

    /* Directory of everyone who can send / receive messages */
    function directory() {
        const map = {};
        EDU.db.all('users').forEach((u) => { map[u.email] = { email: u.email, name: u.name, role: u.role, photo: u.photo, title: u.title }; });
        EDU.db.all('teachers').forEach((t) => { if (!map[t.email]) map[t.email] = { email: t.email, name: t.name, role: 'teacher', photo: t.photo, title: t.designation }; });
        return map;
    }
    const person = (email) => directory()[email] || { email, name: email.split('@')[0], role: 'user' };

    const messages = {
        directory, person,
        mine(u) { return EDU.db.all('messages').filter((m) => m.to === u.email || m.from === u.email); },
        unread(u) { return EDU.db.all('messages').filter((m) => m.to === u.email && !m.read).length; },
        send(from, to, subject, body, attachments = []) {
            return EDU.db.insert('messages', { id: U.uid('M'), from, to, subject, body, date: new Date().toISOString(), read: false, attachments, starred: false });
        }
    };

    const REPLIES = [
        'Thank you for your message. I have noted this and will get back to you with details shortly.',
        'Thanks for reaching out! That sounds good — let\'s discuss this further during tomorrow\'s session.',
        'Received, thank you. I\'ll review it and share feedback by end of day.',
        'Noted. Please feel free to drop by the staff room during the lunch break if you need anything else.'
    ];

    EDU.views.messages = {
        title: 'Messages', icon: 'fa-envelope',
        render: () => `
            <div class="page-head"><div><h2>Messages</h2><p>Secure communication between students, parents, teachers and administration.</p></div>
                <div class="actions"><button class="btn btn-primary" data-compose><i class="fa-solid fa-pen"></i> Compose</button></div></div>
            <div class="panel mail" id="mail">
                <div class="mail-folders" role="tablist" aria-label="Folders">
                    <button class="side-link active" data-folder="inbox"><i class="fa-solid fa-inbox"></i> Inbox <span class="side-count" id="cInbox"></span></button>
                    <button class="side-link" data-folder="unread"><i class="fa-solid fa-envelope"></i> Unread</button>
                    <button class="side-link" data-folder="starred"><i class="fa-solid fa-star"></i> Starred</button>
                    <button class="side-link" data-folder="sent"><i class="fa-solid fa-paper-plane"></i> Sent</button>
                </div>
                <div class="mail-list">
                    <div class="search-field"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="mailSearch" placeholder="Search messages" aria-label="Search messages"></div>
                    <div class="mail-items" id="mailItems"></div>
                </div>
                <div class="mail-read" id="mailRead"></div>
            </div>`,
        mount(el, ctx) {
            const u = ctx.user;
            let folder = 'inbox', q = '', openId = null;
            const mail = $('#mail', el);

            const list = () => {
                let l = messages.mine(u);
                if (folder === 'inbox') l = l.filter((m) => m.to === u.email);
                if (folder === 'unread') l = l.filter((m) => m.to === u.email && !m.read);
                if (folder === 'sent') l = l.filter((m) => m.from === u.email);
                if (folder === 'starred') l = l.filter((m) => m.starred);
                if (q) l = l.filter((m) => `${m.subject} ${m.body} ${person(m.from).name} ${person(m.to).name}`.toLowerCase().includes(q));
                return l.sort((a, b) => b.date.localeCompare(a.date));
            };

            const drawList = () => {
                const l = list();
                const c = messages.unread(u);
                $('#cInbox', el).textContent = c || ''; $('#cInbox', el).dataset.count = c;
                $('#mailItems', el).innerHTML = l.length ? l.map((m) => {
                    const other = person(folder === 'sent' ? m.to : m.from);
                    const unread = m.to === u.email && !m.read;
                    return `<button class="mail-item${unread ? ' unread' : ''}${m.id === openId ? ' active' : ''}" data-id="${m.id}">
                        ${U.avatar(other, 'sm')}<div class="grow"><h5><span class="truncate">${folder === 'sent' ? 'To: ' : ''}${esc(other.name)}</span><small class="text-muted">${timeAgo(m.date)}</small></h5>
                        <div class="subj truncate">${m.starred ? '<i class="fa-solid fa-star text-warning"></i> ' : ''}${esc(m.subject)}</div><div class="prev truncate">${esc(m.body.replace(/\n/g, ' '))}</div></div></button>`;
                }).join('') : U.empty(folder === 'inbox' ? 'Inbox zero!' : 'No messages', q ? 'Nothing matches your search.' : 'Messages will appear here.', 'fa-envelope-open');
            };

            const drawRead = () => {
                const m = openId && EDU.db.find('messages', openId);
                const box = $('#mailRead', el);
                if (!m) { box.innerHTML = U.empty('Select a message', 'Choose a conversation from the list to read it.', 'fa-envelope-open-text'); return; }
                const from = person(m.from), to = person(m.to);
                box.innerHTML = `
                    <button class="btn btn-ghost btn-sm mail-back mb-16" data-back><i class="fa-solid fa-arrow-left"></i> Back</button>
                    <div class="mail-read-head"><div><h2>${esc(m.subject)}</h2>
                        <div class="flex items-center gap-12">${U.avatar(from)}<div><strong>${esc(from.name)}</strong> <span class="badge">${esc(U.cap(from.role))}</span><br><small class="text-muted">to ${esc(to.name)} · ${new Date(m.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></div></div></div>
                        <div class="flex gap-4"><button class="btn-icon bordered sm" data-star aria-label="Star message"><i class="fa-${m.starred ? 'solid' : 'regular'} fa-star ${m.starred ? 'text-warning' : ''}"></i></button>
                        ${m.to === u.email ? `<button class="btn-icon bordered sm" data-unread aria-label="Mark unread" data-tooltip="Mark unread"><i class="fa-regular fa-envelope"></i></button>` : ''}
                        <button class="btn-icon bordered sm" data-del aria-label="Delete message"><i class="fa-regular fa-trash-can"></i></button></div></div>
                    <div class="mail-body">${esc(m.body)}</div>
                    ${(m.attachments || []).map((a) => `<span class="attachment"><i class="fa-solid ${/\.(jpg|png)$/i.test(a) ? 'fa-file-image' : 'fa-file-pdf'}"></i>${esc(a)}<a href="#" data-dl="${esc(a)}" aria-label="Download ${esc(a)}"><i class="fa-solid fa-download"></i></a></span>`).join('')}
                    <div class="mt-32"><button class="btn btn-primary btn-sm" data-reply><i class="fa-solid fa-reply"></i> Reply</button> <button class="btn btn-ghost btn-sm" data-fwd><i class="fa-solid fa-share"></i> Forward</button></div>`;
            };

            const openMsg = (id) => {
                openId = id;
                const m = EDU.db.find('messages', id);
                if (m && m.to === u.email && !m.read) EDU.db.update('messages', id, { read: true });
                mail.classList.add('reading');
                drawList(); drawRead();
            };

            const compose = (pre = {}) => {
                const dir = Object.values(directory()).filter((p) => p.email !== u.email).sort((a, b) => a.name.localeCompare(b.name));
                const groups = ['admin', 'teacher', 'parent', 'student'];
                const m = EDU.modal.open({
                    title: '<i class="fa-solid fa-pen-to-square text-primary"></i> New Message', size: 'lg',
                    body: `<form id="composeForm" class="form-grid" novalidate>
                        <div class="form-group span-2"><label class="form-label" for="cTo">To <span class="req">*</span></label>
                            <select class="form-control" id="cTo" required><option value="">Select recipient…</option>${groups.map((g) => `<optgroup label="${U.cap(g)}s">${dir.filter((p) => p.role === g).map((p) => `<option value="${p.email}" ${pre.to === p.email ? 'selected' : ''}>${esc(p.name)} — ${esc(p.title || p.role)}</option>`).join('')}</optgroup>`).join('')}</select></div>
                        <div class="form-group span-2"><label class="form-label" for="cSubj">Subject <span class="req">*</span></label><input class="form-control" id="cSubj" required value="${esc(pre.subject || '')}" maxlength="120"></div>
                        <div class="form-group span-2"><label class="form-label" for="cBody">Message <span class="req">*</span></label><textarea class="form-control" id="cBody" required rows="7" data-rule="min:5">${esc(pre.body || '')}</textarea></div>
                        <div class="form-group span-2"><span class="form-label">Attachments</span><div class="dropzone" id="cDrop"><input type="file" id="cFiles" multiple aria-label="Attach files"><i class="fa-solid fa-paperclip"></i><p>Drag & drop files or <strong class="text-primary">browse</strong> (max 10 MB each)</p><div id="cFileList"></div></div></div>
                    </form>`,
                    footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="cSend"><i class="fa-solid fa-paper-plane"></i> Send Message</button>`
                });
                const form = $('#composeForm', m.el);
                EDU.validate.attach(form);
                const files = $('#cFiles', m.el);
                files.addEventListener('change', () => {
                    $('#cFileList', m.el).innerHTML = Array.from(files.files).map((f) => `<span class="file-name"><i class="fa-solid fa-file"></i>${esc(f.name)} (${Math.ceil(f.size / 1024)} KB)</span>`).join('<br>');
                    $('#cDrop', m.el).classList.toggle('has-file', files.files.length > 0);
                });
                $('#cSend', m.el).addEventListener('click', async (e) => {
                    if (!EDU.validate.form(form)) return;
                    const btn = e.currentTarget; btn.classList.add('loading');
                    await U.sleep(600);
                    const to = $('#cTo', m.el).value, subject = $('#cSubj', m.el).value.trim();
                    messages.send(u.email, to, subject, $('#cBody', m.el).value.trim(), Array.from(files.files).map((f) => f.name));
                    EDU.db.insert('notifications', { id: U.uid('NT'), target: (EDU.db.all('users').find((x) => x.email === to) || {}).id || 'none', text: `New message from ${u.name}: "${subject}"`, type: 'message', link: 'messages.html', time: new Date().toISOString(), read: false });
                    m.close();
                    EDU.toast.success('Message sent', `Delivered to ${person(to).name}.`);
                    // Simulated real-time reply
                    setTimeout(() => {
                        messages.send(to, u.email, 'Re: ' + subject.replace(/^Re:\s*/i, ''), `Hi ${u.name.split(' ')[0]},\n\n${REPLIES[Math.floor(Math.random() * REPLIES.length)]}\n\nRegards,\n${person(to).name}`);
                        EDU.notify.push(u.id, `New reply from ${person(to).name}: "Re: ${subject}"`, 'message', 'messages.html');
                    }, 6000 + Math.random() * 4000);
                });
            };

            el.addEventListener('click', async (e) => {
                const f = e.target.closest('[data-folder]');
                if (f) { folder = f.dataset.folder; $$('[data-folder]', el).forEach((x) => x.classList.toggle('active', x === f)); openId = null; mail.classList.remove('reading'); drawList(); drawRead(); return; }
                const it = e.target.closest('.mail-item'); if (it) return openMsg(it.dataset.id);
                if (e.target.closest('[data-compose]')) return compose();
                if (e.target.closest('[data-back]')) { mail.classList.remove('reading'); return; }
                const m = openId && EDU.db.find('messages', openId);
                if (!m) return;
                if (e.target.closest('[data-star]')) { EDU.db.update('messages', m.id, { starred: !m.starred }); drawRead(); drawList(); }
                if (e.target.closest('[data-unread]')) { EDU.db.update('messages', m.id, { read: false }); openId = null; mail.classList.remove('reading'); drawRead(); EDU.toast.info('Marked as unread'); }
                if (e.target.closest('[data-reply]')) compose({ to: m.from === u.email ? m.to : m.from, subject: 'Re: ' + m.subject.replace(/^Re:\s*/i, ''), body: `\n\n---- On ${new Date(m.date).toLocaleString('en-IN')}, ${person(m.from).name} wrote:\n${m.body}` });
                if (e.target.closest('[data-fwd]')) compose({ subject: 'Fwd: ' + m.subject, body: `\n\n---- Forwarded message ----\nFrom: ${person(m.from).name}\n\n${m.body}` });
                if (e.target.closest('[data-dl]')) { e.preventDefault(); U.download(e.target.closest('[data-dl]').dataset.dl.replace(/\.\w+$/, '.txt'), `EDUCARE demo attachment\n\nSubject: ${m.subject}\nFrom: ${person(m.from).name}`); }
                if (e.target.closest('[data-del]')) {
                    if (await EDU.modal.confirm({ title: 'Delete this message?', text: 'This action cannot be undone.', confirmText: 'Delete', danger: true })) {
                        EDU.db.remove('messages', m.id); openId = null; mail.classList.remove('reading'); drawRead(); EDU.toast.success('Message deleted');
                    }
                }
            });
            $('#mailSearch', el).addEventListener('input', U.debounce((e) => { q = e.target.value.trim().toLowerCase(); drawList(); }, 150));
            ctx.on('db:messages', () => { drawList(); });
            if (U.qs('compose')) compose({ to: U.qs('compose') });
            drawList(); drawRead();
        }
    };

    EDU.messages = messages;
})(window.EDU);
