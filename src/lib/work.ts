// lib/work.ts
import { PROJECTS } from './projects';

export type WorkItem = {
  name: string;
  href: string;
  external?: boolean;
  year: string;
  imageUrl: string;
  hoverImageUrl?: string;
  gridClass: string;
  codingProject?: boolean;
  extLabel?: string;
  category?: string;
};

export const WORK: WorkItem[] = [
  {
    name: "FRACTURED DOLL",
    href: `/projects/${PROJECTS[0].slug}`,
    year: PROJECTS[0].year,
    imageUrl: PROJECTS[0].coverImage,
    // Use a different image from the gallery as hover
    hoverImageUrl: PROJECTS[0].gallery.find(g => g.url !== PROJECTS[0].coverImage)?.url || PROJECTS[0].coverImage,
    gridClass: "col-span-12 lg:col-span-8 lg:col-start-5",
    category: PROJECTS[0].category,
  },
  {
    name: "Skyward Journey",
    href: `/projects/${PROJECTS[1].slug}`,
    year: PROJECTS[1].year,
    imageUrl: PROJECTS[1].coverImage,
    hoverImageUrl: PROJECTS[1].gallery.find(g => g.url !== PROJECTS[1].coverImage)?.url || PROJECTS[1].coverImage,
    gridClass: "col-span-12 lg:col-start-1 lg:col-span-6 xl:col-span-5",
    category: PROJECTS[1].category,
  },
  {
    name: "COLLECTION 2025",
    href: `/projects/${PROJECTS[2].slug}`,
    year: PROJECTS[2].year,
    imageUrl: PROJECTS[2].coverImage,
    // Use the second image from gallery as hover (page 2)
    hoverImageUrl: "https://i.postimg.cc/5y1r9BDN/2.png",
    gridClass: "col-span-12 lg:col-span-6 xl:col-span-5 lg:col-start-7 xl:col-start-7",
    category: PROJECTS[2].category,
  },
  {
    name: "Illustrations",
    href: `/projects/${PROJECTS[3].slug}`,
    year: PROJECTS[3].year,
    imageUrl: PROJECTS[3].coverImage,
    hoverImageUrl: PROJECTS[3].gallery.find(g => g.url !== PROJECTS[3].coverImage)?.url || PROJECTS[3].coverImage,
    gridClass: "col-span-6 lg:col-start-5 lg:col-span-4 xl:col-start-6 xl:col-span-3",
    category: PROJECTS[3].category,
  },
];