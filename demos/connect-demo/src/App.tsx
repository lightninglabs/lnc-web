import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Connect from './pages/Connect';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />
          <Route path="connect" element={<Connect />} />
          <Route path="login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
