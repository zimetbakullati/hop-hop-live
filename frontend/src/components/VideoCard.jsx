import { useState } from 'react';
import { apiRequest, ASSET_BASE_URL } from '../api';

const VideoCard = ({ video, token }) => {
  const [commentText, setCommentText] = useState('');
  const [likesCount, setLikesCount] = useState(video.likes?.length || 0);
  const [comments, setComments] = useState(video.comments || []);

  const handleLike = async () => {
    if (!token) return;
    const result = await apiRequest(`/videos/${video._id}/like`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token }
    });
    setLikesCount(result.likesCount);
  };

  const handleComment = async (event) => {
    event.preventDefault();
    if (!token || !commentText.trim()) return;
    const newComment = await apiRequest(`/videos/${video._id}/comments`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: JSON.stringify({ text: commentText })
    });
    setComments((prev) => [...prev, newComment]);
    setCommentText('');
  };

  return (
    <article className="video-card">
      <h3>{video.title}</h3>
      <p>{video.description}</p>
      <p className="meta">By @{video.userId?.username || 'unknown'}</p>
      <video controls src={`${ASSET_BASE_URL}${video.videoUrl}`} />
      <div className="actions">
        <button onClick={handleLike} disabled={!token}>
          ❤️ {likesCount}
        </button>
      </div>
      <ul className="comments">
        {comments.map((comment) => (
          <li key={comment._id}>
            <strong>@{comment.userId?.username || 'user'}:</strong> {comment.text}
          </li>
        ))}
      </ul>
      <form onSubmit={handleComment}>
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment"
          disabled={!token}
        />
        <button type="submit" disabled={!token}>
          Comment
        </button>
      </form>
    </article>
  );
};

export default VideoCard;
