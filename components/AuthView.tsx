
import React, { useState, useEffect, useRef } from 'react';
import { Role, User } from '../types';
import { 
  LogIn, ShieldCheck, UserCircle, LogOut, AtSign, Save, 
  UserPlus, Users, ChevronRight, X, Camera, Briefcase, 
  Key, Phone, Mail, Calendar, Hash, Send, Lock, Shield, 
  QrCode, Info, Fingerprint, ShieldAlert, CheckCircle2, Megaphone, Download, Edit, Settings, HelpCircle, Clock, Check, Image as ImageIcon, ZoomIn, ZoomOut, Move, Trash2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AuthViewProps {
  currentUser: User | null;
  onLogin: (username: string, password?: string, code?: string, rememberMe?: boolean) => void;
  onLogout: () => void;
  onUpdateProfile?: (updates: Partial<User>) => void;
  subordinates?: User[];
  onAddSubordinate?: (userData: Partial<User>) => void;
  onRegister?: (userData: Partial<User>) => void;
  needsTwoStep?: boolean;
  userPosts?: any[];
  onDeletePost?: (postId: string) => void;
  projectDomain?: string;
  activeProjectName?: string;
  allUsers?: User[];
  connections?: any[];
  onConnect?: (userId: string) => Promise<void>;
  onAcceptConnection?: (connectionId: string) => Promise<void>;
  onDisconnect?: (connectionId: string) => Promise<void>;
}

export const AuthView: React.FC<AuthViewProps> = ({ 
  currentUser, 
  onLogin, 
  onLogout, 
  onUpdateProfile,
  subordinates = [],
  onAddSubordinate,
  onRegister,
  needsTwoStep = false,
  userPosts = [],
  onDeletePost,
  projectDomain,
  activeProjectName,
  allUsers = [],
  connections = [],
  onConnect,
  onAcceptConnection,
  onDisconnect
}) => {
  // Ensure connections and allUsers are always arrays to prevent errors
  const safeConnections = connections || [];
  const safeAllUsers = allUsers || [];
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [isNew, setIsNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingScreenLock, setIsSettingScreenLock] = useState(false);
  const [screenLockPassword, setScreenLockPassword] = useState('');
  const [confirmScreenLockPassword, setConfirmScreenLockPassword] = useState('');
  const [isIdentityCardOpen, setIsIdentityCardOpen] = useState(false);
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [isEditingBackground, setIsEditingBackground] = useState(false);
  const [backgroundImageScale, setBackgroundImageScale] = useState(1);
  const [backgroundImagePosition, setBackgroundImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editForm, setEditForm] = useState({
    name: '', email: '', username: '', dob: '', department: '', subDepartment: '',
    designation: '', employeeId: '', contactNo: '', profilePhoto: '', bio: '', backgroundImage: ''
  });
  const [form, setForm] = useState({
    name: '', email: '', username: '', dob: '', department: '', subDepartment: '',
    designation: '', employeeId: '', contactNo: '', password: '',
    telegramUserId: '', telegramToken: '', profilePhoto: ''
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const editBackgroundInputRef = useRef<HTMLInputElement>(null);
  const identityCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      setEditUsername(currentUser.username || '');
      setEditForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        username: currentUser.username || '',
        dob: currentUser.dob || '',
        department: currentUser.department || '',
        subDepartment: currentUser.subDepartment || '',
        designation: currentUser.designation || '',
        employeeId: currentUser.employeeId || '',
        contactNo: currentUser.contactNo || '',
        profilePhoto: currentUser.profilePhoto || '',
        bio: currentUser.bio || '',
        backgroundImage: currentUser.backgroundImage || ''
      });
    } else {
      // Load saved credentials if user is not logged in
      const savedCredentials = localStorage.getItem('srj_saved_credentials');
      if (savedCredentials) {
        try {
          const creds = JSON.parse(savedCredentials);
          setLoginUsername(creds.username || '');
          setLoginPassword(creds.password || '');
          setRememberMe(true);
        } catch (error) {
          console.error('Failed to load saved credentials:', error);
        }
      }
    }
  }, [currentUser]);

  const handleUpdate = () => {
    if (onUpdateProfile && editUsername) {
      onUpdateProfile({ username: editUsername.replace('@', '').toLowerCase() });
      setIsEditing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile || !currentUser) return;

    // Validate passwords
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Please fill in all password fields.');
      return;
    }

    // Verify current password
    if (currentUser.password && currentUser.password !== passwordForm.currentPassword.trim()) {
      alert('Current password is incorrect.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters long.');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      alert('New password must be different from current password.');
      return;
    }

    try {
      await onUpdateProfile({ password: passwordForm.newPassword.trim() });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password. Please try again.');
    }
  };

  const toggleTwoStep = () => {
    if (onUpdateProfile && currentUser) {
      onUpdateProfile({ isTwoStepEnabled: !currentUser.isTwoStepEnabled });
    }
  };

  const verifyEmail = () => {
    if (onUpdateProfile && currentUser) {
      // Simulate verification process
      const code = prompt("A verification code was sent to " + currentUser.email + ". Enter code:");
      if (code === "1234") {
        onUpdateProfile({ isEmailVerified: true });
        alert("Email verified successfully!");
      } else {
        alert("Invalid verification code.");
      }
    }
  };

  const getTargetRole = (): Role | null => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case Role.ADMIN: return Role.MANAGEMENT;
      case Role.MANAGEMENT: return Role.HOD;
      case Role.HOD: return Role.EMPLOYEE;
      default: return null;
    }
  };

  const targetRole = getTargetRole();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, profilePhoto: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm(prev => ({ ...prev, profilePhoto: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm(prev => ({ ...prev, backgroundImage: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const downloadIdentityCard = async () => {
    if (!identityCardRef.current || !currentUser) return;
    
    setIsDownloading(true);
    try {
      // Store original styles
      const originalWidth = identityCardRef.current.style.width;
      const originalHeight = identityCardRef.current.style.height;
      const originalMaxWidth = identityCardRef.current.style.maxWidth;
      const originalTransform = identityCardRef.current.style.transform;
      
      // Set fixed dimensions for PDF generation to prevent overlap
      const fixedWidth = 280; // Match the card width
      identityCardRef.current.style.width = `${fixedWidth}px`;
      identityCardRef.current.style.maxWidth = `${fixedWidth}px`;
      identityCardRef.current.style.height = 'auto';
      identityCardRef.current.style.transform = 'none';
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get actual height after width is set
      const actualHeight = identityCardRef.current.scrollHeight || 500;
      
      // Capture the identity card as a canvas with better options
      const canvas = await html2canvas(identityCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 3, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: fixedWidth,
        height: actualHeight,
        windowWidth: fixedWidth,
        windowHeight: actualHeight
      });
      
      // Restore original styles
      identityCardRef.current.style.width = originalWidth;
      identityCardRef.current.style.maxWidth = originalMaxWidth;
      identityCardRef.current.style.height = originalHeight;
      identityCardRef.current.style.transform = originalTransform;
      
      // Get image data
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calculate dimensions for PDF (maintaining aspect ratio)
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const aspectRatio = imgHeight / imgWidth;
      
      // PDF dimensions in mm (standard ID card size: 85.6mm x 53.98mm, but we'll use portrait)
      const pdfWidth = 85.6; // Standard ID card width in mm
      const pdfHeight = pdfWidth * aspectRatio;
      
      // Create PDF with proper dimensions
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      // Add image to PDF with proper scaling
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      // Save PDF
      pdf.save(`${currentUser.name || 'Identity'}_ID_Card.pdf`);
    } catch (error) {
      console.error('Failed to download identity card:', error);
      alert('Failed to download identity card. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile || !currentUser) return;
    
    try {
      await onUpdateProfile({
        name: editForm.name,
        email: editForm.email,
        username: editForm.username.toLowerCase().replace(/\s/g, '_'),
        dob: editForm.dob,
        department: editForm.department,
        subDepartment: editForm.subDepartment,
        designation: editForm.designation,
        employeeId: editForm.employeeId,
        contactNo: editForm.contactNo,
        profilePhoto: editForm.profilePhoto,
        bio: editForm.bio,
        backgroundImage: editForm.backgroundImage
      });
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const resetForm = () => {
    setForm({
      name: '', email: '', username: '', dob: '', department: '', subDepartment: '',
      designation: '', employeeId: '', contactNo: '', password: '',
      telegramUserId: '', telegramToken: '', profilePhoto: ''
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.username || !targetRole || !onAddSubordinate) return;
    onAddSubordinate({
      ...form,
      role: targetRole,
      username: form.username.toLowerCase().replace(/\s/g, '_')
    });
    resetForm();
    setIsAddingSub(false);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.username || !form.password || !onRegister) return;
    onRegister({
      ...form,
      role: Role.EMPLOYEE,
      username: form.username.toLowerCase().replace(/\s/g, '_')
    });
    setIsNew(false);
    resetForm();
  };

  if (currentUser) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 animate-in fade-in duration-500">
        {/* LinkedIn-style Profile Header */}
        <div className="relative w-full">
          {/* Banner/Cover Image */}
          <div className="w-full h-32 bg-gradient-to-r from-orange-500 to-orange-600 relative overflow-hidden">
            {currentUser.backgroundImage ? (
              <img 
                src={currentUser.backgroundImage} 
                alt="Background" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-orange-600/80 to-orange-700/80"></div>
            )}
          </div>

          {/* Profile Picture - Overlapping Banner */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-12">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
                {currentUser.profilePhoto ? (
                  <img src={currentUser.profilePhoto} className="w-full h-full object-cover" alt={currentUser.name} />
                ) : (
                  <UserCircle size={80} className="text-slate-300" />
                )}
              </div>
              <div className={`absolute bottom-0 right-0 w-7 h-7 border-4 border-white rounded-full flex items-center justify-center ${currentUser.isEmailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                <Check className="text-white" size={12} />
              </div>
            </div>
          </div>

          {/* Profile Actions - Top Right */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="p-2 bg-white/90 backdrop-blur-sm text-slate-700 rounded-lg hover:bg-white transition-all shadow-sm"
              title="Edit Profile"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-white/90 backdrop-blur-sm text-slate-700 rounded-lg hover:bg-white transition-all shadow-sm"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 px-4 pb-6 pt-16 max-w-2xl mx-auto w-full">
          {/* Name and Title Section */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-black text-slate-900 mb-1">{currentUser.name}</h1>
            <p className="text-sm font-bold text-slate-700 mb-1">{currentUser.designation || 'Team Member'}</p>
            <p className="text-xs text-slate-600 mb-1">{currentUser.department || 'Operations'}</p>
            {currentUser.contactNo && (
              <p className="text-xs text-slate-500">{currentUser.contactNo}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              {(() => {
                const userConnections = safeConnections.filter((c: any) => 
                  c.status === 'accepted' && 
                  (c.userId === currentUser?.id || c.connectedUserId === currentUser?.id)
                );
                const connectionCount = [...new Set(userConnections.map((c: any) => 
                  c.userId === currentUser?.id ? c.connectedUserId : c.userId
                ))].length;
                return (
                  <span 
                    className="text-xs text-slate-500 cursor-pointer hover:text-orange-600 transition-colors"
                    onClick={() => {
                      if (connectionCount > 0) {
                        setViewingUserProfile(currentUser);
                        setShowConnectionsModal(true);
                      }
                    }}
                  >
                    {connectionCount} {connectionCount === 1 ? 'Connection' : 'Connections'}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">About</h2>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="p-1 hover:bg-slate-100 rounded transition-all"
              >
                <Edit size={14} className="text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentUser.bio && currentUser.bio.trim() ? currentUser.bio : `Hi, I'm ${currentUser.name}, ${currentUser.designation ? `a ${currentUser.designation}` : 'a team member'} at ${currentUser.department || 'SRJ World of Steel'}. ${currentUser.email ? `Contact me at ${currentUser.email}` : ''}`}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold">Employee ID</span>
                <p className="text-slate-800 font-bold mt-0.5">{currentUser.employeeId || 'SRJ-NODE'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold">Department</span>
                <p className="text-slate-800 font-bold mt-0.5">{currentUser.department || 'Operations'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold">Username</span>
                <p className="text-orange-600 font-bold mt-0.5">@{currentUser.username}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold">Status</span>
                <p className={`font-bold mt-0.5 ${currentUser.isEmailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {currentUser.isEmailVerified ? 'Verified' : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          {/* User Suggestions Section */}
          {(() => {
            if (safeAllUsers.length <= 1) return null;
            
            // Get list of user IDs that are already connected (accepted connections only)
            const connectedUserIds = new Set(
              safeConnections
                .filter((c: any) => c.status === 'accepted')
                .map((c: any) => 
                  c.userId === currentUser?.id ? c.connectedUserId : 
                  c.connectedUserId === currentUser?.id ? c.userId : null
                )
                .filter((id: any) => id !== null)
            );
            
            // Filter out current user and already connected users
            const suggestions = Array.from(new Map(safeAllUsers
              .filter(user => 
                user.id !== currentUser?.id && 
                !connectedUserIds.has(user.id)
              )
              .map(user => [user.id, user])
            ).values()).slice(0, 5);
            
            if (suggestions.length === 0) return null;
            
            return (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">People You May Know</h2>
                <div className="space-y-2">
                  {suggestions.map(user => (
                    <div 
                      key={user.id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <div 
                        onClick={() => setViewingUserProfile(user)}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                          {user.profilePhoto ? (
                            <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserCircle size={24} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                          {user.designation && (
                            <p className="text-xs text-slate-500 truncate">{user.designation}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (onConnect) {
                              await onConnect(user.id);
                            }
                          }}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          title="Connect"
                        >
                          <UserPlus size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Logout Button */}
          <div className="mt-6 mb-4">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to log out?')) {
                  onLogout();
                }
              }}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* User Profile View Modal */}
        {viewingUserProfile && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setViewingUserProfile(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Profile</h3>
                <button
                  onClick={() => setViewingUserProfile(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-6">
                {/* Profile Header */}
                <div className="text-center mb-6">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center mx-auto">
                      {viewingUserProfile.profilePhoto ? (
                        <img src={viewingUserProfile.profilePhoto} alt={viewingUserProfile.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={80} className="text-slate-300" />
                      )}
                    </div>
                    {viewingUserProfile.isEmailVerified && (
                      <div className="absolute bottom-0 right-[calc(50%-48px)] w-7 h-7 border-4 border-white rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="text-white" size={14} />
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{viewingUserProfile.name}</h2>
                  <p className="text-sm font-bold text-slate-700 mb-1">{viewingUserProfile.designation || 'Team Member'}</p>
                  <p className="text-xs text-slate-600">{viewingUserProfile.department || 'Operations'}</p>
                  
                  {/* Connections Count */}
                  {(() => {
                    const userConnections = safeConnections.filter((c: any) => 
                      c.status === 'accepted' && 
                      (c.userId === viewingUserProfile.id || c.connectedUserId === viewingUserProfile.id)
                    );
                    const connectedUserIds = [...new Set(userConnections.map((c: any) => 
                      c.userId === viewingUserProfile.id ? c.connectedUserId : c.userId
                    ))];
                    
                    return (
                      <button
                        onClick={() => setShowConnectionsModal(true)}
                        className="mt-3 text-xs text-slate-600 hover:text-orange-600 font-bold transition-colors"
                      >
                        {connectedUserIds.length} {connectedUserIds.length === 1 ? 'Connection' : 'Connections'}
                      </button>
                    );
                  })()}
                </div>

                {/* Common Connections */}
                {(() => {
                  if (!currentUser) return null;
                  
                  const currentUserConnections = safeConnections.filter((c: any) => 
                    c.status === 'accepted' && 
                    (c.userId === currentUser.id || c.connectedUserId === currentUser.id)
                  );
                  const currentUserConnectedIds = [...new Set(currentUserConnections.map((c: any) => 
                    c.userId === currentUser.id ? c.connectedUserId : c.userId
                  ))];
                  
                  const viewedUserConnections = safeConnections.filter((c: any) => 
                    c.status === 'accepted' && 
                    (c.userId === viewingUserProfile.id || c.connectedUserId === viewingUserProfile.id)
                  );
                  const viewedUserConnectedIds = [...new Set(viewedUserConnections.map((c: any) => 
                    c.userId === viewingUserProfile.id ? c.connectedUserId : c.userId
                  ))];
                  
                  const commonConnectionIds = [...new Set(currentUserConnectedIds.filter(id => 
                    viewedUserConnectedIds.includes(id)
                  ))];
                  
                  if (commonConnectionIds.length === 0) return null;
                  
                  // Use a Map to ensure unique users by ID
                  const commonConnectionsMap = new Map();
                  safeAllUsers.forEach(u => {
                    if (commonConnectionIds.includes(u.id) && !commonConnectionsMap.has(u.id)) {
                      commonConnectionsMap.set(u.id, u);
                    }
                  });
                  const commonConnections = Array.from(commonConnectionsMap.values());
                  
                  return (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Common Connections</h3>
                      <div className="space-y-2">
                        {commonConnections.slice(0, 5).map(user => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setViewingUserProfile(user);
                            }}
                            className="flex items-center gap-2 p-2 hover:bg-white rounded-lg transition-all cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                              {user.profilePhoto ? (
                                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <UserCircle size={20} className="text-slate-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                              {user.designation && (
                                <p className="text-[10px] text-slate-500 truncate">{user.designation}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {commonConnections.length > 5 && (
                          <p className="text-[10px] text-slate-500 text-center pt-2">
                            +{commonConnections.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Profile Details */}
                <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Employee ID</span>
                      <p className="text-slate-800 font-bold">{viewingUserProfile.employeeId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Department</span>
                      <p className="text-slate-800 font-bold">{viewingUserProfile.department || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Username</span>
                      <p className="text-orange-600 font-bold">@{viewingUserProfile.username}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Email</span>
                      <p className="text-slate-800 font-bold text-[10px] truncate">{viewingUserProfile.email}</p>
                    </div>
                  </div>
                </div>

                {/* Connection Button */}
                {(() => {
                  const connection = safeConnections.find((c: any) => 
                    (c.userId === currentUser?.id && c.connectedUserId === viewingUserProfile.id) ||
                    (c.userId === viewingUserProfile.id && c.connectedUserId === currentUser?.id)
                  );
                  
                  if (!connection) {
                    return (
                      <button
                        onClick={async () => {
                          if (onConnect) {
                            await onConnect(viewingUserProfile.id);
                            setViewingUserProfile(null);
                          }
                        }}
                        className="w-full py-2.5 bg-orange-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-orange-700"
                      >
                        <UserPlus size={14} /> Connect
                      </button>
                    );
                  } else if (connection.status === 'pending') {
                    if (connection.userId === currentUser?.id) {
                      return (
                        <button
                          disabled
                          className="w-full py-2.5 bg-slate-300 text-slate-600 text-xs font-bold uppercase tracking-wide rounded-xl"
                        >
                          Connection Pending
                        </button>
                      );
                    } else {
                      return (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (onAcceptConnection) {
                                await onAcceptConnection(connection.id);
                                setViewingUserProfile(null);
                              }
                            }}
                            className="flex-1 py-2.5 bg-orange-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-orange-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={async () => {
                              if (onDisconnect) {
                                await onDisconnect(connection.id);
                                setViewingUserProfile(null);
                              }
                            }}
                            className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide rounded-xl active:scale-95 transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      );
                    }
                  } else if (connection.status === 'accepted') {
                    return (
                      <div className="flex gap-2">
                        <button
                          disabled
                          className="flex-1 py-2.5 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide rounded-xl"
                        >
                          <CheckCircle2 size={14} className="inline mr-2" /> Connected
                        </button>
                        <button
                          onClick={async () => {
                            if (onDisconnect && window.confirm('Remove connection with ' + viewingUserProfile.name + '?')) {
                              await onDisconnect(connection.id);
                              setViewingUserProfile(null);
                            }
                          }}
                          className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide rounded-xl active:scale-95 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Background Image Editor Modal */}
        {isEditingBackground && editForm.backgroundImage && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setIsEditingBackground(false)}
          >
            <div 
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={20} className="text-orange-600" /> Edit Background Image
                </h3>
                <button
                  onClick={() => setIsEditingBackground(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-xs text-slate-600 mb-2">Drag the image to position it, use zoom controls to adjust size</p>
                  
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setBackgroundImageScale(prev => Math.max(0.5, prev - 0.1))}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                      title="Zoom Out"
                    >
                      <ZoomOut size={18} className="text-slate-700" />
                    </button>
                    <span className="text-xs font-bold text-slate-700 min-w-[60px] text-center">
                      {Math.round(backgroundImageScale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setBackgroundImageScale(prev => Math.min(3, prev + 0.1))}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                      title="Zoom In"
                    >
                      <ZoomIn size={18} className="text-slate-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBackgroundImageScale(1);
                        setBackgroundImagePosition({ x: 0, y: 0 });
                      }}
                      className="ml-auto px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all text-xs font-bold text-slate-700"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Image Preview Container */}
                  <div 
                    className="w-full h-64 bg-slate-100 rounded-xl overflow-hidden relative border-2 border-slate-200"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    onMouseDown={(e) => {
                      if (e.button === 0) {
                        setIsDragging(true);
                        setDragStart({
                          x: e.clientX - backgroundImagePosition.x,
                          y: e.clientY - backgroundImagePosition.y
                        });
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isDragging) {
                        setBackgroundImagePosition({
                          x: e.clientX - dragStart.x,
                          y: e.clientY - dragStart.y
                        });
                      }
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  >
                    <img 
                      src={editForm.backgroundImage} 
                      alt="Background Preview"
                      className="absolute pointer-events-none select-none"
                      style={{
                        width: `${100 * backgroundImageScale}%`,
                        height: `${100 * backgroundImageScale}%`,
                        transform: `translate(calc(-50% + ${backgroundImagePosition.x}px), calc(-50% + ${backgroundImagePosition.y}px))`,
                        top: '50%',
                        left: '50%',
                        objectFit: 'cover'
                      }}
                      draggable={false}
                    />
                    {!isDragging && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-xs text-slate-400 font-bold bg-white/80 px-3 py-1 rounded-full">
                          <Move size={14} className="inline mr-1" /> Drag to position
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingBackground(false);
                      setBackgroundImageScale(1);
                      setBackgroundImagePosition({ x: 0, y: 0 });
                    }}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      // Create a canvas to crop and save the positioned/scaled image
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;

                      const img = new Image();
                      img.crossOrigin = 'anonymous';
                      img.onload = () => {
                        // Container dimensions (h-64 = 256px, but we'll use a standard banner size)
                        const containerWidth = 1200; // Standard banner width
                        const containerHeight = 300; // Standard banner height (4:1 ratio)
                        
                        // Set canvas to container size
                        canvas.width = containerWidth;
                        canvas.height = containerHeight;

                        // Calculate the actual image dimensions after scaling
                        const scaledWidth = img.width * backgroundImageScale;
                        const scaledHeight = img.height * backgroundImageScale;

                        // Calculate source rectangle (what part of the image to show)
                        // Position is relative to container center
                        const containerCenterX = containerWidth / 2;
                        const containerCenterY = containerHeight / 2;
                        
                        // Calculate the offset from center based on drag position
                        // Convert pixel position to image coordinates
                        const scaleFactor = Math.min(containerWidth / scaledWidth, containerHeight / scaledHeight);
                        const offsetX = (backgroundImagePosition.x / scaleFactor);
                        const offsetY = (backgroundImagePosition.y / scaleFactor);

                        // Calculate source position (center of image minus offset)
                        const sourceX = (img.width / 2) - (containerWidth / 2 / backgroundImageScale) - offsetX;
                        const sourceY = (img.height / 2) - (containerHeight / 2 / backgroundImageScale) - offsetY;

                        // Draw the image with proper cropping
                        ctx.drawImage(
                          img,
                          sourceX,
                          sourceY,
                          containerWidth / backgroundImageScale,
                          containerHeight / backgroundImageScale,
                          0,
                          0,
                          containerWidth,
                          containerHeight
                        );

                        // Convert to base64 and update form
                        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
                        setEditForm(prev => ({ ...prev, backgroundImage: croppedImage }));
                        setIsEditingBackground(false);
                        setBackgroundImageScale(1);
                        setBackgroundImagePosition({ x: 0, y: 0 });
                      };
                      img.onerror = () => {
                        console.error('Failed to load image');
                        alert('Failed to process image. Please try again.');
                      };
                      img.src = editForm.backgroundImage;
                    }}
                    className="flex-1 py-2 bg-orange-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-orange-700"
                  >
                    <Save size={14} /> Save Position
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connections List Modal */}
        {showConnectionsModal && viewingUserProfile && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setShowConnectionsModal(false)}
          >
            <div 
              className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto no-scrollbar animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">
                  {viewingUserProfile.name}'s Connections
                </h3>
                <button
                  onClick={() => setShowConnectionsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-4">
                {(() => {
                  const userConnections = safeConnections.filter((c: any) => 
                    c.status === 'accepted' && 
                    (c.userId === viewingUserProfile.id || c.connectedUserId === viewingUserProfile.id)
                  );
                  const connectedUserIds = [...new Set(userConnections.map((c: any) => 
                    c.userId === viewingUserProfile.id ? c.connectedUserId : c.userId
                  ))];
                  
                  // Use a Map to ensure unique users by ID
                  const connectedUsersMap = new Map();
                  safeAllUsers.forEach(u => {
                    if (connectedUserIds.includes(u.id) && !connectedUsersMap.has(u.id)) {
                      connectedUsersMap.set(u.id, u);
                    }
                  });
                  const connectedUsers = Array.from(connectedUsersMap.values());
                  
                  if (connectedUsers.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Users size={48} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 font-bold">No connections yet</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-2">
                      {connectedUsers.map(user => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setViewingUserProfile(user);
                            setShowConnectionsModal(false);
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border border-slate-100"
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
                            {user.designation && (
                              <p className="text-xs text-slate-500 truncate">{user.designation}</p>
                            )}
                            {user.department && (
                              <p className="text-xs text-slate-400 truncate">{user.department}</p>
                            )}
                          </div>
                          <ChevronRight size={18} className="text-slate-300" />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Edit Profile</h3>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleEditProfileSubmit} className="p-6 space-y-6">
                {/* Background Image */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-400" /> Background Image
                  </label>
                  <div className="space-y-2">
                    <div 
                      onClick={() => {
                        if (editForm.backgroundImage) {
                          setIsEditingBackground(true);
                          setBackgroundImageScale(1);
                          setBackgroundImagePosition({ x: 0, y: 0 });
                        } else {
                          editBackgroundInputRef.current?.click();
                        }
                      }}
                      className="w-full h-32 bg-slate-50 border-2 border-dashed border-orange-200 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden group relative"
                    >
                      {editForm.backgroundImage ? (
                        <img src={editForm.backgroundImage} className="w-full h-full object-cover" alt="Background" />
                      ) : (
                        <div className="text-center">
                          <ImageIcon size={32} className="text-orange-300 group-hover:text-orange-500 mx-auto mb-2" />
                          <span className="text-xs text-slate-400 font-bold">Click to upload background image</span>
                        </div>
                      )}
                      {editForm.backgroundImage && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                          <Edit size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                    {editForm.backgroundImage && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingBackground(true);
                            setBackgroundImageScale(1);
                            setBackgroundImagePosition({ x: 0, y: 0 });
                          }}
                          className="flex-1 py-2 bg-orange-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm({...editForm, backgroundImage: ''});
                          }}
                          className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={editBackgroundInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditForm(prev => ({ ...prev, backgroundImage: reader.result as string }));
                          setIsEditingBackground(true);
                          setBackgroundImageScale(1);
                          setBackgroundImagePosition({ x: 0, y: 0 });
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </div>

                {/* Profile Photo */}
                <div className="text-center">
                  <div 
                    onClick={() => editPhotoInputRef.current?.click()}
                    className="w-24 h-24 bg-slate-50 border-2 border-dashed border-orange-200 rounded-full mx-auto mb-2 flex items-center justify-center cursor-pointer overflow-hidden group"
                  >
                    {editForm.profilePhoto ? (
                      <img src={editForm.profilePhoto} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <Camera size={32} className="text-orange-300 group-hover:text-orange-500" />
                    )}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Photo</span>
                  <input 
                    type="file" 
                    ref={editPhotoInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleEditPhotoUpload} 
                  />
                </div>

                <div className="space-y-4">
                  <SectionTitle title="Personal Details" icon={<UserCircle size={14}/>} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="Full Name" 
                      value={editForm.name} 
                      onChange={(v: string) => setEditForm({...editForm, name: v})} 
                      required 
                    />
                    <Input 
                      placeholder="Username" 
                      value={editForm.username} 
                      onChange={(v: string) => setEditForm({...editForm, username: v})} 
                      icon={<AtSign size={14}/>} 
                      required 
                    />
                    <Input 
                      type="date" 
                      label="Date of Birth" 
                      value={editForm.dob} 
                      onChange={(v: string) => setEditForm({...editForm, dob: v})} 
                    />
                    <Input 
                      placeholder="Contact No" 
                      value={editForm.contactNo} 
                      onChange={(v: string) => setEditForm({...editForm, contactNo: v})} 
                      icon={<Phone size={14}/>} 
                    />
                    <Input 
                      type="email" 
                      placeholder="Email" 
                      value={editForm.email} 
                      onChange={(v: string) => setEditForm({...editForm, email: v})} 
                      icon={<Mail size={14}/>} 
                      required 
                      className="col-span-2" 
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Bio</label>
                    <textarea
                      placeholder="Tell us about yourself..."
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      rows={4}
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs font-bold transition-all resize-none"
                    />
                  </div>

                  <SectionTitle title="Professional Details" icon={<Briefcase size={14}/>} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="Employee ID" 
                      value={editForm.employeeId} 
                      onChange={(v: string) => setEditForm({...editForm, employeeId: v})} 
                      icon={<Hash size={14}/>} 
                    />
                    <Input 
                      placeholder="Designation" 
                      value={editForm.designation} 
                      onChange={(v: string) => setEditForm({...editForm, designation: v})} 
                    />
                    <Input 
                      placeholder="Department" 
                      value={editForm.department} 
                      onChange={(v: string) => setEditForm({...editForm, department: v})} 
                    />
                    <Input 
                      placeholder="Sub-Department" 
                      value={editForm.subDepartment} 
                      onChange={(v: string) => setEditForm({...editForm, subDepartment: v})} 
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2 bg-orange-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => {
              setIsSettingsOpen(false);
              setIsChangingPassword(false);
              setIsIdentityCardOpen(false);
            }}
          >
            <div 
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Settings size={20} className="text-orange-600" /> Settings
                </h3>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsChangingPassword(false);
                    setIsIdentityCardOpen(false);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Screen Lock Password Section */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Lock size={20} className="text-orange-600" />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Screen Lock</h3>
                    </div>
                    <button
                      onClick={() => {
                        setIsSettingScreenLock(!isSettingScreenLock);
                        setScreenLockPassword('');
                        setConfirmScreenLockPassword('');
                      }}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      {isSettingScreenLock ? 'Cancel' : currentUser.screenLockPassword ? 'Change' : 'Set'}
                    </button>
                  </div>

                  {isSettingScreenLock && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!screenLockPassword.trim()) {
                        alert('Please enter a screen lock password');
                        return;
                      }
                      if (screenLockPassword !== confirmScreenLockPassword) {
                        alert('Screen lock passwords do not match');
                        return;
                      }
                      if (screenLockPassword.length < 4) {
                        alert('Screen lock password must be at least 4 characters');
                        return;
                      }
                      try {
                        await onUpdateProfile?.({ screenLockPassword });
                        alert('Screen lock password set successfully!');
                        setIsSettingScreenLock(false);
                        setScreenLockPassword('');
                        setConfirmScreenLockPassword('');
                      } catch (error) {
                        console.error('Failed to set screen lock password:', error);
                        alert('Failed to set screen lock password. Please try again.');
                      }
                    }} className="space-y-3 animate-in slide-in-from-top-2">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Screen Lock Password</label>
                        <input
                          type="password"
                          value={screenLockPassword}
                          onChange={(e) => setScreenLockPassword(e.target.value)}
                          className="w-full p-3 bg-white rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                          placeholder="Enter screen lock password (min 4 characters)"
                          minLength={4}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Confirm Screen Lock Password</label>
                        <input
                          type="password"
                          value={confirmScreenLockPassword}
                          onChange={(e) => setConfirmScreenLockPassword(e.target.value)}
                          className="w-full p-3 bg-white rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                          placeholder="Confirm screen lock password"
                          minLength={4}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-orange-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Lock size={14} /> {currentUser.screenLockPassword ? 'Update Screen Lock' : 'Set Screen Lock'}
                      </button>
                      {currentUser.screenLockPassword && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to remove the screen lock? You will need to log in again next time.')) {
                              try {
                                await onUpdateProfile?.({ screenLockPassword: '' });
                                alert('Screen lock removed successfully!');
                                setIsSettingScreenLock(false);
                                setScreenLockPassword('');
                                setConfirmScreenLockPassword('');
                              } catch (error) {
                                console.error('Failed to remove screen lock:', error);
                                alert('Failed to remove screen lock. Please try again.');
                              }
                            }
                          }}
                          className="w-full py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-slate-300 transition-all"
                        >
                          Remove Screen Lock
                        </button>
                      )}
                    </form>
                  )}

                  {!isSettingScreenLock && (
                    <p className="text-xs text-slate-500">
                      {currentUser.screenLockPassword 
                        ? 'Screen lock is enabled. Your app will be locked when reopened.'
                        : 'Set a screen lock password to secure your app when it reopens.'}
                    </p>
                  )}
                </div>

                {/* Change Password Section */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Key size={20} className="text-orange-600" />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Change Password</h3>
                    </div>
                    <button
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      {isChangingPassword ? 'Cancel' : 'Change'}
                    </button>
                  </div>

                  {isChangingPassword && (
                    <form onSubmit={handleChangePassword} className="space-y-3 animate-in slide-in-from-top-2">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Current Password</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          className="w-full p-3 bg-white rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                          placeholder="Enter current password"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">New Password</label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          className="w-full p-3 bg-white rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                          placeholder="Enter new password (min 6 characters)"
                          minLength={6}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          className="w-full p-3 bg-white rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                          placeholder="Confirm new password"
                          minLength={6}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-orange-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Lock size={14} /> Update Password
                      </button>
                    </form>
                  )}
                </div>

                {/* Project Information */}
                {activeProjectName && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase size={20} className="text-orange-600" />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Project</h3>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{activeProjectName}</p>
                  </div>
                )}

                {/* Security Settings */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-200">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={20} className="text-orange-600" /> Security
                    </h3>
                  </div>
                  
                  {/* 2-Step Verification */}
                  <div className="p-4 flex items-center justify-between hover:bg-white transition-all cursor-pointer" onClick={toggleTwoStep}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                        <Fingerprint size={20} />
                      </div>
                      <div>
                        <span className="block text-sm font-black text-slate-900 uppercase tracking-widest">2-Step Verification</span>
                        <span className="block text-xs font-bold text-slate-400 uppercase">Extra layer of security</span>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all ${currentUser.isTwoStepEnabled ? 'bg-orange-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${currentUser.isTwoStepEnabled ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </div>

                  {/* Verify Email */}
                  <div className="p-4 flex items-center justify-between hover:bg-white transition-all cursor-pointer border-t border-slate-200" onClick={verifyEmail}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentUser.isEmailVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <span className="block text-sm font-black text-slate-900 uppercase tracking-widest">Verify Email</span>
                        <span className={`block text-xs font-bold uppercase ${currentUser.isEmailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {currentUser.isEmailVerified ? 'Verified' : 'Action Required'}
                        </span>
                      </div>
                    </div>
                    {currentUser.isEmailVerified ? (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-300" />
                    )}
                  </div>
                </div>

                {/* Identity Card Section */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-200">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <UserCircle size={20} className="text-orange-600" /> Identity Card
                    </h3>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-slate-700">Digital Identity Card</span>
                        <button
                          onClick={() => setIsIdentityCardOpen(!isIdentityCardOpen)}
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                        >
                          {isIdentityCardOpen ? 'Hide' : 'View'}
                        </button>
                      </div>
                      
                      {isIdentityCardOpen && (
                        <div className="space-y-3 animate-in slide-in-from-top-2">
                          <div className="relative mx-auto w-full max-w-[280px]">
                            <div 
                              ref={identityCardRef}
                              className="relative mx-auto w-full max-w-[280px] bg-white rounded-[2rem] shadow-xl border-4 border-orange-600 overflow-hidden flex flex-col"
                              style={{ width: '250px' }}
                            >
                              <div className="flex-1 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center pt-6 px-5 pb-10 text-center" style={{ minHeight: '500px' }}>
                                <div className="text-lg font-black text-slate-900 mb-4" style={{ lineHeight: '1.2', fontFamily: "'Leckerli One', cursive" }}>SRJ SOCIAL</div>
                                <div className="relative mb-3">
                                  <div className="w-24 h-24 rounded-full border-[4px] border-orange-600 shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center" style={{ flexShrink: 0 }}>
                                    {currentUser.profilePhoto ? (
                                      <img src={currentUser.profilePhoto} className="w-full h-full object-cover" alt="Identity" style={{ display: 'block' }} />
                                    ) : (
                                      <UserCircle size={56} className="text-slate-300" />
                                    )}
                                  </div>
                                  <div className={`absolute bottom-0 right-0 w-5 h-5 border-[3px] border-white rounded-full flex items-center justify-center ${currentUser.isEmailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ flexShrink: 0 }}>
                                    <Check className="text-white" size={8} />
                                  </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1" style={{ lineHeight: '1.3', wordWrap: 'break-word', maxWidth: '100%' }}>{currentUser.name}</h3>
                                <div className="bg-orange-600/10 px-2.5 py-0.5 rounded-full inline-block mb-4" style={{ lineHeight: '1.2' }}>
                                  <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">{currentUser.designation || 'Specialist'}</span>
                                </div>

                                <div className="w-full grid grid-cols-2 gap-y-3 gap-x-4 text-left border-t border-slate-100 pt-4 pb-4" style={{ marginTop: 'auto' }}>
                                  <div className="space-y-0.5" style={{ minHeight: '30px' }}>
                                    <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest" style={{ lineHeight: '1.2' }}>Employee ID</span>
                                    <span className="block text-[9px] font-bold text-slate-800 uppercase tracking-tight" style={{ lineHeight: '1.3', wordWrap: 'break-word' }}>{currentUser.employeeId || 'SRJ-NODE'}</span>
                                  </div>
                                  <div className="space-y-0.5" style={{ minHeight: '30px' }}>
                                    <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest" style={{ lineHeight: '1.2' }}>Department</span>
                                    <span className="block text-[9px] font-bold text-slate-800 uppercase tracking-tight" style={{ lineHeight: '1.3', wordWrap: 'break-word' }}>{currentUser.department || 'Operations'}</span>
                                  </div>
                                  <div className="space-y-0.5" style={{ minHeight: '30px' }}>
                                    <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest" style={{ lineHeight: '1.2' }}>Verification</span>
                                    <span className={`block text-[9px] font-bold uppercase tracking-tight ${currentUser.isEmailVerified ? 'text-emerald-600' : 'text-amber-600'}`} style={{ lineHeight: '1.3' }}>
                                      {currentUser.isEmailVerified ? 'Verified' : 'Pending'}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5" style={{ minHeight: '30px' }}>
                                    <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest" style={{ lineHeight: '1.2' }}>Username</span>
                                    <span className="block text-[9px] font-bold text-orange-600 uppercase tracking-tight" style={{ lineHeight: '1.3', wordWrap: 'break-word' }}>@{currentUser.username}</span>
                                  </div>
                                  <div className="col-span-2 space-y-0.5" style={{ minHeight: '30px' }}>
                                    <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest" style={{ lineHeight: '1.2' }}>Work Email</span>
                                    <span className="block text-[9px] font-bold text-slate-800" style={{ lineHeight: '1.3', wordWrap: 'break-word' }}>{currentUser.email}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={downloadIdentityCard}
                            disabled={isDownloading}
                            className="w-full py-2 bg-orange-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-orange-700 disabled:opacity-50"
                          >
                            <Download size={14} /> {isDownloading ? 'Downloading...' : 'Download as PDF'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Help and Support */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-200">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <HelpCircle size={20} className="text-orange-600" /> Help & Support
                    </h3>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-start gap-3">
                        <Info size={18} className="text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Need Help?</h4>
                          <p className="text-xs text-slate-600 mb-3">
                            If you're experiencing issues or have questions, please contact your administrator or support team.
                          </p>
                          <div className="space-y-2 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-slate-400" />
                              <span>Email: <span className="font-bold text-slate-900">{currentUser.email}</span></span>
                            </div>
                            {currentUser.contactNo && (
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-slate-400" />
                                <span>Contact: <span className="font-bold text-slate-900">{currentUser.contactNo}</span></span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        alert('For support, please contact your system administrator or IT department.');
                      }}
                      className="w-full py-2 bg-orange-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-orange-700"
                    >
                      <HelpCircle size={14} /> Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
      <div className="flex-1 flex flex-col justify-center min-h-full py-10">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-orange-200 rotate-3">
            <ShieldCheck size={40} />
          </div>
        </div>

        {isNew ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in zoom-in-95">
            <h3 className="text-center text-sm font-black uppercase text-slate-800 mb-2">Request Corporate ID</h3>
            <div className="space-y-3">
              <Input placeholder="Full Name" value={form.name} onChange={(v: string) => setForm({...form, name: v})} required icon={<UserCircle size={16}/>} />
              <Input 
                placeholder={projectDomain ? `Email Address (username@${projectDomain})` : "Email Address"} 
                value={form.email} 
                onChange={(v: string) => setForm({...form, email: v})} 
                required 
                icon={<Mail size={16}/>} 
              />
              {projectDomain && (
                <p className="text-[9px] text-slate-400 mt-1 ml-1">Email must use @{projectDomain} domain</p>
              )}
              <Input placeholder="Choose Username" value={form.username} onChange={(v: string) => setForm({...form, username: v})} required icon={<AtSign size={16}/>} />
              <Input type="password" placeholder="Create Password" value={form.password} onChange={(v: string) => setForm({...form, password: v})} required icon={<Lock size={16}/>} />
              <button 
                type="submit"
                className="w-full py-4 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-100 active:scale-95 transition-all"
              >
                Submit Request
              </button>
              <button 
                type="button"
                onClick={() => setIsNew(false)}
                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-600 transition-colors pt-2"
              >
                Back to Authentication
              </button>
            </div>
          </form>
        ) : needsTwoStep ? (
          <div className="space-y-6 bg-white p-8 rounded-3xl border-2 border-orange-100 shadow-2xl animate-in zoom-in-95 text-center">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-4 ring-8 ring-orange-50/50">
                 <ShieldAlert size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase">Verification</h3>
                <p className="text-xs text-slate-500 font-medium">Enter the 4-digit code sent to your device</p>
              </div>
              
              <div className="relative mt-4">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <Fingerprint size={16} />
                 </div>
                 <input 
                  autoFocus
                  type="text"
                  maxLength={4}
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-2xl text-center text-2xl font-black tracking-[1em] transition-all"
                  placeholder="0000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>

              <button 
                onClick={() => onLogin(loginUsername, loginPassword, verificationCode, rememberMe)}
                className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-100 active:scale-95 transition-all"
              >
                Verify Identity
              </button>
              
              <button 
                onClick={() => setVerificationCode('')}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-600"
              >
                Resend Code
              </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Unique Handle / Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                  <AtSign size={16} />
                </div>
                <input 
                  type="text"
                  className="w-full pl-10 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 transition-all shadow-sm font-bold text-sm"
                  placeholder="username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Security Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                  <Lock size={16} />
                </div>
                <input 
                  type="password"
                  className="w-full pl-10 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 transition-all shadow-sm font-bold text-sm"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="rememberMe" className="text-[10px] font-bold text-slate-600 cursor-pointer">
                Remember me (Stay logged in)
              </label>
            </div>
            <button 
              onClick={() => onLogin(loginUsername, loginPassword, undefined, rememberMe)}
              className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-[0.1em] rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-200 active:scale-[0.98] transition-all"
            >
              <LogIn size={20} /> Initialize Access
            </button>
            
            <button 
              onClick={() => { setIsNew(true); resetForm(); }}
              className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-600 transition-colors pt-4"
            >
              New Personnel? Request Corporate ID
            </button>

            <div className="pt-10">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest"><span className="px-2 bg-slate-50 text-slate-300">Quick Access</span></div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100 flex justify-between items-center group cursor-pointer" onClick={() => { setLoginUsername('admin-abhishek'); setLoginPassword('admin@123'); }}>
                <span className="text-[10px] font-bold text-slate-500">admin node</span>
                <span className="text-[10px] font-black text-orange-600 uppercase group-hover:translate-x-1 transition-transform">Auto-Fill →</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionTitle = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-2 border-b border-slate-50 pb-1">
    {icon}
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
  </div>
);

const Input = ({ className = '', label, icon, onChange, ...props }: any) => (
  <div className={className}>
    {label && <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5 ml-1">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-300 pointer-events-none">{icon}</div>}
      <input 
        {...props}
        className={`w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs font-bold transition-all ${icon ? 'pl-9' : ''}`}
        onChange={onChange ? (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) : undefined}
      />
    </div>
  </div>
);
