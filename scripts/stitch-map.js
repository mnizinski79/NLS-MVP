const sharp = require('sharp');
const path = require('path');

const TILE_SIZE = 256;
const ZOOM = 3;
const START_X = 0, END_X = 7;
const START_Y = 1, END_Y = 6;
const COLS = END_X - START_X + 1;
const ROWS = END_Y - START_Y + 1;
const FULL_W = COLS * TILE_SIZE;
const FULL_H = ROWS * TILE_SIZE;
const OUT_W = 1920;
const OUT_H = 1080;

const tilesDir = path.join(__dirname, '../src/assets/map-tiles');
const outputFile = path.join(__dirname, '../src/assets/landing-map-bg.png');

async function main() {
  const composites = [];
  for (let y = START_Y; y <= END_Y; y++) {
    for (let x = START_X; x <= END_X; x++) {
      const tilePath = path.join(tilesDir, `tile_${ZOOM}_${x}_${y}.png`);
      // Force convert to 8-bit RGBA PNG buffer
      const pngBuf = await sharp(tilePath, { failOn: 'none' })
        .toColourspace('srgb')
        .ensureAlpha()
        .png({ palette: false })
        .toBuffer();
      composites.push({
        input: pngBuf,
        left: (x - START_X) * TILE_SIZE,
        top: (y - START_Y) * TILE_SIZE,
      });
    }
  }

  const bgBuf = await sharp({
    create: {
      width: FULL_W,
      height: FULL_H,
      channels: 4,
      background: { r: 240, g: 242, b: 244, alpha: 1 },
    },
  }).png().toBuffer();

  await sharp(bgBuf)
    .composite(composites)
    .extract({
      left: Math.floor((FULL_W - OUT_W) / 2),
      top: Math.floor((FULL_H - OUT_H) / 2),
      width: OUT_W,
      height: OUT_H,
    })
    .png()
    .toFile(outputFile);

  console.log(`✅ Map exported to src/assets/landing-map-bg.png (${OUT_W}x${OUT_H})`);
}

main().catch(console.error);
