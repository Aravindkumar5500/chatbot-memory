const mongoose = require('mongoose');

const KnowledgeSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['IPL', 'AI News', 'Error Fix', 'General'],
    default: 'General'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add text index for search
KnowledgeSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    content: 5,
    tags: 2
  },
  name: "KnowledgeTextIndex"
});

module.exports = mongoose.model('Knowledge', KnowledgeSchema);
