/* ==========================================================================
   Toast notifications
   EDU.toast.success('Saved', 'Your changes were stored.')
   ========================================================================== */
(function (EDU) {
    'use strict';
    const ICONS = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-bell' };
    let stack;

    function ensureStack() {
        if (stack && document.body.contains(stack)) return stack;
        stack = document.createElement('div');
        stack.className = 'toast-stack';
        stack.setAttribute('role', 'region');
        stack.setAttribute('aria-label', 'Notifications');
        stack.setAttribute('aria-live', 'polite');
        document.body.appendChild(stack);
        return stack;
    }

    function show(type, title, text = '', duration = 4200) {
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.setAttribute('role', type === 'error' ? 'alert' : 'status');
        el.innerHTML = `
            <span class="toast-icon"><i class="fa-solid ${ICONS[type] || ICONS.info}"></i></span>
            <div><h5>${EDU.utils.esc(title)}</h5>${text ? `<p>${EDU.utils.esc(text)}</p>` : ''}</div>
            <button class="toast-close" aria-label="Dismiss notification"><i class="fa-solid fa-xmark"></i></button>
            <span class="toast-timer" style="animation-duration:${duration}ms"></span>`;
        const s = ensureStack();
        s.appendChild(el);
        while (s.children.length > 4) s.firstChild.remove();
        const close = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 300); };
        el.querySelector('.toast-close').addEventListener('click', close);
        const t = setTimeout(close, duration);
        el.addEventListener('mouseenter', () => { clearTimeout(t); el.querySelector('.toast-timer').style.animationPlayState = 'paused'; });
        el.addEventListener('mouseleave', () => setTimeout(close, 1500));
        return el;
    }

    EDU.toast = {
        show,
        success: (t, m, d) => show('success', t, m, d),
        error: (t, m, d) => show('error', t, m, d),
        warning: (t, m, d) => show('warning', t, m, d),
        info: (t, m, d) => show('info', t, m, d)
    };
})(window.EDU);
