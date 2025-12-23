import { createClient } from '@supabase/supabase-js';
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
  Email 
} from '../types';

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

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
    if (updates.isTwoStepEnabled !== undefined) updateData.is_two_step_enabled = updates.isTwoStepEnabled;
    if (updates.isEmailVerified !== undefined) updateData.is_email_verified = updates.isEmailVerified;
    if (updates.telegramUserId !== undefined) updateData.telegram_user_id = updates.telegramUserId;
    if (updates.telegramToken !== undefined) updateData.telegram_token = updates.telegramToken;
    
    // Remove camelCase fields that were mapped
    delete updateData.parentId;
    delete updateData.projectId;
    delete updateData.employeeId;
    delete updateData.subDepartment;
    delete updateData.contactNo;
    delete updateData.profilePhoto;
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
export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async create(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...project,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
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
    return data || [];
  },

  async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        project_id: task.projectId,
        assigned_by: task.assignedBy,
        assigned_to: task.assignedTo,
        due_date: task.dueDate,
        sub_tasks: task.subTasks,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = { ...updates };
    if (updates.projectId) updateData.project_id = updates.projectId;
    if (updates.assignedBy) updateData.assigned_by = updates.assignedBy;
    if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
    if (updates.dueDate) updateData.due_date = updates.dueDate;
    if (updates.subTasks) updateData.sub_tasks = updates.subTasks;
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('complaints')
      .insert({
        ...complaint,
        project_id: complaint.projectId,
        user_id: complaint.userId,
        user_name: complaint.userName,
        user_role: complaint.userRole,
        created_at: new Date().toISOString()
      })
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
    
    const { data, error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
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
    if (updates.projectId) updateData.project_id = updates.projectId;
    if (updates.createdBy) updateData.created_by = updates.createdBy;
    if (updates.activeCall) updateData.active_call = updates.activeCall;
    
    const { data, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
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

