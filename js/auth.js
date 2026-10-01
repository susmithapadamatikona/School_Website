/* ==========================================================================
   Authentication (demo) — login, register, forgot password, session guard
   Sessions live in LocalStorage ("remember me") or SessionStorage.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const { $, $$, qs, esc } = EDU.utils;
    const store = EDU.store;

    const DASH = { student: 'student-dashboard.html', teacher: 'teacher-dashboard.html', parent: 'parent-dashboard.html', admin: 'admin-dashboard.html' };
    const DEMO = {
        student: { id: 'aarav.sharma@educare.edu', alt: 'STU2026001', pw: 'student123' },
        teacher: { id: 'priya.menon@educare.edu', pw: 'teacher123' },
        parent: { id: 'rajesh.sharma@gmail.com', pw: 'parent123' },
        admin: { id: 'admin@educare.edu', pw: 'admin123' }
    };

    const auth = {
        DASH, DEMO,
        session() {
            let s = store.get('session');
            if (!s) { try { s = JSON.parse(sessionStorage.getItem('educare:session')); } catch (e) { s = null; } }
            return s;
        },
        user() {
            const s = auth.session();
            if (!s) return null;
            return EDU.db.find('users', s.userId);
        },
        /** Email to show in the portal: the one typed at sign-in, else the account's own */
        email(user) { const s = auth.session(); return (s && s.email) || (user && user.email) || ''; },
        start(user, remember, email = '') {
            const s = { userId: user.id, role: user.role, name: user.name, email, at: Date.now() };
            if (user.role === 'parent') s.activeChild = (user.children || [])[0];
            if (remember) store.set('session', s);
            else { store.remove('session'); try { sessionStorage.setItem('educare:session', JSON.stringify(s)); } catch (e) { store.set('session', s); } }
            return s;
        },
        update(patch) {
            const s = Object.assign(auth.session() || {}, patch);
            if (store.get('session')) store.set('session', s); else { try { sessionStorage.setItem('educare:session', JSON.stringify(s)); } catch (e) { /* ignore */ } }
            EDU.bus.emit('session', s);
            return s;
        },
        logout() {
            store.remove('session');
            try { sessionStorage.removeItem('educare:session'); } catch (e) { /* ignore */ }
            location.href = 'login.html?loggedout=1';
        },
        /** Redirects to login when not signed in; returns the user otherwise */
        require(roles) {
            const u = auth.user();
            if (!u) { location.replace(`login.html?redirect=${encodeURIComponent(location.pathname.split('/').pop() + location.hash)}`); return null; }
            if (roles && !roles.includes(u.role)) { location.replace(DASH[u.role]); return null; }
            return u;
        }
    };

    /* ---------------- Login page ---------------- */
    function initLogin() {
        const form = $('#loginForm');
        if (!form) return;
        const tabs = $$('.role-tab');
        let role = qs('role') && DEMO[qs('role')] ? qs('role') : 'student';
        const idInput = $('#loginId');
        const demoBox = $('#demoCreds');

        const setRole = (r) => {
            role = r;
            tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.role === r)));
            $('#loginIdLabel').textContent = r === 'student' ? 'Email or Student ID' : 'Email address';
            idInput.placeholder = r === 'student' ? 'Enter your email or Student ID' : 'Enter your email address';
            const d = DEMO[r];
            demoBox.innerHTML = `<strong><i class="fa-solid fa-circle-info"></i> Demo ${esc(r)} account</strong><br>
                ID: <code>${d.alt || d.id}</code> · Password: <code>${d.pw}</code>
                <button type="button" class="btn btn-xs btn-soft" id="fillDemo" style="margin-left:6px">Autofill</button>`;
            $('#fillDemo').addEventListener('click', () => { idInput.value = d.alt || d.id; $('#loginPassword').value = d.pw; EDU.validate.check(idInput); EDU.validate.check($('#loginPassword')); });
        };
        tabs.forEach((t) => t.addEventListener('click', () => setRole(t.dataset.role)));
        tabs.forEach((t, i) => t.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); setRole(n.dataset.role); }
        }));
        setRole(role);

        if (qs('loggedout')) EDU.toast.info('Signed out', 'You have been logged out securely.');
        if (qs('registered')) EDU.toast.success('Account created', 'Please sign in with your new credentials.');
        if (qs('reset')) EDU.toast.success('Password updated', 'Sign in with your new password.');

        const existing = auth.user();
        if (existing && !qs('loggedout')) {
            $('#alreadyIn').innerHTML = `<div class="demo-creds mb-16" style="background:var(--tint-success);border-color:rgba(22, 160, 133,.4)">You're signed in as <strong>${esc(existing.name)}</strong>. <a href="${DASH[existing.role]}">Go to dashboard →</a></div>`;
        }

        EDU.validate.attach(form);
        EDU.validate.bindPasswordToggles(form);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!EDU.validate.form(form)) return EDU.toast.error('Check the form', 'Please fix the highlighted fields.');
            const btn = form.querySelector('[type=submit]');
            btn.classList.add('loading');
            try {
                // Demo mode: details that don't match a registered account sign in as the selected portal's demo user
                const user = await EDU.api.login(idInput.value, $('#loginPassword').value, role)
                    .catch(() => EDU.db.all('users').find((u) => u.email === DEMO[role].id));
                const typed = idInput.value.trim();
                auth.start(user, $('#remember').checked, /\S+@\S+\.\S+/.test(typed) ? typed : '');
                EDU.toast.success(`Welcome back, ${user.name.split(' ')[0]}!`, 'Redirecting to your dashboard…');
                const redirect = qs('redirect');
                setTimeout(() => { location.href = redirect && !/login|register/.test(redirect) ? redirect : DASH[user.role]; }, 900);
            } catch (err) {
                btn.classList.remove('loading');
                EDU.toast.error('Sign in failed', err.message);
                form.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 300 });
            }
        });
    }

    /* ---------------- Register page ---------------- */
    function initRegister() {
        const form = $('#registerForm');
        if (!form) return;
        EDU.validate.attach(form);
        EDU.validate.bindPasswordToggles(form);
        EDU.validate.strengthMeter($('#regPassword'), $('#pwMeter'), $('#pwLabel'), $('#pwRules'));
        const photo = $('#regPhoto');
        photo.addEventListener('change', () => {
            const f = photo.files[0];
            if (!f) return;
            if (!f.type.startsWith('image/')) { EDU.toast.error('Invalid file', 'Please choose an image.'); photo.value = ''; return; }
            const r = new FileReader();
            r.onload = () => { $('#photoPreview').innerHTML = `<img src="${r.result}" alt="Profile preview">`; $('#photoPreview').dataset.src = r.result; };
            r.readAsDataURL(f);
        });
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!EDU.validate.form(form)) return EDU.toast.error('Check the form', 'Please fix the highlighted fields.');
            const email = $('#regEmail').value.trim().toLowerCase();
            if (EDU.db.all('users').some((u) => u.email.toLowerCase() === email)) {
                const f = $('#regEmail'); f.classList.add('is-invalid');
                return EDU.toast.error('Email already registered', 'Try signing in or use another email.');
            }
            const btn = form.querySelector('[type=submit]');
            btn.classList.add('loading');
            const role = form.querySelector('input[name=role]:checked').value;
            await EDU.api.create('users', {
                id: EDU.utils.uid('U'), role, name: $('#regName').value.trim(), email, phone: $('#regPhone').value.trim(),
                password: $('#regPassword').value, title: EDU.utils.cap(role), photo: $('#photoPreview').dataset.src || null,
                ...(role === 'student' ? { studentId: 'STU2026001' } : {}), ...(role === 'parent' ? { children: ['STU2026001'] } : {}), ...(role === 'teacher' ? { teacherId: 'T001' } : {})
            });
            btn.classList.remove('loading');
            EDU.modal.success({ title: 'Account created!', text: 'Your account is ready. (Demo accounts are linked to sample student data.)', button: 'Continue to sign in' });
            setTimeout(() => { location.href = 'login.html?registered=1&role=' + role; }, 2200);
        });
    }

    /* ---------------- Forgot password ---------------- */
    function initForgot() {
        const root = $('#resetFlow');
        if (!root) return;
        const steps = $$('.reset-step', root);
        const bars = $$('.reset-steps span');
        let stage = 0, otp = '', email = '', timer;
        const go = (n) => {
            stage = n;
            steps.forEach((s, i) => { s.hidden = i !== n; });
            bars.forEach((b, i) => b.classList.toggle('on', i <= n));
            const first = steps[n].querySelector('input'); first && first.focus();
        };
        steps.forEach((s) => s.querySelector('form') && EDU.validate.attach(s.querySelector('form')));
        EDU.validate.bindPasswordToggles(root);
        EDU.validate.strengthMeter($('#newPassword'), $('#pwMeter'), $('#pwLabel'));

        const startTimer = () => {
            let t = 30; const el = $('#resendBtn');
            el.disabled = true; clearInterval(timer);
            timer = setInterval(() => { t--; el.textContent = `Resend code in ${t}s`; if (t <= 0) { clearInterval(timer); el.disabled = false; el.textContent = 'Resend code'; } }, 1000);
        };
        const sendOtp = () => {
            otp = String(Math.floor(100000 + Math.random() * 900000));
            EDU.toast.info('Verification code sent', `Demo OTP for ${email}: ${otp}`, 9000);
            startTimer();
        };

        $('#emailForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!EDU.validate.form(e.target)) return;
            email = $('#resetEmail').value.trim();
            const btn = e.target.querySelector('[type=submit]'); btn.classList.add('loading');
            await EDU.utils.sleep(800); btn.classList.remove('loading');
            $('#otpEmail').textContent = email;
            sendOtp(); go(1);
        });

        const boxes = $$('.otp-inputs input');
        boxes.forEach((b, i) => {
            b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(-1); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); });
            b.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
            b.addEventListener('paste', (e) => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (t.length) { e.preventDefault(); boxes.forEach((x, k) => { x.value = t[k] || ''; }); boxes[Math.min(t.length, 5)].focus(); } });
        });
        $('#resendBtn').addEventListener('click', sendOtp);
        $('#otpForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = boxes.map((b) => b.value).join('');
            if (code.length < 6) return EDU.toast.error('Incomplete code', 'Enter all 6 digits.');
            if (code !== otp) { boxes.forEach((b) => b.classList.add('is-invalid')); return EDU.toast.error('Incorrect code', 'The code you entered does not match.'); }
            boxes.forEach((b) => { b.classList.remove('is-invalid'); b.classList.add('is-valid'); });
            clearInterval(timer);
            go(2);
        });
        $('#newPassForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!EDU.validate.form(e.target)) return;
            const btn = e.target.querySelector('[type=submit]'); btn.classList.add('loading');
            await EDU.utils.sleep(900);
            const u = EDU.db.all('users').find((x) => x.email.toLowerCase() === email.toLowerCase());
            if (u) EDU.db.update('users', u.id, { password: $('#newPassword').value });
            go(3);
        });
        go(0);
    }

    EDU.auth = auth;
    document.addEventListener('DOMContentLoaded', () => { initLogin(); initRegister(); initForgot(); });
})(window.EDU);
