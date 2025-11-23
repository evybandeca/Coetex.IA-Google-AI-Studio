
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  interval: number; // Days until next review
  ease: number;
  dueDate: number; // Timestamp
  sourceBlockId?: string;
}

export interface StrokePoint {
  x: number;
  y: number;
  p: number; // Pressure
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

export type BlockType = 
  | 'text' 
  | 'h1' | 'h2' | 'h3' 
  | 'bullet' | 'number' | 'todo' | 'toggle' 
  | 'quote' | 'divider' | 'callout'
  | 'flashcard' | 'image' | 'loading' | 'sketch' | 'toc' | 'database' | 'audio' | 'linked-database' | 'bread';

export type PropertyType = 
  | 'text' 
  | 'number' 
  | 'select' 
  | 'multi-select' 
  | 'status' 
  | 'date' 
  | 'person' 
  | 'file' 
  | 'checkbox' 
  | 'url' 
  | 'email' 
  | 'phone' 
  | 'formula' 
  | 'relation' 
  | 'rollup' 
  | 'created_time' 
  | 'created_by' 
  | 'last_edited_time' 
  | 'last_edited_by'
  | 'ai-summary' 
  | 'ai-evidence';

export interface SelectOption {
  id: string;
  name: string;
  color: string; // e.g. 'bg-red-100 text-red-800'
}

export interface DatabaseColumn {
  id: string;
  name: string;
  type: PropertyType;
  width?: number;
  options?: SelectOption[]; // For select, multi-select, status
  relationConfig?: {
    targetDatabaseId: string; // In this app, we might use a blockId or assume a global store
  };
  rollupConfig?: {
    relationColumnId: string;
    targetColumnId: string;
    calculation: RollupCalculation;
  };
}

export type RollupCalculation = 
  | 'show_original'
  | 'count_all' 
  | 'count_values' 
  | 'count_unique' 
  | 'count_empty' 
  | 'count_not_empty' 
  | 'percent_empty' 
  | 'percent_not_empty' 
  | 'sum' 
  | 'average' 
  | 'median' 
  | 'min' 
  | 'max' 
  | 'range';

export interface DatabaseRow {
  id: string;
  pageId?: string; // Links to the full page content for this item
  parentId?: string; // For Sub-items
  childrenIds?: string[]; // Optimization for rendering
  dependencies?: string[]; // IDs of rows that block this row
  cells: Record<string, any>; // Keyed by column ID. Value type depends on PropertyType
}

export type DatabaseViewType = 'table' | 'board' | 'list' | 'calendar' | 'gallery';

export interface DatabaseSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface DatabaseFilter {
  columnId: string;
  operator: 'contains' | 'equals' | 'starts_with' | 'is_empty' | 'is_not_empty';
  value: string;
}

export interface DatabaseView {
  id: string;
  name: string;
  type: DatabaseViewType;
  filters: DatabaseFilter[];
  sorts: DatabaseSort[];
  groupBy?: string; // columnId
}

export interface DatabaseData {
  title: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  views: DatabaseView[];
  activeViewId: string;
  isLocked?: boolean;
  templates?: Page[]; // Database Templates
  settings?: {
    showSubItems?: boolean;
    subItemsColumnId?: string; // Which relation column tracks parent/child
    showDependencies?: boolean;
    dependenciesColumnId?: string;
  };
}

export interface LinkedDatabaseMetadata {
  sourcePageId: string;
  sourceBlockId: string;
  filterText: string;
}

// RichText Types
export interface RichTextAnnotation {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

export interface RichTextObject {
  type: 'text';
  text: {
    content: string;
    link: { url: string } | null;
  };
  annotations: RichTextAnnotation;
  plain_text: string;
  href: string | null;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  richContent?: RichTextObject[]; // Added for Rich Text support
  color?: string; // e.g. 'text-red-500' or 'bg-red-100'
  metadata?: any; // Stores flashcard data, image URLs, sketches, DatabaseData, or LinkedDatabaseMetadata
  links?: { text: string; url: string }[]; // For block links
}

export type PatternType = 'none' | 'grid' | 'lines' | 'dots';

export interface Template {
  id: string;
  name: string;
  description: string;
  backgroundPattern: PatternType;
  defaultBlocks: Block[];
}

export interface Page {
  id: string;
  title: string;
  coverImage: string;
  blocks: Block[];
  updatedAt: number;
  backgroundPattern?: PatternType;
  backlinks?: string[]; // IDs of pages linking to this one
  isTemplate?: boolean; // If true, this page serves as a template for database rows
}

export interface Folder {
  id: string;
  name: string;
  type: 'folder' | 'page';
  isOpen?: boolean;
  children?: Folder[]; // Recursive structure
  pageId?: string; // If type is page
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  FLASHCARDS = 'FLASHCARDS',
  SETTINGS = 'SETTINGS'
}

export enum CortexiaMode {
  SUMMARIZE = 'SUMMARIZE',
  FLASHCARD_GEN = 'FLASHCARD_GEN',
  CITATION_CHECK = 'CITATION_CHECK'
}

// --- CORTEXIA CONSULTANT TYPES ---

export interface Citation {
  sourceId: string; // Block ID or Row ID
  sourceType: 'block' | 'database_row';
  label: string; // e.g. "Protocol Table Row 1" or "Text Block"
}

export interface ConsultationResponse {
  answer: string;
  reasoning: string; // Traceable reasoning steps
  citations: Citation[];
  entities: string[]; // Recognized medical entities (drugs, anatomy, etc)
  related_concepts: string[]; // Predictive suggestions
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'cortexia';
  content: string;
  structuredResponse?: ConsultationResponse; // Only present if role is cortexia
  timestamp: number;
  attachments?: string[]; // Base64 images
}
