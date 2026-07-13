// components/home/ExperiencePage.tsx
"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';

const experiences = [
  {
    id: "voidstone-studio",
    title: "Founder & Creative Director",
    company: "Voidstone Studio (INORPI-registered)",
    period: "2024 – Present",
    description: "Independent fashion brand specializing in avant-garde, alternative, and gothic aesthetics. Full creative direction from concept to production. Currently developing an e-commerce platform using microservice architecture."
  },
  {
    id: "ofla-turki",
    title: "Creative Designer",
    company: "Ofla Turki",
    period: "Jun 2023 – Dec 2023 & Freelance 2026",
    description: "Led end-to-end development of multiple top-selling collections. Oversaw design process from concept to final production, managing cross-functional teams and supplier relationships."
  },
  {
    id: "la-flamme",
    title: "Illustrator & Concept Designer",
    company: "La Flamme",
    period: "Aug 2024 – Feb 2025",
    description: "Created concept illustrations and developed visual identity for brand collections. Collaborated on marketing materials, lookbooks, and brand storytelling."
  },
  {
    id: "freelance-costume",
    title: "Freelance Costume Designer",
    company: "Various Projects",
    period: "2025 – Present",
    description: "Custom costume design for theatrical productions, drag performances, and private commissions. First Prize winner - National Drag Competition."
  },
  {
    id: "vivienne-westwood",
    title: "Vivienne Westwood Backstage Organizer",
    company: "Vivienne Westwood Archive Fashion Show",
    period: "November 2024",
    description: "Honored to participate in the Vivienne Westwood fashion show backstage, dressing and managing models, ironing archive garments, and organizing accessories."
  },
  {
    id: "voidstone-paris-fashion-week",
    title: "Voidstone Paris Fashion Week 2025",
    company: "VOIDSTONE STUDIO",
    period: "2025",
    description: "Participated in Paris Fashion Week 2025, showcasing the VOIDSTONE STUDIO collection. Managed all aspects of the show, including model coordination, backstage organization, and presentation of alternative designs, through Pretty Talent Academy."
  }
];

const education = [
  {
    degree: "Bachelor Level Certificate in Fashion Design",
    school: "ESMOD International",
    period: "2020–2023",
    details: "Womenswear, Menswear, Lingerie, Textile Art, Color Theory, Pattern Making, Draping, Collection Development"
  },
  {
    degree: "Full Stack Web Development",
    school: "GoMyCode",
    period: "2026",
    details: "Microservice Architecture • Node.js • TypeScript • React.js • MongoDB • PostgreSQL • Docker • Jenkins • Socket.IO"
  },
  {
    degree: "Jewelry Design (Brass & Silver)",
    school: "Learnova Academy",
    period: "2025",
    details: "Metal smithing, stone setting, wax carving, finishing techniques, jewelry collection development"
  },
  {
    degree: "Videography & Video Editing",
    school: "Three Alpha Formation",
    period: "2024",
    details: "Adobe Premiere Pro, After Effects, DaVinci Resolve, motion graphics, color grading"
  },
  {
    degree: "Digital Marketing",
    school: "GoMyCode",
    period: "2022",
    details: "SEO, social media strategy, content marketing, analytics, brand positioning"
  }
];

const fashionDesignSkills = [
  { category: "Design & Concept", skills: ["Conceptualization", "Illustration", "Moodboarding", "Color Theory", "Trend Forecasting", "Collection Development", "Brand Identity"] },
  { category: "Technical Construction", skills: ["Pattern Making (Manual & Digital)", "Draping", "Grading", "Sample Development", "Technical Flats", "Spec Sheets", "Fit Analysis"] },
  { category: "Garment Expertise", skills: ["Womenswear", "Menswear", "Lingerie", "Couture", "Ready-to-Wear", "Costume Design", "Theatrical Costumes"] },
  { category: "Textiles & Materials", skills: ["Textile Art", "Fabric Sourcing", "Sustainable Materials", "Embellishment Techniques", "Hand Embroidery", "Beading", "Laser Cutting"] },
  { category: "CAD & Digital Design", skills: ["Lectra 2D", "Adobe Illustrator", "Photoshop", "Procreate", "Affinity Publisher", "Digital Flats", "Technical Drawing"] }
];

const jewelrySkills = [
  { category: "Metal Smithing", skills: ["Brass Work", "Silver Work", "Soldering", "Annealing", "Forging", "Texturing", "Polishing"] },
  { category: "Stone Setting", skills: ["Bezel Setting", "Prong Setting", "Flush Setting", "Stone Selection", "Gemstone Knowledge"] },
  { category: "Fabrication", skills: ["Wax Carving", "Lost Wax Casting", "Chain Making", "Findings", "Finishing Techniques"] }
];

const videoSkills = [
  "Adobe Premiere Pro", "After Effects", "DaVinci Resolve", "Color Grading", "Motion Graphics", "Video Editing", "Sound Design", "Lookbook Production", "Campaign Videos", "Behind the Scenes", "Fashion Film"
];

const backendSkills = ["Node.js", "TypeScript", "Express.js", "REST APIs", "Socket.IO", "Microservice Architecture", "Clean Architecture", "JWT Authentication"];
const databaseSkills = ["MongoDB", "PostgreSQL", "Mongoose", "Prisma", "Database Design", "Query Optimization"];
const devopsSkills = ["Docker", "Jenkins", "Grafana", "Prometheus", "Git/GitHub", "Bitbucket", "Swagger UI", "CI/CD Pipelines"];
const frontendSkills = ["React.js", "TypeScript", "Tailwind CSS", "Material UI", "Bootstrap", "Framer Motion", "Responsive Design", "State Management"];
const methodologies = ["Agile/Scrum", "Daily Standups", "Sprint Planning", "Retrospectives", "Jira", "User Stories", "Task Estimation"];

const additionalSkills = [
  "Photography", "Digital Marketing", "SEO", "Content Strategy", "Brand Development",
  "Critical Thinking", "Time Management", "Multitasking", "Team Leadership", 
  "Client Relations", "Project Management", "Supplier Negotiation", "Production Management"
];

const languages = [
  { name: "French", level: "Fluent (C1/C2)", flag: "🇫🇷" },
  { name: "English", level: "Fluent (C1/C2)", flag: "🇬🇧" },
  { name: "Tunisian Arabic", level: "Native", flag: "🇹🇳" },
  { name: "Standard Arabic", level: "Native", flag: "🇸🇦" },
  { name: "Korean", level: "Basic (B2)", flag: "🇰🇷" }
];

export function ExperiencePage() {
  return (
    <section className="py-18 lg:py-24 px-4 lg:px-14 w-full ">
      <div className="max-w-7xl mx-auto">
        {/* ===== EXPERIENCE ===== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-l1 border-b border-line pb-4">
            Experience
          </h2>
          
          <div className="space-y-12">
            {experiences.map((exp, index) => (
              <Link
                key={exp.id}
                href={`/experience/${exp.id}`}
                className="block group cursor-pointer"
              >
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="border-l-2 border-line pl-6 hover:border-l1 transition-colors"
                >
                  <div className="flex flex-wrap justify-between items-start mb-2">
                    <h3 className="text-xl font-bold group-hover:text-l1/80 transition-colors text-l1">
                      {exp.title}
                    </h3>
                    <span className="text-l3 text-sm font-mono">{exp.period}</span>
                  </div>
                  <p className="text-l2 mb-3">{exp.company}</p>
                  <p className="text-l3 group-hover:text-l2 transition-colors">
                    {exp.description}
                  </p>
                  <div className="mt-3 text-l3 text-xs group-hover:text-l2 transition-colors flex items-center gap-1">
                    READ MORE
                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ===== EDUCATION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-l1 border-b border-line pb-4">
            Education & Certifications
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {education.map((edu, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-b1/5 p-6 border border-line hover:border-l1/30 transition-colors rounded-lg"
              >
                <h3 className="font-bold text-lg mb-1 text-l1">{edu.degree}</h3>
                <p className="text-l2 text-sm mb-2">{edu.school}</p>
                <p className="text-l3 text-xs mb-3 font-mono">{edu.period}</p>
                {edu.details && (
                  <p className="text-l3 text-sm">{edu.details}</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ===== FASHION DESIGN SKILLS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-l1 border-b border-line pb-4">
            Fashion Design
          </h2>
          
          <div className="space-y-6">
            {fashionDesignSkills.map((category, idx) => (
              <div key={idx} className="bg-b1/5 p-6 border border-line rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-l1/80 border-l-2 border-line pl-4">
                  {category.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-b1/40 border border-line/50 text-sm hover:border-l1/30 transition-colors rounded-full text-l2">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ===== JEWELRY ===== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-l1 border-b border-line pb-4">
            Jewelry Design
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jewelrySkills.map((category, idx) => (
              <div key={idx} className="bg-b1/5 p-6 border border-line rounded-lg">
                <h3 className="text-lg font-bold mb-4 text-l1/80">{category.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-b1/40 border border-line/50 text-xs rounded-full text-l2">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ===== VIDEOGRAPHY ===== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-l1 border-b border-line pb-4">
            Videography & Motion Graphics
          </h2>
          
          <div className="bg-b1/5 p-6 border border-line rounded-lg">
            <div className="flex flex-wrap gap-2">
              {videoSkills.map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-b1/40 border border-line/50 text-sm hover:border-l1/30 transition-colors rounded-full text-l2">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ===== FULL STACK ===== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-l1 border-b border-line pb-4">
            Full Stack Development
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-b1/5 p-6 border border-line rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-l1/80">Backend</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {backendSkills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-b1/40 border border-line/50 text-sm rounded-full text-l2">{skill}</span>
                ))}
              </div>
              
              <h3 className="text-xl font-bold mb-4 text-l1/80">Databases</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {databaseSkills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-b1/40 border border-line/50 text-sm rounded-full text-l2">{skill}</span>
                ))}
              </div>
              
              <h3 className="text-xl font-bold mb-4 text-l1/80">DevOps & Tools</h3>
              <div className="flex flex-wrap gap-2">
                {devopsSkills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-b1/40 border border-line/50 text-sm rounded-full text-l2">{skill}</span>
                ))}
              </div>
            </div>
            
            <div className="bg-b1/5 p-6 border border-line rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-l1/80">Frontend</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {frontendSkills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-b1/40 border border-line/50 text-sm rounded-full text-l2">{skill}</span>
                ))}
              </div>
              
              <h3 className="text-xl font-bold mb-4 text-l1/80">Methodologies</h3>
              <div className="flex flex-wrap gap-2">
                {methodologies.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-b1/40 border border-line/50 text-sm rounded-full text-l2">{skill}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-6 border border-line/50 bg-b1/5 rounded-lg">
            <h3 className="text-lg font-bold mb-2 text-l1">Final Project: E-Commerce Platform for Voidstone Studio</h3>
            <p className="text-l3 text-sm">
              Developed a full microservice-based e-commerce platform for my fashion brand, combining my two passions. 
              Features include product management, secure checkout, real-time inventory, and customer authentication.
              Built with Node.js, TypeScript, React, MongoDB, and Docker.
            </p>
          </div>
        </motion.div>

        {/* ===== ADDITIONAL SKILLS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-l1 border-b border-line pb-4">
            Additional Competencies
          </h2>
          
          <div className="bg-b1/5 p-6 border border-line rounded-lg">
            <div className="flex flex-wrap gap-3">
              {additionalSkills.map((skill, i) => (
                <span key={i} className="px-4 py-2 border border-line/50 text-sm hover:border-l1/30 transition-colors rounded-full text-l2">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ===== LANGUAGES ===== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-l1 border-b border-line pb-4">
            Languages
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {languages.map((lang, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-b1/5 p-4 border border-line text-center hover:border-l1/30 transition-colors rounded-lg"
              >
                <div className="text-2xl mb-2">{lang.flag}</div>
                <h3 className="font-bold text-l1">{lang.name}</h3>
                <p className="text-l2 text-sm">{lang.level}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}