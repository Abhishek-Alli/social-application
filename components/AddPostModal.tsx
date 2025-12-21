
import React, { useState, useRef } from 'react';
import { X, ImageIcon, Send, Sparkles, Video as VideoIcon } from 'lucide-react';

interface AddPostModalProps {
  onClose: () => void;
  onSave: (data: { text: string; image?: string; video?: string; ratio: '3:4' | '16:9' | '1:1' }) => void;
}

export const AddPostModal: React.FC<AddPostModalProps> = ({ onClose, onSave }) => {
  const [text, setText] = useState('');
  const [media, setMedia] = useState<{ type: 'image' | 'video'; data: string } | null>(null);
  const [ratio, setRatio] = useState<'3:4' | '16:9' | '1:1'>('1:1');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const maxSize = 20 * 1024 * 1024; // 20MB

      if (file.size > maxSize) {
        alert("File too large. Max size is 20MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia({
          type: isVideo ? 'video' : 'image',
          data: reader.result as string
        });
        // Auto-set ratio based on common video patterns if it's a video
        if (isVideo) setRatio('16:9');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !media) return;
    onSave({ 
      text, 
      image: media?.type === 'image' ? media.data : undefined, 
      video: media?.type === 'video' ? media.data : undefined, 
      ratio 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <Sparkles size={16} className="text-orange-500" /> Share Achievement
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Thought / Achievement</label>
            <textarea 
              autoFocus
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-500 text-sm font-medium resize-none min-h-[120px] transition-all"
              placeholder="What's the big news today? Use @username to mention or #hashtag..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Media & Canvas</label>
              {media && (
                <div className="flex gap-2">
                  {(['1:1', '3:4', '16:9'] as const).map(r => (
                    <button 
                      key={r}
                      type="button"
                      onClick={() => setRatio(r)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${ratio === r ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                      {r === '1:1' ? 'Square' : r === '3:4' ? 'Portrait' : 'Landscape'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!media ? (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-all bg-slate-50/30"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ImageIcon size={24} />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <VideoIcon size={24} />
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-tight">Add Visual Proof (Max 20MB)</span>
              </button>
            ) : (
              <div className="relative group">
                <div className={`w-full overflow-hidden rounded-3xl bg-slate-100 ${ratio === '1:1' ? 'aspect-square' : ratio === '3:4' ? 'aspect-[3/4]' : 'aspect-[16/9]'}`}>
                  {media.type === 'video' ? (
                    <video src={media.data} className="w-full h-full object-cover" controls muted />
                  ) : (
                    <img src={media.data} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => setMedia(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-rose-600 transition-all shadow-lg z-10"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*" 
              onChange={handleFileChange} 
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Send size={18} /> Post Update
          </button>
        </form>
      </div>
    </div>
  );
};
