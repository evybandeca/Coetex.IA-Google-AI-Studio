
import React, { useState, useRef, useEffect } from 'react';
import { Folder } from '../types';
import { ChevronRight, ChevronDown, FileText, Plus, MoreHorizontal, Copy, Trash2 } from 'lucide-react';

interface FolderTreeProps {
  items: Folder[];
  level?: number;
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onCreatePage: (parentId: string) => void;
  onCreateFolder: (parentId: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  items,
  level = 0,
  activePageId,
  onSelectPage,
  onToggleFolder,
  onCreatePage,
  onCreateFolder,
  onDuplicatePage,
  onDeletePage
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="select-none">
      {items.map((item) => (
        <div key={item.id}>
          <div
            className={`group flex items-center gap-1 px-2 py-1 rounded-sm cursor-pointer transition-colors text-sm relative
              ${item.type === 'page' && item.pageId === activePageId ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-100'}
            `}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => {
              if (item.type === 'folder') {
                onToggleFolder(item.id);
              } else if (item.pageId) {
                onSelectPage(item.pageId);
              }
            }}
          >
            {/* Icon / Toggler */}
            <div className="flex items-center justify-center w-5 h-5 text-slate-400 shrink-0 hover:text-slate-600">
              {item.type === 'folder' ? (
                <div className="p-0.5 rounded-sm hover:bg-slate-200 transition-colors">
                   {item.isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>
              ) : (
                <FileText size={14} />
              )}
            </div>

            {/* Label */}
            <span className="truncate flex-1">{item.name}</span>

            {/* Actions (Hover) */}
            <div className="flex opacity-0 group-hover:opacity-100 items-center gap-1">
              {item.type === 'folder' && (
                <button 
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreatePage(item.id);
                  }}
                  title="Add Page"
                >
                  <Plus size={12} />
                </button>
              )}
              
              <div className="relative">
                  <button 
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded"
                      onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === item.id ? null : item.id);
                      }}
                  >
                    <MoreHorizontal size={12} />
                  </button>
                  
                  {openMenuId === item.id && (
                     <div 
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded shadow-xl z-50 py-1 flex flex-col"
                        style={{ left: 'auto', right: 0 }}
                        onClick={(e) => e.stopPropagation()}
                     >
                        {item.type === 'page' && (
                            <>
                                <button 
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 text-left"
                                    onClick={() => {
                                        if (item.pageId) onDuplicatePage(item.pageId);
                                        setOpenMenuId(null);
                                    }}
                                >
                                    <Copy size={12} /> Duplicate
                                </button>
                                <button 
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                                    onClick={() => {
                                        if (item.pageId) onDeletePage(item.pageId);
                                        setOpenMenuId(null);
                                    }}
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </>
                        )}
                        {item.type === 'folder' && (
                            <div className="px-3 py-2 text-xs text-slate-400 italic">Folder actions...</div>
                        )}
                     </div>
                  )}
              </div>
            </div>
          </div>

          {/* Children */}
          {item.type === 'folder' && item.isOpen && item.children && (
            <div className="border-l border-slate-100 ml-[calc(10px_+_8px)]">
               <FolderTree
                  items={item.children}
                  level={level + 1}
                  activePageId={activePageId}
                  onSelectPage={onSelectPage}
                  onToggleFolder={onToggleFolder}
                  onCreatePage={onCreatePage}
                  onCreateFolder={onCreateFolder}
                  onDuplicatePage={onDuplicatePage}
                  onDeletePage={onDeletePage}
                />
                {/* Empty State for Folder */}
                {item.children.length === 0 && (
                  <div 
                    className="text-xs text-slate-400 italic py-1 pl-8 cursor-default"
                    style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}
                  >
                    Empty
                  </div>
                )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
