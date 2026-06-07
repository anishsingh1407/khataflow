const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#1B5E20"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-weight="bold" 
        font-size="${size * 0.35}" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central"
      >KF</text>
    </svg>`;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, `icon-${size}.png`));
  
  console.log(`Generated icon-${size}.png`);
}

async function main() {
  for (const size of sizes) {
    await generateIcon(size);
  }
  console.log('All icons generated!');
}

main().catch(console.error);
