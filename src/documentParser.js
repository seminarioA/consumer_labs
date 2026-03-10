// documentParser.js
// Extracts plain text from PDF, DOCX, and XLSX files.
// Uses: pdfjs-dist, mammoth, xlsx (SheetJS)

let pdfjsLib = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import("pdfjs-dist");
  // Use the worker bundled with pdfjs-dist (Vite will handle it)
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).href;
  return pdfjsLib;
}

// ─── PDF ─────────────────────────────────────────────────────────────────────
async function parsePDF(arrayBuffer) {
  const pdfjs = await getPdfJs();
  const pdf   = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(it => it.str).join(" ") + "\n";
  }
  return text.trim();
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────
async function parseDOCX(arrayBuffer) {
  const mammoth = (await import("mammoth")).default;
  const result  = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────
async function parseXLSX(arrayBuffer) {
  const XLSX  = (await import("xlsx")).default;
  const wb    = XLSX.read(arrayBuffer, { type: "array" });
  let text = "";
  for (const sheetName of wb.SheetNames) {
    const ws   = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    text += `=== ${sheetName} ===\n`;
    for (const row of rows) {
      const line = row.filter(Boolean).join(" | ");
      if (line) text += line + "\n";
    }
    text += "\n";
  }
  return text.trim();
}

// ─── Public entry point ───────────────────────────────────────────────────────
export async function extractTextFromFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf"))  return parsePDF(arrayBuffer);
  if (name.endsWith(".docx") || name.endsWith(".doc")) return parseDOCX(arrayBuffer);
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv"))
    return parseXLSX(arrayBuffer);

  throw new Error(`Formato no soportado: ${file.name}`);
}
