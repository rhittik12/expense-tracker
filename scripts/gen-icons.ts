import fs from 'fs';
import sharp from 'sharp';

const sizes = [192, 512];
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
    <stop stop-color="#7B5CFF" />
    <stop offset="0.5" stop-color="#00B5D8" />
    <stop offset="1" stop-color="#FFC842" />
  </linearGradient>
  <filter id="shadow" x="0" y="0" width="200%" height="200%">
    <feOffset dy="8"/>
    <feGaussianBlur stdDeviation="16" result="b"/>
    <feColorMatrix in="b" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
    <feBlend in="SourceGraphic" />
  </filter>
</defs>
<rect rx="128" width="512" height="512" fill="url(#g)"/>
<g filter="url(#shadow)">
<path d="M138 350c-3-64 24-105 78-129l52-24c18-8 28-19 28-36 0-23-19-40-47-40-31 0-51 19-55 49l-65-10c8-64 55-106 124-106 70 0 117 40 117 100 0 45-23 76-69 97l-55 24c-21 9-31 21-31 39h153v56H138v-20Z" fill="white"/>
</g>
</svg>`;

(async () => {
  for (const size of sizes) {
    const out = `public/icon-${size}.png`;
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
    console.log('Generated', out);
  }
})();
