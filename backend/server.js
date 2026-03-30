const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');
const multer = require('multer');
const pdf = require('pdf-parse');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const Message = require('./models/Message');
const Knowledge = require('./models/Knowledge');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection Protocol
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.warn("MONGODB_URI not found in .env. Prepare your Atlas cluster and update the signal.");
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Intelligence Database Synchronized (MongoDB)'))
    .catch(err => console.error('Database Signal Error:', err));
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
// Search knowledge base
const searchKnowledge = async (query) => {
  try {
    if (!query) return "";
    
    const results = await Knowledge.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(3);

    if (results.length === 0) return "";

    let knowledgeString = "\n\n[KNOWLEDGE BASE]\n";
    results.forEach((item, index) => {
      knowledgeString += `[${item.category}] ${item.title}: ${item.content}\n`;
    });
    knowledgeString += "[END KNOWLEDGE BASE]";
    
    return knowledgeString;
  } catch (err) {
    console.error('Knowledge Search Error:', err);
    return "";
  }
};

// Auto fetch news function (using GNews.io)
const fetchLatestNews = async (query) => {
  try {
    const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

    if (!GNEWS_API_KEY) {
      console.log('GNEWS_API_KEY missing!');
      return "";
    }

    // Clean query — simple keywords only
    const cleanQuery = (query || "")
      .replace(/[^a-zA-Z0-9 ]/g, '')  // special chars remove
      .trim()
      .split(' ')
      .slice(0, 3)                      // max 3 words
      .join(' ');

    console.log('Clean query:', cleanQuery);

    if (!cleanQuery) return "";

    // GNews API v4 URL
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(cleanQuery)}&apikey=${GNEWS_API_KEY}&lang=en&max=3&sortby=publishedAt`;

    const response = await fetch(url);
    const data = await response.json();

    console.log('GNews full response:', JSON.stringify(data).substring(0, 300));

    if (data.errors) {
      console.log('GNews API error:', data.errors);
      return "";
    }

    if (!data.articles || data.articles.length === 0) {
      console.log('No GNews articles found!');
      return "";
    }

    console.log('GNews articles count:', data.articles.length);

    let newsContext = "\n\n[LATEST NEWS]\n";
    data.articles.forEach(article => {
      newsContext += `Title: ${article.title}\n`;
      newsContext += `Summary: ${article.description}\n`;
      newsContext += `Source: ${article.source?.name || 'Unknown'}\n`;
      newsContext += `Published: ${article.publishedAt}\n---\n`;
    });
    newsContext += "[END LATEST NEWS]";

    console.log('GNews context ready!');
    return newsContext;

  } catch (err) {
    console.error('GNews Fetch Error:', err.message);
    return "";
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

    // Step 1 — Search MongoDB knowledge base
    const knowledgeContext = await searchKnowledge(message || "");
    
    // Step 2 — If knowledge empty, fetch news
    let newsContext = "";
    if (!knowledgeContext) {
      console.log('Knowledge empty — fetching latest news...');
      newsContext = await fetchLatestNews(message || "");
    }

    // Step 3 — Combine both contexts
    const fullContext = knowledgeContext || newsContext;

    if (fullContext) {
      console.log('Context injected:', knowledgeContext ? 'Knowledge Base' : 'News API');
    }

    const groqHistory = history.map(msg => ({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.text
    }));

    const SYSTEM_PROMPT = `You are a smart and helpful assistant.

STRICT RULES:
- Always respond in English only
- Stay professional at all times
- Answer clearly and concisely
- Use knowledge base as PRIMARY source of truth
- If knowledge base empty, use latest news context
- If both empty, use general knowledge
- Always mention source: "According to knowledge base..." or "According to latest news..."
- Never make up facts`;

    let messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...groqHistory
    ];

    if (imagePayload) {
      if (fullContext) {
        imagePayload.content[0].text += fullContext;
      }
      messages.push(imagePayload);
    } else {
      let finalContent = finalMessage;
      if (fullContext) {
        finalContent += fullContext;
      }
      messages.push({ role: "user", content: finalContent });
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
// --- KNOWLEDGE BASE ADMIN ENDPOINTS ---

// Add Knowledge
app.post('/admin/knowledge', async (req, res) => {
  try {
    const { category, title, content, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const entry = new Knowledge({ category, title, content, tags });
    await entry.save();
    res.status(201).json({ message: 'Knowledge entry secured', data: entry });
  } catch (err) {
    console.error('Admin Knowledge POST Error:', err);
    res.status(500).json({ error: 'Failed to save knowledge record' });
  }
});

// Get all Knowledge
app.get('/admin/knowledge', async (req, res) => {
  try {
    const entries = await Knowledge.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    console.error('Admin Knowledge GET Error:', err);
    res.status(500).json({ error: 'Failed to retrieve knowledge database' });
  }
});

// Delete Knowledge
app.delete('/admin/knowledge/:id', async (req, res) => {
  try {
    const result = await Knowledge.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Knowledge entry purged from system' });
  } catch (err) {
    console.error('Admin Knowledge DELETE Error:', err);
    res.status(500).json({ error: 'Failed to delete knowledge record' });
  }
});

// --- NEW: KNOWLEDGE BASE VALIDATOR ENDPOINT ---
app.post('/validate-entry', async (req, res) => {
  const { entry } = req.body;
  
  if (!entry) return res.status(400).json({ error: 'No entry provided for validation' });

  const VALIDATOR_PROMPT = `You are a knowledge base entry validator.

When given a knowledge entry, check:
- Category must be one of: IPL, AI News, Error Fix, General
- Title must be clear and descriptive
- Content must be accurate and relevant
- Tags must be meaningful keywords
- No offensive or irrelevant content allowed

Example valid entry:
{
  "category": "IPL",
  "title": "CSK won against MI",
  "content": "CSK beat MI by 5 wickets in IPL 2026 held in Chennai",
  "tags": ["CSK", "MI", "IPL2026"]
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