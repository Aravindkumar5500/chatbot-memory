import { useState } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Share2, MoreHorizontal } from 'lucide-react';

const MessageItem = ({ msg, onReload }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' or 'down'

  const isLong = msg.text.length > 600;
  const displayExpanded = isExpanded || !isLong || msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div key={msg.id} className={`flex gap-3 group/message animate-message ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      {/* Avatar Cluster */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
        msg.role === 'user' 
          ? 'bg-blue-600 shadow-md ring-1 ring-blue-400/20' 
          : 'bg-white/5 border border-white/10 shadow-lg'
      }`}>
        {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-blue-400" />}
      </div>

      <div className={`relative flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
        {/* Chat Bubble Interface */}
        <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-300 w-fit ${
          msg.role === 'user'
            ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10'
            : 'glass-bubble text-slate-200 rounded-tl-none overflow-hidden'
        } ${!displayExpanded ? 'max-h-[220px]' : ''}`}>
          
          <div className="markdown-content text-[13px] leading-[1.6] overflow-hidden">
            {msg.role === 'user' ? (
              <p className="m-0 whitespace-pre-wrap font-medium">{msg.text}</p>
            ) : (
              <ReactMarkdown
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter 
                        style={vscDarkPlus} 
                        language={match[1]} 
                        PreTag="div" 
                        className="rounded-lg !my-3 !bg-slate-950/50 border border-white/10" 
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : ( 
                      <code className="bg-white/10 px-1 py-0.5 rounded text-blue-300 font-mono text-xs" {...props}>
                        {children}
                      </code> 
                    );
                  },
                }}
              >
                {msg.text}
              </ReactMarkdown>
            )}
          </div>

          {isLong && !isExpanded && msg.role === 'bot' && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Action Bar - Elite Command Row (Matched to User Reference) */}
        <div className={`flex items-center gap-3 px-1 mt-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
          {/* HOVER GHOST ACTIONS - Bold Strokes & Rounded Spacing (Semi-Visible for Discovery) */}
          <div className="flex items-center gap-1.5 opacity-30 group-hover/message:opacity-100 transition-all duration-300 translate-y-1 group-hover/message:translate-y-0">
            <button 
              onClick={handleCopy} 
              className="p-1.5 text-zinc-400 hover:text-white transition-all transform hover:scale-110 active:scale-90"
              title="Copy"
            >
              {copied ? <Check size={15} strokeWidth={2.5} className="text-emerald-500" /> : <Copy size={15} strokeWidth={2.5} />}
            </button>

            {msg.role === 'bot' && (
              <>
                <button 
                  onClick={() => setFeedback('up')}
                  className={`p-1.5 transition-all transform hover:scale-110 active:scale-90 ${feedback === 'up' ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
                  title="Helpful"
                >
                  <ThumbsUp size={15} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => setFeedback('down')}
                  className={`p-1.5 transition-all transform hover:scale-110 active:scale-90 ${feedback === 'down' ? 'text-red-400' : 'text-zinc-400 hover:text-white'}`}
                  title="Not Helpful"
                >
                  <ThumbsDown size={15} strokeWidth={2.5} />
                </button>
                <button className="p-1.5 text-zinc-400 hover:text-white transition-all transform hover:scale-110 active:scale-90" title="Export">
                  <Share2 size={15} strokeWidth={2.5} />
                </button>
              </>
            )}

            <button 
              onClick={() => onReload(msg)} 
              className="p-1.5 text-zinc-400 hover:text-white transition-all transform hover:scale-110 active:scale-90"
              title="Regenerate"
            >
              <RotateCcw size={15} strokeWidth={2.5} />
            </button>

            <button className="p-1.5 text-zinc-400 hover:text-white transition-all transform hover:scale-110 active:scale-90" title="More">
              <MoreHorizontal size={15} strokeWidth={2.5} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {isLong && msg.role === 'bot' && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[9px] font-bold text-blue-500/60 hover:text-blue-400 uppercase tracking-widest"
              >
                {isExpanded ? 'Minimize' : 'Expand Details'}
              </button>
            )}
            <span className="text-[9px] text-zinc-600 font-bold lowercase opacity-80 pl-1">
              {new Date(msg.timestamp || msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

MessageItem.propTypes = {
  msg: PropTypes.shape({
    id: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    timestamp: PropTypes.string,
  }).isRequired,
  onReload: PropTypes.func.isRequired,
};

export default MessageItem;
