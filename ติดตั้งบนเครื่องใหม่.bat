@echo off
chcp 65001 > nul
title KidYa - Setup for New Computer

echo ========================================================
echo       ติดตั้งระบบ KidYa สำหรับคอมพิวเตอร์เครื่องใหม่
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] กำลังติดตั้งไลบรารีระบบ (npm install)...
call npm install

echo.
echo [2/3] กำลังเตรียมเชื่อมต่อฐานข้อมูล Neon Cloud (prisma generate)...
call npx prisma generate

echo.
echo [3/3] กำลังบิวด์ระบบความเร็วสูง (npm run build)...
call npm run build

echo.
echo ========================================================
echo   ติดตั้งเรียบร้อยแล้ว!
echo   สามารถดับเบิ้ลคลิกไฟล์ "เปิดระบบ_KidYa.bat" เพื่อเริ่มใช้งานได้เลย
echo ========================================================
echo.

pause
