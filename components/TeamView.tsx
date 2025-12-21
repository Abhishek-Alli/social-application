
import React, { useState } from 'react';
import { User, Role } from '../types';
import { UserPlus, Users } from 'lucide-react';

interface TeamViewProps {
  currentUser: User;
  subordinates: User[];
  onAddSubordinate: (name: string, email: string, role: Role) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ currentUser, subordinates, onAddSubordinate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const getSubordinateRole = (): Role | null => {
    switch (currentUser.role) {
      case Role.ADMIN: return Role.MANAGEMENT;
      case Role.MANAGEMENT: return Role.HOD;
      case Role.HOD: return Role.EMPLOYEE;
      default: return null;
    }
  };

  const targetRole = getSubordinateRole();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !targetRole) return;
    onAddSubordinate(name, email, targetRole);
    setName('');
    setEmail('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Enterprise Hierarchy</h2>
          <p className="text-xs text-slate-400 font-medium">SRJ World of Steel Directory</p>
        </div>
        {targetRole && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors"
          >
            <UserPlus size={20} />
          </button>
        )}
      </div>

      {isAdding && targetRole && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm animate-in slide-in-from-top-4 space-y-3">
          <div className="text-xs font-bold text-orange-600 uppercase mb-2">Assign New {targetRole}</div>
          <input 
            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input 
            type="email"
            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm"
            placeholder="Work Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl text-sm shadow-md shadow-orange-100">
            Create Personnel ID
          </button>
        </form>
      )}

      <div className="space-y-3">
        {subordinates.length > 0 ? (
          subordinates.map(user => (
            <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold uppercase">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{user.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                </div>
              </div>
              <div className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                {user.role}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300">
            <Users size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">No personnel assigned yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
