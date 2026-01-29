import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { ConnectionStats } from '@/lib/types';

interface AnalyticsViewProps {
  stats: ConnectionStats;
}

export function AnalyticsView({ stats }: AnalyticsViewProps) {
  // Process data for charts
  const processGrowthData = () => {
    // Combine timestamps from followers and following
    // This is a rough estimation since we only have current follower data
    // We'll group by month/year
    
    // Create map of months -> count
    const monthlyData: Record<string, { month: string; followers: number; following: number }> = {};
    
    const addToMap = (timestamp: number, type: 'followers' | 'following') => {
        if (!timestamp) return;
        const date = new Date(timestamp * 1000);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`; // 2024-1
        
        if (!monthlyData[key]) {
            monthlyData[key] = {
                month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                followers: 0,
                following: 0
            };
        }
        monthlyData[key][type]++;
    };

    stats.followers.forEach(p => addToMap(p.timestamp, 'followers'));
    stats.following.forEach(p => addToMap(p.timestamp, 'following'));

    // Convert to array and sort
    const sortedData = Object.entries(monthlyData)
        .sort((a, b) => { // Sort by date key string (YYYY-M) needs better logic
            const [yA, mA] = a[0].split('-').map(Number);
            const [yB, mB] = b[0].split('-').map(Number);
            return (yA - yB) || (mA - mB);
        })
        .map(([_, val]) => {
            // make cumulative? Or just new per month? 
            // Let's do new per month for activity
            return val;
        });

    return sortedData;
  };

  const data = processGrowthData();

  return (
    <div className="p-4 md:p-8 space-y-8 overflow-y-auto h-full">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Analytics & Insights</h2>
        <p className="text-zinc-500">Visualizing your connection activity over time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-6">Monthly Activity (New Connections)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#666" 
                tick={{fill: '#666', fontSize: 12}} 
                tickLine={false}
              />
              <YAxis 
                stroke="#666" 
                tick={{fill: '#666', fontSize: 12}} 
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="followers" name="New Followers" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="following" name="New Following" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Trend (Cumulative) */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 h-[400px]">
           <h3 className="text-lg font-semibold text-white mb-6">Growth Trend (Cumulative)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.reduce((acc: any[], curr, idx) => {
                    const prev = idx > 0 ? acc[idx - 1] : { followers: 0, following: 0 };
                    acc.push({
                        month: curr.month,
                        followers: prev.followers + curr.followers,
                        following: prev.following + curr.following
                    });
                    return acc;
                }, [])}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                        dataKey="month" 
                        stroke="#666" 
                        tick={{fill: '#666', fontSize: 12}} 
                        tickLine={false}
                    />
                    <YAxis 
                        stroke="#666" 
                        tick={{fill: '#666', fontSize: 12}} 
                        tickLine={false}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="followers" name="Total Followers" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="following" name="Total Following" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
