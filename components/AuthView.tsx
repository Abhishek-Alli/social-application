
import React, { useState, useEffect, useRef } from 'react';
import { Role, User } from '../types';
import { 
  LogIn, ShieldCheck, UserCircle, LogOut, AtSign, Save, 
  UserPlus, Users, ChevronRight, X, Camera, Briefcase, 
  Key, Phone, Mail, Calendar, Hash, Send, Lock, Shield, 
  QrCode, Info, Fingerprint, ShieldAlert, CheckCircle2, Edit2, Download, Eye, ChevronDown
} from 'lucide-react';

interface AuthViewProps {
  currentUser: User | null;
  onLogin: (username: string, password?: string, code?: string) => void;
  onLogout: () => void;
  onUpdateProfile?: (updates: Partial<User>) => void;
  subordinates?: User[];
  onAddSubordinate?: (userData: Partial<User>) => void;
  onRegister?: (userData: Partial<User>) => void;
  needsTwoStep?: boolean;
  onNavigateToAdminUsers?: () => void;
  allUsers?: User[];
  pendingEmailVerification?: { user: User; code: string } | null;
  onVerifyEmail?: (code: string) => void;
  onResendVerificationCode?: () => void;
  onResendOTP?: () => void;
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
  onNavigateToAdminUsers,
  allUsers = [],
  pendingEmailVerification,
  onVerifyEmail,
  onResendVerificationCode,
  onResendOTP
}) => {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  
  const [isNew, setIsNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', username: '', dob: '', department: '', subDepartment: '',
    designation: '', employeeId: '', contactNo: '', password: '',
    telegramUserId: '', telegramToken: '', profilePhoto: ''
  });
  
  const [editForm, setEditForm] = useState({
    name: '', email: '', department: '', subDepartment: '',
    designation: '', employeeId: '', contactNo: '', dob: '',
    profilePhoto: ''
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const identityCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      setEditUsername(currentUser.username || '');
      setEditForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        department: currentUser.department || '',
        subDepartment: currentUser.subDepartment || '',
        designation: currentUser.designation || '',
        employeeId: currentUser.employeeId || '',
        contactNo: currentUser.contactNo || '',
        dob: currentUser.dob || '',
        profilePhoto: currentUser.profilePhoto || ''
      });
    }
  }, [currentUser]);

  const handleUpdate = () => {
    if (onUpdateProfile && editUsername) {
      onUpdateProfile({ username: editUsername.replace('@', '').toLowerCase() });
      setIsEditing(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        name: editForm.name,
        email: editForm.email,
        department: editForm.department,
        subDepartment: editForm.subDepartment,
        designation: editForm.designation,
        employeeId: editForm.employeeId,
        contactNo: editForm.contactNo,
        dob: editForm.dob,
        profilePhoto: editForm.profilePhoto
      });
      setIsEditingProfile(false);
      alert("Profile updated successfully!");
    }
  };

  const handleCancelEdit = () => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        department: currentUser.department || '',
        subDepartment: currentUser.subDepartment || '',
        designation: currentUser.designation || '',
        employeeId: currentUser.employeeId || '',
        contactNo: currentUser.contactNo || '',
        dob: currentUser.dob || '',
        profilePhoto: currentUser.profilePhoto || ''
      });
    }
    setIsEditingProfile(false);
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm(prev => ({ ...prev, profilePhoto: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadPDF = async () => {
    if (!identityCardRef.current || !currentUser) return;
    
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;
      
      const cardElement = identityCardRef.current;
      
      // Temporarily hide edit buttons and other UI elements that shouldn't be in PDF
      const originalDisplay: { [key: string]: string } = {};
      const buttonsToHide = cardElement.parentElement?.querySelectorAll('button');
      buttonsToHide?.forEach((btn, index) => {
        const key = `btn_${index}`;
        originalDisplay[key] = btn.style.display;
        btn.style.display = 'none';
      });
      
      // Capture the card as canvas with exact styling including borders and shadows
      const canvas = await html2canvas(cardElement, {
        scale: 4, // Very high scale for crisp quality
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true,
        removeContainer: false,
        imageTimeout: 0,
        width: cardElement.offsetWidth + 8, // Add extra space for border
        height: cardElement.offsetHeight + 8, // Add extra space for border
        x: -4, // Offset to include left border
        y: -4, // Offset to include top border
        // Preserve all styles including borders, shadows, rounded corners
        onclone: (clonedDoc) => {
          // Find the cloned card element
          const clonedCard = clonedDoc.querySelector('[class*="aspect-[3/4]"]') as HTMLElement;
          if (clonedCard) {
            const computedStyle = getComputedStyle(cardElement);
            // Ensure all visual styles are preserved exactly as displayed
            clonedCard.style.transform = 'none';
            clonedCard.style.position = 'relative';
            clonedCard.style.boxShadow = computedStyle.boxShadow || '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(249, 115, 22, 0.1)';
            clonedCard.style.border = computedStyle.border || '4px solid rgb(234, 88, 12)'; // Orange-600 border
            clonedCard.style.borderRadius = computedStyle.borderRadius || '2rem'; // Round corners (32px)
            clonedCard.style.overflow = 'visible'; // Show full borders
            clonedCard.style.backgroundColor = computedStyle.backgroundColor || '#ffffff';
            clonedCard.style.boxSizing = 'border-box'; // Include border in dimensions
            // Ensure orange border with round corners is visible
            if (!computedStyle.border || computedStyle.border === 'none' || computedStyle.border.includes('white')) {
              clonedCard.style.border = '4px solid rgb(234, 88, 12)'; // Orange-600
            }
            // Ensure round corners are preserved
            if (!computedStyle.borderRadius || computedStyle.borderRadius === '0px') {
              clonedCard.style.borderRadius = '2rem'; // 32px rounded corners
            }
            // Ensure shadow is visible
            if (!computedStyle.boxShadow || computedStyle.boxShadow === 'none') {
              clonedCard.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(249, 115, 22, 0.1)';
            }
            
            // Also update profile photo border to orange with round corners
            const profilePhoto = clonedCard.querySelector('[class*="rounded-full"]') as HTMLElement;
            if (profilePhoto) {
              const originalPhoto = cardElement.querySelector('[class*="rounded-full"]') as HTMLElement;
              if (originalPhoto) {
                const photoStyle = getComputedStyle(originalPhoto);
                profilePhoto.style.border = photoStyle.border || '4px solid rgb(234, 88, 12)'; // Orange border
                profilePhoto.style.borderRadius = photoStyle.borderRadius || '9999px'; // Fully rounded
                // Force orange border if white
                if (!photoStyle.border || photoStyle.border.includes('white')) {
                  profilePhoto.style.border = '4px solid rgb(234, 88, 12)'; // Orange-600
                }
                // Ensure round corners
                if (!photoStyle.borderRadius || photoStyle.borderRadius === '0px') {
                  profilePhoto.style.borderRadius = '9999px'; // Fully rounded
                }
              }
            }
          }
        }
      });
      
      // Restore button visibility
      buttonsToHide?.forEach((btn, index) => {
        const key = `btn_${index}`;
        btn.style.display = originalDisplay[`btn_${index}`] || '';
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Get actual card dimensions to maintain exact aspect ratio
      const cardWidth = cardElement.offsetWidth;
      const cardHeight = cardElement.offsetHeight;
      const aspectRatio = cardHeight / cardWidth;
      
      // Calculate PDF dimensions maintaining exact 3:4 ratio
      // Add padding to show border properly
      const padding = 10; // mm padding around card
      const pdfWidth = 210; // A4 width in mm (standard)
      const cardPdfWidth = pdfWidth - (padding * 2);
      const cardPdfHeight = cardPdfWidth * (4 / 3); // Maintain 3:4 portrait ratio
      const pdfHeight = cardPdfHeight + (padding * 2);
      
      // Create PDF with exact dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      // Set white background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      // Add image with padding to show border design properly
      pdf.addImage(imgData, 'PNG', padding, padding, cardPdfWidth, cardPdfHeight, undefined, 'FAST');
      
      // Download PDF with proper filename
      const sanitizedName = (currentUser.name || 'Identity').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${sanitizedName}_Identity_Card_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
      alert("✅ Identity card downloaded successfully as PDF!");
    } catch (error: any) {
      console.error('PDF download error:', error);
      alert("❌ Failed to download PDF. Please try again.");
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
      <div className="flex flex-col p-6 space-y-8 animate-in fade-in duration-500 pb-32 no-scrollbar">
        {/* Edit Profile and Download Buttons - Outside Card for Better Visibility */}
        {!isEditingProfile && (
          <div className="w-full max-w-[320px] mx-auto flex gap-2">
            <button
              onClick={handleEditProfile}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-3 bg-slate-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <Download size={16} />
            </button>
          </div>
        )}

        {/* Digital Identity Card (3:4 Portrait Ratio) */}
        <div ref={identityCardRef} className="relative mx-auto w-full max-w-[320px] aspect-[3/4] bg-white rounded-[2rem] shadow-2xl shadow-orange-900/10 border-4 border-orange-600 overflow-visible flex flex-col group transition-all duration-500 hover:shadow-orange-600/20">
          
          <div className="flex-1 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center pt-4 px-5 pb-5 text-center justify-between overflow-hidden rounded-[2rem]">
            <div className="flex flex-col items-center flex-shrink-0 w-full">
              <div className="relative mb-4 mt-2 flex-shrink-0">
                <div className="w-24 h-24 rounded-full border-[4px] border-orange-600 shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  {(isEditingProfile ? editForm.profilePhoto : currentUser.profilePhoto) ? (
                    <img src={isEditingProfile ? editForm.profilePhoto : currentUser.profilePhoto} className="w-full h-full object-cover" alt="Identity" />
                  ) : (
                    <UserCircle size={56} className="text-slate-300" />
                  )}
                </div>
                {isEditingProfile && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-orange-700 transition-all z-10"
                  >
                    <Camera size={12} />
                  </button>
                )}
                {!isEditingProfile && (
                  <div className={`absolute bottom-0 right-0 w-5 h-5 border-3 border-white rounded-full flex items-center justify-center ${currentUser.isEmailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    <Check className="text-white" size={8} />
                  </div>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditPhotoUpload}
                  className="hidden"
                />
              </div>

              <h3 className="text-base font-black text-slate-900 tracking-tight mb-5 flex-shrink-0 break-words px-2 line-clamp-1">
                {currentUser.name ? currentUser.name.charAt(0).toLowerCase() : 'U'}
              </h3>
              <div className="bg-orange-600/10 px-3 py-1 rounded-full inline-flex items-center justify-center mb-6 flex-shrink-0">
                 <span className="text-xs font-black text-orange-600 uppercase tracking-widest">
                   {currentUser.designation ? currentUser.designation.charAt(0).toUpperCase() : 'S'}
                 </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-y-2.5 gap-x-3 text-left border-t border-slate-100 pt-5 pb-2 flex-shrink-0 mt-1">
              <div className="space-y-0.5 min-h-[35px]">
                <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Employee ID</span>
                <span className="block text-[9px] font-bold text-slate-800 uppercase tracking-tight break-all leading-tight">{currentUser.employeeId || 'SRJ-NODE'}</span>
              </div>
              <div className="space-y-0.5 min-h-[35px]">
                <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Department</span>
                <span className="block text-[9px] font-bold text-slate-800 uppercase tracking-tight break-all leading-tight">{currentUser.department || 'Operations'}</span>
              </div>
              <div className="space-y-0.5 min-h-[35px]">
                <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Verification</span>
                <span className={`block text-[9px] font-bold uppercase tracking-tight break-words leading-tight ${currentUser.isEmailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {currentUser.isEmailVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="space-y-0.5 min-h-[35px]">
                <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Username</span>
                <span className="block text-[9px] font-bold text-orange-600 uppercase tracking-tight break-all leading-tight">@{currentUser.username}</span>
              </div>
              <div className="col-span-2 space-y-0.5 min-h-[35px]">
                <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Work Email</span>
                <span className="block text-[9px] font-bold text-slate-800 break-all leading-tight">{currentUser.email}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Edit Form - Outside Card for Better Visibility */}
        {isEditingProfile && (
          <div className="w-full max-w-[320px] mx-auto bg-white rounded-2xl p-4 shadow-lg border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-widest">Edit Profile Details</h3>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full Name"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              value={editForm.employeeId}
              onChange={(e) => setEditForm(prev => ({ ...prev, employeeId: e.target.value }))}
              placeholder="Employee ID"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              value={editForm.department}
              onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
              placeholder="Department"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              value={editForm.subDepartment}
              onChange={(e) => setEditForm(prev => ({ ...prev, subDepartment: e.target.value }))}
              placeholder="Sub Department"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              value={editForm.designation}
              onChange={(e) => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
              placeholder="Designation"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              value={editForm.contactNo}
              onChange={(e) => setEditForm(prev => ({ ...prev, contactNo: e.target.value }))}
              placeholder="Contact Number"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="date"
              value={editForm.dob}
              onChange={(e) => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
              placeholder="Date of Birth"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={14} />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Security Settings Section */}
        <div className="px-2 space-y-4">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={16} className="text-orange-600" /> Security Settings
           </h3>
           <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-4 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer" onClick={toggleTwoStep}>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                       <Fingerprint size={18} />
                    </div>
                    <div>
                       <span className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">2-Step Verification</span>
                       <span className="block text-[8px] font-bold text-slate-400 uppercase">Extra layer of security</span>
                    </div>
                 </div>
                 <div className={`w-10 h-5 rounded-full relative transition-all ${currentUser.isTwoStepEnabled ? 'bg-orange-600' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${currentUser.isTwoStepEnabled ? 'right-1' : 'left-1'}`} />
                 </div>
              </div>

              {!currentUser.isEmailVerified && (
                <div className="p-4 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer" onClick={verifyEmail}>
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                        <Mail size={18} />
                      </div>
                      <div>
                        <span className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Verify Email</span>
                        <span className="block text-[8px] font-bold text-amber-600 uppercase">Action Required</span>
                      </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              )}
           </div>
        </div>

        {/* Admin User Management Section */}
        {currentUser && currentUser.role === Role.ADMIN && (
          <div className="px-2 mb-4 space-y-3">
            {/* User Management Button */}
            {onNavigateToAdminUsers && (
              <button
                onClick={onNavigateToAdminUsers}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl border border-orange-400 flex items-center justify-between group hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg shadow-orange-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black uppercase tracking-wider">User Management</h3>
                    <p className="text-[9px] text-orange-100 font-medium">View & Manage All Accounts</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-orange-100 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* View All Users Details Toggle */}
            {allUsers && allUsers.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className="w-full py-4 px-6 flex items-center justify-between group hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Eye size={20} className="text-orange-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">View All Users</h3>
                      <p className="text-[9px] text-slate-400 font-medium">{allUsers.length} Total Accounts</p>
                    </div>
                  </div>
                  <ChevronDown 
                    size={18} 
                    className={`text-slate-400 transition-transform ${showAllUsers ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* All Users Details List */}
                {showAllUsers && (
                  <div className="border-t border-slate-100 max-h-[600px] overflow-y-auto">
                    <div className="p-4 space-y-3">
                      {allUsers.map((user) => (
                        <div 
                          key={user.id} 
                          className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold uppercase text-sm flex-shrink-0 overflow-hidden">
                              {user.profilePhoto ? (
                                <img 
                                  src={user.profilePhoto} 
                                  alt={user.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                user.name.charAt(0)
                              )}
                            </div>

                            {/* User Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold text-slate-800 truncate">{user.name}</h4>
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                                  user.role === Role.ADMIN ? 'bg-red-100 text-red-700' :
                                  user.role === Role.MANAGEMENT ? 'bg-purple-100 text-purple-700' :
                                  user.role === Role.HOD ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {user.role}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-600 font-medium truncate">
                                  📧 {user.email}
                                </p>
                                {user.username && (
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    @{user.username}
                                  </p>
                                )}
                                {user.employeeId && (
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    🆔 ID: {user.employeeId}
                                  </p>
                                )}
                                {user.department && (
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    🏢 {user.department}
                                    {user.subDepartment && ` • ${user.subDepartment}`}
                                  </p>
                                )}
                                {user.designation && (
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    💼 {user.designation}
                                  </p>
                                )}
                                {user.contactNo && (
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    📞 {user.contactNo}
                                  </p>
                                )}
                                {user.dob && (
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    🎂 DOB: {new Date(user.dob).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hierarchy Management Section */}
        {targetRole && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Users size={16} className="text-orange-600" /> Personnel Boarding
              </h3>
              <button 
                onClick={() => { setIsAddingSub(!isAddingSub); resetForm(); }}
                className={`p-2 rounded-xl transition-all ${isAddingSub ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-orange-600 border border-orange-100 shadow-sm'}`}
              >
                {isAddingSub ? <X size={18} /> : <UserPlus size={18} />}
              </button>
            </div>

            {isAddingSub && (
              <form onSubmit={handleAddSubmit} className="bg-white p-5 rounded-3xl border-2 border-orange-100 shadow-xl animate-in slide-in-from-top-4 space-y-6">
                <div className="text-center">
                  <div 
                    onClick={() => photoInputRef.current?.click()}
                    className="w-20 h-20 bg-slate-50 border-2 border-dashed border-orange-200 rounded-full mx-auto mb-2 flex items-center justify-center cursor-pointer overflow-hidden group"
                  >
                    {form.profilePhoto ? (
                      <img src={form.profilePhoto} className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={24} className="text-orange-300 group-hover:text-orange-500" />
                    )}
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Set Profile Visual</span>
                  <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>

                <div className="space-y-4">
                  <SectionTitle title="Personal Details" icon={<UserCircle size={14}/>} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Full Name" value={form.name} onChange={(v: string) => setForm({...form, name: v})} required />
                    <Input placeholder="Custom Username" value={form.username} onChange={(v: string) => setForm({...form, username: v})} icon={<AtSign size={14}/>} required />
                    <Input type="date" label="DOB" value={form.dob} onChange={(v: string) => setForm({...form, dob: v})} />
                    <Input placeholder="Contact No" value={form.contactNo} onChange={(v: string) => setForm({...form, contactNo: v})} icon={<Phone size={14}/>} />
                    <Input type="email" placeholder="Work Email" value={form.email} onChange={(v: string) => setForm({...form, email: v})} icon={<Mail size={14}/>} required className="col-span-2" />
                  </div>

                  <SectionTitle title="Professional Placement" icon={<Briefcase size={14}/>} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Employee ID" value={form.employeeId} onChange={(v: string) => setForm({...form, employeeId: v})} icon={<Hash size={14}/>} />
                    <Input placeholder="Designation" value={form.designation} onChange={(v: string) => setForm({...form, designation: v})} />
                    <Input placeholder="Department" value={form.department} onChange={(v: string) => setForm({...form, department: v})} />
                    <Input placeholder="Sub-Department" value={form.subDepartment} onChange={(v: string) => setForm({...form, subDepartment: v})} />
                  </div>

                  <SectionTitle title="Security & Integration" icon={<Key size={14}/>} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="password" placeholder="Temp Password" value={form.password} onChange={(v: string) => setForm({...form, password: v})} />
                    <Input placeholder="Telegram ID" value={form.telegramUserId} onChange={(v: string) => setForm({...form, telegramUserId: v})} />
                    <Input placeholder="Telegram Token" value={form.telegramToken} onChange={(v: string) => setForm({...form, telegramToken: v})} className="col-span-2" />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Send size={18} /> Initialize Personnel
                </button>
              </form>
            )}

            <div className="space-y-2">
              {subordinates.length > 0 ? (
                subordinates.map(sub => (
                  <div key={sub.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center overflow-hidden">
                        {sub.profilePhoto ? <img src={sub.profilePhoto} className="w-full h-full object-cover" /> : <span className="text-slate-400 font-black">{sub.name.charAt(0)}</span>}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{sub.name}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{sub.designation || sub.role}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-orange-600 transition-colors" />
                  </div>
                ))
              ) : (
                <div className="bg-slate-100/50 rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hierarchy Empty</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-1 italic">Add personnel to start delegating</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-2 pt-4">
           <button className="w-full py-4 px-6 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-slate-50 transition-all">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <Info size={16} />
                 </div>
                 <div className="text-left">
                    <span className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Help & Support</span>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase">Guidelines & Documentation</span>
                 </div>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
           </button>
        </div>

        <div className="space-y-3 pt-4 pb-12">
          <button 
            onClick={onLogout}
            className="w-full py-4 bg-rose-50 text-rose-600 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-all active:scale-95"
          >
            <LogOut size={20} /> Terminate Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
      <div className="flex-1 flex flex-col justify-start min-h-full pt-32 pb-10">
        <div className="mb-10 text-center">
          {/* SRJ SOCIAL Logo - Actual Image */}
          <div className="w-48 h-48 mx-auto mb-8 flex items-center justify-center">
            <img 
              src="/app_logo/SRJ-SOCIAL.jpg" 
              alt="SRJ SOCIAL Logo" 
              className="w-full h-full object-contain rounded-2xl"
              style={{maxWidth: '192px', maxHeight: '192px'}}
            />
          </div>
        </div>

        {pendingEmailVerification ? (
          <div className="space-y-6 bg-white p-8 rounded-3xl border-2 border-orange-100 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-4 ring-8 ring-orange-50/50">
              <Mail size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase">Email Verification Required</h3>
              <p className="text-xs text-slate-500 font-medium">
                We've sent a verification code to<br />
                <span className="font-bold text-orange-600">{pendingEmailVerification.user.email}</span>
              </p>
            </div>
            
            <div className="relative mt-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                <Key size={16} />
              </div>
              <input 
                autoFocus
                type="text"
                maxLength={6}
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-2xl text-center text-xl font-black tracking-[0.5em] transition-all"
                placeholder="000000"
                value={emailVerificationCode}
                onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button 
              onClick={() => {
                if (emailVerificationCode.length === 6 && onVerifyEmail) {
                  onVerifyEmail(emailVerificationCode);
                  setEmailVerificationCode('');
                } else {
                  alert('Please enter a 6-digit verification code');
                }
              }}
              className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-100 active:scale-95 transition-all"
            >
              Verify Email
            </button>
            
            <button 
              onClick={() => {
                if (onResendVerificationCode) {
                  onResendVerificationCode();
                  setEmailVerificationCode('');
                }
              }}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-600 transition-colors"
            >
              Resend Code
            </button>
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium">
                For testing: Code is <span className="font-bold text-orange-600">{pendingEmailVerification.code}</span>
              </p>
            </div>
          </div>
        ) : isNew ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in zoom-in-95">
            <h3 className="text-center text-sm font-black uppercase text-slate-800 mb-2">Request Corporate ID</h3>
            <div className="space-y-3">
              <Input placeholder="Full Name" value={form.name} onChange={(v: string) => setForm({...form, name: v})} required icon={<UserCircle size={16}/>} />
              <Input placeholder="Email Address" value={form.email} onChange={(v: string) => setForm({...form, email: v})} required icon={<Mail size={16}/>} />
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
                <h3 className="text-xl font-black text-slate-900 uppercase">2-Step Verification</h3>
                <p className="text-xs text-slate-500 font-medium">Enter the 6-digit code sent to your email</p>
                <p className="text-[10px] text-amber-600 font-medium">Code expires in 5 minutes</p>
              </div>
              
              <div className="relative mt-4">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <Fingerprint size={16} />
                 </div>
                 <input 
                  autoFocus
                  type="text"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-2xl text-center text-xl font-black tracking-[0.5em] transition-all"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <button 
                onClick={() => onLogin(loginUsername, loginPassword, verificationCode)}
                className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-100 active:scale-95 transition-all"
              >
                Verify Identity
              </button>
              
              <button 
                onClick={() => {
                  if (onResendOTP) {
                    onResendOTP();
                    setVerificationCode('');
                  }
                }}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-600 transition-colors"
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
            <button 
              onClick={() => onLogin(loginUsername, loginPassword)}
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

// Check icon for verification badge
const Check = ({ className, size }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SectionTitle = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-2 border-b border-slate-50 pb-1">
    {icon}
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
  </div>
);

const Input = ({ className = '', label, ...props }: any) => (
  <div className={className}>
    {label && <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5 ml-1">{label}</label>}
    <div className="relative">
      {props.icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-300 pointer-events-none">{props.icon}</div>}
      <input 
        {...props}
        className={`w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs font-bold transition-all ${props.icon ? 'pl-9' : ''}`}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  </div>
);
