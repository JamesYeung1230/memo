# ============================================================
# 监听 backend/ 文件变更，自动同步到 VM
#
# 用法：PowerShell 中运行：
#   .\backend\scripts\watch-backend.ps1
#
# 按 Ctrl+C 停止监听
# ============================================================

$LOCAL_BACKEND = Join-Path (Split-Path $PSScriptRoot -Parent) "backend"
if (-not (Test-Path $LOCAL_BACKEND)) { $LOCAL_BACKEND = "D:\workspace\memo\backend" }
$SYNC_SCRIPT = "$PSScriptRoot\sync-backend.ps1"
$DEBOUNCE_MS = 1500

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  监听 backend/ 变更 → 自动同步到 VM" -ForegroundColor Cyan
Write-Host "  按 Ctrl+C 停止" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $LOCAL_BACKEND
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor `
                        [System.IO.NotifyFilters]::FileName -bor `
                        [System.IO.NotifyFilters]::DirectoryName
$watcher.Filter = "*.*"

$ignoreDirs = @(
    "\.venv", "__pycache__", "\.git", "\.pytest_cache",
    "\.idea", "\.vscode", "dist", "build", "\.egg-info"
)

$script:syncing = $false

function Should-Ignore($fullPath) {
    foreach ($dir in $ignoreDirs) {
        if ($fullPath -match $dir) { return $true }
    }
    return $false
}

# 注册事件
$action = {
    $path = $Event.SourceEventArgs.FullPath
    if (Should-Ignore $path) { return }

    $ext = [System.IO.Path]::GetExtension($path)
    if ($ext -notmatch '^\.(py|toml|txt|yml|yaml|ini|cfg|env|json|md|sh|ps1)$') { return }

    if (-not $script:syncing) {
        $script:syncing = $true
        try {
            Start-Sleep -Milliseconds $using:DEBOUNCE_MS
            Write-Host "`n  📤 检测到变更，同步中..." -ForegroundColor Green
            & $using:SYNC_SCRIPT
        } finally {
            $script:syncing = $false
        }
    }
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null

$watcher.EnableRaisingEvents = $true

try {
    while ($true) { Start-Sleep 5 }
}
finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Get-EventSubscriber | Unregister-Event
}
