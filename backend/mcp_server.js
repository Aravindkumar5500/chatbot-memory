#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const fs = require('fs');
const Groq = require('groq-sdk');

// Configuration
const MEMORY_FILE = path.join(__dirname, 'memory.json');
if (!fs.existsSync(MEMORY_FILE)) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify([]));
}

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Functions copied from server.js logic
const getHistory = () => {
  try {
    const data = fs.readFileSync(MEMORY_FILE);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const saveMessage = (role, text) => {
  try {
    const history = getHistory();
    const newMessage = {
      id: Date.now(),
      role,
      text,
      timestamp: new Date().toISOString()
    };
    history.push(newMessage);
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(history, null, 2));
    return newMessage;
  } catch (err) {}
};

const formatForGroq = (history) => {
  return history.map(msg => ({
    role: msg.role === 'bot' ? 'assistant' : 'user',
    content: msg.text
  }));
};

// Create the MCP Server
const server = new Server(
  {
    name: "chatbot-memory-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "chat",
        description: "Sends a message to the memory-aware AI chatbot and receives an intelligent response.",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The message to send.",
            },
          },
          required: ["message"],
        },
      },
      {
        name: "get_history",
        description: "Retrieves the full conversation history.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "clear_memory",
        description: "Resets the conversation history.",
        inputSchema: { type: "object", properties: {} },
      }
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "chat") {
      const { message } = args;
      
      // Save user message
      saveMessage('user', message);

      // Prepare AI context
      const history = getHistory();
      const groqMessages = formatForGroq(history);

      const messages = [
        {
          role: "system",
          content: "You are a smart and friendly Q&A assistant. Answer concisely, refer back to previous conversation if asked, and never make up facts."
        },
        ...groqMessages
      ];

      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages
      });

      const aiResponse = response.choices[0].message.content;

      // Save bot response
      saveMessage('bot', aiResponse);

      return {
        content: [{ type: "text", text: aiResponse }],
      };
    }

    if (name === "get_history") {
      const history = getHistory();
      return {
        content: [{ type: "text", text: JSON.stringify(history, null, 2) }],
      };
    }

    if (name === "clear_memory") {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify([]));
      return {
        content: [{ type: "text", text: "Memory cleared successfully." }],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Chatbot MCP server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in runServer:", error);
  process.exit(1);
});
