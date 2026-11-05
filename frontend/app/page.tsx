'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type Chat = { _id: string; title: string; updatedAt: string };
type Message = { _id?: string; id?: string; role: 'user' | 'bot'; text: string; timestamp?: string };

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function HomePage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadChats = useCallback(async (preferredId?: string) => {
    const response = await fetch(`${API}/chats`);
    if (!response.ok) throw new Error('Could not load conversations');
    const items: Chat[] = await response.json();
    setChats(items);
    const nextId = preferredId || activeChatId || items[0]?._id;
    if (nextId && items.some(item => item._id === nextId)) setActiveChatId(nextId);
    else if (!items.length) {
      const created = await fetch(`${API}/chats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New chat' }) });
      if (!created.ok) throw new Error('Could not create your first conversation');
      const chat: Chat = await created.json();
      setChats([chat]);
      setActiveChatId(chat._id);
    }
  }, [activeChatId]);

  useEffect(() => { loadChats().catch(err => setError(err.message)); }, [loadChats]);

  useEffect(() => {
    if (!activeChatId) return;
    fetch(`${API}/chats/${activeChatId}/messages`)
      .then(response => { if (!response.ok) throw new Error('Could not load messages'); return response.json(); })
      .then(setMessages)
      .catch(err => setError(err.message));
  }, [activeChatId]);

  async function createChat() {
    const response = await fetch(`${API}/chats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New chat' }) });
    if (!response.ok) throw new Error('Could not create conversation');
    const chat: Chat = await response.json();
    setChats(current => [chat, ...current]);
    setActiveChatId(chat._id);
    setMessages([]);
    setInput('');
  }

  async function renameChat(chat: Chat) {
    const title = window.prompt('Rename conversation', chat.title);
    if (!title?.trim()) return;
    const response = await fetch(`${API}/chats/${chat._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim() }) });
    if (!response.ok) { setError('Could not rename conversation'); return; }
    const updated = await response.json();
    setChats(current => current.map(item => item._id === updated._id ? updated : item));
  }

  async function deleteChat(chat: Chat) {
    if (!window.confirm(`Delete “${chat.title}” and its messages?`)) return;
    const response = await fetch(`${API}/chats/${chat._id}`, { method: 'DELETE' });
    if (!response.ok) { setError('Could not delete conversation'); return; }
    const remaining = chats.filter(item => item._id !== chat._id);
    setChats(remaining);
    if (activeChatId === chat._id) {
      setMessages([]);
      if (remaining[0]) setActiveChatId(remaining[0]._id);
      else { setActiveChatId(''); await createChat(); }
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || !activeChatId || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(current => [...current, { id: crypto.randomUUID(), role: 'user', text }]);
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('message', text);
      body.append('chatId', activeChatId);
      const response = await fetch(`${API}/chat`, { method: 'POST', body });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Assistant request failed');
      }
      const answer: Message = await response.json();
      setMessages(current => [...current, answer]);
      await loadChats(activeChatId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLoading(false); }
  }

  const activeChat = chats.find(chat => chat._id === activeChatId);

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">C</span><div><strong>Cortex</strong><small>AI workspace</small></div></div>
        <button className="new-chat" onClick={() => createChat().catch(err => setError(err.message))}>＋ <span>New chat</span></button>
        <div className="sidebar-label">YOUR CONVERSATIONS</div>
        <nav className="chat-list">
          {chats.map(chat => <div className={`chat-row ${chat._id === activeChatId ? 'active' : ''}`} key={chat._id}>
            <button className="chat-select" onClick={() => setActiveChatId(chat._id)} title={chat.title}>{chat.title}</button>
            <div className="chat-actions"><button aria-label={`Rename ${chat.title}`} onClick={() => renameChat(chat)}>···</button><button aria-label={`Delete ${chat.title}`} onClick={() => deleteChat(chat)}>×</button></div>
          </div>)}
        </nav>
        <div className="sidebar-footer">Private workspace · Local API</div>
      </aside>
      <section className="workspace">
        <header className="topbar"><div><span className="eyebrow">WORKSPACE / CHAT</span><h1>{activeChat?.title || 'Cortex Assistant'}</h1></div><span className="status"><i /> GROQ CONNECTED VIA API</span></header>
        <div className="conversation">
          {messages.length === 0 && <div className="welcome"><div className="orb">✳</div><p className="eyebrow">YOUR AI WORKSPACE</p><h2>What are we thinking<br/>about today?</h2><p>Start a conversation. Your chats are saved separately and stay in your history.</p></div>}
          {messages.map((message, index) => <article className={`message ${message.role}`} key={message._id || message.id || index}><div className="avatar">{message.role === 'user' ? 'Y' : 'C'}</div><div><div className="message-author">{message.role === 'user' ? 'You' : 'Cortex'}</div><p>{message.text}</p></div></article>)}
          {loading && <div className="thinking">Cortex is thinking<span>···</span></div>}
        </div>
        {error && <div className="error-banner">{error}</div>}
        <form className="composer" onSubmit={sendMessage}><textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(event as unknown as FormEvent); } }} placeholder="Message Cortex…" rows={1}/><button disabled={loading || !input.trim()} aria-label="Send message">↑</button><small>ENTER TO SEND · SHIFT + ENTER FOR NEW LINE</small></form>
      </section>
    </main>
  );
}
