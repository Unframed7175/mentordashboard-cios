// parsers/pdf.js — PDF voortgang parser
// PDF.js loaded as ESM from vendor/

import * as pdfjsLib from '../vendor/pdf.min.mjs';

// CRITICAL: workerSrc must be set before first getDocument() call
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  '../vendor/pdf.worker.min.mjs',
  import.meta.url
).href;

console.log('[pdf.js] PDF.js initialized, version:', pdfjsLib.version);
