// Generates public/icon-192.png and public/icon-512.png.
// Dark background (#0d0d0d) + gold rounded rectangle + pixel-art "B".
// Uses only Node.js built-ins (zlib for DEFLATE, Buffer for binary I/O).
// Run once: node scripts/generate-icons.js

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC-32 table (used by PNG chunk integrity) ──────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG chunk builder ───────────────────────────────────────────────────────
function chunk(type, data) {
  const t  = Buffer.from(type, 'ascii');
  const lb = Buffer.allocUnsafe(4); lb.writeUInt32BE(data.length, 0);
  const cb = Buffer.allocUnsafe(4); cb.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([lb, t, data, cb]);
}

// ── Build a raw RGB pixel canvas ────────────────────────────────────────────
function createCanvas(size) {
  const pixels = Buffer.alloc(size * size * 3); // filled with zeros
  return {
    set(x, y, r, g, b) {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      const i = (y * size + x) * 3;
      pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b;
    },
    fill(r, g, b) { for (let i = 0; i < pixels.length; i += 3) { pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; } },
    circle(cx, cy, radius, r, g, b) {
      for (let y = -radius; y <= radius; y++)
        for (let x = -radius; x <= radius; x++)
          if (x*x + y*y <= radius*radius) this.set(cx+x, cy+y, r, g, b);
    },
    rect(x, y, w, h, r, g, b) {
      for (let dy = 0; dy < h; dy++)
        for (let dx = 0; dx < w; dx++)
          this.set(x+dx, y+dy, r, g, b);
    },
    toPNG() {
      // PNG signature
      const sig = Buffer.from([137,80,78,71,13,10,26,10]);
      // IHDR
      const ihdr = Buffer.allocUnsafe(13);
      ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
      ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
      // Raw scanlines: filter byte (0) + RGB per row
      const raw = Buffer.allocUnsafe(size * (1 + size * 3));
      for (let y = 0; y < size; y++) {
        raw[y * (1 + size*3)] = 0; // filter: None
        pixels.subarray(y*size*3, (y+1)*size*3).copy(raw, y*(1+size*3)+1);
      }
      const idat = zlib.deflateSync(raw, { level: 9 });
      return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',idat), chunk('IEND',Buffer.alloc(0))]);
    },
  };
}

// ── 10×14 pixel-art bitmap for "B" ──────────────────────────────────────────
// Each row is a bitmask (MSB = leftmost pixel).
const B_BITMAP = [
  0b1111110000,
  0b1100011000,
  0b1100011000,
  0b1100011000,
  0b1111110000,
  0b1100001100,
  0b1100001100,
  0b1100001100,
  0b1100001100,
  0b1111110000,
];
const B_ROWS = B_BITMAP.length; // 10
const B_COLS = 10;

// ── Draw icon at a given size ────────────────────────────────────────────────
function drawIcon(size) {
  const BG   = [13,  13,  13];   // #0d0d0d
  const GOLD = [212, 160, 23];   // #d4a017
  const RING = [180, 130, 10];   // slightly darker ring

  const c = createCanvas(size);
  c.fill(...BG);

  // Gold circle background
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);
  const r  = Math.floor(size * 0.42);
  c.circle(cx, cy, r, ...RING);
  c.circle(cx, cy, Math.floor(r * 0.94), ...GOLD);

  // Scale the "B" bitmap to fill ~50% of the icon
  const letterH = Math.floor(size * 0.50);
  const letterW = Math.floor(letterH * (B_COLS / B_ROWS));
  const ox = Math.floor((size - letterW) / 2);
  const oy = Math.floor((size - letterH) / 2);

  const cellW = letterW / B_COLS;
  const cellH = letterH / B_ROWS;

  for (let row = 0; row < B_ROWS; row++) {
    for (let col = 0; col < B_COLS; col++) {
      const bit = (B_BITMAP[row] >> (B_COLS - 1 - col)) & 1;
      if (!bit) continue;
      const px = Math.floor(ox + col * cellW);
      const py = Math.floor(oy + row * cellH);
      const pw = Math.max(1, Math.ceil(cellW));
      const ph = Math.max(1, Math.ceil(cellH));
      c.rect(px, py, pw, ph, ...BG);
    }
  }

  return c.toPNG();
}

// ── Write both icons ─────────────────────────────────────────────────────────
const outDir = path.resolve(__dirname, '../public');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const out = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(out, drawIcon(size));
  console.log(`✓ ${out} (${size}×${size})`);
}
