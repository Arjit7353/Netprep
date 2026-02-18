// client/src/utils/fontLoader.js

let fontCache = {
  regular: null,
  bold: null,
  loaded: false,
  attempted: false,
  failed: false
};

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const containsHindi = (text) => {
  if (!text) return false;
  return /[\u0900-\u097F]/.test(String(text));
};

const tryLoadFont = async (doc, url, name, style) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 5000) return false;

    const base64 = arrayBufferToBase64(buffer);
    const vfsName = `${name}-${style}.ttf`;

    doc.addFileToVFS(vfsName, base64);
    doc.addFont(vfsName, name, style);

    // Validate font works
    doc.setFont(name, style);
    const fonts = doc.getFontList();
    if (!fonts[name]) throw new Error('Font not registered');

    // Test actual text rendering
    doc.setFontSize(10);
    doc.text('Test', -100, -100); // Off-screen test

    return true;
  } catch (err) {
    console.warn(`Font load failed (${url}):`, err.message);
    return false;
  }
};

export const loadHindiFont = async (doc) => {
  if (fontCache.loaded && fontCache.regular) {
    try {
      doc.addFileToVFS('Hindi-Regular.ttf', fontCache.regular);
      doc.addFont('Hindi-Regular.ttf', 'Hindi', 'normal');
      if (fontCache.bold) {
        doc.addFileToVFS('Hindi-Bold.ttf', fontCache.bold);
        doc.addFont('Hindi-Bold.ttf', 'Hindi', 'bold');
      }
      doc.setFont('Hindi', 'normal');
      return true;
    } catch {
      fontCache.loaded = false;
    }
  }

  if (fontCache.failed || fontCache.attempted) return false;
  fontCache.attempted = true;

  // Only try STATIC TTF fonts (variable fonts don't work with jsPDF)
  const paths = [
    '/fonts/NotoSansDevanagari-Regular.ttf',
    '/fonts/NotoSansDevanagari_Condensed-Regular.ttf',
    '/fonts/Mangal-Regular.ttf',
    '/fonts/Hindi-Regular.ttf'
  ];

  for (const path of paths) {
    try {
      const ok = await tryLoadFont(doc, path, 'Hindi', 'normal');
      if (ok) {
        const resp = await fetch(path);
        const buf = await resp.arrayBuffer();
        fontCache.regular = arrayBufferToBase64(buf);

        // Try bold
        const boldPath = path.replace('Regular', 'Bold');
        try {
          const boldOk = await tryLoadFont(doc, boldPath, 'Hindi', 'bold');
          if (boldOk) {
            const bResp = await fetch(boldPath);
            const bBuf = await bResp.arrayBuffer();
            fontCache.bold = arrayBufferToBase64(bBuf);
          }
        } catch {}

        fontCache.loaded = true;
        console.log('Hindi font loaded:', path);
        return true;
      }
    } catch {
      continue;
    }
  }

  fontCache.failed = true;
  console.warn(
    'Hindi font not available - using canvas rendering.\n' +
    'For TTF support, place STATIC .ttf files in client/public/fonts/\n' +
    'Download: https://fonts.google.com/noto/specimen/Noto+Sans+Devanagari\n' +
    'Use files from the "static" subfolder, NOT variable font files.'
  );
  return false;
};

/**
 * Canvas-based Hindi text rendering
 * Renders Hindi text as a high-quality PNG image
 */
export const renderCanvasText = (text, options = {}) => {
  const {
    fontSize = 10,
    bold = false,
    color = '#000000',
    maxWidth = 170
  } = options;

  const safe = String(text || '').replace(/[\r\n]+/g, ' ').trim();
  if (!safe) return { dataUrl: null, width: 0, height: 0, lineCount: 0 };

  const scale = 4; // High DPI for crisp text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Font stack with all possible Hindi-capable system fonts
  const fontStack = [
    '"Noto Sans Devanagari"',
    '"Mangal"',
    '"Nirmala UI"',
    '"Aparajita"',
    '"Kokila"',
    '"Arial Unicode MS"',
    '"Devanagari MT"',
    '"Devanagari Sangam MN"',
    'sans-serif'
  ].join(', ');

  const weight = bold ? 'bold' : 'normal';
  const scaledSize = fontSize * scale;
  const fontStr = `${weight} ${scaledSize}px ${fontStack}`;
  ctx.font = fontStr;

  // Word wrap
  const maxPx = maxWidth * scale;
  const words = safe.split(/\s+/);
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxPx && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) lines.push('');

  // Calculate dimensions
  const lineHeight = scaledSize * 1.45;
  const paddingX = scaledSize * 0.2;
  const paddingY = scaledSize * 0.3;

  // Find max line width
  let maxLineW = 0;
  lines.forEach(line => {
    const w = ctx.measureText(line).width;
    if (w > maxLineW) maxLineW = w;
  });

  canvas.width = Math.ceil(Math.min(maxLineW + paddingX * 2, maxPx + paddingX * 2));
  canvas.height = Math.ceil(lines.length * lineHeight + paddingY * 2);

  // Must re-set after resize
  ctx.font = fontStr;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.textRendering = 'optimizeLegibility';

  // Enable font smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  lines.forEach((line, i) => {
    ctx.fillText(line, paddingX, paddingY + i * lineHeight);
  });

  return {
    dataUrl: canvas.toDataURL('image/png', 1.0),
    width: canvas.width / scale,
    height: canvas.height / scale,
    lineCount: lines.length
  };
};

export const setupHindiSupport = async (doc, language) => {
  if (language !== 'hi') {
    return { fontFamily: 'helvetica', useTTF: false, useCanvas: false };
  }

  try {
    const loaded = await loadHindiFont(doc);
    if (loaded) {
      return { fontFamily: 'Hindi', useTTF: true, useCanvas: false };
    }
  } catch (err) {
    console.warn('Font setup error:', err.message);
  }

  return { fontFamily: 'helvetica', useTTF: false, useCanvas: true };
};

export default { loadHindiFont, containsHindi, renderCanvasText, setupHindiSupport };