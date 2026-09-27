const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.user.userId === req.params.id) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user.userId),
      User.findById(req.params.id)
    ]);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.some((id) => id.toString() === req.params.id);
    if (isFollowing) {
      return res.status(400).json({ message: 'Already following user' });
    }

    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);
    await Promise.all([currentUser.save(), targetUser.save()]);

    req.io.to(targetUser._id.toString()).emit('notification', {
      type: 'follow',
      fromUserId: currentUser._id,
      message: `${currentUser.username} started following you`
    });

    res.json({ message: 'Followed user successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Follow action failed', error: error.message });
  }
});

router.post('/:id/unfollow', auth, async (req, res) => {
  try {
    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user.userId),
      User.findById(req.params.id)
    ]);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter((id) => id.toString() !== req.params.id);
    targetUser.followers = targetUser.followers.filter((id) => id.toString() !== req.user.userId);
    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({ message: 'Unfollowed user successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unfollow action failed', error: error.message });
  }
});

module.exports = router;
