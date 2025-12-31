import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { PromptItem } from '../types';
import { CATEGORY_COLORS } from '../App';

interface MediaGridProps {
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

const GridItem: React.FC<{ item: PromptItem; onSelect: (item: PromptItem) => void }> = ({ item, onSelect }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const colors = CATEGORY_COLORS[item.category];

  const isRealVideo = item.isVideo && item.outputMediaUrl && (
    item.outputMediaUrl.startsWith('data:video') || 
    item.outputMediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)
  );

  const handleMouseEnter = () => {
    if (isRealVideo && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (isRealVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (!item.outputMediaUrl) return null;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(item)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative aspect-[4/5] sm:aspect-[3/4] bg-white/[0.03] rounded-2xl md:rounded-[2rem] overflow-hidden cursor-pointer border ${colors.border} hover:shadow-2xl ${colors.glow} transition-all duration-500`}
    >
      {/* Media Content */}
      {isRealVideo ? (
        <video
          ref={videoRef}
          src={item.outputMediaUrl}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          muted loop playsInline preload="metadata"
        />
      ) : (
        <img 
          src={item.outputMediaUrl} 
          alt={item.title} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
      )}

      {/* Modern Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

      {/* Status Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
        <div className={`w-1.5 h-1.5 rounded-full ${colors.accent} shadow-sm ${colors.glow}`} />
        <span className={`text-[8px] font-bold uppercase tracking-widest ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
          {item.modelUsed || 'AI Model'}
        </span>
      </div>

      {/* Play Icon for Video */}
      {item.isVideo && (
        <div className={`absolute top-3 right-3 w-7 h-7 backdrop-blur-md rounded-full flex items-center justify-center border ${colors.border} bg-black/20 text-white z-10 transition-all duration-300`}>
          <Play size={10} fill="currentColor" className={isPlaying ? 'animate-pulse' : ''} />
        </div>
      )}

      {/* Info Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 z-10">
        <h3 className="text-white font-bold text-sm md:text-lg mb-1 line-clamp-1">{item.title}</h3>
        <div className="flex gap-1.5 flex-wrap overflow-hidden h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
           {item.tags.slice(0, 2).map(tag => (
             <span key={tag} className={`text-[8px] uppercase tracking-tighter px-2 py-0.5 bg-white/10 rounded-full text-gray-300 backdrop-blur-sm border border-white/5`}>
               {tag}
             </span>
           ))}
        </div>
      </div>
    </motion.div>
  );
};

const MediaGrid: React.FC<MediaGridProps> = ({ items, onSelect }) => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 md:gap-8 md:p-8"
    >
      {items.map((item) => (
        <GridItem key={item.id} item={item} onSelect={onSelect} />
      ))}
    </motion.div>
  );
};

export default MediaGrid;