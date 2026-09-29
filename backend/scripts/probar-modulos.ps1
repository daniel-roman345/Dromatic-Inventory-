# ─────────────────────────────────────────────────────────────────────
# DIS v2 · Prueba rápida desde la terminal (sin pantallas)
# Muestra los módulos de inventario y, si quiere, registra una entrada de
# ejemplo de bobinas (cantidad + peso) y de cajas de sachets (cajas × unidades).
#
# Uso (con el backend encendido):
#   powershell -ExecutionPolicy Bypass -File scripts\probar-modulos.ps1
# Los datos que no se pasen como parámetro se preguntan en pantalla.
# ─────────────────────────────────────────────────────────────────────
param(
    [string]$Api = "http://localhost:8080/api",
    [string]$Usuario,
    [string]$Clave,
    [string]$ClaveNueva,
    [switch]$Ejemplo
)

$ErrorActionPreference = "Stop"

function Leer-Clave([string]$texto) {
    $segura = Read-Host $texto -AsSecureString
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura))
}

function Llamar([string]$metodo, [string]$ruta, $cuerpo = $null) {
    $opciones = @{ Method = $metodo; Uri = "$Api$ruta"; Headers = $script:cabeceras; ContentType = "application/json; charset=utf-8" }
    if ($cuerpo) { $opciones.Body = [Text.Encoding]::UTF8.GetBytes(($cuerpo | ConvertTo-Json -Depth 6)) }
    try {
        return Invoke-RestMethod @opciones
    } catch {
        $detalle = $_.ErrorDetails.Message
        if ($detalle) { try { $detalle = ($detalle | ConvertFrom-Json).message } catch {} }
        throw "El sistema respondió: $detalle"
    }
}

Write-Host ""
Write-Host "=== DIS v2 · Prueba de módulos desde la terminal ===" -ForegroundColor Cyan

try {
    Invoke-WebRequest -Uri "$Api/auth/me" -UseBasicParsing -TimeoutSec 5 | Out-Null
} catch {
    if (-not $_.Exception.Response) {
        Write-Host "No hay conexión con el backend en $Api." -ForegroundColor Red
        Write-Host "Encienda MySQL en XAMPP y el backend (mvn spring-boot:run) y vuelva a intentar."
        exit 1
    }
}

$usuarioLogin = $Usuario
if (-not $usuarioLogin) { $usuarioLogin = Read-Host "Usuario (Enter = bodega)" }
if (-not $usuarioLogin) { $usuarioLogin = "bodega" }
$claveLogin = $Clave
if (-not $claveLogin) { $claveLogin = Leer-Clave "Contraseña (la temporal está en backend\.credenciales*.txt)" }

$script:cabeceras = @{}
$sesion = Llamar "POST" "/auth/login" @{ username = $usuarioLogin; password = $claveLogin }
$script:cabeceras = @{ Authorization = "Bearer $($sesion.token)" }

if ($sesion.user.mustChangePassword) {
    Write-Host "Es la primera vez: cree su contraseña (mínimo 8 caracteres, con letras y números)." -ForegroundColor Yellow
    $nueva = $ClaveNueva
    if (-not $nueva) { $nueva = Leer-Clave "Contraseña nueva" }
    Llamar "POST" "/auth/change-password" @{ currentPassword = $claveLogin; newPassword = $nueva } | Out-Null
    Write-Host "Contraseña guardada." -ForegroundColor Green
}

Write-Host ""
Write-Host "Hola, $($sesion.user.fullName) ($($sesion.user.roleName)). Estos son los módulos:" -ForegroundColor Cyan
$modulos = Llamar "GET" "/modules"
$modulos | Select-Object @{n = "Módulo"; e = { $_.name } },
                         @{n = "Unidad"; e = { $_.defaultUnit } },
                         @{n = "Peso"; e = { if ($_.tracksWeight) { "Se pide" } else { "Opcional" } } },
                         @{n = "Ubicación sugerida"; e = { if ($_.locationHint) { $_.locationHint } else { "En el mapa" } } },
                         @{n = "Usted puede"; e = { if ($_.canEdit) { "Modificar" } else { "Solo consultar" } } } |
    Format-Table -AutoSize

$bobinas = $modulos | Where-Object code -eq "BOBINAS"
$cajas = $modulos | Where-Object code -eq "CAJAS_SACHETS"
if (-not ($bobinas.canEdit -and $cajas.canEdit)) {
    Write-Host "Su usuario solo puede consultar bobinas o cajas; para registrar entradas use 'bodega' o el administrador."
    exit 0
}

$respuesta = "s"
if (-not $Ejemplo) { $respuesta = Read-Host "¿Registrar una entrada de ejemplo de bobinas y de cajas de sachets? (s/n)" }
if ($respuesta -notmatch '^[sS]') { exit 0 }
$hoy = (Get-Date).ToString("yyyy-MM-dd")

$e1 = Llamar "POST" "/movements/entry" @{
    newItem  = @{ moduleId = $bobinas.id; name = "Bobina de prueba"; presentation = "laminada" }
    label    = @{ labelDate = $hoy; materialType = "Material de empaque"; lotNumber = "PRUEBA-BOB" }
    quantity = @{ total = 5; weightKg = 250 }
    movementType = "Entrada"; reason = "Prueba desde la terminal"
}
$e2 = Llamar "POST" "/movements/entry" @{
    newItem  = @{ moduleId = $cajas.id; name = "Caja sachet de prueba" }
    label    = @{ labelDate = $hoy; materialType = "Material de empaque"; lotNumber = "PRUEBA-CAJ" }
    quantity = @{ containers = 15; containerName = "caja"; unitsPerContainer = 350 }
    movementType = "Compra"; reason = "Prueba desde la terminal"
}

Write-Host ""
Write-Host "Entradas registradas:" -ForegroundColor Green
@($e1, $e2) | Select-Object @{n = "Módulo"; e = { $_.moduleName } },
                            @{n = "Artículo"; e = { "$($_.itemName) $($_.presentation)".Trim() } },
                            @{n = "Cómo se contó"; e = { if ($_.containers) { "$([double]$_.containers) $($_.containerName) x $([double]$_.unitsPerContainer)" } else { "número total" } } },
                            @{n = "Cantidad"; e = { "$([double]$_.quantity) $($_.unitName)" } },
                            @{n = "Peso kg"; e = { if ($_.weightKg) { [double]$_.weightKg } else { "" } } },
                            @{n = "Ubicación"; e = { if ($_.toLocation) { $_.toLocation } else { "Sin ubicación" } } },
                            @{n = "Registró"; e = { $_.createdBy } } |
    Format-Table -AutoSize
Write-Host "Listo. Los artículos de prueba se pueden sacar o anular después desde el sistema."
