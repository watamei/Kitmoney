@echo off
chcp 65001 > nul
title KidYa - สำรองข้อมูล (Backup)

cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\backup.ps1"

echo.
pause
