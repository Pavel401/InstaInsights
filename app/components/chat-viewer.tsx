'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getChatList, getChatMessages, ChatThread, ChatMessage } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ChatViewer() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatList().then(list => {
        setThreads(list);
        setLoadingList(false);
    });
  }, []);

  useEffect(() => {
    if (activeThread) {
        setLoadingMessages(true);
        getChatMessages(activeThread.folderName).then(msgs => {
            // Messages are usually stored reverse chronological in JSON (newest first)
            // We want to display them oldest at top usually, but Instagram export might have them in specific order
            // Let's check typical structure. Usually array[0] is newest. 
            // So we reverse for display: Bottom is newest.
            setMessages([...msgs].reverse());
            setLoadingMessages(false);
            scrollToBottom();
        });
    }
  }, [activeThread]);

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full bg-black/20 rounded-2xl border border-zinc-800/50 overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
            "w-full md:w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/50 shrink-0",
             activeThread ? 'hidden md:flex' : 'flex'
        )}>
            <div className="p-4 border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                        type="text" 
                        placeholder="Search chats..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loadingList ? (
                     <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                     </div>
                ) : (
                    filteredThreads.map((thread) => (
                        <button
                            key={thread.folderName}
                            onClick={() => setActiveThread(thread)}
                            className={`w-full p-4 flex items-start gap-3 hover:bg-zinc-800/50 transition-colors text-left border-b border-zinc-800/50 ${activeThread?.folderName === thread.folderName ? 'bg-zinc-800' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                                {thread.title.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-medium text-zinc-200 truncate">{thread.title}</h3>
                                    <span className="text-xs text-zinc-500 shrink-0 ml-2">{formatDate(thread.lastActivity)}</span>
                                </div>
                                <p className="text-xs text-zinc-500 truncate">Open to view conversation</p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
            "flex-1 flex flex-col bg-zinc-950/30 min-w-0",
            !activeThread ? 'hidden md:flex' : 'flex'
        )}>
            {activeThread ? (
                <>
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/50 backdrop-blur-md">
                        <button onClick={() => setActiveThread(null)} className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                             {activeThread.title.substring(0, 1).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-white">{activeThread.title}</h3>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                        {loadingMessages ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = msg.sender_name === 'Pavel Alam'; // This should ideally be dynamic or configurable
                                // Simple heuristic: If sender is NOT the thread title, it's likely "Me" for 1-on-1 chats
                                // But better might be to let user define "Me" or infer from frequency.
                                // For now, let's stick to name check if usage is personal.
                                // Or better: Compare with thread.title.
                                
                                const isSenderMe = msg.sender_name !== activeThread.title && msg.sender_name !== 'Instagram User';

                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={idx} 
                                        className={`flex flex-col ${isSenderMe ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isSenderMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'}`}>
                                            {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                                            
                                            {msg.photos && msg.photos.map((photo, pIdx) => (
                                                <div key={pIdx} className="mt-2 rounded-lg overflow-hidden">
                                                    <img 
                                                        src={`/api/media?file=${photo.uri}`} 
                                                        alt="Attachment" 
                                                        className="max-w-full h-auto rounded-lg" 
                                                    />
                                                </div>
                                            ))}

                                            {msg.share && (
                                                 <div className="mt-2 p-2 bg-black/20 rounded border border-white/10">
                                                    <p className="text-xs text-white/70 italic">Shared Content</p>
                                                    <a href={msg.share.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-300 underline block mt-1 truncate">
                                                        {msg.share.share_text || 'View Link'}
                                                    </a>
                                                 </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-zinc-600 mt-1 px-1">
                                            {formatTime(msg.timestamp_ms)}
                                        </span>
                                    </motion.div>
                                );
                            })
                        )}
                         <div ref={messagesEndRef} />
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-8 h-8 opacity-50" />
                    </div>
                    <p>Select a conversation to start reading</p>
                </div>
            )}
        </div>
    </div>
  );
}
