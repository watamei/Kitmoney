@echo off
chcp 65001 > nul
title KidYa - Pharmacy POS System

echo ========================================================
echo        กำลังเริ่มระบบ KidYa - Luxury Pharmacy POS
echo        เชื่อมต่อ Cloud Database: Neon PostgreSQL
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] กำลังเปิดเซิร์ฟเวอร์ POS...
start /b cmd /c "npm run start"

echo [2/2] รอระบบพร้อมทำงาน...
timeout /t 3 /nobreak > nul

echo.
echo เปิดหน้าต่างระบบขายหน้าร้าน...
start http://localhost:3000

echo.
echo ========================================================
echo   ระบบพร้อมใช้งานแล้ว!
echo   - ใช้งานที่เครื่องนี้: http://localhost:3000
echo   - เครื่องอื่นในวง Wi-Fi: http://172.20.10.2:3000
echo   - บัญชีเข้าใช้งาน: meaw (รหัส: 041410) หรือ admin (รหัส: admin1234)
echo.
echo   (อย่าเพิ่งปิดหน้าต่างดำนี้ขณะกำลังเปิดใช้งาน POS)
echo ========================================================
echo.

pause
