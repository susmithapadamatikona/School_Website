/* ==========================================================================
   Transportation — live bus simulation, Leaflet map (school marker, route
   lines, stops, moving buses), fleet list & details. Used by the portal
   view "transport" and the public transportation page.
   Positions are simulated in memory and broadcast on the realtime channel
   "buses" (swap startSim() for a GPS WebSocket feed in production).
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const { $, $$, esc, fmtTime } = U;
    EDU.views = EDU.views || {};

    let fleet = null, simStarted = false;
    const load = () => { if (!fleet) fleet = EDU.db.all('buses').map((b) => ({ ...b })); return fleet; };

    const dist = (a, b) => Math.hypot(a.lat - b.lat, a.lng - b.lng);
    function position(bus) {
        const s = bus.stops;
        const lens = s.slice(1).map((p, i) => dist(s[i], p));
        const total = lens.reduce((a, b) => a + b, 0);
        let d = bus.progress * total;
        for (let i = 0; i < lens.length; i++) {
            if (d <= lens[i] || i === lens.length - 1) {
                const t = lens[i] ? Math.min(1, d / lens[i]) : 1;
                return { lat: s[i].lat + (s[i + 1].lat - s[i].lat) * t, lng: s[i].lng + (s[i + 1].lng - s[i].lng) * t, seg: i, t };
            }
            d -= lens[i];
        }
        return { lat: s[s.length - 1].lat, lng: s[s.length - 1].lng, seg: lens.length - 1, t: 1 };
    }
    const status = (b) => b.progress >= 1 ? 'Arrived' : b.progress <= 0 ? 'Not Started' : b.delayed ? 'Delayed' : 'On Route';
    const eta = (b) => { if (b.progress >= 1) return 'At campus'; const mins = Math.round((1 - b.progress) * 50 * (b.delayed ? 1.3 : 1)); return b.progress <= 0 ? `Departs ${fmtTime(b.departure)}` : `${mins} min to campus`; };
    const nextStop = (b) => { const p = position(b); return b.progress >= 1 ? null : b.stops[Math.min(b.stops.length - 1, p.seg + 1)]; };

    function startSim() {
        if (simStarted) return;
        simStarted = true;
        load();
        const hold = {};
        setInterval(() => {
            fleet.forEach((b) => {
                if (b.progress >= 1) { hold[b.id] = (hold[b.id] || 0) + 1; if (hold[b.id] > 20) { b.progress = 0; hold[b.id] = 0; b.delayed = Math.random() < .2; } return; }
                if (b.progress <= 0) { if (Math.random() < .18) b.progress = 0.005; return; }
                const before = nextStop(b);
                b.progress = Math.min(1, b.progress + (b.delayed ? 0.004 : 0.009) * (0.7 + Math.random() * 0.6));
                const after = nextStop(b);
                if (before && after !== before) EDU.bus.emit('bus:stop', { bus: b, stop: before });
                if (b.progress >= 1) EDU.bus.emit('bus:arrived', b);
            });
            EDU.realtime.dispatch('buses', fleet);
        }, 2500);
    }

    /* ---------------- Map ---------------- */
    function map(el, { focus, onSelect } = {}) {
        if (!window.L) { el.innerHTML = `<div class="map-fallback">${U.empty('Map unavailable', 'Connect to the internet to load the live map (Leaflet / OpenStreetMap).', 'fa-map')}</div>`; return { update() {}, focus() {} }; }
        const L = window.L;
        const school = EDU.ref.SCHOOL.coords;
        const m = L.map(el, { zoomControl: true, scrollWheelZoom: false }).setView(school, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' }).addTo(m);
        L.marker(school, { icon: L.divIcon({ className: '', html: '<div class="school-marker"><i class="fa-solid fa-graduation-cap"></i></div>', iconSize: [44, 44], iconAnchor: [22, 22] }) }).addTo(m).bindPopup('<strong>EDUCARE International School</strong><br>Gachibowli, Hyderabad');
        const markers = {}, lines = {};
        const all = load();
        const bounds = L.latLngBounds([school]);
        all.forEach((b) => {
            lines[b.id] = L.polyline(b.stops.map((s) => [s.lat, s.lng]), { color: b.color, weight: 4, opacity: .55, dashArray: '8 8' }).addTo(m);
            b.stops.slice(0, -1).forEach((s) => { L.marker([s.lat, s.lng], { icon: L.divIcon({ className: '', html: '<div class="stop-marker"></div>', iconSize: [14, 14], iconAnchor: [7, 7] }) }).addTo(m).bindTooltip(`${esc(s.name)} · ${fmtTime(s.time)}`); bounds.extend([s.lat, s.lng]); });
            const p = position(b);
            markers[b.id] = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: `<div class="bus-marker" style="background:${b.color}"><i class="fa-solid fa-bus"></i></div>`, iconSize: [38, 38], iconAnchor: [19, 19] }), zIndexOffset: 1000 }).addTo(m)
                .bindPopup(() => { const x = load().find((y) => y.id === b.id); return `<strong>${esc(x.id)} · ${esc(x.number)}</strong><br>${esc(x.route)}<br>${status(x)} · ${eta(x)}`; });
            markers[b.id].on('click', () => onSelect && onSelect(b.id));
        });
        m.fitBounds(bounds, { padding: [30, 30] });
        setTimeout(() => m.invalidateSize(), 200);
        const api = {
            map: m,
            update(list) { list.forEach((b) => { const p = position(b); markers[b.id] && markers[b.id].setLatLng([p.lat, p.lng]); }); },
            focus(id) {
                Object.entries(lines).forEach(([k, l]) => l.setStyle({ opacity: k === id ? .95 : .25, weight: k === id ? 6 : 3, dashArray: k === id ? null : '8 8' }));
                const b = load().find((x) => x.id === id); if (!b) return;
                m.fitBounds(L.latLngBounds(b.stops.map((s) => [s.lat, s.lng])), { padding: [50, 50] });
            }
        };
        if (focus) api.focus(focus);
        return api;
    }

    function busItem(b, active, mine) {
        return `<button class="bus-item ${active ? 'active' : ''}" data-bus="${b.id}">
            <div class="top"><h4><span style="width:12px;height:12px;border-radius:4px;background:${b.color};display:inline-block"></span>${esc(b.id)}${mine ? ' <span class="badge badge-primary">Your bus</span>' : ''}</h4>${U.statusBadge(status(b))}</div>
            <div class="meta"><span><i class="fa-solid fa-route"></i> ${esc(b.route.split('·')[1] || b.route)}</span><span><i class="fa-regular fa-clock"></i> ${eta(b)} · ${b.students}/${b.capacity} students</span></div>
            <div class="progress sm mt-8 ${status(b) === 'Delayed' ? 'danger' : 'success'}"><span style="width:${Math.round(b.progress * 100)}%;transition:width 2s linear"></span></div></button>`;
    }

    function detail(b, myStop) {
        const p = position(b);
        return `<div class="flex items-center gap-12 mb-16"><span class="icon-box" style="background:${b.color}22;color:${b.color}"><i class="fa-solid fa-bus"></i></span><div class="grow"><h4 class="mb-0">${esc(b.id)} · ${esc(b.number)}</h4><small class="text-muted">${esc(b.route)}</small></div>${U.statusBadge(status(b))}</div>
            <div class="detail-list mb-16"><div><small>Driver</small><strong>${esc(b.driver)}</strong></div><div><small>Contact</small><strong><a href="tel:${b.driverPhone.replace(/\s/g, '')}">${esc(b.driverPhone)}</a></strong></div><div><small>Attendant</small><strong>${esc(b.attendant)}</strong></div><div><small>Students</small><strong>${b.students} / ${b.capacity}</strong></div><div><small>Departure</small><strong>${fmtTime(b.departure)}</strong></div><div><small>Arrival</small><strong>${fmtTime(b.arrival)}</strong></div><div><small>Current location</small><strong>${b.progress >= 1 ? 'Campus' : b.progress <= 0 ? esc(b.stops[0].name) : `Near ${esc(b.stops[Math.min(b.stops.length - 1, p.t > .5 ? p.seg + 1 : p.seg)].name)}`}</strong></div><div><small>ETA</small><strong>${eta(b)}</strong></div></div>
            <ul class="route-steps">${b.stops.map((s, i) => { const passed = b.progress >= 1 || i < p.seg + (p.t >= 1 ? 1 : 0) + (i === 0 && b.progress > 0 ? 1 : 0); const next = !passed && i === p.seg + 1 && b.progress > 0; return `<li class="${passed ? 'passed' : ''} ${next ? 'next' : ''}"><span>${esc(s.name)}${myStop && s.name === myStop ? ' <span class="badge badge-primary">Your stop</span>' : ''}</span><small class="text-muted">${fmtTime(s.time)}</small></li>`; }).join('')}</ul>`;
    }

    EDU.views.transport = {
        title: 'Bus Tracking',
        render(c) {
            const mine = c.student ? c.student.busId : null;
            return `${EDU.ui.pageHead('Live Bus Tracking', mine ? `${esc(c.student.name)} travels on ${mine} · Stop: ${esc(c.student.area)}` : 'Real-time GPS positions of the school fleet.', '<span class="badge badge-success badge-dot">GPS live · refreshes every 2.5s</span>')}
                <div class="kpi-grid" id="tKpis"></div>
                <div class="track-layout"><div><div class="bus-list" id="busList"></div></div>
                <div><div class="track-map" id="trackMap"></div><section class="panel mt-24"><div class="panel-body" id="busDetail"></div></section></div></div>`;
        },
        mount(el, c) {
            startSim();
            const mine = c.student ? c.student.busId : null;
            const myStop = c.student ? (load().find((b) => b.id === mine) || { stops: [] }).stops.find((s) => s.name === c.student.area) : null;
            let selected = mine || load()[0].id;
            const mp = map($('#trackMap', el), { focus: selected, onSelect: (id) => select(id) });
            const draw = () => {
                const list = load();
                $('#busList', el).innerHTML = list.slice().sort((a, b) => (b.id === mine) - (a.id === mine)).map((b) => busItem(b, b.id === selected, b.id === mine)).join('');
                $('#busDetail', el).innerHTML = detail(list.find((b) => b.id === selected), myStop && myStop.name);
                const cnt = (s) => list.filter((b) => status(b) === s).length;
                $('#tKpis', el).innerHTML = [EDU.ui.kpi({ label: 'On Route', value: cnt('On Route'), icon: 'fa-route', box: 'green' }), EDU.ui.kpi({ label: 'Arrived', value: cnt('Arrived'), icon: 'fa-flag-checkered', box: '' }), EDU.ui.kpi({ label: 'Delayed', value: cnt('Delayed'), icon: 'fa-triangle-exclamation', box: 'red' }), EDU.ui.kpi({ label: 'Not Started', value: cnt('Not Started'), icon: 'fa-pause', box: 'gold' })].join('');
                mp.update(list);
            };
            const select = (id) => { selected = id; mp.focus(id); draw(); };
            el.addEventListener('click', (e) => { const b = e.target.closest('[data-bus]'); if (b) select(b.dataset.bus); });
            draw();
            c.sub('buses', draw);
            if (mine) c.on('bus:stop', ({ bus, stop }) => { if (bus.id === mine) EDU.toast.info(`${bus.id} update`, `Passed ${stop.name}. ${eta(bus)}.`, 3500); });
        }
    };

    /* Public transportation page */
    EDU.bus.on('ready', () => {
        const el = $('#publicMap');
        if (!el) return;
        startSim();
        const mp = map(el, {});
        const list = $('#publicBusList');
        const draw = (f) => { mp.update(f); if (list) list.innerHTML = f.map((b) => busItem(b, false, false)).join(''); };
        draw(load());
        EDU.realtime.subscribe('buses', draw);
        list && list.addEventListener('click', (e) => { const b = e.target.closest('[data-bus]'); if (b) { mp.focus(b.dataset.bus); $$('.bus-item', list).forEach((x) => x.classList.toggle('active', x === b)); } });
    });

    EDU.transport = { startSim, status, eta, position, get: (id) => load().find((b) => b.id === id), list: load };
})(window.EDU);
