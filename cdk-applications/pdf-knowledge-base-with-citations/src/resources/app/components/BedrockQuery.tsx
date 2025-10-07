import {
  Box,
  SpaceBetween,
  Button,
  Alert,
  FormField,
  Textarea,
} from '@cloudscape-design/components';
import React, { useState } from 'react';
import { pdfjs } from 'react-pdf';
import Citations from './Citations';
import { useAppContext } from '../AppContext';
import { findCitationPages } from '../utils/citationUtils';

// Add this line at the top of your file, after the imports
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const BedrockQuery: React.FC<{
  onGoToPage: (page: number) => void;
}> = ({ onGoToPage }) => {
  const {
    response,
    setResponse,
    citations,
    setCitations,
    citationPages,
    setCitationPages,
    setCurrentPdfFile,
    setPdfFileName,
  } = useAppContext();

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  console.log('BedrockQuery: citationPages updated', citationPages);
  console.log('Current citations:', citations);

  const handleSubmit = async (event: React.FormEvent) => {
    setIsLoading(true);
    setResponse(null);
    setCitations([]);
    setCitationPages({});

    console.log('Submitting query:', query);

    const startTime = Date.now();

    try {
      const apiResponse = await fetch('/api/query-bedrock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sessionId }),
      });

      const data = await apiResponse.json();
      console.log('Raw API Response:', JSON.stringify(data, null, 2));

      if (apiResponse.ok) {
        console.log('LLM Response:', data.response);
        setResponse(data.response);
        setSessionId(data.sessionId);
        console.log('Session ID:', data.sessionId);
        console.log(
          'Request Time:',
          ((Date.now() - startTime) / 1000).toFixed(3),
          'seconds',
        );

        console.log('Raw Citations:', JSON.stringify(data.citations, null, 2));
        const extractedCitations = data.citations.map(
          (citation: any, index: number) => ({
            content: citation.retrievedReferences[0]?.content?.text || '',
            metadata: {
              'x-amz-bedrock-kb-source-uri':
                citation.retrievedReferences[0]?.metadata?.[
                  'x-amz-bedrock-kb-source-uri'
                ] || '',
            },
            span:
              citation.generatedResponsePart?.textResponsePart?.span || null,
            retrievedReferences: citation.retrievedReferences,
            generatedResponsePart: citation.generatedResponsePart,
          }),
        );

        console.log(
          'Extracted Citations:',
          JSON.stringify(extractedCitations, null, 2),
        );
        setCitations(extractedCitations);

        // Modify this part to handle PDF loading errors more gracefully
        if (
          extractedCitations.length > 0 &&
          extractedCitations[0].metadata['x-amz-bedrock-kb-source-uri']
        ) {
          const fileName = extractedCitations[0].metadata['x-amz-bedrock-kb-source-uri']
            .split('/')
            .pop();
          const pdfUrl = `/api/documents/${fileName}`;
          try {
            const loadingTask = pdfjs.getDocument(pdfUrl);
            const loadedPdf = await loadingTask.promise;
            const pages = await findCitationPages(loadedPdf, extractedCitations);
            console.log('Citation pages found:', JSON.stringify(pages, null, 2));
            setCitationPages(pages);
          } catch (error) {
            console.error('Error loading PDF or finding citation pages:', error);
            setErrorMessage('Unable to load PDF for citations. The response is still available.');
          }
        }
      } else {
        setErrorMessage(data.message || 'An error occurred');
      }
    } catch (apiError) {
      console.error('Error:', apiError);
      setErrorMessage('An error occurred while fetching the response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    setQuery('');
    setResponse(null);
    setPdfFileName(null);
    setCitations([]);
  };

  const handleKeyDown = (event: CustomEvent<{ key: string }>) => {
    if (event.detail.key === 'Enter') {
      // event.preventDefault();
      void handleSubmit(event as unknown as React.FormEvent);
    }
  };

  return (
    <SpaceBetween size='l'>
      <FormField label='Enter your query'>
        <Textarea
          value={query}
          onChange={({ detail }) => setQuery(detail.value)}
          onKeyDown={handleKeyDown}
          placeholder='Type your query here... (Press Enter to submit)'
          rows={3}
        />
      </FormField>
      <SpaceBetween direction='horizontal' size='xs'>
        <Button
          variant='primary'
          onClick={() => handleSubmit({} as React.FormEvent)}
          loading={isLoading}
        >
          Submit Query
        </Button>
        <Button onClick={handleNewSession} disabled={isLoading}>
          New Session
        </Button>
      </SpaceBetween>
      {errorMessage && (
        <Alert type='error' header='Error'>
          {errorMessage}
        </Alert>
      )}
      {response && (
        <Box>
          <h3>Response</h3>
          <p>{response}</p>
          {citations.length > 0 && <Citations onGoToPage={onGoToPage} />}
        </Box>
      )}
    </SpaceBetween>
  );
};

export default BedrockQuery;
