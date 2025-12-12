import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Page from '../components/Page';
import useLNC from '../hooks/useLNC';

const Login: React.FC = () => {
  const { lnc, login } = useLNC();
  const navigate = useNavigate();
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
      const connect = async () => {
        e.preventDefault();
        try {
          setLoading(true);
          setError('');
          if (!password) throw new Error('Enter a password');

          // connect to the litd node via LNC
          await login(password);

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

  const handleClear = useCallback(() => {
    lnc.credentials.clear();
    navigate('/connect');
  }, [navigate, lnc]);

  return (
    <Page>
      <h2>Connect to Lightning Terminal</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
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
            Enter the password that was used when previously connecting with the pairing
            phrase
          </Form.Text>
        </Form.Group>
        <Row>
          <Col>
            <Button variant="primary" type="submit" disabled={loading}>
              Submit
            </Button>
          </Col>
          <Col className="text-right">
            <Button variant="link" type="button" disabled={loading} onClick={handleClear}>
              Connect using a different pairing phrase
            </Button>
          </Col>
        </Row>
      </Form>
    </Page>
  );
};

export default Login;
