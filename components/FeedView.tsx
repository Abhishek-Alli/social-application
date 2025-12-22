
import React, { useMemo, useState } from 'react';
import { Post, User, Comment } from '../types';
import { Heart, MessageSquare, Share2, MoreHorizontal, User as UserIcon, Send, X, Trash2 } from 'lucide-react';

interface FeedViewProps {
  posts: Post[];
  currentUser: User;
  allUsers: User[];
  onLike: (postId: string) => void;
  onComment: (postId: string, text: string) => void;
  onShare: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ posts, currentUser, allUsers, onLike, onComment, onShare, onDelete }) => {
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const userMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    allUsers.forEach(u => map[u.username] = u.id);
    return map;
  }, [allUsers]);

  const renderText = (text: string) => {
    const parts = text.split(/([@#]\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        if (userMap[username]) {
          return <span key={i} className="text-orange-600 font-bold">@{username}</span>;
        }
      }
      if (part.startsWith('#')) {
        return <span key={i} className="text-blue-500 font-bold">{part}</span>;
      }
      return part;
    });
  };

  const sortedPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(postId, commentText);
    setCommentText('');
    // Optionally stay open
  };

  return (
    <div className="space-y-6 pb-32">
      {sortedPosts.map(post => {
        const isLiked = post.likes.includes(currentUser.id);
        const ratioClass = post.ratio === '16:9' ? 'aspect-[16/9]' : post.ratio === '3:4' ? 'aspect-[3/4]' : 'aspect-square';
        const showComments = commentingOn === post.id;

        return (
          <div key={post.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                  {post.userName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{post.userName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">@{post.userUsername}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onDelete && (post.userId === currentUser.id || currentUser.role === 'admin') && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this post?')) {
                        onDelete(post.id);
                      }
                    }}
                    className="text-rose-500 hover:text-rose-700 p-2 transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button className="text-slate-400 p-2"><MoreHorizontal size={18} /></button>
              </div>
            </div>

            {(post.image || post.video) && (
              <div className={`w-full bg-slate-900 flex items-center justify-center relative ${ratioClass}`}>
                {post.video ? (
                  <video src={post.video} className="w-full h-full object-cover" controls loop playsInline />
                ) : post.image ? (
                  <img src={post.image} alt="Post content" className="w-full h-full object-cover" />
                ) : null}
                {post.video && (
                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] text-white font-black uppercase tracking-widest pointer-events-none">
                    Reel
                  </div>
                )}
              </div>
            )}

            <div className="p-4">
              <p className="text-sm text-slate-700 leading-relaxed mb-4">
                {renderText(post.text)}
              </p>

              <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                <button 
                  onClick={() => onLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-all ${isLiked ? 'text-rose-500 scale-110' : 'text-slate-400'}`}
                >
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} /> {post.likes.length}
                </button>
                <button 
                  onClick={() => setCommentingOn(showComments ? null : post.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-all ${showComments ? 'text-orange-600' : 'text-slate-400'}`}
                >
                  <MessageSquare size={18} /> {post.comments?.length || 0}
                </button>
                <button 
                  onClick={() => onShare(post.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 ml-auto active:scale-95 transition-transform"
                >
                  <Share2 size={18} /> Share
                </button>
              </div>

              {/* Comments Section */}
              {showComments && (
                <div className="mt-4 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3 mb-4 max-h-40 overflow-y-auto no-scrollbar">
                    {post.comments?.map(comment => (
                      <div key={comment.id} className="flex gap-2">
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                          {comment.userName.charAt(0)}
                        </div>
                        <div className="bg-slate-50 p-2 rounded-2xl flex-1">
                          <p className="text-[10px] font-bold text-slate-800">{comment.userName}</p>
                          <p className="text-[11px] text-slate-600">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    {(!post.comments || post.comments.length === 0) && (
                      <p className="text-[10px] text-center text-slate-400 py-2">No comments yet. Be the first!</p>
                    )}
                  </div>
                  <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-2">
                    <input 
                      className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-orange-500"
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button type="submit" className="p-2 bg-orange-600 text-white rounded-xl active:scale-95 transition-all">
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {posts.length === 0 && (
        <div className="py-20 text-center text-slate-300">
          <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-4">
             <UserIcon size={32} className="opacity-20" />
          </div>
          <p className="text-sm font-bold">No achievements shared yet</p>
          <p className="text-[10px] font-bold uppercase mt-1">Be the first to post something!</p>
        </div>
      )}
    </div>
  );
};
