
import React, { useState } from 'react';
import { Task, Priority } from '../types';
import { CheckCircle, Circle, Clock, Tag, Share2, Mail, Send, User } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onClick: (task: Task) => void;
  users?: { [key: string]: string }; // Map of ID to Name
}

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    [Priority.LOW]: 'bg-emerald-100 text-emerald-700',
    [Priority.MEDIUM]: 'bg-amber-100 text-amber-700',
    [Priority.HIGH]: 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${colors[priority]}`}>
      {priority}
    </span>
  );
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onClick, users = {} }) => {
  const [showShare, setShowShare] = useState(false);

  const shareViaGmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    const subject = `SRJ Assignment: ${task.title}`;
    const body = `Hi,\n\nI am assigning you the following task:\n\nTitle: ${task.title}\nDescription: ${task.description}\nPriority: ${task.priority}\nDue Date: ${task.dueDate}\n\nBest regards,\nSRJ World of Steel Enterprise Portal`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowShare(false);
  };

  const shareViaTelegram = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `📋 *SRJ Assignment*%0A%0A*Title:* ${task.title}%0A*Priority:* ${task.priority.toUpperCase()}%0A*Due Date:* ${task.dueDate}%0A%0AAssigned via SRJ AI`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank');
    setShowShare(false);
  };

  return (
    <div 
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-3 active:scale-[0.98] transition-all cursor-pointer relative"
      onClick={() => onClick(task)}
    >
      <div className="flex items-start gap-3">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          className="mt-1 flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle className="w-6 h-6 text-orange-600 fill-orange-50" />
          ) : (
            <Circle className="w-6 h-6 text-slate-300" />
          )}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold text-slate-800 text-sm ${task.completed ? 'line-through text-slate-400' : ''}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={task.priority} />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShare(!showShare);
                }}
                className={`p-1 rounded-lg transition-colors ${showShare ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:text-orange-500'}`}
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
          
          <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
            {task.description || "No technical description."}
          </p>

          {(task.assignedBy || task.assignedTo) && (
            <div className="flex items-center gap-2 mb-2 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <User size={10} className="text-slate-400" />
              <span className="text-[9px] text-slate-500 font-bold uppercase flex gap-1">
                {task.assignedBy && (
                  <span>From: <span className="text-orange-600">{users[task.assignedBy] || 'Deleted Account'}</span></span>
                )}
                {task.assignedTo && (
                  <>
                    <span className="text-slate-300 mx-1">|</span>
                    <span>To: <span className="text-slate-900">{users[task.assignedTo] || 'Deleted Account'}</span></span>
                  </>
                )}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
            <div className="flex items-center gap-1">
              <Clock size={10} />
              {task.dueDate || 'ASAP'}
            </div>
            <div className="flex items-center gap-1">
              <Tag size={10} />
              {task.category}
            </div>
          </div>
        </div>
      </div>

      {showShare && (
        <div className="mt-3 pt-3 border-t border-slate-50 flex gap-2 animate-in fade-in slide-in-from-top-1">
          <button onClick={shareViaGmail} className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-600">
            <Mail size={12} className="text-rose-500" /> Gmail
          </button>
          <button onClick={shareViaTelegram} className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-600">
            <Send size={12} className="text-sky-500" /> Telegram
          </button>
        </div>
      )}
    </div>
  );
};
