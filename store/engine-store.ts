import { create } from "zustand";
import Matter from "matter-js";

interface EngineStore {
  engine: Matter.Engine | null;
  ghostEngine: Matter.Engine | null;
  canvasRef: HTMLCanvasElement | null;
  setEngine: (engine: Matter.Engine | null) => void;
  setGhostEngine: (ghostEngine: Matter.Engine | null) => void;
  setCanvasRef: (canvas: HTMLCanvasElement | null) => void;
}

export const useEngineStore = create<EngineStore>((set) => ({
  engine: null,
  ghostEngine: null,
  canvasRef: null,
  setEngine: (engine) => set({ engine }),
  setGhostEngine: (ghostEngine) => set({ ghostEngine }),
  setCanvasRef: (canvasRef) => set({ canvasRef }),
}));
