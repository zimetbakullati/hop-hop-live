import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';

const Live = () => {
  const { auth } = useAuth();
  const [liveSessions, setLiveSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState('My Live Session');

  const socket = useMemo(
    () => io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', { autoConnect: true }),
    []
  );

  useEffect(() => {
    apiRequest('/live').then(setLiveSessions).catch(() => undefined);

    socket.on('connect', () => {
      if (auth.user?.id) {
        socket.emit('join:user', auth.user.id);
      }
    });

    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
    });

    socket.on('live:started', (session) => {
      setLiveSessions((prev) => [session, ...prev]);
    });

    socket.on('live:ended', ({ roomId }) => {
      setLiveSessions((prev) => prev.filter((session) => session.roomId !== roomId));
    });

    return () => {
      socket.disconnect();
    };
  }, [socket, auth.user?.id]);

  const startLive = async () => {
    if (!auth.token) return;
    await apiRequest('/live/start', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + auth.token },
      body: JSON.stringify({ title })
    });
  };

  const endLive = async (roomId) => {
    if (!auth.token) return;
    await apiRequest(`/live/${roomId}/end`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + auth.token }
    });
  };

  return (
    <section className="page">
      <h1>Live Streaming</h1>
      <p>This starter stream module uses Socket.io rooms and live session events.</p>
      <div className="live-controls">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Live title" />
        <button onClick={startLive} disabled={!auth.token}>
          Go Live
        </button>
      </div>
      <h2>Active sessions</h2>
      <ul>
        {liveSessions.map((session) => (
          <li key={session.roomId}>
            {session.title} ({session.roomId})
            {auth.user?.id === session.hostId && <button onClick={() => endLive(session.roomId)}>End</button>}
          </li>
        ))}
      </ul>

      <h2>Realtime notifications</h2>
      <ul>
        {notifications.map((notification, index) => (
          <li key={`${notification.type}-${index}`}>{notification.message}</li>
        ))}
      </ul>
    </section>
  );
};

export default Live;
