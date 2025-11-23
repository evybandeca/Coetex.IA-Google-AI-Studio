
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Page, Block, ViewMode, Flashcard, BlockType, Folder, Template, DatabaseData, LinkedDatabaseMetadata } from './types';
import { Sidebar } from './components/Sidebar';
import { FlashcardReview } from './components/FlashcardReview';
import { SlashMenu } from './components/SlashMenu';
import { DigitalInkCanvas } from './components/DigitalInkCanvas';
import { DatabaseBlock } from './components/DatabaseBlock';
import { AudioRecorderBlock } from './components/AudioRecorderBlock';
import { BlockActionMenu } from './components/BlockActionMenu';
import { Breadcrumbs } from './components/Breadcrumbs';
import { LandingPage } from './components/LandingPage';
import { CortexiaAssistant } from './components/CortexiaAssistant';
import { RichTextRenderer } from './components/RichTextRenderer';
import { generateFlashcardFromText, summarizeText, indexFileContext, refineText, analyzeImage, editImageWithPrompt, indexImageText } from './services/geminiService';
import { parseMarkdown } from './services/markdownParser';
import { Loader2, Clock, Calendar, Image as ImageIcon, X, Camera, LayoutGrid, AlignJustify, Sparkles, ArrowRight, Wand2, Link as LinkIcon, GripVertical, ChevronRight, ChevronDown, Square, CheckSquare, Info, Quote } from 'lucide-react';
import { PageProperties } from './components/PageProperties';

// --- MOCK DATA & TEMPLATES ---
const TEMPLATES: Template[] = [
  { id: 'blank', name: 'Blank Page', description: 'Start from scratch', backgroundPattern: 'none', defaultBlocks: [{ id: 'b1', type: 'text', content: '' }] },
  { id: 'grid', name: 'Graph Paper', description: 'Ideal for diagrams and math', backgroundPattern: 'grid', defaultBlocks: [{ id: 'b1', type: 'text', content: '' }] },
  { id: 'cornell', name: 'Cornell Notes', description: 'Structured note-taking system', backgroundPattern: 'lines', defaultBlocks: [{ id: 'h1', type: 'h1', content: 'Topic' }, { id: 'c1', type: 'h2', content: 'Cues' }, { id: 't1', type: 'text', content: '' }] }
];

const INITIAL_FOLDERS: Folder[] = [
  { id: 'f1', name: 'Medicine', type: 'folder', isOpen: true, children: [{ id: 'p1', name: 'Cardiovascular Physiology', type: 'page', pageId: 'page-1' }, { id: 'p4', name: 'Clinical Protocols', type: 'page', pageId: 'page-4' }] },
  { id: 'p3', name: 'Quick Notes', type: 'page', pageId: 'page-3' }
];

const INITIAL_PAGES: Record<string, Page> = {
  'page-1': {
    id: 'page-1',
    title: 'Cardiovascular Physiology',
    coverImage: 'https://picsum.photos/1200/250',
    updatedAt: Date.now(),
    backgroundPattern: 'none',
    blocks: [
      { id: 'toc1', type: 'toc', content: '', richContent: [] },
      { id: 'b1', type: 'h1', content: 'The Cardiac Cycle', richContent: parseMarkdown('The Cardiac Cycle') },
      { id: 'b2', type: 'text', content: 'The **cardiac cycle** describes the sequence of events that occur when the heart beats.', richContent: parseMarkdown('The **cardiac cycle** describes the sequence of events that occur when the heart beats.') },
      { id: 'call1', type: 'callout', content: 'Remember: Systole = Contraction, Diastole = Relaxation', richContent: parseMarkdown('Remember: Systole = Contraction, Diastole = Relaxation') },
      { id: 'b3', type: 'h2', content: 'Phases', richContent: parseMarkdown('Phases') },
      { id: 'l1', type: 'bullet', content: 'Atrial Systole', richContent: parseMarkdown('Atrial Systole') },
      { id: 'l2', type: 'bullet', content: 'Isovolumetric Contraction', richContent: parseMarkdown('Isovolumetric Contraction') },
      { id: 'l3', type: 'bullet', content: 'Ventricular Ejection', richContent: parseMarkdown('Ventricular Ejection') }
    ]
  },
  'page-3': { id: 'page-3', title: 'Quick Notes', coverImage: '', updatedAt: Date.now(), backgroundPattern: 'dots', blocks: [{ id: 'b1', type: 'text', content: '', richContent: [] }] },
  'page-4': {
    id: 'page-4', title: 'Clinical Protocols', coverImage: '', updatedAt: Date.now(), backgroundPattern: 'none',
    blocks: [
       { id: 'h1', type: 'h1', content: 'Department Protocols', richContent: parseMarkdown('Department Protocols') },
       { 
         id: 'db1', 
         type: 'database', 
         content: '', 
         metadata: { 
           title: 'Protocols Database', 
           settings: {
             showSubItems: true,
             showDependencies: true
           },
           columns: [
             { id: 'c1', name: 'Protocol Name', type: 'text' }, 
             { id: 'c_status', name: 'Status', type: 'status', options: [{id:'o1', name:'To Do', color:'bg-slate-100 text-slate-700'}, {id:'o2', name:'In Progress', color:'bg-blue-100 text-blue-700'}, {id:'o3', name:'Done', color:'bg-green-100 text-green-700'}] },
             { id: 'c3', name: 'Department', type: 'select', options: [{id:'d1', name:'Cardiology', color:'bg-red-100 text-red-700'}, {id:'d2', name:'Neurology', color:'bg-purple-100 text-purple-700'}] }, 
             { id: 'c4', name: 'Last Updated', type: 'date' },
             { id: 'c5', name: 'Assignee', type: 'person' },
             { id: 'c6', name: 'Evidence', type: 'ai-evidence' }
           ], 
           rows: [
             { id: 'r1', pageId: 'sub-p1', cells: { 'c1': 'Acute STEMI Management', 'c_status': 'Done', 'c3': 'Cardiology', 'c4': '2025-02-20', 'c6': 'Level I' } },
             { id: 'r2', pageId: 'sub-p2', cells: { 'c1': 'Stroke Code', 'c_status': 'In Progress', 'c3': 'Neurology', 'c4': '2025-02-22', 'c5': 'Dr. Smith' } },
             // Sub-items example
             { id: 'r3', pageId: 'sub-p3', cells: { 'c1': 'Protocol Review', 'c_status': 'To Do' }, childrenIds: ['r3-1', 'r3-2'] },
             { id: 'r3-1', parentId: 'r3', cells: { 'c1': 'Draft Revision', 'c_status': 'To Do' } },
             { id: 'r3-2', parentId: 'r3', cells: { 'c1': 'Approval Meeting', 'c_status': 'To Do' }, dependencies: ['r3-1'] }
           ],
           views: [
             { id: 'v1', name: 'All Protocols', type: 'table', filters: [], sorts: [] },
             { id: 'v2', name: 'Board', type: 'board', filters: [], sorts: [] },
             { id: 'v3', name: 'List', type: 'list', filters: [], sorts: [] }
           ],
           activeViewId: 'v1',
           templates: [
               {
                   id: 't1', title: 'New Protocol Template', isTemplate: true, coverImage: '', updatedAt: Date.now(),
                   blocks: [
                       { id: 'b1', type: 'h1', content: 'Objective', richContent: parseMarkdown('Objective') },
                       { id: 'b2', type: 'text', content: 'Define the primary goal of this protocol.', richContent: parseMarkdown('Define the primary goal of this protocol.') },
                       { id: 'b3', type: 'h2', content: 'Procedure', richContent: parseMarkdown('Procedure') },
                       { id: 'b4', type: 'bullet', content: 'Step 1', richContent: parseMarkdown('Step 1') }
                   ]
               }
           ]
         } as DatabaseData 
       }
    ]
  },
  'sub-p1': { id: 'sub-p1', title: 'Acute STEMI Management', coverImage: '', updatedAt: Date.now(), blocks: [{ id: 'b1', type: 'text', content: 'Detailed protocol steps...', richContent: parseMarkdown('Detailed protocol steps...') }] },
  'sub-p2': { id: 'sub-p2', title: 'Stroke Code', coverImage: '', updatedAt: Date.now(), blocks: [{ id: 'b1', type: 'text', content: 'tPA administration guidelines...', richContent: parseMarkdown('tPA administration guidelines...') }] },
  'sub-p3': { id: 'sub-p3', title: 'Protocol Review', coverImage: '', updatedAt: Date.now(), blocks: [{ id: 'b1', type: 'text', content: 'Review cycle...', richContent: parseMarkdown('Review cycle...') }] }
};

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.EDITOR);
  const [folders, setFolders] = useState<Folder[]>(INITIAL_FOLDERS);
  const [pages, setPages] = useState<Record<string, Page>>(INITIAL_PAGES);
  const [activePageId, setActivePageId] = useState<string>('page-1');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false); 
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [slashMenuPos, setSlashMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [activeSlashBlockId, setActiveSlashBlockId] = useState<string | null>(null);
  
  // Drag and Drop State
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const [blockMenuPos, setBlockMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [activeBlockMenuId, setActiveBlockMenuId] = useState<string | null>(null);
  const [sidePeekPageId, setSidePeekPageId] = useState<string | null>(null);
  const [aiInput, setAiInput] = useState<{ blockId: string, top: number, left: number } | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [creatingParentId, setCreatingParentId] = useState<string | undefined>(undefined);

  const getPage = (id: string) => pages[id];
  const currentPage = getPage(activePageId);

  // Auto-save
  useEffect(() => {
    const handler = setTimeout(() => setLastSaved(Date.now()), 500);
    return () => clearTimeout(handler);
  }, [pages]);

  // --- NAVIGATION LOGIC ---
  const getBreadcrumbPath = (nodes: Folder[], targetPageId: string): Folder[] | null => {
    for (const node of nodes) {
      if (node.type === 'page' && node.pageId === targetPageId) {
        return [node];
      }
      if (node.children) {
        const childPath = getBreadcrumbPath(node.children, targetPageId);
        if (childPath) {
          return [node, ...childPath];
        }
      }
    }
    return null;
  };

  const breadcrumbs = useMemo(() => {
    return getBreadcrumbPath(folders, activePageId) || [];
  }, [folders, activePageId]);

  const handleToggleFolder = useCallback((folderId: string) => {
    const toggle = (items: Folder[]): Folder[] => {
      return items.map(item => {
        if (item.id === folderId) {
          return { ...item, isOpen: !item.isOpen };
        }
        if (item.children) {
          return { ...item, children: toggle(item.children) };
        }
        return item;
      });
    };
    setFolders(prev => toggle(prev));
  }, []);

  const handleCreatePage = useCallback((parentId?: string) => {
     const newPageId = Math.random().toString(36).substr(2, 9);
     const newPage: Page = {
         id: newPageId,
         title: 'Untitled',
         coverImage: '',
         blocks: [{ id: Math.random().toString(36).substr(2, 9), type: 'text', content: '', richContent: [] }],
         updatedAt: Date.now(),
         backgroundPattern: 'none'
     };
     
     setPages(prev => ({ ...prev, [newPageId]: newPage }));

     const addItem = (items: Folder[]): Folder[] => {
         if (!parentId) {
             // Add to root if no parent
             return [...items, { id: Math.random().toString(36).substr(2, 9), name: 'Untitled', type: 'page', pageId: newPageId }];
         }
         return items.map(item => {
             if (item.id === parentId && item.type === 'folder') {
                 return {
                     ...item,
                     isOpen: true,
                     children: [...(item.children || []), { id: Math.random().toString(36).substr(2, 9), name: 'Untitled', type: 'page', pageId: newPageId }]
                 };
             }
             if (item.children) {
                 return { ...item, children: addItem(item.children) };
             }
             return item;
         });
     };

     if (!parentId) {
        setFolders(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: 'Untitled', type: 'page', pageId: newPageId }]);
     } else {
        setFolders(prev => addItem(prev));
     }
     
     setActivePageId(newPageId);
  }, []);

  const handleCreateFolder = useCallback((parentId?: string) => {
      const newFolderId = Math.random().toString(36).substr(2, 9);
      const newFolder: Folder = {
          id: newFolderId,
          name: 'New Folder',
          type: 'folder',
          isOpen: true,
          children: []
      };

      if (!parentId) {
          setFolders(prev => [...prev, newFolder]);
      } else {
          const addItem = (items: Folder[]): Folder[] => {
             return items.map(item => {
                 if (item.id === parentId && item.type === 'folder') {
                     return { ...item, isOpen: true, children: [...(item.children || []), newFolder] };
                 }
                 if (item.children) {
                     return { ...item, children: addItem(item.children) };
                 }
                 return item;
             });
          };
          setFolders(prev => addItem(prev));
      }
  }, []);

  const updatePage = (pageId: string, newPageData: Page) => setPages(prev => ({ ...prev, [pageId]: newPageData }));
  
  const updateBlock = (pageId: string, id: string, content: string, type?: BlockType, metadata?: any, color?: string) => {
    const page = pages[pageId];
    if (!page) return;
    
    const richContent = parseMarkdown(content);

    const newBlocks = page.blocks.map(b => {
      if (b.id === id) {
        return { 
          ...b, 
          content: content !== undefined ? content : b.content, 
          richContent: content !== undefined ? richContent : b.richContent,
          type: type || b.type, 
          metadata: metadata !== undefined ? metadata : b.metadata,
          color: color !== undefined ? color : b.color
        };
      }
      return b;
    });
    updatePage(pageId, { ...page, blocks: newBlocks });
  };

  const addBlock = (pageId: string, afterId: string, type: Block['type'] = 'text', content = '', metadata?: any) => {
    const page = pages[pageId];
    if (!page) return;
    const newBlock: Block = { 
        id: Math.random().toString(36).substr(2, 9), 
        type, 
        content, 
        richContent: parseMarkdown(content),
        metadata 
    };
    const index = page.blocks.findIndex(b => b.id === afterId);
    const newBlocks = [...page.blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    updatePage(pageId, { ...page, blocks: newBlocks });
    return newBlock.id;
  };

  const deleteBlock = (pageId: string, id: string) => {
    const page = pages[pageId];
    if (!page) return;
    const newBlocks = page.blocks.filter(b => b.id !== id);
    updatePage(pageId, { ...page, blocks: newBlocks });
  };

  const duplicateBlock = (pageId: string, id: string) => {
    const page = pages[pageId];
    if (!page) return;
    const index = page.blocks.findIndex(b => b.id === id);
    const block = page.blocks[index];
    const newBlock = { ...block, id: Math.random().toString(36).substr(2, 9) };
    const newBlocks = [...page.blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    updatePage(pageId, { ...page, blocks: newBlocks });
  };

  const handleCreateRow = (rowId: string, templateId?: string) => {
      const newPageId = Math.random().toString(36).substr(2, 9);
      let newPage: Page = {
          id: newPageId,
          title: 'Untitled',
          coverImage: '',
          blocks: [{ id: Math.random().toString(36).substr(2, 9), type: 'text', content: '', richContent: [] }],
          updatedAt: Date.now(),
          backgroundPattern: 'none'
      };

      if (templateId) {
          const page = pages[activePageId];
          const dbBlock = page.blocks.find(b => b.type === 'database');
          if (dbBlock?.metadata?.templates) {
              const template = dbBlock.metadata.templates.find((t: Page) => t.id === templateId);
              if (template) {
                  newPage = {
                      ...template,
                      id: newPageId,
                      title: 'Untitled',
                      isTemplate: false,
                      blocks: template.blocks.map(b => ({...b, id: Math.random().toString(36).substr(2, 9)}))
                  };
              }
          }
      }
      setPages(prev => ({ ...prev, [newPageId]: newPage }));

      // Link row to page
      const page = pages[activePageId];
      const dbBlock = page.blocks.find(b => b.type === 'database');
      if (dbBlock && dbBlock.metadata) {
          const newData = { ...dbBlock.metadata };
          const rowIndex = newData.rows.findIndex((r: any) => r.id === rowId);
          if (rowIndex !== -1) {
              newData.rows[rowIndex].pageId = newPageId;
              updateBlock(activePageId, dbBlock.id, '', 'database', newData);
          }
      }
      setSidePeekPageId(newPageId);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    e.dataTransfer.setData('text/plain', blockId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedBlockId(blockId);
  };

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    if (draggedBlockId === blockId) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    
    const position = e.clientY < midY ? 'before' : 'after';
    setDropTargetId(blockId);
    setDropPosition(position);
  };

  const handleDrop = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    setDraggedBlockId(null);
    setDropTargetId(null);
    setDropPosition(null);

    if (!draggedBlockId || !dropTargetId || draggedBlockId === dropTargetId) return;

    const page = pages[targetPageId];
    const newBlocks = [...page.blocks];
    const dragIndex = newBlocks.findIndex(b => b.id === draggedBlockId);
    const dropIndex = newBlocks.findIndex(b => b.id === dropTargetId);

    if (dragIndex < 0 || dropIndex < 0) return;

    const [movedBlock] = newBlocks.splice(dragIndex, 1);
    
    let actualDropIndex = dropIndex;
    if (dragIndex < dropIndex) actualDropIndex--; 

    if (dropPosition === 'after') {
        actualDropIndex++;
    }
    
    newBlocks.splice(actualDropIndex, 0, movedBlock);
    updatePage(targetPageId, { ...page, blocks: newBlocks });
  };

  const handleBlockAction = (action: string) => {
    if (!activeBlockMenuId) return;
    const pageId = activePageId; 
    
    if (action === 'delete') {
        deleteBlock(pageId, activeBlockMenuId);
    } else if (action === 'duplicate') {
        duplicateBlock(pageId, activeBlockMenuId);
    } else {
        const block = pages[pageId].blocks.find(b => b.id === activeBlockMenuId);
        if (block) {
            if (action.startsWith('bg-') || ['red', 'blue', 'green', 'default'].includes(action)) {
                 updateBlock(pageId, block.id, block.content, undefined, undefined, action === 'default' ? undefined : action);
            } else {
                 updateBlock(pageId, block.id, block.content, action as BlockType);
            }
        }
    }
    setBlockMenuPos(null);
    setActiveBlockMenuId(null);
  };

  const handleSlashCommand = (command: string) => {
    if (!activeSlashBlockId) return;
    const page = pages[activePageId];
    const block = page.blocks.find(b => b.id === activeSlashBlockId);
    if (!block) return;

    const simpleUpdate = (type: BlockType) => {
        updateBlock(activePageId, block.id, '', type);
    };

    if (['h1', 'h2', 'h3', 'bullet', 'number', 'todo', 'toggle', 'quote', 'callout', 'divider', 'image', 'sketch', 'audio', 'toc', 'bread'].includes(command)) {
        simpleUpdate(command as BlockType);
    } else if (command === 'text') {
        simpleUpdate('text');
    } else if (command === 'database') {
         const newDB: DatabaseData = { 
           title: 'Untitled Database', 
           columns: [
             { id: 'c1', name: 'Name', type: 'text' }, 
             { id: 'c2', name: 'Tags', type: 'multi-select', options: [] }
           ], 
           rows: [
             { id: 'r1', cells: {} },
             { id: 'r2', cells: {} },
             { id: 'r3', cells: {} }
           ], 
           views: [
             { id: 'v1', name: 'Table', type: 'table', filters: [], sorts: [] }
           ], 
           activeViewId: 'v1'
         };
         updateBlock(activePageId, block.id, '', 'database', newDB);
    } else if (command === 'flashcard') {
         simpleUpdate('flashcard');
    } else if (command === 'ai') {
         setIsAssistantOpen(true);
    } else if (command === 'delete') {
        deleteBlock(activePageId, block.id);
    } else if (command === 'duplicate') {
        duplicateBlock(activePageId, block.id);
    } else if (['red', 'blue', 'green', 'bg-yellow', 'bg-red', 'bg-blue'].includes(command)) {
         updateBlock(activePageId, block.id, block.content, undefined, undefined, command);
    } else if (command === 'new') {
         simpleUpdate('text');
    }

    setSlashMenuPos(null);
    setActiveSlashBlockId(null);
  };

  // --- BLOCK RENDERER ---
  const renderBlockContent = (block: Block, pageId: string) => {
    const isFocused = focusedBlockId === block.id;
    const baseInputClass = `w-full bg-transparent outline-none resize-none ${block.color || 'text-slate-700'}`;
    
    const localUpdate = (content: string, type?: BlockType, meta?: any, color?: string) => updateBlock(pageId, block.id, content, type, meta, color);
    
    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const nextType = ['bullet', 'number', 'todo'].includes(block.type) ? block.type : 'text';
            addBlock(pageId, block.id, nextType);
        }
        if (e.key === 'Backspace' && block.content === '') {
            e.preventDefault();
            deleteBlock(pageId, block.id);
        }
        if (e.key === '/') {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            setSlashMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
            setActiveSlashBlockId(block.id);
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        localUpdate(e.target.value);
    };

    const TextContent = () => {
        if (isFocused) {
             return (
                <textarea 
                    autoFocus 
                    rows={1} 
                    className={`${baseInputClass} leading-7 min-h-[1.5rem]`} 
                    value={block.content} 
                    onChange={onChange} 
                    onKeyDown={onKey} 
                    onBlur={() => setFocusedBlockId(null)}
                    placeholder={block.type === 'text' ? "Type '/' for commands..." : `Heading`}
                />
             );
        } else {
             return (
                <div 
                    className={`min-h-[1.5rem] leading-7 cursor-text ${!block.content ? 'text-slate-300' : ''}`} 
                    onClick={() => setFocusedBlockId(block.id)}
                >
                    {block.content ? <RichTextRenderer content={block.richContent || []} /> : (block.type === 'text' ? "Type '/' for commands..." : "Heading")}
                </div>
             );
        }
    };

    switch (block.type) {
      case 'h1':
        return <div className={`text-4xl font-bold mb-2 mt-4 ${block.color || 'text-slate-800'}`}><TextContent /></div>;
      case 'h2':
        return <div className={`text-2xl font-semibold mb-2 mt-4 border-b border-slate-100 pb-1 ${block.color || 'text-slate-800'}`}><TextContent /></div>;
      case 'h3':
        return <div className={`text-xl font-medium mb-1 mt-2 ${block.color || 'text-slate-800'}`}><TextContent /></div>;
      case 'bullet':
        return (
          <div className="flex items-start gap-2 my-1">
            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <div className="flex-1"><TextContent /></div>
          </div>
        );
      case 'number':
        return (
          <div className="flex items-start gap-2 my-1">
            <span className="mt-0.5 font-medium text-slate-500 select-none">1.</span>
            <div className="flex-1"><TextContent /></div>
          </div>
        );
      case 'todo':
        return (
          <div className="flex items-start gap-3 my-1 group">
             <button className={`mt-1 shrink-0 text-slate-400 hover:text-blue-500 ${block.metadata?.checked ? 'text-blue-500' : ''}`} onClick={() => localUpdate(block.content, 'todo', { checked: !block.metadata?.checked })}>
                {block.metadata?.checked ? <CheckSquare size={18} /> : <Square size={18} />}
             </button>
             <div className={`flex-1 ${block.metadata?.checked ? 'line-through text-slate-400' : ''}`}><TextContent /></div>
          </div>
        );
      case 'toggle':
        const isOpen = block.metadata?.isOpen;
        return (
          <div className="flex items-start gap-1 my-1">
            <button 
                className={`mt-1 p-0.5 text-slate-400 hover:bg-slate-100 rounded shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                onClick={() => localUpdate(block.content, 'toggle', { ...block.metadata, isOpen: !isOpen })}
            >
                <ChevronRight size={18} />
            </button>
            <div className="flex-1">
                <div className="font-medium"><TextContent /></div>
                {isOpen && (
                    <div className="pl-4 mt-1 border-l border-slate-100 ml-1.5">
                        {/* Placeholder for nested content logic. In a full implementation, recursive render here */}
                        <div className="text-xs text-slate-400 italic">Nested content support coming soon</div>
                    </div>
                )}
            </div>
          </div>
        );
      case 'quote':
        return (
          <div className="flex gap-4 my-2 pl-4 border-l-4 border-slate-900 italic text-slate-700">
            <Quote size={24} className="text-slate-300 shrink-0" />
            <div className="flex-1"><TextContent /></div>
          </div>
        );
      case 'callout':
        return (
          <div className={`flex gap-3 p-4 bg-slate-50 rounded-md border border-slate-200 my-2 ${block.color}`}>
            <Info size={20} className="text-blue-500 shrink-0" />
            <div className="flex-1 font-medium"><TextContent /></div>
          </div>
        );
      case 'divider':
        return <hr className="my-4 border-t border-slate-200" />;
      case 'image':
        return (
             <div className="my-2 h-[250px] w-full bg-slate-100 rounded-lg overflow-hidden relative group">
                 {block.content ? (
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${block.content}')` }} />
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <ImageIcon size={32} className="mb-2 opacity-50" />
                        <span className="text-sm">Add an image</span>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => {
                              if (e.target.files?.[0]) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                      const result = ev.target?.result as string;
                                      localUpdate(result);
                                      indexImageText(result.split(',')[1]); 
                                  };
                                  reader.readAsDataURL(e.target.files[0]);
                              }
                           }}
                        />
                    </div>
                 )}
                 {block.content && (
                     <button className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setAiInput({ blockId: block.id, top: 0, left: 0 })}>
                        <Wand2 size={12} /> AI Edit
                     </button>
                 )}
             </div>
        );
      case 'database':
        return (
            <DatabaseBlock 
                data={block.metadata} 
                onUpdate={(d) => localUpdate('', 'database', d)} 
                onCreateRow={(rowId, templateId) => {
                    handleCreateRow(rowId, templateId);
                }}
            />
        );
      case 'sketch':
        return <DigitalInkCanvas height={300} backgroundPattern={pages[pageId].backgroundPattern} />;
      case 'audio':
        return <AudioRecorderBlock onTranscribe={(txt) => localUpdate(txt, 'text')} />;
      case 'toc':
        const pageBlocks = pages[pageId]?.blocks || [];
        const headings = pageBlocks.filter(b => ['h1', 'h2', 'h3'].includes(b.type));
        return (
            <div className="my-4 p-4 bg-slate-50 rounded-lg border border-slate-200 select-none">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Table of Contents</div>
                {headings.length === 0 ? <div className="text-sm text-slate-400 italic">Add headings to see them here.</div> : (
                    <div className="space-y-1">
                        {headings.map(h => (
                            <div key={h.id} className={`text-sm text-slate-600 truncate ${h.type === 'h2' ? 'ml-4' : h.type === 'h3' ? 'ml-8' : ''}`}>{h.content || 'Untitled'}</div>
                        ))}
                    </div>
                )}
            </div>
        );
      case 'bread':
        const path = getBreadcrumbPath(folders, pageId);
        return (
           <div className="my-2 p-2 bg-slate-50 rounded border border-slate-100">
              {path ? <Breadcrumbs path={path} onNavigate={setActivePageId} /> : <span className="text-sm text-slate-400 italic">Location: / {pages[pageId]?.title}</span>}
           </div>
        );
      case 'text':
      default:
        return <div className="min-h-[1.5rem]"><TextContent /></div>;
    }
  };

  if (showLanding) return <LandingPage onGetStarted={() => setShowLanding(false)} />;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeView={activeView} onChangeView={setActiveView} flashcardCount={flashcards.length} folders={folders}
        onSelectPage={(id) => { setActivePageId(id); setSidePeekPageId(null); }}
        onCreateFolder={handleCreateFolder} 
        onCreatePage={handleCreatePage} 
        onToggleFolder={handleToggleFolder} 
        activePageId={activePageId}
        onDuplicatePage={() => {}} onDeletePage={() => {}}
      />
      
      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-0' : 'ml-64'} ${isAssistantOpen ? 'mr-[400px]' : 'mr-0'} bg-white relative flex`}>
        <div className={`flex-1 min-w-0 transition-all ${sidePeekPageId ? 'w-[50%] border-r border-slate-200' : 'w-full'}`}>
            {activeView === ViewMode.EDITOR && currentPage ? (
            <div className="max-w-4xl mx-auto px-16 py-12 min-h-screen">
                <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
                    <button onClick={() => setIsAssistantOpen(!isAssistantOpen)} className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                        <Sparkles size={16} /> <span className="text-xs font-bold">Cortexia</span>
                    </button>
                </div>
                <Breadcrumbs path={breadcrumbs} onNavigate={setActivePageId} />
                <div className="group mb-8 relative">
                    <div className="text-5xl mb-4">📄</div>
                    <input value={currentPage.title} onChange={e => updatePage(activePageId, {...currentPage, title: e.target.value})} className="text-4xl font-bold w-full outline-none placeholder-slate-200" placeholder="Untitled" />
                </div>
                
                <div className="space-y-1 pb-32">
                    {currentPage.blocks.map(block => (
                        <div 
                            key={block.id} 
                            className={`relative group/block pl-6 -ml-6 transition-all duration-200 ${dropTargetId === block.id ? (dropPosition === 'before' ? 'border-t-2 border-blue-400' : 'border-b-2 border-blue-400') : ''}`}
                            onDragOver={(e) => handleDragOver(e, block.id)}
                            onDrop={(e) => handleDrop(e, activePageId)}
                        >
                            {/* Draggable Handle - Only THIS element is draggable */}
                            <div 
                                className="absolute left-0 top-1.5 opacity-0 group-hover/block:opacity-100 cursor-grab p-0.5 text-slate-300 hover:text-slate-600 flex items-center z-10"
                                draggable
                                onDragStart={(e) => handleDragStart(e, block.id)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                    setBlockMenuPos({ top: rect.bottom, left: rect.left });
                                    setActiveBlockMenuId(block.id);
                                }}
                            >
                                <GripVertical size={16}/>
                            </div>

                            {renderBlockContent(block, activePageId)}
                        </div>
                    ))}
                    <div className="h-32 cursor-text" onClick={() => addBlock(activePageId, currentPage.blocks[currentPage.blocks.length-1]?.id || 'title')} />
                </div>
            </div>
            ) : <div className="flex items-center justify-center h-screen text-slate-400">Select a page</div>}
        </div>

        {/* SIDE PEEK */}
        {sidePeekPageId && pages[sidePeekPageId] && (
            <div className="w-[50%] h-screen sticky top-0 bg-white shadow-xl z-30 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
                {pages[sidePeekPageId].isTemplate && (
                    <div className="bg-yellow-50 px-4 py-2 text-xs text-yellow-700 border-b border-yellow-100 flex items-center justify-center">
                        You're editing a template in Protocols Database
                    </div>
                )}
                <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20">
                    <span className="truncate max-w-[200px] text-sm text-slate-500">{pages[sidePeekPageId].title}</span>
                    <button onClick={() => setSidePeekPageId(null)} className="p-1 hover:bg-slate-100 rounded"><X size={18} /></button>
                </div>
                
                {/* Page Properties for DB Rows */}
                {/* In a real app we would find the parent DB to pass the schema */}
                <div className="px-8 pt-6 pb-2 bg-white">
                   <div className="text-3xl font-bold mb-6 outline-none" contentEditable onBlur={(e) => updatePage(sidePeekPageId, { ...pages[sidePeekPageId], title: e.currentTarget.textContent || '' })} suppressContentEditableWarning>{pages[sidePeekPageId].title}</div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-20">
                     <div className="space-y-1 pb-20">
                        {pages[sidePeekPageId].blocks.map(block => (
                            <div key={block.id} className="relative group/block pl-6 -ml-6">
                                {renderBlockContent(block, sidePeekPageId)}
                            </div>
                        ))}
                        <div className="h-32 cursor-text" onClick={() => addBlock(sidePeekPageId, pages[sidePeekPageId].blocks[pages[sidePeekPageId].blocks.length-1]?.id || 'title')} />
                     </div>
                </div>
            </div>
        )}

        {slashMenuPos && <SlashMenu position={slashMenuPos} onSelect={handleSlashCommand} onClose={() => setSlashMenuPos(null)} />}
        {blockMenuPos && <BlockActionMenu position={blockMenuPos} onSelect={handleBlockAction} onClose={() => setBlockMenuPos(null)} />}
        <CortexiaAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} pageContext={currentPage} />
        
        {showTemplateModal && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-96">
                 <h3 className="font-bold mb-4">New Page</h3>
                 <button className="w-full text-left p-2 hover:bg-slate-100 rounded transition-colors" onClick={() => {
                     // Uses same logic as generic create page
                     handleCreatePage();
                     setShowTemplateModal(false);
                 }}>Blank Page</button>
                 <button onClick={() => setShowTemplateModal(false)} className="mt-4 text-xs text-slate-400 hover:text-slate-600">Cancel</button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
