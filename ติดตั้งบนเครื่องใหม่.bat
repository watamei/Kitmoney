@echo off
chcp 65001 > nul
title KidYa - ติดตั้งระบบบนเครื่องใหม่

echo ========================================================
echo      กำลังติดตั้งระบบ KidYa POS สำหรับคอมพิวเตอร์เครื่องนี้
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. ตรวจสอบ Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [คำเตือน] เครื่องนี้ยังไม่ได้ติดตั้ง Node.js
    echo กำลังเปิดหน้าดาวน์โหลด Node.js ให้ในเบราว์เซอร์...
    start https://nodejs.org/en/download
    echo.
    echo กรุณาดาวน์โหลดและติดตั้ง Node.js (แนะนำแบบ LTS) ให้เสร็จ
    echo แล้วค่อยดับเบิ้ลคลิกไฟล์นี้ใหม่อีกครั้งครับ!
    echo.
    pause
    exit /b 1
)

echo [OK] ตรวจพบ Node.js ในเครื่องเรียบร้อยแล้ว
echo.

:: 2. ตรวจสอบและสร้าง .env อัตโนมัติ (ระบบ Offline ในเครื่อง ไม่ต้องใช้เน็ต)
if not exist ".env" (
    echo [กำลังสร้างไฟล์ .env สำหรับระบบ Offline อัตโนมัติ...]
    (
        echo DATABASE_URL="file:./dev.db"
        echo SESSION_SECRET="kitmoney_super_secure_session_secret_key_32chars_min"
    ) > .env
    echo [OK] ตั้งค่าระบบ Offline 100%% สำเร็จ
)

echo [1/3] กำลังติดตั้งไลบรารีของระบบ (npm install)...
call npm install

echo.
echo [2/3] กำลังเตรียมฐานข้อมูล SQLite ในเครื่อง (prisma generate)...
call npx prisma generate

echo.
echo [3/3] กำลังบิวด์ระบบแบบ Production เพื่อความเร็วสูงสุด (npm run build)...
call npm run build

:: 4. สร้าง Shortcut ไว้ที่หน้า Desktop อัตโนมัติ
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'KidYa POS.lnk')); $s.TargetPath = [System.IO.Path]::Combine('%~dp0', 'เปิดระบบ_KidYa.bat'); $s.WorkingDirectory = '%~dp0'; $s.Description = 'KidYa - Luxury Pharmacy POS'; $s.Save()"

echo.
echo ========================================================
echo   [สำเร็จ!] ติดตั้งระบบ KidYa บนเครื่องนี้เรียบร้อยแล้ว
echo   
echo   - ระบบได้สร้างไอคอน "KidYa POS" ไว้ที่หน้า Desktop ให้แล้ว
echo   - สามารถดับเบิ้ลคลิกไอคอนที่หน้า Desktop หรือไฟล์
echo     "เปิดระบบ_KidYa.bat" เพื่อเริ่มขายของได้ทันที!
echo ========================================================
echo.

pause
