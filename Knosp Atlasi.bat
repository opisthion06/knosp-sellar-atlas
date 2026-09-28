@echo off
title Knosp Sellar Atlasi
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Sayfa dogrudan dosya olarak aciliyor.
  start "" "%~dp0index.html"
  timeout /t 5 >nul
  exit /b
)
node "%~dp0sunucu.js"
