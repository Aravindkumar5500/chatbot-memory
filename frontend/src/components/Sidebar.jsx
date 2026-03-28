import PropTypes from 'prop-types';
import { PanelLeftClose, Plus, MessageSquare, Trash2, Settings, User } from 'lucide-react';

const Sidebar = ({ onNewChat, onClearHistory, isSidebarOpen, setIsSidebarOpen, openProfile }) => {
  return (
    <aside className={`h-screen transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) border-r border-white/5 flex flex-col glass-header fixed lg:sticky top-0 z-50 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
      
      {/* Top Section with New Chat & Toggle */}
      <div className={`p-4 flex flex-col items-center ${isSidebarOpen ? 'items-stretch' : 'items-center'} border-b border-white/5 mb-2 gap-4`}>
        <div className="flex items-center justify-between w-full">
          {isSidebarOpen && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Console</span>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all ${!isSidebarOpen ? 'mx-auto' : ''}`}
          >
            <PanelLeftClose size={22} className={!isSidebarOpen ? 'rotate-180' : ''} />
          </button>
        </div>

        <button 
          onClick={onNewChat}
          className={`h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all active:scale-95 group overflow-hidden ${isSidebarOpen ? 'w-full gap-3 px-4' : 'w-12'}`}
        >
          <Plus size={22} className="text-blue-400 group-hover:rotate-90 transition-transform duration-300 shrink-0" />
          {isSidebarOpen && <span className="text-sm font-bold text-slate-100 whitespace-nowrap opacity-100 transition-opacity duration-300">New Analysis</span>}
        </button>
      </div>

      {/* Main History Area (Placeholder) */}
      <div className="flex-1 px-4 overflow-y-auto space-y-1 mt-4">
        {isSidebarOpen && (
          <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest transition-all">
            Intelligence History
          </p>
        )}
        
        {[1, 2, 3].map((item) => (
          <button key={item} className={`w-full h-12 rounded-xl hover:bg-white/5 flex items-center transition-all group overflow-hidden ${!isSidebarOpen ? 'justify-center' : 'px-4 gap-4'}`}>
            <MessageSquare size={20} className="text-slate-400 group-hover:text-blue-400 shrink-0" />
            {isSidebarOpen && <span className="text-xs text-slate-400 truncate font-semibold whitespace-nowrap opacity-100">Market Trend Analysis...</span>}
          </button>
        ))}
      </div>

      {/* Bottom Section: Clear & Profile */}
      <div className="p-4 border-t border-white/5 space-y-3 flex flex-col items-center">
        <button 
          onClick={onClearHistory}
          className={`h-12 flex items-center rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all overflow-hidden ${!isSidebarOpen ? 'w-12 justify-center' : 'w-full px-4 gap-4'}`}
          title="Clear Archive"
        >
          <Trash2 size={22} className="shrink-0" />
          {isSidebarOpen && <span className="text-xs font-bold whitespace-nowrap">Clear Archive</span>}
        </button>
        
        <button className={`h-12 flex items-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all overflow-hidden ${!isSidebarOpen ? 'w-12 justify-center' : 'w-full px-4 gap-4'}`}>
          <Settings size={22} className="shrink-0" />
          {isSidebarOpen && <span className="text-xs font-bold whitespace-nowrap">Global Settings</span>}
        </button>

        <button 
          onClick={openProfile}
          className={`mt-2 flex items-center overflow-hidden transition-all hover:scale-105 active:scale-95 ${!isSidebarOpen ? 'w-12 h-12 justify-center rounded-xl bg-white/5 border border-white/10' : 'w-full px-3 py-2.5 gap-4 rounded-2xl bg-white/5 border border-white/10'}`}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg border border-white/10">
            <User size={20} className="text-white" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col min-w-0 text-left opacity-100">
              <span className="text-xs font-bold text-slate-100 truncate">Premium User</span>
              <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-tighter">Pro Elite</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  onNewChat: PropTypes.func.isRequired,
  onClearHistory: PropTypes.func.isRequired,
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
  openProfile: PropTypes.func,
};

export default Sidebar;
