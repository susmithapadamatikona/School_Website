/* ==========================================================================
   Chart.js wrappers — theme-aware defaults, gradient area fills and a
   registry so charts are destroyed cleanly when portal views change.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const registry = new Set();
    const COLORS = { primary: '#013431', teal: '#159B78', gold: '#F59E0B', purple: '#7356D8', pink: '#EC4899', sky: '#2196F3', green: '#16A085', red: '#E74C3C', slate: '#84959A' };
    const SERIES = [COLORS.primary, COLORS.teal, COLORS.gold, COLORS.purple, COLORS.pink, COLORS.sky, COLORS.green, COLORS.red];

    const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const alpha = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

    function defaults() {
        if (!window.Chart) return;
        const C = window.Chart;
        C.defaults.font.family = "'Inter', system-ui, sans-serif";
        C.defaults.font.size = 12;
        C.defaults.color = css('--text-secondary') || '#526B72';
        C.defaults.borderColor = css('--border') || '#DDE9E8';
        C.defaults.plugins.legend.labels.usePointStyle = true;
        C.defaults.plugins.legend.labels.boxWidth = 8;
        C.defaults.plugins.legend.labels.padding = 16;
        C.defaults.plugins.tooltip.backgroundColor = '#002522';
        C.defaults.plugins.tooltip.padding = 12;
        C.defaults.plugins.tooltip.cornerRadius = 10;
        C.defaults.plugins.tooltip.titleFont = { weight: '600' };
        C.defaults.maintainAspectRatio = false;
        C.defaults.animation.duration = 1100;
        C.defaults.animation.easing = 'easeOutQuart';
    }

    function gradient(ctx, color) {
        const h = ctx.canvas.clientHeight || 280;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, alpha(color, .32));
        g.addColorStop(1, alpha(color, 0));
        return g;
    }

    function make(canvas, config) {
        if (!canvas) return null;
        if (!window.Chart) {
            canvas.parentElement.innerHTML = EDU.utils.empty('Charts unavailable', 'Connect to the internet to load Chart.js.', 'fa-chart-line');
            return null;
        }
        defaults();
        const ctx = canvas.getContext('2d');
        const fill = (ds, d) => Object.keys(d).forEach((k) => { if (ds[k] === undefined) ds[k] = d[k]; });
        (config.data.datasets || []).forEach((ds, i) => {
            const col = ds.color || SERIES[i % SERIES.length];
            if (config.type === 'line') {
                fill(ds, { borderColor: col, pointBackgroundColor: col, pointBorderColor: css('--card-bg') || '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6, tension: .4, borderWidth: 3 });
                if (ds.fill !== false) { ds.fill = true; if (!ds.backgroundColor) ds.backgroundColor = gradient(ctx, col); }
            } else if (config.type === 'bar') {
                fill(ds, { backgroundColor: col, borderRadius: 8, borderSkipped: false, maxBarThickness: 34 });
            } else if (['doughnut', 'pie', 'polarArea'].includes(config.type)) {
                fill(ds, { backgroundColor: SERIES, borderColor: css('--card-bg') || '#fff', borderWidth: 3, hoverOffset: 8 });
            } else if (config.type === 'radar') {
                fill(ds, { borderColor: col, backgroundColor: alpha(col, .18), pointBackgroundColor: col, borderWidth: 2 });
            }
            delete ds.color;
        });
        const grid = { color: css('--border'), drawTicks: false };
        const base = ['line', 'bar'].includes(config.type) ? {
            scales: {
                x: { grid: { display: false }, border: { display: false }, ticks: { padding: 8 } },
                y: { grid, border: { display: false }, ticks: { padding: 10 }, beginAtZero: true }
            }
        } : {};
        if (config.type === 'doughnut') base.cutout = '72%';
        if (config.type === 'radar') base.scales = { r: { grid: { color: css('--border') }, angleLines: { color: css('--border') }, pointLabels: { font: { size: 11 } }, ticks: { display: false } } };
        config.options = deepMerge(base, config.options || {});
        const chart = new window.Chart(ctx, config);
        registry.add(chart);
        return chart;
    }

    function deepMerge(a, b) {
        const out = Array.isArray(a) ? a.slice() : Object.assign({}, a);
        Object.keys(b).forEach((k) => {
            out[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') ? deepMerge(a[k], b[k]) : b[k];
        });
        return out;
    }

    function destroyAll() { registry.forEach((c) => { try { c.destroy(); } catch (e) { /* ignore */ } }); registry.clear(); }

    /* Tiny inline SVG sparkline for KPI cards (no Chart.js needed) */
    function spark(values, color = COLORS.primary) {
        const max = Math.max(...values), min = Math.min(...values);
        const pts = values.map((v, i) => `${(i / (values.length - 1)) * 110},${40 - ((v - min) / (max - min || 1)) * 34}`).join(' ');
        return `<svg class="spark" viewBox="0 0 110 44" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    EDU.charts = { make, destroyAll, spark, COLORS, SERIES, alpha };
})(window.EDU);
