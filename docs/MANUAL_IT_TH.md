# คู่มือเจ้าหน้าที่ IT Support - Tracking System PSUIC

อัปเดตล่าสุด: 3 มีนาคม 2026  
ระบบ: Tracking System PSUIC  
URL ใช้งานจริง: `https://cmdt-uic.psu.ac.th/app/`

## 1) บทบาท IT Support ในระบบ

บัญชี `it_support` ใช้สำหรับ:

1. รับงานจากผู้ใช้
2. ปฏิเสธงานพร้อมเหตุผล (กรณีไม่อยู่ในขอบเขต)
3. อัปเดตความคืบหน้าและบันทึกการแก้ไข
4. ปิดงานเมื่อเสร็จ
5. ตั้งค่าอีเมลแจ้งเตือน
6. เชื่อม Google Calendar เข้าหน้า Schedule

## 2) ขั้นตอนเริ่มต้นใช้งาน

1. เข้า `https://cmdt-uic.psu.ac.th/app/login`
2. กด `Login with Email`
3. กรอกบัญชีที่มี role `it_support`
4. ระบบจะพาไปหน้า `/it`

หมายเหตุ:

1. `PSU Passport` ยังไม่เปิดใช้งานจริงใน production (ณ วันที่ 3 มีนาคม 2026)
2. ให้ใช้งานผ่าน Email/Password เท่านั้น

## 3) Workflow หลักของ IT

## 3.1 รับงาน

1. เข้าเมนู `Tickets` (`/it/tickets`)
2. เปิด Ticket ที่สถานะ `not_start`
3. กด `Accept` เพื่อรับงาน

## 3.2 ปฏิเสธงาน

1. เปิด Ticket ที่ยังไม่ควรดำเนินการ
2. กด `Reject`
3. ระบุเหตุผลให้ชัดเจน

## 3.3 อัปเดตงาน

1. เปิด `Ticket Detail` (`/it/ticket/:id`)
2. กรอก `Checklist` และ `IT Notes`
3. แนบรูปหลังแก้ไข (ถ้ามี)
4. กด `Save Draft` เพื่อบันทึกความคืบหน้า

## 3.4 ปิดงาน

1. ตรวจข้อมูลการแก้ไขให้ครบ
2. กด `Complete Job`
3. ระบบจะบันทึกเวลาเสร็จงานและคำนวณระยะเวลาปิดงาน

## 3.5 กฎสถานะที่ต้องทราบ

1. งานที่ `completed` หรือ `rejected` ถือเป็นสถานะปลายทาง
2. งานสถานะปลายทางจะไม่สามารถแก้ไขต่อได้
3. การปิดงานควรทำหลังใส่บันทึกและหลักฐานครบแล้ว

## 4) ตั้งค่าอีเมลแจ้งเตือน (หน้า Profile)

เส้นทาง: `/it/profile`

ขั้นตอน:

1. เปิดสวิตช์ `Enable Notifications`
2. กรอก `notification email`
3. กด `Save`

ข้อเท็จจริงสำคัญ:

1. ระบบสามารถบันทึกอีเมล IT ได้ แม้ฝั่งเซิร์ฟเวอร์ยังไม่ตั้ง SMTP
2. การส่งเมลจริงจะเริ่มเมื่อ Admin ตั้งค่า `MAIL_USER` และ `MAIL_PASS` บนเซิร์ฟเวอร์ครบ
3. ตอนสร้าง Ticket ใหม่ ระบบส่งเมลเฉพาะไปยัง IT ที่เปิดแจ้งเตือนและมี `notificationEmail` ถูกต้อง

## 5) ตั้งค่า Google Calendar (หน้า Schedule)

เส้นทาง: `/it/schedule`

## 5.1 เปิดหน้าตั้งค่าเชื่อมต่อ

1. กดไอคอนผู้ใช้มุมขวาบนในหน้า Schedule
2. จะขึ้นหน้าต่าง `Connection Setup`

## 5.2 Step 1: Share Calendar

1. คัดลอก `Service Email` ที่ระบบแสดง
2. ไป Google Calendar ของคุณ
3. เปิดแชร์ปฏิทินให้ Service Email

## 5.3 Step 2: กรอก Calendar ID

1. กรอก `Calendar ID`
2. กด `Save & Connect`

พฤติกรรมเมื่อ server key ยังไม่ครบ:

1. ปุ่มจะแสดง `Save Calendar ID`
2. ระบบบันทึก Calendar ID ได้
3. ระบบจะแจ้งว่า sync จะเริ่มหลัง Admin ตั้งค่า Google credentials ครบ

Google credentials ที่ server ต้องมี:

1. `GOOGLE_PROJECT_ID`
2. `GOOGLE_CLIENT_EMAIL`
3. `GOOGLE_PRIVATE_KEY`

## 6) เมนูที่ IT ใช้ประจำ

1. `Home` (`/it`) ดูภาพรวมงาน
2. `Tickets` (`/it/tickets`) รับงาน/ค้นหา/กรอง
3. `History` (`/it/history`) ดูงานที่ปิดแล้ว
4. `Schedule` (`/it/schedule`) ดูตารางงานและ Google Calendar
5. `Notifications` (`/it/notifications`) ดูการแจ้งเตือนในระบบ
6. `Profile` (`/it/profile`) ตั้งค่าข้อมูลส่วนตัว อีเมลแจ้งเตือน และเวลางาน

## 7) กรณี IT สแกน QR จากอุปกรณ์

เมื่อ role `it_support` เปิดลิงก์ `/scan/<qr-code>`:

1. ระบบจะไม่เปิดฟอร์มแจ้งซ่อมแบบ user
2. ระบบจะแจ้งเตือนว่า role IT ไม่สามารถใช้ flow นี้
3. ระบบจะแนะนำให้กลับไปหน้า IT Dashboard

## 8) Troubleshooting สำหรับ IT

1. รับงานไม่ได้  
ตรวจว่า Ticket ถูก assign ไปแล้วหรืออยู่สถานะปลายทาง

2. ปิดงานไม่ได้  
ตรวจว่ามีข้อมูลที่ต้องกรอกครบและ Ticket ไม่อยู่สถานะ `rejected/completed`

3. ไม่ได้รับอีเมลแจ้งเตือน  
ตรวจ `Enable Notifications`, ตรวจอีเมลใน Profile, และให้ Admin ตรวจ `MAIL_USER/MAIL_PASS`

4. Schedule ไม่ sync  
ตรวจการแชร์ปฏิทินให้ Service Email, ตรวจ Calendar ID, และตรวจ Google keys ฝั่งเซิร์ฟเวอร์

## 9) เช็กลิสต์ปฏิบัติงานรายวันของ IT

1. เปิด Dashboard และตรวจงานใหม่
2. รับงานที่ `High` ก่อน
3. อัปเดต note/checklist ทุกงานที่ทำ
4. ปิดงานทันทีเมื่อเสร็จ
5. ตรวจ Notifications ท้ายวัน
