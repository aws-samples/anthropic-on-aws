import { PDFDocumentProxy } from 'pdfjs-dist';
import { Citation } from '../types/Citation';

export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
};

export const findCitationPages = async (
  pdfDoc: PDFDocumentProxy,
  citations: Citation[],
): Promise<Record<number, number>> => {
  console.log('Starting findCitationPages');
  console.log('Number of citations:', citations.length);
  console.log('Citations:', citations);

  const citationPages: Record<number, number> = {};

  for (let i = 0; i < citations.length; i++) {
    const citation = citations[i];
    console.log(`Processing citation ${i}:`, citation);

    const normalizedCitation = normalizeText(citation.content);
    const chunks = normalizedCitation
      .split(' ')
      .filter((chunk) => chunk.length > 3);
    console.log(`Chunks for citation ${i}:`, chunks);

    let foundPage = false;
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = normalizeText(
        textContent.items.map((item: any) => item.str).join(' '),
      );

      let score = 0;
      for (const chunk of chunks) {
        if (pageText.includes(chunk)) {
          score += 1;
        }
      }

      const threshold = chunks.length * 0.7; // 70% match threshold
      console.log(
        `Page ${pageNum} score: ${score}/${chunks.length}, threshold: ${threshold}`,
      );
      if (score >= threshold) {
        console.log(
          `Citation ${i} found on page ${pageNum} with score ${score}/${chunks.length}`,
        );
        citationPages[i] = Math.max(1, pageNum); // Subtract 1 from the page number, but ensure it's not less than 1
        foundPage = true;
        break;
      }
    }

    if (!foundPage) {
      console.log(
        `Citation ${i} not found in the document, using default page 1`,
      );
      citationPages[i] = 1;
    }
  }

  console.log('Finished findCitationPages, citationPages:', citationPages);
  return citationPages;
};

export const findCitationLocationInPDF = async (
  pageText: string,
  citation: string,
  pageNumber: number,
): Promise<{
  startIndex: number;
  endIndex: number;
  pageNumber: number;
} | null> => {
  try {
    const response = await fetch('/api/bedrock-find-citation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pageText, citation, pageNumber }),
    });

    if (!response.ok) {
      throw new Error('Failed to find citation location');
    }

    const result = await response.json();
    return { ...result, pageNumber };
  } catch (error) {
    console.error('Error finding citation location:', error);
    return null;
  }
};
