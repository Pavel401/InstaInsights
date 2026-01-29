'use client';

import { useState, useRef } from 'react';
import { Upload, FolderUp, FileJson } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnalyzedProfile, ConnectionStats } from '@/lib/types';
import { parseFollowers, parseFollowing, analyzeConnections, parseContacts, parseGenericList } from '@/lib/parser';

interface FileUploadProps {
  onDataLoaded: (stats: ConnectionStats) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);
  };

  const processFiles = async (files: FileList) => {
    setLoading(true);
    setError(null);

    const fileGroups: Record<string, File[]> = {
      followers: [],
      following: [],
      pending: [],
      recent: [],
      contacts: [],
      blocked: [],
      restricted: [],
      closeFriends: [],
      hideStoryFrom: [],
      favorites: [],
      recentlyUnfollowed: [],
      removedSuggestions: [],
      requestsReceived: []
    };

    const patterns = {
      followers: /^followers_\d+\.json$/,
      following: /^following(_\d+)?\.json$/,
      pending: /^pending_follow_requests(_\d+)?\.json$/,
      recent: /^recent_follow_requests(_\d+)?\.json$/,
      contacts: /^synced_contacts(_\d+)?\.json$/,
      blocked: /^blocked_profiles(_\d+)?\.json$/,
      restricted: /^restricted_profiles(_\d+)?\.json$/,
      closeFriends: /^close_friends(_\d+)?\.json$/,
      hideStoryFrom: /^hide_story_from(_\d+)?\.json$/,
      favorites: /^profiles_you've_favorited(_\d+)?\.json$/,
      recentlyUnfollowed: /^recently_unfollowed_profiles(_\d+)?\.json$/,
      removedSuggestions: /^removed_suggestions(_\d+)?\.json$/,
      requestsReceived: /^follow_requests_you've_received(_\d+)?\.json$/
    };

    // Sort files into groups
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        for (const [key, pattern] of Object.entries(patterns)) {
            if (pattern.test(file.name)) {
                // @ts-ignore
                fileGroups[key].push(file);
                break;
            }
        }
    }

    if (fileGroups.followers.length === 0 || fileGroups.following.length === 0) {
        setError('Could not find followers or following files (e.g., followers_1.json, following.json). Please make sure you selected the root Instagram backup folder.');
        setLoading(false);
        return;
    }

    try {
      // Helper to parse multiple files for a category and merge results
      const parseCategory = async (categoryKey: string, parserFn: (data: any) => any[]) => {
        const categoryFiles = fileGroups[categoryKey];
        if (categoryFiles.length === 0) return [];

        const results = await Promise.all(categoryFiles.map(async (file) => {
            try {
                const text = await file.text();
                const json = JSON.parse(text);
                return parserFn(json);
            } catch (e) {
                console.warn(`Failed to parse ${file.name}`, e);
                return [];
            }
        }));

        return results.flat();
      };

      const [
        followers, 
        following, 
        pending, 
        recent, 
        contacts,
        blocked,
        restricted,
        closeFriends,
        hideStoryFrom,
        favorites,
        recentlyUnfollowed,
        removedSuggestions,
        requestsReceived
      ] = await Promise.all([
        parseCategory('followers', parseFollowers),
        parseCategory('following', parseFollowing),
        parseCategory('pending', (d) => parseGenericList(d, 'relationships_follow_requests_sent')),
        parseCategory('recent', (d) => parseGenericList(d, 'relationships_permanent_follow_requests')),
        parseCategory('contacts', parseContacts),
        parseCategory('blocked', (d) => parseGenericList(d, 'relationships_blocked_users')),
        parseCategory('restricted', (d) => parseGenericList(d, 'relationships_restricted_users')),
        parseCategory('closeFriends', (d) => parseGenericList(d, 'relationships_close_friends')),
        parseCategory('hideStoryFrom', (d) => parseGenericList(d, 'relationships_hide_stories_from')),
        parseCategory('favorites', (d) => parseGenericList(d, 'relationships_feed_favorites')),
        parseCategory('recentlyUnfollowed', (d) => parseGenericList(d, 'relationships_unfollowed_users')),
        parseCategory('removedSuggestions', (d) => parseGenericList(d, 'relationships_dismissed_suggested_users')),
        parseCategory('requestsReceived', (d) => parseGenericList(d, 'relationships_follow_requests_received')),
      ]);

      const stats = analyzeConnections(
        followers, 
        following, 
        pending, 
        recent, 
        contacts,
        blocked,
        restricted,
        closeFriends,
        hideStoryFrom,
        favorites,
        recentlyUnfollowed,
        removedSuggestions,
        requestsReceived
      );

      onDataLoaded(stats);
    } catch (err) {
      console.error(err);
      setError('Error parsing JSON files. The files might be corrupted or in an unexpected format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-10 text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-zinc-800 rounded-full">
            <FolderUp className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Upload Instagram Data</h2>
        <p className="text-zinc-400 mb-8">
          Select your "instagram-backup" folder. We'll find <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">followers_1.json</code> and <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">following.json</code> automatically.
        </p>

        <div className="relative">
          <input
            type="file"
             // @ts-expect-error - webkitdirectory is standard in modern browsers but missing in React types
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className={cn(
              "w-full py-4 px-6 rounded-xl font-medium transition-all duration-200",
              "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white",
              "flex items-center justify-center gap-2",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">Processing...</span>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Select Folder
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Your data is processed locally in your browser and never uploaded to any server.
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
