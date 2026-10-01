/* ==========================================================================
   Fees — breakdown, payment flow (UPI / card / net banking), invoice,
   receipts & payment history for students/parents; collection overview,
   defaulters and reminders for admin.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, fmtDate, money } = U;
    EDU.views = EDU.views || {};
    const D = () => EDU.data;

    function receiptHTML(s, p) {
        return `<div class="doc-sheet"><div class="doc-head"><div><h3>EDUCARE International School</h3><p style="margin:0;font-size:.8rem">Gachibowli, Hyderabad 500032 · GSTIN 36AABCE2026R1Z5</p></div><div style="text-align:right"><strong style="color:#013431">FEE RECEIPT</strong><p style="margin:0;font-size:.8rem">${p.id}</p></div></div>
            <table class="table table-plain" style="min-width:0"><tbody>
            <tr><td><small>Received from</small><br><strong>${esc(s.parentName)}</strong></td><td><small>Student</small><br><strong>${esc(s.name)} (${s.id})</strong></td></tr>
            <tr><td><small>Class</small><br><strong>${s.class}</strong></td><td><small>Date</small><br><strong>${fmtDate(p.date, { long: true })}</strong></td></tr>
            <tr><td><small>Payment method</small><br><strong>${esc(p.method)}</strong></td><td><small>Transaction ref.</small><br><strong>${esc(p.ref)}</strong></td></tr>
            <tr><td colspan="2"><small>Towards</small><br><strong>${esc(p.items)}</strong></td></tr></tbody></table>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding:16px;border-radius:12px;background:#DDF6EC"><div><small style="color:#526B72">Amount paid</small><br><strong style="font-size:1.6rem;color:#0F6B61">${money(p.amount)}</strong></div><span class="paid-stamp">PAID</span></div>
            <p style="font-size:.72rem;color:#84959A;margin-top:16px">This is a computer-generated receipt and does not require a signature. For queries contact accounts@educare.edu · +91 40 4455 2026.</p></div>`;
    }
    function invoiceHTML(s, f) {
        return `<div class="doc-sheet"><div class="doc-head"><div><h3>EDUCARE International School</h3><p style="margin:0;font-size:.8rem">Fee Invoice · Academic Year ${f.year}</p></div><div style="text-align:right"><strong style="color:#013431">INVOICE</strong><p style="margin:0;font-size:.8rem">INV-${s.id}-${new Date().getFullYear()}</p></div></div>
            <p><strong>${esc(s.name)}</strong> · ${s.id} · Grade ${s.class}<br><small>Bill to: ${esc(s.parentName)}</small></p>
            <table class="table" style="min-width:0"><thead><tr><th>Fee head</th><th>Due date</th><th>Amount</th><th>Paid</th><th>Balance</th></tr></thead><tbody>
            ${f.items.map((i) => `<tr><td>${esc(i.category)}</td><td>${fmtDate(i.due)}</td><td>${money(i.amount)}</td><td>${money(i.paid)}</td><td><strong>${money(i.balance)}</strong></td></tr>`).join('')}
            <tr style="background:#EDF4F3"><td colspan="2"><strong>Total</strong></td><td><strong>${money(f.total)}</strong></td><td><strong>${money(f.paid)}</strong></td><td><strong>${money(f.pending)}</strong></td></tr></tbody></table>
            <p style="font-size:.75rem;color:#526B72;margin-top:14px">Late fee of ₹50/day applies after the due date. Pay online via the parent portal (UPI, cards, net banking).</p></div>`;
    }

    function payModal(c, s, categories) {
        const f = D().fees(s.id);
        const items = f.items.filter((i) => categories.includes(i.category) && i.balance > 0);
        const total = items.reduce((a, i) => a + i.balance, 0);
        const m = EDU.modal.open({
            title: '<i class="fa-solid fa-lock text-success"></i> Secure Payment', size: 'lg',
            body: `<div class="card mb-24" style="padding:18px;background:var(--section-bg)"><div class="flex justify-between flex-wrap gap-12"><div><small class="text-muted">Paying for ${esc(s.name)} · ${s.id}</small><div class="mt-8">${items.map((i) => `<span class="tag" style="margin:0 6px 6px 0">${esc(i.category)} · ${money(i.balance)}</span>`).join('')}</div></div><div class="text-right"><small class="text-muted">Total payable</small><h2 class="mb-0 text-primary">${money(total)}</h2></div></div></div>
                <form id="payForm" novalidate>
                <span class="form-label">Payment method</span>
                <div class="radio-cards mt-8 mb-24">${[['upi', 'fa-mobile-screen', 'UPI'], ['card', 'fa-credit-card', 'Card'], ['netbanking', 'fa-building-columns', 'Net Banking']].map(([v, i, l], k) => `<div class="radio-card"><input type="radio" name="pm" id="pm-${v}" value="${v}" ${k ? '' : 'checked'}><label for="pm-${v}"><i class="fa-solid ${i}"></i>${l}</label></div>`).join('')}</div>
                <div data-pm="upi"><div class="form-group"><label class="form-label" for="upiId">UPI ID <span class="req">*</span></label><input class="form-control" id="upiId" placeholder="name@okhdfcbank" required data-rule="upi"></div></div>
                <div data-pm="card" hidden><div class="form-grid"><div class="form-group span-2"><label class="form-label" for="cardNo">Card number <span class="req">*</span></label><input class="form-control" id="cardNo" inputmode="numeric" placeholder="4111 1111 1111 1111" maxlength="19" required data-rule="card"></div>
                    <div class="form-group"><label class="form-label" for="cardExp">Expiry (MM/YY) <span class="req">*</span></label><input class="form-control" id="cardExp" placeholder="08/28" maxlength="5" required data-rule="exp"></div>
                    <div class="form-group"><label class="form-label" for="cardCvv">CVV <span class="req">*</span></label><input class="form-control" id="cardCvv" type="password" inputmode="numeric" maxlength="4" placeholder="•••" required data-rule="cvv"></div>
                    <div class="form-group span-2"><label class="form-label" for="cardName">Name on card <span class="req">*</span></label><input class="form-control" id="cardName" required data-rule="name" value="${esc(s.parentName)}"></div></div></div>
                <div data-pm="netbanking" hidden><div class="form-group"><label class="form-label" for="bank">Select bank <span class="req">*</span></label><select class="form-control" id="bank" required><option value="">Choose your bank…</option>${['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Yes Bank'].map((b) => `<option>${b}</option>`).join('')}</select></div></div>
                <p class="small text-muted mt-16 mb-0"><i class="fa-solid fa-shield-halved text-success"></i> Demo gateway — no real payment is processed. 256-bit SSL · PCI-DSS compliant in production.</p></form>`,
            footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-success" id="payGo"><i class="fa-solid fa-lock"></i> Pay ${money(total)}</button>`
        });
        const R = EDU.validate.RULES;
        R.upi = R.upi || ((v) => /^[\w.-]{2,}@[a-z]{2,}$/i.test(v) || 'Enter a valid UPI ID (e.g. name@okaxis)');
        R.card = R.card || ((v) => /^\d{16}$/.test(v.replace(/\s/g, '')) || 'Enter a 16-digit card number');
        R.exp = R.exp || ((v) => { const mm = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v); if (!mm) return 'Use MM/YY'; return new Date(2000 + +mm[2], +mm[1]) > new Date() || 'Card has expired'; });
        R.cvv = R.cvv || ((v) => /^\d{3,4}$/.test(v) || 'Enter 3 or 4 digits');
        const form = $('#payForm', m.el);
        EDU.validate.attach(form);
        const setMethod = () => { const v = form.pm.value; $$('[data-pm]', form).forEach((d) => { d.hidden = d.dataset.pm !== v; }); };
        form.addEventListener('change', (e) => { if (e.target.name === 'pm') setMethod(); });
        $('#cardNo', m.el).addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); });
        $('#cardExp', m.el).addEventListener('input', (e) => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); e.target.value = v; });
        $('#payGo', m.el).addEventListener('click', async (e) => {
            if (!EDU.validate.form(form)) return;
            const btn = e.currentTarget; btn.classList.add('loading');
            const method = { upi: 'UPI', card: 'Credit / Debit Card', netbanking: `Net Banking (${$('#bank', m.el).value})` }[form.pm.value];
            try {
                const receipt = await EDU.api.pay(s.id, items.map((i) => i.category), method);
                m.close();
                const parent = EDU.db.all('users').find((u) => u.role === 'parent' && (u.children || []).includes(s.id));
                if (parent) EDU.notify.push(parent.id, `Payment of ${money(receipt.amount)} received for ${s.name}. Receipt ${receipt.id}.`, 'fee', 'fees-dashboard.html', { silent: true });
                EDU.notify.push('role:admin', `Online fee payment received: ${money(receipt.amount)} (${s.id}).`, 'fee', 'fees-dashboard.html', { silent: true });
                const r = EDU.modal.success({ title: 'Payment successful!', text: `${money(receipt.amount)} paid via ${method}.`, html: `<div class="app-id-box"><i class="fa-solid fa-receipt"></i>${receipt.id}</div><br><button class="btn btn-soft btn-sm" id="viewRcpt"><i class="fa-solid fa-file-invoice"></i> View receipt</button>`, button: 'Done' });
                $('#viewRcpt', r.el).addEventListener('click', () => { r.close(); showReceipt(s, receipt); });
            } catch (err) { btn.classList.remove('loading'); EDU.toast.error('Payment failed', err.message); }
        });
    }

    function showReceipt(s, p) {
        const m = EDU.modal.open({ title: 'Payment Receipt', size: 'lg', body: receiptHTML(s, p), footer: '<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-soft" data-p><i class="fa-solid fa-print"></i> Print</button><button class="btn btn-primary" data-d><i class="fa-solid fa-download"></i> Download</button>' });
        m.el.querySelector('[data-p]').onclick = () => EDU.docs.printHTML(receiptHTML(s, p), 'Receipt ' + p.id);
        m.el.querySelector('[data-d]').onclick = () => { EDU.docs.downloadHTML(receiptHTML(s, p), `Receipt_${p.id}.html`, 'Receipt'); EDU.toast.success('Receipt downloaded'); };
    }

    /* ---------------- Student / parent ---------------- */
    function familyView(c) {
        const s = c.student, f = D().fees(s.id);
        if (!f) return EDU.ui.pageHead('Fees', esc(s.name)) + U.empty('No fee account found');
        const pct = Math.round((f.paid / f.total) * 100);
        return `${EDU.ui.pageHead('Fees & Payments', `${esc(s.name)} · Grade ${s.class} · Academic Year ${f.year}`, '<button class="btn btn-soft btn-sm" data-invoice><i class="fa-solid fa-file-invoice"></i> View Invoice</button>')}
            <div class="kpi-grid cols-5">
                ${EDU.ui.kpi({ label: 'Total Fees', value: money(f.total), icon: 'fa-sack-dollar', box: '' })}
                ${EDU.ui.kpi({ label: 'Paid Amount', value: money(f.paid), icon: 'fa-circle-check', box: 'green', trend: `<b>${pct}%</b> of annual fees` })}
                ${EDU.ui.kpi({ label: 'Pending Amount', value: money(f.pending), icon: 'fa-hourglass-half', box: f.status === 'Overdue' ? 'red' : 'gold' })}
                ${EDU.ui.kpi({ label: 'Next Due Date', value: f.nextDue ? fmtDate(f.nextDue, { short: true }) : '—', icon: 'fa-calendar-day', box: 'purple', trend: f.nextDue ? U.relLabel(f.nextDue) : 'Nothing due' })}
                ${EDU.ui.kpi({ label: 'Payment Status', value: U.statusBadge(f.status), icon: 'fa-shield-halved', box: f.status === 'Paid' ? 'green' : f.status === 'Overdue' ? 'red' : 'gold', trend: '<span class="live-dot green" style="width:7px;height:7px"></span> Updates in real time' })}
            </div>
            ${f.status === 'Overdue' ? `<div class="panel mb-24" style="border-left:4px solid var(--danger)"><div class="panel-body flex items-center gap-16 flex-wrap"><span class="icon-box red"><i class="fa-solid fa-triangle-exclamation"></i></span><div class="grow"><strong>Payment overdue</strong><br><small class="text-muted">${f.items.filter((i) => i.status === 'Overdue').map((i) => esc(i.category)).join(', ')} is past its due date. A late fee of ₹50/day applies.</small></div><button class="btn btn-danger btn-sm" data-pay-overdue>Pay overdue now</button></div></div>` : ''}
            <div class="dash-grid">
                <div class="col-8">${EDU.ui.panel('Fee Breakdown', `<div class="table-wrap"><table class="table"><thead><tr><th style="width:40px"><input type="checkbox" id="feeAll" aria-label="Select all unpaid"></th><th>Category</th><th>Due Date</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>
                    ${f.items.map((i) => `<tr><td>${i.balance > 0 ? `<input type="checkbox" class="fee-cb" value="${esc(i.category)}" ${i.status === 'Overdue' ? 'checked' : ''} aria-label="Select ${esc(i.category)}">` : '<i class="fa-solid fa-check text-success"></i>'}</td><td><strong>${esc(i.category)}</strong></td><td class="nowrap">${fmtDate(i.due)}</td><td>${money(i.amount)}</td><td>${money(i.paid)}</td><td><strong>${money(i.balance)}</strong></td><td>${U.statusBadge(i.status)}</td></tr>`).join('')}
                    </tbody></table></div>`, { icon: 'fa-list', flush: true, actions: '' })}
                    <div class="flex justify-between items-center mt-16 flex-wrap gap-12"><span class="small text-muted">Selected: <strong id="selAmt">₹0</strong></span><button class="btn btn-primary" id="paySel" ${f.pending ? '' : 'disabled'}><i class="fa-solid fa-credit-card"></i> Pay Selected</button></div></div>
                <div class="col-4">${EDU.ui.panel('Payment Progress', `<div class="flex justify-center mb-16"><div class="ring" style="--val:${pct};--size:160px;--thick:16px;--col:var(--success)"><div><strong>${pct}%</strong><small class="text-muted">paid</small></div></div></div><div class="chart-box sm"><canvas id="fDough"></canvas></div>`, { icon: 'fa-chart-pie' })}</div>
                <div class="col-12">${EDU.ui.panel('Payment History', `<div class="table-wrap"><table class="table"><thead><tr><th>Receipt No.</th><th>Date</th><th>Description</th><th>Method</th><th>Amount</th><th>Status</th><th class="text-right">Receipt</th></tr></thead><tbody>
                    ${f.payments.map((p) => `<tr><td><strong>${p.id}</strong></td><td class="nowrap">${fmtDate(p.date)}</td><td>${esc(p.items)}</td><td>${esc(p.method)}<br><small class="text-muted">${esc(p.ref)}</small></td><td><strong>${money(p.amount)}</strong></td><td>${U.statusBadge('Paid')}</td><td><div class="actions"><button class="btn btn-xs btn-soft" data-rcpt="${p.id}"><i class="fa-solid fa-eye"></i> View</button></div></td></tr>`).join('')}
                    </tbody></table></div>`, { icon: 'fa-clock-rotate-left', flush: true })}</div>
            </div>`;
    }
    function familyMount(el, c) {
        const s = c.student, f = D().fees(s.id);
        if (!f) return;
        EDU.charts.make($('#fDough', el), { type: 'doughnut', data: { labels: f.items.map((i) => i.category.replace(' Fee', '')), datasets: [{ data: f.items.map((i) => i.amount) }] }, options: { plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } } });
        const sel = () => $$('.fee-cb:checked', el).map((x) => x.value);
        const upd = () => { const amt = f.items.filter((i) => sel().includes(i.category)).reduce((a, i) => a + i.balance, 0); $('#selAmt', el).textContent = money(amt); $('#paySel', el).disabled = !amt; };
        el.addEventListener('change', (e) => { if (e.target.id === 'feeAll') $$('.fee-cb', el).forEach((x) => { x.checked = e.target.checked; }); upd(); });
        upd();
        el.addEventListener('click', (e) => {
            if (e.target.closest('#paySel')) payModal(c, s, sel());
            if (e.target.closest('[data-pay-overdue]')) payModal(c, s, f.items.filter((i) => i.status === 'Overdue').map((i) => i.category));
            const r = e.target.closest('[data-rcpt]'); if (r) showReceipt(s, f.payments.find((p) => p.id === r.dataset.rcpt));
            if (e.target.closest('[data-invoice]')) {
                const m = EDU.modal.open({ title: 'Fee Invoice', size: 'lg', body: invoiceHTML(s, D().fees(s.id)), footer: '<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-primary" data-d><i class="fa-solid fa-download"></i> Download</button>' });
                m.el.querySelector('[data-d]').onclick = () => { EDU.docs.downloadHTML(invoiceHTML(s, D().fees(s.id)), `Invoice_${s.id}.html`, 'Invoice'); EDU.toast.success('Invoice downloaded'); };
            }
        });
        c.on('db:fees', () => c.rerender());
    }

    /* ---------------- Admin ---------------- */
    function adminView() {
        return `${EDU.ui.pageHead('Fee Management', 'Collections, dues and defaulters for 2026–27.', '<button class="btn btn-soft btn-sm" id="feeCsv"><i class="fa-solid fa-download"></i> Export</button><button class="btn btn-primary btn-sm" data-remind-all><i class="fa-solid fa-bell"></i> Send Reminders</button>')}
            <div class="kpi-grid">
                ${EDU.ui.kpi({ label: 'Collected (Term 1)', value: '₹4.24 Cr', icon: 'fa-sack-dollar', box: 'green', trend: '<b>+8.2%</b> vs last year' })}
                ${EDU.ui.kpi({ label: 'Pending', value: '₹38.6 L', icon: 'fa-hourglass-half', box: 'gold', trend: '214 students' })}
                ${EDU.ui.kpi({ label: 'Overdue', value: '₹11.2 L', icon: 'fa-triangle-exclamation', box: 'red', trend: '63 students' })}
                ${EDU.ui.kpi({ label: 'Online Payments', value: '87', suffix: '%', icon: 'fa-mobile-screen', box: 'purple', trend: 'UPI 58% · Cards 29%' })}
            </div>
            <div class="dash-grid">
                <div class="col-8">${EDU.ui.panel('Monthly Collection', '<div class="chart-box"><canvas id="afCol"></canvas></div>', { icon: 'fa-chart-column', sub: '₹ lakhs' })}</div>
                <div class="col-4">${EDU.ui.panel('Payment Methods', '<div class="chart-box"><canvas id="afMeth"></canvas></div>', { icon: 'fa-chart-pie' })}</div>
                <div class="col-7">${EDU.ui.panel('Students with Dues', '<div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Class</th><th>Status</th><th class="text-right">Action</th></tr></thead><tbody id="afDue"></tbody></table></div>', { icon: 'fa-user-clock', flush: true })}</div>
                <div class="col-5">${EDU.ui.panel('Recent Transactions', '<ul class="list" id="afTx"></ul>', { icon: 'fa-receipt', actions: '<span class="flex items-center gap-8 small text-muted"><span class="live-dot green"></span>Live</span>' })}</div>
            </div>`;
    }
    function adminMount(el, c) {
        const A = EDU.db.obj('analytics');
        EDU.charts.make($('#afCol', el), { type: 'bar', data: { labels: A.feeCollection.labels, datasets: [{ label: 'Collected', data: A.feeCollection.collected }, { label: 'Pending', data: A.feeCollection.pending, color: '#F59E0B' }] }, options: { scales: { x: { stacked: true }, y: { stacked: true } } } });
        EDU.charts.make($('#afMeth', el), { type: 'doughnut', data: { labels: ['UPI', 'Cards', 'Net Banking', 'Cheque / Cash'], datasets: [{ data: [58, 29, 9, 4] }] }, options: { plugins: { legend: { position: 'bottom' } } } });
        const drawDue = () => {
            const due = EDU.db.all('students').filter((s) => s.feeStatus !== 'Paid' || (D().fees(s.id) && D().fees(s.id).pending > 0));
            $('#afDue', el).innerHTML = due.slice(0, 10).map((s) => { const f = D().fees(s.id); const st = f ? f.status : s.feeStatus; return `<tr><td><div class="cell-user">${U.avatar(s, 'sm')}<div><strong>${esc(s.name)}</strong><small>${s.id}${f ? ' · ' + money(f.pending) : ''}</small></div></div></td><td>${s.class}</td><td>${U.statusBadge(st)}</td><td><div class="actions"><button class="btn btn-xs btn-soft" data-remind="${s.id}"><i class="fa-solid fa-bell"></i> Remind</button></div></td></tr>`; }).join('');
            const tx = Object.entries(EDU.db.obj('fees')).flatMap(([sid, a]) => a.payments.map((p) => ({ ...p, sid }))).sort((a, b) => b.date.localeCompare(a.date));
            $('#afTx', el).innerHTML = tx.slice(0, 6).map((p) => `<li class="list-item"><span class="icon-box sm green"><i class="fa-solid fa-indian-rupee-sign"></i></span><div class="grow"><h5>${money(p.amount)} · ${esc(D().student(p.sid).name)}</h5><small>${fmtDate(p.date)} · ${esc(p.method)}</small></div><small class="text-muted">${p.id}</small></li>`).join('');
        };
        drawDue();
        el.addEventListener('click', (e) => {
            const r = e.target.closest('[data-remind]');
            if (r) { const s = D().student(r.dataset.remind); const parent = EDU.db.all('users').find((u) => u.role === 'parent' && (u.children || []).includes(s.id)); if (parent) EDU.notify.push(parent.id, `Fee reminder: dues pending for ${s.name}. Please pay via the portal.`, 'fee', 'fees-dashboard.html', { silent: true }); EDU.toast.success('Reminder sent', `SMS, email and app notification sent to ${s.parentName}.`); r.disabled = true; r.innerHTML = '<i class="fa-solid fa-check"></i> Sent'; }
            if (e.target.closest('[data-remind-all]')) EDU.modal.confirm({ title: 'Send fee reminders?', text: 'All parents with pending or overdue fees will receive SMS, email and app notifications.', confirmText: 'Send reminders', icon: 'fa-bell' }).then((ok) => { if (ok) { EDU.notify.push('role:parent', 'Gentle reminder: school fees are due. Please pay via the Fees section.', 'fee', 'fees-dashboard.html', { silent: true }); EDU.toast.success('Reminders queued', '214 parents will be notified.'); } });
        });
        $('#feeCsv', el).addEventListener('click', () => { U.download('fee_status.csv', U.toCSV([['Student ID', 'Name', 'Class', 'Status'], ...EDU.db.all('students').map((s) => [s.id, s.name, s.class, D().fees(s.id) ? D().fees(s.id).status : s.feeStatus])]), 'text/csv'); EDU.toast.success('Export ready'); });
        c.on('db:fees', drawDue);
    }

    EDU.views.fees = {
        title: 'Fees',
        render: (c) => (c.role === 'admin' ? adminView(c) : c.role === 'teacher' ? EDU.ui.pageHead('Fees', 'Fee information is available to parents, students and administrators.') + U.empty('Not available for teachers', '', 'fa-lock') : familyView(c)),
        mount: (el, c) => (c.role === 'admin' ? adminMount(el, c) : c.role === 'teacher' ? null : familyMount(el, c))
    };
    EDU.feesUI = { receiptHTML, invoiceHTML, payModal };
})(window.EDU);
