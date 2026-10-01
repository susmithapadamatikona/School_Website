# EDUCARE International School — Website & School Management Platform

A complete school website plus student, teacher, parent and admin portals, built with **HTML5, CSS3 and vanilla JavaScript only**. There's no framework and no build step. Every feature runs in the browser on LocalStorage, and all data access goes through one service layer, so a real backend can replace it later.

---

## Quick start

```bash
# any static server works; for example:
python -m http.server 8080
# then open http://localhost:8080
```

You can also open `index.html` straight from disk. All scripts are classic (not ES modules), so `file://` works too.

Two things need an internet connection: the CDN libraries (Font Awesome, Google Fonts, Chart.js, Leaflet with OpenStreetMap tiles) and the Unsplash photos. Without a connection, images fall back to an SVG placeholder, and the charts and maps show a friendly "unavailable" state.

### Demo accounts

| Portal  | Login                                         | Password     |
|---------|-----------------------------------------------|--------------|
| Student | `STU2026001` or `aarav.sharma@educare.edu`    | `student123` |
| Teacher | `priya.menon@educare.edu`                     | `teacher123` |
| Parent  | `rajesh.sharma@gmail.com` (2 children)        | `parent123`  |
| Admin   | `admin@educare.edu`                           | `admin123`   |

The login page has an **Autofill** button for each role. To restore the original sample data, go to **Settings → Reset demo data** in any portal.

---

## What's included

### Public website (33 pages)
Home, About, Principal's Message, Vision & Mission, Academics, Departments, Faculty directory (search, filters, sorting, pagination, profile modal), Admissions, Admission Process, Fee Structure, Apply Online (5-step form with draft autosave), Campus (slider, lightbox, zoom, virtual tour), Facilities, Student Life, Sports, Clubs & Activities, Events (search, category and date filters, upcoming/past), Event Details (countdown, schedule, speakers, gallery, registration, .ics download), Gallery (masonry, filters, lightbox with zoom, fullscreen and swipe), Achievements & Awards, Alumni, Transportation (live map), Library (live catalogue), News, Blog, Blog Details, FAQ, Contact (form and map), Login, Register (password strength meter), Forgot Password (OTP flow) and 404.

The public pages share these site-wide features: an announcement bar the admin can edit live, a sticky transparent/solid navbar, dropdowns and an Academics mega menu, a mobile drawer, a search overlay (Ctrl/⌘ + K), dark mode, a loader, a scroll progress bar, a back-to-top button, a floating "Apply" button, scroll-reveal animations, animated counters, page transitions and toasts.

### Portals (17 pages, one shared shell)
- **Student:** dashboard, profile, attendance (calendar and 3 charts), timetable (week navigation, day filter, live "NOW" marker), homework and assignments (upload and submit, feedback), exams (live countdown), results (GPA, rank, 3 charts, printable and downloadable report card), subjects, online classes (live indicator, virtual classroom, recordings), library (renew, reserve), fees (pay online, receipts, invoice), events, live bus tracking, messages, notifications, notices and settings.
- **Teacher:** dashboard with quick actions, my classes, students, mark attendance, timetable, create and review homework and assignments, schedule exams, enter marks, results analysis, lesson plans (kanban board), upload study materials and send announcements.
- **Parent:** switch between children, dashboard, the children view, attendance, timetable, homework, exams, results, fees and payment, events, live bus tracking, messages and notices.
- **Admin:** a live dashboard with 8 KPIs, 7 charts and an activity feed; CRUD for students and teachers; parents; admissions review; classes; subjects; attendance analytics; exams; results; fees with defaulters and reminders; library management (add, edit, delete, issue, return, members); fleet tracking; notices; events; reports (CSV export); analytics; and an announcement editor.

### Real-time behaviour
- A simulated push stream sends role-specific notifications, with a bell shake and a toast.
- Buses move along their routes on a Leaflet map, and status and ETA update every 2.5 seconds.
- The admin dashboard shows a live activity feed plus live attendance and online-user KPIs.
- A live clock, countdowns and online-class status all update on their own.
- **Cross-tab sync is real.** Try it: open the teacher portal in one tab and the parent portal in another, then save attendance in the teacher tab. The parent tab updates instantly through the browser `storage` event. The same goes for new applications, notices, messages, fee payments and admin announcement edits.

---

## Project structure

```
index.html … 404.html        Public pages (static HTML; header/footer injected by js/navbar.js)
*-dashboard.html, attendance.html, …  Portal pages (thin shells: <body data-view="…">)
css/
  style.css          Entry point — @imports everything below in order
  variables.css      Design tokens (palette, radius, shadows, dark theme)
  base.css           Reset, typography, layout, page hero, loader, scroll UI
  utilities.css      Grid, cards, badges, chips, avatars, tabs, accordion, modal, toast, tooltip, skeleton
  buttons.css forms.css tables.css animations.css
  header.css hero.css school.css academics.css faculty.css admissions.css events.css gallery.css footer.css
  dashboard.css      Portal shell & widgets (calendar, timetable, mail, bus tracking, …)
  responsive.css     Breakpoints: 1480 / 1320 / 1180 / 991 / 767 / 420
js/
  utils.js           EDU namespace, date/format helpers, image map, avatars
  storage.js         EDU.store (LocalStorage) · EDU.db (collections) · EDU.api (async facade)
                     EDU.bus (event bus + cross-tab sync) · EDU.realtime (simulated socket)
  auth.js            Login / register / forgot password / session & role guard
  toast.js modal.js validation.js animations.js
  navbar.js search.js slider.js gallery.js filter.js components.js   Public site
  admission.js events.js library.js transport.js                     Shared public + portal
  dashboard.js       Portal shell, router, data helpers, 4 role dashboards
  charts.js notifications.js messages.js attendance.js timetable.js homework.js
  assignments.js exams.js results.js fees.js portal-views.js         Portal views
  main.js            Bootstrap (theme, loader, scroll UI, transitions) — loaded last
assets/
  data/school-data.js   Website content + seed data generator (dates relative to today)
  icons/favicon.svg
  images/…              Folders for your own photography (demo uses Unsplash URLs)
```

## Connecting a real backend

1. **REST/GraphQL:** replace the bodies of `EDU.api.*` in `js/storage.js` with `fetch()` calls. The UI already awaits these promises and shows loading states.
2. **WebSockets:** in `EDU.realtime.connect()`, open a socket and forward messages to `dispatch(channel, payload)`. Views already subscribe to channels such as `clock` and `buses`, and to `db:<collection>` bus events.
3. **Bus GPS:** replace `EDU.transport.startSim()` with a feed that updates `progress` or lat/lng and dispatches on the `buses` channel.
4. **Auth:** swap `EDU.api.login` for your identity provider and keep the `{ userId, role }` session shape.

## Adding a portal view

```js
EDU.views['my-view'] = {
  title: 'My View',
  roles: ['admin'],                       // optional
  render: (ctx) => `<div>…</div>`,        // ctx.user, ctx.role, ctx.student, ctx.teacher
  mount: (el, ctx) => { ctx.on('db:students', () => ctx.rerender()); }
};
```
Then add a menu item in `MENUS` in `js/dashboard.js`. The view becomes available at `<role>-dashboard.html#my-view`.

## Accessibility & SEO
The site uses semantic landmarks, a skip link, ARIA on menus, tabs, dialogs, carousels and live regions, focus-trapped modals, keyboard navigation (menus, tabs, sliders, lightbox, search), visible focus states, form errors linked with `aria-describedby`, alt text, `prefers-reduced-motion` support, a unique title and meta description on every page, Open Graph tags and lazy-loaded images.

## Customising
- **Brand:** edit `css/variables.css`. Dark mode overrides live under `[data-theme="dark"]`.
- **Content:** edit `EDU.content` in `assets/data/school-data.js`.
- **Photos:** drop files into `assets/images/…` and reference them as `assets/images/...` in the data file. `EDU.utils.img()` passes local paths through unchanged.

> **Note:** payments, OTPs, file uploads and video classes are realistic UI simulations. No real money, SMS or streaming is involved.
