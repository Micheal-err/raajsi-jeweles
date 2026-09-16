$files = Get-ChildItem -Path 'src' -Recurse -Include '*.tsx','*.ts'
foreach ($f in $files) {
  $c = [System.IO.File]::ReadAllText($f.FullName)
  $n = $c.Replace('Kalaneri Art Gallery','Raajsi Jewels')
  $n = $n.Replace('Gallery Director','Jewellery Specialist')
  $n = $n.Replace('gallery director','jewellery specialist')
  $n = $n.Replace('gallery directors','jewellery specialists')
  $n = $n.Replace('Kalaneri Journal','Raajsi Journal')
  $n = $n.Replace('Kalaneri Archive','Raajsi Jewels')
  $n = $n.Replace('"Kalaneri"','"Raajsi Jewels"')
  $n = $n.Replace('hello@kalaneri.art','hello@raajsijewels.com')
  $n = $n.Replace('Kalaneri ·','Raajsi Jewels ·')
  $n = $n.Replace('· Kalaneri','· Raajsi Jewels')
  $n = $n.Replace('art gallery','jewellery showroom')
  $n = $n.Replace('Art Gallery','Jewellery')
  $n = $n.Replace('Kalaneri','Raajsi Jewels')
  if ($n -ne $c) {
    [System.IO.File]::WriteAllText($f.FullName, $n)
    Write-Host "Updated: $($f.Name)"
  }
}
Write-Host "Done!"
