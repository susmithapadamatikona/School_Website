/* ==========================================================================
   Modal dialogs (accessible: focus trap, Esc to close, restore focus)
   EDU.modal.open({ title, body, footer, size, onOpen })
   EDU.modal.confirm({ title, text, confirmText, danger }) -> Promise<boolean>
   ========================================================================== */
(function (EDU) {
    'use strict';
    const { esc } = EDU.utils;
    const stack = [];
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])';

    function open({ title = '', body = '', footer = '', size = '', onOpen, onClose, dismissible = true, bare = false } = {}) {
        const lastFocus = document.activeElement;
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        const id = 'modal-' + Math.random().toString(36).slice(2, 8);
        backdrop.innerHTML = `
            <div class="modal ${size}" role="dialog" aria-modal="true" ${title ? `aria-labelledby="${id}"` : ''}>
                ${bare ? '' : `<div class="modal-head"><h3 id="${id}">${title}</h3>${dismissible ? '<button class="modal-close" data-close aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>' : ''}</div>`}
                <div class="modal-body">${body}</div>
                ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
            </div>`;
        document.body.appendChild(backdrop);
        document.body.classList.add('no-scroll');
        requestAnimationFrame(() => backdrop.classList.add('open'));

        const modalEl = backdrop.querySelector('.modal');
        const api = {
            el: modalEl, backdrop,
            close(result) {
                backdrop.classList.remove('open');
                setTimeout(() => backdrop.remove(), 250);
                stack.splice(stack.indexOf(api), 1);
                if (!stack.length) document.body.classList.remove('no-scroll');
                document.removeEventListener('keydown', onKey);
                if (lastFocus && lastFocus.focus) lastFocus.focus();
                onClose && onClose(result);
            },
            setBody(html) { modalEl.querySelector('.modal-body').innerHTML = html; }
        };

        const onKey = (e) => {
            if (stack[stack.length - 1] !== api) return;
            if (e.key === 'Escape' && dismissible) api.close();
            if (e.key === 'Tab') {
                const f = Array.from(modalEl.querySelectorAll(FOCUSABLE)).filter((x) => x.offsetParent !== null);
                if (!f.length) return;
                const first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener('keydown', onKey);
        backdrop.addEventListener('click', (e) => {
            if ((e.target === backdrop && dismissible) || e.target.closest('[data-close]')) api.close();
        });
        stack.push(api);
        setTimeout(() => {
            const first = modalEl.querySelector('.modal-body ' + FOCUSABLE) || modalEl.querySelector(FOCUSABLE);
            first && first.focus({ preventScroll: true });
        }, 60);
        onOpen && onOpen(modalEl, api);
        return api;
    }

    function confirm({ title = 'Are you sure?', text = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false, icon } = {}) {
        return new Promise((resolve) => {
            let answered = false;
            const m = open({
                size: 'sm', bare: true,
                body: `<div class="text-center" style="padding:8px 4px">
                        <div class="modal-hero-icon ${danger ? 'danger' : 'warning'}"><i class="fa-solid ${icon || (danger ? 'fa-trash-can' : 'fa-circle-question')}"></i></div>
                        <h3>${esc(title)}</h3><p>${esc(text)}</p></div>`,
                footer: `<button class="btn btn-ghost" data-close>${esc(cancelText)}</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmText)}</button>`,
                onClose: () => { if (!answered) resolve(false); }
            });
            m.el.querySelector('[data-ok]').addEventListener('click', () => { answered = true; resolve(true); m.close(); });
        });
    }

    function success({ title, text = '', html = '', button = 'Done' }) {
        return open({
            size: 'sm', bare: true,
            body: `<div class="text-center" style="padding:10px 4px"><div class="modal-hero-icon success"><i class="fa-solid fa-check"></i></div><h3>${esc(title)}</h3><p>${esc(text)}</p>${html}</div>`,
            footer: `<button class="btn btn-primary btn-block" data-close>${esc(button)}</button>`
        });
    }

    EDU.modal = { open, confirm, success };
})(window.EDU);
