import { useState } from 'react';

export default function CreateRoomModal({ onCreate, onCancel }) {
  const [username, setUsername] = useState('');
  const [permission, setPermission] = useState('view');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    onCreate({ username, permission, isPrivate });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow space-y-4 max-w-md"
    >
      <h2 className="text-2xl font-bold text-gray-800">Create a New Room</h2>

      <input
        type="text"
        placeholder="Your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      <select
        value={permission}
        onChange={(e) => setPermission(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="edit">Editor</option>
        <option value="view">Viewer</option>
      </select>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
        />
        <span>Private Room</span>
      </label>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-300 text-black rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
