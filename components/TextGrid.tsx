import React from 'react';
import { motion } from 'framer-motion';
import { Type } from 'lucide-react';
import { PromptItem } from '../types';
import { CATEGORY_COLORS } from '../App';

interface TextGridProps {
  items: PromptItem[];
  onSelect: (item: PromptItem) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 120, damping: 20 }
  }
};

const TextGridItem: React.FC<{ item: PromptItem; onSelect: (item: PromptItem) => void }> = ({ item, onSelect }) => {
  const colors = CATEGORY_COLORS[item.category];
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(item)}
      className={`group relative bg-white/[0.03] rounded-2xl md:rounded-[2rem] p-5 md:p-7 cursor-pointer border ${colors.border} hover:shadow-2xl ${colors.glow} transition-all duration-500 h-40 md:h-56 flex flex-col justify-between overflow-hidden`}
    >
      {/* Subtle Background Glow */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 bg-white/05 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-700`} />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
           <div className={`p-2 rounded-xl bg-white/5 ${colors.text} group-hover:scale-110 transition-transform`}>
              <Type size={16} strokeWidth={3} />
           </div>
           {item.tags.length > 0 && (
             <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-gray-500 font-bold uppercase tracking-widest border border-white/5">
               {item.tags[0]}
             </span>
           )}
        </div>
        
        <h3 className="text-sm md:text-xl font-bold text-white group-hover:text-amber-50 transition-colors line-clamp-2 leading-tight pr-2">
          {item.title}
        </h3>
      </div>

      <div className="relative z-10 pt-4 border-t border-white/5 mt-auto">
        <p className={`text-[10px] font-mono line-clamp-1 transition-colors duration-500 ${colors.text} opacity-60 group-hover:opacity-100`}>
          {item.prompt}
        </p>
      </div>
    </motion.div>
  );
};

const TextGrid: React.FC<TextGridProps> = ({ items, onSelect }) => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 md:gap-8 md:p-8"
    >
      {items.map((item) => (
        <TextGridItem key={item.id} item={item} onSelect={onSelect} />
      ))}
    </motion.div>
  );
};

export default TextGrid;