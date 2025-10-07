import React from 'react';
import {
  Navbar,
  MainContent,
  UserProfile,
  Footer,
} from './components/AdditionalComponents';
import IntercomComponent from './components/IntercomComponent';
import './App.css';

const App: React.FC = () => {
  return (
    <div className='App'>
      <Navbar />
      <div className='content-wrapper'>
        <MainContent />
        <UserProfile />
      </div>
      <Footer />
      <IntercomComponent />
    </div>
  );
};

export default App;
