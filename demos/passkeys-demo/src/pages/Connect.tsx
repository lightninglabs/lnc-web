import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Page from '../components/Page';
import useLNC from '../hooks/useLNC';

const Connect: React.FC = () => {
  const { lnc, pair, auth } = useLNC();
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
          await pair(phrase, { method: 'password', password });

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
    [phrase, password, navigate, pair],
  );

  const handlePasskeyConnect = useCallback(() => {
    // wrap LNC calls into an async function
    const connectAsync = async () => {
      try {
        setLoading(true);
        setError('');
        if (!phrase) throw new Error('Enter a phrase');

        // connect to the litd node via LNC
        await pair(phrase, { method: 'passkey' });

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
  }, [phrase, navigate, pair]);

  return (
    <Page>
      <h2>Connect to Lightning Terminal</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-5" controlId="formBasicEmail">
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

        <Form.Group className="mb-4">
          <Form.Label as="p" className="fw-semibold mb-1">
            Choose a method to secure the connection credentials
          </Form.Label>
          <Form.Text className="text-muted">
            You can either use a passkey (recommended) or create a password.
          </Form.Text>
        </Form.Group>

        <Row className="mb-3">
          {auth.supportsPasskeys && (
            <Col md={6} className="mb-3">
              <div className="border rounded p-3 h-100">
                <h5 className="mb-2">Use a Passkey</h5>
                <p className="text-muted small">
                  Store your connection in a passkey managed by your browser or device. No
                  password to remember.
                </p>
                <Button
                  variant="primary"
                  type="button"
                  disabled={loading}
                  onClick={handlePasskeyConnect}
                >
                  🔑 Continue with Passkey
                </Button>
              </div>
            </Col>
          )}

          <Col md={6} className="mb-3">
            <div className="border rounded p-3 h-100">
              <h5 className="mb-2">Use a Password</h5>
              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Control
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Form.Text className="text-muted">
                  lnc-web stores connection data in localStorage. This password will be
                  used to encrypt the data at rest.
                </Form.Text>
              </Form.Group>
              <Button variant="primary" type="submit" disabled={loading}>
                Continue with Password
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Page>
  );
};

export default Connect;
