
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, ViewType, Note, Role, User, Complaint, ComplaintAttachment, Notification, Message, Group, MessageAttachment, Post, Comment, Project, Email } from './types';
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
  otpService
} from './services/supabaseService';
import { supabaseAuthService } from './services/supabaseAuthService';
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
import { AdminUsersView } from './components/AdminUsersView';
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
  const [pendingEmailVerification, setPendingEmailVerification] = useState<{ user: User; code: string } | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<{ userData: Partial<User>; code: string } | null>(null);
  const [pendingSubordinateRegistration, setPendingSubordinateRegistration] = useState<{ userData: Partial<User>; code: string } | null>(null);

  // Load ALL data from Supabase on mount (not localStorage)
  useEffect(() => {
    const loadAllDataFromSupabase = async () => {
      try {
        // Load Users
        const supabaseUsers = await userService.getAll();
        if (supabaseUsers && supabaseUsers.length > 0) {
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
          setUsers(mappedUsers);
          console.log('✅ Loaded users from Supabase:', mappedUsers.length);
        }

        // Load Projects
        const supabaseProjects = await projectService.getAll();
        if (supabaseProjects && supabaseProjects.length > 0) {
          const mappedProjects = supabaseProjects.map((p: any) => ({
            id: p.id,
            name: p.name,
            managerName: p.manager_name,
            password: p.password,
            domain: p.domain,
            createdAt: p.created_at
          }));
          setProjects(mappedProjects);
          console.log('✅ Loaded projects from Supabase:', mappedProjects.length);
        }

        // Load Tasks (for current project)
        if (currentProjectId) {
          const supabaseTasks = await taskService.getByProject(currentProjectId);
          if (supabaseTasks && supabaseTasks.length > 0) {
            const mappedTasks = supabaseTasks.map((t: any) => ({
              id: t.id,
              projectId: t.project_id,
              title: t.title,
              description: t.description,
              priority: t.priority as Priority,
              completed: t.completed,
              category: t.category,
              dueDate: t.due_date,
              createdAt: t.created_at,
              subTasks: t.sub_tasks || [],
              assignedBy: t.assigned_by,
              assignedTo: t.assigned_to
            }));
            setTasks(mappedTasks);
            console.log('✅ Loaded tasks from Supabase:', mappedTasks.length);
          }
        }

        // Load Notes
        if (currentProjectId) {
          const supabaseNotes = await noteService.getByProject(currentProjectId);
          if (supabaseNotes && supabaseNotes.length > 0) {
            const mappedNotes = supabaseNotes.map((n: any) => ({
              id: n.id,
              projectId: n.project_id,
              title: n.title,
              content: n.content,
              color: n.color,
              createdAt: n.created_at
            }));
            setNotes(mappedNotes);
            console.log('✅ Loaded notes from Supabase:', mappedNotes.length);
          }
        }

        // Load Posts
        if (currentProjectId) {
          const supabasePosts = await postService.getByProject(currentProjectId);
          if (supabasePosts && supabasePosts.length > 0) {
            const mappedPosts = supabasePosts.map((p: any) => ({
              id: p.id,
              projectId: p.project_id,
              userId: p.user_id,
              userName: p.user_name,
              userUsername: p.user_username,
              text: p.text,
              image: p.image,
              video: p.video,
              ratio: p.ratio,
              likes: p.likes || [],
              mentions: p.mentions || [],
              hashtags: p.hashtags || [],
              comments: p.comments || [],
              createdAt: p.created_at
            }));
            setPosts(mappedPosts);
            console.log('✅ Loaded posts from Supabase:', mappedPosts.length);
          }
        }

        // Load Complaints
        if (currentProjectId) {
          const supabaseComplaints = await complaintService.getByProject(currentProjectId);
          if (supabaseComplaints && supabaseComplaints.length > 0) {
            const mappedComplaints = supabaseComplaints.map((c: any) => ({
              id: c.id,
              projectId: c.project_id,
              userId: c.user_id,
              userName: c.user_name,
              userRole: c.user_role as Role,
              subject: c.subject,
              message: c.message,
              status: c.status,
              createdAt: c.created_at,
              attachment: c.attachment
            }));
            setComplaints(mappedComplaints);
            console.log('✅ Loaded complaints from Supabase:', mappedComplaints.length);
          }
        }

        // Load Emails
        if (currentProjectId) {
          const supabaseEmails = await emailService.getByProject(currentProjectId);
          if (supabaseEmails && supabaseEmails.length > 0) {
            const mappedEmails = supabaseEmails.map((e: any) => ({
              id: e.id,
              projectId: e.project_id,
              senderId: e.sender_id,
              senderEmail: e.sender_email,
              receiverEmail: e.receiver_email,
              cc: e.cc || [],
              bcc: e.bcc || [],
              subject: e.subject,
              body: e.body,
              read: e.read,
              starred: e.starred,
              attachments: e.attachments || [],
              createdAt: e.created_at
            }));
            setEmails(mappedEmails);
            console.log('✅ Loaded emails from Supabase:', mappedEmails.length);
          }
        }

        // Load Messages
        if (currentProjectId) {
          const supabaseMessages = await messageService.getByProject(currentProjectId);
          if (supabaseMessages && supabaseMessages.length > 0) {
            const mappedMessages = supabaseMessages.map((m: any) => ({
              id: m.id,
              projectId: m.project_id,
              senderId: m.sender_id,
              receiverId: m.receiver_id,
              groupId: m.group_id,
              text: m.text,
              attachment: m.attachment,
              callInfo: m.call_info,
              status: m.status,
              replyToId: m.reply_to_id,
              mentions: m.mentions || [],
              createdAt: m.created_at
            }));
            setMessages(mappedMessages);
            console.log('✅ Loaded messages from Supabase:', mappedMessages.length);
          }
        }

        // Load Groups
        if (currentProjectId) {
          const supabaseGroups = await groupService.getByProject(currentProjectId);
          if (supabaseGroups && supabaseGroups.length > 0) {
            const mappedGroups = supabaseGroups.map((g: any) => ({
              id: g.id,
              projectId: g.project_id,
              name: g.name,
              description: g.description,
              createdBy: g.created_by,
              members: g.members || [],
              activeCall: g.active_call,
              createdAt: g.created_at
            }));
            setGroups(mappedGroups);
            console.log('✅ Loaded groups from Supabase:', mappedGroups.length);
          }
        }

        console.log('✅ All data loaded from Supabase successfully!');
      } catch (error: any) {
        console.error('❌ Failed to load data from Supabase:', error);
        console.log('📦 Using localStorage as fallback');
      }
    };
    
    loadAllDataFromSupabase();
  }, [currentProjectId]);

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
  // Sync Logic - Only sync currentUser and projectId to localStorage (for session)
  // All other data is now in Supabase and syncs automatically across devices
  useEffect(() => { if(currentProjectId) localStorage.setItem('srj_active_project_id', currentProjectId) }, [currentProjectId]);
  
  // Optional: Cache users in localStorage for offline support (but Supabase is primary)
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('srj_users', JSON.stringify(users));
    }
  }, [users]);

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

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      alert('Only admin can delete users!');
      return;
    }
    
    if (userId === currentUser.id) {
      alert('You cannot delete your own account!');
      return;
    }

    try {
      // Delete all related data from Supabase first
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) {
        alert('User not found!');
        return;
      }

      // Delete tasks where user is assigned
      const userTasks = tasks.filter(t => t.assignedTo === userId || t.assignedBy === userId);
      for (const task of userTasks) {
        await taskService.delete(task.id);
      }

      // Delete posts by user
      const userPosts = posts.filter(p => p.userId === userId);
      for (const post of userPosts) {
        await postService.delete(post.id);
      }

      // Delete complaints by user
      const userComplaints = complaints.filter(c => c.userId === userId);
      for (const complaint of userComplaints) {
        await complaintService.delete(complaint.id);
      }

      // Delete messages (keep messages but they'll show as "Deleted Account")
      // Actually, we'll keep messages for history, but mark sender/receiver as deleted
      const userMessages = messages.filter(m => m.senderId === userId || m.receiverId === userId);
      // We'll keep messages but they'll show "Deleted Account" in UI

      // Delete notifications for user
      const userNotifications = notifications.filter(n => n.userId === userId);
      for (const notification of userNotifications) {
        await notificationService.delete(notification.id);
      }

      // Delete emails sent/received by user
      const userEmails = emails.filter(e => e.senderId === userId || e.receiverEmail === userToDelete.email);
      for (const email of userEmails) {
        await emailService.delete(email.id);
      }

      // Remove user from groups (update groups to remove user from members array)
      const userGroups = groups.filter(g => g.members.includes(userId));
      for (const group of userGroups) {
        const updatedMembers = group.members.filter(m => m !== userId);
        await groupService.update(group.id, { members: updatedMembers });
      }

      // Finally, delete the user from Supabase
      await userService.delete(userId);
      
      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      // Update local state for related data (remove deleted items)
      setTasks(prev => prev.filter(t => t.assignedTo !== userId && t.assignedBy !== userId));
      setPosts(prev => prev.filter(p => p.userId !== userId));
      setComplaints(prev => prev.filter(c => c.userId !== userId));
      // Keep messages but they'll show "Deleted Account"
      setNotifications(prev => prev.filter(n => n.userId !== userId));
      setEmails(prev => prev.filter(e => e.senderId !== userId && e.receiverEmail !== userToDelete.email));
      setGroups(prev => prev.map(g => ({
        ...g,
        members: g.members.filter(m => m !== userId)
      })));
      
      alert('User and all related data deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + (error.message || 'Unknown error'));
    }
  };

  const handleLogin = async (username: string, password?: string, code?: string) => {
    if (!needsTwoStep && !pendingEmailVerification && !pendingRegistration && !pendingSubordinateRegistration) {
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
        
        // Check email verification (MANDATORY)
        if (!user.isEmailVerified) {
          alert("⚠️ Email verification required! Please verify your email before logging in.");
          return;
        }
        
        // Check 2-step verification (OPTIONAL)
        if (user.isTwoStepEnabled) {
          try {
            // Generate OTP and send to user
            const otpCode = await otpService.generateOTP(user.id);
            
            // In production, send OTP via email/SMS
            // For now, show in alert (remove in production)
            alert(`🔐 2-Step Verification\n\nA verification code has been sent to ${user.email}\n\nCode: ${otpCode}\n\n(For testing - expires in 5 minutes)`);
            
            setNeedsTwoStep(true);
            setPendingUser(user);
            return;
          } catch (error: any) {
            console.error('Error generating OTP:', error);
            alert("❌ Failed to generate verification code. Please try again.");
            return;
          }
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
      // 2-Step Verification - Verify OTP from Supabase
      if (!code || code.length !== 6) {
        alert("Please enter a 6-digit verification code.");
        return;
      }
      
      try {
        const isValid = await otpService.verifyOTP(pendingUser.id, code);
        
        if (isValid) {
          completeLogin(pendingUser);
        } else {
          alert("❌ Invalid or expired verification code. Please try again.");
        }
      } catch (error: any) {
        console.error('Error verifying OTP:', error);
        alert("❌ Failed to verify code. Please try again.");
      }
    }
  };

  // Handle email link verification (called when user clicks link in email)
  const handleEmailLinkVerification = async () => {
    // Check if user clicked email verification link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'signup') {
      try {
        // Get session from Supabase
        const session = await supabaseAuthService.getSession();
        
        if (session && session.user) {
          // Check if this is for registration or subordinate
          if (pendingRegistration && pendingRegistration.code === 'supabase-auth') {
            // Email verified - create user in our custom users table
            const newUser: Omit<User, 'id'> = {
              name: pendingRegistration.userData.name || 'Unknown',
              email: pendingRegistration.userData.email || '',
              username: pendingRegistration.userData.username || 'user_' + Date.now(),
              role: pendingRegistration.userData.role || Role.EMPLOYEE,
              parentId: pendingRegistration.userData.parentId || 'u1',
              projectId: pendingRegistration.userData.projectId || currentProjectId,
              isEmailVerified: true,
              isTwoStepEnabled: pendingRegistration.userData.isTwoStepEnabled || false,
              password: pendingRegistration.userData.password,
              employeeId: pendingRegistration.userData.employeeId,
              department: pendingRegistration.userData.department,
              subDepartment: pendingRegistration.userData.subDepartment,
              designation: pendingRegistration.userData.designation,
              dob: pendingRegistration.userData.dob,
              contactNo: pendingRegistration.userData.contactNo,
              profilePhoto: pendingRegistration.userData.profilePhoto,
              telegramUserId: pendingRegistration.userData.telegramUserId,
              telegramToken: pendingRegistration.userData.telegramToken
            };
            
            const createdUser = await userService.create(newUser);
            setUsers(prev => [...prev, createdUser]);
            setPendingRegistration(null);
            setPendingEmailVerification(null);
            
            // Clear URL hash
            window.history.replaceState(null, '', window.location.pathname);
            
            alert(`✅ Email verified and account created successfully!\n\nWelcome ${createdUser.name}! You can now log in.`);
          } else if (pendingSubordinateRegistration && pendingSubordinateRegistration.code === 'supabase-auth') {
            // Email verified - create subordinate in our custom users table
            const newUser: Omit<User, 'id'> = {
              name: pendingSubordinateRegistration.userData.name || 'Unknown',
              email: pendingSubordinateRegistration.userData.email || '',
              username: pendingSubordinateRegistration.userData.username || 'user_' + Date.now(),
              role: pendingSubordinateRegistration.userData.role || Role.EMPLOYEE,
              parentId: pendingSubordinateRegistration.userData.parentId || currentUser?.id || 'u1',
              projectId: pendingSubordinateRegistration.userData.projectId || currentProjectId,
              isEmailVerified: true,
              isTwoStepEnabled: pendingSubordinateRegistration.userData.isTwoStepEnabled || false,
              password: pendingSubordinateRegistration.userData.password,
              employeeId: pendingSubordinateRegistration.userData.employeeId,
              department: pendingSubordinateRegistration.userData.department,
              subDepartment: pendingSubordinateRegistration.userData.subDepartment,
              designation: pendingSubordinateRegistration.userData.designation,
              dob: pendingSubordinateRegistration.userData.dob,
              contactNo: pendingSubordinateRegistration.userData.contactNo,
              profilePhoto: pendingSubordinateRegistration.userData.profilePhoto,
              telegramUserId: pendingSubordinateRegistration.userData.telegramUserId,
              telegramToken: pendingSubordinateRegistration.userData.telegramToken
            };
            
            const createdUser = await userService.create(newUser);
            setUsers(prev => [...prev, createdUser]);
            setPendingSubordinateRegistration(null);
            setPendingEmailVerification(null);
            
            // Clear URL hash
            window.history.replaceState(null, '', window.location.pathname);
            
            alert(`✅ Email verified and personnel account created successfully!\n\n${createdUser.name} Connected Successfully`);
          }
        }
      } catch (error: any) {
        console.error('Email link verification error:', error);
        alert("❌ Failed to verify email link. Please try again.");
      }
    }
  };

  // Listen for email link verification on mount
  useEffect(() => {
    handleEmailLinkVerification();
  }, []);

  // Also listen to Supabase auth state changes
  useEffect(() => {
    const subscription = supabaseAuthService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User signed in via email link - handle verification
        handleEmailLinkVerification();
      }
    });

    return () => {
      if (subscription && subscription.data) {
        subscription.data.subscription.unsubscribe();
      }
    };
  }, [pendingRegistration, pendingSubordinateRegistration]);

  // Remove handleVerifyEmail - no longer needed for OTP
  const handleVerifyEmail = async () => {
    // This function is no longer used - email verification happens via link click
    // Keeping for backward compatibility but it won't be called
  };

  const handleResendVerificationCode = async () => {
    // Handle registration resend with Supabase Auth
    if (pendingRegistration && pendingRegistration.code === 'supabase-auth') {
      try {
        const email = pendingRegistration.userData.email || '';
        await supabaseAuthService.resendVerificationEmail(email);
        alert(`📧 Verification email resent to ${email}\n\nPlease check your email and click the verification link.`);
      } catch (error: any) {
        console.error('Resend error:', error);
        alert("❌ Failed to resend email: " + (error.message || "Please try again."));
      }
      return;
    }
    
    // Handle subordinate registration resend with Supabase Auth
    if (pendingSubordinateRegistration && pendingSubordinateRegistration.code === 'supabase-auth') {
      try {
        const email = pendingSubordinateRegistration.userData.email || '';
        await supabaseAuthService.resendVerificationEmail(email);
        alert(`📧 Verification email resent to ${email}\n\nPlease check your email and click the verification link.`);
      } catch (error: any) {
        console.error('Resend error:', error);
        alert("❌ Failed to resend email: " + (error.message || "Please try again."));
      }
      return;
    }
  };

  const handleResendOTP = async () => {
    if (!pendingUser) return;
    
    try {
      const otpCode = await otpService.generateOTP(pendingUser.id);
      alert(`🔐 New verification code sent to ${pendingUser.email}\n\nCode: ${otpCode}\n\n(For testing - expires in 5 minutes)`);
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      alert("❌ Failed to resend code. Please try again.");
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

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      // Update in Supabase
      const updatedUser = await userService.update(currentUser.id, updates);
      
      // Update local state
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      localStorage.setItem('srj_current_user', JSON.stringify(updatedUser));
    } catch (error: any) {
      console.error('Update profile error:', error);
      alert("❌ Failed to update profile. Please try again.");
    }
  };

  const handleRegister = async (userData: Partial<User>) => {
    if (!currentProjectId) return;
    
    // Validate required fields
    if (!userData.email || !userData.name || !userData.username || !userData.password) {
      alert("❌ Please fill all required fields.");
      return;
    }
    
    try {
      // Use Supabase Auth to send email verification link
      try {
        await supabaseAuthService.signUp(
          userData.email || '',
          userData.password || '',
          {
            name: userData.name || 'Unknown',
            username: userData.username || 'user_' + Date.now()
          }
        );
      } catch (error: any) {
        throw error;
      }
      
      // Store registration data temporarily (NOT saved to Supabase users table yet)
      setPendingRegistration({
        userData: {
          name: userData.name || 'Unknown',
          email: userData.email || '',
          username: userData.username || 'user_' + Date.now(),
          role: Role.EMPLOYEE,
          parentId: 'u1',
          projectId: currentProjectId,
          isEmailVerified: false, // Will be set to true after verification
          isTwoStepEnabled: userData.isTwoStepEnabled || false,
          password: userData.password,
          employeeId: userData.employeeId,
          department: userData.department,
          subDepartment: userData.subDepartment,
          designation: userData.designation,
          dob: userData.dob,
          contactNo: userData.contactNo,
          profilePhoto: userData.profilePhoto,
          telegramUserId: userData.telegramUserId,
          telegramToken: userData.telegramToken
        },
        code: 'supabase-auth' // Mark as Supabase Auth email link
      });
      
      // Set pending email verification for UI
      setPendingEmailVerification({
        user: {
          id: 'pending',
          name: userData.name || 'Unknown',
          email: userData.email || '',
          username: userData.username || '',
          role: Role.EMPLOYEE
        },
        code: 'supabase-auth'
      });
      
      alert(`📧 Verification email sent to ${userData.email}\n\nPlease check your email and click the verification link to complete registration.`);
    } catch (error: any) {
      console.error('Registration error:', error);
      alert("❌ Failed to send verification email: " + (error.message || "Please try again."));
    }
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

  const handleCreatePost = async (data: { text: string; image?: string; video?: string; ratio: '3:4' | '16:9' | '1:1' }) => {
    if (!currentUser || !currentProjectId) return;
    try {
      const newPost: Omit<Post, 'id' | 'createdAt'> = {
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
      };

      // Save to Supabase directly
      const createdPost = await postService.create(newPost);
      setPosts(prev => [createdPost, ...prev]);
      setView('feed');
    } catch (error: any) {
      console.error('Create post error:', error);
      alert("❌ Failed to create post: " + (error.message || "Please try again."));
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
      
      // Update in Supabase
      await postService.update(postId, { likes: newLikes });
      
      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes: newLikes } : p
      ));
    } catch (error: any) {
      console.error('Like post error:', error);
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
      
      const updatedComments = [...(post.comments || []), newComment];
      
      // Update in Supabase
      await postService.update(postId, { comments: updatedComments });
      
      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments: updatedComments } : p
      ));
    } catch (error: any) {
      console.error('Comment post error:', error);
      alert("❌ Failed to add comment. Please try again.");
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
    
    // Validate required fields
    if (!userData.email || !userData.name || !userData.username || !userData.password) {
      alert("❌ Please fill all required fields (Name, Email, Username, Password).");
      return;
    }
    
    try {
      // Use Supabase Auth to send email verification link
      try {
        await supabaseAuthService.signUp(
          userData.email || '',
          userData.password || '',
          {
            name: userData.name || 'Unknown',
            username: userData.username || 'user_' + Date.now()
          }
        );
      } catch (error: any) {
        throw error;
      }
      
      // Store subordinate registration data temporarily (NOT saved to Supabase users table yet)
      setPendingSubordinateRegistration({
        userData: {
          name: userData.name || 'Unknown',
          email: userData.email || '',
          username: userData.username || 'user_' + Date.now(),
          role: userData.role || Role.EMPLOYEE,
          parentId: currentUser.id,
          projectId: currentProjectId,
          isEmailVerified: false, // Will be set to true after verification
          isTwoStepEnabled: userData.isTwoStepEnabled || false,
          password: userData.password,
          employeeId: userData.employeeId,
          department: userData.department,
          subDepartment: userData.subDepartment,
          designation: userData.designation,
          dob: userData.dob,
          contactNo: userData.contactNo,
          profilePhoto: userData.profilePhoto,
          telegramUserId: userData.telegramUserId,
          telegramToken: userData.telegramToken
        },
        code: 'supabase-auth' // Mark as Supabase Auth email link
      });
      
      // Set pending email verification for UI
      setPendingEmailVerification({
        user: {
          id: 'pending-subordinate',
          name: userData.name || 'Unknown',
          email: userData.email || '',
          username: userData.username || '',
          role: userData.role || Role.EMPLOYEE
        },
        code: 'supabase-auth'
      });
      
      alert(`📧 Verification email sent to ${userData.email}\n\nPlease check your email and click the verification link to complete personnel creation.`);
    } catch (error: any) {
      console.error('Add subordinate error:', error);
      alert("❌ Failed to send verification email: " + (error.message || "Please try again."));
    }
  };

  const addTask = async (data: any) => {
    if (!currentUser || !currentProjectId) return;
    try {
      const newTask: Omit<Task, 'id' | 'createdAt'> = {
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
      };
      
      // Save to Supabase directly
      const createdTask = await taskService.create(newTask);
      setTasks(prev => [createdTask, ...prev]);
    } catch (error: any) {
      console.error('Add task error:', error);
      alert("❌ Failed to create task: " + (error.message || "Please try again."));
    }
  };

  const addNote = async (data: any) => {
    if (!currentProjectId) return;
    try {
      const newNote: Omit<Note, 'id' | 'createdAt'> = {
        projectId: currentProjectId,
        title: data.title,
        content: data.content,
        color: data.color
      };
      
      // Save to Supabase
      const createdNote = await noteService.create(newNote);
      setNotes(prev => [createdNote, ...prev]);
      setView('notes');
    } catch (error: any) {
      console.error('Add note error:', error);
      alert("❌ Failed to create note. Please try again.");
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const updatedCompleted = !task.completed;
      
      // Update in Supabase
      await taskService.update(taskId, { completed: updatedCompleted });
      
      // Update local state
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed: updatedCompleted } : t
      ));
    } catch (error: any) {
      console.error('Toggle task error:', error);
      alert("❌ Failed to update task. Please try again.");
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
          onNavigateToAdminUsers={() => setView('admin-users')}
          allUsers={scopedUsers}
          pendingEmailVerification={pendingEmailVerification || (pendingRegistration ? {
            user: {
              id: 'pending',
              name: pendingRegistration.userData.name || 'Unknown',
              email: pendingRegistration.userData.email || '',
              username: pendingRegistration.userData.username || '',
              role: pendingRegistration.userData.role || Role.EMPLOYEE
            },
            code: pendingRegistration.code
          } : null) || (pendingSubordinateRegistration ? {
            user: {
              id: 'pending-subordinate',
              name: pendingSubordinateRegistration.userData.name || 'Unknown',
              email: pendingSubordinateRegistration.userData.email || '',
              username: pendingSubordinateRegistration.userData.username || '',
              role: pendingSubordinateRegistration.userData.role || Role.EMPLOYEE
            },
            code: pendingSubordinateRegistration.code
          } : null)}
          onVerifyEmail={handleVerifyEmail}
          onResendVerificationCode={handleResendVerificationCode}
          onResendOTP={handleResendOTP}
        />;
      case 'admin-users':
        return currentUser && currentUser.role === Role.ADMIN ? (
          <AdminUsersView 
            currentUser={currentUser}
            allUsers={scopedUsers}
            onDeleteUser={handleDeleteUser}
            onBack={() => setView('profile')}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300">
            <ShieldCheck size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Access Denied</p>
            <p className="text-xs text-slate-400 mt-2">Only admins can access this page</p>
          </div>
        );
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
