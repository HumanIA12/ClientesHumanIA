# PWA Icons

`icon.svg` es la fuente. Generar PNG 192x192 y 512x512 antes de instalar la PWA en producción:

```bash
# usando ImageMagick
magick public/icons/icon.svg -resize 192x192 public/icons/icon-192.png
magick public/icons/icon.svg -resize 512x512 public/icons/icon-512.png
```

O con `sharp` en un script Node:

```js
const sharp = require('sharp')
await sharp('public/icons/icon.svg').resize(192).png().toFile('public/icons/icon-192.png')
await sharp('public/icons/icon.svg').resize(512).png().toFile('public/icons/icon-512.png')
```
