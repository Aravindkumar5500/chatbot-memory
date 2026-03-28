const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');
const multer = require('multer');
const pdf = require('pdf-parse');
const mongoose = require('mongoose');
const Message = require('./models/Message');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection Protocol
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.warn("⚠️ MONGODB_URI not found in .env. Prepare your Atlas cluster and update the signal.");
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Intelligence Database Synchronized (MongoDB)'))
    .catch(err => console.error('❌ Database Signal Error:', err));
}

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Cortex V1.2 Backend Active' });
});

// Function to read history from MongoDB
const getHistory = async () => {
  try {
    return await Message.find().sort({ timestamp: 1 });
  } catch (err) {
    console.error('Error reading signal history:', err);
    return [];
  }
};

// Function to save message to MongoDB
const saveMessage = async (role, text) => {
  try {
    const newMessage = new Message({ role, text });
    await newMessage.save();
    return newMessage;
  } catch (err) {
    console.error('Error saving signal to archive:', err);
  }
};

// Get history
app.get('/history', async (req, res) => {
  const history = await getHistory();
  res.json(history);
});

// Clear history
app.delete('/history', async (req, res) => {
  try {
    await Message.deleteMany({});
    res.json({ message: 'Intelligence Archive Cleared!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to wipe archive' });
  }
});

// Chat endpoint
app.post('/chat', upload.single('file'), async (req, res) => {
  console.log('POST /chat hit');
  const { message } = req.body;
  const file = req.file;
  let finalMessage = message || "";
  let imagePayload = null;

  try {
    if (file) {
      console.log(`Processing file: ${file.originalname} (${file.mimetype})`);
      if (file.mimetype === 'application/pdf') {
        const data = await pdf(file.buffer);
        finalMessage += `\n\n[Context from attached PDF: ${data.text.substring(0, 3000)}...]`;
      } else if (file.mimetype.startsWith('image/')) {
        const base64Image = file.buffer.toString('base64');
        imagePayload = {
          role: "user",
          content: [
            { type: "text", text: finalMessage || "Analyze this image." },
            {
              type: "image_url",
              image_url: { url: `data:${file.mimetype};base64,${base64Image}` }
            }
          ]
        };
      } else {
        finalMessage += `\n\n[Context from file: ${file.buffer.toString('utf-8').substring(0, 2000)}...]`;
      }
    }

    if (!finalMessage && !imagePayload) {
      return res.status(400).json({ error: 'No message or file provided' });
    }

    const history = await getHistory();
    console.log(`History count: ${history.length}`);

    const groqHistory = history.map(msg => ({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.text
    }));

    const SYSTEM_PROMPT = `You are a smart and helpful assistant specialized in software development and AI technology.

STRICT RULES:
- Always respond in English only
- Stay professional at all times
- Answer clearly and concisely
- When asked about MCP, refer to Model Context Protocol by default
- Use knowledge base as primary source of truth
- If not found, use general knowledge
- Never make up facts`;

    let messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...groqHistory
    ];

    if (imagePayload) {
      messages.push(imagePayload);
    } else {
      messages.push({ role: "user", content: finalMessage });
    }

    console.log(`Sending to Groq with model: ${imagePayload ? "Vision" : "Text"}`);
    
    // Save user message in our local history before the await call
    const displayMsg = finalMessage || (file ? `Sent a file: ${file.originalname}` : "");
    await saveMessage('user', displayMsg);

    const response = await client.chat.completions.create({
      model: imagePayload ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
      messages: messages,
    });

    console.log("Groq response received!");
    const aiText = response.choices[0].message.content;
    const botMsg = await saveMessage('bot', aiText);
    res.json(botMsg);

  } catch (error) {
    console.error('FULL CHAT ERROR:', error);
    res.status(500).json({ error: 'Failed to get response', details: error.message });
  }
});

// --- NEW: KNOWLEDGE BASE VALIDATOR ENDPOINT ---
app.post('/validate-entry', async (req, res) => {
  const { entry } = req.body;
  
  if (!entry) return res.status(400).json({ error: 'No entry provided for validation' });

  const VALIDATOR_PROMPT = `You are a knowledge base entry validator.

When given a knowledge entry, strictly check:
- Category must be one of: IPL, AI News, Error Fix, General
- Title must be short and clear (max 100 characters)
- Content must be detailed, accurate and minimum 20 words
- Tags must be relevant keywords (minimum 2 tags)
- No offensive or irrelevant content allowed

Example valid entry:
{
  "category": "IPL",
  "title": "CSK won against MI",
  "content": "CSK beat MI by 5 wickets in match 23 of IPL 2025 held in Chennai",
  "tags": ["CSK", "MI", "IPL2025", "Chennai"]
}

Return JSON only, no extra text:
{
  "valid": true or false,
  "reason": "why valid or invalid",
  "suggested_tags": ["tag1", "tag2"],
  "improved_title": "better title if needed",
  "summary": "one line summary of the content"
}`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: VALIDATOR_PROMPT },
        { role: "user", content: JSON.stringify(entry) }
      ],
      response_format: { type: "json_object" } // STRICT JSON output
    });

    res.json(JSON.parse(response.choices[0].message.content));
  } catch (error) {
    console.error('Validation Error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Chatbot backend is running on http://localhost:${PORT}`);
});

module.exports = app; // Export for testing