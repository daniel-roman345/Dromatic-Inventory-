@echo off
REM ============================================================
REM  Dromatic Inventory System (DIS) - Apagado ordenado
REM  Detiene backend, frontend y MySQL sin dañar los datos.
REM ============================================================

setlocal
echo.
echo =========================================================
echo   Apagando Dromatic Inventory System
echo =========================================================
echo.

REM ─── Cerrar frontend (puerto 5173) ────────────────────────
echo [1/3] Cerrando frontend...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /T /F > nul 2>&1
    echo       Frontend (PID %%p) detenido.
)

REM ─── Cerrar backend (puerto 8080) ─────────────────────────
echo [2/3] Cerrando backend...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /T /F > nul 2>&1
    echo       Backend (PID %%p) detenido.
)

REM ─── MySQL: cierre ORDENADO con mysqladmin ────────────────
echo [3/3] Apagando MySQL de forma ordenada...
if exist "C:\xampp\mysql\bin\mysqladmin.exe" (
    "C:\xampp\mysql\bin\mysqladmin.exe" -uroot shutdown > nul 2>&1
    if %errorlevel%==0 (
        echo       MySQL apagado correctamente.
    ) else (
        echo       No se pudo apagar MySQL automaticamente.
        echo       Usa el XAMPP Control Panel: pulsa Stop en MySQL.
    )
) else (
    echo       XAMPP no esta en C:\xampp. Apaga MySQL a mano.
)

echo.
echo =========================================================
echo   Sistema apagado. Ya puedes cerrar el computador.
echo =========================================================
echo.
timeout /t 3 /nobreak > nul
exit /b 0
