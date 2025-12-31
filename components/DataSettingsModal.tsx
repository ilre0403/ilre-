
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, AlertTriangle, CheckCircle, HardDrive } from 'lucide-react';
import { PromptItem } from '../types';
import { db } from '../services/db';

interface DataSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdate: () => void;
}

const DataSettingsModal: React.FC<DataSettingsModalProps> = ({ isOpen, onClose, onDataUpdate }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMsg(null);
    try {
      const items = await db.getAll();
      const dataStr = JSON.stringify(items, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `Ilre_Backup_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({ type: 'success', text: '备份文件导出成功！' });
    } catch (error) {
      console.error(error);
      setStatusMsg({ type: 'error', text: '导出失败，数据量可能过大。' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsedData = JSON.parse(jsonContent);

        if (!Array.isArray(parsedData)) {
          throw new Error("Invalid format");
        }

        let count = 0;
        for (const item of parsedData) {
          // 修复：只要有 ID、分类和提示词内容即视为有效数据，不再强制要求图片链接
          if (item.id && item.category && item.prompt) {
            await db.save(item as PromptItem);
            count++;
          }
        }

        setStatusMsg({ type: 'success', text: `成功恢复了 ${count} 条数据！` });
        onDataUpdate();
      } catch (error) {
        console.error(error);
        setStatusMsg({ type: 'error', text: '导入失败：文件格式不正确或已损坏。' });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-lg bg-[#121217] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 sticky top-0 z-10 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HardDrive size={20} className="text-accent" />
              数据管理中心
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            
            {/* 1. Backup & Restore */}
            <section className="space-y-4">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">备份与迁移</h3>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleExport}
                    disabled={isExporting || isImporting}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-accent/50 transition-all group disabled:opacity-50"
                  >
                    <Download size={20} className="mb-2 text-green-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-white">导出备份</span>
                  </button>

                  <button 
                    onClick={handleImportClick}
                    disabled={isExporting || isImporting}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-accent/50 transition-all group disabled:opacity-50"
                  >
                    <Upload size={20} className="mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-white">导入恢复</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
               </div>
               <p className="text-[10px] text-gray-500 bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed">
                 温馨提示：备份包含所有分类的提示词（含无图片的通用提示词）。建议定期导出 JSON 文件，以防止浏览器清理 IndexedDB 导致的数据丢失。
               </p>
            </section>

            {/* Status Message */}
            <AnimatePresence>
              {statusMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                    statusMsg.type === 'success' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'
                  }`}
                >
                  {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  {statusMsg.text}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-[10px] text-gray-600 text-center">
              Ilre Local Storage System v1.2.1
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DataSettingsModal;
