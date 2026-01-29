import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  delay?: number;
  onClick?: () => void;
  isActive?: boolean;
}

export function StatCard({ label, value, icon: Icon, color, delay = 0, onClick, isActive }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer group p-6 rounded-2xl border transition-all duration-300 ${
        isActive 
          ? 'bg-zinc-800/80 border-zinc-600 ring-2 ring-blue-500/20' 
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
      }`}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon className="w-24 h-24 transform translate-x-4 -translate-y-4" />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className={`p-3 rounded-xl w-fit ${color} bg-opacity-10 mb-4`}>
          <Icon className={`w-6 h-6 ${color.replace('text-', 'text-opacity-100 ')}`} />
        </div>
        
        <div>
          <h3 className="text-zinc-400 text-sm font-medium mb-1">{label}</h3>
          <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}
