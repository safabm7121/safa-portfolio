// components/home/About.tsx
"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Lanyard3D from '@/components/Lanyard3D';
import Folder from '@/components/Folder/Folder';

export function About() {
  const [isMobile, setIsMobile] = useState(false);
  const lanyardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <section className="py-18 lg:py-24 px-4 lg:px-14 w-full">
      <div className="max-w-7xl mx-auto">
        <motion.div
          id="who-i-am"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-l3 text-sm tracking-[0.3em] uppercase mb-4 block border-l-2 border-line pl-4">Who I Am</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-l1">Fashion Designer<br /><span className="text-l2">& Full Stack Developer</span></h2>
              <p className="text-l2 text-lg leading-relaxed mb-6">Hi, I'm Safa! A fashion designer graduated from ESMOD International.</p>
              <p className="text-l2 text-lg leading-relaxed mb-6">It all started with a passion for fashion and a desire to create unique designs.</p>
              <p className="text-l2 text-lg leading-relaxed">I'm a multidisciplinary creative drawn to experimentation and the construction of visual universes.</p>
            </div>

            <div className="relative">
              <div className="absolute top-0 right-0 z-20 cursor-pointer flex flex-col items-center group" onClick={() => window.location.href = '/hobbies'}>
                <Folder color="#ffe9c7" size={1.2} />
                <span className="text-l3 text-[14px] tracking-wider uppercase mt-2 group-hover:text-l1 transition-colors">PASSIONS & HOBBIES</span>
              </div>
              
             <div 
  ref={lanyardContainerRef} 
  className="relative mx-auto overflow-hidden"
  style={{ 
    height: isMobile ? '450px' : '700px',
    width: isMobile ? '280px' : '100%',
  }}
>
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-transparent"><div className="text-center"><div className="w-12 h-12 border-4 border-l1 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-l2 text-sm">Loading 3D Card...</p></div></div>}>
                  <Lanyard3D position={[0, 0, isMobile ? 25 : 20]} gravity={[0, -40, 0]} transparent={true} />
                </Suspense>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}