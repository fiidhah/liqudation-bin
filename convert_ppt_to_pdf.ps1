$pptxPath = (Get-Item ".\SmartBin_Project_Presentation.pptx").FullName
$pdfPath = (Join-Path (Get-Location) "SmartBin_DailyPricing_Presentation.pdf")

try {
    Write-Host "Initializing PowerPoint..."
    $pptApp = New-Object -ComObject PowerPoint.Application
    Write-Host "Opening Presentation..."
    $presentation = $pptApp.Presentations.Open($pptxPath, 2, 0, 0)
    Write-Host "Exporting to PDF: $pdfPath..."
    $presentation.SaveAs($pdfPath, 32)
    $presentation.Close()
    $pptApp.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($pptApp) | Out-Null
    Write-Host "SUCCESS: Exported PDF to $pdfPath"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
