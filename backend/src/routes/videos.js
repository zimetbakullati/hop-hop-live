const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const User = require('../models/User');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});

const upload = multer({ storage });

router.post('/', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const video = await Video.create({
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      videoUrl: `/uploads/${req.file.filename}`,
      userId: req.user.userId
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: 'Video upload failed', error: error.message });
  }
});

router.get('/feed', async (_req, res) => {
  try {
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'username')
      .populate({ path: 'comments', populate: { path: 'userId', select: 'username' } })
      .lean();

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feed', error: error.message });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const [video, user] = await Promise.all([
      Video.findById(req.params.id),
      User.findById(req.user.userId)
    ]);

    if (!video || !user) {
      return res.status(404).json({ message: 'Video or user not found' });
    }

    const existingLike = await Like.findOne({ userId: req.user.userId, videoId: video._id });
    const ownerId = video.userId.toString();

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      video.likes = video.likes.filter((id) => id.toString() !== req.user.userId);
      await video.save();
      return res.json({ liked: false, likesCount: video.likes.length });
    }

    await Like.create({ userId: req.user.userId, videoId: video._id });
    video.likes.push(req.user.userId);
    await video.save();

    req.io.to(ownerId).emit('notification', {
      type: 'like',
      fromUserId: req.user.userId,
      message: `${user.username} liked your video`
    });

    res.json({ liked: true, likesCount: video.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Like action failed', error: error.message });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const [video, user] = await Promise.all([
      Video.findById(req.params.id),
      User.findById(req.user.userId)
    ]);

    if (!video || !user) {
      return res.status(404).json({ message: 'Video or user not found' });
    }

    const comment = await Comment.create({
      text,
      userId: req.user.userId,
      videoId: video._id
    });

    video.comments.push(comment._id);
    await video.save();

    req.io.to(video.userId.toString()).emit('notification', {
      type: 'comment',
      fromUserId: req.user.userId,
      message: `${user.username} commented on your video`
    });

    const populatedComment = await comment.populate('userId', 'username');
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Comment failed', error: error.message });
  }
});

module.exports = router;
