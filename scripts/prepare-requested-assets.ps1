param([switch]$InspectOnly)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$manifestPath = Join-Path $projectRoot 'assets/asset-requests-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$report = @()
foreach ($asset in $manifest.assets) {
    $target = [IO.Path]::GetFullPath((Join-Path $projectRoot $asset.path))
    if (-not $target.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'Asset path outside project' }
    $source = [Drawing.Image]::FromFile($target)
    $originalWidth = $source.Width
    $originalHeight = $source.Height
    if (-not $InspectOnly -and ($source.Width -ne $asset.width -or $source.Height -ne $asset.height)) {
        $output = New-Object Drawing.Bitmap($asset.width, $asset.height, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [Drawing.Graphics]::FromImage($output)
        $graphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::Half
        # 투명 전경은 비율을 유지해 안에 넣고, 불투명 장면은 여백 없이 채운다.
        $scaleX = $asset.width / $source.Width
        $scaleY = $asset.height / $source.Height
        if ($asset.transparent) { $scale = [Math]::Min($scaleX, $scaleY) }
        else { $scale = [Math]::Max($scaleX, $scaleY) }
        $drawWidth = [int][Math]::Round($source.Width * $scale)
        $drawHeight = [int][Math]::Round($source.Height * $scale)
        $x = [int][Math]::Floor(($asset.width - $drawWidth) / 2)
        $y = [int][Math]::Floor(($asset.height - $drawHeight) / 2)
        $graphics.DrawImage($source, (New-Object Drawing.Rectangle($x, $y, $drawWidth, $drawHeight)), 0, 0, $source.Width, $source.Height, [Drawing.GraphicsUnit]::Pixel)
        $graphics.Dispose()
        $source.Dispose()
        $temporary = $target + '.sized.png'
        $output.Save($temporary, [Drawing.Imaging.ImageFormat]::Png)
        $output.Dispose()
        Move-Item -LiteralPath $temporary -Destination $target -Force
    } else { $source.Dispose() }
    $image = [Drawing.Bitmap]::FromFile($target)
    $transparentPixels = 0
    $visiblePixels = 0
    $minX = $image.Width; $minY = $image.Height; $maxX = -1; $maxY = -1
    for ($y = 0; $y -lt $image.Height; $y++) {
        for ($x = 0; $x -lt $image.Width; $x++) {
            $alpha = $image.GetPixel($x, $y).A
            if ($alpha -eq 0) { $transparentPixels++ }
            if ($alpha -gt 0) {
                $visiblePixels++
                $minX = [Math]::Min($minX, $x); $minY = [Math]::Min($minY, $y)
                $maxX = [Math]::Max($maxX, $x); $maxY = [Math]::Max($maxY, $y)
            }
        }
    }
    if ($image.Width -ne $asset.width -or $image.Height -ne $asset.height) { throw "Wrong dimensions: $($asset.path)" }
    if ($visiblePixels -eq 0) { throw "Empty image: $($asset.path)" }
    if ($asset.transparent -and $transparentPixels -eq 0) { throw "Missing transparency: $($asset.path)" }
    if (-not $asset.transparent -and $transparentPixels -gt 0) { throw "Unexpected transparency: $($asset.path)" }
    $report += [ordered]@{
        path = $asset.path; width = $image.Width; height = $image.Height
        transparentPixels = $transparentPixels; visiblePixels = $visiblePixels
        visibleBounds = @($minX, $minY, $maxX, $maxY)
        sha256 = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLower()
        bytes = (Get-Item -LiteralPath $target).Length
    }
    $image.Dispose()
    Write-Output "OK $($asset.path)"
}
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $projectRoot 'docs/asset-validation.json') -Encoding UTF8
Write-Output "Validated $($report.Count) requested assets."

# 모든 최종 파일을 한 장에서 검토할 수 있는 제작용 미리보기. 런타임 에셋이 아니다.
$columns = 4; $cellWidth = 260; $cellHeight = 200
$sheet = New-Object Drawing.Bitmap(($columns * $cellWidth), ([int][Math]::Ceiling($manifest.assets.Count / $columns) * $cellHeight))
$canvas = [Drawing.Graphics]::FromImage($sheet)
$canvas.Clear([Drawing.Color]::FromArgb(244, 238, 226))
$canvas.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$canvas.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::Half
$font = New-Object Drawing.Font('Arial', 9)
$brush = New-Object Drawing.SolidBrush([Drawing.Color]::FromArgb(45, 34, 54))
for ($i = 0; $i -lt $manifest.assets.Count; $i++) {
    $asset = $manifest.assets[$i]
    $x = ($i % $columns) * $cellWidth; $y = [int][Math]::Floor($i / $columns) * $cellHeight
    $canvas.FillRectangle([Drawing.Brushes]::LightGray, $x + 4, $y + 4, 252, 166)
    $image = [Drawing.Image]::FromFile((Join-Path $projectRoot $asset.path))
    $scale = [Math]::Min(244 / $image.Width, 158 / $image.Height)
    $width = [int][Math]::Round($image.Width * $scale); $height = [int][Math]::Round($image.Height * $scale)
    $canvas.DrawImage($image, (New-Object Drawing.Rectangle(($x + [int](($cellWidth - $width) / 2)), ($y + 8 + [int]((158 - $height) / 2)), $width, $height)), 0, 0, $image.Width, $image.Height, [Drawing.GraphicsUnit]::Pixel)
    $image.Dispose()
    $canvas.DrawString([IO.Path]::GetFileName($asset.path), $font, $brush, ($x + 8), ($y + 174))
}
$canvas.Dispose(); $font.Dispose(); $brush.Dispose()
$sheet.Save((Join-Path $projectRoot 'docs/asset-contact-sheet.png'), [Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
