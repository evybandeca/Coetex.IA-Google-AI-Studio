import React from 'react';
import { ChevronRight, FileText, Folder, MoreHorizontal } from 'lucide-react';
import { Folder as FolderType } from '../types';

interface BreadcrumbsProps {
  path: FolderType[];
  onNavigate: (pageId: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate }) => {
  if (!path || path.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm text-slate-500 mb-4 select-none">
      {path.map((item, index) => {
        const isLast = index === path.length - 1;
        const isPage = item.type === 'page' && item.pageId;

        return (
          <React.Fragment key={item.id}>
            <div 
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                isPage && !isLast 
                  ? 'hover:bg-slate-100 cursor-pointer text-slate-600 hover:text-slate-900' 
                  : isLast 
                    ? 'text-slate-900 font-medium cursor-default'
                    : 'text-slate-500 cursor-default'
              }`}
              onClick={() => {
                if (isPage && item.pageId && !isLast) {
                  onNavigate(item.pageId);
                }
              }}
            >
              <span className="opacity-70">
                {item.type === 'folder' ? <Folder size={14} /> : <FileText size={14} />}
              </span>
              <span className="truncate max-w-[150px]">{item.name}</span>
            </div>

            {!isLast && (
              <span className="text-slate-400">
                <span className="mx-0.5">/</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};