# Chatbot Memory — Conversational AI with Persistent Context

A full-stack conversational assistant prototype with persistent chat history, a searchable knowledge base, file-aware prompts, and an optional Model Context Protocol (MCP) interface.

## Features in the current codebase

- **Conversational chat UI** built with Next.js App Router and React. The previous Vite UI remains in `frontend/src` while feature parity is migrated.
- **Persistent conversation history** stored through MongoDB models in the Express API.
- **Knowledge-base retrieval** using MongoDB text search across titles, content, and tags.
- **LLM responses** powered by the Groq SDK. Text prompts use the configured chat model; image uploads use the configured vision model.
- **File context** for PDF, image, and text-file uploads through the chat endpoint.
- **News fallback** through GNews when no knowledge-base match is found and a GNews API key is configured.
- **Speech input** using the browser's Web Speech API when supported by the browser.
- **Knowledge administration endpoints** for creating, listing, deleting, and validating entries.
- **MCP server** exposing `chat`, `get_history`, and `clear_memory` tools through stdio. This server uses a local JSON memory file, separate from the MongoDB-backed Express history.

## Architecture

```text
frontend (Next.js + React)
        |
        | HTTP / multipart form data
        v
backend (Express)
   |        |            |
   |        |            +--> GNews API (fallback)
   |        +--> Groq LLM / vision
   +--> MongoDB
        |-- Message history
        +-- Knowledge base (text index)

MCP stdio server --> Groq + local memory.json
```

## Tech stack

- **Frontend:** Next.js 15, React 18, TypeScript, CSS. Legacy Vite dependencies remain temporarily during migration.
- **Backend:** Node.js, Express, Multer
- **Database:** MongoDB + Mongoose
- **AI:** Groq SDK
- **Tool interface:** Model Context Protocol SDK
- **Additional services:** GNews API, browser speech recognition, PDF parsing

## Run locally

Requirements: Node.js 18.18+ (20 LTS recommended), npm, and a MongoDB database. The frontend is being migrated from Vite to Next.js; the legacy `frontend/src` implementation is retained during this transition.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in the local `.env` file:

```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
GNEWS_API_KEY=your_gnews_api_key
```

Start the API:

```bash
npm run dev
```

### 2. Frontend

In another terminal:

```bash
cd frontend
npm install
# Optional: set NEXT_PUBLIC_API_URL=http://localhost:3001 in .env.local
npm run dev
```

Open `http://localhost:3000`. The Next.js workspace uses the conversation API at `http://localhost:3001` by default. Start MongoDB and the backend before sending messages.

### 3. Migrate existing messages (run once)

After configuring `backend/.env` and starting MongoDB, run:

```bash
cd backend
npm run migrate
```

This groups previously unassigned messages into one `Imported conversation`. New messages are stored against a conversation ID.

### 4. MCP server (optional)

With the backend dependencies installed and `backend/.env` configured:

```bash
cd backend
npm run mcp
```

The MCP server communicates over stdio and provides `chat`, `get_history`, and `clear_memory` tools.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/` | Backend health response |
| GET | `/chats` | List conversations |
| POST | `/chats` | Create a conversation |
| GET | `/chats/:chatId/messages` | Read messages in a conversation |
| PATCH | `/chats/:chatId` | Rename a conversation |
| DELETE | `/chats/:chatId` | Delete a conversation and its messages |
| GET | `/history` | Read legacy global history |
| DELETE | `/history` | Clear MongoDB conversation history |
| POST | `/chat` | Send a message (requires `chatId`; optionally accepts a file) |
| POST | `/admin/knowledge` | Add a knowledge entry |
| GET | `/admin/knowledge` | List knowledge entries |
| DELETE | `/admin/knowledge/:id` | Delete a knowledge entry |
| POST | `/validate-entry` | Validate and improve a knowledge entry with the LLM |

## Security and prototype limitations

This is a learning project and should be run locally or behind suitable access controls. Before exposing it publicly:

- Add authentication and authorization to all knowledge administration routes.
- Restrict CORS to trusted frontend origins.
- Add upload size/type limits and validate uploaded files.
- Add rate limiting, request validation, and robust error handling.
- Protect user-specific conversation history; the current history endpoints are not multi-user isolated.
- Store API keys only in local environment variables or a secrets manager. Never commit `.env`.
- Review model availability and provider limits before deployment.

No claim is made that this prototype is production-ready.

## Repository structure

```text
backend/
  models/          MongoDB message and knowledge schemas
  server.js        Express chat API
  mcp_server.js    MCP stdio server
  server.test.js   Backend tests
frontend/
  src/components/  Chat input, message list, sidebar, and header
  src/App.jsx      Main chat experience
```

