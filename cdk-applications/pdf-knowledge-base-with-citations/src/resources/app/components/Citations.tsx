import { SpaceBetween, Button, Box } from '@cloudscape-design/components';
import React from 'react';
import { useAppContext } from '../AppContext';
import { Citation } from '../types/Citation';

interface CitationsProps {
  onGoToPage: (page: number, citationText: string) => void;
}

const Citations: React.FC<CitationsProps> = ({ onGoToPage }) => {
  const { citations, citationPages, setCurrentPdfFile, setPdfFileName } =
    useAppContext();

  return (
    <SpaceBetween direction='vertical' size='s'>
      <h4>Citations</h4>
      {citations.map((citation: Citation, index: number) => (
        <Box key={index}>
          <Button
            variant='link'
            disabled={citationPages[index] === undefined}
            onClick={() => {
              const fileName = citation.metadata['x-amz-bedrock-kb-source-uri']
                ?.split('/')
                .pop();
              if (fileName) {
                setCurrentPdfFile(`/api/documents/${fileName}`);
                setPdfFileName(fileName);
                onGoToPage(citationPages[index] || 1, citation.content);
              }
            }}
          >
            Citation {index + 1}{' '}
            {citationPages[index] !== undefined
              ? `(Page ${citationPages[index]})`
              : '(Loading...)'}
          </Button>
          <p>
            Source:{' '}
            {citation.metadata['x-amz-bedrock-kb-source-uri']
              ?.split('/')
              .pop() || 'Unknown'}
          </p>
          {/* <p>Content: {citation.content.substring(0, 200)}...</p> */}
        </Box>
      ))}
    </SpaceBetween>
  );
};

export default Citations;
