import React from 'react';
import { Alert } from 'react-bootstrap';
import GetInfo from '../components/GetInfo';
import Page from '../components/Page';
import { useAutoConnect } from '../hooks/useAutoConnect';
import useLNC from '../hooks/useLNC';

const Home: React.FC = () => {
  const { lnc } = useLNC();
  const { loading, error } = useAutoConnect();

  return (
    <Page>
      <h2 className="text-center">Welcome to lnc-web</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <p className="text-center">
        {loading
          ? 'Connecting with existing session...'
          : lnc.isConnected
            ? 'You are now connected to your Lightning node.'
            : 'Connect or Login to view your Lightning node info.'}
      </p>
      <GetInfo />
    </Page>
  );
};

export default Home;
