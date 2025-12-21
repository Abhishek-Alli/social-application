
import React, { useState } from 'react';
import { Priority, Task, Note, User } from '../types';
import { X, CheckCircle, FileText } from 'lucide-react';

interface AddTaskModalProps {
  onClose: () => void;
  // Fix: Omit 'projectId' as it is handled in the parent component's save handler
  onSaveTask: (task: Omit<Task, 'id' | 'completed' | 'subTasks' | 'createdAt' | 'projectId'> & { subTasks?: string[] }) => void;
  onSaveNote: (note: Omit<Note, 'id' | 'createdAt' | 'projectId'>) => void;
  subordinates: User[];
}

const NOTE_COLORS = ['#ffffff', '#fef9c3', '#ffedd5', '#dcfce7', '#dbeafe', '#f3e8ff'];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onSaveTask, onSaveNote, subordinates }) => {
  const [activeTab, setActiveTab] = useState<'task' | 'note'>('task');
  
  // Task state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [category, setCategory] = useState('Production');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');

  // Note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#ffffff');

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
        assignedTo: assignedTo || undefined,
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
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Assign To</label>
                  <select 
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">Myself</option>
                    {subordinates.map(user => (
                      <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                    ))}
                  </select>
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
