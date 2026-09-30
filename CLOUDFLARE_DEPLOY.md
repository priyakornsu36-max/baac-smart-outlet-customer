# ย้าย CUSTOMER PWA ไป Cloudflare Pages โดยไม่แสดงชื่อบัญชี GitHub

ระบบนี้เป็นเว็บแอป PWA แบบ static; GitHub ใช้เก็บโค้ด แต่ลูกค้าเปิดโดเมนของ Cloudflare Pages

## สิ่งที่เตรียมให้แล้ว
- ไฟล์ `build-cloudflare.sh` คัดลอกเฉพาะไฟล์แอปไปที่ `dist/`
- ไฟล์ `_headers` ช่วยให้ iPhone/Android ตรวจสอบไฟล์ติดตั้งและ service worker เวอร์ชันใหม่
- ชื่อบนหน้าจอหลักทั้ง iPhone และ Android: BAAC SMART OUTLET
- หน้า QR สำหรับติดตั้ง: `/install.html` (เปลี่ยนเฉพาะโดเมนหลัง Deploy)

## ขั้นตอนเชื่อมบัญชีครั้งแรก (เจ้าของบัญชีต้องกดอนุญาตเอง)
1. เปิด https://dash.cloudflare.com/ แล้วสมัครหรือเข้าสู่ระบบ Cloudflare
2. ไปที่ Workers & Pages > Create > Pages > Connect to Git และอนุญาต Cloudflare เข้าถึง GitHub repository `priyakornsu36-max/baac-smart-outlet-customer`
3. ตั้งชื่อโปรเจกต์ที่ไม่ระบุชื่อบุคคล เช่น `baac-smart-outlet` (ขึ้นอยู่กับชื่อว่าง)
4. Production branch: `main`; Framework preset: `None`; Build command: `sh build-cloudflare.sh`; Build output directory: `dist`; Root directory: `/`
5. กด Save and Deploy แล้วรอ Cloudflare แสดง URL จริง `https://<project-name>.pages.dev`
6. ทดสอบ `https://<project-name>.pages.dev/install.html` ด้วย iPhone Safari และ Android Chrome ก่อนทำ QR ใหม่

**ห้ามนำ QR เดิมที่เป็นโดเมน GitHub ไปแจก** หลังย้ายแล้วต้องสร้าง QR ใหม่จาก URL ที่ Cloudflare ออกให้จริง

## ก่อนเปิดให้ลูกค้าจริง
การเปลี่ยนโดเมนไม่ใช่การยืนยันว่าเป็นเว็บไซต์ทางการของธนาคาร ต้องได้รับอนุมัติให้ใช้ชื่อและเครื่องหมายองค์กรตามขั้นตอนที่เกี่ยวข้อง และต้องตรวจการยืนยันตัวตน/สิทธิ์การเข้าถึงข้อมูลใน Apps Script ให้เรียบร้อย
