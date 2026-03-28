import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import { Paperclip, Mic, X, Send, Loader2 } from 'lucide-react';

const ChatInput = ({ 
  input, 
  setInput, 
  selectedFile, 
  setSelectedFile, 
  onSend, 
  fileInputRef, 
  handleFileChange, 
  startListening, 
  isListening, 
  isTyping 
}) => {
  return (
    <footer className="p-6 bg-transparent mt-auto sticky bottom-0">
      <div className="max-w-5xl mx-auto border-t border-white/5 pt-6">
        <Form onSubmit={onSend} className="relative">
          {/* File Preview Bubble */}
          {selectedFile && (
            <div className="absolute -top-14 left-0 flex items-center gap-3 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-xl border border-blue-500/30 backdrop-blur-md animate-in slide-in-from-bottom-2 shadow-lg">
              <Paperclip size={16} />
              <span className="text-sm font-bold truncate max-w-[250px]">{selectedFile.name}</span>
              <button 
                type="button" 
                onClick={() => setSelectedFile(null)} 
                className="p-1 hover:bg-blue-500/30 rounded-full transition-colors"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,.pdf,.txt"
          />

          <div className="flex items-center glass-input rounded-[28px] px-4 py-3 transition-all">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2.5 text-slate-500 hover:text-white transition-all hover:scale-110" 
              title="Attach Files"
            >
              <Paperclip size={20} />
            </button>
            
            <button 
              type="button" 
              onClick={startListening} 
              className={`p-2.5 transition-all rounded-full ${isListening ? 'bg-red-500 text-white animate-mic-pulse' : 'text-slate-500 hover:text-white hover:rotate-12'}`} 
              title="Voice Input"
            >
              <Mic size={20} />
            </button>

            <input
              type="text"
              placeholder="How can I assist you today?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none text-white focus:ring-0 px-4 text-base placeholder:text-slate-600 font-medium tracking-tight"
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={(!input.trim() && !selectedFile) || isTyping}
              className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:from-slate-800 disabled:to-slate-900 text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-90 transition-all ml-2 border border-white/10"
            >
              {isTyping ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} className="translate-x-0.5" />}
            </button>
          </div>
        </Form>
      </div>
    </footer>
  );
};

ChatInput.propTypes = {
  input: PropTypes.string.isRequired,
  setInput: PropTypes.func.isRequired,
  selectedFile: PropTypes.object,
  setSelectedFile: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  fileInputRef: PropTypes.oneOfType([
    PropTypes.func, 
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
  handleFileChange: PropTypes.func.isRequired,
  startListening: PropTypes.func.isRequired,
  isListening: PropTypes.bool.isRequired,
  isTyping: PropTypes.bool.isRequired,
};

export default ChatInput;
