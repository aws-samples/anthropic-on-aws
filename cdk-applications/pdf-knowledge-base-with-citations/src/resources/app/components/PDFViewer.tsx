import {
  SpaceBetween,
  Button,
  Box,
  Alert,
} from '@cloudscape-design/components';
import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useAppContext } from '../AppContext';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer: React.FC = () => {
  const { currentPdfFile, currentPage, setCurrentPage, pdfText, setPdfText } =
    useAppContext();

  const [numPages, setNumPages] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [goToPage, setGoToPage] = useState('');
  const [isPdfTextLoaded, setIsPdfTextLoaded] = useState(false);

  const pdfUrl = currentPdfFile ? 
    (currentPdfFile.startsWith('/api') ? currentPdfFile : `/api/documents/${currentPdfFile}`) 
    : null;

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: totalPages }: { numPages: number }) => {
      setNumPages(totalPages);
      setErrorMessage(null);
    },
    [],
  );

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('Error loading PDF:', err);
    setErrorMessage(
      'Failed to load PDF. Please make sure the file exists in the public/documents folder.',
    );
  }, []);

  const handleGoToPage = useCallback(() => {
    const page = parseInt(goToPage, 10);
    if (page && page > 0 && page <= (numPages || 0)) {
      setCurrentPage(page);
    }
    setGoToPage('');
  }, [goToPage, numPages, setCurrentPage]);

  useEffect(() => {
    if (currentPdfFile && pdfUrl) {
      setIsPdfTextLoaded(false);
      fetch(pdfUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then((arrayBuffer) => pdfjs.getDocument(arrayBuffer).promise)
        .then((pdf) => {
          let fullText = '';
          const loadPage = async (pageNum: number): Promise<void> => {
            try {
              const page = await pdf.getPage(pageNum);
              const content = await page.getTextContent();
              const pageText = content.items
                .map((item) => {
                  if ('str' in item) {
                    return item.str;
                  }
                  return '';
                })
                .join(' ');
              fullText += pageText + ' ';
              if (pageNum < pdf.numPages) {
                await loadPage(pageNum + 1);
              } else {
                setPdfText(fullText);
                setIsPdfTextLoaded(true);
                console.log('PDF text loaded, length:', fullText.length);
              }
            } catch (error) {
              console.error(`Error loading page ${pageNum}:`, error);
            }
          };

          loadPage(1).catch((error) => {
            console.error('Error in loadPage:', error);
          });
        })
        .catch((error) => {
          console.error('Error loading PDF text:', error);
          setErrorMessage(`Failed to load PDF: ${error.message}`);
        });
    }
  }, [currentPdfFile, pdfUrl, setPdfText]);

  if (errorMessage) {
    return (
      <Alert type='error' header='Error loading PDF'>
        <p>{errorMessage}</p>
        <p>Attempted to load: {pdfUrl}</p>
      </Alert>
    );
  }

  if (!pdfUrl) {
    return <Box>No PDF selected</Box>;
  }

  return (
    <SpaceBetween size='l'>
      <div
        style={{
          height: 'calc(100vh - 200px)',
          overflowY: 'auto',
          width: '100%',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '16px',
        }}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
        >
          <Page
            pageNumber={currentPage}
            renderAnnotationLayer={false}
            renderTextLayer={true}
            width={Math.min(800, window.innerWidth - 72)}
            scale={1}
          />
        </Document>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <SpaceBetween direction='horizontal' size='xs' alignItems='center'>
          <Button
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Box>
            Page {currentPage} of {numPages}
          </Box>
          <Button
            onClick={() =>
              setCurrentPage(Math.min(currentPage + 1, numPages || 0))
            }
            disabled={currentPage >= (numPages || 0)}
          >
            Next
          </Button>
          <SpaceBetween direction='horizontal' size='xxs'>
            <input
              type='number'
              value={goToPage}
              onChange={(e) => setGoToPage(e.target.value)}
              min={1}
              max={numPages || 1}
              style={{ width: '50px' }}
            />
            <Button onClick={handleGoToPage}>Go</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    </SpaceBetween>
  );
};

export default PDFViewer;
