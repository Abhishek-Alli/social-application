
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, ViewType, Note, Role, User, Complaint, ComplaintAttachment, Notification, Message, Group, MessageAttachment, Post, Comment, Project, Email, CallInfo } from './types';
import { 
  userService, 
  projectService, 
  taskService, 
  noteService, 
  postService, 
  complaintService, 
  notificationService, 
  messageService, 
  groupService, 
  emailService,
  supabase 
} from './services/supabaseService';
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

  // Helper function to map Supabase data to TypeScript types
  const mapUserFromSupabase = (u: any): User => ({
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
  });

  // Load initial data from Supabase
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load users
        const supabaseUsers = await userService.getAll();
        if (supabaseUsers && supabaseUsers.length > 0) {
          const mappedUsers = supabaseUsers.map(mapUserFromSupabase);
          setUsers(mappedUsers);
        }

        // Load projects
        const supabaseProjects = await projectService.getAll();
        if (supabaseProjects && supabaseProjects.length > 0) {
          setProjects(supabaseProjects);
          if (supabaseProjects[0]?.id) {
            setCurrentProjectId(supabaseProjects[0].id);
          }
        } else {
          // Create default project if none exists
          const defaultProject: Project = {
            id: 'p_default',
            name: 'Main Enterprise',
            managerName: 'Admin',
            domain: 'srj.com',
            createdAt: new Date().toISOString()
          };
          try {
            await projectService.create(defaultProject);
            setProjects([defaultProject]);
            setCurrentProjectId('p_default');
          } catch (error) {
            console.error('Failed to create default project:', error);
            setProjects([defaultProject]);
            setCurrentProjectId('p_default');
          }
        }
      } catch (error) {
        console.error('Failed to load initial data from Supabase:', error);
        alert('Failed to connect to database. Please check your internet connection.');
      }
    };

    loadInitialData();
  }, []);

  // Load current user from sessionStorage on mount (for session persistence only)
  useEffect(() => {
    const savedCurrentUser = sessionStorage.getItem('srj_current_user');
    if (savedCurrentUser) {
      try {
        const user = JSON.parse(savedCurrentUser);
        // Verify user still exists in database
        userService.getById(user.id).then(dbUser => {
          if (dbUser) {
            setCurrentUser(user);
            if (user.projectId) setCurrentProjectId(user.projectId);
          } else {
            sessionStorage.removeItem('srj_current_user');
          }
        }).catch(() => {
          sessionStorage.removeItem('srj_current_user');
        });
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        sessionStorage.removeItem('srj_current_user');
      }
    }
  }, []);

  // Load project-specific data and set up real-time subscriptions
  useEffect(() => {
    if (!currentProjectId) return;

    let subscriptions: any[] = [];

    const loadProjectData = async () => {
      try {
        // Load tasks
        const projectTasks = await taskService.getByProject(currentProjectId);
        setTasks(projectTasks.map((t: any) => ({
          ...t,
          projectId: t.project_id || t.projectId,
          assignedBy: t.assigned_by || t.assignedBy,
          assignedTo: t.assigned_to || t.assignedTo,
          dueDate: t.due_date || t.dueDate,
          subTasks: t.sub_tasks || t.subTasks,
          createdAt: t.created_at || t.createdAt
        })));

        // Load notes
        const projectNotes = await noteService.getByProject(currentProjectId);
        setNotes(projectNotes.map((n: any) => ({
          ...n,
          projectId: n.project_id || n.projectId,
          createdAt: n.created_at || n.createdAt
        })));

        // Load posts
        const projectPosts = await postService.getByProject(currentProjectId);
        setPosts(projectPosts.map((p: any) => ({
          ...p,
          projectId: p.project_id || p.projectId,
          userId: p.user_id || p.userId,
          userName: p.user_name || p.userName,
          userUsername: p.user_username || p.userUsername,
          createdAt: p.created_at || p.createdAt
        })));

        // Load complaints
        const projectComplaints = await complaintService.getByProject(currentProjectId);
        setComplaints(projectComplaints.map((c: any) => ({
          ...c,
          projectId: c.project_id || c.projectId,
          userId: c.user_id || c.userId,
          userName: c.user_name || c.userName,
          userRole: c.user_role || c.userRole,
          createdAt: c.created_at || c.createdAt
        })));

        // Load messages
        const projectMessages = await messageService.getByProject(currentProjectId);
        setMessages(projectMessages.map((m: any) => ({
          ...m,
          projectId: m.project_id || m.projectId,
          senderId: m.sender_id || m.senderId,
          receiverId: m.receiver_id || m.receiverId,
          groupId: m.group_id || m.groupId,
          replyToId: m.reply_to_id || m.replyToId,
          callInfo: m.call_info || m.callInfo,
          createdAt: m.created_at || m.createdAt
        })));

        // Load groups
        const projectGroups = await groupService.getByProject(currentProjectId);
        setGroups(projectGroups.map((g: any) => ({
          ...g,
          projectId: g.project_id || g.projectId,
          createdBy: g.created_by || g.createdBy,
          activeCall: g.active_call || g.activeCall,
          createdAt: g.created_at || g.createdAt
        })));

        // Load emails
        const projectEmails = await emailService.getByProject(currentProjectId);
        setEmails(projectEmails.map((e: any) => ({
          ...e,
          projectId: e.project_id || e.projectId,
          senderId: e.sender_id || e.senderId,
          senderEmail: e.sender_email || e.senderEmail,
          receiverEmail: e.receiver_email || e.receiverEmail,
          createdAt: e.created_at || e.createdAt
        })));

        // Load notifications for current user
        if (currentUser) {
          const userNotifications = await notificationService.getByUser(currentUser.id, currentProjectId);
          setNotifications(userNotifications.map((n: any) => ({
            ...n,
            projectId: n.project_id || n.projectId,
            userId: n.user_id || n.userId,
            linkTo: n.link_to || n.linkTo,
            createdAt: n.created_at || n.createdAt
          })));
        }
      } catch (error) {
        console.error('Failed to load project data:', error);
      }
    };

    loadProjectData();

    // Set up real-time subscriptions
    const setupRealtimeSubscriptions = () => {
      // Tasks subscription
      const tasksSub = supabase
        .channel('tasks_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newTask = payload.new as any;
              setTasks(prev => [...prev, {
                ...newTask,
                projectId: newTask.project_id || newTask.projectId,
                assignedBy: newTask.assigned_by || newTask.assignedBy,
                assignedTo: newTask.assigned_to || newTask.assignedTo,
                dueDate: newTask.due_date || newTask.dueDate,
                subTasks: newTask.sub_tasks || newTask.subTasks,
                createdAt: newTask.created_at || newTask.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedTask = payload.new as any;
              setTasks(prev => prev.map(t => t.id === updatedTask.id ? {
                ...updatedTask,
                projectId: updatedTask.project_id || updatedTask.projectId,
                assignedBy: updatedTask.assigned_by || updatedTask.assignedBy,
                assignedTo: updatedTask.assigned_to || updatedTask.assignedTo,
                dueDate: updatedTask.due_date || updatedTask.dueDate,
                subTasks: updatedTask.sub_tasks || updatedTask.subTasks,
                createdAt: updatedTask.created_at || updatedTask.createdAt
              } : t));
            } else if (payload.eventType === 'DELETE') {
              setTasks(prev => prev.filter(t => t.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Posts subscription
      const postsSub = supabase
        .channel('posts_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'posts', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newPost = payload.new as any;
              setPosts(prev => [...prev, {
                ...newPost,
                projectId: newPost.project_id || newPost.projectId,
                userId: newPost.user_id || newPost.userId,
                userName: newPost.user_name || newPost.userName,
                userUsername: newPost.user_username || newPost.userUsername,
                createdAt: newPost.created_at || newPost.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedPost = payload.new as any;
              setPosts(prev => prev.map(p => p.id === updatedPost.id ? {
                ...updatedPost,
                projectId: updatedPost.project_id || updatedPost.projectId,
                userId: updatedPost.user_id || updatedPost.userId,
                userName: updatedPost.user_name || updatedPost.userName,
                userUsername: updatedPost.user_username || updatedPost.userUsername,
                createdAt: updatedPost.created_at || updatedPost.createdAt
              } : p));
            } else if (payload.eventType === 'DELETE') {
              setPosts(prev => prev.filter(p => p.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Messages subscription
      const messagesSub = supabase
        .channel('messages_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as any;
              setMessages(prev => [...prev, {
                ...newMessage,
                projectId: newMessage.project_id || newMessage.projectId,
                senderId: newMessage.sender_id || newMessage.senderId,
                receiverId: newMessage.receiver_id || newMessage.receiverId,
                groupId: newMessage.group_id || newMessage.groupId,
                replyToId: newMessage.reply_to_id || newMessage.replyToId,
                callInfo: newMessage.call_info || newMessage.callInfo,
                createdAt: newMessage.created_at || newMessage.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedMessage = payload.new as any;
              setMessages(prev => prev.map(m => m.id === updatedMessage.id ? {
                ...updatedMessage,
                projectId: updatedMessage.project_id || updatedMessage.projectId,
                senderId: updatedMessage.sender_id || updatedMessage.senderId,
                receiverId: updatedMessage.receiver_id || updatedMessage.receiverId,
                groupId: updatedMessage.group_id || updatedMessage.groupId,
                replyToId: updatedMessage.reply_to_id || updatedMessage.replyToId,
                callInfo: updatedMessage.call_info || updatedMessage.callInfo,
                createdAt: updatedMessage.created_at || updatedMessage.createdAt
              } : m));
            } else if (payload.eventType === 'DELETE') {
              setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Notifications subscription (for current user)
      if (currentUser) {
        const notificationsSub = supabase
          .channel('notifications_changes')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
            async (payload) => {
              if (payload.eventType === 'INSERT') {
                const newNotif = payload.new as any;
                setNotifications(prev => [...prev, {
                  ...newNotif,
                  projectId: newNotif.project_id || newNotif.projectId,
                  userId: newNotif.user_id || newNotif.userId,
                  linkTo: newNotif.link_to || newNotif.linkTo,
                  createdAt: newNotif.created_at || newNotif.createdAt
                }]);
              } else if (payload.eventType === 'UPDATE') {
                const updatedNotif = payload.new as any;
                setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? {
                  ...updatedNotif,
                  projectId: updatedNotif.project_id || updatedNotif.projectId,
                  userId: updatedNotif.user_id || updatedNotif.userId,
                  linkTo: updatedNotif.link_to || updatedNotif.linkTo,
                  createdAt: updatedNotif.created_at || updatedNotif.createdAt
                } : n));
              } else if (payload.eventType === 'DELETE') {
                setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
              }
            }
          )
          .subscribe();
        subscriptions.push(notificationsSub);
      }

      // Notes subscription
      const notesSub = supabase
        .channel('notes_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'notes', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newNote = payload.new as any;
              setNotes(prev => [...prev, {
                ...newNote,
                projectId: newNote.project_id || newNote.projectId,
                createdAt: newNote.created_at || newNote.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedNote = payload.new as any;
              setNotes(prev => prev.map(n => n.id === updatedNote.id ? {
                ...updatedNote,
                projectId: updatedNote.project_id || updatedNote.projectId,
                createdAt: updatedNote.created_at || updatedNote.createdAt
              } : n));
            } else if (payload.eventType === 'DELETE') {
              setNotes(prev => prev.filter(n => n.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Complaints subscription
      const complaintsSub = supabase
        .channel('complaints_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'complaints', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newComplaint = payload.new as any;
              setComplaints(prev => [...prev, {
                ...newComplaint,
                projectId: newComplaint.project_id || newComplaint.projectId,
                userId: newComplaint.user_id || newComplaint.userId,
                userName: newComplaint.user_name || newComplaint.userName,
                userRole: newComplaint.user_role || newComplaint.userRole,
                createdAt: newComplaint.created_at || newComplaint.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedComplaint = payload.new as any;
              setComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? {
                ...updatedComplaint,
                projectId: updatedComplaint.project_id || updatedComplaint.projectId,
                userId: updatedComplaint.user_id || updatedComplaint.userId,
                userName: updatedComplaint.user_name || updatedComplaint.userName,
                userRole: updatedComplaint.user_role || updatedComplaint.userRole,
                createdAt: updatedComplaint.created_at || updatedComplaint.createdAt
              } : c));
            } else if (payload.eventType === 'DELETE') {
              setComplaints(prev => prev.filter(c => c.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Emails subscription
      const emailsSub = supabase
        .channel('emails_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'emails', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newEmail = payload.new as any;
              setEmails(prev => [...prev, {
                ...newEmail,
                projectId: newEmail.project_id || newEmail.projectId,
                senderId: newEmail.sender_id || newEmail.senderId,
                senderEmail: newEmail.sender_email || newEmail.senderEmail,
                receiverEmail: newEmail.receiver_email || newEmail.receiverEmail,
                createdAt: newEmail.created_at || newEmail.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedEmail = payload.new as any;
              setEmails(prev => prev.map(e => e.id === updatedEmail.id ? {
                ...updatedEmail,
                projectId: updatedEmail.project_id || updatedEmail.projectId,
                senderId: updatedEmail.sender_id || updatedEmail.senderId,
                senderEmail: updatedEmail.sender_email || updatedEmail.senderEmail,
                receiverEmail: updatedEmail.receiver_email || updatedEmail.receiverEmail,
                createdAt: updatedEmail.created_at || updatedEmail.createdAt
              } : e));
            } else if (payload.eventType === 'DELETE') {
              setEmails(prev => prev.filter(e => e.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Groups subscription
      const groupsSub = supabase
        .channel('groups_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'groups', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newGroup = payload.new as any;
              setGroups(prev => [...prev, {
                ...newGroup,
                projectId: newGroup.project_id || newGroup.projectId,
                createdBy: newGroup.created_by || newGroup.createdBy,
                activeCall: newGroup.active_call || newGroup.activeCall,
                createdAt: newGroup.created_at || newGroup.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedGroup = payload.new as any;
              setGroups(prev => prev.map(g => g.id === updatedGroup.id ? {
                ...updatedGroup,
                projectId: updatedGroup.project_id || updatedGroup.projectId,
                createdBy: updatedGroup.created_by || updatedGroup.createdBy,
                activeCall: updatedGroup.active_call || updatedGroup.activeCall,
                createdAt: updatedGroup.created_at || updatedGroup.createdAt
              } : g));
            } else if (payload.eventType === 'DELETE') {
              setGroups(prev => prev.filter(g => g.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      subscriptions.push(tasksSub, postsSub, messagesSub, notesSub, complaintsSub, emailsSub, groupsSub);
    };

    setupRealtimeSubscriptions();

    // Cleanup subscriptions on unmount or project change
    return () => {
      subscriptions.forEach(sub => {
        try {
          supabase.removeChannel(sub);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      });
    };
  }, [currentProjectId, currentUser]);

  // Keep sessionStorage sync only for current user (for session persistence only)
  useEffect(() => { 
    if (currentUser) {
      sessionStorage.setItem('srj_current_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('srj_current_user');
    }
  }, [currentUser]);

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

  const addNotification = async (userId: string, title: string, message: string, type: Notification['type'], linkTo?: ViewType) => {
    if (!currentProjectId) return;
    try {
      await notificationService.create({
        projectId: currentProjectId,
        userId,
        title,
        message,
        type,
        read: false,
        linkTo
      });
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Fallback: add to local state if database fails
    const newNotif: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
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
    }
  };

  const handleCreateProject = async (data: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const newProject = await projectService.create({
      ...data,
        domain: data.domain || 'srj.com'
      });
    setProjects(prev => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (id === 'p_default') return alert("Cannot delete main node.");
    try {
      await projectService.delete(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    setPosts(prev => prev.filter(p => p.projectId !== id));
    setUsers(prev => prev.filter(u => u.projectId !== id || u.role === Role.ADMIN));
    if (currentProjectId === id) setCurrentProjectId('p_default');
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
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
        console.error('Supabase error during login:', error);
        alert('Failed to connect to database. Please check your internet connection.');
        return;
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
    sessionStorage.setItem('srj_current_user', JSON.stringify(user));
    setNeedsTwoStep(false);
    setPendingUser(null);
    setView('tasks');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('srj_current_user');
    setNeedsTwoStep(false);
    setPendingUser(null);
    setView('profile');
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const updatedUser = await userService.update(currentUser.id, updates);
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleRegister = async (userData: Partial<User>) => {
    if (!currentProjectId) return;
    try {
      const newUser = await userService.create({
      name: userData.name || 'Unknown',
      email: userData.email || '',
      username: userData.username || 'user_' + Date.now(),
      role: Role.EMPLOYEE,
      parentId: 'u1',
      projectId: currentProjectId,
      isEmailVerified: false,
      isTwoStepEnabled: false,
      ...userData
      });
    setUsers(prev => [...prev, newUser]);
    alert("Onboarding request submitted. Use your credentials to log in.");
    } catch (error) {
      console.error('Failed to register user:', error);
      alert('Failed to register. Please try again.');
    }
  };

  const handleSendEmail = async (data: Omit<Email, 'id' | 'createdAt' | 'read' | 'starred' | 'projectId' | 'senderId' | 'senderEmail'>) => {
    if (!currentUser || !currentProjectId) return;
    try {
      const newEmail = await emailService.create({
      projectId: currentProjectId,
      senderId: currentUser.id,
      senderEmail: currentUser.email,
      read: false,
      starred: false,
      ...data
      });
    setEmails(prev => [...prev, newEmail]);
    
    // Notify primary recipient
    const recipient = users.find(u => u.email === data.receiverEmail);
    if (recipient) {
        await addNotification(recipient.id, "New Internal Mail", `Subject: ${data.subject}`, 'update', 'emails');
    }

    // Notify CC recipients
    if (data.cc) {
        for (const ccEmail of data.cc) {
        const ccUser = users.find(u => u.email === ccEmail);
        if (ccUser) {
            await addNotification(ccUser.id, "CC'd on Internal Mail", `Subject: ${data.subject}`, 'update', 'emails');
        }
        }
    }

      // BCC recipients
    if (data.bcc) {
        for (const bccEmail of data.bcc) {
        const bccUser = users.find(u => u.email === bccEmail);
        if (bccUser) {
            await addNotification(bccUser.id, "BCC'd on Internal Mail", `Subject: ${data.subject}`, 'update', 'emails');
          }
        }
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const handleCreatePost = async (data: { text: string; image?: string; video?: string; ratio: '3:4' | '16:9' | '1:1' }) => {
    if (!currentUser || !currentProjectId) return;
    try {
      await postService.create({
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
        comments: []
      });
      
      // Notify all users in the project about new post
      const projectUsers = users.filter(u => u.projectId === currentProjectId && u.id !== currentUser.id);
      for (const user of projectUsers) {
        await addNotification(
          user.id,
          'New Post',
          `${currentUser.name} shared a new post`,
          'post',
          'feed'
        );
      }
      
      // Real-time subscription will update the state automatically
    setView('feed');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const alreadyLiked = post.likes.includes(currentUser.id);
      const newLikes = alreadyLiked 
        ? post.likes.filter(id => id !== currentUser.id)
        : [...post.likes, currentUser.id];
      
      await postService.update(postId, { likes: newLikes });
      
      // Notify post owner when someone likes their post (only if it's a new like)
      if (!alreadyLiked && post.userId !== currentUser.id) {
        await addNotification(
          post.userId,
          'New Like',
          `${currentUser.name} liked your post`,
          'like',
          'feed'
        );
      }
      
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to like post:', error);
      // Fallback: update local state
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
    }
  };

  const handleCommentPost = async (postId: string, text: string) => {
    if (!currentUser) return;
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const newComment: Comment = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        text,
        createdAt: new Date().toISOString()
      };
      
      await postService.update(postId, { 
        comments: [...(post.comments || []), newComment] 
      });
      
      // Notify post owner when someone comments on their post
      if (post.userId !== currentUser.id) {
        await addNotification(
          post.userId,
          'New Comment',
          `${currentUser.name} commented on your post: ${text.length > 50 ? text.substring(0, 50) + '...' : text}`,
          'comment',
          'feed'
        );
      }
      
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to add comment:', error);
      // Fallback: update local state
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      createdAt: new Date().toISOString()
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p));
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      // Optimistically remove from UI immediately
      setPosts(prev => prev.filter(p => p.id !== postId));
      
      // Delete from database
      await postService.delete(postId);
      // Real-time subscription will also update, but we've already updated locally
    } catch (error) {
      console.error('Failed to delete post:', error);
      // Re-add the post if delete failed
      const post = posts.find(p => p.id === postId);
      if (post) {
        setPosts(prev => [...prev, post]);
      }
      alert('Failed to delete post. Please try again.');
    }
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

  const addSubordinate = async (userData: Partial<User>) => {
    if (!currentUser || !currentProjectId) return;
    try {
      const newUser = await userService.create({
      name: userData.name || 'New Personnel',
      email: userData.email || '',
      username: userData.username || 'user_' + Date.now(),
      role: userData.role || Role.EMPLOYEE,
      parentId: currentUser.id,
      projectId: currentProjectId,
      isEmailVerified: false,
      isTwoStepEnabled: false,
      ...userData
      });
    setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Failed to add subordinate:', error);
      alert('Failed to add subordinate. Please try again.');
    }
  };

  const addTask = async (data: any) => {
    if (!currentUser || !currentProjectId) return;
    try {
      await taskService.create({
      projectId: currentProjectId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      category: data.category,
      dueDate: data.dueDate,
      completed: false,
      subTasks: [],
      assignedBy: currentUser.id,
      assignedTo: data.assignedTo || currentUser.id
      });
      
      // Notify the assigned user about the new task
      const assignedUserId = data.assignedTo || currentUser.id;
      if (assignedUserId !== currentUser.id) {
        await addNotification(
          assignedUserId,
          'New Task Assigned',
          `You have been assigned a new task: ${data.title}`,
          'task',
          'tasks'
        );
      }
      
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const addNote = async (data: any) => {
    if (!currentProjectId || !currentUser) return;
    try {
      await noteService.create({
      projectId: currentProjectId,
      title: data.title,
      content: data.content,
        color: data.color
      });
      
      // Notify all users in the project about new note
      const projectUsers = users.filter(u => u.projectId === currentProjectId && u.id !== currentUser.id);
      for (const user of projectUsers) {
        await addNotification(
          user.id,
          'New Note Created',
          `${currentUser.name} created a new note: ${data.title}`,
          'note',
          'notes'
        );
      }
      
      // Real-time subscription will update the state automatically
    setView('notes');
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note. Please try again.');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!currentUser) return;
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const newCompletedStatus = !task.completed;
      await taskService.update(taskId, { completed: newCompletedStatus });
      
      // Notify task assigner when task is completed
      if (newCompletedStatus && task.assignedBy && task.assignedBy !== currentUser.id) {
        const assigner = users.find(u => u.id === task.assignedBy);
        if (assigner) {
          await addNotification(
            task.assignedBy,
            'Task Completed',
            `${currentUser.name} completed the task: ${task.title}`,
            'task',
            'tasks'
          );
        }
      }
      
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Fallback: update local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await noteService.delete(noteId);
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    try {
      await emailService.delete(emailId);
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to delete email:', error);
      alert('Failed to delete email. Please try again.');
    }
  };

  const handleToggleEmailStar = async (emailId: string) => {
    try {
      const email = emails.find(e => e.id === emailId);
      if (!email) return;
      await emailService.update(emailId, { starred: !email.starred });
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to toggle email star:', error);
      // Fallback: update local state
      setEmails(prev => prev.map(e => e.id === emailId ? {...e, starred: !e.starred} : e));
    }
  };

  const handleMarkEmailRead = async (emailId: string) => {
    try {
      await emailService.update(emailId, { read: true });
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to mark email as read:', error);
      // Fallback: update local state
      setEmails(prev => prev.map(e => e.id === emailId ? {...e, read: true} : e));
    }
  };

  const handleSubmitComplaint = async (subject: string, message: string, attachment?: ComplaintAttachment) => {
    if (!currentUser || !currentProjectId) return;
    try {
      await complaintService.create({
        projectId: currentProjectId,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        subject,
        message,
        status: 'pending',
        attachment
      });
      
      // Notify admins and management about new complaint
      const adminsAndManagement = users.filter(u => 
        u.projectId === currentProjectId && 
        (u.role === Role.ADMIN || u.role === Role.MANAGEMENT) &&
        u.id !== currentUser.id
      );
      for (const admin of adminsAndManagement) {
        await addNotification(
          admin.id,
          'New Complaint',
          `${currentUser.name} submitted a complaint: ${subject}`,
          'complaint',
          'complaints'
        );
      }
      
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to submit complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    try {
      await complaintService.update(complaintId, { status: 'resolved' });
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to resolve complaint:', error);
      alert('Failed to resolve complaint. Please try again.');
    }
  };

  const handleSendMessage = async (receiverId: string | undefined, groupId: string | undefined, text: string, attachment?: MessageAttachment, replyToId?: string) => {
    if (!currentUser || !currentProjectId) return;
    try {
      await messageService.create({
        projectId: currentProjectId,
        senderId: currentUser.id,
        receiverId,
        groupId,
        text,
        attachment,
        status: 'sent',
        replyToId
      });
      
      // Notify receiver for direct messages
      if (receiverId && receiverId !== currentUser.id) {
        const receiver = users.find(u => u.id === receiverId);
        if (receiver) {
          await addNotification(
            receiverId,
            'New Message',
            `${currentUser.name}: ${text.length > 50 ? text.substring(0, 50) + '...' : text}`,
            'message',
            'chat'
          );
        }
      }
      
      // Notify all group members for group messages
      if (groupId) {
        const group = groups.find(g => g.id === groupId);
        if (group) {
          const otherMembers = group.members.filter(memberId => memberId !== currentUser.id);
          for (const memberId of otherMembers) {
            await addNotification(
              memberId,
              `New Message in ${group.name}`,
              `${currentUser.name}: ${text.length > 50 ? text.substring(0, 50) + '...' : text}`,
              'message',
              'chat'
            );
          }
        }
      }
      
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      console.log('Deleting message:', messageId);
      
      // Optimistically remove from UI immediately
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== messageId);
        console.log('Messages after local delete:', filtered.length);
        return filtered;
      });
      
      // Delete from database
      await messageService.delete(messageId);
      console.log('Message deleted from database successfully');
      // Real-time subscription will also update, but we've already updated locally
    } catch (error) {
      console.error('Failed to delete message:', error);
      // Re-add the message if delete failed
      const message = messages.find(m => m.id === messageId);
      if (message) {
        setMessages(prev => [...prev, message]);
      }
      alert('Failed to delete message. Please check console for details.');
    }
  };

  const handleStartCall = async (type: 'audio' | 'video', targetId: string, isGroup: boolean) => {
    if (!currentUser || !currentProjectId) return;
    
    try {
      const callInfo: CallInfo = {
        id: 'call_' + Date.now(),
        type,
        status: 'active',
        startedBy: currentUser.id,
        groupId: isGroup ? targetId : undefined
      };

      // If it's a group call, update the group's active_call
      if (isGroup) {
        const group = groups.find(g => g.id === targetId);
        if (group) {
          await groupService.update(targetId, { activeCall: callInfo });
        }
      } else {
        // For direct calls, create a message with call info
        await messageService.create({
          projectId: currentProjectId,
          senderId: currentUser.id,
          receiverId: targetId,
          text: `${type === 'video' ? 'Video' : 'Audio'} call started`,
          callInfo,
          status: 'sent'
        });
      }

      // Notify the other user
      if (!isGroup) {
        const targetUser = users.find(u => u.id === targetId);
        if (targetUser) {
          await addNotification(
            targetUser.id,
            `Incoming ${type === 'video' ? 'Video' : 'Audio'} Call`,
            `${currentUser.name} is calling you`,
            'call',
            'chat'
          );
        }
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call. Please try again.');
    }
  };

  const handleEndCall = async (callId: string) => {
    try {
      // Find and end the call in groups
      const groupWithCall = groups.find(g => g.activeCall?.id === callId);
      if (groupWithCall) {
        await groupService.update(groupWithCall.id, { activeCall: null });
      }

      // Note: For direct calls, the call info is in messages
      // You might want to update the message status to 'ended' if needed
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const handleCreateGroup = async (name: string, description: string) => {
    if (!currentUser || !currentProjectId) return;
    try {
      await groupService.create({
        projectId: currentProjectId,
        name,
        description,
        createdBy: currentUser.id,
        members: [currentUser.id]
      });
      
      // Notify all users in the project about new group
      const projectUsers = users.filter(u => u.projectId === currentProjectId && u.id !== currentUser.id);
      for (const user of projectUsers) {
        await addNotification(
          user.id,
          'New Group Created',
          `${currentUser.name} created a new group: ${name}`,
          'group',
          'chat'
        );
      }
      
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!currentUser) return;
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;
      
      if (group.members.includes(currentUser.id)) {
        // Leave group
        await groupService.update(groupId, {
          members: group.members.filter(id => id !== currentUser.id)
        });
      } else {
        // Join group
        const updatedMembers = [...group.members, currentUser.id];
        await groupService.update(groupId, { members: updatedMembers });
        
        // Notify group creator and other members about new member
        const otherMembers = group.members.filter(id => id !== currentUser.id);
        for (const memberId of otherMembers) {
          await addNotification(
            memberId,
            'New Group Member',
            `${currentUser.name} joined the group ${group.name}`,
            'group',
            'chat'
          );
        }
      }
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to join/leave group:', error);
      alert('Failed to join/leave group. Please try again.');
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await notificationService.update(notificationId, { read: true });
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Fallback: update local state
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    }
  };

  const handleClearAllNotifications = async () => {
    if (!currentUser) return;
    try {
      // Delete all notifications for current user in current project
      const userNotifs = notifications.filter(n => n.userId === currentUser.id && n.projectId === currentProjectId);
      for (const notif of userNotifs) {
        await notificationService.delete(notif.id);
      }
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      alert('Failed to clear notifications. Please try again.');
    }
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
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
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
          userPosts={scopedPosts.filter(p => p.userId === currentUser?.id)}
          onDeletePost={handleDeletePost}
        />;
      case 'emails':
        return currentUser ? <EmailsView 
          currentUser={currentUser} 
          emails={scopedEmails} 
          domain={projectDomain}
          onSendEmail={handleSendEmail}
          onToggleStar={handleToggleEmailStar}
          onDeleteEmail={handleDeleteEmail}
          onMarkRead={handleMarkEmailRead}
        /> : null;
      case 'complaints':
        return currentUser ? <ComplaintsView 
          currentUser={currentUser} 
          complaints={filteredComplaints} 
          onSubmitComplaint={handleSubmitComplaint}
          onResolveComplaint={handleResolveComplaint}
        /> : null;
      case 'chat':
        return currentUser ? <ChatView 
          currentUser={currentUser} 
          allUsers={scopedUsers} 
          messages={scopedMessages} 
          groups={scopedGroups}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
        /> : null;
      case 'feed':
        return currentUser ? <FeedView 
          posts={scopedPosts} 
          currentUser={currentUser} 
          allUsers={scopedUsers} 
          onLike={handleLikePost}
          onComment={handleCommentPost}
          onShare={handleSharePost}
          onDelete={handleDeletePost}
        /> : null;
      case 'notifications':
        return currentUser ? (
          <NotificationsView 
            notifications={userNotifications}
            onMarkAsRead={handleMarkNotificationRead}
            onClearAll={handleClearAllNotifications}
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
            {scopedNotes.map(note => <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} />)}
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
            {filteredTasks.map(task => <TaskCard key={task.id} task={task} onToggle={handleToggleTask} onClick={() => {}} users={userMap} />)}
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
                <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tighter italic">
                  SRJ <span className="bg-orange-600 text-[8px] text-white px-2 py-0.5 rounded-full uppercase not-italic tracking-normal">Enterprise</span>
                </h1>
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
