param(
  [ValidateSet('list', 'restore', 'sync-log')]
  [string]$Action = 'list',
  [string]$Tag = ''
)

function Export-VersionsMarkdown {
  $lines = @(
    '# Cambio Surum Gecmisi (Otomatik Guncellenir)'
    ''
    'Her degisiklik tarih ve saat bazinda asagida kayit altindadir. Istemediginiz bir degisiklikte istediginiz versiyona donebilirsiniz.'
    ''
    '| Versiyon | Tarih & Saat | Aciklama |'
    '|---|---|---|'
  )

  $refs = git for-each-ref --sort=-creatordate --format="%(refname:short)|%(creatordate:format:%Y-%m-%d %H:%M:%S)|%(subject)" refs/tags
  foreach ($r in $refs) {
    $parts = $r -split '\|', 3
    if ($parts.Count -eq 3) {
      $ver = $parts[0]
      $dt = $parts[1]
      $subj = $parts[2] -replace '\|', '-'
      $lines += "| ``$ver`` | $dt | $subj |"
    }
  }

  $lines += @(
    ''
    '## Eski Bir Surume Geri Donme'
    '```powershell'
    'npm run versions'
    'powershell -ExecutionPolicy Bypass -File scripts/version.ps1 -Action restore -Tag v20'
    '```'
  )
  Set-Content -Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'VERSIONS.md') -Value ($lines -join "`n") -Encoding UTF8
}

if ($Action -eq 'sync-log') {
  Export-VersionsMarkdown
  Write-Host "VERSIONS.md guncellendi." -ForegroundColor Green
  exit 0
}

if ($Action -eq 'list') {
  Write-Host "`n=== CAMBIO SURUM GECMISI (TARIH & SAAT SIRALI) ===" -ForegroundColor Yellow
  $currentHead = git rev-parse --short HEAD
  $currentTag = git describe --tags --exact-match HEAD 2>$null
  Write-Host "Aktif Commit: $currentHead $(if ($currentTag) { "($currentTag)" })`n" -ForegroundColor Cyan

  git for-each-ref --sort=-creatordate --format="%(refname:short) | %(creatordate:format:%Y-%m-%d %H:%M:%S) | %(subject)" refs/tags | ForEach-Object {
    if ($currentTag -and $_.StartsWith("$currentTag |")) {
      Write-Host " * $_" -ForegroundColor Green
    } else {
      Write-Host "   $_"
    }
  }
  Write-Host "`nEski bir versiyona donmek icin (ornek):" -ForegroundColor Green
  Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/version.ps1 -Action restore -Tag v17`n"
  exit 0
}

if ($Action -eq 'restore') {
  if ([string]::IsNullOrWhiteSpace($Tag)) {
    Write-Error "Lutfen bir versiyon etiketi (Tag) belirtin. Orn: -Tag v17"
    exit 1
  }
  $tagExists = git tag -l $Tag
  if (-not $tagExists) {
    $matched = git tag -l "$Tag*" | Sort-Object -Descending | Select-Object -First 1
    if ($matched) {
      $Tag = $matched
    } else {
      Write-Error "Etiket bulunamadi: $Tag"
      exit 1
    }
  }

  $dirty = git status --porcelain
  if ($dirty) {
    $ts = Get-Date -Format "yyyyMMdd-HHmmss"
    Write-Host "Kaydedilmemis degisiklikler stash ile guvenli yedekleniyor ($ts)..." -ForegroundColor Yellow
    git stash push -u -m "auto-backup-before-restore-$ts" | Out-Null
  }

  $backupBranch = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  git branch $backupBranch | Out-Null
  Write-Host "Mevcut durum yedek dalina kaydedildi: $backupBranch" -ForegroundColor Cyan

  # Gecmisi kaybetmeden, master dalini secilen versiyonun dosya durumuna dondur
  git checkout $Tag -- src index.html package.json public scripts
  Write-Host "`nDosyalar '$Tag' surumune geri yuklendi! Test edip kalici yapmak icin commit + push yapabilirsiniz." -ForegroundColor Green
}
