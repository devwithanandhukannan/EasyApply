import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import htmlPdf from 'html-pdf-node';

const BROWSER_PATHS = [
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/brave-browser',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

export function getSystemBrowserPath(): string | null {
  for (const p of BROWSER_PATHS) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export async function renderHtmlToPdf(
  htmlContent: string,
  margins: { top?: number; right?: number; bottom?: number; left?: number } = { top: 48, right: 48, bottom: 48, left: 48 },
  documentTitle = 'Resume'
): Promise<Buffer> {
  const mTop = Number(margins.top) || 48;
  const mRight = Number(margins.right) || 48;
  const mBottom = Number(margins.bottom) || 48;
  const mLeft = Number(margins.left) || 48;

  // Sanitize AI suggestion tags so temporary UI marks don't appear in the PDF
  const cleanHtml = htmlContent
    .replace(/<span[^>]*data-suggestion-id[^>]*>(.*?)<\/span>/gis, '$1')
    .replace(/<mark[^>]*>(.*?)<\/mark>/gis, '$1');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle}</title>
  <style>
    /* Complete CSS Reset for Exact 1:1 Rendering */
    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4 portrait;
      margin: ${mTop}px ${mRight}px ${mBottom}px ${mLeft}px;
    }

    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: "Times New Roman", Times, serif;
      font-size: 13.5px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #000000;
      margin: 0 0 2px 0;
      text-align: center;
      page-break-after: avoid;
      break-after: avoid;
    }

    h2 {
      font-size: 14.5px;
      font-weight: 700;
      color: #000000;
      margin: 10px 0 2px 0;
      padding-bottom: 2px;
      border-bottom: 1px solid #000000;
      page-break-after: avoid;
      break-after: avoid;
    }

    h3 {
      font-size: 13.5px;
      font-weight: 700;
      color: #000000;
      margin: 6px 0 2px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    p {
      margin: 0 0 2px 0;
      color: #000000;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    ul {
      list-style-type: disc;
      list-style-position: outside;
      margin: 0 0 2px 0;
      padding-left: 20px;
    }

    ol {
      list-style-type: decimal;
      list-style-position: outside;
      margin: 0 0 2px 0;
      padding-left: 20px;
    }

    li {
      margin: 0 0 1px 0;
      color: #000000;
      padding-left: 2px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    hr {
      border: none;
      border-top: 1px solid #000000;
      margin: 6px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    strong, b {
      font-weight: 700;
    }

    em, i {
      font-style: italic;
    }

    u {
      text-decoration: underline;
    }

    s, strike {
      text-decoration: line-through;
    }

    mark {
      background: transparent !important;
      padding: 0 2px;
    }

    span[style*="float: right"], span[style*="float:right"], .float-right {
      float: right !important;
      text-align: right !important;
    }

    span[data-suggestion-id] {
      background: transparent !important;
      border: none !important;
      color: inherit !important;
      text-decoration: none !important;
    }
  </style>
</head>
<body>
  ${cleanHtml}
</body>
</html>`;

  const browserPath = getSystemBrowserPath();

  if (browserPath) {
    const id = crypto.randomBytes(8).toString('hex');
    const tempHtml = path.join(os.tmpdir(), `resume_${id}.html`);
    const tempPdf = path.join(os.tmpdir(), `resume_${id}.pdf`);

    try {
      await fs.promises.writeFile(tempHtml, fullHtml, 'utf8');

      const args = [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
        '--hide-scrollbars',
        '--window-size=794,1123',
        '--no-pdf-header-footer',
        `--print-to-pdf=${tempPdf}`,
        tempHtml,
      ];

      await new Promise<void>((resolve, reject) => {
        execFile(browserPath, args, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const buffer = await fs.promises.readFile(tempPdf);
      return buffer;
    } finally {
      // Cleanup temporary files
      fs.promises.unlink(tempHtml).catch(() => {});
      fs.promises.unlink(tempPdf).catch(() => {});
    }
  }

  // Fallback to html-pdf-node
  const options = {
    format: 'A4',
    margin: {
      top: `${mTop}px`,
      right: `${mRight}px`,
      bottom: `${mBottom}px`,
      left: `${mLeft}px`,
    },
    printBackground: true,
  };

  return await htmlPdf.generatePdf({ content: fullHtml }, options);
}
