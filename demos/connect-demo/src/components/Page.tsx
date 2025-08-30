import React, { useCallback } from 'react';
import { Button, Col, Container, Nav, Navbar, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useLNC from '../hooks/useLNC';
import logo from '../logo.svg';

interface Props {
  children?: React.ReactNode;
}

const Page: React.FC<Props> = ({ children }) => {
  const { auth, logout } = useLNC();

  const handleLogout = useCallback(async () => {
    await logout();
    window.location.reload();
  }, [logout]);

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-3">
        <Container>
          <Link to="/" className="navbar-brand">
            <img
              alt="logo"
              src={logo}
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{' '}
            LNC Demo
          </Link>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto">
              {auth.isUnlocked ? (
                <>
                  <Navbar.Text>Connected</Navbar.Text>
                  <a href="/">
                    <Button variant="link" onClick={handleLogout}>Logout</Button>
                  </a>
                </>
              ) : auth.hasStoredCredentials ? (
                <Link to="/login">
                  <Button>Login</Button>
                </Link>
              ) : (
                <Link to="/connect">
                  <Button>Connect</Button>
                </Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container>
        <Row>
          <Col>{children}</Col>
        </Row>
      </Container>
    </>
  );
};

export default Page;
