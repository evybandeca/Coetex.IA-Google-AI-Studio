
import React, { useEffect, useRef } from 'react';
import { 
  Zap, FileText, FilePlus, Image as ImageIcon, List, PlusSquare, Copy, Database, Mic, Sparkles, Link,
  Heading1, Heading2, Heading3, CheckSquare, Quote, Minus, Info, Trash2, Type, Palette, ChevronRight
} from 'lucide-react';

interface SlashMenuProps {
  position: { top: number; left: number };
  onSelect: (command: string) => void;
  onClose: () => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ position, onSelect, onClose }) => {
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

  const commands = [
    // Basic Blocks
    { id: 'text', label: 'Text', icon: <Type size={16} className="text-slate-500" />, desc: 'Just start writing with plain text.' },
    { id: 'h1', label: 'Heading 1', icon: <Heading1 size={16} className="text-slate-600" />, desc: 'Big section header' },
    { id: 'h2', label: 'Heading 2', icon: <Heading2 size={16} className="text-slate-600" />, desc: 'Medium section header' },
    { id: 'h3', label: 'Heading 3', icon: <Heading3 size={16} className="text-slate-600" />, desc: 'Small section header' },
    { id: 'bullet', label: 'Bulleted List', icon: <List size={16} className="text-slate-500" />, desc: 'Create a simple bulleted list.' },
    { id: 'number', label: 'Numbered List', icon: <List size={16} className="text-slate-500" />, desc: 'Create a list with numbering.' },
    { id: 'todo', label: 'To-do List', icon: <CheckSquare size={16} className="text-blue-500" />, desc: 'Track tasks with a to-do list.' },
    { id: 'toggle', label: 'Toggle List', icon: <List size={16} className="text-slate-500" />, desc: 'Toggles can hide and show content inside.' },
    { id: 'quote', label: 'Quote', icon: <Quote size={16} className="text-slate-500" />, desc: 'Capture a quote.' },
    { id: 'divider', label: 'Divider', icon: <Minus size={16} className="text-slate-400" />, desc: 'Visually divide blocks.' },
    { id: 'callout', label: 'Callout', icon: <Info size={16} className="text-yellow-500" />, desc: 'Make writing stand out.' },
    
    // Cortexia & Media
    { id: 'ai', label: 'Ask Cortexia', icon: <Sparkles size={16} className="text-purple-600" />, desc: 'Edit, improve, or translate text' },
    { id: 'flashcard', label: 'Flashcard', icon: <Zap size={16} className="text-yellow-500" />, desc: 'Generate generic Q&A via Cortexia' },
    { id: 'image', label: 'Image', icon: <ImageIcon size={16} className="text-purple-500" />, desc: 'Upload an image block' },
    { id: 'sketch', label: 'Sketch', icon: <span className="font-serif italic font-bold text-slate-600">~</span>, desc: 'Add a drawing canvas' },
    { id: 'audio', label: 'Transcribe Audio', icon: <Mic size={16} className="text-red-500" />, desc: 'Record voice to text notes' },
    
    // Data
    { id: 'database', label: 'Database', icon: <Database size={16} className="text-slate-500" />, desc: 'Smart table with AI columns' },
    { id: 'linked-db', label: 'Linked View', icon: <Link size={16} className="text-blue-500" />, desc: 'Filtered view of existing DB' },
    { id: 'toc', label: 'Table of Contents', icon: <List size={16} className="text-slate-500" />, desc: 'Outline of headings' },
    { id: 'bread', label: 'Breadcrumb', icon: <ChevronRight size={16} className="text-slate-500" />, desc: 'Insert breadcrumb menu' },
    
    // Actions
    { id: 'delete', label: 'Delete', icon: <Trash2 size={16} className="text-red-500" />, desc: 'Delete this block' },
    { id: 'duplicate', label: 'Duplicate', icon: <Copy size={16} className="text-slate-500" />, desc: 'Duplicate this block' },

    // Colors
    { id: 'red', label: 'Red', icon: <Palette size={16} className="text-red-500" />, desc: 'Text color' },
    { id: 'blue', label: 'Blue', icon: <Palette size={16} className="text-blue-500" />, desc: 'Text color' },
    { id: 'green', label: 'Green', icon: <Palette size={16} className="text-green-500" />, desc: 'Text color' },
    { id: 'bg-yellow', label: 'Yellow Background', icon: <div className="w-4 h-4 bg-yellow-200 rounded border border-slate-300"></div>, desc: 'Background highlight' },
    { id: 'bg-red', label: 'Red Background', icon: <div className="w-4 h-4 bg-red-100 rounded border border-slate-300"></div>, desc: 'Background highlight' },
    { id: 'bg-blue', label: 'Blue Background', icon: <div className="w-4 h-4 bg-blue-100 rounded border border-slate-300"></div>, desc: 'Background highlight' },

    { id: 'new', label: 'New Page', icon: <PlusSquare size={16} className="text-slate-400" />, desc: 'Create a new subpage' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[400px] flex flex-col"
      style={{ top: position.top + 24, left: position.left }}
    >
      <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 flex-shrink-0">
        Basic Blocks
      </div>
      <div className="py-1 overflow-y-auto flex-1">
        {commands.map((cmd, idx) => (
          <button
            key={cmd.id}
            className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-3 transition-colors group"
            onClick={() => onSelect(cmd.id)}
            autoFocus={idx === 0}
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-slate-200 rounded bg-white shadow-sm group-hover:border-slate-300">
              {cmd.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700">{cmd.label}</div>
              <div className="text-xs text-slate-500 line-clamp-1">{cmd.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
