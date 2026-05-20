@echo off
setlocal enabledelayedexpansion
title RustDesk Toplu Kurulum Araci

echo =======================================================
echo     RustDesk Uzaktan Kurulum Araci (Domain Admin)
echo =======================================================
echo.
echo Bu arac belirttiginiz IP araligindaki acik bilgisayarlara
echo WinRM uzerinden baglanip RustDesk ajanini kurar.
echo.

set /p base_ip="IP blogunun ilk 3 kismini girin (Orn: 172.16.1): "
if "%base_ip%"=="" set base_ip=172.16.1

set /p start_ip="Baslangic IP (Orn: 1): "
if "%start_ip%"=="" set start_ip=1

set /p end_ip="Bitis IP (Orn: 254): "
if "%end_ip%"=="" set end_ip=254

echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0mass_deploy.ps1" -BaseIP "%base_ip%." -StartRange %start_ip% -EndRange %end_ip% -SetupUrl "https://rmm.talay.com/api/rustdesk/builder/install?host=rmm.talay.com&port=443"

echo.
echo Islemler tamamlandi.
pause
