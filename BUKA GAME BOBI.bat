@echo off
title Bobi Virtual Pet Launcher
color 0A

echo ============================================
echo    BOBI VIRTUAL PET - Game Launcher
echo ============================================
echo.
echo [*] Mencari browser...

SET GAME_PATH=c:\Users\hp\Desktop\talking pet\index.html
SET EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
SET CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
SET CHROME_PATH2=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
SET USER_CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe
SET PROFILE_DIR=%TEMP%\bobi-browser-profile

REM Create temp profile dir if not exists
if not exist "%PROFILE_DIR%" mkdir "%PROFILE_DIR%"

echo [*] Membuka game...

REM Try Microsoft Edge first (built-in on Windows 10/11)
if exist "%EDGE_PATH%" (
    echo [*] Membuka dengan Microsoft Edge...
    start "" "%EDGE_PATH%" --user-data-dir="%PROFILE_DIR%" --allow-file-access-from-files --disable-web-security --disable-site-isolation-trials "%GAME_PATH%"
    goto :DONE
)

REM Try Chrome (Program Files)
if exist "%CHROME_PATH%" (
    echo [*] Membuka dengan Google Chrome...
    start "" "%CHROME_PATH%" --user-data-dir="%PROFILE_DIR%" --allow-file-access-from-files --disable-web-security --disable-site-isolation-trials "%GAME_PATH%"
    goto :DONE
)

REM Try Chrome (Program Files x86)
if exist "%CHROME_PATH2%" (
    echo [*] Membuka dengan Google Chrome (x86)...
    start "" "%CHROME_PATH2%" --user-data-dir="%PROFILE_DIR%" --allow-file-access-from-files --disable-web-security --disable-site-isolation-trials "%GAME_PATH%"
    goto :DONE
)

REM Try Chrome (user local)
if exist "%USER_CHROME%" (
    echo [*] Membuka dengan Google Chrome (user)...
    start "" "%USER_CHROME%" --user-data-dir="%PROFILE_DIR%" --allow-file-access-from-files --disable-web-security --disable-site-isolation-trials "%GAME_PATH%"
    goto :DONE
)

REM Fallback: try PowerShell HTTP server + default browser
echo [!] Edge/Chrome tidak ditemukan, mencoba server lokal...
start "" /min powershell.exe -ExecutionPolicy Bypass -WindowStyle Minimized -File "c:\Users\hp\Desktop\talking pet\server.ps1"
timeout /t 3 /nobreak >nul
start "" "http://localhost:8080"
goto :DONE

:DONE
echo.
echo ============================================
echo  Game Bobi Virtual Pet sudah dibuka!
echo ============================================
echo.
echo  Jendela ini bisa ditutup setelah game terbuka.
echo.
pause
