import React, { useState, useMemo, useEffect } from 'react';
import { LayoutGrid, Image as ImageIcon, Video, Wand2, Database, Search, Plus, Loader2, HardDrive, AlertTriangle, Settings, FilePlus, Lightbulb, FileText } from 'lucide-react';
import { CATEGORIES, CategoryType, PromptItem } from './types';
import MediaGrid from './components/MediaGrid';
import TextGrid from './components/TextGrid';
import PromptModal from './components/PromptModal';
import PromptFormModal from './components/PromptFormModal';
import DataSettingsModal from './components/DataSettingsModal';
import { db } from './services/db';

const formatBytes = (bytes: number, decimals = 1) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Pastel Color Mapping for Categories
export const CATEGORY_COLORS: Record<CategoryType, { bg: string; text: string; border: string; glow: string; accent: string }> = {
  'txt2img': { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/20', glow: 'shadow-rose-500/10', accent: 'bg-rose-400' },
  'img2img': { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/20', glow: 'shadow-sky-500/10', accent: 'bg-sky-400' },
  'img2vid': { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/20', glow: 'shadow-amber-500/10', accent: 'bg-amber-400' },
  'txt2vid': { bg: 'bg-violet-500/10', text: 'text-violet-300', border: 'border-violet-500/20', glow: 'shadow-violet-500/10', accent: 'bg-violet-400' },
  'general': { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10', accent: 'bg-emerald-400' },
};

const App: React.FC = () => {
  const [items, setItems] = useState<PromptItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('txt2img');
  const [selectedItem, setSelectedItem] = useState<PromptItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [storageStats, setStorageStats] = useState<{ usage: number; quota: number } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PromptItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const updateStorageStats = async () => {
    const stats = await db.getStorageUsage();
    if (stats) setStorageStats(stats);
  };

  const loadData = async (forceReset = false) => {
    setIsLoading(true);
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }
    try {
      const storedItems = await db.getAll();
      if (forceReset) {
         await db.clear();
         setItems([]);
      } else {
        setItems(storedItems);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
      updateStorageStats();
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = item.category === activeCategory;
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, searchQuery]);

  const handleSaveItem = async (itemData: PromptItem) => {
    if (editingItem) {
      setItems(prev => prev.map(item => item.id === itemData.id ? itemData : item));
      if (selectedItem?.id === itemData.id) setSelectedItem(itemData);
    } else {
      const newItem = { ...itemData, id: Date.now().toString() };
      itemData = newItem;
      setItems(prev => [newItem, ...prev]);
    }
    setEditingItem(null);
    try {
      await db.save(itemData);
      updateStorageStats();
    } catch (error) {
      console.error("Save error:", error);
      alert("保存失败，存储空间可能不足");
    }
  };

  const handleDeleteItem = async (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    try {
      await db.delete(id);
      updateStorageStats();
    } catch (error) {}
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditModal = (item: PromptItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
    setSelectedItem(null);
  };

  const getIcon = (id: CategoryType, size = 16) => {
    switch (id) {
      case 'txt2img': return <ImageIcon size={size} />;
      case 'img2img': return <LayoutGrid size={size} />;
      case 'img2vid': return <Video size={size} />;
      case 'txt2vid': return <Wand2 size={size} />;
      case 'general': return <FileText size={size} />;
      default: return <Database size={size} />;
    }
  };

  const currentColors = CATEGORY_COLORS[activeCategory];

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans selection:bg-rose-500/30 selection:text-white">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000 ${currentColors.bg.replace('10', '05')}`} />
        <div className="absolute top-[30%] -right-[5%] w-[30%] h-[30%] bg-blue-900/05 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col h-screen">
        
        {/* Header */}
        <header className="flex-none px-4 py-4 md:px-8 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 bg-[#09090b]/60 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center justify-between w-full md:w-auto">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 md:w-11 md:h-11 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group overflow-hidden relative">
                  <div className={`absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity ${currentColors.bg}`} />
                  <Lightbulb className={`relative z-10 transition-colors duration-500 ${currentColors.text}`} size={20} />
               </div>
               <div>
                 <div className="flex items-center gap-2">
                   <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">Ilre</h1>
                   {storageStats && (
                      <div className="flex items-center gap-1 text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-gray-500">
                         <span>{formatBytes(storageStats.usage, 0)}</span>
                      </div>
                   )}
                 </div>
                 <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Vault v2.0</p>
               </div>
             </div>
             <button onClick={() => setIsSettingsOpen(true)} className="md:hidden p-2 text-gray-500">
                <Settings size={20} />
             </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600 group-focus-within:text-gray-300 transition-colors" />
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-white/5 rounded-xl bg-white/5 text-gray-300 placeholder-gray-600 focus:outline-none focus:bg-white/10 focus:border-white/10 text-xs transition-all"
                placeholder="搜索您的咒语..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSettingsOpen(true)} className="hidden md:flex items-center justify-center w-9 h-9 bg-white/5 text-gray-500 hover:text-white rounded-xl border border-white/5 transition-colors">
                <Settings size={18} />
              </button>
              <button 
                onClick={openCreateModal}
                className="flex items-center justify-center h-9 px-4 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl shadow-white/5 active:scale-95"
              >
                <Plus size={16} className="mr-1.5" />
                <span>新建</span>
              </button>
            </div>
          </div>
        </header>

        {/* Category Tabs */}
        <nav className="flex-none px-0 md:px-8 border-b border-white/5 bg-[#09090b]/40">
          <div className="flex overflow-x-auto no-scrollbar px-4 py-3 md:py-4 gap-2 snap-x">
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              const catColors = CATEGORY_COLORS[cat.id];
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border
                    ${isSelected 
                      ? `${catColors.bg} ${catColors.text} ${catColors.border} shadow-lg shadow-black/20 scale-105` 
                      : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'}
                  `}
                >
                  <span className={isSelected ? 'animate-pulse' : ''}>{getIcon(cat.id, 14)}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
            <div className="w-4 flex-shrink-0 md:hidden" />
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-grow overflow-y-auto">
          <div className="max-w-7xl mx-auto">
             {isLoading ? (
               <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                 <Loader2 size={24} className="mb-4 animate-spin" />
                 <p className="text-[10px] uppercase tracking-widest">Accessing IndexedDB...</p>
               </div>
             ) : filteredItems.length > 0 ? (
                activeCategory === 'general' ? (
                   <TextGrid items={filteredItems} onSelect={setSelectedItem} />
                ) : (
                   <MediaGrid items={filteredItems} onSelect={setSelectedItem} />
                )
             ) : (
               <div className="flex flex-col items-center justify-center py-24 text-gray-600 mx-4">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 border border-white/5 bg-white/[0.02] ${currentColors.text}`}>
                    {getIcon(activeCategory, 32)}
                  </div>
                  <h3 className="text-sm font-bold text-gray-400 mb-1">暂无内容</h3>
                  <p className="text-[10px] text-gray-600 mb-8 max-w-[200px] text-center">在这里记录您的第一个 {CATEGORIES.find(c => c.id === activeCategory)?.label} 提示词</p>
                  <button onClick={openCreateModal} className={`px-6 py-2 rounded-xl text-xs font-bold border transition-all ${currentColors.bg} ${currentColors.text} ${currentColors.border} hover:brightness-125`}>
                    立即创建
                  </button>
               </div>
             )}
             <div className="h-24" />
          </div>
        </main>
      </div>

      <PromptModal item={selectedItem} onClose={() => setSelectedItem(null)} onEdit={openEditModal} onDelete={handleDeleteItem} />
      <PromptFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSaveItem} initialData={editingItem} />
      <DataSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onDataUpdate={() => loadData(false)} />
    </div>
  );
};

export default App;