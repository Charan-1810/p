'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAiChat } from '@/hooks/useAi';
import { cn } from '@/lib/utils';

interface AiChatProps { repoId: string; initialQuestion?: string; }

export function AiChat({ repoId, initialQuestion }: AiChatProps) {
  const { messages, ask, isLoading, clearChat } = useAiChat(repoId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasAskedInitial = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Auto-submit initial question if provided
  useEffect(() => {
    if (initialQuestion && !hasAskedInitial.current && !isLoading) {
      hasAskedInitial.current = true;
      ask.mutate(initialQuestion);
    }
  }, [initialQuestion, isLoading, ask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || isLoading) return;
    setInput('');
    ask.mutate(q);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2 text-sm text-white font-medium">
          <Bot size={16} className="text-blue-400" />AI Assistant
        </div>
        <button onClick={clearChat} className="text-gray-500 hover:text-red-400 transition-colors" title="Clear chat">
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-12">
            <Bot size={40} className="mx-auto mb-3 text-gray-700" />
            <p>Ask anything about this codebase.</p>
            <p className="text-xs mt-2 text-gray-600">e.g. "How is authentication implemented?" or "What does the parse service do?"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-xl px-4 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-800 text-gray-100 rounded-bl-sm',
              )}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} className="text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-gray-800 rounded-xl px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800 bg-gray-900">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the codebase..."
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
