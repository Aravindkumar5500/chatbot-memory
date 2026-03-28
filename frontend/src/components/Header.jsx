import PropTypes from 'prop-types';
import { Bot, Trash2 } from 'lucide-react';

const Header = ({ onClearHistory, isTyping }) => {
  return (
    <header className="px-6 py-4 glass-header border-b border-white/5 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand/System Cluster */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-2.5 shadow-[0_0_25px_rgba(37,99,235,0.4)] border border-white/20 transition-all ${isTyping ? 'animate-pulse scale-105' : ''}`}>
            <Bot size={28} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">Cortex v1.2</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isTyping ? 'Synthesizing...' : 'Network Ready'}</span>
            </div>
          </div>
        </div>

        {/* Global Toolbar Cluster */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onClearHistory}
            className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 group"
            title="Wipe Local History"
          >
            <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  onClearHistory: PropTypes.func.isRequired,
  isTyping: PropTypes.bool.isRequired,
};

export default Header;
