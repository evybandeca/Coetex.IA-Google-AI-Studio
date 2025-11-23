
import React from 'react';
import { 
  BookOpen, 
  BrainCircuit, 
  ChevronLeft, 
  ChevronRight, 
  Layout, 
  Settings, 
  Search,
  Plus,
  Users,
  ChevronsUpDown
} from 'lucide-react';
import { ViewMode, Folder } from '../types';
import { FolderTree } from './FolderTree';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  activeView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  flashcardCount: number;
  folders: Folder[];
  onSelectPage: (pageId: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onCreatePage: (parentId?: string) => void;
  onToggleFolder: (folderId: string) => void;
  activePageId: string;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  toggleCollapse, 
  activeView, 
  onChangeView,
  flashcardCount,
  folders,
  onSelectPage,
  onCreateFolder,
  onCreatePage,
  onToggleFolder,
  activePageId,
  onDuplicatePage,
  onDeletePage
}) => {
  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 bg-[#F7F7F5] border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col ${isCollapsed ? 'w-0 -translate-x-full' : 'w-64'} group/sidebar`}
    >
      {/* Workspace Switcher */}
      <div className="h-12 flex items-center px-3 hover:bg-slate-100 transition-colors cursor-pointer m-2 rounded-md duration-200">
        <div className="w-5 h-5 bg-blue-600 rounded-sm flex items-center justify-center text-white text-xs font-bold mr-2 shadow-sm">
          C
        </div>
        <div className="flex-1 truncate">
          <div className="text-xs font-medium text-slate-700 truncate">Cortex.IA Workspace</div>
          <div className="text-[10px] text-slate-500">Free Plan</div>
        </div>
        <ChevronsUpDown size={14} className="text-slate-400" />
      </div>

      {/* Quick Actions */}
      <div className="px-2 space-y-0.5 mb-4">
        <div className="relative group mb-2 px-2">
           <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 rounded px-2 py-1 shadow-sm hover:border-slate-300 transition-colors cursor-text">
             <Search size={14} />
             <span className="text-xs">Search</span>
             <span className="ml-auto text-[10px] border border-slate-100 px-1 rounded bg-slate-50">⌘K</span>
           </div>
        </div>

        <NavItem 
          icon={<Layout size={16} />} 
          label="Dashboard" 
          isActive={activeView === ViewMode.EDITOR}
          onClick={() => onChangeView(ViewMode.EDITOR)}
        />
        <NavItem 
          icon={<BrainCircuit size={16} />} 
          label="Spaced Repetition" 
          isActive={activeView === ViewMode.FLASHCARDS}
          onClick={() => onChangeView(ViewMode.FLASHCARDS)}
          badge={flashcardCount > 0 ? flashcardCount : undefined}
        />
        <NavItem 
          icon={<Settings size={16} />} 
          label="Settings" 
          isActive={activeView === ViewMode.SETTINGS}
          onClick={() => onChangeView(ViewMode.SETTINGS)}
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6">
        
        {/* Teamspaces Section */}
        <div>
          <div className="px-3 text-[11px] font-semibold text-slate-500 mb-1 flex justify-between items-center group cursor-pointer hover:text-slate-800">
            <span>Teamspaces</span>
            <Plus size={14} className="opacity-0 group-hover:opacity-100 hover:bg-slate-200 rounded" />
          </div>
          <div className="space-y-0.5">
             <button className="w-full flex items-center gap-2 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-sm">
                <Users size={14} className="text-slate-400" />
                <span>Med School 2025</span>
             </button>
             <button className="w-full flex items-center gap-2 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-sm">
                <Users size={14} className="text-slate-400" />
                <span>Research Group A</span>
             </button>
          </div>
        </div>

        {/* Private Section (Dynamic Tree) */}
        <div>
          <div className="px-3 text-[11px] font-semibold text-slate-500 mb-1 flex justify-between items-center group cursor-pointer hover:text-slate-800">
            <span>Private</span>
            <Plus 
              size={14} 
              className="opacity-0 group-hover:opacity-100 hover:bg-slate-200 rounded" 
              onClick={(e) => {
                e.stopPropagation();
                onCreateFolder();
              }}
            />
          </div>
          <FolderTree 
            items={folders}
            activePageId={activePageId}
            onSelectPage={onSelectPage}
            onToggleFolder={onToggleFolder}
            onCreatePage={onCreatePage}
            onCreateFolder={onCreateFolder}
            onDuplicatePage={onDuplicatePage}
            onDeletePage={onDeletePage}
          />
           <button 
            onClick={() => onCreatePage()}
            className="w-full flex items-center gap-2 px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 rounded-sm mt-1 opacity-60 hover:opacity-100 transition-opacity"
          >
             <Plus size={14} />
             <span>Add a page</span>
          </button>
        </div>

      </div>
      
      {/* Collapse Toggle (Floating) */}
      <button 
        onClick={toggleCollapse}
        className="absolute top-3 -right-8 z-50 p-1.5 bg-transparent hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-r transition-colors"
        title="Toggle Sidebar"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Add handle for collapsed state interaction if needed */}
      {isCollapsed && (
         <div className="fixed top-3 left-3 z-50">
            <button onClick={toggleCollapse} className="p-2 hover:bg-slate-100 rounded text-slate-500">
               <ChevronRight size={20} />
            </button>
         </div>
      )}
    </aside>
  );
};

const NavItem = ({ icon, label, isActive, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-1 rounded-sm text-sm font-medium transition-colors relative
      ${isActive 
        ? 'bg-[#E0E0DF] text-slate-900' 
        : 'text-slate-600 hover:bg-slate-100'
      }`}
  >
    <span className={isActive ? 'text-slate-800' : 'text-slate-500'}>{icon}</span>
    <span>{label}</span>
    {badge && (
      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);
