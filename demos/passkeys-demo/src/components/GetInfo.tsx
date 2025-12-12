import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import useLNC from '../hooks/useLNC';

const GetInfo: React.FC = () => {
  const { lnc } = useLNC();
  const [info, setInfo] = useState<any>();

  useEffect(() => {
    if (lnc.isConnected) {
      const sendRequest = async () => {
        const res = await lnc.lnd.lightning.getInfo();
        setInfo(res);
      };
      sendRequest();
    }
  }, [lnc.isConnected, lnc.lnd.lightning]);

  if (!lnc.isConnected || !info) return null;

  return (
    <>
      <h4 className="mt-5">GetInfo Response</h4>
      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>Info</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Alias</td>
            <td>{info.alias}</td>
          </tr>
          <tr>
            <td>Pubkey</td>
            <td>{info.identityPubkey}</td>
          </tr>
          <tr>
            <td>Version</td>
            <td>{info.version}</td>
          </tr>
          <tr>
            <td>Pending Channels</td>
            <td>{info.numPendingChannels}</td>
          </tr>
          <tr>
            <td>Active Channels</td>
            <td>{info.numActiveChannels}</td>
          </tr>
          <tr>
            <td>Inactive Channels</td>
            <td>{info.numInactiveChannels}</td>
          </tr>
          <tr>
            <td>Peers</td>
            <td>{info.numPeers}</td>
          </tr>
          <tr>
            <td>Block Height</td>
            <td>{info.blockHeight}</td>
          </tr>
          <tr>
            <td>Synced to Chain</td>
            <td>{info.syncedToChain.toString()}</td>
          </tr>
          <tr>
            <td>Synced to Graph</td>
            <td>{info.syncedToGraph.toString()}</td>
          </tr>
        </tbody>
      </Table>
    </>
  );
};

export default GetInfo;
