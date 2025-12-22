
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Message, Group, Role, MessageAttachment, CallInfo } from '../types';
import { 
  Search, Send, ArrowLeft, User as UserIcon, MessageCircle, 
  Users, Plus, Hash, Trash2, Paperclip, Video, Phone, 
  X, ExternalLink, Image as ImageIcon, FileText, 
  Mic, Camera, PhoneOff, Link as LinkIcon, Check, CheckCheck, Reply, AtSign 
} from 'lucide-react';

interface ChatViewProps {
  currentUser: User;
  allUsers: User[];
  messages: Message[];
  groups: Group[];
  onSendMessage: (receiverId: string | undefined, groupId: string | undefined, text: string, attachment?: MessageAttachment, replyToId?: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onCreateGroup: (name: string, description: string) => void;
  onJoinGroup: (groupId: string) => void;
  onStartCall: (type: 'audio' | 'video', targetId: string, isGroup: boolean) => void;
  onEndCall: (callId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ 
  currentUser, 
  allUsers, 
  messages, 
  groups,
  onSendMessage,
  onDeleteMessage,
  onCreateGroup,
  onJoinGroup,
  onStartCall,
  onEndCall
}) => {
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'direct' | 'groups'>('direct');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [showCallOverlay, setShowCallOverlay] = useState<CallInfo | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChatUser, activeGroup, messages]);

  const canCreateGroup = currentUser.role === Role.ADMIN || 
                         currentUser.role === Role.MANAGEMENT || 
                         currentUser.role === Role.HOD;

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allUsers.filter(u => 
      u.id !== currentUser.id && 
      (u.name.toLowerCase().includes(query) || (u.username && `@${u.username.toLowerCase()}`.includes(query)))
    );
  }, [allUsers, searchQuery, currentUser.id]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return groups.filter(g => 
      g.name.toLowerCase().includes(query) || g.description.toLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

  const conversationMessages = useMemo(() => {
    if (activeChatUser) {
      return messages.filter(m => 
        (m.senderId === currentUser.id && m.receiverId === activeChatUser.id) ||
        (m.senderId === activeChatUser.id && m.receiverId === currentUser.id)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (activeGroup) {
      return messages.filter(m => m.groupId === activeGroup.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return [];
  }, [messages, activeChatUser, activeGroup, currentUser.id]);

  const myGroups = useMemo(() => {
    return groups.filter(g => g.members.includes(currentUser.id));
  }, [groups, currentUser.id]);

  const recentDirectChats = useMemo(() => {
    const chatUserIds = new Set<string>();
    messages.forEach(m => {
      if (!m.groupId) {
        if (m.senderId === currentUser.id) chatUserIds.add(m.receiverId!);
        if (m.receiverId === currentUser.id) chatUserIds.add(m.senderId);
      }
    });
    return allUsers.filter(u => chatUserIds.has(u.id));
  }, [messages, allUsers, currentUser.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !attachment) return;
    const receiverId = activeChatUser?.id;
    const groupId = activeGroup?.id;
    onSendMessage(receiverId, groupId, messageText.trim(), attachment || undefined, replyingTo?.id);
    setMessageText('');
    setAttachment(null);
    setReplyingTo(null);
  };

  const handleCall = (type: 'audio' | 'video') => {
    const targetId = activeChatUser ? activeChatUser.id : activeGroup!.id;
    const isGroup = !!activeGroup;
    onStartCall(type, targetId, isGroup);
    setShowCallOverlay({
      id: 'call_' + Date.now(),
      type,
      status: 'active',
      startedBy: currentUser.id,
      groupId: isGroup ? targetId : undefined
    });
  };

  const userMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    allUsers.forEach(u => map[u.id] = u.name);
    return map;
  }, [allUsers]);

  const getUserName = (userId: string): string => {
    return userMap[userId] || 'Deleted Account';
  };

  const usernameMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    allUsers.forEach(u => map[u.username] = u.id);
    return map;
  }, [allUsers]);

  const renderStatus = (status?: Message['status']) => {
    if (!status) return null;
    switch (status) {
      case 'sent':
        return <Check size={10} className="text-white opacity-60" />;
      case 'delivered':
        return <CheckCheck size={10} className="text-white opacity-60" />;
      case 'seen':
        return <CheckCheck size={10} className="text-blue-300" />;
      default:
        return null;
    }
  };

  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        if (usernameMap[username]) {
          return <span key={i} className="text-blue-400 font-bold bg-white/10 px-1 rounded">{part}</span>;
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (showCallOverlay) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-between p-10 animate-in fade-in zoom-in">
        <div className="text-center mt-10">
          <div className="w-24 h-24 bg-orange-600 rounded-full mx-auto flex items-center justify-center mb-6 ring-4 ring-orange-600/20">
            {showCallOverlay.type === 'video' ? <Camera size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {showCallOverlay.groupId ? groups.find(g => g.id === showCallOverlay.groupId)?.name : activeChatUser?.name}
          </h2>
          <p className="text-orange-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            {showCallOverlay.type === 'video' ? 'Video Conference' : 'Audio Channel'} Active
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
           <div className="bg-slate-800 p-6 rounded-3xl grid grid-cols-2 gap-8 mb-10">
              <div className="flex flex-col items-center gap-2">
                <button className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center text-white"><Mic size={24}/></button>
                <span className="text-[10px] text-slate-400 font-bold">Mute</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center text-white"><Camera size={24}/></button>
                <span className="text-[10px] text-slate-400 font-bold">Video</span>
              </div>
           </div>
           
           <button 
             onClick={() => {
               onEndCall(showCallOverlay.id);
               setShowCallOverlay(null);
             }}
             className="w-20 h-20 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-900/50 active:scale-90 transition-all"
           >
             <PhoneOff size={32} />
           </button>
        </div>
      </div>
    );
  }

  if (activeChatUser || activeGroup) {
    const isDeletedUser = activeChatUser && !allUsers.find(u => u.id === activeChatUser.id);
    const title = activeChatUser ? (isDeletedUser ? 'Deleted Account' : activeChatUser.name) : activeGroup?.name;
    const subtitle = activeChatUser ? (isDeletedUser ? 'Account has been deleted' : `@${activeChatUser.username}`) : `${activeGroup?.members.length} members`;
    const initial = activeChatUser ? (isDeletedUser ? '?' : activeChatUser.name.charAt(0)) : '#';

    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => { setActiveChatUser(null); setActiveGroup(null); setReplyingTo(null); }} className="p-2 bg-white rounded-xl border border-slate-100 text-slate-500 shadow-sm">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${activeGroup ? 'bg-slate-900 text-white' : 'bg-orange-100 text-orange-600'}`}>
                {initial}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{subtitle}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => handleCall('audio')} className="p-2.5 text-slate-400 hover:text-orange-600 transition-colors">
              <Phone size={18} />
            </button>
            <button onClick={() => handleCall('video')} className="p-2.5 text-slate-400 hover:text-orange-600 transition-colors">
              <Video size={18} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar mb-4">
          {conversationMessages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            const repliedMessage = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
            return (
              <div key={msg.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                {activeGroup && !isMe && (
                  <span className="text-[8px] font-bold text-slate-400 ml-1 mb-1 uppercase">
                    {getUserName(msg.senderId)}
                  </span>
                )}
                <div className={`relative max-w-[85%] p-3 rounded-2xl text-xs font-medium shadow-sm transition-all group-hover:pr-14 ${
                  isMe 
                    ? 'bg-orange-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  {repliedMessage && (
                    <div className={`mb-2 p-2 rounded-lg border-l-4 text-[10px] ${isMe ? 'bg-black/10 border-white/40' : 'bg-slate-50 border-orange-500'} italic truncate`}>
                      <span className="font-bold block not-italic mb-1 opacity-70">Replying to {getUserName(repliedMessage.senderId)}</span>
                      {repliedMessage.text}
                    </div>
                  )}

                  {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{renderTextWithMentions(msg.text)}</p>}
                  
                  {msg.attachment && (
                    <div className={`mt-2 p-2 rounded-xl flex items-center gap-3 ${isMe ? 'bg-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                      {msg.attachment.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                      <span className="text-[10px] font-bold truncate max-w-[120px]">{msg.attachment.name}</span>
                      <a href={msg.attachment.data} download={msg.attachment.name} className="ml-auto">
                        <ExternalLink size={12} className={isMe ? 'text-white' : 'text-orange-600'} />
                      </a>
                    </div>
                  )}

                  <div className={`text-[8px] mt-1 opacity-60 text-right flex items-center justify-end gap-1`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && renderStatus(msg.status)}
                  </div>

                  <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      className="p-1.5 text-slate-300 hover:text-white transition-colors"
                      title="Reply"
                    >
                      <Reply size={14} />
                    </button>
                    {isMe && (
                      <button 
                        onClick={() => onDeleteMessage(msg.id)}
                        className="p-1.5 text-rose-300 hover:text-rose-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {replyingTo && (
          <div className="p-3 bg-white border border-slate-100 rounded-t-2xl flex items-center justify-between mb-1 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-3 overflow-hidden">
               <div className="flex-1 truncate">
                 <p className="text-[10px] font-bold text-orange-600 uppercase">Replying to {getUserName(replyingTo.senderId)}</p>
                 <p className="text-[11px] text-slate-500 truncate">{replyingTo.text || (replyingTo.attachment ? 'Attachment' : 'Message')}</p>
               </div>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-rose-500">
              <X size={18} />
            </button>
          </div>
        )}

        {attachment && (
          <div className="p-3 bg-white border border-slate-100 rounded-t-2xl flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 truncate">
              {attachment.type.startsWith('image/') ? <ImageIcon size={16} className="text-orange-600" /> : <FileText size={16} className="text-orange-600" />}
              <span className="text-xs font-bold text-slate-700 truncate">{attachment.name}</span>
            </div>
            <button onClick={() => setAttachment(null)} className="text-slate-400 hover:text-rose-500">
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-orange-600 transition-colors"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="relative flex-1">
             <input 
              className="w-full bg-transparent p-3 text-sm focus:ring-0"
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>
          <button type="submit" className="p-3 bg-orange-600 text-white rounded-xl active:scale-95 transition-all">
            <Send size={18} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Enterprise Chat</h2>
          <p className="text-xs text-slate-400 font-medium">Connect with SRJ Personnel</p>
        </div>
        {canCreateGroup && (
          <button 
            onClick={() => setIsCreatingGroup(!isCreatingGroup)}
            className={`p-2.5 rounded-xl border transition-all ${isCreatingGroup ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-100'}`}
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {isCreatingGroup && (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!groupName.trim()) return;
          onCreateGroup(groupName, groupDesc);
          setGroupName('');
          setGroupDesc('');
          setIsCreatingGroup(false);
        }} className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm animate-in slide-in-from-top-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Launch Work Group</h3>
          <input 
            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-bold"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
          <textarea 
            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm resize-none"
            placeholder="Group Objective"
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
          />
          <button type="submit" className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-orange-100 active:scale-95 transition-all">
            Initialize Huddle
          </button>
        </form>
      )}

      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('direct')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${activeTab === 'direct' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
        >
          Personnel
        </button>
        <button 
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${activeTab === 'groups' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
        >
          Huddles
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input 
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 transition-all shadow-sm text-sm"
          placeholder={activeTab === 'direct' ? "Search by @username..." : "Search for groups..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {activeTab === 'direct' ? (
        <div className="space-y-3">
          {searchQuery ? (
            filteredUsers.map(user => (
              <button key={user.id} onClick={() => setActiveChatUser(user)} className="w-full bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-black">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-slate-800">{user.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">@{user.username}</p>
                  </div>
                </div>
                <MessageCircle size={18} className="text-slate-300 group-hover:text-orange-600" />
              </button>
            ))
          ) : (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Recent threads</p>
              {recentDirectChats.map(user => (
                <button key={user.id} onClick={() => setActiveChatUser(user)} className="w-full bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-black">
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-slate-800">{user.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">@{user.username}</p>
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                </button>
              ))}
              {recentDirectChats.length === 0 && (
                <div className="py-20 text-center text-slate-300">
                  <UserIcon className="mx-auto mb-4 opacity-5" size={64} />
                  <p className="text-xs font-bold uppercase tracking-widest">No active personnel threads</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {searchQuery ? (
            filteredGroups.map(group => {
              const isMember = group.members.includes(currentUser.id);
              return (
                <div key={group.id} className="w-full bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-black shadow-sm">
                      <Hash size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-slate-800">{group.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{group.members.length} members</p>
                    </div>
                  </div>
                  {isMember ? (
                    <button onClick={() => setActiveGroup(group)} className="p-2 text-orange-600 bg-orange-50 rounded-lg">
                      <MessageCircle size={18} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => onJoinGroup(group.id)}
                      className="px-4 py-2 bg-orange-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md"
                    >
                      Join
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Active Huddles</p>
              {myGroups.map(group => (
                <button key={group.id} onClick={() => setActiveGroup(group)} className="w-full bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-black">
                      <Hash size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-slate-800">{group.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{group.members.length} members</p>
                    </div>
                  </div>
                  {group.activeCall ? (
                     <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full animate-pulse">
                        <Video size={14} />
                        <span className="text-[10px] font-black uppercase">Live</span>
                     </div>
                  ) : (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white" />
                  )}
                </button>
              ))}
              {myGroups.length === 0 && (
                <div className="py-20 text-center text-slate-300">
                  <Users className="mx-auto mb-4 opacity-5" size={64} />
                  <p className="text-xs font-bold uppercase tracking-widest">Join a group to huddle</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
