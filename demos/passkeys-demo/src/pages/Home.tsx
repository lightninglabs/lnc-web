import React from 'react';
import GetInfo from '../components/GetInfo';
import Page from '../components/Page';
import useLNC from '../hooks/useLNC';

const Home: React.FC = () => {
  const { lnc } = useLNC();

  return (
    <Page>
      <h2 className="text-center">Welcome to lnc-web</h2>
      <p className="text-center">
        {lnc.isConnected
          ? 'You are now connected to your Lightning node.'
          : 'Connect or Login to view your Lightning node info.'}
      </p>
      <GetInfo />
    </Page>
  );
};

export default Home;
