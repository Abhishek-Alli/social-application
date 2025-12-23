
import React, { useState, useMemo } from 'react';
import { Email, User, MessageAttachment } from '../types';
import { 
  Inbox, Send, Star, Trash2, Plus, Search, ArrowLeft, 
  MoreVertical, Paperclip, Mail, Clock, ChevronRight, 
  CheckCircle, User as UserIcon, X, ExternalLink, Image as ImageIcon,
  FileText, ChevronDown, ChevronUp
} from 'lucide-react';

interface EmailsViewProps {
  currentUser: User;
  emails: Email[];
  domain: string;
  onSendEmail: (data: Omit<Email, 'id' | 'createdAt' | 'read' | 'starred' | 'projectId' | 'senderId' | 'senderEmail'>) => void;
  onToggleStar: (id: string) => void;
  onDeleteEmail: (id: string) => void;
  onMarkRead: (id: string) => void;
}

export const EmailsView: React.FC<EmailsViewProps> = ({ 
  currentUser, 
  emails, 
  domain, 
  onSendEmail, 
  onToggleStar, 
  onDeleteEmail,
  onMarkRead
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'starred'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Compose State
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);

  const filteredEmails = useMemo(() => {
    let base = [];
    if (activeTab === 'inbox') {
      base = emails.filter(e => e.receiverEmail === currentUser.email || e.cc?.includes(currentUser.email));
    } else if (activeTab === 'sent') {
      base = emails.filter(e => e.senderId === currentUser.id);
    } else {
      base = emails.filter(e => e.starred && (e.receiverEmail === currentUser.email || e.senderId === currentUser.id || e.cc?.includes(currentUser.email)));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(e => 
        e.subject.toLowerCase().includes(q) || 
        e.body.toLowerCase().includes(q) || 
        e.senderEmail.toLowerCase().includes(q)
      );
    }

    return base.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [emails, activeTab, currentUser.id, currentUser.email, searchQuery]);

  const processEmailList = (input: string): string[] => {
    return input.split(',').map(e => e.trim()).filter(e => e !== '').map(e => {
      if (e.includes('@')) {
        // Validate domain matches project domain
        const emailDomain = e.split('@')[1];
        if (emailDomain !== domain) {
          throw new Error(`Email must use domain @${domain}`);
        }
        return e;
      }
      return `${e}@${domain}`;
    });
  };

  const validateEmailDomain = (email: string): boolean => {
    if (!email.includes('@')) return true; // Will be auto-appended
    const emailDomain = email.split('@')[1];
    return emailDomain === domain;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject) return;
    
    try {
      // Validate receiver email domain
      if (to.includes('@')) {
        if (!validateEmailDomain(to)) {
          alert(`Email must use the project domain: @${domain}`);
          return;
        }
      }
      
      const finalTo = to.includes('@') ? to : `${to}@${domain}`;
      const finalCc = cc ? processEmailList(cc) : undefined;
      const finalBcc = bcc ? processEmailList(bcc) : undefined;

      onSendEmail({
        receiverEmail: finalTo,
        cc: finalCc,
        bcc: finalBcc,
        subject,
        body,
        attachments
      });

      setIsComposing(false);
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setAttachments([]);
      setShowCc(false);
      setShowBcc(false);
    } catch (error: any) {
      alert(error.message || 'Invalid email domain. All emails must use @' + domain);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, {
          name: file.name,
          data: reader.result as string,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (selectedEmail) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelectedEmail(null)} className="p-2 bg-white rounded-xl border border-slate-100 text-slate-500 shadow-sm">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => { onToggleStar(selectedEmail.id); setSelectedEmail(prev => prev ? {...prev, starred: !prev.starred} : null); }} className={`p-2 rounded-xl border ${selectedEmail.starred ? 'text-amber-500 bg-amber-50 border-amber-100' : 'text-slate-400 bg-white border-slate-100 shadow-sm'}`}>
              <Star size={18} fill={selectedEmail.starred ? "currentColor" : "none"} />
            </button>
            <button onClick={() => { onDeleteEmail(selectedEmail.id); setSelectedEmail(null); }} className="p-2 bg-white rounded-xl border border-slate-100 text-rose-500 shadow-sm">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex-1 overflow-y-auto no-scrollbar">
          <h2 className="text-xl font-black text-slate-800 mb-6">{selectedEmail.subject}</h2>
          
          <div className="flex items-start gap-3 mb-8 pb-6 border-b border-slate-50">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold shrink-0 shadow-inner">
              {selectedEmail.senderEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800 truncate">{selectedEmail.senderEmail}</p>
                <p className="text-[10px] text-slate-400 font-bold">{new Date(selectedEmail.createdAt).toLocaleString()}</p>
              </div>
              <div className="mt-1 space-y-1">
                <p className="text-[10px] text-slate-500 font-medium">to: {selectedEmail.receiverEmail}</p>
                {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                  <p className="text-[10px] text-slate-400">cc: {selectedEmail.cc.join(', ')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mb-8">
            {selectedEmail.body}
          </div>

          {selectedEmail.attachments.length > 0 && (
            <div className="pt-6 border-t border-slate-50 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Paperclip size={12} /> {selectedEmail.attachments.length} Attachments
              </p>
              <div className="grid grid-cols-1 gap-2">
                {selectedEmail.attachments.map((att, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate">
                      {att.type.startsWith('image/') ? <ImageIcon size={16} className="text-orange-600" /> : <FileText size={16} className="text-slate-400" />}
                      <span className="text-xs font-bold text-slate-700 truncate">{att.name}</span>
                    </div>
                    <a href={att.data} download={att.name} className="p-2 text-slate-400 hover:text-orange-600">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Enterprise Mail</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
            <Mail size={12} className="text-orange-600" /> @{domain}
          </p>
        </div>
        <button 
          onClick={() => setIsComposing(true)}
          className="bg-orange-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Compose</span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input 
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 transition-all shadow-sm text-sm"
          placeholder="Search mail by subject, sender or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'inbox' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
        >
          <Inbox size={14} /> Inbox
        </button>
        <button 
          onClick={() => setActiveTab('sent')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'sent' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
        >
          <Send size={14} /> Sent
        </button>
        <button 
          onClick={() => setActiveTab('starred')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'starred' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
        >
          <Star size={14} /> Starred
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
        {filteredEmails.map(email => (
          <div 
            key={email.id} 
            onClick={() => { onMarkRead(email.id); setSelectedEmail(email); }}
            className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer group flex items-start gap-3 hover:shadow-md ${email.read ? 'border-slate-100' : 'border-orange-100 shadow-sm ring-1 ring-orange-50'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold shadow-inner ${email.read ? 'bg-slate-50 text-slate-400' : 'bg-orange-50 text-orange-600'}`}>
              {email.senderEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className={`text-xs font-black truncate ${email.read ? 'text-slate-500' : 'text-slate-800'}`}>
                  {activeTab === 'sent' ? `To: ${email.receiverEmail}` : email.senderEmail}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{getTimeAgo(email.createdAt)}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleStar(email.id); }}
                    className={`p-1 transition-colors ${email.starred ? 'text-amber-500' : 'text-slate-200 group-hover:text-slate-400'}`}
                  >
                    <Star size={14} fill={email.starred ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
              <p className={`text-[11px] font-bold mt-0.5 truncate ${email.read ? 'text-slate-500' : 'text-slate-900'}`}>{email.subject}</p>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 leading-relaxed">{email.body}</p>
            </div>
          </div>
        ))}

        {filteredEmails.length === 0 && (
          <div className="py-24 text-center text-slate-300">
            <Mail size={64} className="mx-auto mb-4 opacity-10" />
            <p className="text-xs font-black uppercase tracking-widest">No communications found</p>
            <p className="text-[9px] mt-1 font-bold">Your enterprise inbox is clean.</p>
          </div>
        )}
      </div>

      {isComposing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Mail size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Compose Node</h3>
              </div>
              <button onClick={() => setIsComposing(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div className="relative group">
                <div className="absolute right-4 top-3 flex items-center gap-3">
                   <button type="button" onClick={() => setShowCc(!showCc)} className={`text-[10px] font-black uppercase tracking-widest hover:text-orange-600 transition-colors ${showCc ? 'text-orange-600' : 'text-slate-400'}`}>Cc</button>
                   <button type="button" onClick={() => setShowBcc(!showBcc)} className={`text-[10px] font-black uppercase tracking-widest hover:text-orange-600 transition-colors ${showBcc ? 'text-orange-600' : 'text-slate-400'}`}>Bcc</button>
                </div>
                <input 
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs font-bold pr-20 transition-all"
                  placeholder={`To (username or username@${domain})`}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                />
                <p className="text-[9px] text-slate-400 mt-1 ml-1">All emails must use @{domain} domain</p>
              </div>

              {showCc && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <input 
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs font-bold transition-all"
                    placeholder={`Cc (username or username@${domain}, comma separated)`}
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                  />
                </div>
              )}

              {showBcc && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <input 
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs font-bold transition-all"
                    placeholder={`Bcc (username or username@${domain}, comma separated)`}
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                  />
                </div>
              )}

              <input 
                className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs font-bold transition-all"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              
              <div className="relative">
                <textarea 
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-500 text-xs font-medium min-h-[150px] resize-none transition-all leading-relaxed"
                  placeholder="Compose your enterprise communication..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 py-2">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg text-[9px] font-black text-orange-600 border border-orange-100 shadow-sm group">
                      <Paperclip size={10} /> 
                      <span className="max-w-[100px] truncate">{att.name}</span>
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-orange-400 hover:text-rose-500"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => document.getElementById('email-attach')?.click()}
                  className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors shadow-sm"
                  title="Attach File"
                >
                  <Paperclip size={20} />
                </button>
                <input type="file" id="email-attach" className="hidden" onChange={handleFileUpload} />
                <button type="submit" className="flex-1 py-4 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2 group">
                  <Send size={18} className="group-hover:translate-x-1 transition-transform" /> Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
