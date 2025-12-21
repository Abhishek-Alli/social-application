
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, ViewType, Note, Role, User, Complaint, ComplaintAttachment, Notification, Message, Group, MessageAttachment, Post, Comment, Project, Email } from './types';
import { userService, projectService } from './services/supabaseService';
import { TaskCard } from './components/TaskCard';
import { NoteCard } from './components/NoteCard';
import { AddTaskModal } from './components/AddTaskModal';
import { AddPostModal } from './components/AddPostModal';
import { AuthView } from './components/AuthView';
import { TeamView } from './components/TeamView';
import { ComplaintsView } from './components/ComplaintsView';
import { NotificationsView } from './components/NotificationsView';
import { ChatView } from './components/ChatView';
import { FeedView } from './components/FeedView';
import { ProjectsView } from './components/ProjectsView';
import { EmailsView } from './components/EmailsView';
import { 
  Plus, 
  Calendar, 
  LayoutGrid, 
  BarChart2, 
  Bell, 
  Search,
  CheckCircle2,
  StickyNote,
  ListTodo,
  ShieldCheck,
  Users,
  User as UserIcon,
  Megaphone,
  Filter,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Clock,
  Zap,
  MessageCircle,
  HelpCircle,
  Globe,
  Layers,
  ChevronDown,
  Mail
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart as RechartsBarChart 
} from 'recharts';

type SortType = 'newest' | 'oldest' | 'priority' | 'due_date';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  
  const [view, setView] = useState<ViewType>('profile');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskSort, setTaskSort] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  
  // Login flow state
  const [needsTwoStep, setNeedsTwoStep] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Load users from Supabase on mount
  useEffect(() => {
    const loadUsersFromSupabase = async () => {
      try {
        const supabaseUsers = await userService.getAll();
        if (supabaseUsers && supabaseUsers.length > 0) {
          // Map Supabase column names (snake_case) to TypeScript types (camelCase)
          const mappedUsers = supabaseUsers.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            username: u.username,
            role: u.role as Role,
            parentId: u.parent_id || u.parentId,
            projectId: u.project_id || u.projectId,
            employeeId: u.employee_id || u.employeeId,
            department: u.department,
            subDepartment: u.sub_department || u.subDepartment,
            designation: u.designation,
            dob: u.dob,
            contactNo: u.contact_no || u.contactNo,
            profilePhoto: u.profile_photo || u.profilePhoto,
            password: u.password,
            isTwoStepEnabled: u.is_two_step_enabled !== undefined ? u.is_two_step_enabled : u.isTwoStepEnabled,
            isEmailVerified: u.is_email_verified !== undefined ? u.is_email_verified : u.isEmailVerified,
            telegramUserId: u.telegram_user_id || u.telegramUserId,
            telegramToken: u.telegram_token || u.telegramToken
          }));
          console.log('✅ Loaded users from Supabase:', mappedUsers);
          setUsers(mappedUsers);
          localStorage.setItem('srj_users', JSON.stringify(mappedUsers));
        } else {
          console.log('⚠️ No users found in Supabase, using localStorage');
        }
      } catch (error: any) {
        console.error('❌ Failed to load users from Supabase:', error);
        console.log('📦 Falling back to localStorage');
        // Don't throw - gracefully fall back to localStorage
      }
    };
    
    loadUsersFromSupabase();
  }, []);

  // Initial Data & Auth Persistence
  useEffect(() => {
    const savedProjects = localStorage.getItem('srj_projects');
    const savedCurrentProjectId = localStorage.getItem('srj_active_project_id');
    const savedUsers = localStorage.getItem('srj_users');
    const savedCurrentUser = localStorage.getItem('srj_current_user');
    const savedTasks = localStorage.getItem('srj_tasks');
    const savedNotes = localStorage.getItem('srj_notes');
    const savedPosts = localStorage.getItem('srj_posts');
    const savedComplaints = localStorage.getItem('srj_complaints');
    const savedNotifications = localStorage.getItem('srj_notifications');
    const savedMessages = localStorage.getItem('srj_messages');
    const savedGroups = localStorage.getItem('srj_groups');
    const savedEmails = localStorage.getItem('srj_emails');

    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
      const defaultProject: Project = {
        id: 'p_default',
        name: 'Main Enterprise',
        managerName: 'Admin',
        domain: 'srj.com',
        createdAt: new Date().toISOString()
      };
      setProjects([defaultProject]);
      localStorage.setItem('srj_projects', JSON.stringify([defaultProject]));
    }

    if (savedCurrentProjectId) {
      setCurrentProjectId(savedCurrentProjectId);
    } else {
      setCurrentProjectId('p_default');
    }

    // Load users from localStorage as fallback (will be overridden by Supabase if available)
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      setUsers(parsedUsers);
    }

    if (savedCurrentUser) setCurrentUser(JSON.parse(savedCurrentUser));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedComplaints) setComplaints(JSON.parse(savedComplaints));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedGroups) setGroups(JSON.parse(savedGroups));
    if (savedEmails) setEmails(JSON.parse(savedEmails));
  }, []);

  // Sync Logic
  useEffect(() => localStorage.setItem('srj_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => { if(currentProjectId) localStorage.setItem('srj_active_project_id', currentProjectId) }, [currentProjectId]);
  useEffect(() => localStorage.setItem('srj_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('srj_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('srj_notes', JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem('srj_posts', JSON.stringify(posts)), [posts]);
  useEffect(() => localStorage.setItem('srj_complaints', JSON.stringify(complaints)), [complaints]);
  useEffect(() => localStorage.setItem('srj_notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('srj_messages', JSON.stringify(messages)), [messages]);
  useEffect(() => localStorage.setItem('srj_groups', JSON.stringify(groups)), [groups]);
  useEffect(() => localStorage.setItem('srj_emails', JSON.stringify(emails)), [emails]);

  // Scoped Data Hooks
  const scopedUsers = useMemo(() => users.filter(u => u.projectId === currentProjectId || u.role === Role.ADMIN), [users, currentProjectId]);
  const scopedTasks = useMemo(() => tasks.filter(t => t.projectId === currentProjectId), [tasks, currentProjectId]);
  const scopedNotes = useMemo(() => notes.filter(n => n.projectId === currentProjectId), [notes, currentProjectId]);
  const scopedPosts = useMemo(() => posts.filter(p => p.projectId === currentProjectId), [posts, currentProjectId]);
  const scopedComplaints = useMemo(() => complaints.filter(c => c.projectId === currentProjectId), [complaints, currentProjectId]);
  const scopedNotifications = useMemo(() => notifications.filter(n => n.projectId === currentProjectId), [notifications, currentProjectId]);
  const scopedMessages = useMemo(() => messages.filter(m => m.projectId === currentProjectId), [messages, currentProjectId]);
  const scopedGroups = useMemo(() => groups.filter(g => g.projectId === currentProjectId), [groups, currentProjectId]);
  const scopedEmails = useMemo(() => emails.filter(e => e.projectId === currentProjectId), [emails, currentProjectId]);

  const activeProject = useMemo(() => projects.find(p => p.id === currentProjectId), [projects, currentProjectId]);
  const projectDomain = activeProject?.domain || 'srj.com';

  const addNotification = (userId: string, title: string, message: string, type: Notification['type'], linkTo?: ViewType) => {
    if (!currentProjectId) return;
    const newNotif: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      projectId: currentProjectId,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      linkTo
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleCreateProject = (data: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      id: 'p_' + Date.now(),
      ...data,
      domain: data.domain || 'srj.com',
      createdAt: new Date().toISOString()
    };
    setProjects(prev => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
  };

  const handleDeleteProject = (id: string) => {
    if (id === 'p_default') return alert("Cannot delete main node.");
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    setPosts(prev => prev.filter(p => p.projectId !== id));
    setUsers(prev => prev.filter(u => u.projectId !== id || u.role === Role.ADMIN));
    if (currentProjectId === id) setCurrentProjectId('p_default');
  };

  const handleLogin = async (username: string, password?: string, code?: string) => {
    if (!needsTwoStep) {
      // Remove @ symbol if user typed it and trim whitespace
      const cleanUsername = username.replace('@', '').trim().toLowerCase();
      const cleanPassword = password?.trim();
      
      let user: User | null = null;
      
      // First try to find user in Supabase
      try {
        const allUsers = await userService.getAll();
        user = allUsers.find(u => 
          u.username.toLowerCase() === cleanUsername
        ) || null;
        
        // If found in Supabase, update local state
        if (user) {
          setUsers(prev => {
            const existing = prev.find(u => u.id === user!.id);
            if (!existing) {
              return [...prev, user!];
            }
            return prev.map(u => u.id === user!.id ? user! : u);
          });
        }
      } catch (error) {
        console.log('Supabase error, trying localStorage:', error);
        // Fallback to localStorage
        user = users.find(u => 
          u.username.toLowerCase() === cleanUsername
        ) || null;
      }
      
      // If not found in Supabase, try localStorage
      if (!user) {
        user = users.find(u => 
          u.username.toLowerCase() === cleanUsername
        ) || null;
      }

      if (user) {
        // Check password - if user has password, it must match; if no password, any password works
        if (user.password && user.password !== cleanPassword) {
          alert("Invalid credentials: Incorrect password.");
          return;
        }
        
        if (user.isTwoStepEnabled) {
          setNeedsTwoStep(true);
          setPendingUser(user);
          alert("2-Step Verification required. Enter '1234' to continue.");
          return;
        }
        completeLogin(user);
      } else {
        // Debug: Show available usernames in console
        console.log('Available users:', users.map(u => u.username));
        console.log('Trying to login with:', cleanUsername);
        alert("Invalid credentials: Personnel node not matched.");
      }
    } 
    else if (pendingUser) {
      if (code === "1234") {
        completeLogin(pendingUser);
      } else {
        alert("Incorrect verification code.");
      }
    }
  };

  const completeLogin = (user: User) => {
    setCurrentUser(user);
    if (user.projectId) setCurrentProjectId(user.projectId);
    localStorage.setItem('srj_current_user', JSON.stringify(user));
    setNeedsTwoStep(false);
    setPendingUser(null);
    setView('tasks');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('srj_current_user');
    setNeedsTwoStep(false);
    setPendingUser(null);
    setView('profile');
  };

  const handleUpdateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    localStorage.setItem('srj_current_user', JSON.stringify(updatedUser));
  };

  const handleRegister = (userData: Partial<User>) => {
    if (!currentProjectId) return;
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name || 'Unknown',
      email: userData.email || '',
      username: userData.username || 'user_' + Date.now(),
      role: Role.EMPLOYEE,
      parentId: 'u1',
      projectId: currentProjectId,
      isEmailVerified: false,
      isTwoStepEnabled: false,
      ...userData
    };
    setUsers(prev => [...prev, newUser]);
    alert("Onboarding request submitted. Use your credentials to log in.");
  };

  const handleSendEmail = (data: Omit<Email, 'id' | 'createdAt' | 'read' | 'starred' | 'projectId' | 'senderId' | 'senderEmail'>) => {
    if (!currentUser || !currentProjectId) return;
    const newEmail: Email = {
      id: Date.now().toString(),
      projectId: currentProjectId,
      senderId: currentUser.id,
      senderEmail: currentUser.email,
      read: false,
      starred: false,
      createdAt: new Date().toISOString(),
      ...data
    };
    setEmails(prev => [...prev, newEmail]);
    
    // Notify primary recipient
    const recipient = users.find(u => u.email === data.receiverEmail);
    if (recipient) {
      addNotification(recipient.id, "New Internal Mail", `Subject: ${data.subject}`, 'update', 'emails');
    }

    // Notify CC recipients
    if (data.cc) {
      data.cc.forEach(ccEmail => {
        const ccUser = users.find(u => u.email === ccEmail);
        if (ccUser) {
          addNotification(ccUser.id, "CC'd on Internal Mail", `Subject: ${data.subject}`, 'update', 'emails');
        }
      });
    }

    // BCC recipients (quiet notification or none to keep "blind" status is subjective, but usually silent)
    if (data.bcc) {
      data.bcc.forEach(bccEmail => {
        const bccUser = users.find(u => u.email === bccEmail);
        if (bccUser) {
           addNotification(bccUser.id, "BCC'd on Internal Mail", `Subject: ${data.subject}`, 'update', 'emails');
        }
      });
    }
  };

  const handleCreatePost = (data: { text: string; image?: string; video?: string; ratio: '3:4' | '16:9' | '1:1' }) => {
    if (!currentUser || !currentProjectId) return;
    
    const newPost: Post = {
      id: Date.now().toString(),
      projectId: currentProjectId,
      userId: currentUser.id,
      userName: currentUser.name,
      userUsername: currentUser.username,
      text: data.text,
      image: data.image,
      video: data.video,
      ratio: data.ratio,
      likes: [],
      mentions: [],
      hashtags: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    setPosts(prev => [newPost, ...prev]);
    setView('feed');
  };

  const handleLikePost = (postId: string) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const alreadyLiked = p.likes.includes(currentUser.id);
        const newLikes = alreadyLiked 
          ? p.likes.filter(id => id !== currentUser.id)
          : [...p.likes, currentUser.id];
        return { ...p, likes: newLikes };
      }
      return p;
    }));
  };

  const handleCommentPost = (postId: string, text: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      createdAt: new Date().toISOString()
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p));
  };

  const handleSharePost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const shareText = `Check out this update by ${post.userName} (@${post.userUsername}) on SRJ Enterprise: ${post.text}`;
    if (navigator.share) {
      navigator.share({
        title: 'SRJ Enterprise Post',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n\nShared from SRJ World of Steel Enterprise Portal`);
      alert("Post details copied to clipboard!");
    }
  };

  const addSubordinate = (userData: Partial<User>) => {
    if (!currentUser || !currentProjectId) return;
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name || 'New Personnel',
      email: userData.email || '',
      username: userData.username || 'user_' + Date.now(),
      role: userData.role || Role.EMPLOYEE,
      parentId: currentUser.id,
      projectId: currentProjectId,
      isEmailVerified: false,
      isTwoStepEnabled: false,
      ...userData
    };
    setUsers(prev => [...prev, newUser]);
  };

  const addTask = (data: any) => {
    if (!currentUser || !currentProjectId) return;
    const newTask: Task = {
      id: Date.now().toString(),
      projectId: currentProjectId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      category: data.category,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      completed: false,
      subTasks: [],
      assignedBy: currentUser.id,
      assignedTo: data.assignedTo || currentUser.id
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const addNote = (data: any) => {
    if (!currentProjectId) return;
    const newNote: Note = {
      id: Date.now().toString(),
      projectId: currentProjectId,
      title: data.title,
      content: data.content,
      color: data.color,
      createdAt: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
    setView('notes');
  };

  // Helper selectors
  const userMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    users.forEach(u => map[u.id] = u.name);
    return map;
  }, [users]);

  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return scopedNotifications.filter(n => n.userId === currentUser.id);
  }, [scopedNotifications, currentUser]);

  const unreadNotifCount = useMemo(() => userNotifications.filter(n => !n.read).length, [userNotifications]);

  const filteredTasks = useMemo(() => {
    if (!currentUser) return [];
    let result = scopedTasks.filter(t => t.assignedTo === currentUser.id || t.assignedBy === currentUser.id);
    
    if (searchQuery && (view === 'tasks' || view === 'upcoming')) {
      result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (view === 'tasks') result = result.filter(t => !t.completed);

    result = [...result].sort((a, b) => {
      switch (taskSort) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority':
          const pMap = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
          return pMap[b.priority] - pMap[a.priority];
        case 'due_date':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        default: return 0;
      }
    });

    return result;
  }, [scopedTasks, view, searchQuery, currentUser, taskSort]);

  const filteredComplaints = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === Role.ADMIN || currentUser.role === Role.MANAGEMENT || currentUser.role === Role.HOD) return scopedComplaints;
    return scopedComplaints.filter(c => c.userId === currentUser.id);
  }, [scopedComplaints, currentUser]);

  const renderContent = () => {
    if (!currentUser && view !== 'profile') {
      return (
        <div className="flex flex-col items-center justify-center pt-8 pb-20 animate-in fade-in">
           <AuthView 
            currentUser={currentUser} 
            onLogin={handleLogin} 
            onLogout={handleLogout} 
            onRegister={handleRegister}
            needsTwoStep={needsTwoStep}
          />
        </div>
      );
    }

    switch(view) {
      case 'projects':
        return <ProjectsView 
          projects={projects} 
          currentProjectId={currentProjectId} 
          onSelectProject={setCurrentProjectId}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
        />;
      case 'profile':
        return <AuthView 
          currentUser={currentUser} 
          onLogin={handleLogin} 
          onLogout={handleLogout} 
          onUpdateProfile={handleUpdateProfile}
          subordinates={scopedUsers.filter(u => u.parentId === currentUser?.id)}
          onAddSubordinate={addSubordinate}
          onRegister={handleRegister}
          needsTwoStep={needsTwoStep}
        />;
      case 'emails':
        return currentUser ? <EmailsView 
          currentUser={currentUser} 
          emails={scopedEmails} 
          domain={projectDomain}
          onSendEmail={handleSendEmail}
          onToggleStar={(id) => setEmails(prev => prev.map(e => e.id === id ? {...e, starred: !e.starred} : e))}
          onDeleteEmail={(id) => setEmails(prev => prev.filter(e => e.id !== id))}
          onMarkRead={(id) => setEmails(prev => prev.map(e => e.id === id ? {...e, read: true} : e))}
        /> : null;
      case 'complaints':
        return currentUser ? <ComplaintsView 
          currentUser={currentUser} 
          complaints={filteredComplaints} 
          onSubmitComplaint={(s, m, a) => {
            if(!currentProjectId) return;
            setComplaints(prev => [...prev, { id: Date.now().toString(), projectId: currentProjectId, userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, subject: s, message: m, status: 'pending', createdAt: new Date().toISOString(), attachment: a }]);
          }}
          onResolveComplaint={(id) => setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c))}
        /> : null;
      case 'chat':
        return currentUser ? <ChatView 
          currentUser={currentUser} 
          allUsers={scopedUsers} 
          messages={scopedMessages} 
          groups={scopedGroups}
          onSendMessage={(rid, gid, text, att, rto) => {
            if(!currentProjectId) return;
            setMessages(prev => [...prev, { id: Date.now().toString(), projectId: currentProjectId, senderId: currentUser.id, receiverId: rid, groupId: gid, text, attachment: att, status: 'sent', replyToId: rto, createdAt: new Date().toISOString() }]);
          }} 
          onDeleteMessage={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
          onCreateGroup={(n, d) => {
            if(!currentProjectId) return;
            setGroups(prev => [...prev, { id: 'g'+Date.now(), projectId: currentProjectId, name: n, description: d, createdBy: currentUser.id, members: [currentUser.id], createdAt: new Date().toISOString() }]);
          }}
          onJoinGroup={(gid) => setGroups(prev => prev.map(g => g.id === gid ? { ...g, members: [...g.members, currentUser.id] } : g))}
          onStartCall={() => {}}
          onEndCall={() => {}}
        /> : null;
      case 'feed':
        return currentUser ? <FeedView 
          posts={scopedPosts} 
          currentUser={currentUser} 
          allUsers={scopedUsers} 
          onLike={handleLikePost}
          onComment={handleCommentPost}
          onShare={handleSharePost}
        /> : null;
      case 'notifications':
        return currentUser ? (
          <NotificationsView 
            notifications={userNotifications}
            onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
            onClearAll={() => setNotifications(prev => prev.filter(n => n.userId !== currentUser.id))}
            onNavigate={(v) => setView(v)}
          />
        ) : null;
      case 'analytics':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-6">Production Output</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={[{name: 'Tasks', count: scopedTasks.length}, {name: 'Team', count: scopedUsers.length}]}>
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[10, 10, 10, 10]} fill="#f97316" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      case 'notes':
        return (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {scopedNotes.map(note => <NoteCard key={note.id} note={note} onDelete={(id) => setNotes(prev => prev.filter(n => n.id !== id))} />)}
          </div>
        );
      default:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${showFilters ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-slate-100 text-slate-500'}`}
                  >
                    <Filter size={16} />
                  </button>
                  {showFilters && (
                    <div className="absolute top-12 left-0 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {['newest', 'oldest', 'priority', 'due_date'].map(opt => (
                        <button key={opt} onClick={() => { setTaskSort(opt as SortType); setShowFilters(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-left hover:bg-slate-50 ${taskSort === opt ? 'text-orange-600 bg-orange-50' : 'text-slate-600'}`}>{opt.replace('_', ' ')}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {filteredTasks.map(task => <TaskCard key={task.id} task={task} onToggle={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))} onClick={() => {}} users={userMap} />)}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden shadow-2xl no-scrollbar">
      {/* Header */}
      <header className="p-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <button 
              onClick={() => currentUser?.role === Role.ADMIN && setShowProjectSelector(!showProjectSelector)}
              className="flex items-center gap-2 text-left group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <img 
                    src="/app_logo/SRJ-SOCIAL.jpg" 
                    alt="SRJ SOCIAL Logo" 
                    className="w-8 h-8 object-contain rounded-lg"
                  />
                  <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tighter italic">
                    SRJ <span className="bg-orange-600 text-[8px] text-white px-2 py-0.5 rounded-full uppercase not-italic tracking-normal">Enterprise</span>
                  </h1>
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                   {activeProject?.name || 'Loading Node...'} {currentUser?.role === Role.ADMIN && <ChevronDown size={10} className="text-orange-500" />}
                </p>
              </div>
            </button>
            
            {showProjectSelector && (
              <div className="absolute top-12 left-0 w-64 bg-white border border-slate-100 rounded-3xl shadow-2xl z-[60] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Switch Project Node</span>
                </div>
                <div className="max-h-60 overflow-y-auto no-scrollbar">
                  {projects.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => { setCurrentProjectId(p.id); setShowProjectSelector(false); }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0 ${currentProjectId === p.id ? 'bg-orange-50' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${currentProjectId === p.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">{p.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">{p.managerName}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => { setView('projects'); setShowProjectSelector(false); }}
                  className="w-full p-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Layers size={14} /> Project Matrix
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('emails')} className={`p-2.5 shadow-sm border rounded-2xl transition-all ${view === 'emails' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-slate-100 text-slate-600'}`}><Mail size={18} /></button>
            <button onClick={() => setView('complaints')} className={`p-2.5 shadow-sm border rounded-2xl transition-all ${view === 'complaints' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-slate-100 text-slate-600'}`}><HelpCircle size={18} /></button>
            <button onClick={() => setView('notifications')} className={`p-2.5 shadow-sm border rounded-2xl relative transition-all ${view === 'notifications' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-slate-100 text-slate-600'}`}><Bell size={18} />{unreadNotifCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[8px] flex items-center justify-center rounded-full font-bold border-2 border-white">{unreadNotifCount}</span>}</button>
          </div>
        </div>

        {currentUser && ['tasks', 'notes', 'upcoming'].includes(view) && (
          <div className="flex gap-4 border-b border-slate-200 mb-2">
            <button onClick={() => setView('tasks')} className={`pb-3 text-xs font-bold transition-all ${view === 'tasks' ? 'tab-active' : 'text-slate-400'}`}>Workspace</button>
            <button onClick={() => setView('notes')} className={`pb-3 text-xs font-bold transition-all ${view === 'notes' ? 'tab-active' : 'text-slate-400'}`}>Memo</button>
            <button onClick={() => setView('upcoming')} className={`pb-3 text-xs font-bold transition-all ${view === 'upcoming' ? 'tab-active' : 'text-slate-400'}`}>Timeline</button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pt-2 pb-24 no-scrollbar px-6">
        {renderContent()}
      </main>

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 left-0 right-0 glass border-t border-slate-100 px-4 py-4 flex items-center justify-between z-30">
        <button onClick={() => setView('tasks')} className={`p-2 transition-all flex flex-col items-center gap-1 ${view === 'tasks' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}><ListTodo size={20} /><span className="text-[8px] font-bold uppercase tracking-widest">Flow</span></button>
        <button onClick={() => setView('feed')} className={`p-2 transition-all flex flex-col items-center gap-1 ${view === 'feed' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}><Globe size={20} /><span className="text-[8px] font-bold uppercase tracking-widest">Social</span></button>
        {currentUser && <div className="relative"><button onClick={() => view === 'feed' ? setIsPostModalOpen(true) : setIsModalOpen(true)} className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 -mt-10 border-4 border-white"><Plus size={24} /></button></div>}
        <button onClick={() => setView('chat')} className={`p-2 transition-all flex flex-col items-center gap-1 ${view === 'chat' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}><MessageCircle size={20} /><span className="text-[8px] font-bold uppercase tracking-widest">Chat</span></button>
        <button onClick={() => setView('profile')} className={`p-2 transition-all flex flex-col items-center gap-1 ${view === 'profile' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}><UserIcon size={20} /><span className="text-[8px] font-bold uppercase tracking-widest">ID</span></button>
      </nav>

      {isModalOpen && <AddTaskModal onClose={() => setIsModalOpen(false)} onSaveTask={addTask} onSaveNote={addNote} subordinates={scopedUsers.filter(u => u.parentId === currentUser?.id)} />}
      {isPostModalOpen && <AddPostModal onClose={() => setIsPostModalOpen(false)} onSave={handleCreatePost} />}
    </div>
  );
};

export default App;
