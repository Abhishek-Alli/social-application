
import React, { useState } from 'react';
import { Project } from '../types';
import { Briefcase, Plus, Shield, User, Key, Trash2, Layout, ArrowRight } from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (data: Omit<Project, 'id' | 'createdAt'>) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ 
  projects, 
  currentProjectId, 
  onSelectProject, 
  onCreateProject,
  onDeleteProject
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [manager, setManager] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !manager) return;
    onCreateProject({ name, managerName: manager, password });
    setName('');
    setManager('');
    setPassword('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Project Matrix</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Isolated Project Environments</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`p-2.5 rounded-2xl transition-all ${isAdding ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-100 shadow-sm'}`}
        >
          <Plus size={20} />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl border-2 border-orange-100 shadow-xl animate-in slide-in-from-top-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Layout size={16} className="text-orange-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deploy New Project DB</span>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-300">
                <Briefcase size={14} />
              </div>
              <input 
                className="w-full pl-9 p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs font-bold"
                placeholder="Project Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-300">
                <User size={14} />
              </div>
              <input 
                className="w-full pl-9 p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs font-bold"
                placeholder="Manager Name"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-300">
                <Key size={14} />
              </div>
              <input 
                type="password"
                className="w-full pl-9 p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs font-bold"
                placeholder="Project Access Key (Optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-md active:scale-95 transition-all">
            Initialize Project
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {projects.map(project => (
          <div 
            key={project.id} 
            className={`group bg-white p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${currentProjectId === project.id ? 'border-orange-500 ring-4 ring-orange-50' : 'border-slate-100 hover:border-orange-200'}`}
            onClick={() => onSelectProject(project.id)}
          >
            {currentProjectId === project.id && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                Active Node
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${currentProjectId === project.id ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600'}`}>
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{project.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {project.id.slice(0,8)}</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Permanently wipe this project database?')) onDeleteProject(project.id);
                }}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Manager</span>
                <span className="text-[10px] font-bold text-slate-700">{project.managerName}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Status</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Operational</span>
                </div>
                <ArrowRight size={14} className={`transition-transform ${currentProjectId === project.id ? 'text-orange-600' : 'text-slate-300 group-hover:translate-x-1'}`} />
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="bg-slate-100/50 rounded-3xl p-12 border-2 border-dashed border-slate-200 text-center">
            <Layout size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Projects Initialized</p>
            <p className="text-[9px] text-slate-400 font-medium mt-1">Start by deploying your first project node</p>
          </div>
        )}
      </div>
    </div>
  );
};
