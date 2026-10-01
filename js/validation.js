/* ==========================================================================
   Form validation
   Declarative rules via data attributes:
     required, type=email, data-rule="phone|postal|name|match:#id|min:8|file"
   EDU.validate.form(formEl) -> boolean
   EDU.validate.attach(formEl) -> live validation on blur/input
   ========================================================================== */
(function (EDU) {
    'use strict';

    const RULES = {
        email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email address',
        phone: (v) => /^(\+?\d{1,3}[\s-]?)?\d{10}$/.test(v.replace(/[\s()-]/g, '').replace(/^\+?91/, '')) || /^\+?\d[\d\s-]{9,15}$/.test(v) || 'Enter a valid 10-digit phone number',
        postal: (v) => /^\d{6}$/.test(v) || 'Enter a valid 6-digit PIN code',
        name: (v) => /^[A-Za-z .'-]{2,60}$/.test(v) || 'Use letters only (2–60 characters)',
        min: (v, n) => v.length >= +n || `Must be at least ${n} characters`,
        match: (v, sel) => { const o = document.querySelector(sel); return (o && o.value === v) || 'Values do not match'; },
        password: (v) => strength(v).score >= 3 || 'Use 8+ characters with upper-case, number & symbol',
        pastdate: (v) => new Date(v) < new Date() || 'Date must be in the past',
        idOrEmail: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^[A-Za-z]{2,4}\d{4,}$/.test(v) || 'Enter a valid email or ID'
    };

    function strength(pw = '') {
        const checks = { length: pw.length >= 8, upper: /[A-Z]/.test(pw), number: /\d/.test(pw), symbol: /[^A-Za-z0-9]/.test(pw) };
        const score = Object.values(checks).filter(Boolean).length;
        return { score, checks, label: ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score] };
    }

    function errorEl(field) {
        const group = field.closest('.form-group') || field.parentElement;
        let el = group.querySelector('.form-error');
        if (!el) { el = document.createElement('div'); el.className = 'form-error'; el.id = (field.id || field.name || 'f') + '-error'; el.setAttribute('aria-live', 'polite'); group.appendChild(el); }
        return el;
    }

    function check(field) {
        if (field.disabled || field.closest('[hidden]')) return true;
        const v = field.type === 'checkbox' ? (field.checked ? 'on' : '') : field.type === 'file' ? (field.files.length ? 'file' : '') : String(field.value || '').trim();
        let msg = '';
        if (field.required && !v) {
            msg = field.dataset.msg || (field.type === 'checkbox' ? 'Please confirm to continue' : field.type === 'file' ? 'Please upload this document' : 'This field is required');
        } else if (v) {
            if (field.type === 'email') { const r = RULES.email(v); if (r !== true) msg = r; }
            (field.dataset.rule || '').split('|').filter(Boolean).forEach((rule) => {
                if (msg) return;
                const [name, arg] = rule.split(':');
                const fn = RULES[name];
                if (fn) { const r = fn(v, arg); if (r !== true) msg = r; }
            });
            if (field.type === 'file' && field.files[0] && field.dataset.maxMb && field.files[0].size > field.dataset.maxMb * 1048576) msg = `File must be under ${field.dataset.maxMb} MB`;
        }
        const err = errorEl(field);
        err.innerHTML = msg ? `<i class="fa-solid fa-circle-exclamation"></i> ${msg}` : '';
        field.classList.toggle('is-invalid', !!msg);
        field.classList.toggle('is-valid', !msg && !!v && field.type !== 'checkbox');
        field.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg) field.setAttribute('aria-describedby', err.id);
        return !msg;
    }

    function form(root) {
        const fields = Array.from(root.querySelectorAll('input, select, textarea')).filter((f) => f.type !== 'hidden' && f.type !== 'submit');
        let firstBad = null;
        fields.forEach((f) => { if (!check(f) && !firstBad) firstBad = f; });
        if (firstBad) { firstBad.focus({ preventScroll: true }); firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return !firstBad;
    }

    function attach(root) {
        root.setAttribute('novalidate', '');
        root.addEventListener('blur', (e) => { if (e.target.matches('input, select, textarea')) check(e.target); }, true);
        root.addEventListener('input', (e) => { if (e.target.classList.contains('is-invalid')) check(e.target); });
        root.addEventListener('change', (e) => { if (e.target.matches('select, input[type=file], input[type=checkbox], input[type=date]')) check(e.target); });
    }

    /* Password strength meter: <div class="pw-strength" data-for="#password"> */
    function strengthMeter(input, meter, label, rules) {
        const update = () => {
            const s = strength(input.value);
            meter.dataset.level = input.value ? Math.max(1, s.score) : 0;
            if (label) label.textContent = input.value ? `Password strength: ${s.label}` : 'Use 8+ characters with a mix of letters, numbers & symbols';
            if (rules) Object.entries(s.checks).forEach(([k, ok]) => { const li = rules.querySelector(`[data-check="${k}"]`); if (li) { li.classList.toggle('ok', ok); li.querySelector('i').className = `fa-solid ${ok ? 'fa-circle-check' : 'fa-circle'}`; } });
        };
        input.addEventListener('input', update);
        update();
    }

    /* Password visibility toggles: <button data-toggle-password="#id"> */
    function bindPasswordToggles(root = document) {
        root.querySelectorAll('[data-toggle-password]').forEach((btn) => {
            if (btn.dataset.bound) return;
            btn.dataset.bound = '1';
            btn.addEventListener('click', () => {
                const input = document.querySelector(btn.dataset.togglePassword);
                const show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                btn.innerHTML = `<i class="fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
                btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
            });
        });
    }

    EDU.validate = { check, form, attach, strength, strengthMeter, bindPasswordToggles, RULES };
})(window.EDU);
