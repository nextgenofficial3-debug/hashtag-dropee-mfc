import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

const MenuPreview: React.FC = () => {
  const { data: settings } = useStoreSettings();
  const menuImages = settings?.menu_images || [];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (menuImages.length === 0) return null;

  const goNext = () => {
    if (selectedIndex !== null) setSelectedIndex((selectedIndex + 1) % menuImages.length);
  };
  const goPrev = () => {
    if (selectedIndex !== null) setSelectedIndex((selectedIndex - 1 + menuImages.length) % menuImages.length);
  };

  return (
    <section className="py-10 md:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold">
            Our <span className="text-primary">Menu</span>
          </h2>
          <div className="mt-2 h-0.5 w-12 mx-auto rounded-full bg-primary/50" />
        </motion.div>

        <div className={`grid gap-3 ${
          menuImages.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' 
          : menuImages.length === 2 ? 'grid-cols-2 max-w-lg mx-auto' 
          : menuImages.length === 3 ? 'grid-cols-2 md:grid-cols-3' 
          : 'grid-cols-2 md:grid-cols-4'
        }`}>
          {menuImages.map((img, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedIndex(i)}
              className="relative rounded-xl overflow-hidden border border-border/50 shadow-md aspect-[3/4] group cursor-pointer"
            >
              <img src={img} alt={`Menu page ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedIndex(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {menuImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 md:left-4 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 md:right-4 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <motion.img
              key={selectedIndex}
              src={menuImages[selectedIndex]}
              alt={`Menu page ${selectedIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-4 text-white/60 text-sm">
              {selectedIndex + 1} / {menuImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default MenuPreview;
