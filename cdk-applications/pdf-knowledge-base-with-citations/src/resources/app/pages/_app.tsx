import { AppLayout } from '@cloudscape-design/components';
import type { AppProps } from 'next/app';
import '@cloudscape-design/global-styles/index.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppLayout
      content={<Component {...pageProps} />}
      navigationHide={true}
      toolsHide={true}
    />
  );
}

export default MyApp;