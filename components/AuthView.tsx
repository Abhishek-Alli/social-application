
import React, { useState, useEffect, useRef } from 'react';
import { Role, User } from '../types';
import { 
  LogIn, ShieldCheck, UserCircle, LogOut, AtSign, Save, 
  UserPlus, Users, ChevronRight, X, Camera, Briefcase, 
  Key, Phone, Mail, Calendar, Hash, Send, Lock, Shield, 
  QrCode, Info, Fingerprint, ShieldAlert, CheckCircle2
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
}

export const AuthView: React.FC<AuthViewProps> = ({ 
  currentUser, 
  onLogin, 
  onLogout, 
  onUpdateProfile,
  subordinates = [],
  onAddSubordinate,
  onRegister,
  needsTwoStep = false
}) => {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  const [isNew, setIsNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', username: '', dob: '', department: '', subDepartment: '',
    designation: '', employeeId: '', contactNo: '', password: '',
    telegramUserId: '', telegramToken: '', profilePhoto: ''
  });

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) setEditUsername(currentUser.username || '');
  }, [currentUser]);

  const handleUpdate = () => {
    if (onUpdateProfile && editUsername) {
      onUpdateProfile({ username: editUsername.replace('@', '').toLowerCase() });
      setIsEditing(false);
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
        {/* Digital Identity Card (3:4 Portrait Ratio) */}
        <div className="relative mx-auto w-full max-w-[320px] aspect-[3/4] bg-white rounded-[2rem] shadow-2xl shadow-orange-900/10 border-4 border-white overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-orange-600/20">
          
          <div className="h-24 bg-slate-950 relative overflow-hidden flex items-center justify-between px-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600 rounded-full -mr-16 -mt-16 opacity-20 blur-2xl" />
            <div className="z-10">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="bg-orange-600 p-1 rounded-md">
                   <Shield className="text-white" size={14} fill="currentColor" />
                </div>
                <h2 className="text-white font-black italic tracking-tighter text-lg leading-none">SRJ</h2>
              </div>
              <p className="text-[7px] text-orange-500 font-black uppercase tracking-[0.2em] leading-none">World of Steel</p>
            </div>
            <div className="z-10 text-right">
              <span className="block text-white text-[8px] font-black uppercase tracking-widest opacity-40">Official Identity</span>
              <span className="block text-orange-600 text-[9px] font-black uppercase tracking-widest leading-none mt-0.5">Enterprise Node</span>
            </div>
          </div>

          <div className="flex-1 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center pt-8 px-6 text-center">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full border-[5px] border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                {currentUser.profilePhoto ? (
                  <img src={currentUser.profilePhoto} className="w-full h-full object-cover" alt="Identity" />
                ) : (
                  <UserCircle size={64} className="text-slate-300" />
                )}
              </div>
              <div className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-white rounded-full flex items-center justify-center ${currentUser.isEmailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                 <Check className="text-white" size={10} />
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">{currentUser.name}</h3>
            <div className="bg-orange-600/10 px-3 py-1 rounded-full inline-block mb-6">
               <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">{currentUser.designation || 'Specialist'}</span>
            </div>

            <div className="w-full grid grid-cols-2 gap-y-4 gap-x-6 text-left border-t border-slate-100 pt-6">
              <div className="space-y-0.5">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee ID</span>
                <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-tight">{currentUser.employeeId || 'SRJ-NODE'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Department</span>
                <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-tight truncate">{currentUser.department || 'Operations'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Verification</span>
                <span className={`block text-[10px] font-bold uppercase tracking-tight ${currentUser.isEmailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {currentUser.isEmailVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Username</span>
                <span className="block text-[10px] font-bold text-orange-600 uppercase tracking-tight">@{currentUser.username}</span>
              </div>
              <div className="col-span-2 space-y-0.5">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Work Email</span>
                <span className="block text-[10px] font-bold text-slate-800 truncate">{currentUser.email}</span>
              </div>
            </div>

            <div className="mt-auto w-full flex items-center justify-between pb-6 opacity-60 grayscale hover:grayscale-0 transition-all cursor-default">
              <div className="flex items-center gap-2">
                 <QrCode size={32} className="text-slate-900" />
                 <div className="text-left">
                   <span className="block text-[6px] font-bold text-slate-400 uppercase">System Validation</span>
                   <span className="block text-[7px] font-black text-slate-900 uppercase">SECURE-NODE-01</span>
                 </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentUser.isTwoStepEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${currentUser.isTwoStepEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {currentUser.isTwoStepEnabled ? '2FA Enabled' : '2FA Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

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
      <div className="flex-1 flex flex-col justify-center min-h-full py-10">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-orange-200 rotate-3">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">SRJ <span className="not-italic text-sm font-bold block text-orange-600 uppercase tracking-[0.2em] mt-1">Enterprise Portal</span></h2>
        </div>

        {isNew ? (
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
                onClick={() => onLogin(loginUsername, loginPassword, verificationCode)}
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
