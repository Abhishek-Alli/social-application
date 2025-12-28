
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Post, User, Comment } from '../types';
import { Heart, MessageSquare, Share2, MoreHorizontal, User as UserIcon, Send, X, Trash2, Download, Users, ChevronLeft, ChevronRight, Search, UserPlus, UserCircle, CheckCircle2, ChevronRight as ChevronRightIcon, MessageCircle } from 'lucide-react';

interface FeedViewProps {
  posts: Post[];
  currentUser: User;
  allUsers: User[];
  connections?: any[];
  onLike: (postId: string) => void;
  onComment: (postId: string, text: string) => void;
  onShare: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onConnect?: (userId: string) => Promise<void>;
  onDisconnect?: (connectionId: string) => Promise<void>;
  onNavigateToChat?: (userId: string) => void;
}

// Helper function to get user stats
const getUserStats = (userId: string, posts: Post[], connections: any[], currentUserId: string) => {
  const userPosts = posts.filter(p => p.userId === userId).length;
  
  const userConnections = connections.filter((c: any) => 
    c.status === 'accepted' && 
    (c.userId === userId || c.connectedUserId === userId)
  );
  const followers = userConnections.length;
  
  const following = connections.filter((c: any) => 
    c.status === 'accepted' && 
    c.userId === userId &&
    c.connectedUserId !== currentUserId
  ).length;
  
  return { posts: userPosts, followers, following };
};

// Image Carousel Component
const ImageCarousel: React.FC<{ images: string[]; postId: string }> = ({ images, postId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      className="relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-full overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img, index) => (
            <div key={index} className="min-w-full h-full flex-shrink-0">
              <img 
                src={img} 
                alt={`Post image ${index + 1}`} 
                className="w-full h-full object-cover" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Image Counter */}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white font-bold z-10">
            {currentIndex + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
};

export const FeedView: React.FC<FeedViewProps> = ({ posts, currentUser, allUsers, connections = [], onLike, onComment, onShare, onDelete, onConnect, onDisconnect, onNavigateToChat }) => {
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showLikesModal, setShowLikesModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const userMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    allUsers.forEach(u => map[u.username] = u.id);
    return map;
  }, [allUsers]);

  const userIdToUserMap = useMemo(() => {
    const map: { [key: string]: User } = {};
    allUsers.forEach(u => map[u.id] = u);
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

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const filtered = allUsers.filter(user => 
        user.id !== currentUser.id && (
          user.name.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        )
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allUsers, currentUser.id]);

  // Get connection status and connection object for a user
  const getConnectionInfo = (userId: string): { status: 'connected' | 'pending' | 'none', connection: any | null } => {
    const connection = connections.find((c: any) => 
      (c.userId === currentUser.id && c.connectedUserId === userId) ||
      (c.userId === userId && c.connectedUserId === currentUser.id)
    );
    if (!connection) return { status: 'none', connection: null };
    if (connection.status === 'accepted') return { status: 'connected', connection };
    if (connection.status === 'pending') return { status: 'pending', connection };
    return { status: 'none', connection: null };
  };

  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(postId, commentText);
    setCommentText('');
    // Optionally stay open
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Get liked users for a post
  const getLikedUsers = (post: Post): User[] => {
    return post.likes
      .map(userId => userIdToUserMap[userId])
      .filter((user): user is User => user !== undefined);
  };

  // Get liked by text
  const getLikedByText = (post: Post): string => {
    const likedUsers = getLikedUsers(post);
    if (likedUsers.length === 0) return '';
    
    const currentUserLiked = post.likes.includes(currentUser.id);
    const otherUsers = likedUsers.filter(u => u.id !== currentUser.id);
    
    if (currentUserLiked && otherUsers.length === 0) {
      return 'You liked this';
    } else if (currentUserLiked && otherUsers.length === 1) {
      return `You and ${otherUsers[0].name} liked this`;
    } else if (currentUserLiked && otherUsers.length > 1) {
      return `You and ${otherUsers.length} others liked this`;
    } else if (otherUsers.length === 1) {
      return `${otherUsers[0].name} liked this`;
    } else if (otherUsers.length === 2) {
      return `${otherUsers[0].name} and ${otherUsers[1].name} liked this`;
    } else {
      return `${otherUsers[0].name} and ${otherUsers.length - 1} others liked this`;
    }
  };

  // Download media function
  const handleDownloadMedia = async (post: Post) => {
    try {
      // Handle multiple images
      const images = post.images && post.images.length > 0 ? post.images : (post.image ? [post.image] : []);
      
      // If multiple images, download all
      if (images.length > 1) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const response = await fetch(img);
          const blob = await response.blob();
          const file = new File([blob], `post_${post.id}_${i + 1}_${Date.now()}.jpg`, { 
            type: 'image/jpeg' 
          });
          
          if (navigator.share && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
            try {
              await navigator.share({
                files: [file],
                title: `Post Image ${i + 1}`
              });
              // Small delay between shares
              if (i < images.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (err) {
              console.error('Share failed, falling back to download:', err);
              const url = URL.createObjectURL(file);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name;
              a.click();
              URL.revokeObjectURL(url);
            }
          } else {
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
        setOpenMenuId(null);
        return;
      }

      // Single image or video
      const mediaUrl = post.video || (images.length > 0 ? images[0] : null);
      if (!mediaUrl) return;

      const type = post.video ? 'video' : 'image';
      const filename = post.video 
        ? `reel_${post.id}_${Date.now()}.mp4`
        : `post_${post.id}_${Date.now()}.jpg`;

      // Convert data URL to blob
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // On mobile devices, use Web Share API for better gallery integration
      if ('share' in navigator && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        const file = new File([blob], filename, { 
          type: type === 'image' ? 'image/jpeg' : 'video/mp4' 
        });
        try {
          await navigator.share({
            files: [file],
            title: filename
          });
        } catch (shareError) {
          // Share API failed, download will still work
          console.log('Share API not available, using download');
        }
      }
      
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to download media:', error);
      alert('Failed to download. Please try again.');
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search users by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery.trim() && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto no-scrollbar">
            <div className="p-2">
              {searchResults.map(user => {
                const { status: connectionStatus } = getConnectionInfo(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                    onClick={() => setViewingUserProfile(user)}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={32} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                      {user.designation && (
                        <p className="text-xs text-slate-400 truncate">{user.designation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {connectionStatus === 'connected' && onNavigateToChat && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToChat(user.id);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Send Message"
                        >
                          <MessageCircle size={18} />
                        </button>
                      )}
                      {connectionStatus === 'pending' && (() => {
                        const { connection } = getConnectionInfo(user.id);
                        return onDisconnect && connection ? (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm('Cancel connection request?')) {
                                await onDisconnect(connection.id);
                              }
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Cancel Request"
                          >
                            <X size={18} />
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 px-2 py-1 bg-amber-50 rounded-lg">Pending</span>
                        );
                      })()}
                      {connectionStatus === 'none' && onConnect && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await onConnect(user.id);
                          }}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          title="Connect"
                        >
                          <UserPlus size={18} />
                        </button>
                      )}
                      <ChevronRightIcon size={18} className="text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-8 text-center">
            <UserCircle size={48} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No users found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* User Profile View Modal */}
      {viewingUserProfile && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => {
            setViewingUserProfile(null);
            setSearchQuery('');
          }}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Profile</h3>
              <button
                onClick={() => {
                  setViewingUserProfile(null);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Profile Header - Instagram Style */}
              <div className="flex gap-6 mb-6">
                {/* Profile Picture - Left Side */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                      {viewingUserProfile.profilePhoto ? (
                        <img src={viewingUserProfile.profilePhoto} alt={viewingUserProfile.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={64} className="text-slate-300" />
                      )}
                    </div>
                    {viewingUserProfile.isEmailVerified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="text-white" size={12} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info - Right Side */}
                <div className="flex-1 min-w-0">
                  {/* Username */}
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-900 mb-2">{viewingUserProfile.username}</h2>
                    
                    {/* Stats Row */}
                    {(() => {
                      const stats = getUserStats(viewingUserProfile.id, posts, connections, currentUser.id);
                      return (
                        <div className="flex gap-6 mb-4">
                          <div className="text-center">
                            <div className="text-base font-bold text-slate-900">{stats.posts}</div>
                            <div className="text-xs text-slate-600">posts</div>
                          </div>
                          <div className="text-center">
                            <div className="text-base font-bold text-slate-900">{stats.followers}</div>
                            <div className="text-xs text-slate-600">followers</div>
                          </div>
                          <div className="text-center">
                            <div className="text-base font-bold text-slate-900">{stats.following}</div>
                            <div className="text-xs text-slate-600">following</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Full Name */}
                    <p className="text-sm font-semibold text-slate-900 mb-1">{viewingUserProfile.name}</p>
                    
                    {/* Connection Buttons */}
                    {(() => {
                      const { status: connectionStatus, connection } = getConnectionInfo(viewingUserProfile.id);
                      if (connectionStatus === 'connected') {
                        return (
                          <div className="flex gap-2 mt-3">
                            {onNavigateToChat && (
                              <button
                                onClick={() => {
                                  onNavigateToChat(viewingUserProfile.id);
                                  setViewingUserProfile(null);
                                  setSearchQuery('');
                                }}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                              >
                                <MessageCircle size={16} />
                                Send Message
                              </button>
                            )}
                            {onDisconnect && connection && (
                              <button
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to disconnect?')) {
                                    await onDisconnect(connection.id);
                                  }
                                }}
                                className="px-4 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-all"
                              >
                                Disconnect
                              </button>
                            )}
                          </div>
                        );
                      } else if (connectionStatus === 'pending' && onDisconnect && connection) {
                        return (
                          <button
                            onClick={async () => {
                              if (window.confirm('Cancel connection request?')) {
                                await onDisconnect(connection.id);
                              }
                            }}
                            className="w-full mt-3 px-4 py-2 bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-200 transition-all"
                          >
                            Cancel Request
                          </button>
                        );
                      } else if (onConnect) {
                        return (
                          <button
                            onClick={async () => {
                              await onConnect(viewingUserProfile.id);
                            }}
                            className="w-full mt-3 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-all"
                          >
                            Connect
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {viewingUserProfile.bio && (
                <div className="mb-4">
                  <p className="text-sm text-slate-900 leading-relaxed">{viewingUserProfile.bio}</p>
                </div>
              )}

              {/* Additional Info */}
              {(viewingUserProfile.designation || viewingUserProfile.department || viewingUserProfile.employeeId) && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="space-y-2 text-xs">
                    {viewingUserProfile.designation && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Designation:</span>
                        <span className="text-slate-900 font-semibold">{viewingUserProfile.designation}</span>
                      </div>
                    )}
                    {viewingUserProfile.department && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Department:</span>
                        <span className="text-slate-900 font-semibold">{viewingUserProfile.department}</span>
                      </div>
                    )}
                    {viewingUserProfile.employeeId && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Employee ID:</span>
                        <span className="text-slate-900 font-semibold">{viewingUserProfile.employeeId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center gap-1 relative">
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
                <div className="relative" ref={(el) => { menuRefs.current[post.id] = el; }}>
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                    className="text-slate-400 hover:text-slate-600 p-2 transition-colors"
                    title="More options"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {openMenuId === post.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 min-w-[160px] animate-in fade-in slide-in-from-top-2">
                      {((post.images && post.images.length > 0) || post.image || post.video) && (
                        <button
                          onClick={() => handleDownloadMedia(post)}
                          className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <Download size={16} className="text-slate-500" />
                          <span>Download {post.images && post.images.length > 1 ? 'All Images' : 'Media'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {((post.images && post.images.length > 0) || post.image || post.video) && (
              <div className={`w-full bg-slate-900 flex items-center justify-center relative ${ratioClass} overflow-hidden`}>
                {post.video ? (
                  <video src={post.video} className="w-full h-full object-cover" controls loop playsInline />
                ) : (post.images && post.images.length > 0) ? (
                  <ImageCarousel images={post.images} postId={post.id} />
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

              {/* Liked by text */}
              {post.likes.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowLikesModal(post.id)}
                    className="text-xs text-slate-600 hover:text-slate-800 font-bold transition-colors cursor-pointer"
                  >
                    {getLikedByText(post)}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => onLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-all ${isLiked ? 'text-rose-500 scale-110' : 'text-slate-400'}`}
                  >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                    <span>{post.likes.length}</span>
                  </button>
                  {post.likes.length > 0 && (
                    <button
                      onClick={() => setShowLikesModal(post.id)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold ml-1 transition-colors"
                      title="View all likes"
                    >
                      <Users size={14} />
                    </button>
                  )}
                </div>
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

      {/* Likes Modal */}
      {showLikesModal && (() => {
        const post = posts.find(p => p.id === showLikesModal);
        if (!post) return null;
        const likedUsers = getLikedUsers(post);
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col animate-in zoom-in">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                    <Heart size={20} className="text-rose-600" fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Likes</h3>
                    <p className="text-xs text-slate-500 font-bold">{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLikesModal(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {likedUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-bold">No likes yet</p>
                  </div>
                ) : (
                  likedUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase">@{user.username}</p>
                      </div>
                      {user.id === currentUser.id && (
                        <span className="text-xs text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded-full">You</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
