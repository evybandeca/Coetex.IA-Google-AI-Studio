import React from 'react';
import { RichTextObject } from '../types';

interface RichTextRendererProps {
  content: RichTextObject[];
  className?: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = '' }) => {
  if (!content || content.length === 0) return <span className={className}></span>;

  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {content.map((segment, index) => {
        const { annotations, text, href } = segment;
        const { bold, italic, strikethrough, underline, code, color } = annotations;

        let classNames = '';
        if (bold) classNames += ' font-bold';
        if (italic) classNames += ' italic';
        if (strikethrough) classNames += ' line-through';
        if (underline) classNames += ' underline';
        if (code) classNames += ' font-mono bg-slate-100 text-red-500 px-1 rounded text-[0.9em]';
        
        // Map Notion-style colors to Tailwind classes
        const colorMap: Record<string, string> = {
            'gray': 'text-gray-500',
            'brown': 'text-amber-700',
            'orange': 'text-orange-500',
            'yellow': 'text-yellow-600',
            'green': 'text-green-600',
            'blue': 'text-blue-600',
            'purple': 'text-purple-600',
            'pink': 'text-pink-500',
            'red': 'text-red-600',
            'default': 'text-inherit'
        };

        if (color !== 'default' && !code) { 
             classNames += ` ${colorMap[color] || ''}`;
        }

        if (href) {
            return (
                <a 
                    key={index} 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`text-blue-600 hover:underline ${classNames}`}
                    onClick={(e) => e.stopPropagation()} // Prevent block selection when clicking link
                >
                    {text.content}
                </a>
            );
        }

        return (
            <span key={index} className={classNames}>
                {text.content}
            </span>
        );
      })}
    </span>
  );
};