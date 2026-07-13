// lib/projects.ts
export interface GalleryItem {
  type: 'image' | 'video' | 'model3d';
  url: string;
  caption?: string;
  poster?: string;
}

export interface BehindTheScenes {
  video?: {
    url: string;
    caption?: string;
    poster?: string;
  };
  images?: {
    url: string;
    caption?: string;
  }[];
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  fullDescription: string;
  coverImage: string;
  gallery: GalleryItem[];
  behindTheScenes?: BehindTheScenes;
  category: string;
  year: string;
  materials: string[];
  client: string;
  role: string;
}

export const PROJECTS: Project[] = [
  {
    "id": 1,
    "title": "FRACTURED DOLL",
    "slug": "2026-COLLECTION",
    "description": "The link between the human body and the doll is explored in this collection, which features exaggerated silhouettes, deconstructed elements, and a mix of hard and soft materials. The collection was inspired by themes of identity, transformation, and the uncanny.",
    "fullDescription": "the doll acts as a potent representation of a human. The power ascribed to the Doll can be seen as an example of how a physical image can be imbued with abstract meaning and Power, bluring the line between the object and the person it represents.",
    "coverImage": "https://i.postimg.cc/GmsWbxp8/Untitled-artwork.jpg",
    "gallery": [
      {
        "type": "image",
        "url": "https://i.postimg.cc/GmsWbxp8/Untitled-artwork.jpg",
        "caption": "COVER IMAGE - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/QxMsZ75F/Untitled-Artwork-1.jpg",
        "caption": "CONTEXT - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/hPGgRmxN/Untitled-Artwork-2.jpg",
        "caption": "STORYTELLING - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/0yMsbqVv/Untitled-Artwork-3.jpg",
        "caption": "MOODBOARD - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/dVbKCSfX/Untitled-Artwork-4.jpg",
        "caption": "Movement study - Fluid construction"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/W3jLWqTp/Untitled-Artwork-5.jpg",
        "caption": "PROTOTYPING - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/d1vPHZwC/Untitled-Artwork-6.jpg",
        "caption": "COLLAGES - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/0QfgL5yX/Untitled-Artwork-7.jpg",
        "caption": "COLLAGES - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/66MJcQS8/Untitled-Artwork-8.jpg",
        "caption": "COLLAGES P2 - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/cC9pLDYf/Untitled-Artwork-9.jpg",
        "caption": "FLAT PATTERN 1 - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/Wp5L84KN/Untitled-Artwork-10.jpg",
        "caption": "FLAT PATTERN 2 - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/zDxZ7fMS/Untitled-Artwork-11.jpg",
        "caption": "FLAT PATTERN 3 - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/Gh905Cw6/Untitled-Artwork-12.jpg",
        "caption": "FLAT PATTERN 4 - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/dVTbJj0y/Untitled-Artwork-13.jpg",
        "caption": "FLAT PATTERN 5 - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/FHJMhVKZ/Untitled-Artwork-14.jpg",
        "caption": "FLAT PATTERN 6 - Fractured Doll Collection 2026 "
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/MH6wTMLw/IMG-1380.jpg",
        "caption": "fabric manipulation - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/L59SXYWs/IMG-1383.jpg",
        "caption": "fabric manipulation - Fractured Doll Collection 2026"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/cCFS81qK/IMG-1386.jpg",
        "caption": "fabric manipulation - Fractured Doll Collection 2026"
      },
      {
        "type": "model3d",
        "url": "/projects/project-3/model.glb",
        "caption": "3D Model of the garment"
      }
    ],
    "behindTheScenes": {
      "images": [
        {
          "url": "https://i.postimg.cc/BQvsfFDy/IMG-4426.gif",
          "caption": "Behind the scenes - MODELING"
        },
        {
          "url": "https://i.postimg.cc/2ykY6btD/IMG-1323-(1).jpg",
          "caption": "Three headed doll - Concept development"
        },
        {
          "url": "https://i.postimg.cc/7hH46GWj/IMG-1333-(2).jpg",
          "caption": "Three headed doll - Concept development"
        }
      ]
    },
    "category": "experimental COLLECTION",
    "year": "2026",
    "materials": ["Italian Silk", "French Lace", "Crystal Embellishments"],
    "client": "voidstone studio",
    "role": "Lead Designer"
  },
  {
    "id": 2,
    "title": "Skyward journey",
    "slug": "esmod-final-collection",
    "description": "First Prize winning costume design for the National Drag Competition. A celebration of queer artistry and theatrical fashion.",
    "fullDescription": "This award-winning costume was created for the National Drag Competition, where it won First Prize. The design explores themes of transformation and identity through exaggerated silhouettes, hand-crafted details, and theatrical elements. Every piece was hand-stitched and embellished over a 3-month period, incorporating over 500 hours of labor. The costume features custom-made accessories, LED elements, and a transformative reveal mechanism.",
    "coverImage": "https://i.postimg.cc/vH2nGQVQ/IMG.jpg",
    "gallery": [
      {
        "type": "image",
        "url": "https://i.postimg.cc/HsvMTpyW/IMG1.jpg",
        "caption": "Performance shot - Winning look"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/CLr8wFqw/IMG2.jpg",
        "caption": "Detail - Hand-embellished elements"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/ZKsNJTdK/IMG3.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/SxXMsw66/IMG4.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/t4LVV2kP/IMG5.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/T3ZWWC0B/IMG6.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/kgkttfsz/IMG7.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/zfKHwK2P/IMG8.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/25hLdhX8/IMG9.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/50JYsyZN/IMG10.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/gJpXgjfH/IMG11.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/PJ3Cf4NR/IMG12.png",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/j5hWmKbX/IMG13.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/XJgZm3bz/IMG14.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/TwcyFGxx/IMG15.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/wMTtdPx7/IMG16.jpg",
        "caption": "Behind the scenes - Construction process"
      },
      {
        "type": "video",
        "url": "https://drive.google.com/file/d/1NqByYo9qGPZERV1Q22loGwWlxVZTUnBW/preview",
        "caption": "Skyward journey - Full collection"
      }
    ],
    "category": "MENSWEAR COLLECTION",
    "year": "2023",
    "materials": ["Custom Sequins", "Feathers", "LED Lights", "Stretch Mesh"],
    "client": "GRADUATION ESMOD PROJECT",
    "role": "FASHION DESIGNER"
  },
  {
    "id": 3,
    "title": "COLLECTION 2025",
    "slug": "2025-COLLECTION",
    "description": "A ready to wear collection that explores the intersection of fashion and technology, featuring innovative materials, theatrical silhouettes, and interactive elements. The collection was inspired by themes of visual kei aesthetics, romantic vibes, and the focus on high impact pieces that create a strong visual statement.",
    "fullDescription": "this collection was created for my participation in a fashion show in paris in 2025 with the pretty little talent agency. The collection explores the intersection of fashion and technology, featuring innovative materials, theatrical silhouettes, and interactive elements. The collection was inspired by themes of visual kei aesthetics, romantic vibes, and the focus on high impact pieces that create a strong visual statement.",
    "coverImage": "https://i.postimg.cc/XqQsVTwg/5.png",
    "gallery": [
      {
        "type": "image",
        "url": "https://i.postimg.cc/dtsfz98j/1.png",
        "caption": "page 1"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/5y1r9BDN/2.png",
        "caption": "page 2"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/q7hS1M2Z/3.png",
        "caption": "page 3"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/FKd8Tsjr/4.png",
        "caption": "page 4"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/XqQsVTwg/5.png",
        "caption": "page 5"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/jd3MBYqP/6.png",
        "caption": "page 6"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/L5NxHrzx/7.png",
        "caption": "page 7"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/XN8HcyTB/8.png",
        "caption": "page 8"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/PxHy1tyW/9.png",
        "caption": "page 9"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/V6FRR3ZG/10.png",
        "caption": "page 10"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/G2jQQZgg/11.png",
        "caption": "page 11"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/XqHgM9bP/12.png",
        "caption": "page 12"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/CL24mCJF/13.png",
        "caption": "page 13"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/05cnJ1wL/14.png",
        "caption": "page 14"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/HLgXh6Mn/15.png",
        "caption": "page 15"
      }
    ],
    "category": "womenswear COLLECTION",
    "year": "2025",
    "materials": ["silk", "lace", "recycled fabrics", "tartan"],
    "client": "voidstone studio",
    "role": "FASHION DESIGNER & brand owner"
  },
  {
    "id": 4,
    "title": "illustrations ",
    "slug": "art-book",
    "description": "A collection of illustrations exploring the intersection of fashion and art.",
    "fullDescription": "this is a collection of my art pieces and illustrations that helps me explore the intersection of fashion and art. The collection includes a variety of mediums, such as digital illustrations, hand-drawn sketches, and mixed media pieces. The themes explored in this collection include identity, transformation, and the relationship between the body and clothing.",
    "coverImage": "https://i.postimg.cc/T1GV5Cdd/1.jpg",
    "gallery": [
      {
        "type": "image",
        "url": "https://i.postimg.cc/T1GV5Cdd/1.jpg",
        "caption": "page 1"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/sg854Vjh/2.jpg",
        "caption": "page 2"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/YCVQzpr1/3.jpg",
        "caption": "page 3"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/Bny2BqS2/4.jpg",
        "caption": "page 4"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/P5c1QtXZ/5.jpg",
        "caption": "page 5"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/13TDr9mc/6.jpg",
        "caption": "page 6"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/L87j3H9v/7.jpg",
        "caption": "page 7"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/2SJn7zkX/8.jpg",
        "caption": "page 8"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/wBmLWSM5/9.jpg",
        "caption": "page 9"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/GpyGMZtJ/10.jpg",
        "caption": "page 10"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/GpyGMZtK/11.jpg",
        "caption": "page 11"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/63xRFYG8/12.jpg",
        "caption": "page 12"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/FRbcv3jJ/13.jpg",
        "caption": "page 13"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/QtZ5v0W9/14.jpg",
        "caption": "page 14"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/DZ3sRBb4/15.jpg",
        "caption": "page 15"
      },
      {
        "type": "image",
        "url": "https://i.postimg.cc/ZRP3mprj/16.jpg",
        "caption": "page 16"
      }
    ],
    "category": "illustrations COLLECTION",
    "year": "2023 - 2026",
    "materials": ["Proceate", "oil painting", "ADOBE", "clip studio"],
    "client": "voidstone studio",
    "role": "ARTIST & illustrator"
  }
];