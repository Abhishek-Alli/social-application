
import React from 'react';
import { Note } from '../types';
import { Trash2 } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
  return (
    <div 
      className={`p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full min-h-[140px] transition-all hover:shadow-md animate-in zoom-in-95 duration-200`}
      style={{ backgroundColor: note.color || '#ffffff' }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800 line-clamp-1">{note.title}</h3>
        <button 
          onClick={() => onDelete(note.id)}
          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <p className="text-sm text-slate-600 line-clamp-4 flex-grow whitespace-pre-wrap">
        {note.content}
      </p>
      <div className="mt-2 text-[10px] text-slate-400 font-medium">
        {new Date(note.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
};
