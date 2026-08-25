# Thai IP Law Dataset Explorer

เว็บ Static สำหรับแสดง Dataset กฎหมายทรัพย์สินทางปัญญาไทย 3 ชุด:

- `Copyright.json`
- `Protect.json`
- `Trademark.json`

## วิธีใช้งานบน GitHub Pages

1. สร้าง GitHub repository ใหม่ เช่น `thai-ip-dataset`
2. Upload ไฟล์ทั้งหมดในโฟลเดอร์นี้เข้า repository โดยให้อยู่ระดับเดียวกับ `index.html`
3. ไปที่ **Settings → Pages**
4. ใน **Build and deployment** เลือก:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. กด Save
6. รอ GitHub Pages deploy แล้วเปิด URL ที่ GitHub แสดงให้

## โครงสร้างข้อมูลที่เว็บรองรับ

แต่ละ JSON เป็น array และแต่ละ record มี:

- `question`
- `issues`
- `key_facts`
- `legal_basis`
- `reasoning`
- `answer`

เว็บจะโหลด JSON ด้วย JavaScript แล้วสร้างตาราง, search, filter, pagination และหน้า detail อัตโนมัติ

## หมายเหตุ

อย่าเปิด `index.html` ด้วยการดับเบิลคลิกแล้วคาดหวังว่า JSON จะโหลดได้ทุก browser เพราะบาง browser block `fetch()` จาก `file://`.
GitHub Pages จะทำงานได้ตามปกติ
