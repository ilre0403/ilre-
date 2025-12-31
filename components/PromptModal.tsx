import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Edit, Trash2, Download, AlertCircle, FolderOpen, Quote } from 'lucide-react';
import { PromptItem } from '../types';

interface PromptModalProps {
  item: PromptItem | null;
  onClose: () => void;
  onEdit: (item: PromptItem) => void;
  onDelete: (id: string) => void;
}

const PromptModal: React.FC<PromptModalProps> = ({ item, onClose, onEdit, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [pathCopied, setPathCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDeleting) {
      // Confirmed
      onDelete(item.id);
      onClose();
    } else {
      // First click - show confirmation
      setIsDeleting(true);
      // Auto reset if no action taken
      setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  const handleDownloadMedia = () => {
    if (!item.outputMediaUrl) return;
    
    const link = document.createElement('a');
    link.href = item.outputMediaUrl;
    
    // Determine extension logic suitable for base64 or urls
    let ext = 'png';
    if (item.isVideo) ext = 'mp4';
    if (item.outputMediaUrl.startsWith('data:image/jpeg')) ext = 'jpg';
    if (item.outputMediaUrl.startsWith('data:image/webp')) ext = 'webp';
    
    // Clean title for filename
    const safeTitle = (item.title || 'media').replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
    link.download = `${safeTitle}.${ext}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if it's a local path
  const isLocalPath = item.outputMediaUrl && 
    !item.outputMediaUrl.startsWith('http') && 
    !item.outputMediaUrl.startsWith('data:') && 
    !item.outputMediaUrl.startsWith('blob:');

  const handleOpenFolder = () => {
    if (!item.outputMediaUrl) return;
    
    navigator.clipboard.writeText(item.outputMediaUrl)
      .then(() => {
        setPathCopied(true);
        setTimeout(() => setPathCopied(false), 4000);
      })
      .catch(err => console.error("Clipboard write failed", err));
    
    try {
      let urlToOpen = item.outputMediaUrl;
      const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(urlToOpen);
      if (!hasProtocol) {
         urlToOpen = 'file://' + (urlToOpen.startsWith('/') ? '' : '/') + urlToOpen;
      }
      window.open(urlToOpen, '_blank');
    } catch (e) {
      console.warn("Direct file access blocked by browser security:", e);
    }
  };

  const hasMedia = !!item.outputMediaUrl;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`
               relative w-full bg-[#121217] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]
               ${hasMedia ? 'max-w-5xl md:flex-row' : 'max-w-2xl'}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Media Section (Conditionally Rendered) */}
            {hasMedia && (
              <div className="w-full md:w-1/2 bg-black flex flex-col items-center justify-center relative overflow-hidden group min-h-[300px]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0" />
                
                {item.inputMediaUrl && (
                  <div className="absolute top-4 left-4 z-10 w-24 h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-black">
                     <img src={item.inputMediaUrl} alt="Input" className="w-full h-full object-cover opacity-80" />
                     <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-center text-white py-1">输入参考图</div>
                  </div>
                )}

                {item.isVideo ? (
                   <video 
                     src={item.outputMediaUrl} 
                     className="w-full h-full object-contain" 
                     controls 
                     autoPlay 
                     loop 
                     muted 
                   />
                ) : (
                  <img 
                    src={item.outputMediaUrl} 
                    alt={item.title} 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}

            {/* Content Section */}
            <div className={`w-full flex flex-col p-6 md:p-8 overflow-y-auto custom-scrollbar ${hasMedia ? 'md:w-1/2' : ''}`}>
              
              {/* Actions Bar */}
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium uppercase tracking-wider bg-white/5 border border-white/10 rounded text-gray-400">
                      {item.modelUsed || '通用'}
                    </span>
                    {item.isVideo && (
                      <span className="px-2 py-1 text-xs font-medium uppercase tracking-wider bg-accent/20 border border-accent/30 text-accent rounded">
                        视频
                      </span>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-1">
                    {/* File/Folder Actions (Only if media exists) */}
                    {hasMedia && isLocalPath && (
                      <div className="relative">
                        <button 
                          onClick={handleOpenFolder}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="尝试打开文件夹"
                        >
                          {pathCopied ? <Check size={16} className="text-blue-400" /> : <FolderOpen size={16} />}
                        </button>
                      </div>
                    )}

                    {hasMedia && (
                      <button 
                        onClick={handleDownloadMedia} 
                        className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        title="下载"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => onEdit(item)} 
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button 
                      onClick={handleDeleteClick} 
                      className={`flex items-center gap-1 p-2 rounded-lg transition-all ${
                        isDeleting 
                          ? 'bg-red-500 text-white w-auto px-3' 
                          : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title="删除"
                    >
                      {isDeleting ? (
                        <>
                           <AlertCircle size={16} />
                           <span className="text-xs font-bold whitespace-nowrap">确认?</span>
                        </>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                 </div>
              </div>

              {/* Header Decoration for No-Media */}
              {!hasMedia && (
                <div className="mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-4">
                     <Quote size={24} />
                  </div>
                </div>
              )}

              <h2 className="text-3xl font-bold text-white mb-6 font-sans leading-tight">{item.title}</h2>

              {/* Main Prompt */}
              <div className="space-y-4 mb-6 flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">提示词</h3>
                  <button
                    onClick={() => handleCopy(item.prompt)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <div className={`
                  p-5 rounded-xl bg-white/5 border border-white/10 text-gray-200 font-mono text-sm leading-relaxed overflow-y-auto custom-scrollbar
                  ${hasMedia ? 'max-h-48' : 'max-h-[50vh] text-base'}
                `}>
                  {item.prompt}
                </div>
              </div>

              {/* Remarks */}
              {item.negativePrompt && (
                <div className="space-y-2 mb-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">备注</h3>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-sans text-xs">
                    {item.negativePrompt}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-auto pt-6 border-t border-white/10">
                {item.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 text-xs rounded-full bg-white/5 hover:bg-white/10 text-gray-400 transition-colors cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromptModal;