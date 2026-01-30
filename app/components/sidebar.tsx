import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  UserMinus, 
  Heart, 
  ArrowRightLeft, 
  Upload,
  X,
  ShieldAlert,
  Ban,
  Star,
  EyeOff,
  History,
  UserX,
  Mail,
  Activity,
  Image,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type ViewMode = 
  | 'overview' 
  | 'followers' 
  | 'following' 
  | 'notFollowingBack' 
  | 'fans' 
  | 'mutual' 
  | 'pendingRequests' 
  | 'recentRequests'
  | 'contacts'
  | 'blocked'
  | 'restricted'
  | 'closeFriends'
  | 'hideStoryFrom'
  | 'favorites'
  | 'recentlyUnfollowed'
  | 'removedSuggestions'
  | 'requestsReceived'
  | 'analytics'
  | 'media'
  | 'messages'
  | 'activity';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
  counts: {
    followers: number;
    following: number;
    notFollowingBack: number;
    fans: number;
    mutual: number;
    pendingRequests: number;
    recentRequests: number;
    contacts: number;
    blocked: number;
    restricted: number;
    closeFriends: number;
    hideStoryFrom: number;
    favorites: number;
    recentlyUnfollowed: number;
    removedSuggestions: number;
    requestsReceived: number;
  };
}

export function Sidebar({ currentView, onViewChange, onReset, counts, isOpen, onClose }: SidebarProps) {
  const menuGroups = [
    {
      title: 'Main',
      items: [
        { id: 'overview' as ViewMode, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'media' as ViewMode, label: 'Media Gallery', icon: Image },
        { id: 'messages' as ViewMode, label: 'Messages', icon: MessageSquare },
        { id: 'activity' as ViewMode, label: 'Your Activity', icon: Activity },
        { id: 'followers' as ViewMode, label: 'Followers', icon: Users, count: counts.followers },
        { id: 'following' as ViewMode, label: 'Following', icon: UserPlus, count: counts.following },
      ]
    },
    {
      title: 'Connections',
      items: [
         { id: 'notFollowingBack' as ViewMode, label: 'Not Following Back', icon: UserMinus, count: counts.notFollowingBack, alert: true },
         { id: 'fans' as ViewMode, label: 'Fans', icon: Heart, count: counts.fans },
         { id: 'mutual' as ViewMode, label: 'Mutual', icon: ArrowRightLeft, count: counts.mutual },
      ]
    },
    {
      title: 'Requests',
      items: [
        { id: 'requestsReceived' as ViewMode, label: 'Received Requests', icon: Mail, count: counts.requestsReceived },
        { id: 'pendingRequests' as ViewMode, label: 'Pending Sent', icon: UserMinus, count: counts.pendingRequests, alert: true },
        { id: 'recentRequests' as ViewMode, label: 'Recent Sent', icon: History, count: counts.recentRequests },
      ]
    },
    {
      title: 'Privacy & Lists',
      items: [
        { id: 'closeFriends' as ViewMode, label: 'Close Friends', icon: Star, count: counts.closeFriends },
        { id: 'favorites' as ViewMode, label: 'Favorites', icon: Star, count: counts.favorites },
        { id: 'restricted' as ViewMode, label: 'Restricted', icon: ShieldAlert, count: counts.restricted },
        { id: 'blocked' as ViewMode, label: 'Blocked', icon: Ban, count: counts.blocked },
        { id: 'hideStoryFrom' as ViewMode, label: 'Hide Story From', icon: EyeOff, count: counts.hideStoryFrom },
      ]
    },
     {
      title: 'History & Sync',
      items: [
        { id: 'recentlyUnfollowed' as ViewMode, label: 'Recently Unfollowed', icon: UserX, count: counts.recentlyUnfollowed },
        { id: 'removedSuggestions' as ViewMode, label: 'Removed Suggestions', icon: UserX, count: counts.removedSuggestions },
        { id: 'contacts' as ViewMode, label: 'Synced Contacts', icon: Users, count: counts.contacts },
      ]
    }
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              InstaInsights
            </h1>
            <p className="text-xs text-zinc-500 mt-1">Local Data Visualizer</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-6 px-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                        onViewChange(item.id);
                        if (window.innerWidth < 1024) onClose();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      currentView === item.id 
                        ? "bg-zinc-900 text-white" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {/* @ts-ignore */}
                    {(item.count !== undefined && item.count > 0) && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full ml-2",
                         // @ts-ignore
                        item.alert ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"
                      )}>
                        {/* @ts-ignore */}
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-900 mt-auto">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Upload size={18} />
            <span>Upload New File</span>
          </button>
        </div>
      </div>
    </>
  );
}
