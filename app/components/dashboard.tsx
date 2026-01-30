import React, { useState, useEffect } from 'react';
import { ConnectionStats, AnalyzedProfile } from '@/lib/types';
import { Sidebar, ViewMode } from './sidebar';
import { ProfileList } from './profile-list';
import { StatCard } from './stat-card';
import { AnalyticsView } from './analytics-view';
import { MediaGallery } from './media-gallery';
import { ChatViewer } from './chat-viewer';
import { ActivityViewer } from './activity-viewer';
import { ContactsList } from './contacts-list';
import { UserMinus, Heart, ArrowRightLeft, Users, Menu, Ban, Star, ShieldAlert, EyeOff, Activity, MessageSquare } from 'lucide-react';
import { saveStats, getStats, clearData, deleteProfile, getMediaPath, setMediaPath } from '@/app/actions';


interface DashboardProps {
  stats: ConnectionStats | null;
  onReset: () => void;
  onDataLoaded: (stats: ConnectionStats) => void;
}

export function Dashboard({ stats: initialStats, onReset, onDataLoaded }: DashboardProps) {
  const [stats, setStats] = useState<ConnectionStats | null>(initialStats);
  const [view, setView] = useState<ViewMode>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (initialStats) {
        setStats(initialStats);
    } else {
        getStats().then((savedStats) => {
            if (savedStats) {
                setStats(savedStats);
                onDataLoaded(savedStats);
            }
        });
    }

    // Self-healing: Ensure media path is set
    getMediaPath().then((path) => {
        if (!path) {
            console.log('Media path missing, setting default...');
            setMediaPath('/Users/skmabudalam/Documents/Insta Tools/instagram-pavel_alam_-2026-01-29-r39vO3JN/media');
        } else {
            console.log('Media path already set:', path);
        }
    });
  }, [initialStats]);

  const handleReset = async () => {
      await clearData();
      setStats(null);
      onReset();
  };

  const handleDelete = async (username: string) => {
      if (!stats || view === 'overview') return;
      
      const categoryMap: Record<string, keyof ConnectionStats> = {
          'followers': 'followers',
          'following': 'following',
          'notFollowingBack': 'notFollowingBack',
          'fans': 'fans',
          'mutual': 'mutual',
          'pendingRequests': 'pendingRequests',
          'recentRequests': 'recentRequests',
          'blocked': 'blocked',
          'restricted': 'restricted',
          'closeFriends': 'closeFriends',
          'hideStoryFrom': 'hideStoryFrom',
          'favorites': 'favorites',
          'recentlyUnfollowed': 'recentlyUnfollowed',
          'removedSuggestions': 'removedSuggestions',
          'requestsReceived': 'requestsReceived'
      };

      const category = categoryMap[view];
      if (!category) return;

      const updatedStats = await deleteProfile(category, username);
      if (updatedStats) {
          setStats(updatedStats);
      }
  };

  if (!stats) return null; // Or a loading spinner


  // Safely get counts with defaults
  const counts = {
    followers: stats.followers?.length || 0,
    following: stats.following?.length || 0,
    notFollowingBack: stats.notFollowingBack?.length || 0,
    fans: stats.fans?.length || 0,
    mutual: stats.mutual?.length || 0,
    pendingRequests: stats.pendingRequests?.length || 0,
    recentRequests: stats.recentRequests?.length || 0,
    contacts: stats.contacts?.length || 0,
    blocked: stats.blocked?.length || 0,
    restricted: stats.restricted?.length || 0,
    closeFriends: stats.closeFriends?.length || 0,
    hideStoryFrom: stats.hideStoryFrom?.length || 0,
    favorites: stats.favorites?.length || 0,
    recentlyUnfollowed: stats.recentlyUnfollowed?.length || 0,
    removedSuggestions: stats.removedSuggestions?.length || 0,
    requestsReceived: stats.requestsReceived?.length || 0,
  };

  const renderContent = () => {
    if (view === 'overview') {
      return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
            <p className="text-zinc-500">Here's what's happening with your connections.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
             label="Not Following Back"
             value={stats.notFollowingBack.length}
             icon={UserMinus}
             color="text-red-500"
             onClick={() => setView('notFollowingBack')}
            />
            <StatCard
              label="Pending Requests (Sent)"
              value={stats.pendingRequests.length}
              icon={UserMinus}
              color="text-orange-500"
              onClick={() => setView('pendingRequests')}
            />
             <StatCard
              label="Fans"
              value={stats.fans.length}
              icon={Heart}
              color="text-pink-500"
              onClick={() => setView('fans')}
            />
            <StatCard
              label="Mutual"
              value={stats.mutual.length}
              icon={ArrowRightLeft}
              color="text-green-500"
              onClick={() => setView('mutual')}
            />
             <StatCard
              label="Blocked Users"
              value={stats.blocked.length}
              icon={Ban}
              color="text-zinc-400"
              onClick={() => setView('blocked')}
            />
             <StatCard
              label="Close Friends"
              value={stats.closeFriends.length}
              icon={Star}
              color="text-yellow-500"
              onClick={() => setView('closeFriends')}
            />
             <StatCard
              label="Restricted"
              value={stats.restricted.length}
              icon={ShieldAlert}
              color="text-orange-400"
              onClick={() => setView('restricted')}
            />
             <StatCard
              label="Hide Story From"
              value={stats.hideStoryFrom.length}
              icon={EyeOff}
              color="text-zinc-500"
              onClick={() => setView('hideStoryFrom')}
            />
            <StatCard
              label="Analytics"
              value="View"
              icon={Activity}
              color="text-blue-500"
              onClick={() => setView('analytics')}
            />
          </div>
        </div>
      );
    }

    if (view === 'contacts') {
         return (
             <div className="p-4 md:p-8 h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
                <ContactsList contacts={stats.contacts} />
             </div>
         );
    }



    if (view === 'analytics') {
        return <AnalyticsView stats={stats} />;
    }

    if (view === 'media') {
        return <div className="h-screen"><MediaGallery /></div>;
    }

    if (view === 'messages') {
        return <div className="h-[calc(100vh-4rem)] lg:h-screen p-4 md:p-8"><ChatViewer /></div>;
    }

    if (view === 'activity') {
        return <div className="h-[calc(100vh-4rem)] lg:h-screen p-4 md:p-8"><ActivityViewer /></div>;
    }

    const dataMap: Record<string, any[]> = {
      followers: stats.followers || [],
      following: stats.following || [],
      notFollowingBack: stats.notFollowingBack || [],
      fans: stats.fans || [],
      mutual: stats.mutual || [],
      pendingRequests: stats.pendingRequests || [],
      recentRequests: stats.recentRequests || [],
      blocked: stats.blocked || [],
      restricted: stats.restricted || [],
      closeFriends: stats.closeFriends || [],
      hideStoryFrom: stats.hideStoryFrom || [],
      favorites: stats.favorites || [],
      recentlyUnfollowed: stats.recentlyUnfollowed || [],
      removedSuggestions: stats.removedSuggestions || [],
      requestsReceived: stats.requestsReceived || []
    };

    const titleMap: Record<string, string> = {
      followers: 'All Followers',
      following: 'Profiles You Follow',
      notFollowingBack: 'People Not Following You Back',
      fans: 'Your Fans (You don\'t follow back)',
      mutual: 'Mutual Connections',
      pendingRequests: 'Pending Follow Requests (Sent)',
      recentRequests: 'Recent Follow Requests (Permanent)',
      blocked: 'Blocked Accounts',
      restricted: 'Restricted Accounts',
      closeFriends: 'Close Friends List',
      hideStoryFrom: 'Hide Story From',
      favorites: 'Favorites',
      recentlyUnfollowed: 'Recently Unfollowed',
      removedSuggestions: 'Removed Suggestions',
      requestsReceived: 'Follow Requests Received'
    };

    return (
      <div className="p-4 md:p-8 h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
        <div className="mb-6">
             <h2 className="text-2xl font-bold text-white">{titleMap[view]}</h2>
        </div>
        <div className="flex-1 min-h-0 bg-zinc-900/20 rounded-2xl border border-zinc-800/50 overflow-hidden">
             <ProfileList 
                data={dataMap[view] || []} 
                title={titleMap[view] || ''} 
                onDelete={handleDelete}
             />
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        onReset={handleReset} 
        counts={counts} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="flex-1 lg:ml-64 bg-zinc-950 min-h-screen border-l border-zinc-900/50 transition-all duration-300 w-full relative">
        <div className="lg:hidden p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950 sticky top-0 z-30">
             <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-lg">
                 InstaInsights
             </div>
             <button onClick={() => setSidebarOpen(true)} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900">
                 <Menu />
             </button>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
