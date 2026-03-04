# คู่มือส่งมอบระบบ (ฉบับเดียวจบ) - Tracking System PSUIC

อัปเดตล่าสุด: 4 มีนาคม 2026  
Production: `https://cmdt-uic.psu.ac.th/app/`  
Project root (server): `/var/www/app`

---

## 1) ภาพรวมระบบ

ระบบนี้เป็น Web Application สำหรับแจ้งปัญหาอุปกรณ์และติดตามงานซ่อม แบ่งสิทธิ์ 3 บทบาท:

1. `user`: สแกน QR, สร้าง ticket, ติดตามสถานะ, ให้คะแนนหลังงานเสร็จ
2. `it_support`: รับงาน, อัปเดตสถานะ, ใส่โน้ต, แนบหลักฐาน, ตั้งค่าอีเมลแจ้งเตือน/Google Calendar
3. `admin`: จัดการผู้ใช้, ห้อง, อุปกรณ์, รายงาน, การตั้งค่าระบบ

สถาปัตยกรรม:

1. Frontend (React/Vite) เสิร์ฟภายใต้ path `/app`
2. Backend (Node/Express + Socket.io) รันผ่าน PM2
3. DB (MySQL) ใช้ผ่าน `DATABASE_URL` (ปัจจุบันแชร์ instance กับฐาน `wordpress`)
4. ไฟล์แนบภาพเก็บใน server file system (`UPLOAD_DIR`)

---

## 2) ข้อมูลถูกเก็บที่ไหน

### 2.1 ฐานข้อมูล (MySQL)

ตารางหลักที่ระบบใช้งาน:

1. `User`
2. `Ticket`
3. `Image` (อ้างอิงไฟล์รูปแนบของ ticket)
4. `Notification`
5. `ActivityLog`
6. `PersonalTask` (งานจาก Google Calendar ที่ sync มา)
7. `Room`, `Equipment`, `Category`, `SubComponent`
8. `EmailTemplate`, `RolePermission`, `QuickFix`

หมายเหตุสำคัญ:

1. ระบบนี้ใช้งานเฉพาะตารางข้างต้น ไม่ได้แก้ไขตาราง WordPress โดยตรง
2. ก่อน migrate/seed ต้องยืนยัน `DATABASE_URL` ให้ชี้ schema ที่ถูกต้องของระบบนี้เท่านั้น
3. ห้ามรัน seed บน production โดยไม่สำรองข้อมูลก่อน

### 2.2 ไฟล์ภาพแนบ (Upload)

1. เก็บที่โฟลเดอร์ `UPLOAD_DIR` (production ควรเป็น path ถาวร เช่น `/var/www/app/uploads`)
2. URL ที่ระบบบันทึกใน DB เป็นรูปแบบ `/uploads/<filename>`
3. ระบบรองรับการเสิร์ฟทั้ง `/uploads/...` และ `/app/uploads/...` เพื่อลดปัญหา 404 ใต้ sub-path

---

## 3) SOP Deploy (รันทีละบรรทัด)

```bash
cd /var/www/app
source ~/.bashrc
nvm use 20

# 1) อัปเดตโค้ด (ใช้วิธีองค์กร: git pull หรือ scp/rsync)

# 2) ตรวจ env + DB
npm run validate:env:prod
npm run prisma:migrate:prod
npm run prisma:generate:prod

# 3) sync email template ให้เป็นเวอร์ชันล่าสุด
npm run templates:sync:prod

# 4) build frontend
cd client
npm run build
cd ..

# 5) restart service
pm2 restart tracking-system-backend --update-env
pm2 save

# 6) health check
curl -I http://127.0.0.1:5002/app/
curl -I https://cmdt-uic.psu.ac.th/app/
```

---

## 4) การตั้งค่า Email แจ้งเตือน IT

ต้องมีค่าใน `.env.production`:

```env
MAIL_USER=psuichelpdesk@gmail.com
MAIL_PASS=<gmail-app-password>
```

พฤติกรรมระบบ:

1. เมื่อ user สร้าง ticket ระบบจะส่งอีเมลไปยัง `notificationEmail` ของผู้ใช้ role `it_support` ที่เปิด `isEmailEnabled=true`
2. เนื้อหาอีเมลใช้ template `new_ticket_it` จากตาราง `EmailTemplate`
3. ระบบ fallback ชื่อผู้แจ้งเป็น `name -> username -> email` (ลดกรณี N/A)

ตรวจสอบ:

```bash
cd /var/www/app
source ~/.bashrc
nvm use 20
npm run smtp:verify:prod
pm2 logs tracking-system-backend --lines 100 --nostream
```

---

## 5) การตั้งค่า Google Calendar (IT Schedule)

ต้องมีค่าใน `.env.production`:

```env
GOOGLE_PROJECT_ID=...
GOOGLE_CLIENT_EMAIL=...@....iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

ฝั่ง Google Calendar ต้องทำ:

1. เปิดปฏิทินที่ต้องการใช้งาน
2. Share ปฏิทินให้ `GOOGLE_CLIENT_EMAIL` ด้วยสิทธิ์อย่างน้อย `See all event details`
3. ในระบบหน้า IT Schedule ใส่ `Calendar ID` แล้วกด Save

ตรวจสอบ:

```bash
cd /var/www/app
source ~/.bashrc
nvm use 20
npm run check:google:prod
```

---

## 6) คู่มือใช้งานตามบทบาท

### 6.1 User (ผู้ใช้งานทั่วไป)

1. เข้า `https://cmdt-uic.psu.ac.th/app/login`
2. ล็อกอิน (Email หรือ PSU Passport เมื่อเปิดใช้งานจริง)
3. สแกน QR ที่อุปกรณ์ หรือเข้าเมนู Report Issue
4. กรอกหัวข้อ/รายละเอียด, เลือกหมวด, เลือกห้อง, แนบรูปก่อนซ่อม
5. กดส่ง ticket
6. ติดตามสถานะในหน้า Activity/History
7. เมื่องานสถานะ Completed ให้ประเมินความพึงพอใจ (rating/feedback)

### 6.2 IT

1. ล็อกอิน role `it_support`
2. เข้า Tickets เพื่อรับงาน (Accept) หรือปฏิเสธ (Reject + reason)
3. ระหว่างทำงานอัปเดต checklist + note และแนบรูป after
4. ปิดงานเป็น Completed
5. ตั้งค่า:
   - Notification email (Profile)
   - Google Calendar ID (Schedule)
6. ตรวจสถานะ sync ปฏิทินในหน้า Schedule

### 6.3 Admin

1. ล็อกอิน role `admin`
2. จัดการ:
   - Users
   - Rooms
   - Equipment + QR
   - Category/Sub-component
3. ติดตามรายงานและส่งออกข้อมูล
4. ดู Ticket Detail เพื่อตรวจสอบ timeline, รูป before/after, note

---

## 7) PSU Passport (Cutover)

สถานะปัจจุบัน: รออนุมัติจากศูนย์คอมพิวเตอร์มหาวิทยาลัย  
เมื่อได้รับอนุมัติ ให้ดำเนินการ:

1. ขอ `CLIENT_ID`, `CLIENT_SECRET`, authorize/token/userinfo endpoints
2. ตั้งค่า callback URL:
   - `https://cmdt-uic.psu.ac.th/app/auth/callback`
3. อัปเดต env ฝั่ง backend + frontend
4. Deploy ใหม่
5. ทดสอบ login ทั้ง 3 role และการ map account เดิม (email/username)

---

## 8) Incident / Rollback (ฉุกเฉิน)

### 8.1 อาการ: หน้าเว็บขาว / 404 / รูปไม่ขึ้น

ตรวจเร็ว:

```bash
pm2 status
pm2 logs tracking-system-backend --lines 150 --nostream
curl -I http://127.0.0.1:5002/app/
curl -I https://cmdt-uic.psu.ac.th/app/
curl -I https://cmdt-uic.psu.ac.th/app/uploads/<sample-file>
```

### 8.2 Rollback ขั้นพื้นฐาน

1. ย้อนโค้ด/ไฟล์ไป release ก่อนหน้า
2. build frontend ใหม่
3. `pm2 restart tracking-system-backend --update-env`
4. ตรวจ smoke test ซ้ำ

---

## 9) เช็กลิสต์ก่อนส่งมอบจริง

1. เปิดเว็บได้: `https://cmdt-uic.psu.ac.th/app/`
2. Login ทั้ง 3 role ผ่าน
3. User สร้าง ticket + แนบรูปได้
4. IT ได้รับอีเมลแจ้งเตือนพร้อมข้อมูลครบ (ไม่เป็น N/A)
5. IT เปิดรูปแนบจาก ticket ได้ (ไม่ 404)
6. IT อัปเดตสถานะจน Completed ได้
7. User เห็นภาพ before/after และให้คะแนนได้
8. Admin จัดการห้อง/อุปกรณ์/ผู้ใช้และ export ได้
9. Google check ผ่าน `npm run check:google:prod`
10. สำรองข้อมูล DB + uploads และส่งมอบ runbook นี้ให้ IT

