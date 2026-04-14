const https = require('https');
const fs = require('fs');
const path = require('path');

// Map config matching landing page: center [30, 0], zoom 3
const ZOOM = 3;
const CENTER_LAT = 30;
const CENTER_LNG = 0;
const OUTPUT_WIDTH = 1920; // pixels
const OUTPUT_HEIGHT = 1080;
const TILE_SIZE = 256;

// CartoDB light_nolabels tiles
const TILE_URL = 'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png';

// Convert lat/lng to pixel coordinates at given zoom
function latLngToPixel(lat, lng, zoom) {
  const scale = Math.pow(2, zoom) * TILE_SIZE;
  const x = ((lng + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

// Download a single tile
function downloadTile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Generating static map image...');
  console.log(`Center: [${CENTER_LAT}, ${CENTER_LNG}], Zoom: ${ZOOM}`);
  console.log(`Output: ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}px`);

  // For a simple approach, download a grid of tiles and provide instructions
  // CartoDB also has a static API we can use directly
  
  // Use the static map endpoint from CartoDB
  // Unfortunately CartoDB doesn't have a simple static API like Google Maps
  // Instead, let's download individual tiles and tell the user how to use them
  
  const centerPixel = latLngToPixel(CENTER_LAT, CENTER_LNG, ZOOM);
  
  // Calculate which tiles we need
  const startTileX = Math.floor((centerPixel.x - OUTPUT_WIDTH / 2) / TILE_SIZE);
  const startTileY = Math.floor((centerPixel.y - OUTPUT_HEIGHT / 2) / TILE_SIZE);
  const endTileX = Math.ceil((centerPixel.x + OUTPUT_WIDTH / 2) / TILE_SIZE);
  const endTileY = Math.ceil((centerPixel.y + OUTPUT_HEIGHT / 2) / TILE_SIZE);
  
  console.log(`Tiles needed: x[${startTileX}-${endTileX}], y[${startTileY}-${endTileY}]`);
  
  const outputDir = path.join(__dirname, '../src/assets/map-tiles');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const tiles = [];
  for (let x = startTileX; x <= endTileX; x++) {
    for (let y = startTileY; y <= endTileY; y++) {
      const url = TILE_URL.replace('{z}', ZOOM).replace('{x}', x).replace('{y}', y);
      const filename = `tile_${ZOOM}_${x}_${y}.png`;
      console.log(`Downloading ${filename}...`);
      try {
        const data = await downloadTile(url);
        fs.writeFileSync(path.join(outputDir, filename), data);
        tiles.push({ x, y, filename });
      } catch (e) {
        console.error(`Failed to download tile ${x},${y}:`, e.message);
      }
    }
  }
  
  console.log(`\n✅ Downloaded ${tiles.length} tiles to src/assets/map-tiles/`);
  console.log(`\nTo create the full map image:`);
  console.log(`1. Open any image editor (or use ImageMagick)`);
  console.log(`2. Create a ${(endTileX - startTileX + 1) * 512}x${(endTileY - startTileY + 1) * 512}px canvas`);
  console.log(`3. Place tiles in a grid (each tile is 512x512 @2x)`);
  console.log(`4. Crop to ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}px centered`);
  console.log(`\nOr use this ImageMagick command:`);
  
  // Build montage command
  const cols = endTileX - startTileX + 1;
  const tileFiles = [];
  for (let y = startTileY; y <= endTileY; y++) {
    for (let x = startTileX; x <= endTileX; x++) {
      tileFiles.push(`tile_${ZOOM}_${x}_${y}.png`);
    }
  }
  
  console.log(`cd src/assets/map-tiles && montage ${tileFiles.join(' ')} -tile ${cols}x -geometry 512x512+0+0 ../landing-map-bg.png`);
}

main().catch(console.error);
