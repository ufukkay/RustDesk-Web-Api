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
echo %base_ip%.%start_ip% ile %base_ip%.%end_ip% arasindaki cihazlar taraniyor...
echo.

:: Uzak bilgisayarda calistirilacak asil PowerShell komutu
set "PS_CMD=irm 'https://rmm.talay.com/api/rustdesk/builder/install?host=rmm.talay.com&port=443' | iex"

for /L %%i in (%start_ip%,1,%end_ip%) do (
    set "TARGET_IP=%base_ip%.%%i"
    
    :: Ping testi (1 paket, 500ms timeout)
    ping -n 1 -w 500 !TARGET_IP! >nul
    
    if !errorlevel! EQU 0 (
        echo [!TARGET_IP!] Cihaz acik. Kurulum komutu gonderiliyor...
        
        :: Invoke-Command ile hedef cihaza baglan ve komutu calistir
        powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Command -ComputerName !TARGET_IP! -ScriptBlock { %PS_CMD% } -ErrorAction SilentlyContinue"
        
        if !errorlevel! EQU 0 (
            echo [!TARGET_IP!] - BASARILI.
        ) else (
            echo [!TARGET_IP!] - HATA: WinRM (Powershell Remoting) izni yok veya erisim reddedildi.
        )
    ) else (
        echo [!TARGET_IP!] Kapali, atlaniyor.
    )
    echo -------------------------------------------------------
)

echo.
echo Tum islemler tamamlandi.
pause
