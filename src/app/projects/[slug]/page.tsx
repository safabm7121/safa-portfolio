// app/projects/[slug]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PROJECTS, type Project, type GalleryItem } from '@/lib/projects';
import { HOVER_BOX, cx } from '@/lib/cx';

export default function ProjectPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const foundProject = PROJECTS.find(p => p.slug === slug);
    if (foundProject) {
      setProject(foundProject);
      setLoading(false);
      window.scrollTo(0, 0);
    } else {
      router.push('/');
    }
  }, [slug, router]);

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
    if (!project) return;
    setLightboxIndex(index);
    setLightboxImage(project.gallery[index]);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const nextImage = () => {
    if (!project || lightboxIndex >= project.gallery.length - 1) return;
    const newIndex = lightboxIndex + 1;
    setLightboxIndex(newIndex);
    setLightboxImage(project.gallery[newIndex]);
  };

  const prevImage = () => {
    if (!project || lightboxIndex <= 0) return;
    const newIndex = lightboxIndex - 1;
    setLightboxIndex(newIndex);
    setLightboxImage(project.gallery[newIndex]);
  };

  const getFileType = (url: string): string => {
    if (!url) return 'unknown';
    const extension = url.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'].includes(extension)) {
      return 'image';
    }
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension)) {
      return 'video';
    }
    if (['glb', 'gltf', 'obj', 'fbx', 'usdz', 'stl', '3ds', 'dae'].includes(extension)) {
      return 'model3d';
    }
    return 'unknown';
  };

  const renderGalleryItem = (item: GalleryItem, index: number) => {
    const isVideo = item.type === 'video' || 
      item.url.match(/\.(mp4|webm|mov|avi)(\?|$)/i) ||
      item.url.includes('youtube.com') ||
      item.url.includes('vimeo.com') ||
      item.url.includes('drive.google.com');

    if (isVideo) {
      const isDirectVideo = item.url.match(/\.(mp4|webm|mov|avi)(\?|$)/i);
      
      return (
        <div key={index} className="space-y-3 md:space-y-4 my-6">
          <div className="relative z-0">
            {isDirectVideo ? (
              <video 
                src={item.url}
                controls
                className="w-full rounded-lg"
                poster={item.poster}
              />
            ) : (
              <iframe
                src={item.url}
                className="w-full aspect-video rounded-lg"
                allowFullScreen
                title={item.caption || 'Video'}
              />
            )}
          </div>
          {item.caption && (
            <p className="text-l3 text-xs md:text-sm text-center tracking-wide mt-3">
              {item.caption}
            </p>
          )}
        </div>
      );
    }

    if (item.type === 'model3d') {
      return (
        <div key={index} className="space-y-3 md:space-y-4 my-6">
          <div className="relative z-0 bg-b1/5 rounded-lg p-8 text-center border border-line">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-l3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-l2 text-sm mb-4">3D Model Available</p>
            <a 
              href={item.url}
              download
              className="inline-block px-6 py-2 border border-line hover:border-l1 hover:bg-b1/50 transition-all duration-300 text-sm"
            >
              Download 3D Model
            </a>
          </div>
          {item.caption && (
            <p className="text-l3 text-xs md:text-sm text-center tracking-wide">
              {item.caption}
            </p>
          )}
        </div>
      );
    }

    return (
      <div key={index} className="my-4">
        <img
          src={item.url}
          alt={item.caption}
          className="w-full h-auto rounded-lg border border-line cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => {
            const imageIndex = project?.gallery.findIndex(g => g.url === item.url) || 0;
            openLightbox(imageIndex);
          }}
        />
        {item.caption && (
          <p className="text-l3 text-xs text-center mt-2 tracking-wide">
            {item.caption}
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-b1 flex items-center justify-center">
        <div className="text-l2 animate-pulse text-2xl">LOADING...</div>
      </div>
    );
  }

  if (!project) return null;

  const isArtBook = project.slug === 'art-book';

  return (
    <article
      data-mdx-article="true"
      className="mx-auto px-6 py-18 lg:py-24 w-full max-w-[880px] text-l1"
    >
      <div className="space-y-4 [&_p]:text-sm [&_p]:text-l1 [&_p]:leading-relaxed lg:[&_p]:text-base">
        <header className="pt-[10vh]">
          <h1
            className="font-bold text-3xl! text-l1 lg:text-5xl! leading-tight tracking-tight"
            style={{ fontVariationSettings: '"wdth" 120' }}
          >
            {project.title}
          </h1>
          <p className="mt-1 tabular-nums text-l2! text-sm! lg:text-base! leading-relaxed">
            {project.year}
          </p>
          <div className="mt-2 border-line border-b" />
          <p className="pt-3 text-l2! text-sm! lg:text-base! leading-relaxed">
            {project.category}
          </p>
        </header>

        {/* Cover Image */}
        <div className="my-6">
          <img
            src={project.coverImage}
            alt={project.title}
            className="w-full h-auto rounded-lg border border-line cursor-pointer"
            onClick={() => openLightbox(0)}
          />
        </div>

        <div className="[&_p+p]:mt-3 [&_p]:mb-0 text-l2 [&_p]:text-l2! text-sm lg:text-base leading-relaxed">
          <p>{project.fullDescription}</p>

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-[rgba(var(--label-d),0.03)] p-4 lg:p-6 rounded-xl">
              <h3 className="font-semibold text-l1 text-base mb-3">Materials</h3>
              <p className="text-l2">{project.materials.join(' • ')}</p>
            </div>
            <div className="bg-[rgba(var(--label-d),0.03)] p-4 lg:p-6 rounded-xl">
              <h3 className="font-semibold text-l1 text-base mb-3">Role</h3>
              <p className="text-l2">{project.role}</p>
            </div>
          </div>

          {/* Gallery */}
          {project.gallery && project.gallery.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-l1 mt-8 mb-4 border-b border-line pb-2">
                Gallery
              </h2>
              
              {isArtBook ? (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {project.gallery.map((item, index) => (
                    <div
                      key={index}
                      className="break-inside-avoid mb-4 relative z-0 cursor-pointer"
                      onClick={() => {
                        const imageIndex = project.gallery.findIndex(g => g.url === item.url);
                        openLightbox(imageIndex);
                      }}
                    >
                      <img 
                        src={item.url}
                        alt={item.caption}
                        className="w-full h-auto object-cover hover:opacity-90 transition-opacity rounded-lg border border-line"
                      />
                      {item.caption && (
                        <p className="text-l3 text-xs text-center mt-2 tracking-wide">
                          {item.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {project.gallery.map((item, index) => renderGalleryItem(item, index))}
                </div>
              )}
            </>
          )}

          {/* Behind the Scenes */}
          {project.behindTheScenes && project.behindTheScenes.images && (
            <>
              <h2 className="text-xl font-semibold text-l1 mt-8 mb-4 border-b border-line pb-2">
                Behind the Scenes
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.behindTheScenes.images.map((image, index) => (
                  <div key={index} className="space-y-2">
                    <img
                      src={image.url}
                      alt={image.caption}
                      className="w-full h-auto rounded-lg border border-line"
                    />
                    {image.caption && (
                      <p className="text-l3 text-xs text-center tracking-wide">
                        {image.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Lightbox Modal */}
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
            
            {project.gallery.length > 1 && (
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
                  disabled={lightboxIndex === project.gallery.length - 1}
                >
                  ›
                </button>
              </>
            )}
            
            <img 
              src={lightboxImage.url}
              alt={lightboxImage.caption}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            {lightboxImage.caption && (
              <div className="absolute bottom-4 left-0 right-0 text-center text-l2 text-sm">
                {lightboxImage.caption}
              </div>
            )}
          </div>
        )}

        <footer
          data-mdx-footer="true"
          className="bg-[rgba(var(--label-d),0.03)] mt-16 p-4 lg:p-6 rounded-xl"
        >
          <div className="mb-5 font-sans font-semibold text-l1 text-base">
            Metadata
          </div>
          <dl className="gap-x-6 gap-y-6 grid grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <dt className="font-sans font-semibold text-l1 text-sm">Year</dt>
              <dd>
                <span className="font-mono tabular-nums text-l2 text-sm">
                  {project.year}
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="font-sans font-semibold text-l1 text-sm">Category</dt>
              <dd>
                <span className="font-mono tabular-nums text-l2 text-sm">
                  {project.category}
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="font-sans font-semibold text-l1 text-sm">Client</dt>
              <dd>
                <span className="font-mono tabular-nums text-l2 text-sm">
                  {project.client}
                </span>
              </dd>
            </div>
          </dl>
          <div className="my-6 border-line border-t border-dashed" />
          <div className="gap-x-6 gap-y-4 grid grid-cols-2 lg:grid-cols-3">
            <div className="hidden lg:block font-sans font-semibold text-l1 text-sm">
              Links
            </div>
            <div className="flex flex-col items-start gap-1 font-mono">
              <Link
                className={cx(
                  HOVER_BOX,
                  "inline-block -mx-1 px-1 py-0.5 text-l2 lg:hover:text-l1 text-sm transition-colors",
                )}
                href="/"
              >
                Home
              </Link>
              <Link
                className={cx(
                  HOVER_BOX,
                  "inline-block -mx-1 px-1 py-0.5 text-l2 lg:hover:text-l1 text-sm transition-colors",
                )}
                href="/experience"
              >
                Experience
              </Link>
            </div>
            <div className="flex flex-col items-start gap-1 font-mono">
              <a
                href="https://store.voidstonestudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cx(
                  HOVER_BOX,
                  "inline-block -mx-1 px-1 py-0.5 text-l2 lg:hover:text-l1 text-sm transition-colors",
                )}
              >
                Voidstone Studio
              </a>
              <a
                href="https://www.behance.net/safabenmiled"
                target="_blank"
                rel="noopener noreferrer"
                className={cx(
                  HOVER_BOX,
                  "inline-block -mx-1 px-1 py-0.5 text-l2 lg:hover:text-l1 text-sm transition-colors",
                )}
              >
                Behance
              </a>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}