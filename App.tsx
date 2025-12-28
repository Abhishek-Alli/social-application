
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Priority, ViewType, Note, Role, User, Complaint, ComplaintAttachment, Notification, Message, Group, MessageAttachment, Post, Comment, Project, Email, CallInfo, CalendarEvent, Feedback, Survey, Poll, FeedbackForm, FeedbackFormResponse, FeedbackFormField, Connection } from './types';
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
  calendarService,
  feedbackService,
  surveyService,
  pollService,
  feedbackFormService,
  connectionService,
  supabase 
} from './services/supabaseService';
import { TaskCard } from './components/TaskCard';
import { NoteCard } from './components/NoteCard';
import { AddTaskModal } from './components/AddTaskModal';
import { AddPostModal } from './components/AddPostModal';
import { AuthView } from './components/AuthView';
import { ScreenLock } from './components/ScreenLock';
import { TeamView } from './components/TeamView';
import { ComplaintsView } from './components/ComplaintsView';
import { NotificationsView } from './components/NotificationsView';
import { ChatView } from './components/ChatView';
import { FeedView } from './components/FeedView';
import { ProjectsView } from './components/ProjectsView';
import { EmailsView } from './components/EmailsView';
import { CalendarView } from './components/CalendarView';
import { FeedbackView } from './components/FeedbackView';
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
  Mail,
  MessageSquare,
  Menu
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

// Helper function to detect mobile devices
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

// Only save user ID to localStorage for "Remember Me" - full user data comes from Supabase
const saveUserSession = (userId: string, rememberMe: boolean) => {
  try {
    if (rememberMe) {
      localStorage.setItem('srj_user_id', userId);
    } else {
      sessionStorage.setItem('srj_user_id', userId);
      localStorage.removeItem('srj_user_id');
    }
  } catch (error) {
    console.warn('⚠️ Failed to save user session:', error);
  }
};

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
  
  // Audio ref for notification sound
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const playedNotificationsRef = useRef<Set<string>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // Set initial view to 'feed' (Social) on mobile, 'profile' on desktop
  const [view, setView] = useState<ViewType>(isMobileDevice() ? 'feed' : 'profile');
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskSort, setTaskSort] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  
  // Login flow state
  const [needsTwoStep, setNeedsTwoStep] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  
  // Screen lock state
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [isCheckingScreenLock, setIsCheckingScreenLock] = useState(true);

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
            screenLockPassword: u.screen_lock_password || u.screenLockPassword,
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
      } catch (error: any) {
        console.warn('Failed to load initial data from Supabase:', error?.message || error);
        // Don't show alert - allow app to continue with default project
      }
    };

    loadInitialData();
  }, []);

  // Load current user from Supabase on mount (for persistent login)
  useEffect(() => {
    const savedUserId = localStorage.getItem('srj_user_id') || sessionStorage.getItem('srj_user_id');
    if (savedUserId) {
      console.log('🔄 Found saved user ID, loading from Supabase...');
      // Always fetch fresh user data from Supabase
      userService.getById(savedUserId).then(dbUser => {
        if (dbUser) {
          setCurrentUser(dbUser);
          if (dbUser.projectId) setCurrentProjectId(dbUser.projectId);
          // Set view to 'feed' (Social) on mobile, keep current view on desktop
          if (isMobileDevice() && view === 'profile') {
            setView('feed');
          }
          console.log('✅ User loaded from Supabase');
          
          // Check if screen lock is enabled
          if (dbUser.screenLockPassword) {
            setIsScreenLocked(true);
          }
        } else {
          // User no longer exists, clear saved data
          console.warn('⚠️ User no longer exists in database, clearing saved session');
          setCurrentUser(null);
          localStorage.removeItem('srj_user_id');
          sessionStorage.removeItem('srj_user_id');
          localStorage.removeItem('srj_saved_credentials');
        }
        setIsCheckingScreenLock(false);
      }).catch((error) => {
        // If database check fails, clear session
        console.warn('⚠️ Could not load user from database:', error);
        setCurrentUser(null);
        localStorage.removeItem('srj_user_id');
        sessionStorage.removeItem('srj_user_id');
        setIsCheckingScreenLock(false);
      });
    } else {
      console.log('ℹ️ No saved user ID found, showing login screen');
      setIsCheckingScreenLock(false);
    }
  }, []);

  // Load project-specific data and set up real-time subscriptions
  useEffect(() => {
    if (!currentProjectId) return;

    let subscriptions: any[] = [];

    const loadProjectData = async () => {
      // Load each section independently so missing tables don't break the entire app
      const loadData = async (loadFn: () => Promise<any>, sectionName: string) => {
        try {
          return await loadFn();
        } catch (error: any) {
          console.warn(`Failed to load ${sectionName}:`, error?.message || error);
          return null;
        }
      };

      // Load tasks
      const projectTasks = await loadData(() => taskService.getByProject(currentProjectId), 'tasks');
      if (projectTasks) {
        setTasks(projectTasks.map((t: any) => ({
          ...t,
          projectId: t.project_id || t.projectId,
          assignedBy: t.assigned_by || t.assignedBy,
          assignedTo: t.assigned_to_array ? t.assigned_to_array : (t.assigned_to ? [t.assigned_to] : []),
          dueDate: t.due_date || t.dueDate,
          subTasks: t.sub_tasks || t.subTasks,
          createdAt: t.created_at || t.createdAt
        })));
      }

      // Load notes
      const projectNotes = await loadData(() => noteService.getByProject(currentProjectId), 'notes');
      if (projectNotes) {
        setNotes(projectNotes.map((n: any) => ({
          ...n,
          projectId: n.project_id || n.projectId,
          createdAt: n.created_at || n.createdAt
        })));
      }

      // Load posts
      const projectPosts = await loadData(() => postService.getByProject(currentProjectId), 'posts');
      if (projectPosts) {
        setPosts(projectPosts.map((p: any) => ({
          ...p,
          projectId: p.project_id || p.projectId,
          userId: p.user_id || p.userId,
          userName: p.user_name || p.userName,
          userUsername: p.user_username || p.userUsername,
          createdAt: p.created_at || p.createdAt
        })));
      }

      // Load complaints
      const projectComplaints = await loadData(() => complaintService.getByProject(currentProjectId), 'complaints');
      if (projectComplaints) {
        setComplaints(projectComplaints.map((c: any) => ({
          ...c,
          projectId: c.project_id || c.projectId,
          userId: c.user_id || c.userId,
          userName: c.user_name || c.userName,
          userRole: c.user_role || c.userRole,
          targetUserId: c.target_user_id || c.targetUserId,
          createdAt: c.created_at || c.createdAt
        })));
      }

      // Load feedbacks (include private for admins)
      const isAdmin = currentUser?.role === Role.ADMIN;
      const projectFeedbacks = await loadData(() => feedbackService.getByProject(currentProjectId, isAdmin), 'feedbacks');
      if (projectFeedbacks) {
        setFeedbacks(projectFeedbacks.map((f: any) => ({
          ...f,
          projectId: f.project_id || f.projectId,
          surveyId: f.survey_id || f.surveyId,
          userId: f.user_id || f.userId,
          userName: f.user_name || f.userName,
          userEmail: f.user_email || f.userEmail,
          isPrivate: f.is_private || f.isPrivate || false,
          createdAt: f.created_at || f.createdAt
        })));
      }

      // Load surveys (include closed for management)
      const isManagementUser = isAdmin || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD;
      const projectSurveys = await loadData(() => surveyService.getByProject(currentProjectId, isManagementUser), 'surveys');
      if (projectSurveys) {
        setSurveys(projectSurveys.map((s: any) => ({
          ...s,
          projectId: s.project_id || s.projectId,
          createdBy: s.created_by || s.createdBy,
          createdByName: s.created_by_name || s.createdByName,
          programName: s.program_name || s.programName,
          eventName: s.event_name || s.eventName,
          type: s.type || 'general',
          status: s.status || 'active',
          deadline: s.deadline,
          createdAt: s.created_at || s.createdAt
        })));
      }

      // Load polls (include closed for management)
      const projectPolls = await loadData(() => pollService.getByProject(currentProjectId, isManagementUser), 'polls');
      if (projectPolls) {
        setPolls(projectPolls.map((p: any) => ({
          ...p,
          projectId: p.project_id || p.projectId,
          createdBy: p.created_by || p.createdBy,
          createdByName: p.created_by_name || p.createdByName,
          options: p.options || [],
          allowMultipleVotes: p.allow_multiple_votes || p.allowMultipleVotes || false,
          showResultsBeforeVoting: p.show_results_before_voting || p.showResultsBeforeVoting || false,
          deadline: p.deadline,
          createdAt: p.created_at || p.createdAt
        })));
      }

      // Load feedback forms (include closed for management)
      const projectForms = await loadData(() => feedbackFormService.getByProject(currentProjectId, isManagementUser), 'feedback forms');
      if (projectForms) {
        setForms(projectForms.map((f: any) => ({
          ...f,
          projectId: f.project_id || f.projectId,
          createdBy: f.created_by || f.createdBy,
          createdByName: f.created_by_name || f.createdByName,
          fields: f.fields || [],
          allowMultipleSubmissions: f.allow_multiple_submissions || f.allowMultipleSubmissions || false,
          deadline: f.deadline,
          createdAt: f.created_at || f.createdAt
        })));
      }

      // Load messages
      const projectMessages = await loadData(() => messageService.getByProject(currentProjectId), 'messages');
      if (projectMessages) {
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
      }

      // Load groups
      const projectGroups = await loadData(() => groupService.getByProject(currentProjectId), 'groups');
      if (projectGroups) {
        setGroups(projectGroups.map((g: any) => ({
          ...g,
          projectId: g.project_id || g.projectId,
          createdBy: g.created_by || g.createdBy,
          activeCall: g.active_call || g.activeCall,
          createdAt: g.created_at || g.createdAt
        })));
      }

      // Load emails
      const projectEmails = await loadData(() => emailService.getByProject(currentProjectId), 'emails');
      if (projectEmails) {
        setEmails(projectEmails.map((e: any) => ({
          ...e,
          projectId: e.project_id || e.projectId,
          senderId: e.sender_id || e.senderId,
          senderEmail: e.sender_email || e.senderEmail,
          receiverEmail: e.receiver_email || e.receiverEmail,
          createdAt: e.created_at || e.createdAt
        })));
      }

      // Load calendar events
      const projectCalendarEvents = await loadData(() => calendarService.getByProject(currentProjectId), 'calendar events');
      if (projectCalendarEvents) {
        console.log('Loaded calendar events:', projectCalendarEvents);
        setCalendarEvents(projectCalendarEvents);
      }

      // Load notifications for current user
      if (currentUser) {
        const userNotifications = await loadData(() => notificationService.getByUser(currentUser.id, currentProjectId), 'notifications');
        if (userNotifications) {
          const mappedNotifications = userNotifications.map((n: any) => ({
            ...n,
            projectId: n.project_id || n.projectId,
            userId: n.user_id || n.userId,
            linkTo: n.link_to || n.linkTo,
            createdAt: n.created_at || n.createdAt
          }));
          setNotifications(mappedNotifications);
          // Mark all existing notifications as already played (don't play sound on initial load)
          mappedNotifications.forEach((n: Notification) => {
            playedNotificationsRef.current.add(n.id);
          });
        }

        // Load connections for current user
        const userConnections = await loadData(() => connectionService.getByUser(currentUser.id), 'connections');
        if (userConnections) {
          setConnections(userConnections.map((c: any) => ({
            ...c,
            userId: c.user_id || c.userId,
            connectedUserId: c.connected_user_id || c.connectedUserId,
            createdAt: c.created_at || c.createdAt
          })));
        }
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
                assignedTo: newTask.assigned_to_array ? newTask.assigned_to_array : (newTask.assigned_to ? [newTask.assigned_to] : []),
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
                assignedTo: updatedTask.assigned_to_array ? updatedTask.assigned_to_array : (updatedTask.assigned_to ? [updatedTask.assigned_to] : []),
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
                id: newPost.id,
                projectId: newPost.project_id || newPost.projectId,
                userId: newPost.user_id || newPost.userId,
                userName: newPost.user_name || newPost.userName,
                userUsername: newPost.user_username || newPost.userUsername,
                text: newPost.text || '',
                image: newPost.image || undefined,
                video: newPost.video || undefined,
                ratio: newPost.ratio || '1:1',
                likes: newPost.likes || [],
                comments: newPost.comments || [],
                mentions: newPost.mentions || [],
                hashtags: newPost.hashtags || [],
                createdAt: newPost.created_at || newPost.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedPost = payload.new as any;
              setPosts(prev => prev.map(p => {
                if (p.id === updatedPost.id) {
                  // Preserve existing post data and merge with updated fields
                  return {
                    ...p, // Preserve existing post data
                    id: updatedPost.id,
                    projectId: updatedPost.project_id || updatedPost.projectId || p.projectId,
                    userId: updatedPost.user_id || updatedPost.userId || p.userId,
                    userName: updatedPost.user_name || updatedPost.userName || p.userName,
                    userUsername: updatedPost.user_username || updatedPost.userUsername || p.userUsername,
                    text: updatedPost.text !== undefined ? updatedPost.text : p.text,
                    image: updatedPost.image !== undefined ? updatedPost.image : p.image,
                    video: updatedPost.video !== undefined ? updatedPost.video : p.video,
                    ratio: updatedPost.ratio || p.ratio,
                    likes: updatedPost.likes || p.likes || [],
                    comments: updatedPost.comments || p.comments || [],
                    mentions: updatedPost.mentions || p.mentions || [],
                    hashtags: updatedPost.hashtags || p.hashtags || [],
                    createdAt: updatedPost.created_at || updatedPost.createdAt || p.createdAt
                  };
                }
                return p;
              }));
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
              setMessages(prev => prev.map(m => {
                if (m.id === updatedMessage.id) {
                  // Preserve existing message data and merge with updated fields
                  return {
                    ...m,
                    id: updatedMessage.id,
                    projectId: updatedMessage.project_id || updatedMessage.projectId || m.projectId,
                    senderId: updatedMessage.sender_id || updatedMessage.senderId || m.senderId,
                    receiverId: updatedMessage.receiver_id !== undefined ? updatedMessage.receiver_id : m.receiverId,
                    groupId: updatedMessage.group_id !== undefined ? updatedMessage.group_id : m.groupId,
                    text: updatedMessage.text !== undefined ? updatedMessage.text : m.text,
                    attachment: updatedMessage.attachment !== undefined ? updatedMessage.attachment : m.attachment,
                    callInfo: updatedMessage.call_info !== undefined ? updatedMessage.call_info : m.callInfo,
                    status: updatedMessage.status || m.status || 'sent',
                    replyToId: updatedMessage.reply_to_id !== undefined ? updatedMessage.reply_to_id : m.replyToId,
                    mentions: updatedMessage.mentions || m.mentions || [],
                    createdAt: updatedMessage.created_at || updatedMessage.createdAt || m.createdAt
                  };
                }
                return m;
              }));
            } else if (payload.eventType === 'DELETE') {
              const deletedMessageId = payload.old?.id || (payload.old as any)?.id;
              if (deletedMessageId) {
                console.log('Received DELETE event for message:', deletedMessageId);
                setMessages(prev => prev.filter(m => m.id !== deletedMessageId));
              } else {
                console.warn('DELETE event received but no message ID found in payload.old:', payload.old);
              }
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
                const notification: Notification = {
                  ...newNotif,
                  projectId: newNotif.project_id || newNotif.projectId,
                  userId: newNotif.user_id || newNotif.userId,
                  linkTo: newNotif.link_to || newNotif.linkTo,
                  createdAt: newNotif.created_at || newNotif.createdAt
                };
                setNotifications(prev => [...prev, notification]);
                
                // Play notification sound for new unread notifications
                if (!notification.read && !playedNotificationsRef.current.has(notification.id)) {
                  playedNotificationsRef.current.add(notification.id);
                  if (notificationSoundRef.current) {
                    notificationSoundRef.current.currentTime = 0;
                    notificationSoundRef.current.play().catch(err => {
                      console.log('Failed to play notification sound:', err);
                    });
                  }
                }
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
                targetUserId: newComplaint.target_user_id || newComplaint.targetUserId,
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
                targetUserId: updatedComplaint.target_user_id || updatedComplaint.targetUserId,
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
              setGroups(prev => prev.map(g => {
                if (g.id === updatedGroup.id) {
                  // Preserve existing group data and merge with updated fields
                  return {
                    ...g, // Preserve existing group data
                    id: updatedGroup.id,
                    projectId: updatedGroup.project_id || updatedGroup.projectId || g.projectId,
                    name: updatedGroup.name !== undefined ? updatedGroup.name : g.name,
                    description: updatedGroup.description !== undefined ? updatedGroup.description : g.description,
                    createdBy: updatedGroup.created_by || updatedGroup.createdBy || g.createdBy,
                    members: updatedGroup.members || g.members || [],
                    activeCall: updatedGroup.active_call !== undefined ? updatedGroup.active_call : g.activeCall,
                    createdAt: updatedGroup.created_at || updatedGroup.createdAt || g.createdAt
                  };
                }
                return g;
              }));
            } else if (payload.eventType === 'DELETE') {
              setGroups(prev => prev.filter(g => g.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Calendar events subscription
      const calendarSub = supabase
        .channel('calendar_events_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'calendar_events', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newEvent = payload.new as any;
              setCalendarEvents(prev => [...prev, {
                id: newEvent.id,
                projectId: newEvent.project_id || newEvent.projectId,
                userId: newEvent.user_id || newEvent.userId,
                title: newEvent.title,
                description: newEvent.description,
                startDate: newEvent.start_date || newEvent.startDate,
                endDate: newEvent.end_date || newEvent.endDate,
                location: newEvent.location,
                attendees: newEvent.attendees || [],
                color: newEvent.color || '#f97316',
                allDay: newEvent.all_day || newEvent.allDay || false,
                createdAt: newEvent.created_at || newEvent.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedEvent = payload.new as any;
              setCalendarEvents(prev => prev.map(e => e.id === updatedEvent.id ? {
                id: updatedEvent.id,
                projectId: updatedEvent.project_id || updatedEvent.projectId,
                userId: updatedEvent.user_id || updatedEvent.userId,
                title: updatedEvent.title,
                description: updatedEvent.description,
                startDate: updatedEvent.start_date || updatedEvent.startDate,
                endDate: updatedEvent.end_date || updatedEvent.endDate,
                location: updatedEvent.location,
                attendees: updatedEvent.attendees || [],
                color: updatedEvent.color || '#f97316',
                allDay: updatedEvent.all_day || updatedEvent.allDay || false,
                createdAt: updatedEvent.created_at || updatedEvent.createdAt
              } : e));
            } else if (payload.eventType === 'DELETE') {
              setCalendarEvents(prev => prev.filter(e => e.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Feedback subscription
      const feedbackSub = supabase
        .channel('feedback_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'feedback', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newFeedback = payload.new as any;
              setFeedbacks(prev => [...prev, {
                ...newFeedback,
                projectId: newFeedback.project_id || newFeedback.projectId,
                surveyId: newFeedback.survey_id || newFeedback.surveyId,
                userId: newFeedback.user_id || newFeedback.userId,
                userName: newFeedback.user_name || newFeedback.userName,
                userEmail: newFeedback.user_email || newFeedback.userEmail,
                isPrivate: newFeedback.is_private || newFeedback.isPrivate || false,
                createdAt: newFeedback.created_at || newFeedback.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedFeedback = payload.new as any;
              setFeedbacks(prev => prev.map(f => f.id === updatedFeedback.id ? {
                ...updatedFeedback,
                projectId: updatedFeedback.project_id || updatedFeedback.projectId,
                surveyId: updatedFeedback.survey_id || updatedFeedback.surveyId,
                userId: updatedFeedback.user_id || updatedFeedback.userId,
                userName: updatedFeedback.user_name || updatedFeedback.userName,
                userEmail: updatedFeedback.user_email || updatedFeedback.userEmail,
                isPrivate: updatedFeedback.is_private || updatedFeedback.isPrivate || false,
                createdAt: updatedFeedback.created_at || updatedFeedback.createdAt
              } : f));
            } else if (payload.eventType === 'DELETE') {
              setFeedbacks(prev => prev.filter(f => f.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Survey subscription
      const surveySub = supabase
        .channel('surveys_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'surveys', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newSurvey = payload.new as any;
              setSurveys(prev => [...prev, {
                ...newSurvey,
                projectId: newSurvey.project_id || newSurvey.projectId,
                createdBy: newSurvey.created_by || newSurvey.createdBy,
                createdByName: newSurvey.created_by_name || newSurvey.createdByName,
                programName: newSurvey.program_name || newSurvey.programName,
                eventName: newSurvey.event_name || newSurvey.eventName,
                type: newSurvey.type || 'general',
                status: newSurvey.status || 'active',
                deadline: newSurvey.deadline,
                createdAt: newSurvey.created_at || newSurvey.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedSurvey = payload.new as any;
              setSurveys(prev => prev.map(s => s.id === updatedSurvey.id ? {
                ...updatedSurvey,
                projectId: updatedSurvey.project_id || updatedSurvey.projectId,
                createdBy: updatedSurvey.created_by || updatedSurvey.createdBy,
                createdByName: updatedSurvey.created_by_name || updatedSurvey.createdByName,
                programName: updatedSurvey.program_name || updatedSurvey.programName,
                eventName: updatedSurvey.event_name || updatedSurvey.eventName,
                type: updatedSurvey.type || 'general',
                status: updatedSurvey.status || 'active',
                deadline: updatedSurvey.deadline,
                createdAt: updatedSurvey.created_at || updatedSurvey.createdAt
              } : s));
            } else if (payload.eventType === 'DELETE') {
              setSurveys(prev => prev.filter(s => s.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Poll subscription
      const pollSub = supabase
        .channel('polls_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'polls', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newPoll = payload.new as any;
              setPolls(prev => [...prev, {
                ...newPoll,
                projectId: newPoll.project_id || newPoll.projectId,
                createdBy: newPoll.created_by || newPoll.createdBy,
                createdByName: newPoll.created_by_name || newPoll.createdByName,
                options: newPoll.options || [],
                allowMultipleVotes: newPoll.allow_multiple_votes || newPoll.allowMultipleVotes || false,
                showResultsBeforeVoting: newPoll.show_results_before_voting || newPoll.showResultsBeforeVoting || false,
                deadline: newPoll.deadline,
                createdAt: newPoll.created_at || newPoll.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedPoll = payload.new as any;
              setPolls(prev => prev.map(p => p.id === updatedPoll.id ? {
                ...updatedPoll,
                projectId: updatedPoll.project_id || updatedPoll.projectId,
                createdBy: updatedPoll.created_by || updatedPoll.createdBy,
                createdByName: updatedPoll.created_by_name || updatedPoll.createdByName,
                options: updatedPoll.options || [],
                allowMultipleVotes: updatedPoll.allow_multiple_votes || updatedPoll.allowMultipleVotes || false,
                showResultsBeforeVoting: updatedPoll.show_results_before_voting || updatedPoll.showResultsBeforeVoting || false,
                deadline: updatedPoll.deadline,
                createdAt: updatedPoll.created_at || updatedPoll.createdAt
              } : p));
            } else if (payload.eventType === 'DELETE') {
              setPolls(prev => prev.filter(p => p.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Feedback Forms subscription
      const formsSub = supabase
        .channel('feedback_forms_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'feedback_forms', filter: `project_id=eq.${currentProjectId}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newForm = payload.new as any;
              setForms(prev => [...prev, {
                ...newForm,
                projectId: newForm.project_id || newForm.projectId,
                createdBy: newForm.created_by || newForm.createdBy,
                createdByName: newForm.created_by_name || newForm.createdByName,
                fields: newForm.fields || [],
                allowMultipleSubmissions: newForm.allow_multiple_submissions || newForm.allowMultipleSubmissions || false,
                deadline: newForm.deadline,
                createdAt: newForm.created_at || newForm.createdAt
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedForm = payload.new as any;
              setForms(prev => prev.map(f => f.id === updatedForm.id ? {
                ...updatedForm,
                projectId: updatedForm.project_id || updatedForm.projectId,
                createdBy: updatedForm.created_by || updatedForm.createdBy,
                createdByName: updatedForm.created_by_name || updatedForm.createdByName,
                fields: updatedForm.fields || [],
                allowMultipleSubmissions: updatedForm.allow_multiple_submissions || updatedForm.allowMultipleSubmissions || false,
                deadline: updatedForm.deadline,
                createdAt: updatedForm.created_at || updatedForm.createdAt
              } : f));
            } else if (payload.eventType === 'DELETE') {
              setForms(prev => prev.filter(f => f.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Connections subscription
      const connectionsSub = currentUser ? supabase
        .channel('connections_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'connections' },
          async (payload) => {
            const connection = payload.new as any || payload.old as any;
            if (connection && (connection.user_id === currentUser.id || connection.connected_user_id === currentUser.id)) {
              if (payload.eventType === 'INSERT') {
                const newConnection = payload.new as any;
                setConnections(prev => [...prev, {
                  id: newConnection.id,
                  userId: newConnection.user_id || newConnection.userId,
                  connectedUserId: newConnection.connected_user_id || newConnection.connectedUserId,
                  status: newConnection.status || 'pending',
                  createdAt: newConnection.created_at || newConnection.createdAt
                }]);
              } else if (payload.eventType === 'UPDATE') {
                const updatedConnection = payload.new as any;
                setConnections(prev => prev.map(c => c.id === updatedConnection.id ? {
                  ...c,
                  status: updatedConnection.status || c.status
                } : c));
              } else if (payload.eventType === 'DELETE') {
                setConnections(prev => prev.filter(c => c.id !== (payload.old as any).id));
              }
            }
          }
        )
        .subscribe() : null;

      subscriptions.push(tasksSub, postsSub, messagesSub, notesSub, complaintsSub, emailsSub, groupsSub, calendarSub, feedbackSub, surveySub, pollSub, formsSub);
      if (connectionsSub) subscriptions.push(connectionsSub);
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

  // Check for calendar events happening today and send notifications
  useEffect(() => {
    if (!currentUser || !currentProjectId || calendarEvents.length === 0) return;

    const checkTodayEvents = () => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Track notifications sent today using a Set (in-memory only, no localStorage)
      const sentNotifications = new Set<string>();
      
      calendarEvents.forEach(event => {
        const eventStart = new Date(event.startDate);
        const eventStartStr = `${eventStart.getFullYear()}-${String(eventStart.getMonth() + 1).padStart(2, '0')}-${String(eventStart.getDate()).padStart(2, '0')}`;
        
        // Check if event is today
        if (eventStartStr === todayStr) {
          const notificationKey = `cal_notif_${event.id}_${currentUser.id}`;
          
          // Check if notification already sent (in-memory only)
          if (!sentNotifications.has(notificationKey)) {
            // Notify event creator
            if (event.userId === currentUser.id) {
              addNotification(
                currentUser.id,
                'Event Today',
                `Your event "${event.title}" is today!`,
                'calendar',
                'calendar'
              ).catch(console.error);
              sentNotifications.add(notificationKey);
            }
            
            // Notify attendees
            if (event.attendees && event.attendees.length > 0) {
              event.attendees.forEach(attendeeId => {
                if (attendeeId === currentUser.id) {
                  const attendeeKey = `cal_notif_${event.id}_${attendeeId}`;
                  if (!sentNotifications.has(attendeeKey)) {
                    addNotification(
                      attendeeId,
                      'Event Today',
                      `Event "${event.title}" is today!`,
                      'calendar',
                      'calendar'
                    ).catch(console.error);
                    sentNotifications.add(attendeeKey);
                  }
                }
              });
            }
          }
        }
      });
    };

    // Check immediately
    checkTodayEvents();

    // Check every hour for events happening today
    const interval = setInterval(checkTodayEvents, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [calendarEvents, currentUser, currentProjectId]);

  // User data is stored in Supabase, we only keep user ID in storage
  // No need to sync full user object - it will be loaded from Supabase when needed

  // Scoped Data Hooks
  const scopedUsers = useMemo(() => users.filter(u => u.projectId === currentProjectId || u.role === Role.ADMIN), [users, currentProjectId]);
  const scopedTasks = useMemo(() => tasks.filter(t => t.projectId === currentProjectId), [tasks, currentProjectId]);
  const scopedNotes = useMemo(() => notes.filter(n => n.projectId === currentProjectId), [notes, currentProjectId]);
  const scopedPosts = useMemo(() => posts.filter(p => p.projectId === currentProjectId), [posts, currentProjectId]);
  const scopedComplaints = useMemo(() => complaints.filter(c => c.projectId === currentProjectId), [complaints, currentProjectId]);
  const scopedFeedbacks = useMemo(() => {
    const isAdmin = currentUser?.role === Role.ADMIN;
    return feedbacks.filter(f => {
      if (f.projectId !== currentProjectId) return false;
      // Non-admins can only see public feedbacks
      if (!isAdmin && f.isPrivate) return false;
      return true;
    });
  }, [feedbacks, currentProjectId, currentUser]);

  const scopedSurveys = useMemo(() => {
    return surveys.filter(s => s.projectId === currentProjectId);
  }, [surveys, currentProjectId]);

  const scopedPolls = useMemo(() => {
    return polls.filter(p => p.projectId === currentProjectId);
  }, [polls, currentProjectId]);

  const scopedForms = useMemo(() => {
    return forms.filter(f => f.projectId === currentProjectId);
  }, [forms, currentProjectId]);
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

  const handleLogin = async (username: string, password?: string, code?: string, rememberMe?: boolean) => {
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
          // Save credentials for 2-step if remember me is checked
          if (rememberMe) {
            localStorage.setItem('srj_saved_credentials', JSON.stringify({
              username: cleanUsername,
              password: cleanPassword
            }));
          }
          alert("2-Step Verification required. Enter '1234' to continue.");
          return;
        }
        completeLogin(user, rememberMe);
        
        // Save credentials if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem('srj_saved_credentials', JSON.stringify({
            username: cleanUsername,
            password: cleanPassword
          }));
        } else {
          localStorage.removeItem('srj_saved_credentials');
        }
      } else {
        // Debug: Show available usernames in console
        console.log('Available users:', users.map(u => u.username));
        console.log('Trying to login with:', cleanUsername);
        alert("Invalid credentials: Personnel node not matched.");
      }
    } 
    else if (pendingUser) {
      if (code === "1234") {
        // Get rememberMe from saved credentials
        const savedCreds = localStorage.getItem('srj_saved_credentials');
        const shouldRemember = !!savedCreds;
        completeLogin(pendingUser, shouldRemember);
      } else {
        alert("Incorrect verification code.");
      }
    }
  };

  const completeLogin = (user: User, rememberMe?: boolean) => {
    setCurrentUser(user);
    if (user.projectId) setCurrentProjectId(user.projectId);
    
    // Only save user ID for "Remember Me" - full user data is in Supabase
    saveUserSession(user.id, rememberMe);
    if (rememberMe) {
      console.log('✅ User ID saved to localStorage (Remember Me enabled)');
    } else {
      console.log('✅ User ID saved to sessionStorage only (Remember Me disabled)');
      localStorage.removeItem('srj_user_id');
      localStorage.removeItem('srj_saved_credentials');
    }
    
    setNeedsTwoStep(false);
    setPendingUser(null);
    // Set view to 'feed' (Social) on mobile, 'tasks' on desktop
    setView(isMobileDevice() ? 'feed' : 'tasks');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('srj_user_id');
    // Clear localStorage on logout
    localStorage.removeItem('srj_user_id');
    localStorage.removeItem('srj_saved_credentials');
    setNeedsTwoStep(false);
    setPendingUser(null);
    setIsScreenLocked(false);
    setView('profile');
  };

  const handleUnlockScreen = async (password: string) => {
    if (!currentUser) throw new Error('No user found');
    
    // Simple password comparison (in production, use proper hashing)
    if (currentUser.screenLockPassword === password) {
      setIsScreenLocked(false);
      return;
    }
    
    throw new Error('Incorrect password');
  };

  const handleUnlockWithLogin = async (username: string, password: string) => {
    if (!currentUser) throw new Error('No user found');
    
    // Verify username matches current user
    const cleanUsername = username.replace('@', '').trim().toLowerCase();
    if (currentUser.username.toLowerCase() !== cleanUsername) {
      throw new Error('Username does not match');
    }
    
    // Verify password matches user's login password
    if (currentUser.password !== password) {
      throw new Error('Incorrect password');
    }
    
    // If login credentials are correct, unlock the screen
    setIsScreenLocked(false);
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const updatedUser = await userService.update(currentUser.id, updates);
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error; // Re-throw so AuthView can handle it properly
    }
  };

  const handleRegister = async (userData: Partial<User>) => {
    if (!currentProjectId) return;
    
    // Get current project domain
    const activeProject = projects.find(p => p.id === currentProjectId);
    const projectDomain = activeProject?.domain;
    
    // Validate email domain if project has a domain set
    if (projectDomain && userData.email) {
      const emailDomain = userData.email.split('@')[1];
      if (emailDomain !== projectDomain) {
        alert(`Email must use the project domain: @${projectDomain}\n\nPlease create your email with @${projectDomain}`);
        return;
      }
    }
    
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

  const handleCreatePost = async (data: { text: string; image?: string; images?: string[]; video?: string; ratio: '3:4' | '16:9' | '1:1' }) => {
    if (!currentUser || !currentProjectId) return;
    try {
      await postService.create({
      projectId: currentProjectId,
      userId: currentUser.id,
      userName: currentUser.name,
      userUsername: currentUser.username,
      text: data.text,
      image: data.image,
      images: data.images,
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
      console.log('Deleting post from database:', postId);
      
      const post = posts.find(p => p.id === postId);
      if (!post) {
        console.warn('Post not found:', postId);
        return;
      }

      // Delete from database first
      await postService.delete(postId);
      console.log('Post deleted successfully from database');
      
      // Then remove from UI (optimistic update already handled by real-time subscription)
      setPosts(prev => prev.filter(p => p.id !== postId));
      
      // Real-time subscription will also update, but we've already updated locally
    } catch (error) {
      console.error('Failed to delete post from database:', error);
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
      // Validate required fields
      if (!userData.name || !userData.email || !userData.username) {
        alert('Name, email, and username are required fields.');
        return;
      }
      
      const newUser = await userService.create({
        name: userData.name,
        email: userData.email,
        username: userData.username,
        role: userData.role || Role.EMPLOYEE,
        parentId: currentUser.id,
        projectId: currentProjectId,
        isEmailVerified: false,
        isTwoStepEnabled: false,
        ...userData
      });
      setUsers(prev => [...prev, newUser]);
    } catch (error: any) {
      console.error('Failed to add subordinate:', error);
      const errorMessage = error?.message || 'Failed to add subordinate. Please try again.';
      if (errorMessage.includes('username') || errorMessage.includes('unique')) {
        alert('Username already exists. Please choose a different username.');
      } else {
        alert(errorMessage);
      }
    }
  };

  const addTask = async (data: any) => {
    if (!currentUser || !currentProjectId) return;
    try {
      // Convert single assignee to array format, or use provided array
      const assignedUsers = data.assignedTo 
        ? (Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo])
        : [currentUser.id];
      
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
        assignedTo: assignedUsers
      });
      
      // Notify all assigned users about the new task (except the assigner if they assigned to themselves)
      for (const assignedUserId of assignedUsers) {
        if (assignedUserId !== currentUser.id) {
          await addNotification(
            assignedUserId,
            'New Task Assigned',
            `You have been assigned a new task: ${data.title}`,
            'task',
            'tasks'
          );
        }
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

  const handleCreateCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'projectId' | 'userId'>) => {
    if (!currentUser || !currentProjectId) return;
    try {
      console.log('Creating event with data:', { ...event, projectId: currentProjectId, userId: currentUser.id });
      const newEvent = await calendarService.create({
        ...event,
        projectId: currentProjectId,
        userId: currentUser.id
      });
      console.log('Event created successfully:', newEvent);
      console.log('Event startDate:', newEvent.startDate, 'Event endDate:', newEvent.endDate);
      setCalendarEvents(prev => {
        const updated = [...prev, newEvent];
        console.log('Updated calendar events count:', updated.length);
        return updated;
      });

      // Notify event creator
      await addNotification(
        currentUser.id,
        'Calendar Event Created',
        `Event "${event.title}" has been added to your calendar`,
        'calendar',
        'calendar'
      );

      // Notify attendees if any
      if (event.attendees && event.attendees.length > 0) {
        for (const attendeeId of event.attendees) {
          if (attendeeId !== currentUser.id) {
            await addNotification(
              attendeeId,
              'Calendar Event Invitation',
              `${currentUser.name} invited you to "${event.title}"`,
              'calendar',
              'calendar'
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      alert('Failed to create calendar event. Please try again.');
    }
  };

  const handleUpdateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    if (!currentUser || !currentProjectId) return;
    try {
      const existingEvent = calendarEvents.find(e => e.id === id);
      await calendarService.update(id, updates);
      
      // Notify attendees if attendees were added or changed
      if (updates.attendees && updates.attendees.length > 0) {
        const newAttendees = updates.attendees.filter(attendeeId => 
          !existingEvent?.attendees?.includes(attendeeId) && attendeeId !== currentUser.id
        );
        
        for (const attendeeId of newAttendees) {
          await addNotification(
            attendeeId,
            'Calendar Event Invitation',
            `${currentUser.name} invited you to "${updates.title || existingEvent?.title || 'an event'}"`,
            'calendar',
            'calendar'
          );
        }
      }
      
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      alert('Failed to update calendar event. Please try again.');
    }
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    if (!currentUser || !currentProjectId) return;
    try {
      console.log('Deleting calendar event from database:', id);
      
      // Delete from database
      await calendarService.delete(id);
      console.log('Calendar event deleted successfully from database');
      
      // Remove from local state immediately
      setCalendarEvents(prev => prev.filter(e => e.id !== id));
      
      // Real-time subscription will also update, but we've already updated locally
    } catch (error) {
      console.error('Failed to delete calendar event from database:', error);
      alert('Failed to delete calendar event. Please try again.');
    }
  };

  const handleSubmitComplaint = async (subject: string, message: string, targetUserId: string, attachment?: ComplaintAttachment) => {
    if (!currentUser || !currentProjectId) return;
    try {
      // Verify target user is a management user
      const targetUser = users.find(u => u.id === targetUserId);
      if (!targetUser || targetUser.role !== Role.MANAGEMENT) {
        alert('Invalid target user. Please select a valid management user.');
        return;
      }

      await complaintService.create({
        projectId: currentProjectId,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        subject,
        message,
        status: 'pending',
        attachment,
        targetUserId
      });
      
      // Notify only the selected management user about the complaint
      await addNotification(
        targetUserId,
        'New Complaint',
        `${currentUser.name} submitted a complaint: ${subject}`,
        'complaint',
        'complaints'
      );
      
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

  const handleSubmitFeedback = async (subject: string, message: string, userName: string, userEmail: string, isPrivate: boolean, surveyId?: string) => {
    if (!currentProjectId) {
      alert('Please select a project first.');
      return;
    }
    try {
      await feedbackService.create({
        projectId: currentProjectId,
        surveyId: surveyId,
        userId: currentUser?.id,
        userName: userName || currentUser?.name,
        userEmail: userEmail || currentUser?.email,
        subject,
        message,
        isPrivate
      });
      // Real-time subscription will update the state automatically
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      await feedbackService.delete(feedbackId);
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to delete feedback:', error);
      alert('Failed to delete feedback. Please try again.');
    }
  };

  const handleCreateSurvey = async (title: string, description: string, type: 'program' | 'event' | 'general', programName?: string, eventName?: string, deadline?: string) => {
    if (!currentUser || !currentProjectId) {
      alert('Please log in to create surveys.');
      return;
    }
    if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.MANAGEMENT && currentUser.role !== Role.HOD) {
      alert('Only management can create surveys.');
      return;
    }
    try {
      await surveyService.create({
        projectId: currentProjectId,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        title,
        description,
        type,
        programName,
        eventName,
        status: 'active',
        deadline: deadline ? new Date(deadline).toISOString() : undefined
      });
      alert('Survey created successfully!');
    } catch (error) {
      console.error('Failed to create survey:', error);
      alert('Failed to create survey. Please try again.');
    }
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    try {
      await surveyService.delete(surveyId);
    } catch (error) {
      console.error('Failed to delete survey:', error);
      alert('Failed to delete survey. Please try again.');
    }
  };

  const handleCloseSurvey = async (surveyId: string) => {
    try {
      await surveyService.update(surveyId, { status: 'closed' });
    } catch (error) {
      console.error('Failed to close survey:', error);
      alert('Failed to close survey. Please try again.');
    }
  };

  const handleCreatePoll = async (question: string, description: string, options: string[], allowMultipleVotes: boolean, showResultsBeforeVoting: boolean, deadline?: string) => {
    if (!currentUser || !currentProjectId) {
      alert('Please log in to create polls.');
      return;
    }
    if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.MANAGEMENT && currentUser.role !== Role.HOD) {
      alert('Only management can create polls.');
      return;
    }
    try {
      // Generate IDs for options
      const optionsWithIds: Poll['options'] = options.map((text, index) => ({
        id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${index}`,
        text: text.trim(),
        votes: 0,
        voters: []
      }));

      await pollService.create({
        projectId: currentProjectId,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        question,
        description,
        options: optionsWithIds,
        status: 'active',
        allowMultipleVotes,
        showResultsBeforeVoting,
        deadline: deadline ? new Date(deadline).toISOString() : undefined
      });
      alert('Poll created successfully!');
    } catch (error) {
      console.error('Failed to create poll:', error);
      alert('Failed to create poll. Please try again.');
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    if (!currentUser) {
      alert('Please log in to vote.');
      return;
    }
    try {
      await pollService.vote(pollId, optionId, currentUser.id);
    } catch (error: any) {
      console.error('Failed to vote:', error);
      alert(error.message || 'Failed to vote. Please try again.');
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      await pollService.delete(pollId);
    } catch (error) {
      console.error('Failed to delete poll:', error);
      alert('Failed to delete poll. Please try again.');
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      await pollService.update(pollId, { status: 'closed' });
    } catch (error) {
      console.error('Failed to close poll:', error);
      alert('Failed to close poll. Please try again.');
    }
  };

  const handleCreateForm = async (title: string, description: string, fields: FeedbackFormField[], allowMultipleSubmissions: boolean, deadline?: string) => {
    if (!currentUser || !currentProjectId) {
      alert('Please log in to create forms.');
      return;
    }
    if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.MANAGEMENT && currentUser.role !== Role.HOD) {
      alert('Only management can create forms.');
      return;
    }
    try {
      await feedbackFormService.create({
        projectId: currentProjectId,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        title,
        description,
        fields,
        status: 'active',
        allowMultipleSubmissions,
        deadline: deadline ? new Date(deadline).toISOString() : undefined
      });
      alert('Form created successfully!');
    } catch (error) {
      console.error('Failed to create form:', error);
      alert('Failed to create form. Please try again.');
    }
  };

  const handleSubmitForm = async (formId: string, responses: { [fieldId: string]: string | string[] | number }, userName: string, userEmail: string) => {
    if (!currentProjectId) {
      alert('Please select a project first.');
      return;
    }
    try {
      await feedbackFormService.submitResponse({
        formId,
        projectId: currentProjectId,
        userId: currentUser?.id,
        userName: userName || currentUser?.name || 'Anonymous',
        userEmail: userEmail || currentUser?.email,
        responses
      });
    } catch (error: any) {
      console.error('Failed to submit form:', error);
      throw error; // Re-throw so the component can handle it
    }
  };

  const handleDeleteForm = async (formId: string) => {
    try {
      await feedbackFormService.delete(formId);
    } catch (error) {
      console.error('Failed to delete form:', error);
      alert('Failed to delete form. Please try again.');
    }
  };

  const handleCloseForm = async (formId: string) => {
    try {
      await feedbackFormService.update(formId, { status: 'closed' });
    } catch (error) {
      console.error('Failed to close form:', error);
      alert('Failed to close form. Please try again.');
    }
  };

  const handleGetFormSubmissions = async (formId: string): Promise<FeedbackFormResponse[]> => {
    try {
      return await feedbackFormService.getSubmissions(formId);
    } catch (error) {
      console.error('Failed to get form submissions:', error);
      throw error;
    }
  };

  const handleDeleteFormSubmission = async (submissionId: string) => {
    try {
      await feedbackFormService.deleteSubmission(submissionId);
    } catch (error) {
      console.error('Failed to delete submission:', error);
      alert('Failed to delete submission. Please try again.');
    }
  };

  const handleConnect = async (connectedUserId: string) => {
    if (!currentUser) return;
    try {
      // Check if there's already a connection request from the other user
      const existingConnection = await connectionService.getConnection(connectedUserId, currentUser.id);
      
      if (existingConnection) {
        // If the other user already sent a request, auto-accept it
        if (existingConnection.status === 'pending' && existingConnection.userId === connectedUserId) {
          await connectionService.update(existingConnection.id, { status: 'accepted' });
          
          // Notify the user who sent the original request
          const connectedUser = users.find(u => u.id === connectedUserId);
          if (connectedUser) {
            await addNotification(
              connectedUserId,
              'Connection Accepted',
              `${currentUser.name} accepted your connection request`,
              'connection',
              'profile'
            );
          }
          alert('Connection accepted!');
        } else if (existingConnection.status === 'accepted') {
          alert('You are already connected with this user.');
        } else {
          alert('Connection request already exists.');
        }
      } else {
        // Create a new connection request
        await connectionService.create({
          userId: currentUser.id,
          connectedUserId,
          status: 'pending'
        });
        
        // Notify the user being connected to
        const connectedUser = users.find(u => u.id === connectedUserId);
        if (connectedUser) {
          await addNotification(
            connectedUserId,
            'Connection Request',
            `${currentUser.name} wants to connect with you`,
            'connection',
            'profile'
          );
        }
        alert('Connection request sent!');
      }
    } catch (error: any) {
      console.error('Failed to send connection request:', error);
      if (error?.message?.includes('unique') || error?.code === '23505') {
        alert('Connection request already exists.');
      } else {
        alert('Failed to send connection request. Please try again.');
      }
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      await connectionService.update(connectionId, { status: 'accepted' });
      
      // Notify the user who sent the request
      const connection = connections.find(c => c.id === connectionId);
      if (connection && currentUser) {
        const requesterId = connection.userId === currentUser.id ? connection.connectedUserId : connection.userId;
        await addNotification(
          requesterId,
          'Connection Accepted',
          `${currentUser.name} accepted your connection request`,
          'connection',
          'profile'
        );
      }
    } catch (error) {
      console.error('Failed to accept connection:', error);
      alert('Failed to accept connection. Please try again.');
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await connectionService.delete(connectionId);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect. Please try again.');
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

  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean = false) => {
    try {
      console.log('Deleting message:', messageId, 'deleteForEveryone:', deleteForEveryone);
      
      const message = messages.find(m => m.id === messageId);
      if (!message) {
        console.warn('Message not found:', messageId);
        return;
      }

      if (deleteForEveryone) {
        // Delete from database - real-time subscription will remove it for all users
        await messageService.delete(messageId);
        console.log('Message deleted from database (for everyone)');
        // Don't optimistically update - let real-time subscription handle it for consistency
      } else {
        // Delete only for current user - remove from local state only
        // In a future enhancement, you could add a "deleted_for" field to track per-user deletions
        setMessages(prev => prev.filter(m => m.id !== messageId));
        console.log('Message deleted locally (for sender only)');
      }
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      
      // Provide specific error messages based on error type
      if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.code === 'ECONNREFUSED' || error?.message?.includes('Failed to fetch')) {
        alert('Failed to connect to database. Please check your internet connection and try again.');
      } else if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
        alert('Authentication error. Please log in again.');
      } else {
        alert('Failed to delete message. Please try again.');
      }
    }
  };

  const handleClearHistory = async (receiverId: string | undefined, groupId: string | undefined, clearForEveryone: boolean) => {
    if (!currentUser || !currentProjectId) return;
    
    try {
      console.log('Clearing chat history:', { receiverId, groupId, clearForEveryone });
      
      if (clearForEveryone) {
        // Delete all messages from database - real-time subscription will sync to all users
        await messageService.deleteByConversation(
          currentProjectId,
          currentUser.id,
          receiverId,
          groupId,
          true
        );
        console.log('Chat history cleared from database (for everyone)');
        // Don't optimistically update - let real-time subscription handle it for consistency
      } else {
        // Clear only for current user - remove from local state only
        setMessages(prev => {
          if (groupId) {
            return prev.filter(m => m.groupId !== groupId);
          } else if (receiverId) {
            return prev.filter(m => 
              !((m.senderId === currentUser.id && m.receiverId === receiverId) ||
                (m.senderId === receiverId && m.receiverId === currentUser.id))
            );
          }
          return prev;
        });
        console.log('Chat history cleared locally (for current user only)');
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      alert('Failed to clear chat history. Please try again.');
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
        if (!group) {
          throw new Error('Group not found');
        }
        await groupService.update(targetId, { activeCall: callInfo });
        
        // Notify all group members about the call
        const groupMembers = users.filter(u => group.members.includes(u.id) && u.id !== currentUser.id);
        for (const member of groupMembers) {
          await addNotification(
            member.id,
            `Group ${type === 'video' ? 'Video' : 'Audio'} Call`,
            `${currentUser.name} started a ${type} call in ${group.name}`,
            'call',
            'chat'
          );
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

        // Notify the other user
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
    } catch (error: any) {
      console.error('Failed to start call:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to start call. Please try again.';
      alert(errorMessage);
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

  const handleMarkAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      const unreadNotifs = userNotifications.filter(n => !n.read);
      // Mark all unread notifications as read
      for (const notif of unreadNotifs) {
        await notificationService.update(notif.id, { read: true });
      }
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Fallback: update local state
      setNotifications(prev => prev.map(n => 
        n.userId === currentUser.id && !n.read ? { ...n, read: true } : n
      ));
    }
  };

  const handleClearAllNotifications = async () => {
    if (!currentUser || !currentProjectId) return;
    try {
      // Delete all notifications for current user in current project from Supabase
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('project_id', currentProjectId);
      
      if (error) {
        console.error('Failed to clear notifications from Supabase:', error);
        throw error;
      }
      
      // Real-time subscription will update the state automatically
      // Also clear the played notifications ref for the cleared notifications
      const userNotifs = notifications.filter(n => n.userId === currentUser.id && n.projectId === currentProjectId);
      userNotifs.forEach(notif => {
        playedNotificationsRef.current.delete(notif.id);
      });
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

  // Calculate unread message count (direct messages and group messages)
  const unreadMessageCount = useMemo(() => {
    if (!currentUser) return 0;
    return scopedMessages.filter(m => {
      // Direct messages where current user is the receiver and status is not 'seen'
      if (m.receiverId === currentUser.id && m.status !== 'seen') {
        return true;
      }
      // Group messages where current user is not the sender and status is not 'seen'
      // Check if user is a member of the group
      if (m.groupId && m.senderId !== currentUser.id && m.status !== 'seen') {
        const group = scopedGroups.find(g => g.id === m.groupId);
        return group?.members.includes(currentUser.id) || false;
      }
      return false;
    }).length;
  }, [scopedMessages, scopedGroups, currentUser]);

  // Automatically mark all notifications as read when notifications view is opened
  useEffect(() => {
    if (view === 'notifications' && currentUser) {
      // Get current unread notifications for the user
      const unreadNotifs = notifications.filter(n => 
        n.userId === currentUser.id && 
        n.projectId === currentProjectId && 
        !n.read
      );
      
      if (unreadNotifs.length > 0) {
        // Mark all unread notifications as read
        const markAllAsRead = async () => {
          try {
            for (const notif of unreadNotifs) {
              await notificationService.update(notif.id, { read: true });
            }
            // Real-time subscription will update the state automatically
          } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            // Fallback: update local state
            setNotifications(prev => prev.map(n => 
              n.userId === currentUser.id && n.projectId === currentProjectId && !n.read 
                ? { ...n, read: true } 
                : n
            ));
          }
        };
        markAllAsRead();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentUser, currentProjectId]); // Only trigger when view changes to notifications

  // Automatically mark all unread messages as seen when chat view is opened
  useEffect(() => {
    if (view === 'chat' && currentUser) {
      // Get all unread messages for the current user
      const unreadMessages = scopedMessages.filter(m => {
        // Direct messages where current user is the receiver and status is not 'seen'
        if (m.receiverId === currentUser.id && m.status !== 'seen') {
          return true;
        }
        // Group messages where current user is not the sender and status is not 'seen'
        // Check if user is a member of the group
        if (m.groupId && m.senderId !== currentUser.id && m.status !== 'seen') {
          const group = scopedGroups.find(g => g.id === m.groupId);
          return group?.members.includes(currentUser.id) || false;
        }
        return false;
      });

      if (unreadMessages.length > 0) {
        // Store unread message IDs for fallback
        const unreadMessageIds = new Set(unreadMessages.map(m => m.id));
        
        // Mark all unread messages as seen
        const markAllAsSeen = async () => {
          try {
            for (const msg of unreadMessages) {
              await messageService.update(msg.id, { status: 'seen' });
            }
            // Real-time subscription will update the state automatically
          } catch (error) {
            console.error('Failed to mark all messages as seen:', error);
            // Fallback: update local state for the unread messages we found
            setMessages(prev => prev.map(m => 
              unreadMessageIds.has(m.id) ? { ...m, status: 'seen' as const } : m
            ));
          }
        };
        markAllAsSeen();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentUser, currentProjectId]); // Only trigger when view changes to chat

  const filteredTasks = useMemo(() => {
    if (!currentUser) return [];
    let result = scopedTasks.filter(t => 
      (t.assignedTo && t.assignedTo.includes(currentUser.id)) || t.assignedBy === currentUser.id
    );
    
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
            projectDomain={projectDomain}
            activeProjectName={activeProject?.name}
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
          projectDomain={projectDomain}
          activeProjectName={activeProject?.name}
            allUsers={scopedUsers}
            connections={connections}
            onConnect={handleConnect}
            onAcceptConnection={handleAcceptConnection}
            onDisconnect={handleDisconnect}
          />;
      case 'calendar':
        return currentUser ? <CalendarView
          currentUser={currentUser}
          events={calendarEvents}
          allUsers={scopedUsers}
          onCreateEvent={handleCreateCalendarEvent}
          onUpdateEvent={handleUpdateCalendarEvent}
          onDeleteEvent={handleDeleteCalendarEvent}
        /> : null;
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
          allUsers={scopedUsers}
          onSubmitComplaint={handleSubmitComplaint}
          onResolveComplaint={handleResolveComplaint}
        /> : null;
      case 'feedback':
        return <FeedbackView
          currentUser={currentUser}
          feedbacks={scopedFeedbacks}
          surveys={scopedSurveys}
          polls={scopedPolls}
          forms={scopedForms}
          onSubmitFeedback={handleSubmitFeedback}
          onDeleteFeedback={currentUser?.role === Role.ADMIN ? handleDeleteFeedback : undefined}
          onCreateSurvey={(currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD) ? handleCreateSurvey : undefined}
          onDeleteSurvey={(currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD) ? handleDeleteSurvey : undefined}
          onCloseSurvey={(currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD) ? handleCloseSurvey : undefined}
          onCreatePoll={(currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD) ? handleCreatePoll : undefined}
          onVotePoll={handleVotePoll}
          onDeletePoll={(currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD) ? handleDeletePoll : undefined}
          onClosePoll={(currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD) ? handleClosePoll : undefined}
          onCreateForm={(currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD) ? handleCreateForm : undefined}
          onSubmitForm={handleSubmitForm}
          onDeleteForm={(currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD) ? handleDeleteForm : undefined}
          onCloseForm={(currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD) ? handleCloseForm : undefined}
          onGetFormSubmissions={handleGetFormSubmissions}
          onDeleteFormSubmission={(currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD) ? handleDeleteFormSubmission : undefined}
        />;
      case 'chat':
        return currentUser ? <ChatView 
          currentUser={currentUser} 
          allUsers={scopedUsers} 
          messages={scopedMessages} 
          groups={scopedGroups}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          onClearHistory={handleClearHistory}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          initialUserId={chatUserId}
        /> : null;
      case 'feed':
        return currentUser ? <FeedView 
          posts={scopedPosts} 
          currentUser={currentUser} 
          allUsers={scopedUsers}
          connections={connections}
          onLike={handleLikePost}
          onComment={handleCommentPost}
          onShare={handleSharePost}
          onDelete={handleDeletePost}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onNavigateToChat={(userId) => {
            setChatUserId(userId);
            setView('chat');
          }}
        /> : null;
      case 'notifications':
        return currentUser ? (
          <NotificationsView 
            notifications={userNotifications}
            onMarkAsRead={handleMarkNotificationRead}
            onClearAll={handleClearAllNotifications}
            onNavigate={(v) => setView(v)}
            onAcceptConnection={handleAcceptConnection}
            onDeclineConnection={handleDisconnect}
            connections={connections}
            currentUserId={currentUser.id}
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

  // Show loading state while checking screen lock
  if (isCheckingScreenLock) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden shadow-2xl no-scrollbar items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show screen lock if user is logged in but screen is locked
  if (currentUser && isScreenLocked) {
    return <ScreenLock currentUser={currentUser} onUnlock={handleUnlockScreen} onUnlockWithLogin={handleUnlockWithLogin} onLogout={handleLogout} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden shadow-2xl no-scrollbar">
      {/* Notification Sound */}
      <audio ref={notificationSoundRef} src="/app_logo/notification.mp3" preload="auto" />
      {/* Header */}
      <header className="p-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <button 
              onClick={() => setShowNavMenu(!showNavMenu)}
              className="p-2.5 shadow-sm border rounded-2xl transition-all bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
              title="Menu"
            >
              <Menu size={18} />
            </button>
            
            {showNavMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[59]" 
                  onClick={() => setShowNavMenu(false)}
                />
                <div className="absolute top-12 left-0 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-[60] overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation</span>
                  </div>
                  <div className="py-2">
                    <button 
                      onClick={() => { setView('calendar'); setShowNavMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-left hover:bg-slate-50 transition-colors ${view === 'calendar' ? 'bg-orange-50 text-orange-600' : 'text-slate-700'}`}
                    >
                      <Calendar size={18} className={view === 'calendar' ? 'text-orange-600' : 'text-slate-400'} />
                      <span>Calendar</span>
                    </button>
                    <button 
                      onClick={() => { setView('emails'); setShowNavMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-left hover:bg-slate-50 transition-colors ${view === 'emails' ? 'bg-orange-50 text-orange-600' : 'text-slate-700'}`}
                    >
                      <Mail size={18} className={view === 'emails' ? 'text-orange-600' : 'text-slate-400'} />
                      <span>Mailbox</span>
                    </button>
                    <button 
                      onClick={() => { setView('complaints'); setShowNavMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-left hover:bg-slate-50 transition-colors ${view === 'complaints' ? 'bg-orange-50 text-orange-600' : 'text-slate-700'}`}
                    >
                      <HelpCircle size={18} className={view === 'complaints' ? 'text-orange-600' : 'text-slate-400'} />
                      <span>Complaint Box</span>
                    </button>
                    <button 
                      onClick={() => { setView('feedback'); setShowNavMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-left hover:bg-slate-50 transition-colors ${view === 'feedback' ? 'bg-orange-50 text-orange-600' : 'text-slate-700'}`}
                    >
                      <MessageSquare size={18} className={view === 'feedback' ? 'text-orange-600' : 'text-slate-400'} />
                      <span>Feedback Box</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="relative flex-1 flex justify-center">
            <button 
              onClick={() => currentUser?.role === Role.ADMIN && setShowProjectSelector(!showProjectSelector)}
              className="flex items-center gap-2 text-center group"
            >
              <div>
                <h1 className="text-xl font-black text-slate-900 text-center tracking-tighter" style={{ fontFamily: "'Leckerli One', cursive" }}>
                  SRJ SOCIAL
                </h1>
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
        <button onClick={() => setView('chat')} className={`p-2 transition-all flex flex-col items-center gap-1 relative ${view === 'chat' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}><MessageCircle size={20} />{unreadMessageCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[8px] flex items-center justify-center rounded-full font-bold border-2 border-white">{unreadMessageCount}</span>}<span className="text-[8px] font-bold uppercase tracking-widest">Chat</span></button>
        <button onClick={() => setView('profile')} className={`p-2 transition-all flex flex-col items-center gap-1 ${view === 'profile' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}><UserIcon size={20} /><span className="text-[8px] font-bold uppercase tracking-widest">ID</span></button>
      </nav>

      {isModalOpen && <AddTaskModal 
        onClose={() => setIsModalOpen(false)} 
        onSaveTask={addTask} 
        onSaveNote={addNote}
        currentUser={currentUser}
        subordinates={
          currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD
            ? scopedUsers.filter(u => u.id !== currentUser.id) // Management can assign to all users (except themselves)
            : scopedUsers.filter(u => u.parentId === currentUser?.id) // Regular users can only assign to their subordinates
        } 
      />}
      {isPostModalOpen && <AddPostModal onClose={() => setIsPostModalOpen(false)} onSave={handleCreatePost} />}
    </div>
  );
};

export default App;
