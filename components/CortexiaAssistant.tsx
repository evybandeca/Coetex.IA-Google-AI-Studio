
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, FileText, Database, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { ChatMessage, Block, Page } from '../types';
import { consultCortexia } from '../services/geminiService';

interface CortexiaAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext: Page;
}

export const CortexiaAssistant: React.FC<CortexiaAssistantProps> = ({ isOpen, onClose, pageContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'cortexia',
      content: `Hello. I am Cortexia, your Medical Knowledge Consultant. I have analyzed the ${pageContext.blocks.length} blocks and structured data on this page. What would you like to query?`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      attachments: selectedImage ? [selectedImage] : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const attachments = imageToSend ? [{ mimeType: 'image/png', data: imageToSend.split(',')[1] }] : [];
      
      const response = await consultCortexia(
        userMsg.content, 
        { title: pageContext.title, blocks: pageContext.blocks },
        attachments
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'cortexia',
        content: response.answer,
        structuredResponse: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-slate-50 border-l border-slate-200 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Sparkles size={16} />
          </div>
          <div>
             <div className="font-bold text-sm">Cortexia Consultant</div>
             <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Context Active
             </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
          <X size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
            }`}>
              
              {/* Attachments */}
              {msg.attachments?.map((att, i) => (
                  <img key={i} src={att} className="max-w-full h-32 object-cover rounded-lg mb-2 border border-white/20" />
              ))}

              {/* Content */}
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Structured Data (Reasoning & Citations) */}
              {msg.structuredResponse && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                  
                  {/* Reasoning Dropdown */}
                  <ReasoningToggle text={msg.structuredResponse.reasoning} />

                  {/* Citations */}
                  {msg.structuredResponse.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.structuredResponse.citations.map((cit, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-medium rounded border border-blue-100 cursor-pointer hover:bg-blue-100">
                           {cit.sourceType === 'database_row' ? <Database size={10} /> : <FileText size={10} />}
                           {cit.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Entities */}
                  {msg.structuredResponse.entities.length > 0 && (
                      <div className="text-[10px] text-slate-400">
                          Detected: {msg.structuredResponse.entities.join(", ")}
                      </div>
                  )}
                </div>
              )}

            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex items-center gap-2 text-slate-400 text-xs ml-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span>Analyzing structured data...</span>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        {selectedImage && (
            <div className="mb-2 inline-flex items-center gap-2 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                <ImageIcon size={12} /> Image attached
                <button onClick={() => setSelectedImage(null)}><X size={12}/></button>
            </div>
        )}
        <div className="relative flex items-center gap-2">
          <button 
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors"
            onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if(file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            }}
          >
             <ImageIcon size={20} />
          </button>
          <input 
            type="text" 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            placeholder="Ask about data, protocols, or notes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() && !selectedImage}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ReasoningToggle: React.FC<{ text: string }> = ({ text }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 mb-1"
            >
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Reasoning Process
            </button>
            {isOpen && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                    {text}
                </div>
            )}
        </div>
    );
};
