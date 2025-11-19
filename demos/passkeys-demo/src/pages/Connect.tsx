import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Page from '../components/Page';
import useLNC from '../hooks/useLNC';

const Connect: React.FC = () => {
  const { lnc, connect } = useLNC();
  const navigate = useNavigate();
  const [phrase, setPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // preload the WASM file when this component is mounted
    lnc.preload();
  }, [lnc]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      // wrap LNC calls into an async function
      const connectAsync = async () => {
        e.preventDefault();
        try {
          setLoading(true);
          setError('');
          if (!phrase || !password) throw new Error('Enter a phrase and password');

          // connect to the litd node via LNC
          await connect(phrase, password);

          navigate('/');
        } catch (err) {
          setError((err as Error).message);
          // tslint:disable-next-line: no-console
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      connectAsync();
    },
    [phrase, password, navigate, connect],
  );

  return (
    <Page>
      <h2>Connect to Lightning Terminal</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Pairing Phrase</Form.Label>
          <Form.Control
            autoComplete="off"
            value={phrase}
            onChange={e => setPhrase(e.target.value)}
            disabled={loading}
          />
          <Form.Text className="text-muted">
            Obtain a new pairing phrase from <code>litd</code> and enter it here
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Create Password</Form.Label>
          <Form.Control
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
          <Form.Text className="text-muted">
            lnc-web stores connection data in localStorage. This password will be used to
            encrypt the data at rest.
          </Form.Text>
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          Submit
        </Button>
      </Form>
    </Page>
  );
};

export default Connect;
