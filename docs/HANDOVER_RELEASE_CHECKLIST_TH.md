# Checklist ก่อนส่งมอบจริง (1 หน้า) + คำสั่ง Commit/Push ที่ปลอดภัย

วันที่อ้างอิง: 2 มีนาคม 2026  
Repo: `https://github.com/mumuuuuu26/Tracking-System-PSUIC`  
Branch หลัก: `main`

---

## A) Checklist ก่อนส่งมอบจริง

1. ยืนยันว่า production ใช้งานได้: `https://cmdt-uic.psu.ac.th/app/`
2. ยืนยัน IT รับเอกสารครบ: Handover, Executive Summary, PDF
3. ยืนยันว่าไฟล์ที่จะ push มีเฉพาะไฟล์ส่งมอบ (ไม่ปนไฟล์ CSV/XLSX/ไฟล์ส่วนตัว)
4. ยืนยันว่า `main` ในเครื่อง sync กับ `origin/main`
5. หลัง push ให้สร้าง tag release สำหรับจุดส่งมอบ

---

## B) ไฟล์ที่ "ควร" ขึ้น GitHub สำหรับการส่งมอบรอบนี้

1. `docs/HANDOVER_IT_AND_3ROLES_GUIDE_TH.md`
2. `docs/HANDOVER_EXECUTIVE_SUMMARY_TH.md`
3. `docs/HANDOVER_EXECUTIVE_SUMMARY_TH.pdf`
4. `docs/HANDOVER_EXECUTIVE_SUMMARY_TH.html` (เก็บ source สำหรับแก้เอกสาร PDF ในอนาคต)
5. `docs/HANDOVER_RELEASE_CHECKLIST_TH.md`

---

## C) ไฟล์ที่ "ไม่ควร" push รอบนี้

1. ไฟล์ข้อมูลชั่วคราว เช่น `*.csv`, `*.xlsx`, `*.zip`
2. ไฟล์ workspace ส่วนตัว เช่น `server.code-workspace`
3. สคริปต์เฉพาะงานวิเคราะห์ที่ไม่เกี่ยวระบบ production (ถ้าไม่ใช้จริง)

---

## D) คำสั่ง Commit/Push เฉพาะไฟล์ที่ควรขึ้น (Copy/Paste)

```bash
cd /Users/mumu/Desktop/server

# 1) ตรวจสถานะก่อน
git checkout main
git pull origin main
git status --short

# 2) add เฉพาะไฟล์ handover (ห้ามใช้ git add .)
git add \
  docs/HANDOVER_IT_AND_3ROLES_GUIDE_TH.md \
  docs/HANDOVER_EXECUTIVE_SUMMARY_TH.md \
  docs/HANDOVER_EXECUTIVE_SUMMARY_TH.pdf \
  docs/HANDOVER_EXECUTIVE_SUMMARY_TH.html \
  docs/HANDOVER_RELEASE_CHECKLIST_TH.md

# 3) ตรวจอีกครั้งว่ามีเฉพาะไฟล์ที่ตั้งใจ
git status --short

# 4) commit + push
git commit -m "docs(handover): add IT handover, executive summary, and release checklist"
git push origin main

# 5) สร้าง tag จุดส่งมอบ
git tag -a v1.0-handover -m "Handover baseline for IT operations"
git push origin v1.0-handover
```

---

## E) ตรวจยืนยันหลัง push

```bash
git log --oneline --decorate -n 5
```

ตรวจบน GitHub:

1. เห็น commit ล่าสุดบน `main`
2. เห็น tag `v1.0-handover`
3. เห็นไฟล์เอกสารครบในโฟลเดอร์ `docs/`

---

## F) แนวทางเมื่อมีการแก้ PSU Passport ในอนาคต

> หลักการ: แก้โค้ดใน branch ก่อน แล้ว merge เข้าหลัก ห้ามแก้ production ตรงโดยไม่มีร่องรอย

### F.1 Dev Workflow

```bash
cd /Users/mumu/Desktop/server
git checkout main
git pull origin main
git checkout -b feature/psu-passport

# แก้โค้ด + ทดสอบ

git add <files-you-changed>
git commit -m "feat(auth): implement PSU Passport OAuth callback flow"
git push origin feature/psu-passport
```

จากนั้นเปิด PR -> review -> merge เข้า `main`

### F.2 Deploy Workflow บน Server (หลัง merge)

```bash
cd /var/www/app
source ~/.bashrc
nvm use 20

# ดึงโค้ดเวอร์ชันล่าสุด
git pull origin main

# migrate schema (ถ้ามี)
npm run prisma:migrate:prod

# build frontend ใหม่ทุกครั้งที่มีการแก้ client/VITE
cd client && npm install && npm run build && cd ..

# restart runtime
pm2 restart tracking-system-backend --update-env
pm2 status
```

### F.3 ข้อควรจำสำคัญ

1. มีการแก้ PSU Passport = ต้องอัปโค้ดลงเซิร์ฟเวอร์ก่อนเสมอ
2. มีการแก้ `VITE_*` = ต้อง build frontend ใหม่
3. ห้ามรัน `npm run seed` บน production

