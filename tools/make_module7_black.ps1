$input = 'C:\Users\Faiz6\OneDrive\Desktop\AI-Interview-Preparation-Platform\Module7_Chapter7.docx'
$output = 'C:\Users\Faiz6\OneDrive\Desktop\AI-Interview-Preparation-Platform\Module7_Chapter7_BlackText.docx'
$work = Join-Path $env:TEMP ('module7black_' + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $work | Out-Null
$zip = Join-Path $work 'source.zip'
Copy-Item -LiteralPath $input -Destination $zip
Expand-Archive -LiteralPath $zip -DestinationPath $work
Remove-Item -LiteralPath $zip -Force
$xmlPath = Join-Path $work 'word\document.xml'
[xml]$doc = Get-Content -Raw $xmlPath
$ns = [System.Xml.XmlNamespaceManager]::new($doc.NameTable)
$ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
foreach ($color in $doc.SelectNodes('//w:color', $ns)) {
  if ($color.GetAttribute('val', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main') -eq 'FF0000') { $color.SetAttribute('val', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main', '000000') }
}
$settings = New-Object System.Xml.XmlWriterSettings
$settings.Encoding = New-Object System.Text.UTF8Encoding($false)
$writer = [System.Xml.XmlWriter]::Create($xmlPath, $settings)
$doc.Save($writer); $writer.Close()
if (Test-Path $output) { Remove-Item -LiteralPath $output -Force }
$outputZip = $output + '.zip'
if (Test-Path $outputZip) { Remove-Item -LiteralPath $outputZip -Force }
Compress-Archive -Path (Join-Path $work '*') -DestinationPath $outputZip
Move-Item -LiteralPath $outputZip -Destination $output
Remove-Item -LiteralPath $work -Recurse -Force
Write-Output $output
