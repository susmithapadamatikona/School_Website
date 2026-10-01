/* ==========================================================================
   Site chrome — announcement bar, sticky navbar, mobile drawer,
   footer. Injected into [data-include="header"] / [data-include="footer"].
   ========================================================================== */
(function (EDU) {
    'use strict';
    const { $, $$, esc } = EDU.utils;
    const S = EDU.ref.SCHOOL;
    // Dark logo for light backgrounds, whitish-blue logo for dark ones (swapped in css/header.css)
    const LOGO = '<img class="logo-img logo-img-dark" src="assets/images/stackly-logo-dark.webp" alt="Stackly" width="320" height="132"><img class="logo-img logo-img-light" src="assets/images/stackly-logo-light.webp" alt="" aria-hidden="true" width="320" height="132">';

    // Plain top-level links (no dropdowns). `match` lists sub-pages that keep the parent link highlighted.
    const NAV = [
        { label: 'Home', href: 'index.html' },
        { label: 'About', href: 'about.html', match: ['principal.html', 'vision-mission.html', 'achievements.html', 'alumni.html'] },
        { label: 'Academics', href: 'academics.html', match: ['departments.html', 'faculty.html'] },
        { label: 'Admissions', href: 'admissions.html', match: ['admission-process.html', 'fees.html', 'apply.html', 'faq.html'] },
        { label: 'Campus', href: 'campus.html', match: ['facilities.html', 'library.html', 'transportation.html', 'gallery.html'] },
        { label: 'Contact', href: 'contact.html' }
    ];

    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const isActive = (item) => item.href === page || (item.match || []).includes(page);

    function header() {
        const user = EDU.auth && EDU.auth.user();
        const items = NAV.map((item) => {
            const active = isActive(item) ? ' active' : '';
            const cur = item.href === page ? ' aria-current="page"' : '';
            return `<li class="nav-item"><a class="nav-link${active}" href="${item.href}"${cur}>${item.label}</a></li>`;
        }).join('');

        // Login / Sign Up are always shown in the header
        const portal = `<a class="btn btn-ghost btn-sm nav-login" href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Login</a>
               <a class="btn btn-primary btn-sm nav-signup" href="register.html"><i class="fa-solid fa-user-plus"></i> Sign Up</a>`;

        return `
        <div class="announcement-bar" id="announcementBar" role="region" aria-label="Announcements">
            <div class="container container-wide ann-inner">
                <div class="ann-text"><span class="ann-badge"><i class="fa-solid fa-bullhorn"></i> Live</span><span class="ann-msg" id="annMsg" aria-live="polite"></span></div>
                <div class="ann-actions"><a class="primary" href="apply.html">Apply Now</a><a href="admission-process.html">View Admission Process</a>
                <button class="ann-close" aria-label="Dismiss announcement"><i class="fa-solid fa-xmark"></i></button></div>
            </div>
        </div>
        <header class="site-header" id="siteHeader">
            <div class="container container-wide nav-inner">
                <a class="logo" href="index.html" aria-label="Stackly International School — Home">
                    ${LOGO}
                </a>
                <nav class="main-nav" aria-label="Primary"><ul class="nav-list">${items}</ul></nav>
                <div class="nav-actions">
                    ${portal}
                    <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileNav"><span></span><span></span><span></span></button>
                </div>
            </div>
        </header>
        <div class="mobile-nav-overlay" data-mobile-close></div>
        <aside class="mobile-nav" id="mobileNav" aria-label="Mobile navigation" aria-hidden="true">
            <div class="mobile-nav-head">
                <a class="logo" href="index.html">${LOGO}</a>
                <button class="btn-icon bordered" data-mobile-close aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="mobile-nav-body">
                ${NAV.map((item) => `<a class="m-link${isActive(item) ? ' active' : ''}" href="${item.href}">${item.label}</a>`).join('')}
            </div>
            <div class="mobile-nav-foot">
                ${user ? `<a class="btn btn-soft btn-block" href="${EDU.auth.DASH[user.role]}"><i class="fa-solid fa-gauge-high"></i> My Dashboard</a>` : ''}
                <div class="row">
                    <a class="btn btn-outline btn-sm" href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Login</a>
                    <a class="btn btn-primary btn-sm" href="register.html"><i class="fa-solid fa-user-plus"></i> Sign Up</a>
                </div>
            </div>
        </aside>`;
    }

    function footer() {
        const year = new Date().getFullYear();
        return `
        <footer class="site-footer">
            <div class="container">
                <div class="footer-top">
                    <div class="footer-brand">
                        <a class="logo" href="index.html">${LOGO}</a>
                        <p>Since 2001, EDUCARE has combined academic rigour, modern technology and strong values to prepare confident, compassionate leaders for tomorrow.</p>
                        <div class="footer-social">
                            <a href="404.html" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
                            <a href="404.html" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                            <a href="404.html" aria-label="X (Twitter)"><i class="fa-brands fa-x-twitter"></i></a>
                            <a href="404.html" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
                            <a href="404.html" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
                        </div>
                    </div>
                    <div class="footer-col"><h4>Explore</h4><ul class="footer-links">
                        <li><a href="about.html">About Us</a></li><li><a href="principal.html">Principal's Message</a></li><li><a href="campus.html">Campus Tour</a></li>
                        <li><a href="achievements.html">Achievements</a></li><li><a href="gallery.html">Gallery</a></li></ul></div>
                    <div class="footer-col hide-lg"><h4>Academics</h4><ul class="footer-links">
                        <li><a href="academics.html">Programs</a></li><li><a href="departments.html">Departments</a></li><li><a href="faculty.html">Faculty</a></li>
                        <li><a href="student-life.html">Student Life</a></li><li><a href="sports.html">Sports</a></li></ul></div>
                    <div class="footer-col"><h4>Portals</h4><ul class="footer-links">
                        <li><a href="login.html?role=student">Student Portal</a></li><li><a href="login.html?role=parent">Parent Portal</a></li><li><a href="login.html?role=teacher">Teacher Portal</a></li>
                        <li><a href="login.html?role=admin">Admin Login</a></li><li><a href="apply.html">Apply Online</a></li></ul></div>
                    <div class="footer-col"><h4>Get in Touch</h4>
                        <div class="footer-contact">
                            <div><i class="fa-solid fa-location-dot"></i><span>${esc(S.address)}</span></div>
                            <div><i class="fa-solid fa-phone"></i><a href="tel:${S.phone.replace(/\s/g, '')}">${S.phone}</a></div>
                            <div><i class="fa-solid fa-envelope"></i><a href="mailto:${S.email}">${S.email}</a></div>
                            <div><i class="fa-solid fa-clock"></i><span>${S.hours}</span></div>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    <span>© ${year} EDUCARE International School, Hyderabad. All rights reserved.</span>
                    <nav aria-label="Legal"><a href="404.html">Privacy Policy</a><a href="404.html">Terms of Use</a><a href="404.html">Child Safeguarding</a><a href="404.html">Mandatory Disclosure</a></nav>
                </div>
            </div>
        </footer>`;
    }

    /* ---------- Behaviour ---------- */
    function bindHeader() {
        const hdr = $('#siteHeader');
        if (!hdr) return;
        const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        // Mobile drawer
        const drawer = $('#mobileNav');
        const overlay = $('.mobile-nav-overlay');
        const toggle = $('.nav-toggle');
        const setOpen = (open) => {
            drawer.classList.toggle('open', open); overlay.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', String(open)); drawer.setAttribute('aria-hidden', String(!open));
            document.body.classList.toggle('no-scroll', open);
            if (open) setTimeout(() => drawer.querySelector('.m-link').focus(), 300);
        };
        toggle.addEventListener('click', () => setOpen(!drawer.classList.contains('open')));
        $$('[data-mobile-close]').forEach((b) => b.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) { setOpen(false); toggle.focus(); } });
        window.addEventListener('resize', () => { if (window.innerWidth > 1180 && drawer.classList.contains('open')) setOpen(false); });
    }

    /* Announcement bar — rotates messages stored in settings; live-updates when admin edits them */
    function bindAnnouncement() {
        const bar = $('#announcementBar');
        if (!bar) return;
        if (sessionStorage.getItem('educare:ann-dismissed')) { bar.classList.add('dismissed'); return; }
        const msgEl = $('#annMsg');
        let i = 0, list = [];
        const load = () => { list = (EDU.db.obj('settings').announcements || []).filter(Boolean); if (!list.length) list = ['Welcome to EDUCARE International School']; };
        const show = () => { msgEl.classList.remove('swap'); void msgEl.offsetWidth; msgEl.textContent = list[i % list.length]; msgEl.classList.add('swap'); };
        load(); show();
        setInterval(() => { i++; show(); }, 5000);
        EDU.bus.on('db:settings', () => { load(); i = 0; show(); });
        bar.querySelector('.ann-close').addEventListener('click', () => { bar.classList.add('dismissed'); try { sessionStorage.setItem('educare:ann-dismissed', '1'); } catch (e) { /* ignore */ } });
    }

    EDU.navbar = {
        NAV,
        render() {
            const h = $('[data-include="header"]');
            const f = $('[data-include="footer"]');
            if (h) { h.outerHTML = header(); bindHeader(); bindAnnouncement(); }
            if (f) f.outerHTML = footer();
            if (document.body.dataset.header === 'solid') { const hd = $('#siteHeader'); hd && hd.classList.add('solid'); }
        }
    };
})(window.EDU);
