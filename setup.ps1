param(
    [string]$ProjectName
)

$ErrorActionPreference = "Stop"

$RepoOwner = "HassanZohaib121"
$RepoName = "tauri-auth-starter"
$Branch = "main"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       Tauri Authentication Starter" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $ProjectName) {
    $ProjectName = Read-Host "Enter project name"
}

if ([string]::IsNullOrWhiteSpace($ProjectName)) {
    Write-Host "Project name is required." -ForegroundColor Red
    exit 1
}

if (Test-Path $ProjectName) {
    Write-Host ""
    Write-Host "Directory '$ProjectName' already exists." -ForegroundColor Red
    exit 1
}

$TempDir = Join-Path $env:TEMP "tauri-auth-starter-$([guid]::NewGuid())"
$ZipFile = Join-Path $env:TEMP "tauri-auth-starter.zip"

try {

    Write-Host "[1/5] Downloading starter..." -ForegroundColor Yellow

    $DownloadUrl = "https://github.com/$RepoOwner/$RepoName/archive/refs/heads/$Branch.zip"

    Invoke-WebRequest `
        -Uri $DownloadUrl `
        -OutFile $ZipFile

    Write-Host "[2/5] Extracting starter..." -ForegroundColor Yellow

    New-Item -ItemType Directory -Path $TempDir | Out-Null

    Expand-Archive `
        -Path $ZipFile `
        -DestinationPath $TempDir

    $ExtractedFolder = Get-ChildItem `
        -Path $TempDir `
        -Directory |
    Select-Object -First 1

    Write-Host "[3/5] Creating project..." -ForegroundColor Yellow

    New-Item `
        -ItemType Directory `
        -Path $ProjectName | Out-Null

    Copy-Item `
        -Path "$($ExtractedFolder.FullName)\*" `
        -Destination $ProjectName `
        -Recurse `
        -Force

    Set-Location $ProjectName

    Write-Host "[4/5] Installing dependencies..." -ForegroundColor Yellow

    npm install

    Write-Host "[5/5] Initializing Git..." -ForegroundColor Yellow

    git init

    git add .

    git commit `
        -m "Initial project from Tauri Authentication Starter"

    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "       Project created successfully!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "Project: $ProjectName"
    Write-Host ""

    Write-Host "Run:"
    Write-Host ""
    Write-Host "  cd $ProjectName" -ForegroundColor Cyan
    Write-Host "  npm run tauri dev" -ForegroundColor Cyan
    Write-Host ""

}
finally {

    if (Test-Path $ZipFile) {
        Remove-Item $ZipFile -Force
    }

    if (Test-Path $TempDir) {
        Remove-Item $TempDir -Recurse -Force
    }
}