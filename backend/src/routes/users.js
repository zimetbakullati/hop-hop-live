const express = require('express');
const mongoose = require('mongoose');
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
  const session = await mongoose.startSession();
  let notificationPayload = null;
  try {
    if (req.user.userId === req.params.id) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    await session.withTransaction(async () => {
      const [currentUser, targetUser] = await Promise.all([
        User.findById(req.user.userId).session(session),
        User.findById(req.params.id).session(session)
      ]);

      if (!targetUser || !currentUser) {
        throw new Error('User not found');
      }

      const currentResult = await User.updateOne(
        { _id: currentUser._id },
        { $addToSet: { following: targetUser._id } },
        { session }
      );
      if (currentResult.modifiedCount === 0) {
        throw new Error('Already following user');
      }

      await User.updateOne({ _id: targetUser._id }, { $addToSet: { followers: currentUser._id } }, { session });

      notificationPayload = {
        toUserId: targetUser._id.toString(),
        type: 'follow',
        fromUserId: currentUser._id,
        message: `${currentUser.username} started following you`
      };
    });

    if (notificationPayload) {
      req.io.to(notificationPayload.toUserId).emit('notification', {
        type: notificationPayload.type,
        fromUserId: notificationPayload.fromUserId,
        message: notificationPayload.message
      });
    }

    res.json({ message: 'Followed user successfully' });
  } catch (error) {
    if (error.message === 'Already following user') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Follow action failed', error: error.message });
  } finally {
    await session.endSession();
  }
});

router.post('/:id/unfollow', auth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const [currentUser, targetUser] = await Promise.all([
        User.findById(req.user.userId).session(session),
        User.findById(req.params.id).session(session)
      ]);

      if (!targetUser || !currentUser) {
        throw new Error('User not found');
      }

      await Promise.all([
        User.updateOne({ _id: currentUser._id }, { $pull: { following: targetUser._id } }, { session }),
        User.updateOne({ _id: targetUser._id }, { $pull: { followers: currentUser._id } }, { session })
      ]).then(([currentUpdate]) => {
        if (currentUpdate.modifiedCount === 0) {
          throw new Error('You are not following this user');
        }
      });
    });

    res.json({ message: 'Unfollowed user successfully' });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'You are not following this user') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Unfollow action failed', error: error.message });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
