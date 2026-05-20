@echo off
setlocal enabledelayedexpansion
title RustDesk Kurulum Araci

echo =======================================================
echo     RustDesk Uzaktan Kurulum Araci (Domain Admin)
echo =======================================================
echo.
echo [1] Tek bir bilgisayara kur (IP veya Bilgisayar Adi ile)
echo [2] Belirli bir IP araligina kur (Toplu Dagitim)
echo.
set /p secim="Seciminiz (1 veya 2): "

if "%secim%"=="1" (
    echo.
    set /p target_pc="Hedef bilgisayarin IP veya ismini girin: "
    if "!target_pc!"=="" (
        echo Hata: Hedef bos olamaz.
        pause
        exit /b
    )
    echo.
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0single_deploy.ps1" -Target "!target_pc!"
) else (
    echo.
    set /p base_ip="IP blogunun ilk 3 kismini girin (Orn: 172.16.1): "
    if "!base_ip!"=="" set base_ip=172.16.1

    set /p start_ip="Baslangic IP (Orn: 1): "
    if "!start_ip!"=="" set start_ip=1

    set /p end_ip="Bitis IP (Orn: 254): "
    if "!end_ip!"=="" set end_ip=254

    echo.
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0mass_deploy_wmi.ps1" -BaseIP "!base_ip!." -StartRange !start_ip! -EndRange !end_ip! -SetupUrl "https://rmm.talay.com/api/rustdesk/builder/install?host=rmm.talay.com&port=443"
)

echo.
echo Islemler tamamlandi.
pause
