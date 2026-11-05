const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    index: true,
    default: null
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'bot']
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

MessageSchema.index({ chatId: 1, timestamp: 1 });

module.exports = mongoose.model('Message', MessageSchema);
