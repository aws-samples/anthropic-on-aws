import React from 'react';
import '@cloudscape-design/global-styles/index.css';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  AppLayout,
  Button,
} from '@cloudscape-design/components';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import ChatBot from './ChatBot';
import { signOut } from 'aws-amplify/auth';

const handleSignOut = async () => {
  try {
    await signOut();
  } catch (error) {
    console.log('Error signing out:', error);
  }
};

const App: React.FC = () => {
  return (
    <Authenticator>
      <AppLayout
        content={
          <ContentLayout
            header={
              <SpaceBetween size='m'>
                <Header
                  variant='h1'
                  actions={<Button onClick={handleSignOut}>Sign Out</Button>}
                >
                  Claude Tool ChatBot
                </Header>
              </SpaceBetween>
            }
          >
            <ChatBot />
          </ContentLayout>
        }
        navigationHide={true}
        toolsHide={true}
      />
    </Authenticator>
  );
};

export default App;
