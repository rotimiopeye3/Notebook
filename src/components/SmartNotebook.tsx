import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clipboard, 
  Code, 
  Type, 
  Trash2, 
  Sparkles, 
  ChevronRight,
  Terminal,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import hljs from 'highlight.js';
import { parseContent, type ContentBlock } from '../lib/parser';
import { cn } from '../lib/utils';

export default function SmartNotebook() {
  const [input, setInput] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      processText(pastedText);
    }
  };

  const processText = (text: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      const newBlocks = parseContent(text);
      setBlocks(newBlocks);
      setIsProcessing(false);
    }, 400);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearNotebook = () => {
    setBlocks([]);
    setInput('');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-bg text-text">
      {/* Header */}
      <header className="h-[60px] border-b border-border flex items-center justify-between px-6 bg-surface sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-accent rounded flex items-center justify-center font-bold text-white text-sm">
            S
          </div>
          <h1 className="text-[1.1rem] font-bold tracking-[-0.5px] text-text">Syntactical Notebook</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={clearNotebook}
            className="px-4 py-2 border border-border rounded-md text-[0.85rem] font-medium bg-surface text-text hover:bg-border transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => processText(input)}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-accent border border-white/10 rounded-md text-[0.85rem] font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </motion.div>
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Analyze Blocks
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-60px-32px)]">
        {/* Input Section */}
        <section className="w-full lg:w-[45%] border-r border-border flex flex-col bg-bg">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-code-bg">
            <div className="text-[0.75rem] font-semibold text-text-dim uppercase tracking-[1px]">
              Paste Area
            </div>
            <div className="text-[0.75rem] text-text-dim/60">
              Ctrl+V to auto-detect
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value === '') setBlocks([]);
            }}
            onPaste={handlePaste}
            placeholder="Paste your text and code here..."
            className="flex-1 p-5 bg-transparent resize-none focus:outline-none font-sans text-[0.95rem] leading-[1.6] placeholder:text-text-dim/30"
          />
        </section>

        {/* Output Section */}
        <section className="flex-1 overflow-y-auto bg-[#080a0d] p-5 lg:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/50">
               <div className="text-[0.75rem] font-semibold text-text-dim uppercase tracking-[1px]">
                Parsed Results
              </div>
              <div className="text-[0.75rem] text-text-dim/60">
                {blocks.length} Blocks Detected
              </div>
            </div>

            {blocks.length === 0 ? (
              <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <FileText className="w-12 h-12" />
                <div>
                  <h3 className="text-lg font-medium">No content analyzed</h3>
                  <p className="text-sm max-w-xs mx-auto">
                    Paste content in the left pane to begin.
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {blocks.map((block, index) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: index * 0.03 }}
                    className="group"
                  >
                    {block.type === 'code' ? (
                      <div className="mb-6 border border-border rounded-lg overflow-hidden bg-code-bg">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-code-header">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[0.7rem] text-[#58a6ff] uppercase font-bold bg-[#58a6ff]/10 px-2 py-0.5 rounded">
                              {block.language}
                            </span>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(block.content, block.id)}
                            className="p-1 hover:bg-white/5 rounded transition-colors text-text-dim hover:text-text"
                          >
                            {copiedId === block.id ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto font-mono text-[0.85rem] leading-[1.5]">
                          <code 
                            className={cn("hljs", `language-${block.language}`)}
                            dangerouslySetInnerHTML={{ 
                              __html: hljs.highlight(block.content, { language: block.language || 'plaintext' }).value 
                            }}
                          />
                        </pre>
                      </div>
                    ) : (
                      <div className="mb-6 text-text text-[0.95rem] leading-[1.6] prose prose-invert max-w-none">
                        <ReactMarkdown>{block.content}</ReactMarkdown>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </main>
      
      {/* Footer Status */}
      <footer className="h-8 border-t border-border bg-surface flex items-center px-4 justify-between text-[0.7rem] text-text-dim">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent" />
            Auto-detection: Active
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3" />
            Pygments Engine v2.17
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>Workspace: Personal Notes</span>
          <div className="h-3 w-px bg-border" />
          <span>{isProcessing ? 'Processing...' : 'Ready'}</span>
        </div>
      </footer>
    </div>
  );
}
