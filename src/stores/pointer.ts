import { create } from "zustand";

type PointerState = {
  /** pixel coords */
  x: number;
  y: number;
  /** normalized device coords (-1..1), y up */
  nx: number;
  ny: number;
  set: (x: number, y: number) => void;
};

export const usePointerStore = create<PointerState>((set) => ({
  x: 0,
  y: 0,
  nx: 0,
  ny: 0,
  set: (x, y) =>
    set(() => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1;
      const h = typeof window !== "undefined" ? window.innerHeight : 1;
      return { x, y, nx: (x / w) * 2 - 1, ny: -((y / h) * 2 - 1) };
    }),
}));
