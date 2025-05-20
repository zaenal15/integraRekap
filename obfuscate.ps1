$assetsSource = "assets/js"
$assetsTarget = "assets/js-obfuscated"
$viewsSource = "views"
$viewsTarget = "obfuscated_views"
$reservedVars = @{
    "config.js" = @("assetBase","assetJsPath","isDev","urlToAssets","urlToTemplate","urlToViews")
    "doJs.js" = @("autoFocusScan","zoomValue","romanNumeralMap","zoomLevelFloor","foundItem","tablesColumn","intervalJobNumber","boxFolder","zoomLevel","colorThemes")
}

function Obfuscate-Files {
    param ($srcFolder, $outputFolder)

    $files = Get-ChildItem -Path $srcFolder -Recurse -Filter *.js
    foreach ($file in $files) {
        $relative = $file.FullName.Substring((Get-Item $srcFolder).FullName.Length).TrimStart('\','/')
        $outputPath = Join-Path $outputFolder $relative
        $reserved = $reservedVars[$file.Name]

        $reservedStr = ""
        if ($reserved) {
            $escaped = ($reserved | Sort-Object -Unique) -join '","'
            $reservedStr = "--reserved-names `"[`"$escaped`"]`""
        }

        New-Item -ItemType Directory -Force -Path (Split-Path $outputPath) | Out-Null

        & javascript-obfuscator $file.FullName --output $outputPath $reservedStr

        if (Test-Path $outputPath) {
            $lines = Get-Content $outputPath
            if ($lines -isnot [System.Array]) { $lines = @($lines) }
            if ($lines.Count -gt 0) {
                $lines[0] = $lines[0] -replace '^\s*const\s+', ''
                Set-Content -Path $outputPath -Value $lines
            }
        }

        Write-Host "Processed: $relative"
    }
}

Write-Host "`n[1/2] Obfuscating assets/js -> js-obfuscated"
Obfuscate-Files -srcFolder $assetsSource -outputFolder $assetsTarget

Write-Host "`n[2/2] Obfuscating views -> obfuscated_views"
Obfuscate-Files -srcFolder $viewsSource -outputFolder $viewsTarget

Write-Host "`nObfuscation process completed successfully."
