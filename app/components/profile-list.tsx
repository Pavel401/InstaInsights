'use client';

import { useState } from 'react';
import { AnalyzedProfile } from '@/lib/types';
import { ExternalLink, Search, Calendar, Filter, ArrowUpDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileListProps {
  data: AnalyzedProfile[];
  title: string;
  onDelete?: (username: string) => void;
}

type SortOrder = 'newest' | 'oldest';
type TimeFilter = 'all' | 'week' | 'month' | '3months' | 'year';

export function ProfileList({ data, title, onDelete }: ProfileListProps) {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const getFilteredData = () => {
    let filtered = data.filter(profile => 
      profile.username.toLowerCase().includes(search.toLowerCase())
    );

    const now = Date.now() / 1000;

    if (timeFilter !== 'all') {
      filtered = filtered.filter(profile => {
        if (!profile.timestamp) return false;
        const diff = now - profile.timestamp;
        switch (timeFilter) {
          case 'week': return diff <= 604800; // 7 days
          case 'month': return diff <= 2592000; // 30 days
          case '3months': return diff <= 7776000; // 90 days
          case 'year': return diff <= 31536000; // 365 days
          default: return true;
        }
      });
    }

    return filtered.sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  };

  const filteredData = getFilteredData();

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
                type="text"
                placeholder="Search profiles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-zinc-600 transition-all"
            />
            </div>
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
                <Filter size={20} />
            </button>
            <button 
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title={sortOrder === 'newest' ? "Newest First" : "Oldest First"}
            >
                <ArrowUpDown size={20} className={sortOrder === 'oldest' ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
        </div>

        <AnimatePresence>
            {showFilters && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="flex flex-wrap gap-2 pt-1">
                        {[
                            { id: 'all', label: 'All Time' },
                            { id: 'week', label: 'Last 7 Days' },
                            { id: 'month', label: 'Last 30 Days' },
                            { id: '3months', label: 'Last 3 Months' },
                            { id: 'year', label: 'Last Year' },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setTimeFilter(filter.id as TimeFilter)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    timeFilter === filter.id 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="text-xs text-zinc-500 flex justify-between items-center">
             <span>Showing {filteredData.length} profiles</span>
             <span className="opacity-50">
                 Sorted by {sortOrder} • Filter: {timeFilter === 'all' ? 'All Time' : timeFilter}
             </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredData.map((profile, idx) => (
            <motion.a
              key={`${profile.username}-${idx}`}
              href={profile.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800/50 border border-zinc-800/50 hover:border-zinc-700/80 rounded-xl transition-all duration-200 relative"
            >
              <div className="flex flex-col truncate pr-2">
                <span className="font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors truncate">
                  {profile.username}
                </span>
                <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>{formatDate(profile.timestamp)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                  {onDelete && (
                      <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(profile.username);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Unfollow / Remove"
                      >
                          <Trash2 size={16} />
                      </button>
                  )}
                  <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0" />
              </div>
            </motion.a>
          ))}
          
          {filteredData.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500">
              No profiles found matching criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
