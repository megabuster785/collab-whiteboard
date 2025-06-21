import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CanvasRoom from './pages/CanvasRoom';
import RoomManagerPage from './pages/RoomManagerPage'; 
import socket from './utils/socket';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<Navigate to="/rooms" />} />
        <Route path="/rooms" element={<RoomManagerPage />} />
        <Route path="/room/:roomId" element={<CanvasRoom socket={socket} />} />
      </Routes>
    </>
  );
}

export default App;
