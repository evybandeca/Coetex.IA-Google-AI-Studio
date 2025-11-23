
import React, { useState, useRef, useEffect } from 'react';
import { DatabaseData, DatabaseColumn } from '../types';
import { 
  Lock, Unlock, Settings, ChevronRight, ChevronDown, 
  Plus, Trash2, Copy, ToggleLeft, ToggleRight, Layout,
  Workflow, Layers, GitCommit
} from 'lucide-react';

interface DatabaseSettingsProps {
  data: DatabaseData;
  onUpdate: (newData: DatabaseData) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({ data, onUpdate, onClose, position }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'properties'>('main');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const toggleLock = () => {
    onUpdate({ ...data, isLocked: !data.isLocked });
  };

  const toggleSubItems = () => {
    onUpdate({ 
      ...data, 
      settings: { 
        ...data.settings, 
        showSubItems: !data.settings?.showSubItems 
      } 
    });
  };

  const toggleDependencies = () => {
    onUpdate({
      ...data,
      settings: {
        ...data.settings,
        showDependencies: !data.settings?.showDependencies
      }
    });
  };

  const handleDeleteProperty = (colId: string) => {
    const newCols = data.columns.filter(c => c.id !== colId);
    onUpdate({ ...data, columns: newCols });
  };

  const handleDuplicateProperty = (col: DatabaseColumn) => {
    const newCol = {
      ...col,
      id: Math.random().toString(36).substr(2, 9),
      name: `${col.name} (Copy)`
    };
    onUpdate({ ...data, columns: [...data.columns, newCol] });
  };

  const handleRenameProperty = (colId: string, newName: string) => {
    const newCols = data.columns.map(c => c.id === colId ? { ...c, name: newName } : c);
    onUpdate({ ...data, columns: newCols });
  };

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 w-72 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-slate-700"
      style={{ top: position.top, left: position.left }}
    >
      {activeTab === 'main' && (
        <div className="py-1">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            Database Settings
          </div>

          {/* Lock Database */}
          <div className="px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer" onClick={toggleLock}>
            <div className="flex items-center gap-2 text-sm">
              {data.isLocked ? <Lock size={16} className="text-red-500" /> : <Unlock size={16} className="text-slate-500" />}
              <span>Lock database</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${data.isLocked ? 'bg-blue-600' : 'bg-slate-300'}`}>
               <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${data.isLocked ? 'left-4.5' : 'left-0.5'}`} style={{ left: data.isLocked ? 'calc(100% - 14px)' : '2px' }} />
            </div>
          </div>

          <div className="border-t border-slate-100 my-1" />

          {/* Properties Navigation */}
          <button 
            onClick={() => setActiveTab('properties')}
            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-slate-500" />
              <span>Properties</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
                <span className="text-xs">{data.columns.length} shown</span>
                <ChevronRight size={14} />
            </div>
          </button>

          {/* Layout (Mock) */}
          <button className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-sm text-slate-400 cursor-not-allowed" title="Available in View Options">
            <div className="flex items-center gap-2">
              <Layout size={16} />
              <span>Layout</span>
            </div>
            <ChevronRight size={14} />
          </button>

          <div className="border-t border-slate-100 my-1" />

          {/* Advanced Features */}
          <div className="px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer" onClick={toggleSubItems}>
            <div className="flex items-center gap-2 text-sm">
              <Layers size={16} className="text-slate-500" />
              <span>Sub-items</span>
            </div>
            {data.settings?.showSubItems ? <ToggleRight size={20} className="text-blue-600" /> : <ToggleLeft size={20} className="text-slate-300" />}
          </div>

          <div className="px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer" onClick={toggleDependencies}>
            <div className="flex items-center gap-2 text-sm">
              <GitCommit size={16} className="text-slate-500 rotate-90" />
              <span>Dependencies</span>
            </div>
            {data.settings?.showDependencies ? <ToggleRight size={20} className="text-blue-600" /> : <ToggleLeft size={20} className="text-slate-300" />}
          </div>

        </div>
      )}

      {activeTab === 'properties' && (
        <div className="flex flex-col h-full max-h-[400px]">
           <div className="px-2 py-2 border-b border-slate-100 flex items-center gap-2">
              <button onClick={() => setActiveTab('main')} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                 <ChevronRight size={16} className="rotate-180" />
              </button>
              <span className="text-sm font-semibold">Properties</span>
           </div>
           
           <div className="flex-1 overflow-y-auto py-1">
              {data.columns.map(col => (
                  <div key={col.id} className="group px-3 py-2 hover:bg-slate-50 flex items-center gap-2">
                      <div className="p-1 bg-slate-100 rounded text-slate-500">
                          <Settings size={12} />
                      </div>
                      <input 
                        className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-blue-300"
                        value={col.name}
                        onChange={(e) => handleRenameProperty(col.id, e.target.value)}
                      />
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDuplicateProperty(col)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Duplicate">
                              <Copy size={12} />
                          </button>
                          <button onClick={() => handleDeleteProperty(col.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                              <Trash2 size={12} />
                          </button>
                      </div>
                  </div>
              ))}
           </div>

           <div className="p-2 border-t border-slate-100">
               <button 
                 className="w-full py-1.5 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:bg-slate-50 rounded border border-dashed border-slate-300 hover:border-slate-400 transition-colors"
                 onClick={() => {/* Trigger add property logic from parent ideally, or reuse generic add */}}
               >
                   <Plus size={12} /> New Property
               </button>
           </div>
        </div>
      )}
    </div>
  );
};
