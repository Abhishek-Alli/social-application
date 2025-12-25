
import React, { useState, useMemo } from 'react';
import { Priority, Task, Note, User } from '../types';
import { X, CheckCircle, FileText, Search } from 'lucide-react';

interface AddTaskModalProps {
  onClose: () => void;
  // Fix: Omit 'projectId' as it is handled in the parent component's save handler
  onSaveTask: (task: Omit<Task, 'id' | 'completed' | 'subTasks' | 'createdAt' | 'projectId'> & { subTasks?: string[] }) => void;
  onSaveNote: (note: Omit<Note, 'id' | 'createdAt' | 'projectId'>) => void;
  subordinates: User[];
  currentUser: User | null;
}

const NOTE_COLORS = ['#ffffff', '#fef9c3', '#ffedd5', '#dcfce7', '#dbeafe', '#f3e8ff'];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onSaveTask, onSaveNote, subordinates, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'task' | 'note'>('task');
  
  // Task state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [category, setCategory] = useState('Production');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]); // Changed to array for multiple assignees
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering users

  // Note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#ffffff');

  // Filter subordinates based on search query
  const filteredSubordinates = useMemo(() => {
    if (!searchQuery.trim()) return subordinates;
    const query = searchQuery.toLowerCase();
    return subordinates.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query) ||
      user.designation?.toLowerCase().includes(query)
    );
  }, [subordinates, searchQuery]);

  const handleToggleAssignee = (userId: string) => {
    setAssignedTo(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'task') {
      if (!title) return;
      onSaveTask({ 
        title, 
        description, 
        priority, 
        category, 
        dueDate,
        assignedTo: assignedTo.length > 0 ? assignedTo : (currentUser ? [currentUser.id] : undefined),
        subTasks: []
      });
    } else {
      if (!noteTitle && !noteContent) return;
      onSaveNote({
        title: noteTitle,
        content: noteContent,
        color: noteColor
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('task')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'task' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              <CheckCircle size={16} /> Task
            </button>
            <button 
              onClick={() => setActiveTab('note')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'note' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              <FileText size={16} /> Note
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pb-4">
          {activeTab === 'task' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Task Title</label>
                <input 
                  autoFocus
                  className="w-full text-lg font-medium p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 transition-all"
                  placeholder="What needs attention?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {subordinates.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assign To (Select Multiple)</label>
                  
                  {/* Search Bar */}
                  <div className="relative mb-3">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, role, department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border-2 border-slate-200 focus:border-orange-500 text-sm font-medium transition-all placeholder:text-slate-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* User List - Only show when searching */}
                  {searchQuery ? (
                    <div className="bg-slate-50 rounded-xl border-2 border-transparent focus-within:border-orange-500 p-3 max-h-48 overflow-y-auto space-y-2">
                      {filteredSubordinates.length > 0 ? (
                        filteredSubordinates.map(user => (
                          <label key={user.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={assignedTo.includes(user.id)}
                              onChange={() => handleToggleAssignee(user.id)}
                              className="rounded text-orange-600 focus:ring-orange-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700 truncate">
                                  {user.name}
                                </span>
                                {user.role && (
                                  <span className="text-xs text-slate-500 whitespace-nowrap">
                                    ({user.role})
                                  </span>
                                )}
                              </div>
                              {(user.email || user.department || user.designation) && (
                                <div className="text-xs text-slate-400 mt-0.5 truncate">
                                  {user.email && <span>{user.email}</span>}
                                  {user.email && (user.department || user.designation) && <span className="mx-1">•</span>}
                                  {user.department && <span>{user.department}</span>}
                                  {user.department && user.designation && <span className="mx-1">•</span>}
                                  {user.designation && <span>{user.designation}</span>}
                                </div>
                              )}
                            </div>
                          </label>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <Search size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">No users found</p>
                          <p className="text-xs mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
                      <Search size={24} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium text-slate-400">Search to find users</p>
                      <p className="text-xs text-slate-400 mt-1">Type a name, email, role, or department to see suggestions</p>
                    </div>
                  )}
                  
                  {/* Selected Count */}
                  {assignedTo.length > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-slate-500">
                        {assignedTo.length} user{assignedTo.length !== 1 ? 's' : ''} selected
                      </p>
                      <button
                        type="button"
                        onClick={() => setAssignedTo([])}
                        className="text-xs text-orange-600 font-bold hover:text-orange-700"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                  
                  {/* Search Results Count */}
                  {searchQuery && filteredSubordinates.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      Showing {filteredSubordinates.length} of {subordinates.length} users
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 transition-all resize-none"
                  rows={2}
                  placeholder="Add technical details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 text-center">Priority</label>
                  <div className="flex bg-slate-50 p-1 rounded-xl">
                    {Object.values(Priority).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 text-[10px] font-bold capitalize rounded-lg transition-all ${
                          priority === p ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Due Date</label>
                  <input 
                    type="date"
                    className="w-full p-2 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 transition-all text-xs"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Note Title</label>
                <input 
                  autoFocus
                  className="w-full text-lg font-medium p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 transition-all"
                  placeholder="Memo subject"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Content</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 transition-all resize-none"
                  rows={4}
                  placeholder="Enter notes..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Memo Color</label>
                <div className="flex gap-3">
                  {NOTE_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNoteColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${noteColor === color ? 'border-orange-500 scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <button 
            type="submit"
            className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-lg shadow-orange-200"
          >
            Create {activeTab === 'task' ? 'Task' : 'Note'}
          </button>
        </form>
      </div>
    </div>
  );
};
