import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Send, Clock, User, Laptop, Save, AlertCircle } from 'lucide-react';

export default function RepairDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'repairs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTicket({ id: docSnap.id, ...data });
          setStatusInput(data.status || 'Pending');
        } else {
          alert('Ticket not found!');
          navigate('/admin/repairs');
        }
      } catch (error) {
        console.error("Error fetching ticket:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusInput(newStatus);
    setIsSaving(true);
    try {
      const docRef = doc(db, 'repairs', id!);
      await updateDoc(docRef, { status: newStatus });
      setTicket((prev: any) => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    setIsSaving(true);
    const newNote = {
      text: noteInput.trim(),
      timestamp: new Date().toISOString(),
      author: 'Admin' // In a real app, this would be the logged-in user
    };

    try {
      const docRef = doc(db, 'repairs', id!);
      const updatedNotes = [...(ticket.internalNotes || []), newNote];
      await updateDoc(docRef, { internalNotes: updatedNotes });
      
      setTicket((prev: any) => ({ ...prev, internalNotes: updatedNotes }));
      setNoteInput('');
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white text-center">Loading ticket details...</div>;
  }

  if (!ticket) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/repairs')} className="text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Ticket <span className="text-blue-400 font-mono text-xl">REP-{ticket.id.slice(0,4).toUpperCase()}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Received on {new Date(ticket.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        {/* Quick Status Update */}
        <div className="flex items-center gap-3 bg-[#0d0d0e] p-2 rounded-2xl border border-white/10 shadow-lg">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-3">Status:</span>
          <select 
            value={statusInput} 
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isSaving}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="Pending" className="bg-[#0d0d0e]">Pending</option>
            <option value="Diagnosing" className="bg-[#0d0d0e]">Diagnosing</option>
            <option value="Waiting for Parts" className="bg-[#0d0d0e]">Waiting for Parts</option>
            <option value="Waiting for Approval" className="bg-[#0d0d0e]">Waiting for Approval</option>
            <option value="In Progress" className="bg-[#0d0d0e]">In Progress</option>
            <option value="Quality Check" className="bg-[#0d0d0e]">Quality Check</option>
            <option value="Ready for Delivery" className="bg-[#0d0d0e]">Ready for Delivery</option>
            <option value="Completed" className="bg-[#0d0d0e]">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Issue Section */}
          <div className="bg-[#0d0d0e] p-8 rounded-3xl border border-white/10 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Reported Issue
            </h2>
            <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl">
              <p className="text-slate-300 text-sm leading-relaxed">{ticket.issue}</p>
            </div>
            
            {ticket.estimatedCost > 0 && (
              <div className="mt-6 flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estimated Cost</span>
                <span className="text-lg font-bold text-white">₹{Number(ticket.estimatedCost).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Device & Customer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#0d0d0e] p-6 rounded-3xl border border-white/10 shadow-xl">
               <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
                <Laptop className="h-4 w-4 text-blue-500" />
                Device Details
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Device</div>
                  <div className="text-sm text-slate-200 font-medium">{ticket.brand} {ticket.model} ({ticket.deviceType})</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Serial Number</div>
                  <div className="text-sm text-slate-200 font-mono bg-white/5 px-2 py-1 rounded w-fit mt-1">{ticket.serialNumber}</div>
                </div>
                {ticket.devicePassword && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-red-400">Device Password / PIN</div>
                    <div className="text-sm text-red-300 font-mono bg-red-500/10 border border-red-500/20 px-2 py-1 rounded w-fit mt-1">{ticket.devicePassword}</div>
                  </div>
                )}
                {ticket.cosmeticCondition && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Cosmetic Condition</div>
                    <div className="text-sm text-slate-300 italic">{ticket.cosmeticCondition}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0d0d0e] p-6 rounded-3xl border border-white/10 shadow-xl">
               <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
                <User className="h-4 w-4 text-blue-500" />
                Customer Details
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Name</div>
                  <div className="text-sm text-slate-200 font-medium">{ticket.customerName}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Phone</div>
                  <div className="text-sm text-blue-400 font-medium hover:underline cursor-pointer">{ticket.customerPhone}</div>
                </div>
                {ticket.customerEmail && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Email</div>
                    <div className="text-sm text-slate-300">{ticket.customerEmail}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Internal Notes Timeline */}
        <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 shadow-xl flex flex-col h-[600px]">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Internal Notes Log
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Only visible to staff</p>
          </div>
          
          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {(!ticket.internalNotes || ticket.internalNotes.length === 0) ? (
              <div className="text-center text-slate-500 text-sm mt-10">
                No notes yet. Add one below to track progress.
              </div>
            ) : (
              ticket.internalNotes.map((note: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                      {note.author.charAt(0).toUpperCase()}
                    </div>
                    {index !== ticket.internalNotes.length - 1 && (
                      <div className="w-0.5 h-full bg-white/5 my-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{note.author}</span>
                      <span className="text-[10px] font-bold text-slate-500">{new Date(note.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-sm text-slate-300 leading-relaxed">
                      {note.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Note Input */}
          <div className="p-4 border-t border-white/5 bg-white/5 m-2 rounded-2xl">
            <form onSubmit={handleAddNote} className="flex flex-col gap-3">
              <textarea 
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Type a new internal note... (e.g. Parts ordered, waiting for delivery)"
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none px-2"
                rows={3}
              />
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving || !noteInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                  <Send className="h-3 w-3" />
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
