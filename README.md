# Kitmoney - Luxury Pharmacy POS

Modern & Minimalist POS System for Pharmacy built with Next.js (App Router), Prisma ORM, and PostgreSQL.

---

## 🚀 Deployment Guide (Vercel + Neon / Supabase)

### 1. เตรียมฐานข้อมูล PostgreSQL (Neon หรือ Supabase)
1. สร้างโปรเจกต์ใหม่บน [Neon](https://neon.tech) หรือ [Supabase](https://supabase.com)
2. คัดลอก Connection String มา 2 รูปแบบ:
   - **`DATABASE_URL`**: Pooled connection string (สำหรับรันแอปบน Serverless)
   - **`DIRECT_URL`**: Direct connection string (สำหรับรัน Prisma Migrate)

### 2. ตั้งค่า Environment Variables บน Vercel
กำหนดค่าตัวแปรใน Vercel Project Settings > Environment Variables:
- `DATABASE_URL`: `postgresql://...` (Pooled connection)
- `DIRECT_URL`: `postgresql://...` (Direct connection)
- `SESSION_SECRET`: สตริงสุ่มความยาวไม่ต่ำกว่า 32 ตัวอักษร สำหรับเข้ารหัส cookie session

### 3. รัน Migration เพื่อสร้างโครงสร้างฐานข้อมูลบน PostgreSQL
ก่อน deploy หรือผ่านเครื่อง Local ที่ชี้ `DATABASE_URL` ไปยัง Postgres:
```bash
npx prisma migrate deploy
```

### 4. ย้ายข้อมูลจาก SQLite เดิม (dev.db) ไป PostgreSQL (ถ้ามี)
รันสคริปต์ย้ายข้อมูล:
```bash
npx tsx scripts/migrate-sqlite-to-pg.ts
```
> **หมายเหตุ:** สคริปต์จะอ่านข้อมูลจาก `prisma/dev.db` และนำเข้า PostgreSQL โดยคงความสัมพันธ์ `Category -> Product -> Sale -> SaleItem -> Restock ฯลฯ` พร้อมรีเซ็ต Serial Sequences ให้อัตโนมัติ

### 5. สร้างบัญชีผู้ใช้แรกสำหรับเข้าสู่ระบบ
```bash
npx tsx prisma/create-user.ts <username> <password>
```
*ตัวอย่าง:*
```bash
npx tsx prisma/create-user.ts admin MyStrongPassword123
```

---

## 💻 Local Development

1. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```

2. สร้างไฟล์ `.env` ตาม `.env.example`

3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

4. รัน Development Server:
   ```bash
   npm run dev
   ```
   เข้าใช้งานผ่าน [http://localhost:3000](http://localhost:3000)
