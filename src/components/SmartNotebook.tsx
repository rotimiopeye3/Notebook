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
    // Simulate a small delay for "processing" feel
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
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0D1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white">Smart Notebook</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {blocks.length > 0 && (
            <button 
              onClick={clearNotebook}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
          <div className="h-4 w-px bg-white/10" />
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            v1.0.0
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Input Section */}
        <section className="w-full lg:w-1/3 border-r border-white/10 flex flex-col bg-[#0D1117]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
              <Clipboard className="w-3.5 h-3.5" />
              Input Buffer
            </div>
            {isProcessing && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
              </motion.div>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value === '') setBlocks([]);
            }}
            onPaste={handlePaste}
            placeholder="Paste your text and code here..."
            className="flex-1 p-6 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed placeholder:text-gray-600"
          />
          <div className="p-4 border-t border-white/10 bg-white/[0.02]">
            <button
              onClick={() => processText(input)}
              disabled={!input.trim() || isProcessing}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10"
            >
              <Sparkles className="w-4 h-4" />
              Analyze Content
            </button>
          </div>
        </section>

        {/* Output Section */}
        <section className="flex-1 overflow-y-auto bg-[#010409] p-6 lg:p-12">
          <div className="max-w-3xl mx-auto space-y-8">
            {blocks.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">No content analyzed</h3>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">
                    Paste some text with code snippets in the input buffer to see them distinguished here.
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {blocks.map((block, index) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    {block.type === 'code' ? (
                      <div className="rounded-xl border border-white/10 bg-[#0D1117] overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.03]">
                          <div className="flex items-center gap-2">
                            <Code className="w-4 h-4 text-blue-400" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                              {block.language}
                            </span>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(block.content, block.id)}
                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-500 hover:text-white"
                          >
                            {copiedId === block.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto scrollbar-thin">
                          <code 
                            className={cn("hljs", `language-${block.language}`)}
                            dangerouslySetInnerHTML={{ 
                              __html: hljs.highlight(block.content, { language: block.language || 'plaintext' }).value 
                            }}
                          />
                        </pre>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <div className="mt-1.5">
                          <Type className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1 text-gray-300 leading-relaxed prose prose-invert max-w-none">
                          <ReactMarkdown>{block.content}</ReactMarkdown>
                        </div>
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
      <footer className="h-8 border-t border-white/10 bg-[#0D1117] flex items-center px-4 justify-between text-[10px] text-gray-500 uppercase tracking-widest font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            System Ready
          </div>
          <div>Blocks: {blocks.length}</div>
        </div>
        <div>
          {isProcessing ? 'Analyzing...' : 'Idle'}
        </div>
      </footer>
    </div>
  );
}
