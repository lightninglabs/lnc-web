import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Page from '../components/Page';
import useLNC from '../hooks/useLNC';

const Login: React.FC = () => {
  const { lnc, login, auth } = useLNC();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // preload the WASM file when this component is mounted
    lnc.preload();
  }, [lnc]);

  // Automatic session login when session is available
  useEffect(() => {
    if (auth.hasActiveSession && !lnc.isConnected) {
      const autoConnect = async () => {
        try {
          setLoading(true);
          setError('');
          await login({ method: 'session' });
          navigate('/');
        } catch (err) {
          console.error('❌ Session auto-connect failed:', err);
          setError(`Session auto-connect failed: ${(err as Error).message}`);
        } finally {
          setLoading(false);
        }
      };
      autoConnect();
    }
  }, [auth.hasActiveSession, auth.isUnlocked, lnc.isConnected, login, navigate]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      // wrap LNC calls into an async function
      const connect = async () => {
        e.preventDefault();
        try {
          setLoading(true);
          setError('');
          if (!password) throw new Error('Enter a password');

          // connect to the litd node via LNC
          await login({ method: 'password', password });

          navigate('/');
        } catch (err) {
          setError((err as Error).message);
          // tslint:disable-next-line: no-console
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      connect();
    },
    [password, navigate, login],
  );

  const handlePasskeyLogin = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      await login({ method: 'passkey' });
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
      // tslint:disable-next-line: no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate, login]);

  const handleClear = useCallback(() => {
    lnc.clear({ persisted: true });
    navigate('/connect');
  }, [navigate, lnc]);

  return (
    <Page>
      <h2 className="mb-3">Connect to Lightning Terminal</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        {auth.supportsPasskeys && auth.hasPasskey ? (
          <Row>
            <Col>
              <Button
                variant="primary"
                type="button"
                disabled={loading}
                onClick={handlePasskeyLogin}
              >
                🔑 Login with Passkey
              </Button>
            </Col>
            <Col className="text-right">
              <Button
                variant="link"
                type="button"
                disabled={loading}
                onClick={handleClear}
              >
                Connect using a different pairing phrase
              </Button>
            </Col>
          </Row>
        ) : (
          <>
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Enter the password that was used when previously connecting with the
                pairing phrase
              </Form.Text>
            </Form.Group>
            <Row>
              <Col>
                <Button variant="primary" type="submit" disabled={loading}>
                  Login with Password
                </Button>
              </Col>
              <Col className="text-right">
                <Button
                  variant="link"
                  type="button"
                  disabled={loading}
                  onClick={handleClear}
                >
                  Connect using a different pairing phrase
                </Button>
              </Col>
            </Row>
          </>
        )}
      </Form>
    </Page>
  );
};

export default Login;
