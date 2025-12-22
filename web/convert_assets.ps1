# Santa Tracker - Asset Conversion Script
# Uses Docker to convert static CCTV images to 10-second MP4 loops

$workDir = Get-Location
$mediaDir = "$workDir\media"

Write-Host "Converting CCTV assets in: $mediaDir"

$images = @("cctv_stables", "cctv_workshop", "cctv_hangar", "cctv_mailroom")

foreach ($img in $images) {
    Write-Host "Processing $img.png ..."
    
    # Check if input exists
    if (!(Test-Path "$mediaDir\$img.png")) {
        Write-Error "File not found: $mediaDir\$img.png"
        continue
    }

    # Run FFMPEG via Docker
    # Mounting current directory to /tmp/work
    docker run --rm -v "${mediaDir}:/tmp/work" -w /tmp/work jrottenberg/ffmpeg -y -loop 1 -i "$img.png" -c:v libx264 -t 10 -pix_fmt yuv420p "$img.mp4"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success: $img.mp4 created." -ForegroundColor Green
    } else {
        Write-Error "Failed to convert $img.png"
    }
}

Write-Host "Conversion complete. Please run 'docker compose up -d --build' to deploy."
