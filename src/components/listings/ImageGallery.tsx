import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, Play } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface ImageGalleryProps {
  images: string[];
  videoUrl?: string;
  title: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, videoUrl, title }) => {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const allMedia = [...(videoUrl ? ['__video__'] : []), ...images];
  const total = allMedia.length;

  const prev = () => setCurrent(c => (c - 1 + total) % total);
  const next = () => setCurrent(c => (c + 1) % total);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') setLightboxOpen(false);
  };

  const currentMedia = allMedia[current];
  const isVideo = currentMedia === '__video__';

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[4/3] cursor-zoom-in"
        onClick={() => !isVideo && setLightboxOpen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {isVideo ? (
              <div className="relative w-full h-full">
                {showVideo ? (
                  <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center bg-slate-900 cursor-pointer"
                    onClick={() => setShowVideo(true)}
                  >
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                      <Play size={28} className="text-white ml-1" />
                    </div>
                    <span className="text-white text-sm">Watch Video</span>
                  </div>
                )}
              </div>
            ) : (
              <img
                src={currentMedia}
                alt={`${title} - ${current + 1}`}
                className="w-full h-full object-cover"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {current + 1} / {total}
            </div>
          </>
        )}

        {!isVideo && (
          <button
            onClick={e => { e.stopPropagation(); setLightboxOpen(true); }}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <ZoomIn size={15} />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {allMedia.map((media, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrent(idx); setShowVideo(false); }}
              className={cn(
                'relative w-16 h-16 rounded-xl overflow-hidden shrink-0 transition-all',
                idx === current
                  ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-800'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              {media === '__video__' ? (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                  <Play size={16} className="text-white" />
                </div>
              ) : (
                <img src={media} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && !isVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={20} />
            </button>

            <motion.img
              key={current}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={images[videoUrl ? current - 1 : current]}
              alt={title}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={e => e.stopPropagation()}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGallery;
