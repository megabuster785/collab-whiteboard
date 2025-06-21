import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RoomManagerPage() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('saved-rooms') || '[]');
    setRooms(stored);
  }, []);

  const handleCreateRoom = () => {
    let username = localStorage.getItem('canvas-username');

    // Ask for name if not already set
    if (!username) {
      username = prompt('Enter your name:') || `User-${Math.floor(Math.random() * 1000)}`;
      username = username.trim();
      localStorage.setItem('canvas-username', username);
    }

    const roomId = Math.random().toString(36).substring(2, 10);
    const roomData = {
      roomId,
      username,
      permission: 'owner',
      isPrivate: true,
      createdAt: new Date().toISOString(),
    };

    const updatedRooms = [...rooms, roomData];
    localStorage.setItem('saved-rooms', JSON.stringify(updatedRooms));
    setRooms(updatedRooms);

    navigate(`/room/${roomId}?username=${encodeURIComponent(username)}&creator=true`);
  };

  const handleDeleteRoom = (roomId) => {
    const updatedRooms = rooms.filter((room) => room.roomId !== roomId);
    localStorage.setItem('saved-rooms', JSON.stringify(updatedRooms));
    setRooms(updatedRooms);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Rooms</h1>
      <button
        onClick={handleCreateRoom}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
      >
        Create Room
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <div
            key={room.roomId}
            className="relative bg-white border border-gray-300 rounded-lg shadow p-4"
          >
            <button
              className="absolute top-2 right-2 text-red-600 bg-white rounded-full p-1 hover:text-red-800 z-50"
                onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room.roomId);
                        }}
              title="Delete Room"
            >
              <Trash2 size={24} className="cursor-pointer" />
            </button>

            <div
              onClick={() =>
                navigate(
                  `/room/${room.roomId}?username=${encodeURIComponent(room.username)}&creator=true`
                )
              }
              className="cursor-pointer"
            >
              <div className="text-lg font-semibold">Room ID: {room.roomId}</div>
              <div className="text-sm">Created by: {room.username}</div>
              <div className="text-sm">Permission: {room.permission}</div>
              <div className="text-sm">Privacy: {room.isPrivate ? 'Private' : 'Public'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
