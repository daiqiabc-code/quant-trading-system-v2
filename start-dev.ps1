# start-dev.ps1 — 一键启动 Vite 开发服务器（非阻塞版）
# 用法：在 execute_command 中直接运行，不会卡住

param(
    [int]$Port = 5173
)

$ProjectRoot = "C:\Users\Administrator\WorkBuddy\20260714095058\quant-trading-system"
$NodeExe     = "C:\Users\Administrator\.workbuddy\binaries\node\versions\22.12.0\node.exe"
$ViteCli     = "$ProjectRoot\node_modules\vite\bin\vite.js"

# 杀旧进程
$conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($conn) {
    $conn | Where-Object { $_.State -ne "TimeWait" } | ForEach-Object {
        try { Stop-Process -Id $_.OwningProcess -Force } catch {}
    }
}

# 后台启动（Start-Process 非阻塞，execute_command 立即返回）
Start-Process -NoNewWindow `
    -WorkingDirectory $ProjectRoot `
    -FilePath $NodeExe `
    -ArgumentList "`"$ViteCli`" --host --port $Port"
