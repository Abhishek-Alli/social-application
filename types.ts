
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum Role {
  ADMIN = 'admin',
  MANAGEMENT = 'management',
  HOD = 'hod',
  EMPLOYEE = 'employee'
}

export interface Project {
  id: string;
  name: string;
  managerName: string;
  password?: string;
  domain?: string; // Custom domain for emails
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  parentId: string | null;
  projectId?: string; // Scoped to a specific project
  // Professional Details
  employeeId?: string;
  department?: string;
  subDepartment?: string;
  designation?: string;
  // Personal Details
  dob?: string;
  contactNo?: string;
  profilePhoto?: string; // Base64
  // Security
  password?: string;
  isTwoStepEnabled?: boolean;
  isEmailVerified?: boolean;
  // Integration
  telegramUserId?: string;
  telegramToken?: string;
}

export interface Email {
  id: string;
  projectId: string;
  senderId: string;
  senderEmail: string;
  receiverEmail: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
  starred: boolean;
  attachments: MessageAttachment[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  category: string;
  dueDate: string;
  createdAt: string;
  subTasks: SubTask[];
  assignedBy?: string;
  assignedTo?: string;
}

export interface Note {
  id: string;
  projectId: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userUsername: string;
  text: string;
  image?: string;
  video?: string;
  ratio: '3:4' | '16:9' | '1:1';
  likes: string[]; // User IDs
  mentions: string[];
  hashtags: string[];
  comments: Comment[];
  createdAt: string;
}

export interface MessageAttachment {
  name: string;
  data: string; // Base64
  type: string;
}

export interface CallInfo {
  id: string;
  type: 'audio' | 'video';
  status: 'active' | 'ended';
  startedBy: string;
  groupId?: string;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  receiverId?: string; // For DM
  groupId?: string;    // For Group Chat
  text: string;
  attachment?: MessageAttachment;
  callInfo?: CallInfo;
  status?: 'sent' | 'delivered' | 'seen';
  replyToId?: string;  // ID of the message being replied to
  mentions?: string[]; // IDs of mentioned users
  createdAt: string;
}

export interface ComplaintAttachment {
  name: string;
  data: string;
  type: string;
}

export interface Complaint {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: Role;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  attachment?: ComplaintAttachment;
}

export interface Notification {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'complaint' | 'update' | 'call' | 'message' | 'post' | 'group' | 'note' | 'email' | 'like' | 'comment';
  read: boolean;
  createdAt: string;
  linkTo?: ViewType;
}

export interface Group {
  id: string;
  projectId: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[]; // User IDs
  createdAt: string;
  activeCall?: CallInfo;
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  userId: string; // Event creator/owner
  title: string;
  description?: string;
  startDate: string; // ISO datetime
  endDate: string; // ISO datetime
  location?: string;
  attendees?: string[]; // User IDs
  color?: string; // Event color
  allDay?: boolean;
  createdAt: string;
}

export type ViewType = 'tasks' | 'upcoming' | 'notes' | 'analytics' | 'team' | 'profile' | 'complaints' | 'notifications' | 'chat' | 'feed' | 'projects' | 'emails' | 'calendar';
