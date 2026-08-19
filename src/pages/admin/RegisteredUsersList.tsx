import React, { useState, useEffect } from 'react';
import { Users, Search, Download } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { exportToCsv } from '../../utils/exportCsv';
import { TableBodySkeleton } from '../../components/ui/Skeleton';

export default function RegisteredUsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchWebUsers = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'customers'),
          where('registeredOnline', '==', true)
        );
        const snap = await getDocs(q);
        const fetchedUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort manually by createdAt if possible, or just keep it as fetched
        fetchedUsers.sort((a: any, b: any) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Error fetching web users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWebUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-500" />
            Registered Web Users
          </h1>
          <p className="text-slate-400 text-sm mt-1">Users who created an account via the website</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportToCsv('web-users.csv', users)} className="px-5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all uppercase tracking-wider flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-6 border-b border-white/5 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 sm:p-6 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="p-4 sm:p-6 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Contact</th>
                <th className="p-4 sm:p-6 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <TableBodySkeleton columns={3} rows={5} />
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    No web users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 sm:p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold border border-blue-500/30">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                            {user.name}
                          </div>
                          {user.id && (
                            <div className="text-xs text-slate-500 font-mono mt-1">
                              ID: {user.id}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6">
                      <div className="text-sm font-bold text-white">{user.phone}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="p-4 sm:p-6 hidden sm:table-cell">
                      <div className="text-sm text-white">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
