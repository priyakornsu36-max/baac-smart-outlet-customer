# BAAC SMART OUTLET CUSTOMER PWA

PWA สำหรับลูกค้าและผู้ฝากขายของ BAAC SMART OUTLET

Backend (Google Apps Script Web App):
`https://script.google.com/macros/s/AKfycbzha4xvn3ha9ek0VweZYFubQrJ6-_Qeb3G2PHMWGHv5Tej6YCMjUzQMEmq6FWdeTQfo/exec`

ไฟล์หลัก:
- `index.html` หน้าเข้าสู่ระบบ/สมัครสมาชิก
- `member.html` หน้าสมาชิก
- `products.html` หน้าสินค้า
- `consignor.html` หน้าผู้ฝากขาย
- `app.js` ตัวเชื่อม CUSTOMER PWA กับ Apps Script API
- `manifest.webmanifest` ข้อมูลติดตั้ง PWA
- `sw.js` App Shell cache

> Repository นี้เป็น CUSTOMER PWA เท่านั้น ไม่รวม STAFF/POS
## ติดตั้งแอปฟรีด้วย QR

สแกน QR ที่ชี้ไปยัง `https://priyakornsu36-max.github.io/baac-smart-outlet-customer/install.html` เพื่อเข้าสู่หน้าติดตั้ง
- Android: เปิดด้วย Chrome แล้วกดติดตั้งแอป (หรือเมนู Chrome > ติดตั้งแอป)
- iPhone: เปิดด้วย Safari แล้วกดแชร์ > เพิ่มไปยังหน้าจอโฮม > เพิ่ม
- หลังติดตั้ง เปิดจากไอคอน BAAC OUTLET ได้ ไม่ต้องสแกน QR ซ้ำ

PWA ติดตั้งฟรีผ่าน GitHub Pages โดยไม่ใช้ App Store; การเข้าถึงข้อมูลยังขึ้นอยู่กับระบบยืนยันตัวตนของ Apps Script
