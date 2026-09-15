@echo off
setlocal enabledelayedexpansion
title Dromatic Inventory System - Iniciando

echo.
echo =========================================================
echo   Dromatic Inventory System - Iniciando el sistema
echo =========================================================
echo.

cd /d "%~dp0"

REM --- 1) MySQL de XAMPP ------------------------------------
echo [1/3] MySQL...
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo       Ya esta encendido.
) else (
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo       Encendiendo desde XAMPP...
        start "MySQL DIS" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        set /a espera=0
        :esperar_mysql
        timeout /t 1 /nobreak >nul
        netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul
        if !errorlevel!==0 goto :mysql_listo
        set /a espera+=1
        if !espera! GEQ 20 goto :mysql_listo
        goto :esperar_mysql
        :mysql_listo
        echo       MySQL listo.
    ) else (
        echo       ERROR: no encuentro XAMPP en C:\xampp
        echo       Enciende MySQL a mano desde el XAMPP Control Panel.
        pause
        exit /b 1
    )
)

REM --- 2) Backend Spring Boot -------------------------------
echo [2/3] Backend...
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo       Ya esta corriendo.
) else (
    echo       Abriendo ventana del backend...
    start "DIS Backend" cmd /k "cd /d %~dp0backend && echo Arrancando backend (puede tardar 20 segundos)... && mvn spring-boot:run"
)

REM --- 3) Frontend Vite -------------------------------------
echo [3/3] Frontend...
netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo       Ya esta corriendo.
) else (
    echo       Abriendo ventana del frontend...
    start "DIS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
)

REM --- Esperar a que el frontend responda -------------------
echo.
echo Esperando a que el sistema termine de arrancar...
set /a espera=0
:esperar_frontend
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul
if %errorlevel%==0 goto :abrir_navegador
set /a espera+=1
if %espera% GEQ 30 goto :abrir_navegador
goto :esperar_frontend

:abrir_navegador
echo.
echo =========================================================
echo   Listo. Abriendo el navegador...
echo =========================================================
echo.
echo   Usuarios:
echo     admin       (cuenta real de bodega)
echo     operador1   (prueba)
echo     consulta1   (prueba)
echo.
echo   Cuando termines, ejecuta apagar.bat antes de apagar
echo   el computador para no danar la base de datos.
echo.
start http://localhost:5173/login
timeout /t 4 /nobreak >nul
exit /b 0
