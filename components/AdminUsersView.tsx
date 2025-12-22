import React, { useState, useMemo } from 'react';
import { User, Role } from '../types';
import { Trash2, Users, UserCheck, Search, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminUsersViewProps {
  currentUser: User;
  allUsers: User[];
  onDeleteUser: (userId: string) => void;
  onBack?: () => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ 
  currentUser, 
  allUsers, 
  onDeleteUser,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Calculate stats
  const stats = useMemo(() => {
    const totalAccounts = allUsers.length;
    const activeUsers = allUsers.filter(u => u.email && u.username).length;
    const byRole = {
      admin: allUsers.filter(u => u.role === Role.ADMIN).length,
      management: allUsers.filter(u => u.role === Role.MANAGEMENT).length,
      hod: allUsers.filter(u => u.role === Role.HOD).length,
      employee: allUsers.filter(u => u.role === Role.EMPLOYEE).length,
    };
    return { totalAccounts, activeUsers, byRole };
  }, [allUsers]);

  // Filter users
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allUsers.filter(u => 
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.employeeId?.toLowerCase().includes(query) ||
      u.department?.toLowerCase().includes(query) ||
      u.designation?.toLowerCase().includes(query)
    );
  }, [allUsers, searchQuery]);

  const handleDeleteClick = (user: User) => {
    if (user.id === currentUser.id) {
      alert('You cannot delete your own account!');
      return;
    }
    setUserToDelete(user);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN: return 'bg-red-100 text-red-700';
      case Role.MANAGEMENT: return 'bg-purple-100 text-purple-700';
      case Role.HOD: return 'bg-blue-100 text-blue-700';
      case Role.EMPLOYEE: return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">User Management</h2>
          <p className="text-xs text-slate-400 font-medium">Manage all accounts and users</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-orange-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Accounts</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{stats.totalAccounts}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={16} className="text-green-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Users</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{stats.activeUsers}</p>
        </div>
      </div>

      {/* Role Breakdown */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Users by Role</h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-lg font-black text-red-600">{stats.byRole.admin}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Admin</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-purple-600">{stats.byRole.management}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Management</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-blue-600">{stats.byRole.hod}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">HOD</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-green-600">{stats.byRole.employee}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Employee</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search users by name, email, username, employee ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div 
              key={user.id} 
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold uppercase text-sm flex-shrink-0">
                    {user.profilePhoto ? (
                      <img 
                        src={user.profilePhoto} 
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{user.name}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{user.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.username && (
                        <span className="text-[9px] text-slate-400 font-medium">@{user.username}</span>
                      )}
                      {user.employeeId && (
                        <span className="text-[9px] text-slate-400 font-medium">ID: {user.employeeId}</span>
                      )}
                      {user.department && (
                        <span className="text-[9px] text-slate-400 font-medium">{user.department}</span>
                      )}
                      {user.designation && (
                        <span className="text-[9px] text-slate-400 font-medium">{user.designation}</span>
                      )}
                    </div>
                    {user.contactNo && (
                      <p className="text-[9px] text-slate-400 font-medium mt-1">📞 {user.contactNo}</p>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteClick(user)}
                  disabled={user.id === currentUser.id}
                  className={`p-2 rounded-xl transition-all flex-shrink-0 ml-2 ${
                    user.id === currentUser.id
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                  title={user.id === currentUser.id ? 'Cannot delete your own account' : 'Delete user'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300">
            <Users size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">
              {searchQuery ? 'No users found matching your search' : 'No users found'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertCircle size={24} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Delete User</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">
                Are you sure you want to delete this user?
              </p>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-sm font-bold text-slate-800">{userToDelete.name}</p>
                <p className="text-xs text-slate-500">{userToDelete.email}</p>
                <p className="text-xs text-slate-400 mt-1">@{userToDelete.username} • {userToDelete.role}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl text-sm hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

