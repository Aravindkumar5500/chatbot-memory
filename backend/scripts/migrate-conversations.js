const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Message = require('../models/Message');
const Chat = require('../models/Chat');

async function migrate() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);

  const legacyMessages = await Message.find({ chatId: null }).sort({ timestamp: 1 });
  if (!legacyMessages.length) {
    console.log('No legacy messages to migrate.');
    return;
  }

  const chat = await Chat.create({
    title: 'Imported conversation',
    createdAt: legacyMessages[0].timestamp || new Date(),
    updatedAt: legacyMessages[legacyMessages.length - 1].timestamp || new Date()
  });
  const result = await Message.updateMany(
    { _id: { $in: legacyMessages.map(message => message._id) }, chatId: null },
    { $set: { chatId: chat._id } }
  );
  console.log(`Migrated ${result.modifiedCount} messages into conversation ${chat._id}`);
}

migrate()
  .catch(error => { console.error('Conversation migration failed:', error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
