import { useState } from 'react';
import { uploadVideo } from '../api';
import { useAuth } from '../context/AuthContext';

const Upload = () => {
  const { auth } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!auth.token || !videoFile) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', videoFile);

    try {
      await uploadVideo(auth.token, formData);
      setMessage('Video uploaded successfully');
      setTitle('');
      setDescription('');
      setVideoFile(null);
      event.target.reset();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="page">
      <h1>Upload Video</h1>
      {!auth.token && <p className="error">Please log in first.</p>}
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} required />
        <button type="submit" disabled={!auth.token}>
          Upload
        </button>
      </form>
    </section>
  );
};

export default Upload;
