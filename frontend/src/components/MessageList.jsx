import PropTypes from 'prop-types';
import { Bot } from 'lucide-react';
import MessageItem from './MessageItem';

const MessageList = ({ messages, isTyping, onReload, messagesEndRef }) => {
  return (
    <main className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="max-w-5xl mx-auto space-y-6">
        {messages.length === 0 && !isTyping ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-blue-600/10 to-indigo-700/10 border border-white/5 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.2)]">
              <Bot size={48} className="text-blue-500 animate-pulse" />
            </div>
            <div className="space-y-3">
              <h2 className="text-5xl font-black text-white tracking-tighter leading-none mb-1">Cortex v1.2</h2>
              <span className="text-blue-400 font-extrabold text-[10px] uppercase tracking-[0.3em] block mb-4">Unified Intelligence Hub</span>
              <p className="text-slate-400 max-w-lg leading-relaxed text-sm font-medium">
                Your high-precision neural engine is active. <br />
                Analyze data, read PDFs, and remember every detail.
              </p>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <MessageItem 
              key={msg.id}
              msg={msg}
              onReload={onReload}
            />
          ))
        )}
        
        {isTyping && (
          <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
              <Bot size={16} className="text-blue-400" />
            </div>
            <div className="glass-bubble px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
};

MessageList.propTypes = {
  messages: PropTypes.array.isRequired,
  isTyping: PropTypes.bool.isRequired,
  onReload: PropTypes.func.isRequired,
  messagesEndRef: PropTypes.oneOfType([
    PropTypes.func, 
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ])
};

export default MessageList;
