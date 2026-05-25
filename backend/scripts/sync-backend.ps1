# ============================================================
# 同步 backend/ 代码到 VM
#
# 模式 A（默认）：tar+ssh 管道，无需安装 rsync
# 模式 B：rsync（需安装，性能更好，支持删除同步）
#
# 用法：
#   .\backend\scripts\sync-backend.ps1     # 手动同步
#   .\backend\scripts\watch-backend.ps1    # 自动监听同步
# ============================================================

$VM_USER = "peng"
$VM_HOST = "192.168.234.128"
$VM_BASE = "/home/peng/memo"
$LOCAL_BACKEND = Join-Path (Split-Path $PSScriptRoot -Parent) "backend"
if (-not (Test-Path $LOCAL_BACKEND)) { $LOCAL_BACKEND = "D:\workspace\memo\backend" }
$SYNCIGNORE = "$LOCAL_BACKEND\.syncignore"

$USE_RSYNC = $false  # 设为 $true 启用 rsync 模式（需安装 rsync）

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  同步 backend/ → ${VM_USER}@${VM_HOST}:${VM_BASE}/backend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 读取排除规则
$excludeArgs = @()
if (Test-Path $SYNCIGNORE) {
    Get-Content $SYNCIGNORE | ForEach-Object {
        $line = $_.Trim()
        if ($line -and $line -notmatch '^\s*#') { $excludeArgs += "--exclude=$line" }
    }
}

if ($USE_RSYNC -and (Get-Command rsync -ErrorAction SilentlyContinue)) {
    # ===== 模式 B：rsync 模式 =====
    & "C:\Program Files\Git\usr\bin\ssh.exe" "${VM_USER}@${VM_HOST}" "mkdir -p ${VM_BASE}/backend"
    rsync -avz --delete $excludeArgs "${LOCAL_BACKEND}/" "${VM_USER}@${VM_HOST}:${VM_BASE}/backend/"
}
else {
    # ===== 模式 A：tar+ssh 管道 =====
    & "C:\Program Files\Git\usr\bin\ssh.exe" "${VM_USER}@${VM_HOST}" "mkdir -p ${VM_BASE}/backend"

    $excludeStr = ($excludeArgs | ForEach-Object { "--exclude='$($_ -replace "^--exclude=","")'" }) -join ' '

    & "C:\Program Files\Git\usr\bin\bash.exe" -c @"
        cd '$LOCAL_BACKEND'
        tar czf - --exclude-from='$SYNCIGNORE' -C '$LOCAL_BACKEND' . | ssh ${VM_USER}@${VM_HOST} "tar xzf - -C ${VM_BASE}/backend"
"@
}

Write-Host "`n  ✅ 同步完成" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
