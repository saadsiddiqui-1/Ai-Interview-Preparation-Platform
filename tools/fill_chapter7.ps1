$input = 'C:\Users\Faiz6\Downloads\chapter7.docx'
$output = 'C:\Users\Faiz6\OneDrive\Desktop\AI-Interview-Preparation-Platform\Module7_Chapter7.docx'
$work = Join-Path $env:TEMP ('chapter7_' + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $work | Out-Null
$inputZip = Join-Path $work 'source.zip'
Copy-Item -LiteralPath $input -Destination $inputZip
Expand-Archive -LiteralPath $inputZip -DestinationPath $work
$xmlPath = Join-Path $work 'word\document.xml'
[xml]$doc = Get-Content -Raw $xmlPath
$ns = [System.Xml.XmlNamespaceManager]::new($doc.NameTable)
$ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$replacements = @{
  'Write paragraph about project' = 'The AI Interview Preparation Platform is a full-stack web application that helps candidates prepare for interviews through resume analysis, personalized mock interviews, answer evaluation, performance analytics, and a learning-focused improvement plan. Module 7 extends the platform beyond score reporting by identifying weak areas and providing explanations, key concepts, examples, and practice questions. Improvement plans and recommendation status are stored in MongoDB for each authenticated user, allowing progress to continue across sessions.'
  'Write limitations or the features which are not supported by your application point wise (at least 4 points)' = '1. Learning content is currently rule-based and may not cover every specialized role or technology. 2. Practice questions are currently text-based; interactive lessons and video resources are not yet included. 3. Recommendation quality depends on the accuracy of interview evaluation scores. 4. The platform requires an internet connection for cloud database access and AI services. 5. Progress is tracked at recommendation level and does not yet include completion certificates or external course integrations.'
  'Write features which can be added further to enhance application (at least 4 points)' = '1. Add AI-generated lessons and role-specific study plans using the user resume and interview history. 2. Add curated links to courses, documentation, videos, and coding exercises for each weak skill. 3. Add targeted practice sessions that automatically generate questions only for the selected weak area. 4. Add reminders, streaks, badges, and milestone notifications. 5. Add multilingual learning content and accessibility features. 6. Add administrator tools for managing learning resources and question banks.'
  'Write all the references point wise' = '1. MongoDB Documentation – https://www.mongodb.com/docs/  2. Express.js Documentation – https://expressjs.com/  3. React Documentation – https://react.dev/  4. Node.js Documentation – https://nodejs.org/docs/  5. Mongoose Documentation – https://mongoosejs.com/docs/  6. Google Gemini API Documentation – https://ai.google.dev/gemini-api/docs'
  'Glossary' = 'AI: Artificial Intelligence. API: Application Programming Interface. JWT: JSON Web Token used for authentication. MongoDB: Document-oriented NoSQL database. Recommendation: A personalized learning action generated from interview performance. Practice topic: The skill area selected for focused revision and questions.'
}
foreach ($p in $doc.SelectNodes('//w:p', $ns)) {
  $text = (($p.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join '')
  if ($replacements.ContainsKey($text)) {
    $runs = $p.SelectNodes('.//w:r', $ns)
    $textNodes = $p.SelectNodes('.//w:t', $ns)
    if ($textNodes.Count -gt 0) {
      $textNodes[0].InnerText = $replacements[$text]
      for ($i = $textNodes.Count - 1; $i -ge 1; $i--) { $textNodes[$i].ParentNode.RemoveChild($textNodes[$i]) | Out-Null }
    }
  }
}
$settings = New-Object System.Xml.XmlWriterSettings
$settings.Encoding = New-Object System.Text.UTF8Encoding($false)
$settings.OmitXmlDeclaration = $false
$writer = [System.Xml.XmlWriter]::Create($xmlPath, $settings)
$doc.Save($writer); $writer.Close()
$sourceZipPath = Join-Path $work 'source.zip'
if (Test-Path $sourceZipPath) { Remove-Item -LiteralPath $sourceZipPath -Force }
if (Test-Path $output) { Remove-Item -LiteralPath $output -Force }
$outputZip = $output + '.zip'
if (Test-Path $outputZip) { Remove-Item -LiteralPath $outputZip -Force }
Compress-Archive -Path (Join-Path $work '*') -DestinationPath $outputZip
Move-Item -LiteralPath $outputZip -Destination $output
Remove-Item -LiteralPath $work -Recurse -Force
Write-Output $output
