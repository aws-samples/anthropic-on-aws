import { AppLayout, ContentLayout, Grid } from '@cloudscape-design/components';
import dynamic from 'next/dynamic';
import { useAppContext, AppProvider } from '../AppContext';

const BedrockQuery = dynamic(() => import('../components/BedrockQuery'), { ssr: false });
const PDFViewer = dynamic(() => import('../components/PDFViewer'), { ssr: false });

const AppContent = () => {
  const { response, currentPdfFile, currentPage, setCurrentPage } =
    useAppContext();

  const handleGoToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <AppLayout
      navigationHide
      toolsHide
      content={
        <ContentLayout>
          <Grid gridDefinition={[{ colspan: 4 }, { colspan: 8 }]}>
            <BedrockQuery onGoToPage={handleGoToPage} />
            {response && currentPdfFile ? (
              <PDFViewer />
            ) : (
              <ContentLayout>No PDF selected</ContentLayout>
            )}
          </Grid>
        </ContentLayout>
      }
    />
  );
};

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
