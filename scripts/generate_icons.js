const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a5f" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#grad)" />
  <circle cx="256" cy="256" r="180" stroke="rgba(255,255,255,0.12)" stroke-width="8" fill="none" />
  <path d="M256 120 L370 170 V270 C370 340 318 400 256 420 C194 400 142 340 142 270 V170 Z" fill="url(#accent)" opacity="0.25" stroke="#38bdf8" stroke-width="12" stroke-linejoin="round" />
  <path d="M205 260 L240 295 L315 215" fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" />
  <text x="256" y="465" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="4">LVMS AGENT</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);
console.log('Saved public/icons/icon.svg');

async function makePngs() {
  const sharp = require('sharp');
  await sharp(Buffer.from(svgContent)).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Saved public/icons/icon-192.png');
  await sharp(Buffer.from(svgContent)).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Saved public/icons/icon-512.png');
}

makePngs().catch(console.error);
