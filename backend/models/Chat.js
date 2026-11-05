const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
    default: 'New chat'
  }
}, { timestamps: true });

ChatSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);
