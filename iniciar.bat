@echo off
REM ============================================================
REM  Dromatic Inventory System (DIS) - Arranque local
REM  Doble clic para encender: MySQL de XAMPP + backend + frontend
REM  y abrir el sistema en el navegador.
REM ============================================================

setlocal
cd /d "%~dp0"
echo.
echo =========================================================
echo   Dromatic Inventory System - Iniciando el sistema
echo =========================================================
echo.

REM ─── 1. MySQL (XAMPP) ─────────────────────────────────────
echo [1/3] Verificando MySQL en el puerto 3306...
netstat -ano | findstr ":3306 " | findstr "LISTENING" > nul
if %errorlevel%==0 (
    echo       MySQL ya esta corriendo.
) else (
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo       Encendiendo MySQL de XAMPP...
        start "MySQL - Dromatic" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        echo       Esperando a que MySQL responda...
        for /L %%i in (1,1,20) do (
            timeout /t 1 /nobreak > nul
            netstat -ano | findstr ":3306 " | findstr "LISTENING" > nul
            if !errorlevel!==0 goto :mysql_ok
        )
        setlocal enabledelayedexpansion
        :mysql_ok
    ) else (
        echo       ERROR: no encontre XAMPP en C:\xampp. Enciendalo a mano desde el XAMPP Control Panel.
        pause
        exit /b 1
    )
)

REM ─── 2. Backend ────────────────────────────────────────────
echo [2/3] Arrancando el backend en una ventana nueva...
netstat -ano | findstr ":8080 " | findstr "LISTENING" > nul
if %errorlevel%==0 (
    echo       El backend ya esta corriendo en el puerto 8080.
) else (
    start "DIS Backend (Spring Boot)" cmd /k "cd /d %~dp0backend && echo Esperando a que arranque... (puede tardar 20 segundos la primera vez) && mvn spring-boot:run"
)

REM ─── 3. Frontend ──────────────────────────────────────────
echo [3/3] Arrancando el frontend en otra ventana...
netstat -ano | findstr ":5173 " | findstr "LISTENING" > nul
if %errorlevel%==0 (
    echo       El frontend ya esta corriendo en el puerto 5173.
) else (
    start "DIS Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"
)

REM ─── Esperar a que backend y frontend respondan ────────
echo.
echo Esperando a que el sistema termine de arrancar...
set /a intentos=0
:esperar_backend
timeout /t 2 /nobreak > nul
netstat -ano | findstr ":5173 " | findstr "LISTENING" > nul
if %errorlevel%==0 goto :abrir
set /a intentos+=1
if %intentos% GEQ 30 goto :abrir
goto :esperar_backend

:abrir
echo.
echo =========================================================
echo   Sistema listo. Abriendo el navegador...
echo =========================================================
echo.
echo   Usuarios:
echo     admin       (cuenta real de bodega)
echo     operador1   (prueba)
echo     consulta1   (prueba)
echo.
echo Para APAGAR todo:
echo   1) Cierra las dos ventanas negras que se abrieron.
echo   2) Detiene MySQL desde el XAMPP Control Panel
echo      (o cierra la ventana minimizada 'MySQL - Dromatic').
echo.
start http://localhost:5173/login
timeout /t 3 /nobreak > nul
exit /b 0
