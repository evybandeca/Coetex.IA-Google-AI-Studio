import { RichTextObject, RichTextAnnotation } from '../types';

/**
 * Parses a raw string with Markdown-like syntax into an array of Notion-style RichTextObjects.
 * Supports: **bold**, *italic*, ~strike~, `code`, and [link](url).
 */
export const parseMarkdown = (text: string): RichTextObject[] => {
  const result: RichTextObject[] = [];
  
  // Regex for tokens: Link | Bold | Italic | Strike | Code
  // Captures: [text](url), **bold**, *italic*, ~strike~, `code`
  const tokenRegex = /(\[(?:\[??[^[\]]*?\])\]\([^)]+\)|(\*\*)(?=\S)([\s\S]*?\S)\2|(\*)(?=\S)([\s\S]*?\S)\4|(\~)(?=\S)([\s\S]*?\S)\6|(`)(?=\S)([\s\S]*?\S)\8)/g;
  
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Push plain text appearing before the match
    if (match.index > lastIndex) {
      result.push(createRichText(text.substring(lastIndex, match.index)));
    }

    const fullMatch = match[0];
    const isLink = fullMatch.startsWith('[');
    const isBold = fullMatch.startsWith('**');
    const isItalic = fullMatch.startsWith('*') && !isBold;
    const isStrike = fullMatch.startsWith('~');
    const isCode = fullMatch.startsWith('`');

    const annotations: RichTextAnnotation = {
      bold: isBold,
      italic: isItalic,
      strikethrough: isStrike,
      underline: false,
      code: isCode,
      color: 'default'
    };

    if (isLink) {
      // Extract link parts: [text](url)
      const linkMatch = fullMatch.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const content = linkMatch[1];
        const url = linkMatch[2];
        result.push(createRichText(content, annotations, url));
      } else {
        result.push(createRichText(fullMatch)); // Fallback if parse fails
      }
    } else {
      // Extract content inside markers
      // Group 3 for bold, 5 for italic, 7 for strike, 9 for code
      const content = match[3] || match[5] || match[7] || match[9];
      result.push(createRichText(content, annotations));
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Push remaining text after the last match
  if (lastIndex < text.length) {
    result.push(createRichText(text.substring(lastIndex)));
  }

  return result;
};

const createRichText = (
  content: string, 
  annotations: Partial<RichTextAnnotation> = {}, 
  url: string | null = null
): RichTextObject => {
  return {
    type: 'text',
    text: {
      content: content,
      link: url ? { url } : null
    },
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: 'default',
      ...annotations
    },
    plain_text: content,
    href: url
  };
};