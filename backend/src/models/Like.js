const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true }
  },
  { timestamps: true }
);

LikeSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('Like', LikeSchema);
