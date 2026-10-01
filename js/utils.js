/* ==========================================================================
   EDUCARE — Core utilities (global namespace + helpers)
   Loaded first on every page. Classic script (not ES module) so the project
   also runs when opened directly from the file system (file://).
   ========================================================================== */
window.EDU = window.EDU || {};

(function (EDU) {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const pad = (n) => String(n).padStart(2, '0');
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    /* ---------- Dates (always local time, never UTC) ---------- */
    const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
    const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const parse = (iso) => { if (iso instanceof Date) return iso; const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
    const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };
    const rel = (offset) => toISO(addDays(today(), offset));
    const diffDays = (a, b = today()) => Math.round((parse(a) - parse(b)) / 864e5);

    const fmtDate = (iso, opts = {}) => {
        if (!iso) return '—';
        const d = parse(iso);
        if (opts.short) return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
        if (opts.long) return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
        return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    };
    const fmtTime = (hhmm) => {
        if (!hhmm) return '';
        const [h, m] = hhmm.split(':').map(Number);
        return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
    };
    const timeAgo = (ts) => {
        const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
        if (s < 45) return 'just now';
        if (s < 3600) return `${Math.floor(s / 60)} min ago`;
        if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
        if (s < 172800) return 'yesterday';
        if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
        return fmtDate(toISO(new Date(ts)));
    };
    const relLabel = (iso) => {
        const n = diffDays(iso);
        if (n === 0) return 'Today';
        if (n === 1) return 'Tomorrow';
        if (n === -1) return 'Yesterday';
        if (n > 1 && n < 7) return `In ${n} days`;
        if (n < -1 && n > -7) return `${-n} days ago`;
        return fmtDate(iso);
    };

    /* ---------- Formatting ---------- */
    const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
    const num = (n) => Number(n || 0).toLocaleString('en-IN');
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const uid = (prefix = 'ID') => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cap = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);

    const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    /* Deterministic PRNG so seeded demo data is stable between reloads */
    const seeded = (seed = 42) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    const qs = (key) => new URLSearchParams(location.search).get(key);

    /* ---------- Images ---------- */
    const PHOTOS = {
        graduation: '1627556704302-624286467c65',
        classroom: '1509062522246-3755977927d7',
        kidsClass: '1503676260728-1c00da094a0b',
        laptopStudents: '1427504494785-3a9ca7044f45',
        lecture: '1524178232363-1fb2b075b655',
        campus: '1562774053-701939374585',
        campus2: '1541339907198-e08756dedf3f',
        building: '1580582932707-520aed937b7b',
        library: '1521587760476-6c12a4b040da',
        books: '1497633762265-9d179a990aa6',
        scienceLab: '1532094349884-543bc11b234d',
        lab2: '1576086213369-97a306d36557',
        microscope: '1582719471384-894fbb16e074',
        coding: '1517694712202-14dd9538aa97',
        running: '1461896836934-ffe607ba8211',
        football: '1574629810360-7efbbe195018',
        basketball: '1546519638-68e109498ffc',
        pool: '1530549387789-4c1017266635',
        music: '1511671782779-c97d3d27a1d4',
        concert: '1508700115892-45ecd05ae2ad',
        conference: '1540575467063-178a50c2df87',
        audience: '1475721027785-f74eccf877e2',
        studyGroup: '1522202176988-66273c2fd55f',
        kidsGroup: '1529390079861-591de354faf5',
        onlineClass: '1588072432836-e10032774350',
        teacherBoard: '1577896851231-70ef18881754',
        teacherKids: '1544717305-2782549b5136',
        students: '1571260899304-425eee4c7efc',
        kidWriting: '1596495578065-6e0763fa1178',
        kidStudy: '1513258496099-48168024aec0',
        reading: '1456513080510-7bf3a84b82f8',
        writing: '1488190211105-8b0e65b80b4e',
        study: '1434030216411-0b793f4b4173',
        bookCoffee: '1501504905252-473c47e087f8',
        art: '1513364776144-60967b0f800f',
        bus: '1557223562-6c77ef16210f',
        robot: '1485827404703-89b55fcc595e',
        chess: '1529699211952-734e80c4d42b',
        cafeteria: '1567521464027-f127ff144326',
        medical: '1576091160399-112ba8d25d1d',
        security: '1557597774-9d273605dfa9',
        auditorium: '1503095396549-807759245b35',
        trip: '1501785888041-af3ef285b470',
        celebration: '1530103862676-de8c9debad1d',
        eco: '1542601906990-b4d3fb778b09',
        math: '1635070041078-e363dbe005cb',
        chemistry: '1603126857599-f6e157fa2fe6',
        globe: '1526778548025-fa2f459cd5c1',
        dance: '1508807526345-15e9b5f4eaff',
        studentsSmiling: '1543269865-cbf427effbad',
        schoolCampus: '1591123120675-6f7f1aae0e5b',
        // Portraits
        w1: '1494790108377-be9c29b29330', w2: '1438761681033-6461ffad8d80', w3: '1544005313-94ddf0286df2',
        w4: '1580489944761-15a19d654956', w5: '1531123897727-8f129e1688ce', w6: '1573496359142-b8d87734a5a2',
        w7: '1487412720507-e7ab37603c6f', w8: '1534528741775-53994a69daeb', w9: '1517841905240-472988babdf9',
        m1: '1507003211169-0a1dd7228f2d', m2: '1500648767791-00dcc994a43e', m3: '1472099645785-5658abf4ff4e',
        m4: '1506794778202-cad84cf45f1d', m5: '1560250097-0b93528c311a', m6: '1519085360753-af0119f7cbe7',
        m7: '1492562080023-ab3db95bfbce', m8: '1463453091185-61582044d556'
    };
    /* Every photo is a local WebP (< 100 KB) in assets/images/photos, named by its PHOTOS key.
       Keys map to the original Unsplash ids so a raw id resolves to the same file. */
    const PHOTO_KEY = Object.fromEntries(Object.entries(PHOTOS).map(([k, id]) => [id, k]));
    const img = (key) => {
        if (!key) return '';
        if (/^(https?:|data:|assets\/)/.test(key)) return key;
        return `assets/images/photos/${PHOTOS[key] ? key : PHOTO_KEY[key] || key}.webp`;
    };

    /* Graceful image fallback (SVG placeholder) */
    const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DDF6EC"/><stop offset="1" stop-color="#F5FAFA"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><g fill="#013431" opacity=".55" transform="translate(340 240)"><path d="M60 0 0 30l60 30 60-30z"/><path d="M20 48v34c0 10 18 20 40 20s40-10 40-20V48L60 68z"/></g><text x="400" y="400" font-family="Arial" font-size="22" font-weight="700" fill="#002522" opacity=".55" text-anchor="middle">EDUCARE</text></svg>`);

    const PALETTE = ['#013431', '#159B78', '#F59E0B', '#7356D8', '#EC4899', '#2196F3', '#16A085', '#E74C3C'];
    const colorFor = (str = '') => PALETTE[[...str].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

    /** Avatar markup: photo if available, otherwise coloured initials */
    const avatar = (person = {}, size = '') => {
        const cls = `avatar ${size}`.trim();
        if (person.photo) return `<span class="${cls}"><img src="${img(person.photo)}" alt="${esc(person.name)}" loading="lazy"></span>`;
        return `<span class="${cls}" style="background:${colorFor(person.name)}" aria-hidden="true">${esc(initials(person.name))}</span>`;
    };

    const statusBadge = (status) => {
        const map = {
            pending: 'warning', submitted: 'info', overdue: 'danger', completed: 'success', graded: 'success',
            paid: 'success', partial: 'warning', unpaid: 'danger',
            present: 'success', absent: 'danger', late: 'warning', holiday: 'purple',
            approved: 'success', rejected: 'danger', 'under review': 'info', 'document verification': 'info', 'assessment scheduled': 'purple', new: 'primary',
            scheduled: 'primary', ongoing: 'danger', upcoming: 'primary',
            'on route': 'success', arrived: 'primary', delayed: 'danger', 'not started': 'muted',
            available: 'success', issued: 'warning', returned: 'success', 'due soon': 'warning',
            high: 'danger', medium: 'warning', low: 'info', active: 'success', inactive: 'muted', live: 'danger'
        };
        const key = String(status || '').toLowerCase();
        const variant = map[key] || 'muted';
        return `<span class="badge badge-${variant} badge-dot">${esc(cap(status))}</span>`;
    };

    const empty = (title = 'Nothing here yet', text = '', icon = 'fa-inbox') =>
        `<div class="empty-state"><div class="empty-icon"><i class="fa-solid ${icon}"></i></div><h4>${esc(title)}</h4>${text ? `<p>${esc(text)}</p>` : ''}</div>`;

    const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

    /** Trigger a real file download from a string (CSV, HTML, etc.) */
    const download = (filename, content, type = 'text/plain') => {
        const blob = new Blob([content], { type });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    const toCSV = (rows) => rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

    EDU.utils = {
        $, $$, pad, MONTHS, MONTHS_LONG, DAYS, today, toISO, parse, addDays, rel, diffDays, fmtDate, fmtTime, timeAgo, relLabel,
        money, num, esc, initials, uid, slug, cap, debounce, sleep, clamp, seeded, qs, img, PHOTOS, PLACEHOLDER,
        PALETTE, colorFor, avatar, statusBadge, empty, greet, download, toCSV
    };
})(window.EDU);
