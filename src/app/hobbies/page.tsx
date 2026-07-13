// app/hobbies/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const hobbyImages = [
  { url: "https://i.postimg.cc/T3ktMMR8/1.jpg", caption: "Singing" },
  { url: "https://i.postimg.cc/Bnhm99q3/2.jpg", caption: "3D doll making after I modeled it in Nomad Sculpt" },
  { url: "https://i.postimg.cc/nhd3bbHf/3.jpg", caption: "Chess" },
  { url: "https://i.postimg.cc/FHFTBsQN/4.jpg", caption: "Drums" },
  { url: "https://i.postimg.cc/x1s6DD9W/5.jpg", caption: "Guitar by the beach under the sunset" },
  { url: "https://i.postimg.cc/FHPT5594/6.jpg", caption: "Training daily is a form of self-care" },
  { url: "https://i.postimg.cc/htC2WWSK/7.jpg", caption: "Music sheets in class" },
  { url: "https://i.postimg.cc/9frJc8MJ/8.jpg", caption: "Core childhood memory" },
  { url: "https://i.postimg.cc/g0nNGSJS/9.jpg", caption: "Wood carving" },
  { url: "https://i.postimg.cc/TPpCT7wk/10.jpg", caption: "Clay modeling" }
];

export default function HobbiesPage() {
  const [lightboxImage, setLightboxImage] = useState<typeof hobbyImages[0] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxImage) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, lightboxIndex]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxImage(hobbyImages[index]);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const nextImage = () => {
    if (lightboxIndex < hobbyImages.length - 1) {
      const newIndex = lightboxIndex + 1;
      setLightboxIndex(newIndex);
      setLightboxImage(hobbyImages[newIndex]);
    }
  };

  const prevImage = () => {
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1;
      setLightboxIndex(newIndex);
      setLightboxImage(hobbyImages[newIndex]);
    }
  };

  return (
    <div className="min-h-screen bg-b1 pt-24 pb-16 px-4 md:px-8">
      <div className="fixed top-0 left-0 right-0 z-40 p-4 md:p-6 bg-b1/90 backdrop-blur-sm border-b border-line">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1 md:gap-2 text-l2 hover:text-l1 transition-colors group text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            BACK TO HOME
          </Link>
          
          <h1 className="text-l1 text-sm md:text-base tracking-wider">PASSIONS & HOBBIES</h1>
          
          <Link href="/" className="text-l3 hover:text-l1 text-xs md:text-sm tracking-wider transition-colors">
            HOME
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-display font-bold text-l1 mb-4">
            Passions & Hobbies
          </h1>
          <p className="text-l2 text-sm md:text-base max-w-2xl mx-auto">
            A glimpse into the curiosities and passions that shape who I am beyond fashion and code.
          </p>
        </motion.div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {hobbyImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.03, 0.5) }}
              className="break-inside-avoid mb-4 relative z-20 cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <div className="relative overflow-hidden rounded-lg border border-line">
                <img 
                  src={image.url}
                  alt={image.caption}
                  className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white text-xs text-center tracking-wide">
                    {image.caption}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {lightboxImage && (
        <div 
          className="fixed inset-0 z-40 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button 
            className="absolute top-4 right-4 text-white text-4xl hover:text-white/70 transition-colors cursor-pointer"
            onClick={closeLightbox}
          >
            ✕
          </button>
          
          <button 
            className="absolute left-4 text-white text-4xl hover:text-white/70 transition-colors disabled:opacity-30 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            disabled={lightboxIndex === 0}
          >
            ‹
          </button>
          
          <img 
            src={lightboxImage.url}
            alt={lightboxImage.caption}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          
          <button 
            className="absolute right-4 text-white text-4xl hover:text-white/70 transition-colors disabled:opacity-30 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            disabled={lightboxIndex === hobbyImages.length - 1}
          >
            ›
          </button>
          
          {lightboxImage.caption && (
            <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
              {lightboxImage.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}