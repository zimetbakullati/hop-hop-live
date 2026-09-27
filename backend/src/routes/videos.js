const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const auth = require('../middleware/auth');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const User = require('../models/User');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '-');
    const extension = path.extname(safeName);
    cb(null, `${Date.now()}-${randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Only video files are allowed'));
    }
    cb(null, true);
  }
});

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
    if (error.message === 'Only video files are allowed') {
      return res.status(400).json({ message: error.message });
    }
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
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const [video, user] = await Promise.all([
        Video.findById(req.params.id).session(session),
        User.findById(req.user.userId).session(session)
      ]);

      if (!video || !user) {
        throw new Error('Video or user not found');
      }

      const existingLike = await Like.findOne({ userId: req.user.userId, videoId: video._id }).session(session);
      if (existingLike) {
        await Promise.all([
          Like.deleteOne({ _id: existingLike._id }, { session }),
          Video.updateOne({ _id: video._id }, { $pull: { likes: user._id } }, { session })
        ]);
        const updated = await Video.findById(video._id).session(session);
        return { liked: false, likesCount: updated.likes.length, videoOwnerId: video.userId.toString() };
      }

      await Promise.all([
        Like.create([{ userId: req.user.userId, videoId: video._id }], { session }),
        Video.updateOne({ _id: video._id }, { $addToSet: { likes: user._id } }, { session })
      ]);
      const updated = await Video.findById(video._id).session(session);
      return {
        liked: true,
        likesCount: updated.likes.length,
        videoOwnerId: video.userId.toString(),
        actorId: user._id,
        actorUsername: user.username
      };
    });

    if (result.liked && result.actorId.toString() !== result.videoOwnerId) {
      req.io.to(result.videoOwnerId).emit('notification', {
        type: 'like',
        fromUserId: result.actorId,
        message: `${result.actorUsername} liked your video`
      });
    }

    res.json({ liked: result.liked, likesCount: result.likesCount });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Like already exists' });
    }
    if (error.message === 'Video or user not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Like action failed', error: error.message });
  } finally {
    await session.endSession();
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

    await Video.updateOne({ _id: video._id }, { $push: { comments: comment._id } });

    if (video.userId.toString() !== req.user.userId) {
      req.io.to(video.userId.toString()).emit('notification', {
        type: 'comment',
        fromUserId: req.user.userId,
        message: `${user.username} commented on your video`
      });
    }

    const populatedComment = await comment.populate('userId', 'username');
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Comment failed', error: error.message });
  }
});

module.exports = router;
