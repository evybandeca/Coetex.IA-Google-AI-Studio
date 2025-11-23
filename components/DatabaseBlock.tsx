
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DatabaseData, DatabaseRow, DatabaseView, DatabaseColumn, SelectOption, Page } from '../types';
import { generateAIColumnValue, queryDatabase } from '../services/geminiService';
import { DatabaseSettings } from './DatabaseSettings';
import { 
  Sparkles, Search, Plus, MessageSquare, Loader2, 
  Table as TableIcon, Kanban, List as ListIcon, Filter, ArrowUpDown, MoreHorizontal,
  Calendar, CheckSquare, Hash, Type, Users, Link as LinkIcon, Mail, Phone, File,
  Lock, ChevronRight, ChevronDown, CornerDownRight, AlertCircle
} from 'lucide-react';

interface DatabaseBlockProps {
  data: DatabaseData;
  onUpdate: (newData: DatabaseData) => void;
  onCreateRow?: (rowId: string, templateId?: string) => void;
  onSearchPages?: (query: string) => Promise<{id: string, title: string}[]>;
  onGetRowData?: (pageId: string) => Promise<Record<string, any>>;
}

const PROPERTY_ICONS: Record<string, React.ReactNode> = {
  'text': <Type size={14} />,
  'number': <Hash size={14} />,
  'select': <ListIcon size={14} />,
  'multi-select': <ListIcon size={14} />,
  'status': <Loader2 size={14} />,
  'date': <Calendar size={14} />,
  'person': <Users size={14} />,
  'checkbox': <CheckSquare size={14} />,
  'url': <LinkIcon size={14} />,
  'email': <Mail size={14} />,
  'phone': <Phone size={14} />,
  'file': <File size={14} />,
  'ai-summary': <Sparkles size={14} className="text-purple-500" />,
  'ai-evidence': <Sparkles size={14} className="text-purple-500" />,
  'relation': <ArrowUpDown size={14} className="rotate-45" />,
  'rollup': <Search size={14} />
};

const COLORS = [
  'bg-slate-100 text-slate-700',
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-yellow-100 text-yellow-700',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
];

export const DatabaseBlock: React.FC<DatabaseBlockProps> = ({ data, onUpdate, onCreateRow, onSearchPages, onGetRowData }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [generatingCell, setGeneratingCell] = useState<string | null>(null);
  
  const [activeViewId, setActiveViewId] = useState(data.activeViewId || data.views?.[0]?.id);
  const activeView = data.views?.find(v => v.id === activeViewId) || data.views?.[0];

  // Settings Menu State
  const [showSettings, setShowSettings] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  // Template Menu State
  const [showTemplates, setShowTemplates] = useState(false);
  const templateButtonRef = useRef<HTMLButtonElement>(null);

  // Sub-item Expansion State
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // --- DATA PROCESSING ---
  const processedRows = useMemo(() => {
    if (!activeView) return data.rows;
    
    let result = [...data.rows];

    // Filter
    if (activeView.filters && activeView.filters.length > 0) {
      result = result.filter(row => {
        return activeView.filters.every(filter => {
          const cellValue = String(row.cells[filter.columnId] || '').toLowerCase();
          const filterVal = filter.value.toLowerCase();
          if (filter.operator === 'contains') return cellValue.includes(filterVal);
          return true;
        });
      });
    }

    // Sort
    if (activeView.sorts && activeView.sorts.length > 0) {
      result.sort((a, b) => {
        const sort = activeView.sorts[0];
        const valA = String(a.cells[sort.columnId] || '');
        const valB = String(b.cells[sort.columnId] || '');
        return sort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    return result;
  }, [data.rows, activeView]);

  // Helper to organize rows for sub-items
  const getFlattenedTree = useMemo(() => {
    if (!data.settings?.showSubItems) return processedRows;

    const roots = processedRows.filter(r => !r.parentId);
    const flattened: Array<{ row: DatabaseRow, level: number }> = [];

    const traverse = (nodes: DatabaseRow[], level: number) => {
      nodes.forEach(node => {
        flattened.push({ row: node, level });
        if (expandedRows.has(node.id)) {
          const children = processedRows.filter(r => r.parentId === node.id);
          traverse(children, level + 1);
        }
      });
    };

    traverse(roots, 0);
    return flattened;
  }, [processedRows, data.settings?.showSubItems, expandedRows]);


  // --- HANDLERS ---

  const handleCellChange = (rowId: string, colId: string, value: any) => {
    const newRows = data.rows.map(r => {
      if (r.id === rowId) {
        return { ...r, cells: { ...r.cells, [colId]: value } };
      }
      return r;
    });
    onUpdate({ ...data, rows: newRows });
  };

  const handleAddRow = (templateId?: string) => {
    const newRowId = Math.random().toString(36).substr(2, 9);
    const newRow: DatabaseRow = {
      id: newRowId,
      cells: {}
    };
    onUpdate({ ...data, rows: [...data.rows, newRow] });
    if (onCreateRow) onCreateRow(newRowId, templateId);
    setShowTemplates(false);
  };

  const handleCreateTemplate = () => {
      // Creating a template is effectively creating a row marked as a template
      const newTemplateId = Math.random().toString(36).substr(2, 9);
      const newTemplate: Page = {
          id: newTemplateId,
          title: 'New Template',
          coverImage: '',
          blocks: [{ id: 'b1', type: 'text', content: '' }],
          updatedAt: Date.now(),
          isTemplate: true
      };
      onUpdate({ ...data, templates: [...(data.templates || []), newTemplate] });
      if (onCreateRow) onCreateRow(newTemplateId); 
      setShowTemplates(false);
  };

  const handleAddOption = (colId: string, optionName: string) => {
    const colIndex = data.columns.findIndex(c => c.id === colId);
    if (colIndex === -1) return;
    
    const newOption: SelectOption = {
      id: Math.random().toString(36).substr(2, 9),
      name: optionName,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };

    const newCols = [...data.columns];
    newCols[colIndex] = {
      ...newCols[colIndex],
      options: [...(newCols[colIndex].options || []), newOption]
    };
    onUpdate({ ...data, columns: newCols });
    return newOption;
  };

  const handleAIGenerate = async (row: DatabaseRow, colId: string, type: 'ai-summary' | 'ai-evidence') => {
    const cellKey = `${row.id}-${colId}`;
    setGeneratingCell(cellKey);
    const context = row.cells[data.columns[0].id] || "";
    const result = await generateAIColumnValue(context, type);
    handleCellChange(row.id, colId, result);
    setGeneratingCell(null);
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setIsQuerying(true);
    setAnswer(null);
    const result = await queryDatabase(query, data.rows, data.columns);
    setAnswer(result);
    setIsQuerying(false);
  };

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const renderCell = (row: DatabaseRow, col: DatabaseColumn) => {
    const value = row.cells[col.id];

    switch (col.type) {
      case 'checkbox':
        return (
          <div className="flex items-center justify-center h-full">
            <input 
              type="checkbox" 
              checked={!!value} 
              onChange={(e) => handleCellChange(row.id, col.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        );
      case 'select':
      case 'status':
        return (
          <SelectCell 
            value={value} 
            options={col.options || []} 
            onChange={(val) => handleCellChange(row.id, col.id, val)}
            onCreateOption={(name) => {
                const opt = handleAddOption(col.id, name);
                if (opt) handleCellChange(row.id, col.id, opt.name);
            }}
          />
        );
      case 'multi-select':
        return (
          <MultiSelectCell 
            value={value || []} 
            options={col.options || []} 
            onChange={(val) => handleCellChange(row.id, col.id, val)}
            onCreateOption={(name) => {
                const opt = handleAddOption(col.id, name);
                if (opt) handleCellChange(row.id, col.id, [...(value || []), opt.name]);
            }}
          />
        );
      case 'date':
        return (
          <input 
            type="date" 
            className="w-full h-full bg-transparent outline-none px-2 text-sm text-slate-600"
            value={value || ''}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
          />
        );
      case 'person':
        return (
           <div className="flex items-center gap-1 px-2 py-1">
              {value ? (
                  <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5 text-xs border border-slate-200">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">U</div>
                      {value}
                  </div>
              ) : (
                  <select 
                    className="bg-transparent text-xs outline-none text-slate-400 hover:text-slate-600"
                    onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                    value=""
                  >
                      <option value="" disabled>Assign...</option>
                      <option value="Dr. Smith">Dr. Smith</option>
                      <option value="Resident A">Resident A</option>
                      <option value="Student B">Student B</option>
                  </select>
              )}
           </div>
        );
      case 'relation':
        return (
            <RelationCell 
                value={value} 
                onChange={(v) => handleCellChange(row.id, col.id, v)} 
                onSearch={onSearchPages}
            />
        );
      case 'rollup':
        return (
            <RollupCell 
                row={row} 
                column={col} 
                data={data} 
                onGetRowData={onGetRowData}
            />
        );
      case 'ai-summary':
      case 'ai-evidence':
        return (
           <div className="flex items-center justify-between w-full h-full px-3 py-2 group/ai">
             <span className={`truncate text-sm ${!value ? 'text-slate-300 italic' : 'text-slate-700'}`}>
                 {value || 'Empty'}
             </span>
             <button 
                onClick={() => handleAIGenerate(row, col.id, col.type as any)}
                disabled={generatingCell === `${row.id}-${col.id}`}
                className="opacity-0 group-hover/ai:opacity-100 p-1 hover:bg-purple-100 rounded text-purple-500 transition-all"
             >
                {generatingCell === `${row.id}-${col.id}` ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
             </button>
           </div>
        );
      case 'url':
        return (
            <input 
                className="w-full h-full px-3 py-2 bg-transparent outline-none text-blue-600 underline decoration-blue-300"
                value={value || ''}
                onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                placeholder="https://..."
            />
        );
      default:
        return (
          <input 
            className="w-full h-full px-3 py-2 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-300"
            value={value || ''}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            placeholder="Empty"
          />
        );
    }
  };

  return (
    <div className="my-6 border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    {data.isLocked && <Lock size={12} className="text-slate-400" />}
                    {data.title}
                </span>
                {/* View Switcher */}
                <div className="flex bg-slate-200/50 rounded-md p-0.5">
                    {data.views?.map(v => (
                        <button 
                            key={v.id}
                            onClick={() => setActiveViewId(v.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${activeViewId === v.id ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {v.type === 'table' && <TableIcon size={12} />}
                            {v.type === 'board' && <Kanban size={12} />}
                            {v.type === 'list' && <ListIcon size={12} />}
                            {v.name}
                        </button>
                    ))}
                    {!data.isLocked && (
                        <button className="flex items-center justify-center px-1.5 py-1 rounded text-xs text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-all">
                            <Plus size={12} />
                        </button>
                    )}
                </div>
             </div>
             <div className="flex gap-2 relative">
                 <button className="text-slate-400 hover:text-slate-600"><Filter size={14} /></button>
                 <button className="text-slate-400 hover:text-slate-600"><ArrowUpDown size={14} /></button>
                 <button 
                    ref={settingsButtonRef}
                    className={`text-slate-400 hover:text-slate-600 p-0.5 rounded ${showSettings ? 'bg-slate-200 text-slate-700' : ''}`} 
                    onClick={() => setShowSettings(!showSettings)}
                 >
                    <MoreHorizontal size={14} />
                 </button>
                 {showSettings && settingsButtonRef.current && (
                    <DatabaseSettings 
                        data={data}
                        onUpdate={onUpdate}
                        onClose={() => setShowSettings(false)}
                        position={{ 
                            top: settingsButtonRef.current.getBoundingClientRect().bottom + 8, 
                            left: settingsButtonRef.current.getBoundingClientRect().right - 288 // Align right
                        }}
                    />
                 )}
             </div>
        </div>
        
        {/* Chat */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isQuerying ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <Sparkles size={14} className="text-purple-500" />}
          </div>
          <input 
            className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-md py-1.5 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all placeholder-slate-400"
            placeholder="Ask Cortexia about this database..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
        </div>
        {answer && (
            <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded text-sm text-slate-700 flex gap-2">
                <MessageSquare size={14} className="text-purple-400 mt-0.5 shrink-0" />
                <div className="prose prose-sm max-w-none">{answer}</div>
            </div>
        )}
      </div>

      {/* View Renderers */}
      <div className="flex-1 overflow-auto relative">
        {activeView?.type === 'table' && (
            <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-white border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                {data.columns.map((col, idx) => (
                    <th key={col.id} className={`px-4 py-2 font-semibold border-r border-slate-100 last:border-0 min-w-[150px] group cursor-pointer hover:bg-slate-50 ${idx===0 && data.settings?.showSubItems ? 'pl-8' : ''}`}>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">{PROPERTY_ICONS[col.type] || <Type size={14} />}</span>
                            {col.name}
                        </div>
                    </th>
                ))}
                {!data.isLocked && (
                    <th className="w-10 bg-white border-l border-slate-100 text-center cursor-pointer hover:bg-slate-50" title="Add Property">
                        <Plus size={14} className="mx-auto text-slate-400" />
                    </th>
                )}
                </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
                {/* Conditional Rendering: If SubItems enabled, use Flattened Tree, else ProcessedRows */}
                {(data.settings?.showSubItems ? getFlattenedTree : processedRows.map(r => ({ row: r, level: 0 }))).map(({ row, level }) => {
                    // Check if row has children for toggle visibility
                    const hasChildren = data.rows.some(r => r.parentId === row.id);
                    const isExpanded = expandedRows.has(row.id);
                    const isBlocked = data.settings?.showDependencies && row.dependencies && row.dependencies.length > 0;

                    return (
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 group">
                            {data.columns.map((col, idx) => (
                            <td key={col.id} className="p-0 border-r border-slate-100 last:border-0 relative h-9">
                                {idx === 0 ? (
                                    <div className="flex items-center h-full relative" style={{ paddingLeft: `${level * 20}px` }}>
                                        {/* Sub-item Toggle */}
                                        {data.settings?.showSubItems && (
                                            <div 
                                                className={`w-5 h-5 flex items-center justify-center cursor-pointer text-slate-400 hover:bg-slate-200 rounded mr-1 ${hasChildren ? 'opacity-100' : 'opacity-0'}`}
                                                onClick={() => toggleRowExpansion(row.id)}
                                            >
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                        )}
                                        {/* Dependency Indicator */}
                                        {isBlocked && (
                                            <div className="mr-2 text-red-500" title="This item is blocked by a dependency">
                                                <AlertCircle size={12} />
                                            </div>
                                        )}
                                        {/* Sub-item connector visual */}
                                        {level > 0 && (
                                            <div className="absolute left-0 top-0 bottom-0 border-l border-slate-200" style={{ left: `${(level * 20) - 11}px` }}></div>
                                        )}
                                        {level > 0 && (
                                            <div className="absolute top-1/2 w-3 border-t border-slate-200" style={{ left: `${(level * 20) - 11}px` }}></div>
                                        )}
                                        <div className="flex-1 h-full">
                                            {renderCell(row, col)}
                                        </div>
                                    </div>
                                ) : (
                                    renderCell(row, col)
                                )}
                            </td>
                            ))}
                            {!data.isLocked && <td className="border-l border-slate-100 bg-slate-50/50" />}
                            <td className="absolute right-0 mt-2 mr-2 w-10 pointer-events-none flex justify-end">
                                <button 
                                    className="pointer-events-auto opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 text-[10px] px-1 border border-slate-200 rounded bg-white shadow-sm"
                                    onClick={() => onCreateRow && onCreateRow(row.id)}
                                >
                                    OPEN
                                </button>
                            </td>
                        </tr>
                    );
                })}
                <tr>
                    <td colSpan={data.columns.length + (data.isLocked ? 0 : 1)} className="p-1 border-t border-slate-100 relative">
                        <div className="flex gap-2">
                            <button onClick={() => handleAddRow()} className="flex-1 py-1 flex items-center gap-1 justify-center text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded">
                                <Plus size={12} /> New
                            </button>
                            <button 
                                ref={templateButtonRef}
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="px-2 hover:bg-slate-100 rounded text-slate-400"
                            >
                                <ChevronDown size={12} />
                            </button>
                        </div>
                        
                        {showTemplates && (
                            <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1">
                                <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase">Templates</div>
                                {data.templates?.map(t => (
                                    <button 
                                        key={t.id} 
                                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded text-sm flex items-center gap-2"
                                        onClick={() => handleAddRow(t.id)}
                                    >
                                        <File size={12} className="text-slate-400" />
                                        {t.title}
                                    </button>
                                ))}
                                <div className="border-t border-slate-100 my-1"></div>
                                <button 
                                    onClick={handleCreateTemplate}
                                    className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded text-sm flex items-center gap-2 text-blue-600"
                                >
                                    <Plus size={12} /> New template
                                </button>
                            </div>
                        )}
                    </td>
                </tr>
            </tbody>
            </table>
        )}

        {activeView?.type === 'board' && (
            <div className="flex p-4 gap-4 h-full overflow-x-auto">
                {['To Do', 'In Progress', 'Done'].map(status => (
                    <div key={status} className="w-64 shrink-0 flex flex-col bg-slate-50 rounded-lg border border-slate-200 max-h-full">
                        <div className="p-3 text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span>{status}</span>
                            <span className="bg-slate-200 px-1.5 rounded-full text-[10px]">{processedRows.filter(r => r.cells['c_status'] === status).length}</span>
                        </div>
                        <div className="p-2 space-y-2 overflow-y-auto flex-1">
                            {processedRows.filter(r => r.cells['c_status'] === status || (!r.cells['c_status'] && status === 'To Do')).map(row => {
                                const isBlocked = data.settings?.showDependencies && row.dependencies && row.dependencies.length > 0;
                                return (
                                    <div key={row.id} className={`bg-white p-3 rounded shadow-sm border hover:shadow-md cursor-pointer ${isBlocked ? 'border-red-200' : 'border-slate-100'}`} onClick={() => onCreateRow && onCreateRow(row.id)}>
                                        {isBlocked && (
                                            <div className="text-[10px] text-red-500 flex items-center gap-1 mb-1">
                                                <AlertCircle size={10} /> Blocked
                                            </div>
                                        )}
                                        <div className="font-medium text-sm mb-1">{row.cells[data.columns[0].id] || 'Untitled'}</div>
                                        <div className="flex gap-2 flex-wrap">
                                            {data.columns.slice(1).map(c => row.cells[c.id] && (
                                                <div key={c.id} className="text-[10px] text-slate-500 truncate max-w-full bg-slate-50 px-1 rounded">{row.cells[c.id]}</div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            <button onClick={() => handleAddRow()} className="w-full py-2 text-xs text-slate-400 hover:bg-slate-100 rounded flex items-center justify-center gap-1">
                                <Plus size={12} /> New
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeView?.type === 'list' && (
            <div className="p-4 space-y-1">
                {processedRows.map(row => (
                    <div key={row.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded group border-b border-transparent hover:border-slate-100">
                        <div className="p-1 bg-slate-100 rounded"><File size={14} className="text-slate-400" /></div>
                        <div className="font-medium text-sm flex-1 cursor-pointer hover:underline" onClick={() => onCreateRow && onCreateRow(row.id)}>
                            {row.cells[data.columns[0].id] || 'Untitled'}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 text-xs text-slate-400">
                            {data.columns.slice(1, 3).map(c => (
                                <span key={c.id}>{row.cells[c.id]}</span>
                            ))}
                        </div>
                    </div>
                ))}
                <button onClick={() => handleAddRow()} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mt-2">
                    <Plus size={12} /> New
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS FOR CELLS ---

const SelectCell: React.FC<{ value: string; options: SelectOption[]; onChange: (val: string) => void; onCreateOption: (val: string) => void }> = ({ value, options, onChange, onCreateOption }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const listener = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', listener);
        return () => document.removeEventListener('mousedown', listener);
    }, []);

    const selectedOption = options.find(o => o.name === value);

    return (
        <div className="w-full h-full relative px-2 py-1.5" ref={wrapperRef}>
            <div 
                className="w-full h-full cursor-pointer flex items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption ? (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedOption.color}`}>
                        {selectedOption.name}
                    </span>
                ) : (
                    <span className="text-slate-300 text-xs">Select...</span>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-48 bg-white border border-slate-200 shadow-lg rounded-md z-20 mt-1 p-1">
                    <input 
                        autoFocus
                        className="w-full text-xs p-1.5 border-b border-slate-100 outline-none mb-1"
                        placeholder="Search or create..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && search) {
                                onCreateOption(search);
                                setIsOpen(false);
                            }
                        }}
                    />
                    <div className="max-h-40 overflow-y-auto">
                        {options.filter(o => o.name.toLowerCase().includes(search.toLowerCase())).map(opt => (
                            <div 
                                key={opt.id}
                                className={`px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-slate-50 flex items-center gap-2 ${value === opt.name ? 'bg-blue-50' : ''}`}
                                onClick={() => { onChange(opt.name); setIsOpen(false); }}
                            >
                                <div className={`w-2 h-2 rounded-full ${opt.color.split(' ')[0].replace('bg-', 'bg-')}`} />
                                {opt.name}
                            </div>
                        ))}
                        {search && !options.some(o => o.name === search) && (
                            <div 
                                className="px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer"
                                onClick={() => { onCreateOption(search); setIsOpen(false); }}
                            >
                                Create "{search}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const MultiSelectCell: React.FC<{ value: string[]; options: SelectOption[]; onChange: (val: string[]) => void; onCreateOption: (val: string) => void }> = ({ value, options, onChange, onCreateOption }) => {
    // Simplified implementation for MVP - normally uses a tagging input
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const listener = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', listener);
        return () => document.removeEventListener('mousedown', listener);
    }, []);

    return (
        <div className="w-full h-full relative px-2 py-1" ref={wrapperRef}>
            <div className="flex flex-wrap gap-1 cursor-pointer min-h-[20px]" onClick={() => setIsOpen(!isOpen)}>
                {value && value.length > 0 ? value.map(val => {
                    const opt = options.find(o => o.name === val);
                    return (
                        <span key={val} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${opt?.color || 'bg-slate-100'}`}>
                            {val}
                        </span>
                    );
                }) : <span className="text-slate-300 text-xs">Empty</span>}
            </div>
            
            {isOpen && (
                <div className="absolute top-full left-0 w-48 bg-white border border-slate-200 shadow-lg rounded-md z-20 mt-1 p-1">
                    <div className="text-[10px] text-slate-400 px-2 py-1">Select options</div>
                    {options.map(opt => (
                        <div 
                            key={opt.id}
                            className={`px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-slate-50 flex justify-between items-center`}
                            onClick={() => {
                                if (value.includes(opt.name)) {
                                    onChange(value.filter(v => v !== opt.name));
                                } else {
                                    onChange([...value, opt.name]);
                                }
                            }}
                        >
                            <span className={`px-1.5 rounded ${opt.color}`}>{opt.name}</span>
                            {value.includes(opt.name) && <CheckSquare size={10} className="text-blue-500" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper components for Relation and Rollup (Simple Mocks for Context)
const RelationCell: React.FC<{ value: string[]; onChange: (v: string[]) => void; onSearch?: (q: string) => Promise<{id: string, title: string}[]> }> = ({ value, onChange, onSearch }) => {
    // Use a simple list display for now
    return (
        <div className="px-2 py-1 flex flex-wrap gap-1 h-full items-center overflow-hidden">
            {value && value.length > 0 ? value.map((id) => (
                <span key={id} className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-xs flex items-center gap-1 border border-orange-100">
                    <File size={10} /> Page
                </span>
            )) : <span className="text-slate-300 text-xs">Empty</span>}
            <button className="text-slate-300 hover:text-slate-500 px-1" onClick={() => {/* Open Picker */}}>
                <Plus size={10} />
            </button>
        </div>
    );
};

const RollupCell: React.FC<{ row: DatabaseRow; column: DatabaseColumn; data: DatabaseData; onGetRowData?: (id: string) => Promise<any> }> = ({ row, column }) => {
    return (
        <div className="px-2 py-1 h-full flex items-center text-xs text-slate-500">
            <Search size={10} className="mr-1" /> Calc...
        </div>
    );
};
