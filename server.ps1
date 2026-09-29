# Bobi Game HTTP Server
# Serves the game folder at http://localhost:8080

$port = 8080
$gameDir = "c:\Users\hp\Desktop\talking pet"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "=== Bobi Game Server READY at http://localhost:$port ==="
} catch {
    Write-Host "ERROR starting server: $($_.Exception.Message)"
    Write-Host "Coba jalankan sebagai Administrator jika ada error."
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response

        $urlPath = $req.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }

        # Convert URL path to file system path
        $filePath = $gameDir + $urlPath.Replace("/", "\")

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".js"   { "application/javascript" }
                ".css"  { "text/css" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".gif"  { "image/gif" }
                ".ico"  { "image/x-icon" }
                ".mp3"  { "audio/mpeg" }
                ".wav"  { "audio/wav" }
                default { "application/octet-stream" }
            }
            $res.ContentType = $mime
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "200 GET $urlPath"
        } else {
            $res.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $res.ContentLength64 = $notFound.Length
            $res.OutputStream.Write($notFound, 0, $notFound.Length)
            Write-Host "404 GET $urlPath"
        }

        $res.OutputStream.Close()
    } catch {
        # Ignore connection errors silently
    }
}
