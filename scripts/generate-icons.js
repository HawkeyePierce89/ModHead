// Simple script to generate SVG icons
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateIcon(size) {
  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3498db" rx="${size / 8}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.6}"
        fill="white" text-anchor="middle" dominant-baseline="central" font-weight="bold">M</text>
</svg>`.trim();

  return svg;
}

const sizes = [16, 48, 128];
const publicDir = join(__dirname, '..', 'public');

sizes.forEach(size => {
  const svg = generateIcon(size);
  const filename = join(publicDir, `icon${size}.svg`);
  writeFileSync(filename, svg);
  console.log(`Generated icon${size}.svg`);
});

console.log('All icons generated successfully!');
