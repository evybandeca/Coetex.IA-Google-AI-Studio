
import React, { useEffect, useRef } from 'react';
import { Trash2, Copy, ArrowRightLeft, Palette, Check } from 'lucide-react';

interface BlockActionMenuProps {
  position: { top: number; left: number };
  onSelect: (action: string) => void;
  onClose: () => void;
}

export const BlockActionMenu: React.FC<BlockActionMenuProps> = ({ position, onSelect, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const colors = [
    { id: 'default', label: 'Default', class: 'text-slate-900' },
    { id: 'red', label: 'Red', class: 'text-red-600' },
    { id: 'blue', label: 'Blue', class: 'text-blue-600' },
    { id: 'green', label: 'Green', class: 'text-green-600' },
    { id: 'bg-yellow', label: 'Yellow Background', class: 'bg-yellow-100 text-slate-900 px-1 rounded' },
    { id: 'bg-red', label: 'Red Background', class: 'bg-red-100 text-slate-900 px-1 rounded' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-60 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col py-1"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</div>
      
      <button onClick={() => onSelect('duplicate')} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
        <Copy size={14} /> Duplicate
      </button>
      
      <button onClick={() => onSelect('delete')} className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600">
        <Trash2 size={14} /> Delete
      </button>

      <div className="my-1 border-t border-slate-100"></div>
      <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Turn Into</div>

      <div className="grid grid-cols-3 gap-1 px-2">
        {[
            { id: 'text', label: 'Text' },
            { id: 'h1', label: 'H1' },
            { id: 'h2', label: 'H2' },
            { id: 'h3', label: 'H3' },
            { id: 'bullet', label: 'List' },
            { id: 'todo', label: 'Todo' }
        ].map(type => (
            <button 
                key={type.id}
                onClick={() => onSelect(type.id)}
                className="px-2 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50 text-center truncate"
            >
                {type.label}
            </button>
        ))}
      </div>

      <div className="my-1 border-t border-slate-100"></div>
      <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Colors</div>
      
      <div className="max-h-32 overflow-y-auto">
          {colors.map(c => (
              <button 
                key={c.id} 
                onClick={() => onSelect(c.id)}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-sm"
              >
                  <span className={`w-4 h-4 rounded border border-slate-200 flex items-center justify-center text-[10px] ${c.class.includes('bg-') ? c.class.split(' ')[0] : 'bg-white'}`}>
                     {!c.class.includes('bg-') && <span style={{color: c.id === 'default' ? '#000' : c.id}}>A</span>}
                  </span>
                  <span className="text-slate-700">{c.label}</span>
              </button>
          ))}
      </div>

    </div>
  );
};
