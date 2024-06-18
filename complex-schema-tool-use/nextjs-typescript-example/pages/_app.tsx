import '@cloudscape-design/global-styles';
import './styles/ChatBot.module.css';
import './styles/ThinkingDots.module.css';
import React from 'react';

if (typeof window === 'undefined') React.useLayoutEffect = () => {};

import {
  ContentLayout,
  SpaceBetween,
  AppLayout,
  Box,
} from '@cloudscape-design/components';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  return (
    <AppLayout
      content={
        <ContentLayout
          header={
            <Box>
              <SpaceBetween size='xxs'>
                <Box variant='h1'>Order a pizza</Box>
                <Box variant='h2'>
                  Powered by Anthropic Claude 3 and Amazon Bedrock
                </Box>
                <Box variant='p'>
                  This example demonstrates how to use a complex tool schema
                  with Claude 3 Tool Use. To get started, tell the bot you'd
                  like to order a pizza.
                </Box>
              </SpaceBetween>
            </Box>
          }
        >
          <ChatBot />
        </ContentLayout>
      }
      navigationHide={true}
      toolsHide={true}
    />
  );
};

export default App;
