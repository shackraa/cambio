param(
  [ValidateSet('list', 'restore')]
  [string]$Action = 'list',
  [string]$Tag = ''
)

if ($Action -eq 'list') {
  Write-Host "`n=== CAMBIO SURUM GECMISI (GIT TAGS) ===" -ForegroundColor Yellow
  $currentHead = git rev-parse --short HEAD
  Write-Host "Aktif Commit: $currentHead`n" -ForegroundColor Cyan
  git for-each-ref --sort=-creatordate --format="%(refname:short) | %(creatordate:short) | %(subject)" refs/tags | ForEach-Object {
    Write-Host "  $_"
  }
  Write-Host "`nEski bir versiyona donmek icin ornek:" -ForegroundColor Green
  Write-Host "  powershell -File scripts/version.ps1 -Action restore -Tag v17-smooth-reversible-3d-card-flip`n"
  exit 0
}

if ($Action -eq 'restore') {
  if ([string]::IsNullOrWhiteSpace($Tag)) {
    Write-Error "Lutfen bir versiyon etiketi (Tag) belirtin. Orn: -Tag v17-smooth-reversible-3d-card-flip"
    exit 1
  }
  $tagExists = git tag -l $Tag
  if (-not $tagExists) {
    $matched = git tag -l "$Tag*" | Select-Object -First 1
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
  git checkout $Tag -- src index.html package.json
  Write-Host "`nDosyalar '$Tag' surumune geri yuklendi! Test edip begenirseniz commit + push yapabilirsiniz." -ForegroundColor Green
}
