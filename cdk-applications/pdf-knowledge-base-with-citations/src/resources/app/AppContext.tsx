import React, { createContext, useContext, useState, useEffect } from 'react';
import { Citation } from './types/Citation';

interface AppContextType {
  pdfFileName: string | null;
  setPdfFileName: (name: string | null) => void;
  currentPdfFile: string | null;
  setCurrentPdfFile: (file: string | null) => void;
  citations: Citation[];
  setCitations: (citations: Citation[]) => void;
  response: string | null;
  setResponse: (response: string | null) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  citationPages: Record<number, number>;
  setCitationPages: (pages: Record<number, number>) => void;
  pdfText: string;
  setPdfText: (text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [currentPdfFile, setCurrentPdfFile] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [response, setResponse] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [citationPages, setCitationPages] = useState<Record<number, number>>(
    {},
  );
  const [pdfText, setPdfText] = useState('');

  useEffect(() => {
    console.log('Citation pages updated:', citationPages);
  }, [citationPages]);

  return (
    <AppContext.Provider
      value={{
        pdfFileName,
        setPdfFileName,
        currentPdfFile,
        setCurrentPdfFile,
        citations,
        setCitations,
        response,
        setResponse,
        currentPage,
        setCurrentPage,
        citationPages,
        setCitationPages,
        pdfText,
        setPdfText,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
