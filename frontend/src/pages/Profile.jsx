import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { id } = useParams();
  const { auth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  const loadProfile = () => {
    apiRequest(`/users/${id}`)
      .then(setProfile)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const follow = async () => {
    if (!auth.token) return;
    await apiRequest(`/users/${id}/follow`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + auth.token }
    });
    loadProfile();
  };

  const unfollow = async () => {
    if (!auth.token) return;
    await apiRequest(`/users/${id}/unfollow`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + auth.token }
    });
    loadProfile();
  };

  if (error) return <p className="error">{error}</p>;
  if (!profile) return <p>Loading profile...</p>;

  return (
    <section className="page">
      <h1>@{profile.username}</h1>
      <p>{profile.bio || 'No bio yet.'}</p>
      <div className="profile-stats">
        <span>{profile.followers?.length || 0} followers</span>
        <span>{profile.following?.length || 0} following</span>
      </div>
      {auth.token && auth.user?.id !== id && (
        <div className="profile-actions">
          <button onClick={follow}>Follow</button>
          <button onClick={unfollow}>Unfollow</button>
        </div>
      )}
    </section>
  );
};

export default Profile;
