import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import CanvasRoom from './pages/CanvasRoom';
import socket from './utils/socket';
import CreateRoomModal from './components/CreateRoomModal';
import { Toaster } from 'react-hot-toast';

function App() {
  const [showModal, setShowModal] = useState(false);
  const [savedRooms, setSavedRooms] = useState([]);
  const navigate = useNavigate();

  // Load saved rooms on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('saved-rooms') || '[]');
    setSavedRooms(stored);
  }, []);

  const handleCreate = ({ username, permission, isPrivate }) => {
    const roomId = uuidv4();
    const allowedUsers = isPrivate ? [{ username: username.trim(), permission }] : [];

    // Emit via socket
    socket.emit('create-room', {
      roomId,
      isPrivate,
      allowedUsers,
      creatorUsername: username
    });

    // Save room to localStorage
    const roomData = {
      roomId,
      username: username.trim(),
      permission,
      isPrivate,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedRooms, roomData];
    localStorage.setItem('saved-rooms', JSON.stringify(updated));
    setSavedRooms(updated);

    // Navigate to room
    navigate(`/room/${roomId}?username=${encodeURIComponent(username.trim())}&creator=true`);
  };

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen flex flex-col items-center bg-gray-100 text-center px-4 py-10">
              <h1 className="text-4xl font-bold mb-6 text-gray-800">Collaborative Whiteboard</h1>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow-md hover:bg-blue-700 transition"
              >
                Create New Room
              </button>

              {/* Show saved rooms */}
              {savedRooms.length > 0 && (
                <div className="mt-10 w-full max-w-2xl">
                  <h2 className="text-xl font-semibold mb-4 text-left">Saved Rooms</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedRooms.map((room) => (
                      <div
                        key={room.roomId}
                        onClick={() =>
                          navigate(
                            `/room/${room.roomId}?username=${encodeURIComponent(room.username)}&creator=true`
                          )
                        }
                        className="bg-white border rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition"
                      >
                        <div className="text-gray-900 font-medium">Room ID: {room.roomId}</div>
                        <div className="text-gray-600 text-sm">
                          {room.username} — {room.permission} {room.isPrivate ? '(Private)' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          }
        />
        <Route path="/room/:roomId" element={<CanvasRoom socket={socket} />} />
      </Routes>

      <CreateRoomModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />
    </>
  );
}

export default App;
