import * as pdfjsLib from 'pdfjs-dist';

// Configure workerSrc using jsDelivr CDN matching pdfjsLib version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Downloads a PDF from a secure URL and extracts all readable text using pdfjs-dist.
 */
export async function extractTextFromPdfUrl(url: string): Promise<string> {
  if (!url) {
    throw new Error("No PDF URL provided for text extraction.");
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download PDF file (${response.status} ${response.statusText}).`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let textBuilder: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => item.str)
        .filter((str: string) => str && str.trim().length > 0);
      
      if (pageStrings.length > 0) {
        textBuilder.push(pageStrings.join(' '));
      }
    }

    const fullText = textBuilder.join('\n\n').trim();

    if (!fullText) {
      throw new Error("Unable to extract readable text from the PDF. The file might be scanned or image-based.");
    }

    return fullText;
  } catch (error: any) {
    console.error("PDF text extraction error:", error);
    throw new Error(error.message || "Failed to parse PDF document.");
  }
}
