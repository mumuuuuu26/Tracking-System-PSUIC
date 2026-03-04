# UAT Regression Checklist (Production)

Target:
- URL: `https://cmdt-uic.psu.ac.th/app/`
- Date:
- Tester:
- Build/Commit:

## 0) Pre-check (must pass before UAT)

Run on server:

```bash
cd /var/www/app
source ~/.bashrc
nvm use 20
pm2 status
curl -I https://cmdt-uic.psu.ac.th/app/
curl -i 'https://cmdt-uic.psu.ac.th/app/socket.io/?EIO=4&transport=polling' | head -n 5
npm run preflight:prod
```

Expected:
- PM2 app = `online`
- `/app` = `200 OK`
- `/app/socket.io` = `200 OK`
- `preflight:prod` passes

## 1) Login / Auth

1. User login with email/password.
2. IT login with email/password.
3. Admin login with email/password.
4. Logout all roles.
5. Open protected routes directly without login.

Expected:
- Correct role-based landing page.
- Protected routes redirect to login when not authenticated.

## 2) Ticket Submit (User)

1. User opens `Report Issue`.
2. Fill required fields + optional photo.
3. Click `Submit` once.
4. Verify no duplicate ticket created from one click.
5. Open created ticket detail.

Expected:
- Single ticket created.
- Success dialog appears quickly.
- Created ticket data correct (category/room/priority/description/image).

## 3) Upload Image / Attachment

1. Upload image when creating ticket.
2. Open ticket from User and IT screens.
3. Click attachment preview.

Expected:
- Image URL loads from `/app/uploads/...`.
- No broken image icon.
- Attachment preview is accessible from both roles.

## 4) Email Notification

1. Ensure IT profile has notification email and enabled toggle.
2. User submits new ticket.
3. Check received email content.

Expected:
- Email received by IT.
- Email includes: ticket id, category, location, urgency, title/description, open link.
- Open link goes to app ticket page (not main website 404 page).

## 5) Google Calendar Sync

1. IT opens Schedule page.
2. Calendar connection is configured.
3. Create/update event in Google Calendar.
4. Verify schedule reflects update in app.

Expected:
- Connection succeeds.
- Event appears in app schedule after refresh interval.
- No recurring 404 errors for wrong socket path in browser console.

## 6) Export (Admin)

1. Open Admin Reports.
2. Export PDF.
3. Export Excel.

Expected:
- Export succeeds without error popup.
- Download file name is meaningful.
- PDF title/branding shows `IT Helpdesk Ticketing System`.

## 7) Role Permission

1. User cannot access `/app/admin/*` and `/app/it/*`.
2. IT cannot access admin-only pages.
3. Admin can access all admin modules.

Expected:
- Unauthorized access blocked/redirected correctly.

## 8) Realtime / Socket

1. Keep IT dashboard open.
2. Create new ticket from user account.
3. Verify IT dashboard counters/list update.

Expected:
- Ticket appears without hard reload (or within polling fallback interval).
- Console has no continuous `/socket.io` 404 spam.

## 9) Rating Link

1. Open completed ticket in user portal.
2. Click `Rating`.

Expected:
- Opens configured Google Form:
  `https://docs.google.com/forms/d/e/1FAIpQLSe2rO383UTujd71fYgMwdbHcWuRm4NaKGMEmRIv-T_fya8Dcw/viewform`

## 10) Final Sign-off

Release decision:
- [ ] Go-live approved
- [ ] Blocked (fix required)

If blocked, log:
- Issue:
- Severity:
- Affected role:
- Repro steps:
- Owner:
- ETA:
