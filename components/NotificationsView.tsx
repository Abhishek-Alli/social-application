
import React from 'react';
import { Notification } from '../types';
import { Bell, Check, Trash2, ListTodo, Megaphone, Info, Clock, CheckCircle2, Phone, MessageCircle, FileText, Users, Mail, Heart, UserPlus, X } from 'lucide-react';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNavigate: (view: any) => void;
  onAcceptConnection?: (connectionId: string) => Promise<void>;
  onDeclineConnection?: (connectionId: string) => Promise<void>;
  connections?: any[];
  currentUserId?: string;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ 
  notifications, 
  onMarkAsRead, 
  onClearAll,
  onNavigate,
  onAcceptConnection,
  onDeclineConnection,
  connections = [],
  currentUserId
}) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task': return <ListTodo size={16} className="text-blue-500" />;
      case 'complaint': return <Megaphone size={16} className="text-orange-500" />;
      case 'update': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'call': return <Phone size={16} className="text-purple-500" />;
      case 'message': return <MessageCircle size={16} className="text-indigo-500" />;
      case 'post': return <FileText size={16} className="text-cyan-500" />;
      case 'group': return <Users size={16} className="text-pink-500" />;
      case 'note': return <FileText size={16} className="text-yellow-500" />;
      case 'email': return <Mail size={16} className="text-red-500" />;
      case 'like': return <Heart size={16} className="text-rose-500" />;
      case 'comment': return <MessageCircle size={16} className="text-blue-500" />;
      case 'connection': return <UserPlus size={16} className="text-orange-500" />;
      default: return <Info size={16} className="text-slate-400" />;
    }
  };

  // Get connection ID from notification - find pending connection where current user is the receiver
  const getConnectionFromNotification = (notification: Notification) => {
    if (notification.type !== 'connection' || !currentUserId || notification.title !== 'Connection Request') return null;
    
    // Find the most recent pending connection where current user is the receiver
    // Sort by created date descending to get the most recent one first
    const pendingConnections = connections.filter((c: any) => 
      c.status === 'pending' &&
      c.connectedUserId === currentUserId &&
      c.userId !== currentUserId
    ).sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    
    // Try to match by notification creation time (connection created around the same time as notification)
    if (pendingConnections.length > 0) {
      const notificationTime = new Date(notification.createdAt).getTime();
      // Find connection created closest to notification time
      const matchedConnection = pendingConnections.reduce((closest: any, current: any) => {
        const currentTime = new Date(current.createdAt || 0).getTime();
        const closestTime = new Date(closest.createdAt || 0).getTime();
        const currentDiff = Math.abs(notificationTime - currentTime);
        const closestDiff = Math.abs(notificationTime - closestTime);
        return currentDiff < closestDiff ? current : closest;
      });
      
      return matchedConnection;
    }
    
    return null;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
          <p className="text-xs text-slate-400 font-medium">Stay updated with your activities</p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={onClearAll}
            className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg"
          >
            <Trash2 size={12} /> Clear All
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map(notification => {
            const connection = getConnectionFromNotification(notification);
            const isConnectionRequest = notification.type === 'connection' && connection && notification.title === 'Connection Request';
            
            return (
              <div 
                key={notification.id}
                className={`bg-white p-4 rounded-2xl border transition-all relative overflow-hidden ${notification.read ? 'border-slate-100 opacity-80' : 'border-orange-100 shadow-sm ring-1 ring-orange-50'} ${isConnectionRequest ? '' : 'cursor-pointer'}`}
                onClick={() => {
                  if (!isConnectionRequest) {
                    onMarkAsRead(notification.id);
                    if (notification.linkTo) onNavigate(notification.linkTo);
                  }
                }}
              >
                {!notification.read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.read ? 'bg-slate-50' : 'bg-orange-50'}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-xs font-bold leading-tight ${notification.read ? 'text-slate-500' : 'text-slate-800'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap uppercase flex items-center gap-1">
                        <Clock size={10} /> {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {/* Accept/Decline buttons for connection requests */}
                    {isConnectionRequest && connection && onAcceptConnection && onDeclineConnection && (
                      <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await onAcceptConnection(connection.id);
                              onMarkAsRead(notification.id);
                            } catch (error) {
                              console.error('Failed to accept connection:', error);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-1"
                        >
                          <Check size={14} />
                          Accept
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await onDeclineConnection(connection.id);
                              onMarkAsRead(notification.id);
                            } catch (error) {
                              console.error('Failed to decline connection:', error);
                            }
                          }}
                          className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-all flex items-center justify-center gap-1"
                        >
                          <X size={14} />
                          Ignore
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className="opacity-20" />
            </div>
            <p className="text-sm font-bold">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No new notifications for you</p>
          </div>
        )}
      </div>
    </div>
  );
};
