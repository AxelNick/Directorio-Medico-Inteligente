param([switch] $Verificar)

$ErrorActionPreference = 'Stop'
$referencia = $env:DMI_VPS_REFERENCIA
if (-not $referencia) {
    $referencia = Join-Path $PSScriptRoot '..\..\..\VPS\VPS.md'
}

$datos = @{}
$plink = $null
$canal = $null
$errores = $null
$codigo = 0
$spa = 'http://127.0.0.1:25174'
$api = 'http://127.0.0.1:28082'

try {
    if (-not (Test-Path -LiteralPath $referencia -PathType Leaf)) {
        throw 'No se encontró VPS.md. Puedes indicar su ruta con DMI_VPS_REFERENCIA.'
    }

    foreach ($linea in Get-Content -LiteralPath $referencia) {
        if ($linea -match '^\s*(IP|PORT|login|password)\s*[:=]\s*(.+?)\s*$') {
            $datos[$Matches[1].ToLowerInvariant()] = $Matches[2].Trim().Trim([char]0x60, [char]0x22, [char]0x27)
        }
    }
    $puerto = 0
    if (-not $datos.ip -or -not $datos.login -or -not $datos.password -or
        -not [int]::TryParse($datos.port, [ref]$puerto) -or $puerto -lt 1 -or $puerto -gt 65535) {
        throw 'VPS.md debe contener IP, PORT, login y password.'
    }
    if ([Uri]::CheckHostName($datos.ip) -eq [UriHostNameType]::Unknown) {
        throw 'La dirección en VPS.md no es válida.'
    }

    $binario = (Get-Command plink.exe -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1).Source
    if (-not $binario) {
        $binario = Join-Path $env:ProgramFiles 'PuTTY\plink.exe'
    }
    if (-not (Test-Path -LiteralPath $binario -PathType Leaf)) {
        throw 'No se encontró plink.exe. Instala PuTTY o añade Plink al PATH.'
    }

    foreach ($local in 25174, 28082) {
        $prueba = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $local)
        try {
            $prueba.ExclusiveAddressUse = $true
            $prueba.Start()
        } catch {
            throw "El puerto local $local está ocupado. Cierra el túnel anterior si lo dejaste abierto."
        } finally {
            $prueba.Stop()
        }
    }

    $nombreCanal = 'DmiTunel-' + [guid]::NewGuid().ToString('N')
    $opciones = [IO.Pipes.PipeOptions]::CurrentUserOnly -bor [IO.Pipes.PipeOptions]::Asynchronous
    $canal = [IO.Pipes.NamedPipeServerStream]::new($nombreCanal, [IO.Pipes.PipeDirection]::Out, 1,
        [IO.Pipes.PipeTransmissionMode]::Byte, $opciones)

    $inicio = [Diagnostics.ProcessStartInfo]::new($binario)
    $inicio.UseShellExecute = $false
    $inicio.CreateNoWindow = $true
    $inicio.RedirectStandardError = $true
    $opcionesSsh = @(
        '-ssh', '-batch', '-noagent', '-noshare', '-N', '-T',
        '-P', $puerto.ToString(), '-l', $datos.login,
        '-pwfile', ('\\.\pipe\' + $nombreCanal),
        '-L', '127.0.0.1:25174:127.0.0.1:15173',
        '-L', '127.0.0.1:28082:127.0.0.1:38080',
        $datos.ip
    )
    foreach ($opcion in $opcionesSsh) {
        $inicio.ArgumentList.Add($opcion)
    }

    Write-Host 'Abriendo el túnel SSH de la UNI…'
    $conexion = $canal.WaitForConnectionAsync()
    $plink = [Diagnostics.Process]::Start($inicio)
    $errores = $plink.StandardError.ReadToEndAsync()
    $cronometro = [Diagnostics.Stopwatch]::StartNew()
    while (-not $conexion.Wait(200)) {
        if ($plink.HasExited -or $cronometro.Elapsed.TotalSeconds -ge 15) {
            throw 'Plink no abrió el canal privado de autenticación.'
        }
    }
    $clave = [Text.Encoding]::UTF8.GetBytes($datos.password + "`n")
    try {
        $canal.Write($clave, 0, $clave.Length)
        $canal.Flush()
    } finally {
        [Array]::Clear($clave)
        $canal.Dispose()
        $canal = $null
    }

    $disponible = $false
    $cronometro.Restart()
    while (-not $plink.HasExited -and $cronometro.Elapsed.TotalSeconds -lt 30) {
        try {
            $estado = Invoke-RestMethod "$spa/api/salud" -NoProxy -TimeoutSec 2
            $estadoApi = Invoke-RestMethod "$api/salud" -NoProxy -TimeoutSec 2
            $disponible = $estado.estado -eq 'disponible' -and $estadoApi.estado -eq 'disponible'
            if ($disponible) { break }
        } catch {
            # El reenvío puede tardar mientras se autentica la sesión.
        }
        Start-Sleep -Milliseconds 400
    }
    if (-not $disponible -or $plink.HasExited) {
        throw 'El VPS no respondió por el túnel. Revisa la conexión, la huella validada en PuTTY y las credenciales SSH.'
    }

    $pagina = Invoke-WebRequest "$spa/directorio" -NoProxy -TimeoutSec 5
    Write-Host "Túnel verificado. Directorio HTTP $($pagina.StatusCode) en $spa/directorio"
    if (-not $Verificar) {
        Start-Process "$spa/directorio"
        Write-Host "Swagger: $api/swagger-ui/index.html"
        Read-Host 'Pulsa Enter cuando quieras cerrar el túnel' | Out-Null
    }
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    if ($plink -and $plink.HasExited -and $errores.IsCompletedSuccessfully) {
        $detalle = $errores.Result.Trim()
        foreach ($dato in @($datos.ip, $datos.login, $datos.password)) {
            if ($dato) { $detalle = $detalle.Replace($dato, '[reservado]') }
        }
        if ($detalle) { [Console]::Error.WriteLine($detalle) }
    }
    $codigo = 1
} finally {
    if ($canal) { $canal.Dispose() }
    if ($plink) {
        if (-not $plink.HasExited) { $plink.Kill() }
        $plink.Dispose()
    }
}
exit $codigo
