import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../supabase.config';
import { 
  User, 
  Project, 
  Task, 
  Note, 
  Post, 
  Complaint, 
  Notification, 
  Message, 
  Group, 
  Email,
  CalendarEvent,
  Feedback,
  Survey,
  Poll,
  FeedbackForm,
  FeedbackFormResponse,
  Connection
} from '../types';

// Singleton pattern to prevent multiple client instances during HMR
let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();

// Helper function to map database user row to User type
const mapDbUserToUser = (data: any): User => ({
  id: data.id,
  name: data.name,
  email: data.email,
  username: data.username,
  role: data.role,
  parentId: data.parent_id || null,
  projectId: data.project_id || null,
  employeeId: data.employee_id || null,
  department: data.department || null,
  subDepartment: data.sub_department || null,
  designation: data.designation || null,
  dob: data.dob || null,
  contactNo: data.contact_no || null,
  profilePhoto: data.profile_photo || null,
  bio: data.bio || null,
  backgroundImage: data.background_image || null,
  password: data.password || null,
  isTwoStepEnabled: data.is_two_step_enabled || false,
  isEmailVerified: data.is_email_verified || false,
  telegramUserId: data.telegram_user_id || null,
  telegramToken: data.telegram_token || null
});

// User Operations
export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) throw error;
    return (data || []).map(mapDbUserToUser);
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data ? mapDbUserToUser(data) : null;
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    // Generate a unique ID for the user
    const userId = 'u' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        parent_id: user.parentId || null,
        project_id: user.projectId || null,
        employee_id: user.employeeId || null,
        department: user.department || null,
        sub_department: user.subDepartment || null,
        designation: user.designation || null,
        dob: user.dob || null,
        contact_no: user.contactNo || null,
        profile_photo: user.profilePhoto || null,
        bio: user.bio || null,
        background_image: user.backgroundImage || null,
        password: user.password || null,
        is_two_step_enabled: user.isTwoStepEnabled || false,
        is_email_verified: user.isEmailVerified || false,
        telegram_user_id: user.telegramUserId || null,
        telegram_token: user.telegramToken || null
      })
      .select()
      .single();
    if (error) throw error;
    
    return mapDbUserToUser(data);
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const updateData: any = { ...updates };
    // Map camelCase to snake_case for database
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
    if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
    if (updates.employeeId !== undefined) updateData.employee_id = updates.employeeId;
    if (updates.subDepartment !== undefined) updateData.sub_department = updates.subDepartment;
    if (updates.contactNo !== undefined) updateData.contact_no = updates.contactNo;
    if (updates.profilePhoto !== undefined) updateData.profile_photo = updates.profilePhoto;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.backgroundImage !== undefined) updateData.background_image = updates.backgroundImage;
    if (updates.isTwoStepEnabled !== undefined) updateData.is_two_step_enabled = updates.isTwoStepEnabled;
    if (updates.isEmailVerified !== undefined) updateData.is_email_verified = updates.isEmailVerified;
    if (updates.telegramUserId !== undefined) updateData.telegram_user_id = updates.telegramUserId;
    if (updates.telegramToken !== undefined) updateData.telegram_token = updates.telegramToken;
    if (updates.password !== undefined) updateData.password = updates.password;
    
    // Remove camelCase fields that were mapped (but keep password as it's already in the correct format)
    delete updateData.parentId;
    delete updateData.projectId;
    delete updateData.employeeId;
    delete updateData.subDepartment;
    delete updateData.contactNo;
    delete updateData.profilePhoto;
    delete updateData.bio;
    delete updateData.backgroundImage;
    delete updateData.isTwoStepEnabled;
    delete updateData.isEmailVerified;
    delete updateData.telegramUserId;
    delete updateData.telegramToken;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapDbUserToUser(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Project Operations
// Helper function to map database project to Project type
const mapDbProjectToProject = (data: any): Project => ({
  id: data.id,
  name: data.name,
  managerName: data.manager_name || data.managerName,
  password: data.password,
  domain: data.domain,
  createdAt: data.created_at || data.createdAt
});

export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDbProjectToProject);
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return mapDbProjectToProject(data);
  },

  async create(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const projectId = 'p_' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    const { data, error } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        name: project.name,
        manager_name: project.managerName,
        password: project.password || null,
        domain: project.domain || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return mapDbProjectToProject(data);
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.managerName !== undefined) updateData.manager_name = updates.managerName;
    if (updates.password !== undefined) updateData.password = updates.password;
    if (updates.domain !== undefined) updateData.domain = updates.domain;
    
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapDbProjectToProject(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Task Operations
export const taskService = {
  async getByProject(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    // Map database format to TypeScript format, handling both old (single) and new (array) formats
    return (data || []).map((item: any) => ({
      ...item,
      projectId: item.project_id || item.projectId,
      dueDate: item.due_date || item.dueDate,
      createdAt: item.created_at || item.createdAt,
      subTasks: item.sub_tasks || item.subTasks || [],
      assignedBy: item.assigned_by || item.assignedBy,
      assignedTo: item.assigned_to_array ? item.assigned_to_array : (item.assigned_to ? [item.assigned_to] : [])
    }));
  },

  async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const insertData: any = {
      project_id: task.projectId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      completed: task.completed,
      category: task.category,
      assigned_by: task.assignedBy,
      assigned_to_array: task.assignedTo || [],
      due_date: task.dueDate,
      sub_tasks: task.subTasks,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    
    return {
      ...data,
      projectId: data.project_id || data.projectId,
      dueDate: data.due_date || data.dueDate,
      createdAt: data.created_at || data.createdAt,
      subTasks: data.sub_tasks || data.subTasks || [],
      assignedBy: data.assigned_by || data.assignedBy,
      assignedTo: data.assigned_to_array || (data.assigned_to ? [data.assigned_to] : [])
    };
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
    if (updates.assignedBy !== undefined) updateData.assigned_by = updates.assignedBy;
    if (updates.assignedTo !== undefined) updateData.assigned_to_array = updates.assignedTo;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.subTasks !== undefined) updateData.sub_tasks = updates.subTasks;
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return {
      ...data,
      projectId: data.project_id || data.projectId,
      dueDate: data.due_date || data.dueDate,
      createdAt: data.created_at || data.createdAt,
      subTasks: data.sub_tasks || data.subTasks || [],
      assignedBy: data.assigned_by || data.assignedBy,
      assignedTo: data.assigned_to_array || (data.assigned_to ? [data.assigned_to] : [])
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Note Operations
export const noteService = {
  async getByProject(projectId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(note: Omit<Note, 'id' | 'createdAt'>): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...note,
        project_id: note.projectId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Note>): Promise<Note> {
    const updateData: any = { ...updates };
    if (updates.projectId) updateData.project_id = updates.projectId;
    
    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Post Operations
export const postService = {
  async getByProject(projectId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(post: Omit<Post, 'id' | 'createdAt'>): Promise<Post> {
    // Generate a unique ID for the post
    const postId = Date.now().toString() + Math.random().toString(36).substring(2, 11);
    
    const { data, error } = await supabase
      .from('posts')
      .insert({
        id: postId,
        project_id: post.projectId,
        user_id: post.userId,
        user_name: post.userName,
        user_username: post.userUsername,
        text: post.text,
        image: post.image || null,
        images: post.images && post.images.length > 0 ? post.images : null,
        video: post.video || null,
        ratio: post.ratio || '1:1',
        likes: post.likes || [],
        mentions: post.mentions || [],
        hashtags: post.hashtags || [],
        comments: post.comments || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Post>): Promise<Post> {
    const updateData: any = { ...updates };
    if (updates.projectId) updateData.project_id = updates.projectId;
    if (updates.userId) updateData.user_id = updates.userId;
    if (updates.userName) updateData.user_name = updates.userName;
    if (updates.userUsername) updateData.user_username = updates.userUsername;
    
    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Complaint Operations
export const complaintService = {
  async getByProject(projectId: string): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(complaint: Omit<Complaint, 'id' | 'createdAt'>): Promise<Complaint> {
    // Generate a unique ID for the complaint
    const complaintId = 'c' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    
    const insertData: any = {
      id: complaintId,
      project_id: complaint.projectId,
      user_id: complaint.userId,
      user_name: complaint.userName,
      user_role: complaint.userRole,
      subject: complaint.subject,
      message: complaint.message,
      status: complaint.status || 'pending',
      created_at: new Date().toISOString()
    };
    
    if (complaint.targetUserId) {
      insertData.target_user_id = complaint.targetUserId;
    }
    
    if (complaint.attachment) {
      insertData.attachment = complaint.attachment;
    }
    
    const { data, error } = await supabase
      .from('complaints')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Complaint>): Promise<Complaint> {
    const updateData: any = { ...updates };
    if (updates.projectId) updateData.project_id = updates.projectId;
    if (updates.userId) updateData.user_id = updates.userId;
    if (updates.userName) updateData.user_name = updates.userName;
    if (updates.userRole) updateData.user_role = updates.userRole;
    
    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Notification Operations
export const notificationService = {
  async getByUser(userId: string, projectId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const notificationId = Date.now().toString() + Math.random().toString(36).substring(2, 11);
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        id: notificationId,
        project_id: notification.projectId,
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read || false,
        link_to: notification.linkTo || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      userId: data.user_id || data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: data.read,
      createdAt: data.created_at || data.createdAt,
      linkTo: data.link_to || data.linkTo
    };
  },

  async update(id: string, updates: Partial<Notification>): Promise<Notification> {
    const updateData: any = { ...updates };
    if (updates.projectId) updateData.project_id = updates.projectId;
    if (updates.userId) updateData.user_id = updates.userId;
    if (updates.linkTo) updateData.link_to = updates.linkTo;
    
    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Message Operations
export const messageService = {
  async getByProject(projectId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    // Generate a unique ID for the message
    const messageId = Date.now().toString() + Math.random().toString(36).substring(2, 11);
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        id: messageId,
        project_id: message.projectId,
        sender_id: message.senderId,
        receiver_id: message.receiverId || null,
        group_id: message.groupId || null,
        text: message.text,
        attachment: message.attachment || null,
        call_info: message.callInfo || null,
        status: message.status || 'sent',
        reply_to_id: message.replyToId || null,
        mentions: message.mentions || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Message>): Promise<Message> {
    const updateData: any = { ...updates };
    if (updates.projectId) updateData.project_id = updates.projectId;
    if (updates.senderId) updateData.sender_id = updates.senderId;
    if (updates.receiverId) updateData.receiver_id = updates.receiverId;
    if (updates.groupId) updateData.group_id = updates.groupId;
    if (updates.replyToId) updateData.reply_to_id = updates.replyToId;
    if (updates.callInfo) updateData.call_info = updates.callInfo;
    if (updates.status) updateData.status = updates.status;
    
    const { data, error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    // Map response back to Message type
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      senderId: data.sender_id || data.senderId,
      receiverId: data.receiver_id || data.receiverId,
      groupId: data.group_id || data.groupId,
      text: data.text,
      attachment: data.attachment,
      callInfo: data.call_info || data.callInfo,
      status: data.status || 'sent',
      replyToId: data.reply_to_id || data.replyToId,
      mentions: data.mentions || [],
      createdAt: data.created_at || data.createdAt
    };
  },

  async delete(id: string): Promise<void> {
    console.log('Deleting message from database, id:', id);
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    console.log('Message deleted successfully from database');
  },

  async deleteByConversation(
    projectId: string,
    senderId: string,
    receiverId?: string,
    groupId?: string,
    clearForEveryone: boolean = false
  ): Promise<void> {
    console.log('Deleting messages by conversation:', { projectId, senderId, receiverId, groupId, clearForEveryone });
    
    if (groupId) {
      // Group chat - delete all messages in the group
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('project_id', projectId)
        .eq('group_id', groupId);
      
      if (error) {
        console.error('Supabase bulk delete error:', error);
        throw error;
      }
    } else if (receiverId) {
      // Direct message - delete messages between sender and receiver
      // Delete messages where sender is current user and receiver is the other user
      // OR sender is the other user and receiver is current user
      // We need to delete in two separate queries or use a more complex filter
      const { error: error1 } = await supabase
        .from('messages')
        .delete()
        .eq('project_id', projectId)
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId);
      
      if (error1) {
        console.error('Supabase bulk delete error (first query):', error1);
        throw error1;
      }

      const { error: error2 } = await supabase
        .from('messages')
        .delete()
        .eq('project_id', projectId)
        .eq('sender_id', receiverId)
        .eq('receiver_id', senderId);
      
      if (error2) {
        console.error('Supabase bulk delete error (second query):', error2);
        throw error2;
      }
    } else {
      throw new Error('Either receiverId or groupId must be provided');
    }

    console.log('Messages deleted successfully from database');
  }
};

// Group Operations
export const groupService = {
  async getByProject(projectId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(group: Omit<Group, 'id' | 'createdAt'>): Promise<Group> {
    // Generate a unique ID for the group
    const groupId = 'g' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    
    const { data, error } = await supabase
      .from('groups')
      .insert({
        id: groupId,
        project_id: group.projectId,
        name: group.name,
        description: group.description || null,
        created_by: group.createdBy,
        members: group.members || [],
        active_call: group.activeCall || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Group>): Promise<Group> {
    const updateData: any = { ...updates };
    // Map camelCase to snake_case for database
    if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
    if (updates.createdBy !== undefined) updateData.created_by = updates.createdBy;
    if (updates.activeCall !== undefined) updateData.active_call = updates.activeCall;
    
    // Remove camelCase fields that were mapped
    delete updateData.projectId;
    delete updateData.createdBy;
    delete updateData.activeCall;
    
    const { data, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    // Map snake_case back to camelCase
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      name: data.name,
      description: data.description || null,
      createdBy: data.created_by || data.createdBy,
      members: data.members || [],
      createdAt: data.created_at || data.createdAt,
      activeCall: data.active_call || data.activeCall || null
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Email Operations
export const emailService = {
  async getByProject(projectId: string): Promise<Email[]> {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(email: Omit<Email, 'id' | 'createdAt'>): Promise<Email> {
    const { data, error } = await supabase
      .from('emails')
      .insert({
        ...email,
        project_id: email.projectId,
        sender_id: email.senderId,
        sender_email: email.senderEmail,
        receiver_email: email.receiverEmail,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Email>): Promise<Email> {
    const updateData: any = { ...updates };
    if (updates.projectId) updateData.project_id = updates.projectId;
    if (updates.senderId) updateData.sender_id = updates.senderId;
    if (updates.senderEmail) updateData.sender_email = updates.senderEmail;
    if (updates.receiverEmail) updateData.receiver_email = updates.receiverEmail;
    
    const { data, error } = await supabase
      .from('emails')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Calendar Event Operations
export const calendarService = {
  async getByProject(projectId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('project_id', projectId)
      .order('start_date', { ascending: true });
    if (error) throw error;
    return (data || []).map((e: any) => ({
      id: e.id,
      projectId: e.project_id || e.projectId,
      userId: e.user_id || e.userId,
      title: e.title,
      description: e.description,
      startDate: e.start_date || e.startDate,
      endDate: e.end_date || e.endDate,
      location: e.location,
      attendees: e.attendees || [],
      color: e.color || '#f97316',
      allDay: e.all_day || e.allDay || false,
      createdAt: e.created_at || e.createdAt
    }));
  },

  async create(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'projectId' | 'userId'> & { projectId: string; userId: string }): Promise<CalendarEvent> {
    const eventId = 'cal_' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        id: eventId,
        project_id: event.projectId,
        user_id: event.userId,
        title: event.title,
        description: event.description || null,
        start_date: event.startDate,
        end_date: event.endDate,
        location: event.location || null,
        attendees: event.attendees || [],
        color: event.color || '#f97316',
        all_day: event.allDay || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      userId: data.user_id || data.userId,
      title: data.title,
      description: data.description,
      startDate: data.start_date || data.startDate,
      endDate: data.end_date || data.endDate,
      location: data.location,
      attendees: data.attendees || [],
      color: data.color || '#f97316',
      allDay: data.all_day || data.allDay || false,
      createdAt: data.created_at || data.createdAt
    };
  },

  async update(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const updateData: any = { ...updates };
    if (updates.projectId) updateData.project_id = updates.projectId;
    if (updates.userId) updateData.user_id = updates.userId;
    if (updates.startDate) updateData.start_date = updates.startDate;
    if (updates.endDate) updateData.end_date = updates.endDate;
    if (updates.allDay !== undefined) updateData.all_day = updates.allDay;
    
    delete updateData.projectId;
    delete updateData.userId;
    delete updateData.startDate;
    delete updateData.endDate;
    delete updateData.allDay;
    
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      userId: data.user_id || data.userId,
      title: data.title,
      description: data.description,
      startDate: data.start_date || data.startDate,
      endDate: data.end_date || data.endDate,
      location: data.location,
      attendees: data.attendees || [],
      color: data.color || '#f97316',
      allDay: data.all_day || data.allDay || false,
      createdAt: data.created_at || data.createdAt
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Feedback Operations
export const feedbackService = {
  async getByProject(projectId: string, includePrivate: boolean = false): Promise<Feedback[]> {
    let query = supabase
      .from('feedback')
      .select('*')
      .eq('project_id', projectId);
    
    // If not including private, filter them out
    if (!includePrivate) {
      query = query.eq('is_private', false);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      projectId: item.project_id || item.projectId,
      surveyId: item.survey_id || item.surveyId,
      userId: item.user_id || item.userId,
      userName: item.user_name || item.userName,
      userEmail: item.user_email || item.userEmail,
      subject: item.subject,
      message: item.message,
      isPrivate: item.is_private || item.isPrivate || false,
      createdAt: item.created_at || item.createdAt
    }));
  },

  async create(feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
    // Generate a unique ID for the feedback
    const feedbackId = 'f' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    
    const insertData: any = {
      id: feedbackId,
      project_id: feedback.projectId,
      subject: feedback.subject,
      message: feedback.message,
      is_private: feedback.isPrivate || false,
      created_at: new Date().toISOString()
    };
    
    // Optional fields
    if (feedback.surveyId) {
      insertData.survey_id = feedback.surveyId;
    }
    if (feedback.userId) {
      insertData.user_id = feedback.userId;
    }
    if (feedback.userName) {
      insertData.user_name = feedback.userName;
    }
    if (feedback.userEmail) {
      insertData.user_email = feedback.userEmail;
    }
    
    const { data, error } = await supabase
      .from('feedback')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      surveyId: data.survey_id || data.surveyId,
      userId: data.user_id || data.userId,
      userName: data.user_name || data.userName,
      userEmail: data.user_email || data.userEmail,
      subject: data.subject,
      message: data.message,
      isPrivate: data.is_private || data.isPrivate || false,
      createdAt: data.created_at || data.createdAt
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Survey Operations
export const surveyService = {
  async getByProject(projectId: string, includeClosed: boolean = false): Promise<Survey[]> {
    let query = supabase
      .from('surveys')
      .select('*')
      .eq('project_id', projectId);
    
    if (!includeClosed) {
      query = query.eq('status', 'active');
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      projectId: item.project_id || item.projectId,
      createdBy: item.created_by || item.createdBy,
      createdByName: item.created_by_name || item.createdByName,
      title: item.title,
      description: item.description,
      programName: item.program_name || item.programName,
      eventName: item.event_name || item.eventName,
      type: item.type || 'general',
      status: item.status || 'active',
      deadline: item.deadline,
      createdAt: item.created_at || item.createdAt
    }));
  },

  async getById(id: string): Promise<Survey | null> {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      title: data.title,
      description: data.description,
      programName: data.program_name || data.programName,
      eventName: data.event_name || data.eventName,
      type: data.type || 'general',
      status: data.status || 'active',
      deadline: data.deadline,
      createdAt: data.created_at || data.createdAt
    };
  },

  async create(survey: Omit<Survey, 'id' | 'createdAt'>): Promise<Survey> {
    // Generate a unique ID for the survey
    const surveyId = 's' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    
    const insertData: any = {
      id: surveyId,
      project_id: survey.projectId,
      created_by: survey.createdBy,
      created_by_name: survey.createdByName,
      title: survey.title,
      type: survey.type || 'general',
      status: survey.status || 'active',
      created_at: new Date().toISOString()
    };
    
    if (survey.description) {
      insertData.description = survey.description;
    }
    if (survey.programName) {
      insertData.program_name = survey.programName;
    }
    if (survey.eventName) {
      insertData.event_name = survey.eventName;
    }
    if (survey.deadline) {
      insertData.deadline = survey.deadline;
    }
    
    const { data, error } = await supabase
      .from('surveys')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      title: data.title,
      description: data.description,
      programName: data.program_name || data.programName,
      eventName: data.event_name || data.eventName,
      type: data.type || 'general',
      status: data.status || 'active',
      deadline: data.deadline,
      createdAt: data.created_at || data.createdAt
    };
  },

  async update(id: string, updates: Partial<Survey>): Promise<Survey> {
    const updateData: any = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.programName !== undefined) updateData.program_name = updates.programName;
    if (updates.eventName !== undefined) updateData.event_name = updates.eventName;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    
    const { data, error } = await supabase
      .from('surveys')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      title: data.title,
      description: data.description,
      programName: data.program_name || data.programName,
      eventName: data.event_name || data.eventName,
      type: data.type || 'general',
      status: data.status || 'active',
      deadline: data.deadline,
      createdAt: data.created_at || data.createdAt
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Poll Operations
export const pollService = {
  async getByProject(projectId: string, includeClosed: boolean = false): Promise<Poll[]> {
    let query = supabase
      .from('polls')
      .select('*')
      .eq('project_id', projectId);
    
    if (!includeClosed) {
      query = query.eq('status', 'active');
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      projectId: item.project_id || item.projectId,
      createdBy: item.created_by || item.createdBy,
      createdByName: item.created_by_name || item.createdByName,
      question: item.question,
      description: item.description,
      options: item.options || [],
      status: item.status || 'active',
      allowMultipleVotes: item.allow_multiple_votes || item.allowMultipleVotes || false,
      showResultsBeforeVoting: item.show_results_before_voting || item.showResultsBeforeVoting || false,
      deadline: item.deadline,
      createdAt: item.created_at || item.createdAt
    }));
  },

  async getById(id: string): Promise<Poll | null> {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      question: data.question,
      description: data.description,
      options: data.options || [],
      status: data.status || 'active',
      allowMultipleVotes: data.allow_multiple_votes || data.allowMultipleVotes || false,
      showResultsBeforeVoting: data.show_results_before_voting || data.showResultsBeforeVoting || false,
      deadline: data.deadline,
      createdAt: data.created_at || data.createdAt
    };
  },

  async create(poll: Omit<Poll, 'id' | 'createdAt'>): Promise<Poll> {
    // Generate a unique ID for the poll
    const pollId = 'p' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    
    const insertData: any = {
      id: pollId,
      project_id: poll.projectId,
      created_by: poll.createdBy,
      created_by_name: poll.createdByName,
      question: poll.question,
      options: poll.options || [],
      status: poll.status || 'active',
      allow_multiple_votes: poll.allowMultipleVotes || false,
      show_results_before_voting: poll.showResultsBeforeVoting || false,
      created_at: new Date().toISOString()
    };
    
    if (poll.description) {
      insertData.description = poll.description;
    }
    if (poll.deadline) {
      insertData.deadline = poll.deadline;
    }
    
    const { data, error } = await supabase
      .from('polls')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      question: data.question,
      description: data.description,
      options: data.options || [],
      status: data.status || 'active',
      allowMultipleVotes: data.allow_multiple_votes || data.allowMultipleVotes || false,
      showResultsBeforeVoting: data.show_results_before_voting || data.showResultsBeforeVoting || false,
      deadline: data.deadline,
      createdAt: data.created_at || data.createdAt
    };
  },

  async vote(pollId: string, optionId: string, userId: string): Promise<Poll> {
    // Get the poll first
    const poll = await this.getById(pollId);
    if (!poll) throw new Error('Poll not found');
    
    if (poll.status !== 'active') {
      throw new Error('Poll is closed');
    }
    
    // Check if deadline has passed
    if (poll.deadline && new Date(poll.deadline) < new Date()) {
      throw new Error('Poll deadline has passed');
    }
    
    // Find the option
    const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
    if (optionIndex === -1) {
      throw new Error('Option not found');
    }
    
    // Check if user already voted (if multiple votes not allowed)
    if (!poll.allowMultipleVotes) {
      const hasVoted = poll.options.some(opt => opt.voters.includes(userId));
      if (hasVoted) {
        throw new Error('You have already voted on this poll');
      }
    }
    
    // Update the option
    const updatedOptions = [...poll.options];
    if (!updatedOptions[optionIndex].voters.includes(userId)) {
      updatedOptions[optionIndex].votes += 1;
      updatedOptions[optionIndex].voters.push(userId);
    }
    
    // Update the poll
    const { data, error } = await supabase
      .from('polls')
      .update({ options: updatedOptions })
      .eq('id', pollId)
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      question: data.question,
      description: data.description,
      options: data.options || [],
      status: data.status || 'active',
      allowMultipleVotes: data.allow_multiple_votes || data.allowMultipleVotes || false,
      showResultsBeforeVoting: data.show_results_before_voting || data.showResultsBeforeVoting || false,
      deadline: data.deadline,
      createdAt: data.created_at || data.createdAt
    };
  },

  async update(id: string, updates: Partial<Poll>): Promise<Poll> {
    const updateData: any = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.question !== undefined) updateData.question = updates.question;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.options !== undefined) updateData.options = updates.options;
    if (updates.allowMultipleVotes !== undefined) updateData.allow_multiple_votes = updates.allowMultipleVotes;
    if (updates.showResultsBeforeVoting !== undefined) updateData.show_results_before_voting = updates.showResultsBeforeVoting;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    
    const { data, error } = await supabase
      .from('polls')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      question: data.question,
      description: data.description,
      options: data.options || [],
      status: data.status || 'active',
      allowMultipleVotes: data.allow_multiple_votes || data.allowMultipleVotes || false,
      showResultsBeforeVoting: data.show_results_before_voting || data.showResultsBeforeVoting || false,
      deadline: data.deadline,
      createdAt: data.created_at || data.createdAt
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Feedback Form Operations
export const feedbackFormService = {
  async getByProject(projectId: string, includeClosed: boolean = false): Promise<FeedbackForm[]> {
    let query = supabase
      .from('feedback_forms')
      .select('*')
      .eq('project_id', projectId);
    
    if (!includeClosed) {
      query = query.eq('status', 'active');
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      projectId: item.project_id || item.projectId,
      createdBy: item.created_by || item.createdBy,
      createdByName: item.created_by_name || item.createdByName,
      title: item.title,
      description: item.description,
      fields: item.fields || [],
      status: item.status || 'active',
      allowMultipleSubmissions: item.allow_multiple_submissions || item.allowMultipleSubmissions || false,
      deadline: item.deadline,
      createdAt: item.created_at || item.createdAt
    }));
  },

  async getById(id: string): Promise<FeedbackForm | null> {
    const { data, error } = await supabase
      .from('feedback_forms')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      title: data.title,
      description: data.description,
      fields: data.fields || [],
      status: data.status || 'active',
      allowMultipleSubmissions: data.allow_multiple_submissions || data.allowMultipleSubmissions || false,
      deadline: data.deadline,
      createdAt: data.created_at || data.createdAt
    };
  },

  async create(form: Omit<FeedbackForm, 'id' | 'createdAt'>): Promise<FeedbackForm> {
    const formId = 'ff' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    
    const insertData: any = {
      id: formId,
      project_id: form.projectId,
      created_by: form.createdBy,
      created_by_name: form.createdByName,
      title: form.title,
      fields: form.fields || [],
      status: form.status || 'active',
      allow_multiple_submissions: form.allowMultipleSubmissions || false,
      created_at: new Date().toISOString()
    };
    
    if (form.description) insertData.description = form.description;
    if (form.deadline) insertData.deadline = form.deadline;
    
    const { data, error } = await supabase
      .from('feedback_forms')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      title: data.title,
      description: data.description,
      fields: data.fields || [],
      status: data.status || 'active',
      allowMultipleSubmissions: data.allow_multiple_submissions || data.allowMultipleSubmissions || false,
      deadline: data.deadline,
      createdAt: data.created_at || data.createdAt
    };
  },

  async update(id: string, updates: Partial<FeedbackForm>): Promise<FeedbackForm> {
    const updateData: any = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.fields !== undefined) updateData.fields = updates.fields;
    if (updates.allowMultipleSubmissions !== undefined) updateData.allow_multiple_submissions = updates.allowMultipleSubmissions;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    
    const { data, error } = await supabase
      .from('feedback_forms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      projectId: data.project_id || data.projectId,
      createdBy: data.created_by || data.createdBy,
      createdByName: data.created_by_name || data.createdByName,
      title: data.title,
      description: data.description,
      fields: data.fields || [],
      status: data.status || 'active',
      allowMultipleSubmissions: data.allow_multiple_submissions || data.allowMultipleSubmissions || false,
      deadline: data.deadline,
      createdAt: data.created_at || data.createdAt
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('feedback_forms')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getSubmissions(formId: string): Promise<FeedbackFormResponse[]> {
    const { data, error } = await supabase
      .from('feedback_form_submissions')
      .select('*')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      formId: item.form_id || item.formId,
      projectId: item.project_id || item.projectId,
      userId: item.user_id || item.userId,
      userName: item.user_name || item.userName,
      userEmail: item.user_email || item.userEmail,
      responses: item.responses || {},
      submittedAt: item.submitted_at || item.submittedAt
    }));
  },

  async submitResponse(response: Omit<FeedbackFormResponse, 'id' | 'submittedAt'>): Promise<FeedbackFormResponse> {
    const responseId = 'fs' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    
    // Check if user already submitted (if multiple submissions not allowed)
    const form = await this.getById(response.formId);
    if (!form) throw new Error('Form not found');
    
    if (form.status !== 'active') {
      throw new Error('Form is closed');
    }
    
    if (form.deadline && new Date(form.deadline) < new Date()) {
      throw new Error('Form deadline has passed');
    }
    
    if (!form.allowMultipleSubmissions && response.userId) {
      const existing = await supabase
        .from('feedback_form_submissions')
        .select('id')
        .eq('form_id', response.formId)
        .eq('user_id', response.userId)
        .single();
      
      if (existing.data) {
        throw new Error('You have already submitted this form');
      }
    }
    
    const insertData: any = {
      id: responseId,
      form_id: response.formId,
      project_id: response.projectId,
      responses: response.responses,
      submitted_at: new Date().toISOString()
    };
    
    if (response.userId) insertData.user_id = response.userId;
    if (response.userName) insertData.user_name = response.userName;
    if (response.userEmail) insertData.user_email = response.userEmail;
    
    const { data, error } = await supabase
      .from('feedback_form_submissions')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      formId: data.form_id || data.formId,
      projectId: data.project_id || data.projectId,
      userId: data.user_id || data.userId,
      userName: data.user_name || data.userName,
      userEmail: data.user_email || data.userEmail,
      responses: data.responses || {},
      submittedAt: data.submitted_at || data.submittedAt
    };
  },

  async deleteSubmission(id: string): Promise<void> {
    const { error } = await supabase
      .from('feedback_form_submissions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Connection Operations
export const connectionService = {
  async getByUser(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id || c.userId,
      connectedUserId: c.connected_user_id || c.connectedUserId,
      status: c.status || 'pending',
      createdAt: c.created_at || c.createdAt
    }));
  },

  async getConnection(userId: string, connectedUserId: string): Promise<Connection | null> {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`and(user_id.eq.${userId},connected_user_id.eq.${connectedUserId}),and(user_id.eq.${connectedUserId},connected_user_id.eq.${userId})`)
      .maybeSingle();
    if (error) return null;
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id || data.userId,
      connectedUserId: data.connected_user_id || data.connectedUserId,
      status: data.status || 'pending',
      createdAt: data.created_at || data.createdAt
    };
  },

  async create(connection: Omit<Connection, 'id' | 'createdAt'>): Promise<Connection> {
    const connectionId = 'conn' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
    const { data, error } = await supabase
      .from('connections')
      .insert({
        id: connectionId,
        user_id: connection.userId,
        connected_user_id: connection.connectedUserId,
        status: connection.status || 'pending'
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id || data.userId,
      connectedUserId: data.connected_user_id || data.connectedUserId,
      status: data.status || 'pending',
      createdAt: data.created_at || data.createdAt
    };
  },

  async update(id: string, updates: Partial<Connection>): Promise<Connection> {
    const updateData: any = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    const { data, error } = await supabase
      .from('connections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id || data.userId,
      connectedUserId: data.connected_user_id || data.connectedUserId,
      status: data.status || 'pending',
      createdAt: data.created_at || data.createdAt
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

