'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getMediaFiles, MediaItem } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Calendar, HardDrive, FileImage, FileVideo, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

type MediaType = 'posts' | 'stories' | 'reels';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function MediaGallery() {
  const [activeTab, setActiveTab] = useState<MediaType>('stories');
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadFiles(activeTab);
  }, [activeTab]);

  const loadFiles = async (type: MediaType) => {
    setLoading(true);
    setSelectedIndex(null);
    setIsPlaying(false);
    try {
      const fileList = await getMediaFiles(type);
      setFiles(fileList);
    } catch (error) {
      console.error('Failed to load media files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = useCallback(() => {
    setSelectedIndex(prev => {
        if (prev === null) return null;
        return prev >= files.length - 1 ? 0 : prev + 1;
    });
  }, [files.length]);

  const handlePrev = useCallback(() => {
    setSelectedIndex(prev => {
        if (prev === null) return null;
        return prev <= 0 ? files.length - 1 : prev - 1;
    });
  }, [files.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (selectedIndex === null) return;
        
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') {
            setSelectedIndex(null);
            setIsPlaying(false);
        }
        if (e.key === ' ') {
            e.preventDefault();
            setIsPlaying(prev => !prev);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handleNext, handlePrev]);

  // Slideshow logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isPlaying && selectedIndex !== null) {
        const currentFile = files[selectedIndex];
        
        // If it's an image, wait 4 seconds then force next
        if (currentFile && currentFile.type === 'image') {
            timeout = setTimeout(() => {
                handleNext();
            }, 4000);
        }
        // If it's a video, we rely on the onEnded event on the <video> tag
        // preventing the timer from skipping it early.
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, selectedIndex, handleNext, files]);

  const selectedFile = selectedIndex !== null ? files[selectedIndex] : null;

  const tabs: { id: MediaType; label: string }[] = [
    { id: 'stories', label: 'Stories' },
    { id: 'posts', label: 'Posts' },
    { id: 'reels', label: 'Reels' },
  ];

  return (
    <div className="p-4 md:p-8 h-full flex flex-col relative">
      <div className="mb-6 flex items-center justify-between">
         <h2 className="text-2xl font-bold text-white">Media Gallery</h2>
         <div className="flex bg-zinc-900 rounded-lg p-1">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id 
                        ? 'bg-zinc-800 text-white' 
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
         </div>
      </div>

      <div className="flex-1 min-h-0 bg-zinc-900/20 rounded-2xl border border-zinc-800/50 overflow-hidden overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
             <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
             </div>
        ) : files.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
                No {activeTab} found.
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {files.map((file, idx) => (
                    <motion.div 
                        key={idx}
                        layoutId={`media-${file.path}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => setSelectedIndex(idx)}
                        className="aspect-square bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 relative group cursor-pointer hover:border-zinc-600 transition-colors"
                    >
                        {file.type === 'video' ? (
                            <div className="w-full h-full relative">
                                <video 
                                    src={`/api/media?file=${activeTab}/${file.path}`}
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                    muted
                                    onMouseOver={(e) => e.currentTarget.play().catch(() => {})}
                                    onMouseOut={(e) => {
                                        e.currentTarget.pause();
                                        e.currentTarget.currentTime = 0;
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                                    <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm">
                                        <Play className="w-6 h-6 text-white fill-current" />
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs font-medium text-white backdrop-blur-sm pointer-events-none">
                                    VIDEO
                                </div>
                            </div>
                        ) : (
                            <img 
                                src={`/api/media?file=${activeTab}/${file.path}`}
                                alt={file.name}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                        )}
                         <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-white truncate font-medium">{file.name}</p>
                            <p className="text-[10px] text-zinc-300">{formatBytes(file.size)}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>

      <AnimatePresence>
        {selectedFile && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                onClick={() => {
                    setSelectedIndex(null);
                    setIsPlaying(false);
                }}
            >
                {/* Navigation Buttons */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                >
                    <ChevronLeft className="w-8 h-8 md:w-12 md:h-12" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                >
                    <ChevronRight className="w-8 h-8 md:w-12 md:h-12" />
                </button>

                <div 
                    className="relative w-full max-w-6xl max-h-[90vh] flex flex-col md:flex-row bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"
                    onClick={e => e.stopPropagation()}
                >
                     {/* Media View */}
                    <div className="flex-1 bg-black flex items-center justify-center relative min-h-[400px] overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedFile.path}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                {selectedFile.type === 'video' ? (
                                    <video 
                                        src={`/api/media?file=${activeTab}/${selectedFile.path}`}
                                        className="w-full h-full max-h-[85vh] object-contain"
                                        controls
                                        autoPlay={isPlaying}
                                        playsInline
                                        onEnded={() => {
                                            if (isPlaying) handleNext();
                                        }}
                                    />
                                ) : (
                                    <img 
                                        src={`/api/media?file=${activeTab}/${selectedFile.path}`}
                                        alt={selectedFile.name}
                                        className="w-full h-full max-h-[85vh] object-contain"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Metadata Sidebar */}
                    <div className="w-full md:w-80 bg-zinc-900 p-6 flex flex-col border-l border-zinc-800">
                        <div className="flex items-start justify-between mb-8">
                             <div className="flex-1 min-w-0 mr-4">
                                <h3 className="text-lg font-bold text-white leading-tight truncate" title={selectedFile.name}>{selectedFile.name}</h3>
                                <p className="text-zinc-500 text-sm mt-1">{selectedIndex !== null ? selectedIndex + 1 : 0} of {files.length}</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                                    title={isPlaying ? "Pause Slideshow" : "Start Slideshow"}
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                </button>
                                <button 
                                    onClick={() => {
                                        setSelectedIndex(null);
                                        setIsPlaying(false);
                                    }}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                             </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <div className="p-2 bg-zinc-800 rounded-lg">
                                        <HardDrive className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">File Size</p>
                                        <p className="text-zinc-200">{formatBytes(selectedFile.size)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-zinc-400">
                                    <div className="p-2 bg-zinc-800 rounded-lg">
                                        <Calendar className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Created</p>
                                        <p className="text-zinc-200">{formatDate(selectedFile.date)}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <div className="p-2 bg-zinc-800 rounded-lg">
                                        {selectedFile.type === 'video' ? (
                                            <FileVideo className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <FileImage className="w-5 h-5 text-green-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Type</p>
                                        <p className="text-zinc-200 uppercase">{selectedFile.type}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-zinc-800 mt-auto">
                                <a 
                                    href={`/api/media?file=${activeTab}/${selectedFile.path}`} 
                                    download={selectedFile.name}
                                    className="block w-full py-3 px-4 bg-zinc-100 hover:bg-white text-black font-semibold rounded-xl text-center transition-colors"
                                >
                                    Download File
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
