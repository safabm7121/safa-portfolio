// components/home/About.tsx
"use client";

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Lanyard3D from '@/components/Lanyard3D';
import Folder from '@/components/Folder/Folder';

export function About() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="py-18 lg:py-24 px-4 lg:px-14 w-full">
      <div className="max-w-7xl mx-auto">
        {/* ===== WHO I AM ===== */}
        <motion.div
          id="who-i-am"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div>
              <span className="text-l3 text-sm tracking-[0.3em] uppercase mb-4 block border-l-2 border-line pl-4">
                Who I Am
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-l1">
                Fashion Designer
                <br />
                <span className="text-l2">& Full Stack Developer</span>
              </h2>
              <p className="text-l2 text-lg leading-relaxed mb-6">
                Hi, I'm Safa! A fashion designer graduated from ESMOD International, 
                currently working on developing my own fashion brand, Voidstone Studio.
              </p>
              <p className="text-l2 text-lg leading-relaxed mb-6">
                It all started with a passion for fashion and a desire to create unique, 
                avant-garde/alternative designs.
              </p>
              <p className="text-l2 text-lg leading-relaxed">
                I'm interested in pushing materials beyond their usual context, creating garments 
                that challenge how they sit on the body and how they're perceived. I'm a 
                multidisciplinary creative drawn to experimentation, the avant-garde, and the 
                construction of visual universes.
              </p>
            </div>

            {/* Right - Lanyard */}
            <div className="relative h-[500px] md:h-[600px] lg:h-[700px]">
              <div 
                className="absolute top-4 right-4 z-20 cursor-pointer flex flex-col items-center group"
                onClick={() => window.location.href = '/hobbies'}
              >
                <Folder color="#ffe9c7" size={1.2} />
                <span className="text-l3 text-[14px] tracking-wider uppercase mt-2 group-hover:text-l1 transition-colors">
                  PASSIONS & HOBBIES
                </span>
              </div>
              
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center bg-b1/40 rounded-2xl border border-line">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-l1 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-l2 text-sm">Loading 3D Card...</p>
                  </div>
                </div>
              }>
                <Lanyard3D 
                  position={[0, 0, isMobile ? 25 : 20]} 
                  gravity={[0, -40, 0]} 
                />
              </Suspense>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}