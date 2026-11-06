param([switch]$InspectOnly,[switch]$AvailableOnly)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
public static class RequestedAssetPixels {
    public static long[] Read(Bitmap im) {
        long transparent=0,visible=0;
        int minX=im.Width,minY=im.Height,maxX=-1,maxY=-1;
        for(int y=0;y<im.Height;y++) for(int x=0;x<im.Width;x++) {
            byte a=im.GetPixel(x,y).A;
            if(a==0)transparent++;
            if(a>0){visible++;minX=Math.Min(minX,x);minY=Math.Min(minY,y);maxX=Math.Max(maxX,x);maxY=Math.Max(maxY,y);}
        }
        return new long[]{transparent,visible,minX,minY,maxX,maxY};
    }
}
'@
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$manifest=Get-Content -LiteralPath (Join-Path $projectRoot 'assets/asset-requests-v2-manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$images=@($manifest.assets | Where-Object {$_.width -and $_.height})
$checked=@()
$report=@()
foreach($asset in $images) {
    $target=[IO.Path]::GetFullPath((Join-Path $projectRoot $asset.path))
    if(-not $target.StartsWith($projectRoot+[IO.Path]::DirectorySeparatorChar)){throw 'Path outside project'}
    if(-not(Test-Path -LiteralPath $target)) {
        if($asset.generator -eq 'resize' -and (Test-Path -LiteralPath (Join-Path $projectRoot $asset.source))) {
            Copy-Item -LiteralPath (Join-Path $projectRoot $asset.source) -Destination $target
        } elseif($AvailableOnly){continue} else {throw "Missing $($asset.path)"}
    }
    $source=[Drawing.Image]::FromFile($target)
    if(-not $InspectOnly -and ($source.Width -ne $asset.width -or $source.Height -ne $asset.height)) {
        $output=New-Object Drawing.Bitmap($asset.width,$asset.height,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g=[Drawing.Graphics]::FromImage($output)
        $g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
        $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
        $sx=$asset.width/$source.Width; $sy=$asset.height/$source.Height
        if($asset.transparent){$scale=[Math]::Min($sx,$sy)}else{$scale=[Math]::Max($sx,$sy)}
        $w=[int][Math]::Round($source.Width*$scale); $h=[int][Math]::Round($source.Height*$scale)
        $x=[int][Math]::Floor(($asset.width-$w)/2); $y=[int][Math]::Floor(($asset.height-$h)/2)
        $g.DrawImage($source,(New-Object Drawing.Rectangle($x,$y,$w,$h)),0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel)
        $g.Dispose();$source.Dispose()
        $temporary=$target+'.sized.png'
        $output.Save($temporary,[Drawing.Imaging.ImageFormat]::Png)
        $output.Dispose()
        Move-Item -LiteralPath $temporary -Destination $target -Force
    }else{$source.Dispose()}
    $im=[Drawing.Bitmap]::FromFile($target)
    if($im.Width -ne $asset.width -or $im.Height -ne $asset.height){throw "Wrong dimensions $($asset.path)"}
    $px=[RequestedAssetPixels]::Read($im)
    if($px[1] -eq 0){throw "Empty image $($asset.path)"}
    if($asset.transparent -and $px[0] -eq 0){throw "Missing alpha $($asset.path)"}
    if(-not $asset.transparent -and $px[0] -gt 0){throw "Unexpected alpha $($asset.path)"}
    $report+=[ordered]@{path=$asset.path;width=$im.Width;height=$im.Height;transparentPixels=$px[0];visiblePixels=$px[1];visibleBounds=@($px[2],$px[3],$px[4],$px[5]);sha256=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLower();bytes=(Get-Item -LiteralPath $target).Length}
    $checked+=$asset
    $im.Dispose()
    Write-Output "OK $($asset.path)"
}
if(-not $AvailableOnly -and $checked.Count -ne 91){throw "Expected 91 PNGs, got $($checked.Count)"}
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $projectRoot 'docs/asset-validation-v2.json') -Encoding UTF8
$sets=@(
    @{name='faces';groups=@('faces');columns=5;width=200;height=210},
    @{name='scenes';groups=@('scenes','outfit','modules','celebration','ending');columns=4;width=260;height=210},
    @{name='ui';groups=@('grades','donations','items','games','badges');columns=6;width=180;height=170},
    @{name='brand';groups=@('brand');columns=2;width=500;height=300}
)
foreach($set in $sets) {
    $list=@($checked | Where-Object {$_.group -in $set.groups})
    if($list.Count -eq 0){continue}
    $cw=$set.width;$ch=$set.height;$columns=$set.columns
    $sheet=New-Object Drawing.Bitmap(($columns*$cw),([int][Math]::Ceiling($list.Count/$columns)*$ch))
    $g=[Drawing.Graphics]::FromImage($sheet)
    $g.Clear([Drawing.Color]::FromArgb(246,239,226))
    $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
    $font=New-Object Drawing.Font('Arial',8)
    for($i=0;$i -lt $list.Count;$i++) {
        $asset=$list[$i]
        $x=($i%$columns)*$cw;$y=[int][Math]::Floor($i/$columns)*$ch
        $g.FillRectangle([Drawing.Brushes]::LightGray,$x+4,$y+4,$cw-8,$ch-32)
        $im=[Drawing.Image]::FromFile((Join-Path $projectRoot $asset.path))
        $scale=[Math]::Min(($cw-18)/$im.Width,($ch-42)/$im.Height)
        $w=[int][Math]::Round($im.Width*$scale);$h=[int][Math]::Round($im.Height*$scale)
        $g.DrawImage($im,(New-Object Drawing.Rectangle(($x+[int](($cw-$w)/2)),($y+8+[int](($ch-42-$h)/2)),$w,$h)),0,0,$im.Width,$im.Height,[Drawing.GraphicsUnit]::Pixel)
        $im.Dispose()
        $label=[IO.Path]::GetFileNameWithoutExtension($asset.path).Replace('rakoko-face-','')
        $g.DrawString($label,$font,[Drawing.Brushes]::Black,($x+7),($y+$ch-23))
    }
    $g.Dispose();$font.Dispose()
    $sheet.Save((Join-Path $projectRoot ("docs/asset-v2-"+$set.name+".png")),[Drawing.Imaging.ImageFormat]::Png)
    $sheet.Dispose()
}
Write-Output "Validated $($checked.Count)/91 PNGs."
