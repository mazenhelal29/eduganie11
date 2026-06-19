Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("d:\Desktop\Eduganie\public\logo.jpg")
$bmp = new-object System.Drawing.Bitmap($img, 512, 512)
$bmp.Save("d:\Desktop\Eduganie\public\icons\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp192 = new-object System.Drawing.Bitmap($img, 192, 192)
$bmp192.Save("d:\Desktop\Eduganie\public\icons\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$bmp192.Dispose()
$img.Dispose()
