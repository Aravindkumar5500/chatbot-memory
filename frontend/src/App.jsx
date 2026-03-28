import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, User } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import Custom Components
import Header from './components/Header';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';

const API_CONFIG = {
  baseURL: 'http://localhost:3001',
};

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isTyping]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}/history`);
      setMessages(response.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleReload = async (msg) => {
    let textToReload = msg.text;
    
    // If it's a bot message, we actually want to reload the user's PREVIOUS message
    if (msg.role === 'bot') {
      const msgIndex = messages.findIndex(m => m.id === msg.id);
      if (msgIndex > 0 && messages[msgIndex - 1].role === 'user') {
        textToReload = messages[msgIndex - 1].text;
      }
    }
    
    setInput(textToReload);
    setTimeout(() => {
      handleSend(new Event('submit'));
    }, 10);
  };

  const handleClear = async () => {
    if (window.confirm('Delete all messages? This cannot be undone.')) {
      try {
        await axios.delete(`${API_CONFIG.baseURL}/history`);
        setMessages([]);
      } catch (err) {
        console.error('Clear error:', err);
      }
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    const userMsgText = selectedFile ? `${input} (File: ${selectedFile.name})`.trim() : input.trim();
    const userMsg = { id: Date.now(), role: 'user', text: userMsgText, timestamp: new Date().toISOString() };
    
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentFile = selectedFile;
    
    setInput('');
    setSelectedFile(null);
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('message', currentInput);
      if (currentFile) formData.append('file', currentFile);

      const response = await axios.post(`${API_CONFIG.baseURL}/chat`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: "Server error.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => setInput(prev => (prev + ' ' + event.results[0][0].transcript).trim());
    recognition.start();
  };

  const handleNewChat = () => {
    setMessages([]);
    setSelectedFile(null);
    setInput('');
  };

  return (
    <div className="relative flex h-screen bg-transparent text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* PREMIUM TOP LOADER */}
      {isTyping && <div className="top-loader" />}

      {/* MODERN DYNAMIC BACKGROUND MAP */}
      <div className="modern-bg-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <Sidebar 
        onNewChat={handleNewChat}
        onClearHistory={handleClear}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        openProfile={() => setShowProfile(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header 
          onClearHistory={handleClear}
          isTyping={isTyping}
        />

        <MessageList 
          messages={messages}
          isTyping={isTyping}
          onReload={handleReload}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput 
          input={input}
          setInput={setInput}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          onSend={handleSend}
          fileInputRef={fileInputRef}
          handleFileChange={(e) => setSelectedFile(e.target.files[0])}
          startListening={startListening}
          isListening={isListening}
          isTyping={isTyping}
        />
      </div>

      {/* PREMIUM PROFILE OVERLAY */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg glass-header rounded-[32px] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -mr-10 -mt-10" />
            
            <button 
              onClick={() => setShowProfile(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] border border-white/20 mb-6">
                <User size={48} className="text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-1">Premium Assistant</h2>
              <span className="text-blue-400 font-extrabold text-xs uppercase tracking-[0.2em] mb-8">Pro Elite Protocol</span>

              <div className="w-full grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Total Signals</span>
                  <span className="text-lg font-bold text-slate-200">1,248</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Uptime</span>
                  <span className="text-lg font-bold text-slate-200 text-blue-400">99.9%</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-sm transition-all">
                  Manage API Keys
                </button>
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-extrabold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
