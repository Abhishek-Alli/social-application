
import React, { useState, useRef, useMemo } from 'react';
import { User, Role, Complaint, ComplaintAttachment } from '../types';
import { Megaphone, MessageSquare, Send, CheckCircle, Clock, AlertCircle, Paperclip, X, FileText, Image as ImageIcon, ExternalLink, Search } from 'lucide-react';

interface ComplaintsViewProps {
  currentUser: User;
  complaints: Complaint[];
  onSubmitComplaint: (subject: string, message: string, attachment?: ComplaintAttachment) => void;
  onResolveComplaint: (id: string) => void;
}

export const ComplaintsView: React.FC<ComplaintsViewProps> = ({ 
  currentUser, 
  complaints, 
  onSubmitComplaint, 
  onResolveComplaint 
}) => {
  const [isFiling, setIsFiling] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<ComplaintAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isManagement = currentUser.role === Role.ADMIN || 
                       currentUser.role === Role.MANAGEMENT || 
                       currentUser.role === Role.HOD;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File is too large. Max 2MB allowed.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          data: reader.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    onSubmitComplaint(subject, message, attachment || undefined);
    setSubject('');
    setMessage('');
    setAttachment(null);
    setIsFiling(false);
  };

  const openAttachment = (att: ComplaintAttachment) => {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${att.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  const filteredComplaints = useMemo(() => {
    if (!searchQuery) return complaints;
    const query = searchQuery.toLowerCase();
    return complaints.filter(c => 
      c.subject.toLowerCase().includes(query) || 
      c.message.toLowerCase().includes(query) || 
      c.userName.toLowerCase().includes(query)
    );
  }, [complaints, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Complaint Box</h2>
          <p className="text-xs text-slate-400 font-medium">
            {isManagement ? 'Review and resolve organization issues' : 'Direct communication to management'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setIsSearching(!isSearching);
              if (isSearching) setSearchQuery('');
            }}
            className={`p-2 rounded-xl border transition-all ${isSearching ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-100 text-slate-400'}`}
          >
            <Search size={18} />
          </button>
          {!isManagement && !isFiling && (
            <button 
              onClick={() => setIsFiling(true)}
              className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-100 flex items-center gap-2"
            >
              <Megaphone size={14} /> New
            </button>
          )}
        </div>
      </div>

      {isSearching && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <input 
            autoFocus
            type="text"
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 transition-all shadow-sm text-sm font-medium"
            placeholder="Search by subject, message, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {isFiling && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm animate-in slide-in-from-top-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Write Complaint</h3>
            <button type="button" onClick={() => setIsFiling(false)} className="text-xs text-slate-400 font-bold hover:text-rose-500 transition-colors">Cancel</button>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</label>
            <input 
              autoFocus
              className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
              placeholder="e.g., Equipment Malfunction, Policy Query"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Detailed Message</label>
            <textarea 
              className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm min-h-[120px] leading-relaxed transition-all resize-none"
              placeholder="Provide as much detail as possible..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attach Evidence (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {!attachment ? (
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold flex items-center justify-center gap-2 hover:border-orange-200 hover:text-orange-500 transition-all"
                >
                  <Paperclip size={16} /> Click to upload (Max 2MB)
                </button>
              ) : (
                <div className="w-full p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    {attachment.type.startsWith('image/') ? <ImageIcon size={16} className="text-orange-600" /> : <FileText size={16} className="text-orange-600" />}
                    <span className="text-xs font-bold text-orange-900 truncate max-w-[200px]">{attachment.name}</span>
                  </div>
                  <button type="button" onClick={removeAttachment} className="p-1 text-orange-400 hover:text-rose-500">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>

          <button type="submit" className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            <Send size={18} /> Send to Management
          </button>
        </form>
      )}

      <div className="space-y-4 pb-20">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map(complaint => (
            <div key={complaint.id} className={`bg-white rounded-2xl border ${complaint.status === 'resolved' ? 'border-slate-100 opacity-75' : 'border-orange-50'} shadow-sm overflow-hidden animate-in slide-in-from-bottom-2`}>
              <div className="p-4 border-b border-slate-50 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${complaint.status === 'resolved' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                    {complaint.status === 'resolved' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">{complaint.subject}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">By {complaint.userName} • {new Date(complaint.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {complaint.status}
                  </span>
                  {isManagement && complaint.status === 'pending' && (
                    <button 
                      onClick={() => onResolveComplaint(complaint.id)}
                      className="px-2 py-1 bg-emerald-600 text-white text-[9px] font-bold rounded-lg shadow-sm active:scale-95 transition-all"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-slate-50/50">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {complaint.message}
                </p>
                
                {complaint.attachment && (
                  <div className="mt-4 p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 truncate max-w-[180px]">{complaint.attachment.name}</span>
                    </div>
                    <button 
                      onClick={() => openAttachment(complaint.attachment!)}
                      className="flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700"
                    >
                      View <ExternalLink size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} className="opacity-20" />
            </div>
            <p className="text-sm font-bold">{searchQuery ? 'No matching results' : 'Inbox is currently empty'}</p>
            <p className="text-xs text-slate-400 mt-1">{searchQuery ? 'Try adjusting your search query' : 'Issues will appear here once filed'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
