import React from 'react';
import { 
  FolderKanban, 
  MessageSquare, 
  Users, 
  BarChart3, 
  GitFork, 
  Settings, 
  LayoutGrid
} from 'lucide-react';

interface CurvedSidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onContinue?: () => void;
}

export const CurvedSidebar: React.FC<CurvedSidebarProps> = ({
  activeTab,
  onSelectTab,
  onContinue,
}) => {
  const navItems = [
    { id: 'board', label: 'Board', icon: LayoutGrid },
    { id: 'grid', label: 'Grid', icon: FolderKanban },
    { id: 'resources', label: 'Resources', icon: FolderKanban },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'polls', label: 'Polls', icon: BarChart3 },
    { id: 'breakout', label: 'Breakout', icon: GitFork },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="relative w-64 h-full flex flex-col justify-between overflow-hidden select-none bg-gradient-to-b from-[#001f6d] via-[#002f9c] to-[#001242] text-white shrink-0 z-20">
      <div 
        className="absolute inset-y-0 right-0 w-4 bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] pointer-events-none z-20"
        style={{
          clipPath: 'polygon(100% 0, 100% 100%, 0% 100%, 70% 75%, 15% 45%, 85% 20%, 0% 0%)',
        }}
      />
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#001c63] via-[#0033a8] to-[#00113b] z-10"
        style={{
          clipPath: 'polygon(0 0, 97% 0, 77% 20%, 12% 45%, 62% 75%, 97% 100%, 0 100%)',
        }}
      />
      <div className="relative z-30 pt-5 px-5 flex flex-col items-start">
        <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-[#fcd34d] via-[#fbbf24] to-[#b45309] shadow-lg flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#001854] flex flex-col items-center justify-center border border-[#fef3c7]">
            <span className="text-[10px] font-bold text-amber-200 tracking-wider">
              B C
            </span>
          </div>
        </div>
      </div>
      <nav className="relative z-30 flex-1 my-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-[85%] flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white text-[#001f6d] shadow-md transform translate-x-1'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#001f6d]' : 'text-blue-200'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="relative z-30 pb-6 px-4">
        <button 
          onClick={onContinue}
          className="w-[82%] py-2.5 px-4 rounded-full bg-gradient-to-r from-[#001242] to-[#002f9c] border-2 border-[#f59e0b] text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all text-center"
        >
          Continue
        </button>
      </div>
    </aside>
  );
};
