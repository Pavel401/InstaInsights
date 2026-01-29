'use client';

import { useState, useEffect } from 'react';
import { ConnectionStats } from '@/lib/types';
import { FileUpload } from './components/file-upload';
import { Dashboard } from './components/dashboard';
import { getStats } from './actions';


export default function Home() {
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStats().then((data) => {
      if (data) {
        setStats(data);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </main>
    );
  }

  if (stats) {
    return <Dashboard stats={stats} onReset={() => setStats(null)} onDataLoaded={setStats} />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-blue-500/20">
      
      {/* Subtle Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] left-[20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
          <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-2xl text-center mb-10 space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          <span className="text-zinc-100">Insta</span>
          <span className="text-zinc-500">Insights</span>
        </h1>
        <p className="text-lg text-zinc-400 font-light leading-relaxed">
          The cleanest way to visualize your Instagram connections. 
          <br className="hidden md:block"/>
          Discover who's not following you back, identify fans, and explore mutuals.
        </p>
      </div>

      <div className="z-10 w-full">
        <FileUpload onDataLoaded={setStats} />
      </div>
      
      <div className="absolute bottom-6 text-zinc-700 text-sm">
        Privacy First. No data leaves your device.
      </div>
    </main>
  );
}
