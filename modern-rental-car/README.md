# Modern Rental Car

Car rental website: public fleet, customer dashboard, admin dashboard. HTML, CSS, vanilla JavaScript and Bootstrap 5.3 (CDN). No backend and no build tools; data is stored in the browser's localStorage and seeded on first load.

## Run
1. Keep the folder structure as is.
2. Open `index.html` in a browser (internet needed once for the Bootstrap CDN).

## Demo logins
- Admin: admin@mrc.test / admin123 (goes to `admin.html`)
- Customer: user@mrc.test / user123 (goes to `dashboard.html`)
- New registrations are always customers.

## Files
- `index.html` public fleet, filters, car details
- `login.html`, `register.html` authentication, role-based redirect
- `dashboard.html` customer: bookings, new reservation, profile
- `admin.html` admin: overview stats, vehicles, bookings
- `css/style.css` dark green theme on top of Bootstrap
- `js/store.js` data, seed, auth, helpers; `js/public.js`, `js/auth.js`, `js/user.js`, `js/admin.js` page scripts

## Notes
- Reset data: clear this site's localStorage (DevTools > Application) and reload.
- Passwords are stored in plain text in localStorage. This is a demo only; real use needs a server.
