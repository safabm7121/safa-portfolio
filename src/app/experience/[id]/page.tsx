// app/experience/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ExperienceData {
  id: string;
  title: string;
  company: string;
  period: string;
  location: string;
  description: string;
  fullDescription: string;
  responsibilities: string[];
  achievements: string[];
  images: string[];
  skills: string[];
  hasVideo?: boolean;
  video?: string;
  isSingleImage?: boolean;
}

const experiencesData: Record<string, ExperienceData> = {
  "voidstone-studio": {
    id: "voidstone-studio",
    title: "Founder & Creative Director",
    company: "Voidstone Studio (INORPI-registered)",
    period: "2024 – Present",
    location: "Tunis, Tunisia",
    description: "Independent fashion brand specializing in avant-garde, alternative, and gothic aesthetics. Full creative direction from concept to production. Currently developing an e-commerce platform using microservice architecture.",
    fullDescription: "As the founder of Voidstone Studio, I built a brand from the ground up that merges dark aesthetics with wearable art. This journey involved everything from initial concept development to final production and now expanding into e-commerce. The brand represents my vision of fashion as a form of self-expression and artistic exploration.",
    responsibilities: [
      "Creative direction for all collections and brand identity",
      "Design and development of avant-garde fashion pieces",
      "E-commerce platform web development using microservice architecture",
      "Brand strategy and market positioning",
      "Supplier relationship management"
    ],
    achievements: [
      "Successfully launched 3 collections (2024-2026)",
      "Developed custom e-commerce platform from scratch fully coded by myself",
      "Featured in local fashion publications (Tangerine, ESMOD Tunis, Pretty Little Talent Academy)",
      "Organized a fashion show in Paris Fashion Week through Pretty Little Talent Academy"
    ],
    images: [],
    skills: ["Creative Direction", "Brand Strategy", "Full Stack Dev", "Collection Development"],
    hasVideo: false
  },
  "ofla-turki": {
    id: "ofla-turki",
    title: "Creative Designer",
    company: "Ofla Turki",
    period: "Jun 2023 – Dec 2023 & Freelance 2026",
    location: "Tunis, Tunisia",
    description: "Led end-to-end development of multiple top-selling collections. Oversaw design process from concept to final production.",
    fullDescription: "At Ofla Turki, I led the design team through multiple seasonal collections, from initial concept to final production. I managed supplier relationships and ensured quality control throughout the production process. My work focused on creating innovative designs that balanced creativity with commercial viability.",
    responsibilities: [
      "Led design team for seasonal collections",
      "Managed supplier relationships and production timelines",
      "Created technical specifications and production sheets",
      "Quality control and final product approval"
    ],
    achievements: [
      "Increased collection sales by 40%",
      "Reduced production costs by 25% through recycling old materials that were never used in the past",
      "Successfully launched 3 best-selling wedding collections"
    ],
    images: [],
    skills: ["Team Leadership", "Production Management", "Technical Design", "Quality Control"],
    hasVideo: false
  },
  "la-flamme": {
    id: "la-flamme",
    title: "Illustrator & Concept Designer",
    company: "La Flamme",
    period: "Aug 2024 – Feb 2025",
    location: "Soukra, Tunisia",
    description: "Created concept illustrations and developed visual identity for brand collections.",
    fullDescription: "Worked with La Flamme to develop their brand identity through illustrations and concept designs that captured their unique aesthetic. My role involved translating abstract ideas into visual concepts that could be realized in textile and garment form.",
    responsibilities: [
      "Created original concept illustrations for collections",
      "Developed brand visual identity guidelines",
      "Designed textile materials and lookbooks",
      "Collaborated with marketing team on brand storytelling"
    ],
    achievements: [
      "Created illustrations for 4 successful campaigns",
      "Organized an art exhibition with La Flamme team in Hammamet, presenting the brand's concept",
      "Featured in industry publications",
      "Had direct contact with the atelier where I fixed any incorrect pattern and explained in detail the way certain designs were conceptualized"
    ],
    images: ["https://i.postimg.cc/PqhZXqv8/laflamme1.jpg","https://i.postimg.cc/k598J5RR/laflamme2.jpg","https://i.postimg.cc/R09fS0J3/laflamme3.jpg","https://i.postimg.cc/cJZYxJtR/laflamme4.jpg","https://i.postimg.cc/1zP6mzV0/laflamme6.jpg"],
    skills: ["Illustration", "Brand Identity", "Adobe Creative Suite", "Concept Development"],
    hasVideo: false
  },
  "freelance-costume": {
    id: "freelance-costume",
    title: "Freelance Costume Designer",
    company: "Various Projects",
    period: "2025 – Present",
    location: "Tunis, Tunisia",
    description: "Custom costume design for theatrical productions, drag performances, and private commissions. First Prize winner - National Drag Competition.",
    fullDescription: "As a freelance costume designer, I've worked with diverse clients on unique projects ranging from theatrical productions to drag performances. Each project presents an opportunity to push creative boundaries and bring characters to life through costume design.",
    responsibilities: [
      "Custom costume design for diverse clients",
      "Theatrical and performance wear creation",
      "Fabric sourcing and material selection",
      "Fittings and alterations"
    ],
    achievements: [
      "First Prize winner - National Drag Competition",
      "Designed costumes for theatrical performances",
      "Featured in local theater productions"
    ],
    images: [],
    skills: ["Costume Design", "Pattern Making", "Fabric Sourcing", "Performance Wear"],
    hasVideo: false
  },
  "vivienne-westwood": {
    id: "vivienne-westwood",
    title: "Backstage Organizer",
    company: "Vivienne Westwood Archive Fashion Show",
    period: "November 2024",
    location: "Tunis, Tunisia (Sidi Bou Said)",
    description: "Honored to participate in the Vivienne Westwood fashion show backstage, dressing and managing models, ironing archive garments, and organizing accessories.",
    fullDescription: "I had the honor of participating in the Vivienne Westwood archive fashion show in Tunis, working backstage. This was an incredible opportunity to work with garments from one of fashion's most iconic designers. Being backstage allowed me to see firsthand how a high-end fashion show operates and to contribute to the successful execution of the event.",
    responsibilities: [
      "Coordinating with the Vivienne Westwood team",
      "Ironing the archive collections",
      "Managing models",
      "Fittings and alterations",
      "Organizing accessories"
    ],
    achievements: [
      "Successful show execution",
      "Positive feedback from the Vivienne Westwood team",
      "Gained invaluable experience working with archive pieces"
    ],
    images: ["https://i.postimg.cc/43qYKNmL/IMG-1585.avif","https://i.postimg.cc/pd4m9XpJ/IMG-1587.avif","https://i.postimg.cc/s2vBDZDM/IMG-1594.avif","https://i.postimg.cc/7LfCYTYz/IMG-1595.avif","https://i.postimg.cc/43mKNhNn/IMG-1604.avif","https://i.postimg.cc/5t6HNFNB/IMG-1607.avif"],
    skills: ["Event Coordination", "Fashion Show Production", "Garment Care", "Model Management"],
    hasVideo: false
  },
  "voidstone-paris-fashion-week": {
    id: "voidstone-paris-fashion-week",
    title: "Voidstone Paris Fashion Week 2025",
    company: "VOIDSTONE STUDIO",
    period: "2025",
    location: "Paris, France",
    description: "Participated in Paris Fashion Week 2025, showcasing the VOIDSTONE STUDIO collection. Managed all aspects of the show, including model coordination, backstage organization, and presentation of alternative designs, through Pretty Talent Academy.",
    fullDescription: "I had the incredible opportunity to showcase VOIDSTONE STUDIO at Paris Fashion Week 2025 through Pretty Talent Academy. This was a milestone moment for my brand, presenting my avant-garde and alternative designs on one of the most prestigious fashion stages in the world. I managed every aspect of the show from concept to execution, including model casting, backstage coordination, and the overall presentation of the collection. The experience was transformative, allowing me to network with industry professionals and gain invaluable exposure for my brand.",
    responsibilities: [
      "Full creative direction for the Paris Fashion Week show",
      "Model casting and coordination",
      "Backstage organization and management",
      "Collection presentation and styling",
      "Collaboration with Pretty Talent Academy team"
    ],
    achievements: [
      "Successfully showcased VOIDSTONE STUDIO at Paris Fashion Week 2025",
      "Received positive feedback from industry professionals",
      "Expanded brand visibility on an international stage",
      "Networked with key players in the fashion industry"
    ],
    images: ["https://i.postimg.cc/YSkgrSLG/voidstone.jpg"],
    video: "https://videotourl.com/videos/1783868543764-a4ff2003-483d-48af-9ac2-d504ee4d02e1.mov",
    skills: ["Fashion Show Production", "Creative Direction", "Model Management", "Event Coordination", "Brand Presentation"],
    hasVideo: true,
    isSingleImage: true
  }
};

export default function ExperienceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [experience, setExperience] = useState<ExperienceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const foundExp = experiencesData[id as string];
    if (foundExp) {
      setExperience(foundExp);
      setLoading(false);
      window.scrollTo(0, 0);
    } else {
      router.push('/');
    }
  }, [id, router]);

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
    if (!experience) return;
    setLightboxIndex(index);
    setLightboxImage(experience.images[index]);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const nextImage = () => {
    if (!experience || lightboxIndex >= experience.images.length - 1) return;
    const newIndex = lightboxIndex + 1;
    setLightboxIndex(newIndex);
    setLightboxImage(experience.images[newIndex]);
  };

  const prevImage = () => {
    if (!experience || lightboxIndex <= 0) return;
    const newIndex = lightboxIndex - 1;
    setLightboxIndex(newIndex);
    setLightboxImage(experience.images[newIndex]);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-b1 flex items-center justify-center">
        <div className="text-l2 animate-pulse text-2xl">LOADING...</div>
      </div>
    );
  }

  if (!experience) return null;

  return (
    <div className="min-h-screen  pt-24 pb-16 px-4 md:px-8">
      

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl md:text-6xl font-display font-bold text-l1 mb-4">
            {experience.title}
          </h1>
          <p className="text-l2 text-lg mb-2">{experience.company}</p>
          <div className="flex justify-center gap-4 text-l3 text-sm">
            <span>{experience.period}</span>
            <span>•</span>
            <span>{experience.location}</span>
          </div>
        </motion.div>

        {experience.images && experience.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            {experience.isSingleImage ? (
              <div className="flex justify-center">
                <img
                  src={experience.images[0]}
                  alt={experience.title}
                  className="max-h-[500px] w-auto object-contain rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                  onClick={() => openLightbox(0)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experience.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${experience.title} ${idx + 1}`}
                    className="w-full h-64 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    onClick={() => openLightbox(idx)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {lightboxImage && (
          <div 
            className="fixed inset-0 z-[100] bg-b1/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button 
              className="absolute top-4 right-4 text-l1 text-4xl hover:text-l1/70 transition-colors z-10"
              onClick={closeLightbox}
            >
              ✕
            </button>
            
            {experience.images.length > 1 && (
              <>
                <button 
                  className="absolute left-4 text-l1 text-4xl hover:text-l1/70 transition-colors z-10 disabled:opacity-30"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  disabled={lightboxIndex === 0}
                >
                  ‹
                </button>
                
                <button 
                  className="absolute right-4 text-l1 text-4xl hover:text-l1/70 transition-colors z-10 disabled:opacity-30"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  disabled={lightboxIndex === experience.images.length - 1}
                >
                  ›
                </button>
              </>
            )}
            
            <img 
              src={lightboxImage}
              alt="Experience image"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {experience.hasVideo && experience.video && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-12 flex justify-center"
          >
            <div className="w-1/2 max-w-2xl min-w-[280px]">
              <video
                src={experience.video}
                controls
                autoPlay
                muted
                playsInline
                className="w-full rounded-lg"
                poster={experience.images?.[0]}
              />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-display font-bold text-l1 mb-4 border-b border-line pb-2">
            Overview
          </h2>
          <p className="text-l2 text-lg leading-relaxed">
            {experience.fullDescription || experience.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-b1/5 border border-line rounded-lg p-6"
          >
            <h2 className="text-xl font-bold text-l1 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-l3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Key Responsibilities
            </h2>
            <ul className="space-y-2">
              {experience.responsibilities.map((resp, idx) => (
                <li key={idx} className="text-l3 text-sm flex items-start gap-2">
                  <span className="text-l3 mt-1">•</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-b1/5 border border-line rounded-lg p-6"
          >
            <h2 className="text-xl font-bold text-l1 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-l3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Key Achievements
            </h2>
            <ul className="space-y-2">
              {experience.achievements.map((ach, idx) => (
                <li key={idx} className="text-l3 text-sm flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{ach}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="text-xl font-bold text-l1 mb-4">Skills & Expertise</h2>
          <div className="flex flex-wrap gap-3">
            {experience.skills.map((skill, idx) => (
              <span key={idx} className="px-4 py-2 bg-b1/10 border border-line text-l2 text-sm rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}