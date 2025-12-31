import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image, Video, Link as LinkIcon, Upload, Trash2, FileWarning, Loader2, ArrowLeft } from 'lucide-react';
import { PromptItem, CATEGORIES } from '../types';
import { CATEGORY_COLORS } from '../App';

interface PromptFormModalProps {
  isOpen: boolean;
  initialData?: PromptItem | null;
  onClose: () => void;
  onSave: (data: PromptItem) => Promise<void> | void;
}

const MediaUploader: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  accept: 'image' | 'video' | 'both';
  required?: boolean;
  hasError?: boolean;
}> = ({ label, value, onChange, accept, required, hasError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file.size > 50 * 1024 * 1024) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setIsProcessing(false);
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const isValueVideo = value?.startsWith('data:video') || value?.match(/\.(mp4|webm|mov)$/i);

  return (
    <div className="space-y-2">
      <label className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${hasError ? 'text-rose-400' : 'text-gray-500'}`}>
        {label} {required && '*'}
      </label>
      {isProcessing ? (
        <div className="h-32 border border-white/5 rounded-2xl bg-white/[0.02] flex flex-col items-center justify-center gap-2">
           <Loader2 size={20} className="text-white/20 animate-spin" />
        </div>
      ) : !value ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
          className={`
            cursor-pointer border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center gap-2
            ${hasError ? 'border-rose-500/30 bg-rose-500/5' : isDragging ? 'border-white/40 bg-white/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}
          `}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept={accept === 'image' ? "image/*" : accept === 'video' ? "video/*" : "image/*,video/*"} onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
          <Upload size={20} className="text-gray-600" />
          <p className="text-xs text-gray-500">点击或拖拽上传</p>
          <div className="w-full mt-2" onClick={e => e.stopPropagation()}>
             <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="或输入 URL..." className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-gray-400 outline-none" />
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-black group aspect-video">
           {isValueVideo ? <video src={value} className="w-full h-full object-cover" controls /> : <img src={value} className="w-full h-full object-cover" />}
           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button onClick={() => onChange('')} className="p-3 bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30 backdrop-blur-md">
                <Trash2 size={18} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

const PromptFormModal: React.FC<PromptFormModalProps> = ({ isOpen, initialData, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<PromptItem>>({ category: 'txt2img', tags: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setFormData(initialData || { id: Date.now().toString(), category: 'txt2img', tags: [], isVideo: false, title: '', prompt: '', outputMediaUrl: '', modelUsed: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!formData.title?.trim()) newErrors.title = true;
    if (!formData.prompt?.trim()) newErrors.prompt = true;
    if (formData.category !== 'general' && !formData.outputMediaUrl) newErrors.outputMediaUrl = true;
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setIsSaving(true);
    await onSave(formData as PromptItem);
    setIsSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center md:p-6 bg-black/90 backdrop-blur-md">
        <motion.div initial={{ y: 50, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.98 }} className="w-full h-full md:h-auto md:max-h-[90vh] max-w-2xl bg-[#09090b] border border-white/10 md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
          
          <div className="flex-none flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.01]">
            <button onClick={onClose} className="md:hidden p-2 text-gray-500"><ArrowLeft size={20} /></button>
            <h2 className="text-lg font-bold text-white">{initialData ? '编辑咒语' : '记录新灵感'}</h2>
            <button onClick={onClose} className="hidden md:block p-2 hover:bg-white/5 rounded-full"><X size={20} className="text-gray-500" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <form id="prompt-form" onSubmit={handleSubmit} className="space-y-6 pb-20 md:pb-0">
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">分类选择</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const isSel = formData.category === cat.id;
                    const colors = CATEGORY_COLORS[cat.id];
                    return (
                      <button key={cat.id} type="button" onClick={() => setFormData({ ...formData, category: cat.id, isVideo: cat.id.includes('vid') })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${isSel ? `${colors.bg} ${colors.text} ${colors.border}` : 'bg-white/5 border-transparent text-gray-600'}`}>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${errors.title ? 'text-rose-400' : 'text-gray-600'}`}>标题</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="例如：梦境城市" 
                    className={`w-full bg-white/[0.03] border rounded-2xl px-4 py-3 text-sm text-white outline-none transition-all ${errors.title ? 'border-rose-500/30' : 'border-white/5 focus:bg-white/[0.05]'}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">使用模型</label>
                  <input type="text" value={formData.modelUsed} onChange={e => setFormData({...formData, modelUsed: e.target.value})} placeholder="例如：MJ v6" 
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:bg-white/[0.05]" />
                </div>
              </div>

              {formData.category !== 'general' && (
                <MediaUploader label="生成结果" value={formData.outputMediaUrl || ''} onChange={val => setFormData({...formData, outputMediaUrl: val})} accept={formData.category?.includes('vid') ? 'both' : 'image'} required hasError={errors.outputMediaUrl} />
              )}

              <div className="space-y-2">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${errors.prompt ? 'text-rose-400' : 'text-gray-600'}`}>咒语内容</label>
                <textarea value={formData.prompt} onChange={e => setFormData({...formData, prompt: e.target.value})} rows={5}
                  className={`w-full bg-white/[0.03] border rounded-2xl px-4 py-3 text-white font-mono text-sm outline-none leading-relaxed transition-all ${errors.prompt ? 'border-rose-500/30' : 'border-white/5 focus:bg-white/[0.05]'}`} placeholder="/imagine prompt: ..." />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">标签 (空格/逗号分隔)</label>
                <input type="text" defaultValue={formData.tags?.join(', ')} onBlur={e => setFormData({...formData, tags: e.target.value.split(/[,，\s]+/).filter(Boolean)})} placeholder="风景 赛博朋克 8k" 
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white outline-none" />
              </div>
            </form>
          </div>

          <div className="flex-none p-6 border-t border-white/5 flex gap-3 bg-white/[0.01]">
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl text-sm font-bold text-gray-500 bg-white/5 hover:bg-white/10 transition-colors">取消</button>
            <button type="submit" form="prompt-form" disabled={isSaving}
              className={`flex-1 py-4 rounded-2xl text-sm font-bold text-black bg-white hover:bg-gray-100 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 ${isSaving ? 'opacity-50' : ''}`}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? '正在保存' : '立即保存'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PromptFormModal;