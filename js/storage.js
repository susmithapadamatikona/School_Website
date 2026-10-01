/* ==========================================================================
   EDUCARE — Data layer
   ---------------------------------------------------------------------------
   EDU.store    Thin LocalStorage wrapper (namespaced, JSON, versioned).
   EDU.db       Collection helpers (all / find / insert / update / remove).
   EDU.api      Async service facade. Every UI module talks to EDU.api, so
                swapping LocalStorage for a REST backend only means replacing
                the bodies here with fetch() calls.
   EDU.bus      In-page event bus (pub/sub). Also relays changes made in
                other browser tabs via the native `storage` event, which
                gives true cross-tab real-time updates.
   EDU.realtime Simulated push channel (WebSocket-shaped API).
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const PREFIX = 'educare:';
    const VERSION = 8; // bump whenever seed data changes (v8: dedicated event photos)

    /* ---------------- Event bus ---------------- */
    const listeners = {};
    const bus = {
        on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); return () => bus.off(evt, fn); },
        off(evt, fn) { listeners[evt] = (listeners[evt] || []).filter((f) => f !== fn); },
        emit(evt, payload) { (listeners[evt] || []).slice().forEach((fn) => { try { fn(payload); } catch (e) { console.error(e); } }); (listeners['*'] || []).forEach((fn) => fn(evt, payload)); }
    };

    /* ---------------- Store ---------------- */
    const mem = {};
    let storageOK = true;
    try { localStorage.setItem(PREFIX + 'probe', '1'); localStorage.removeItem(PREFIX + 'probe'); } catch (e) { storageOK = false; }

    const store = {
        get(key, fallback = null) {
            try {
                const raw = storageOK ? localStorage.getItem(PREFIX + key) : mem[key];
                return raw == null ? fallback : JSON.parse(raw);
            } catch (e) { return fallback; }
        },
        set(key, value, silent = false) {
            const raw = JSON.stringify(value);
            try { if (storageOK) localStorage.setItem(PREFIX + key, raw); else mem[key] = raw; } catch (e) { mem[key] = raw; console.warn('Storage quota reached', e); }
            if (!silent) bus.emit('db:' + key, value);
        },
        remove(key) { try { storageOK ? localStorage.removeItem(PREFIX + key) : delete mem[key]; } catch (e) { /* ignore */ } },
        keys() { return storageOK ? Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length)) : Object.keys(mem); },
        init(force = false) {
            if (!force && store.get('__version') === VERSION) return;
            const theme = store.get('theme');
            const session = force ? null : store.get('session');
            store.keys().forEach((k) => store.remove(k));
            const data = EDU.seed();
            Object.entries(data).forEach(([k, v]) => store.set(k, v, true));
            store.set('__version', VERSION, true);
            if (theme) store.set('theme', theme, true);
            if (session) store.set('session', session, true);
        },
        reset() { store.init(true); }
    };

    /* Cross-tab sync: another tab changed LocalStorage → notify this tab */
    window.addEventListener('storage', (e) => {
        if (!e.key || !e.key.startsWith(PREFIX)) return;
        const key = e.key.slice(PREFIX.length);
        let val = null; try { val = JSON.parse(e.newValue); } catch (err) { /* ignore */ }
        bus.emit('db:' + key, val);
        bus.emit('remote-change', key);
    });

    /* ---------------- Collections ---------------- */
    const db = {
        all: (col) => store.get(col, []),
        obj: (col) => store.get(col, {}),
        find: (col, id) => db.all(col).find((x) => x.id === id) || null,
        where: (col, fn) => db.all(col).filter(fn),
        insert(col, item, atStart = true) {
            const list = db.all(col);
            if (!item.id) item.id = U.uid(col.slice(0, 3).toUpperCase());
            atStart ? list.unshift(item) : list.push(item);
            store.set(col, list);
            return item;
        },
        update(col, id, patch) {
            const list = db.all(col);
            const i = list.findIndex((x) => x.id === id);
            if (i < 0) return null;
            list[i] = typeof patch === 'function' ? patch(list[i]) : Object.assign({}, list[i], patch);
            store.set(col, list);
            return list[i];
        },
        remove(col, id) { store.set(col, db.all(col).filter((x) => x.id !== id)); },
        setObj(col, key, value) { const o = db.obj(col); o[key] = value; store.set(col, o); return o; }
    };

    /* ---------------- API facade ----------------
       Simulates network latency so loading states are visible.
       Replace each function body with fetch('/api/...') when a backend exists. */
    const latency = (ms = 350) => U.sleep(ms + Math.random() * 250);
    const api = {
        async list(col, filter) { await latency(200); const all = db.all(col); return filter ? all.filter(filter) : all; },
        async get(col, id) { await latency(150); return db.find(col, id); },
        async create(col, item) { await latency(); return db.insert(col, item); },
        async update(col, id, patch) { await latency(); return db.update(col, id, patch); },
        async remove(col, id) { await latency(); db.remove(col, id); return true; },
        async login(identifier, password, role) {
            await latency(700);
            const id = String(identifier).trim().toLowerCase();
            const users = db.all('users');
            const user = users.find((u) => (u.email.toLowerCase() === id || (u.studentId || '').toLowerCase() === id) && u.password === password);
            if (!user) throw new Error('Invalid credentials. Check your email / ID and password.');
            if (role && user.role !== role) throw new Error(`This account is registered as ${U.cap(user.role)}. Please choose the ${U.cap(user.role)} tab.`);
            return user;
        },
        async submitApplication(app) { await latency(900); return db.insert('admissions', app); },
        async pay(studentId, categories, method) {
            await latency(1400);
            const fees = db.obj('fees');
            const acc = fees[studentId];
            let amount = 0;
            acc.items.forEach((it) => { if (categories.includes(it.category) && it.paid < it.amount) { amount += it.amount - it.paid; it.paid = it.amount; } });
            const receipt = { id: 'RCPT-' + new Date().getFullYear() + '-' + String(Math.floor(2000 + Math.random() * 7000)), date: U.rel(0), amount, method, ref: `${method.split(' ')[0].toUpperCase()}/${Math.floor(1e7 + Math.random() * 9e7)}`, items: categories.join(', ') };
            acc.payments.unshift(receipt);
            store.set('fees', fees);
            return receipt;
        }
    };

    /* ---------------- Realtime (simulated socket) ----------------
       API mirrors a WebSocket client: connect(), subscribe(channel, cb), send().
       To go live: open `new WebSocket(url)` in connect() and route incoming
       messages to `dispatch(channel, payload)`. */
    const subs = {};
    const timers = [];
    const dispatch = (channel, payload) => (subs[channel] || []).forEach((cb) => cb(payload));
    const realtime = {
        connected: false,
        subscribe(channel, cb) { (subs[channel] = subs[channel] || []).push(cb); return () => { subs[channel] = subs[channel].filter((f) => f !== cb); }; },
        send(channel, payload) { setTimeout(() => dispatch(channel, payload), 60); },
        every(ms, fn) { const t = setInterval(fn, ms); timers.push(t); return t; },
        dispatch,
        connect() {
            if (realtime.connected) return;
            realtime.connected = true;
            realtime.every(1000, () => dispatch('clock', new Date()));
            bus.emit('realtime:connected');
        }
    };

    EDU.bus = bus;
    EDU.store = store;
    EDU.db = db;
    EDU.api = api;
    EDU.realtime = realtime;

    store.init();
})(window.EDU);
