
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
  image?: string; // Deprecated: use images array instead, kept for backward compatibility
  images?: string[]; // Array of image URLs/data URLs
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
  targetUserId?: string; // ID of the management user this complaint is directed to
}

export interface Notification {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'complaint' | 'update' | 'call' | 'message' | 'post' | 'group' | 'note' | 'email' | 'like' | 'comment' | 'calendar';
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

export interface Survey {
  id: string;
  projectId: string;
  createdBy: string; // User ID of management who created it
  createdByName: string;
  title: string;
  description?: string;
  programName?: string; // Name of the program this survey is for
  eventName?: string; // Name of the event this survey is for
  type: 'program' | 'event' | 'general'; // Type of survey
  status: 'active' | 'closed'; // active = accepting feedback, closed = no longer accepting
  deadline?: string; // Optional deadline for submissions
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[]; // User IDs who voted for this option
}

export interface Poll {
  id: string;
  projectId: string;
  createdBy: string; // User ID of management who created it
  createdByName: string;
  question: string;
  description?: string;
  options: PollOption[]; // Array of poll options
  status: 'active' | 'closed'; // active = accepting votes, closed = no longer accepting
  allowMultipleVotes: boolean; // Whether users can vote multiple times
  showResultsBeforeVoting: boolean; // Whether to show results before user votes
  deadline?: string; // Optional deadline for voting
  createdAt: string;
}

export interface FeedbackFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'date' | 'select' | 'radio' | 'checkbox' | 'rating';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select, radio, checkbox types
  min?: number; // For number, rating
  max?: number; // For number, rating
  rows?: number; // For textarea
}

export interface FeedbackForm {
  id: string;
  projectId: string;
  createdBy: string; // User ID of management who created it
  createdByName: string;
  title: string;
  description?: string;
  fields: FeedbackFormField[]; // Array of form fields
  status: 'active' | 'closed'; // active = accepting responses, closed = no longer accepting
  deadline?: string; // Optional deadline for submissions
  allowMultipleSubmissions: boolean; // Whether users can submit multiple times
  createdAt: string;
}

export interface FeedbackFormResponse {
  id: string;
  formId: string;
  projectId: string;
  userId?: string; // Optional - if user is logged in
  userName?: string;
  userEmail?: string;
  responses: { [fieldId: string]: string | string[] | number }; // Field ID to response value mapping
  submittedAt: string;
}

export interface Feedback {
  id: string;
  projectId: string;
  surveyId?: string; // Optional - link to a specific survey/review
  userId?: string; // Optional - if user is logged in
  userName?: string; // Optional - user's name (if logged in) or provided name
  userEmail?: string; // Optional - user's email (if logged in) or provided email
  subject: string;
  message: string;
  isPrivate: boolean; // true = private, false = open/public
  createdAt: string;
}

export type ViewType = 'tasks' | 'upcoming' | 'notes' | 'analytics' | 'team' | 'profile' | 'complaints' | 'notifications' | 'chat' | 'feed' | 'projects' | 'emails' | 'calendar' | 'feedback';
