import { create } from "zustand";
import { CONFIG, GameConfig } from "@/lib/constants";

export interface InputState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface CloudPuff {
  x: number;
  y: number;
  radius: number;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  color: string;
  layerIndex: number;
  width: number;
  puffs: CloudPuff[];
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  vy: number;
}

export type PlayerTeam = "red" | "blue";
export type { GameConfig } from "@/lib/constants";

interface GameState {
  width: number;
  height: number;
  input: InputState;
  currentPlayer: PlayerTeam;
  clouds: Cloud[];
  floatingTexts: FloatingText[];
  debugPanelOpen: boolean;
  config: GameConfig;

  // Actions
  setDimensions: (width: number, height: number) => void;
  setInput: (input: Partial<InputState>) => void;
  resetInput: () => void;
  switchPlayer: () => void;
  setCurrentPlayer: (player: PlayerTeam) => void;
  setClouds: (clouds: Cloud[]) => void;
  addFloatingText: (text: FloatingText) => void;
  updateFloatingTexts: () => void;
  toggleDebugPanel: () => void;
  updateConfig: (updates: Partial<GameConfig>) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  width: typeof window !== "undefined" ? window.innerWidth : 1920,
  height: typeof window !== "undefined" ? window.innerHeight : 1080,
  input: {
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  },
  currentPlayer: "red",
  clouds: [],
  floatingTexts: [],
  debugPanelOpen: false,
  config: CONFIG,

  setDimensions: (width, height) => set({ width, height }),

  setInput: (input) =>
    set((state) => ({
      input: { ...state.input, ...input },
    })),

  resetInput: () =>
    set({
      input: {
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      },
    }),

  switchPlayer: () =>
    set((state) => ({
      currentPlayer: state.currentPlayer === "red" ? "blue" : "red",
    })),

  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  setClouds: (clouds) => set({ clouds }),

  addFloatingText: (text) =>
    set((state) => ({
      floatingTexts: [...state.floatingTexts, text],
    })),

  updateFloatingTexts: () =>
    set((state) => ({
      floatingTexts: state.floatingTexts
        .map((ft) => ({
          ...ft,
          life: ft.life - 0.02,
          y: ft.y + ft.vy,
        }))
        .filter((ft) => ft.life > 0),
    })),

  toggleDebugPanel: () =>
    set((state) => ({
      debugPanelOpen: !state.debugPanelOpen,
    })),

  updateConfig: (updates) =>
    set((state) => ({
      config: { ...state.config, ...updates },
    })),

  resetGame: () =>
    set({
      currentPlayer: "red",
      floatingTexts: [],
      input: {
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      },
    }),
}));

// Helper type for store state
export type GameStoreState = ReturnType<typeof useGameStore.getState>;
