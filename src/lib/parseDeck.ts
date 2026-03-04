import JSZip from "jszip";

/**
 * Extract text from a PDF file using pdf.js
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  
  // Use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ")
      .trim();
    if (pageText) {
      pages.push(`--- Slide ${i} ---\n${pageText}`);
    }
  }

  return pages.join("\n\n");
}

/**
 * Extract text from a PPTX file by parsing the XML slides inside the zip
 */
export async function extractTextFromPPTX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Find all slide XML files (ppt/slides/slide1.xml, slide2.xml, etc.)
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  const pages: string[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlContent = await zip.files[slideFiles[i]].async("text");
    // Extract text from XML by stripping tags and getting text nodes
    // The text in PPTX slides is in <a:t> elements
    const textMatches = xmlContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
    if (textMatches) {
      const slideText = textMatches
        .map((match) => match.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean)
        .join(" ");
      if (slideText) {
        pages.push(`--- Slide ${i + 1} ---\n${slideText}`);
      }
    }
  }

  return pages.join("\n\n");
}

/**
 * Extract text from a DOCX file by parsing the XML document inside the zip
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXml = zip.files["word/document.xml"];
  if (!docXml) throw new Error("Invalid DOCX file.");
  const xmlContent = await docXml.async("text");
  const textMatches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  if (!textMatches) return "";
  return textMatches
    .map((match) => match.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join(" ");
}

/**
 * Parse an uploaded deck file and return extracted text
 */
export async function parseDeckFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  
  if (ext === "pdf") {
    return extractTextFromPDF(file);
  } else if (ext === "pptx") {
    return extractTextFromPPTX(file);
  } else if (ext === "docx") {
    return extractTextFromDOCX(file);
  }
  
  throw new Error("Unsupported file type. Please upload a PDF, PPTX, or DOCX file.");
}
