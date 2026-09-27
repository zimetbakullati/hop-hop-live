import { useEffect, useState } from 'react';
import VideoCard from '../components/VideoCard';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const { auth } = useAuth();

  useEffect(() => {
    apiRequest('/videos/feed')
      .then(setVideos)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section className="page">
      <h1>Video Feed</h1>
      {error && <p className="error">{error}</p>}
      <div className="video-feed">
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} token={auth.token} />
        ))}
      </div>
    </section>
  );
};

export default Home;
