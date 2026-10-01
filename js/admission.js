/* ==========================================================================
   Online admission — 5-step form with progress indicator, per-step
   validation, draft autosave, document uploads with previews, review
   screen, application ID generation, success modal and LocalStorage save.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc } = U;
    const DRAFT = 'admission-draft';

    function init() {
        const form = $('#admissionForm');
        if (!form) return;
        const steps = $$('.form-step', form);
        const stepper = $$('.stepper li');
        let cur = 0;
        EDU.validate.attach(form);

        // Prefill grade from ?grade=
        const g = U.qs('grade');
        if (g) { const opt = Array.from(form.grade.options).find((o) => o.text.toLowerCase().includes(g.toLowerCase().split(' ')[0])); if (opt) form.grade.value = opt.value; }

        // Restore draft (text fields only)
        const draft = EDU.store.get(DRAFT);
        if (draft) {
            Object.entries(draft).forEach(([k, v]) => { const f = form.elements[k]; if (f && f.type !== 'file' && f.type !== 'radio' && f.type !== 'checkbox') f.value = v; else if (f && f.length && f[0] && f[0].type === 'radio') Array.from(f).forEach((r) => { r.checked = r.value === v; }); });
            EDU.toast.info('Draft restored', 'We saved your progress from last time.');
        }
        const save = U.debounce(() => {
            const data = {};
            Array.from(form.elements).forEach((f) => { if (f.name && f.type !== 'file' && (f.type !== 'radio' || f.checked) && f.type !== 'checkbox') data[f.name] = f.value; });
            EDU.store.set(DRAFT, data, true);
            const s = $('#draftStatus'); if (s) { s.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Draft saved ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
        }, 600);
        form.addEventListener('input', save);
        form.addEventListener('change', save);

        // File inputs → previews
        $$('.dropzone input[type=file]', form).forEach((inp) => {
            const dz = inp.closest('.dropzone');
            ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, () => dz.classList.add('dragover')));
            ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, () => dz.classList.remove('dragover')));
            inp.addEventListener('change', () => {
                const f = inp.files[0];
                const out = dz.querySelector('.file-name');
                dz.classList.toggle('has-file', !!f);
                if (!f) { out.hidden = true; return; }
                out.hidden = false;
                out.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${esc(f.name)} · ${(f.size / 1024).toFixed(0)} KB`;
                if (f.type.startsWith('image/') && inp.name === 'photo') { const r = new FileReader(); r.onload = () => { out.innerHTML += `<br><img src="${r.result}" alt="Student photo preview" style="width:72px;height:72px;border-radius:12px;object-fit:cover;margin:10px auto 0">`; }; r.readAsDataURL(f); }
            });
        });

        const go = (n) => {
            cur = n;
            steps.forEach((s, i) => s.classList.toggle('active', i === n));
            stepper.forEach((li, i) => { li.classList.toggle('active', i === n); li.classList.toggle('done', i < n); li.setAttribute('aria-current', i === n ? 'step' : 'false'); });
            const pct = Math.round(((n + 1) / steps.length) * 100);
            $('#stepPct').textContent = pct + '%';
            $('#stepLabel').textContent = `Step ${n + 1} of ${steps.length}`;
            $('#stepBar').style.width = pct + '%';
            $('#prevBtn').disabled = n === 0;
            $('#nextBtn').hidden = n === steps.length - 1;
            $('#submitBtn').hidden = n !== steps.length - 1;
            if (n === steps.length - 1) review();
            const top = $('#applyTop'); top && top.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const first = steps[n].querySelector('input, select, textarea'); first && setTimeout(() => first.focus({ preventScroll: true }), 350);
        };

        const val = (n) => form.elements[n] ? (form.elements[n].value || '').trim() : '';
        const fileName = (n) => (form.elements[n] && form.elements[n].files[0] ? form.elements[n].files[0].name : '');
        function review() {
            const block = (title, step, rows) => `<div class="review-block"><header>${title}<button type="button" class="btn btn-xs btn-ghost" data-edit="${step}"><i class="fa-solid fa-pen"></i> Edit</button></header><dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v || '—')}</dd></div>`).join('')}</dl></div>`;
            $('#reviewBox').innerHTML = block('Student Information', 0, [['Student name', val('studentName')], ['Date of birth', val('dob') ? U.fmtDate(val('dob')) : ''], ['Gender', (form.querySelector('[name=gender]:checked') || {}).value], ['Grade applying for', val('grade')], ['Previous school', val('previousSchool')]])
                + block('Parent Information', 1, [['Father\'s name', val('fatherName')], ['Mother\'s name', val('motherName')], ['Email', val('email')], ['Phone', val('phone')], ['Occupation', val('occupation')]])
                + block('Address', 2, [['Country', val('country')], ['State', val('state')], ['City', val('city')], ['PIN code', val('postal')], ['Address', val('address')]])
                + block('Documents', 3, [['Birth certificate', fileName('birth')], ['Previous school certificate', fileName('previous')], ['Student photo', fileName('photo')]]);
        }

        $('#nextBtn').addEventListener('click', () => {
            if (!EDU.validate.form(steps[cur])) { EDU.toast.error('Please complete this step', 'Some required fields need your attention.'); return; }
            go(cur + 1);
        });
        $('#prevBtn').addEventListener('click', () => go(Math.max(0, cur - 1)));
        form.addEventListener('click', (e) => { const b = e.target.closest('[data-edit]'); if (b) go(+b.dataset.edit); });
        stepper.forEach((li, i) => li.addEventListener('click', () => { if (i < cur) go(i); }));

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            for (let i = 0; i < steps.length; i++) { if (!EDU.validate.form(steps[i])) { go(i); EDU.toast.error('Incomplete application', `Please review step ${i + 1}.`); return; } }
            const btn = $('#submitBtn'); btn.classList.add('loading');
            const id = `EDU-${new Date().getFullYear()}-${String(1043 + EDU.db.all('admissions').length).padStart(4, '0')}`;
            const app = {
                id, submitted: new Date().toISOString(), status: 'New',
                student: { name: val('studentName'), dob: val('dob'), gender: (form.querySelector('[name=gender]:checked') || {}).value, grade: val('grade'), previousSchool: val('previousSchool') },
                parent: { father: val('fatherName'), mother: val('motherName'), email: val('email'), phone: val('phone'), occupation: val('occupation') },
                address: { country: val('country'), state: val('state'), city: val('city'), address: val('address'), postal: val('postal') },
                documents: { birth: fileName('birth'), previous: fileName('previous'), photo: fileName('photo') }
            };
            await EDU.api.submitApplication(app);
            EDU.db.insert('notifications', { id: U.uid('NT'), target: 'role:admin', text: `New admission application ${id} — ${app.student.name} (${app.student.grade}).`, type: 'admission', link: 'admin-dashboard.html#admissions', time: new Date().toISOString(), read: false });
            EDU.store.remove(DRAFT);
            btn.classList.remove('loading');
            const m = EDU.modal.success({
                title: 'Application submitted!',
                text: `Thank you, ${app.parent.father.split(' ')[0]}. We have received ${app.student.name}'s application for ${app.student.grade}.`,
                html: `<div class="app-id-box"><i class="fa-solid fa-hashtag"></i>${id}</div><p class="small">Save this Application ID to track status. A confirmation has been sent to <strong>${esc(app.parent.email)}</strong>. Our admissions team will contact you within 2 working days for document verification.</p>
                    <button class="btn btn-soft btn-sm" id="copyId"><i class="fa-regular fa-copy"></i> Copy ID</button>`,
                button: 'Back to Admissions'
            });
            $('#copyId', m.el).addEventListener('click', () => { navigator.clipboard && navigator.clipboard.writeText(id); EDU.toast.success('Copied', id); });
            m.el.querySelector('.modal-foot [data-close]').addEventListener('click', () => { setTimeout(() => { location.href = 'admissions.html'; }, 300); });
            form.reset();
            $$('.dropzone', form).forEach((d) => { d.classList.remove('has-file'); const f = d.querySelector('.file-name'); if (f) f.hidden = true; });
            $$('.is-valid', form).forEach((x) => x.classList.remove('is-valid'));
            go(0);
        });

        go(0);
    }

    function initTrack() {
        // Track application status
        const tf = $('#trackForm');
        tf && tf.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = $('#trackId').value.trim().toUpperCase();
            const a = EDU.db.find('admissions', id);
            $('#trackResult').innerHTML = a ? `<div class="card mt-16" style="padding:16px"><strong>${esc(a.student.name)}</strong> · ${esc(a.student.grade)}<br>${U.statusBadge(a.status)} <small class="text-muted">submitted ${U.timeAgo(a.submitted)}</small></div>` : `<p class="text-danger small mt-8"><i class="fa-solid fa-circle-exclamation"></i> No application found with ID ${esc(id)}.</p>`;
        });
    }

    EDU.bus.on('ready', () => { init(); initTrack(); });
})(window.EDU);
