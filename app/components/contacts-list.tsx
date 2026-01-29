import React, { useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { ContactInfo } from '@/lib/types';

interface ContactsListProps {
  contacts: ContactInfo[];
}

export function ContactsList({ contacts }: ContactsListProps) {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredContacts = contacts
    .filter(c => 
      c.firstName.toLowerCase().includes(search.toLowerCase()) || 
      (c.lastName && c.lastName.toLowerCase().includes(search.toLowerCase())) ||
      c.contactInfo.includes(search)
    )
    .sort((a, b) => {
      const nameA = (a.firstName + (a.lastName || '')).toLowerCase();
      const nameB = (b.firstName + (b.lastName || '')).toLowerCase();
      return sortOrder === 'asc' 
        ? nameA.localeCompare(nameB) 
        : nameB.localeCompare(nameA);
    });

  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Synced Contacts</h2>
             <div className="flex gap-2">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 placeholder:text-zinc-600"
                    />
                </div>
                <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                    title={sortOrder === 'asc' ? "A-Z" : "Z-A"}
                >
                    <ArrowUpDown size={20} className={sortOrder === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                    <span className="text-xs font-medium hidden md:inline">{sortOrder === 'asc' ? "A-Z" : "Z-A"}</span>
                </button>
            </div>
        </div>

        <div className="flex-1 min-h-0 bg-zinc-900/20 rounded-2xl border border-zinc-800/50 overflow-hidden overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContacts.map((contact, idx) => (
                        <div key={idx} className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl hover:bg-zinc-900/80 transition-colors">
                            <div className="font-semibold text-zinc-200">{contact.firstName}{contact.lastName ? ` ${contact.lastName}` : ''}</div>
                            <div className="text-sm text-zinc-500 mt-1 break-all">{contact.contactInfo}</div>
                        </div>
                ))}
                {filteredContacts.length === 0 && (
                     <div className="col-span-full py-12 text-center text-zinc-500">
                        No contacts found matching "{search}"
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
