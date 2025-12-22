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

// User Operations
export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) throw error;
    
    // Map snake_case to camelCase
    return (data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      role: u.role,
      parentId: u.parent_id,
      projectId: u.project_id,
      employeeId: u.employee_id,
      department: u.department,
      subDepartment: u.sub_department,
      designation: u.designation,
      dob: u.dob,
      contactNo: u.contact_no,
      profilePhoto: u.profile_photo,
      password: u.password,
      isTwoStepEnabled: u.is_two_step_enabled,
      isEmailVerified: u.is_email_verified,
      telegramUserId: u.telegram_user_id,
      telegramToken: u.telegram_token
    }));
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    if (!data) return null;
    
    // Map snake_case to camelCase
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      parentId: data.parent_id,
      projectId: data.project_id,
      employeeId: data.employee_id,
      department: data.department,
      subDepartment: data.sub_department,
      designation: data.designation,
      dob: data.dob,
      contactNo: data.contact_no,
      profilePhoto: data.profile_photo,
      password: data.password,
      isTwoStepEnabled: data.is_two_step_enabled,
      isEmailVerified: data.is_email_verified,
      telegramUserId: data.telegram_user_id,
      telegramToken: data.telegram_token
    };
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    // Generate unique ID if not provided
    const userId = `u${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Map camelCase to snake_case for Supabase
    const insertData: any = {
      id: userId, // Add generated ID
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      parent_id: user.parentId,
      project_id: user.projectId,
      employee_id: user.employeeId,
      department: user.department,
      sub_department: user.subDepartment,
      designation: user.designation,
      dob: user.dob,
      contact_no: user.contactNo, // Map contactNo to contact_no
      profile_photo: user.profilePhoto,
      password: user.password,
      is_two_step_enabled: user.isTwoStepEnabled !== undefined ? user.isTwoStepEnabled : false,
      is_email_verified: user.isEmailVerified !== undefined ? user.isEmailVerified : false,
      telegram_user_id: user.telegramUserId,
      telegram_token: user.telegramToken
    };
    
    // Remove undefined/null fields (but keep id, name, email, username, role, project_id as they are required)
    Object.keys(insertData).forEach(key => {
      if (insertData[key] === undefined || (insertData[key] === null && key !== 'parent_id' && key !== 'employee_id' && key !== 'department' && key !== 'sub_department' && key !== 'designation' && key !== 'dob' && key !== 'contact_no' && key !== 'profile_photo' && key !== 'password' && key !== 'telegram_user_id' && key !== 'telegram_token')) {
        delete insertData[key];
      }
    });
    
    const { data, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    
    // Map snake_case back to camelCase
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      parentId: data.parent_id,
      projectId: data.project_id,
      employeeId: data.employee_id,
      department: data.department,
      subDepartment: data.sub_department,
      designation: data.designation,
      dob: data.dob,
      contactNo: data.contact_no,
      profilePhoto: data.profile_photo,
      password: data.password,
      isTwoStepEnabled: data.is_two_step_enabled,
      isEmailVerified: data.is_email_verified,
      telegramUserId: data.telegram_user_id,
      telegramToken: data.telegram_token
    };
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    // Map camelCase to snake_case for Supabase
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
    if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
    if (updates.employeeId !== undefined) updateData.employee_id = updates.employeeId;
    if (updates.department !== undefined) updateData.department = updates.department;
    if (updates.subDepartment !== undefined) updateData.sub_department = updates.subDepartment;
    if (updates.designation !== undefined) updateData.designation = updates.designation;
    if (updates.dob !== undefined) updateData.dob = updates.dob;
    if (updates.contactNo !== undefined) updateData.contact_no = updates.contactNo;
    if (updates.profilePhoto !== undefined) updateData.profile_photo = updates.profilePhoto;
    if (updates.password !== undefined) updateData.password = updates.password;
    if (updates.isTwoStepEnabled !== undefined) updateData.is_two_step_enabled = updates.isTwoStepEnabled;
    if (updates.isEmailVerified !== undefined) updateData.is_email_verified = updates.isEmailVerified;
    if (updates.telegramUserId !== undefined) updateData.telegram_user_id = updates.telegramUserId;
    if (updates.telegramToken !== undefined) updateData.telegram_token = updates.telegramToken;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    // Map snake_case back to camelCase
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      parentId: data.parent_id,
      projectId: data.project_id,
      employeeId: data.employee_id,
      department: data.department,
      subDepartment: data.sub_department,
      designation: data.designation,
      dob: data.dob,
      contactNo: data.contact_no,
      profilePhoto: data.profile_photo,
      password: data.password,
      isTwoStepEnabled: data.is_two_step_enabled,
      isEmailVerified: data.is_email_verified,
      telegramUserId: data.telegram_user_id,
      telegramToken: data.telegram_token
    };
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
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...post,
        project_id: post.projectId,
        user_id: post.userId,
        user_name: post.userName,
        user_username: post.userUsername,
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
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        project_id: notification.projectId,
        user_id: notification.userId,
        link_to: notification.linkTo,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...message,
        project_id: message.projectId,
        sender_id: message.senderId,
        receiver_id: message.receiverId,
        group_id: message.groupId,
        reply_to_id: message.replyToId,
        call_info: message.callInfo,
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
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    if (error) throw error;
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
    const { data, error } = await supabase
      .from('groups')
      .insert({
        ...group,
        project_id: group.projectId,
        created_by: group.createdBy,
        active_call: group.activeCall,
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

// OTP (2-Step Verification) Operations
export const otpService = {
  // Generate and store OTP code for user
  async generateOTP(userId: string): Promise<string> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 5 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    // Delete any existing unused OTPs for this user
    await supabase
      .from('otp_codes')
      .delete()
      .eq('user_id', userId)
      .eq('used', false);
    
    // Insert new OTP
    const { error } = await supabase
      .from('otp_codes')
      .insert({
        user_id: userId,
        code: code,
        expires_at: expiresAt.toISOString(),
        used: false
      });
    
    if (error) throw error;
    
    return code;
  },

  // Verify OTP code
  async verifyOTP(userId: string, code: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', data.id);
    
    return true;
  },

  // Clean up expired OTPs (optional, can be called periodically)
  async cleanupExpiredOTPs(): Promise<void> {
    const { error } = await supabase
      .from('otp_codes')
      .delete()
      .or('expires_at.lt.' + new Date().toISOString() + ',used.eq.true');
    
    if (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }
};

